const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const prisma = require('../prismaClient');
const { initiateTransfer, resolveAccount, getBanks, createTransferRecipient, verifyBVNMatch } = require('../utils/paystack');
const { sendWithdrawalOtpEmail } = require('../utils/emailService');

const OTP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const OTP_RATE_LIMIT_MAX = 3;
const WITHDRAWAL_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const WITHDRAWAL_RATE_LIMIT_MAX = 2;

const otpRateLimitStore = new Map();
const withdrawalRateLimitStore = new Map();

function rateLimitKey(req, suffix) {
  return `${req.user?.id || req.ip}:${suffix}`;
}

function checkRateLimit(store, key, windowMs, max) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: max - entry.count };
}

module.exports = () => {
  const router = express.Router();

  // Send withdrawal OTP
  router.post('/send-otp', auth(), async (req, res) => {
    try {
      const rateLimitKeyVal = rateLimitKey(req, 'otp');
      const rateCheck = checkRateLimit(otpRateLimitStore, rateLimitKeyVal, OTP_RATE_LIMIT_WINDOW_MS, OTP_RATE_LIMIT_MAX);
      if (!rateCheck.allowed) {
        return res.status(429).json({ msg: `Too many OTP requests. Please try again in ${rateCheck.retryAfter} seconds.` });
      }

      const { amount, bvn, bank_code, account_number } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount < 100) {
        return res.status(400).json({ msg: 'Minimum withdrawal amount is ₦100' });
      }

      if (withdrawAmount > Number(user.wallet)) {
        return res.status(400).json({ msg: 'Insufficient wallet balance for this withdrawal' });
      }

      if (withdrawAmount >= 1000000) {
        if (!bvn) {
          return res.status(400).json({ msg: 'BVN is required for withdrawals of ₦1,000,000 and above' });
        }
        if (bvn.length !== 11 || !/^\d+$/.test(bvn)) {
          return res.status(400).json({ msg: 'Invalid BVN. Must be 11 digits.' });
        }

        try {
          console.log(`🛡️ [SECURITY-OTP] Verifying BVN match for ${user.email} (Amount: ₦${withdrawAmount})`);
          const matchRes = await verifyBVNMatch({
            bvn,
            account_number,
            bank_code
          });

          const matchData = matchRes?.data || {};
          const isBlacklisted = Boolean(matchData.is_blacklisted);
          const hasMatch = Boolean(matchData.account_number) || Boolean(matchData.account_name);

          if (!matchRes?.status || isBlacklisted || !hasMatch) {
            console.log(`❌ [SECURITY-OTP] BVN check failed for ${user.email}: blacklisted=${isBlacklisted}, hasMatch=${hasMatch}`);
            return res.status(400).json({ msg: 'Identity verification failed. BVN does not match the provided bank account or is blacklisted.' });
          }

          console.log(`✅ [SECURITY-OTP] BVN match verified for ${user.email}`);
        } catch (error) {
          console.error('❌ [SECURITY-OTP] BVN verification error:', error?.data?.message || error.message);
          const errorMessage = error?.data?.message || 'BVN verification failed';
          return res.status(400).json({
            msg: `Security Check Failed: ${errorMessage}. Please ensure your BVN matches your bank account.`
          });
        }
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      const payloadHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ amount: withdrawAmount, bank_code, account_number, bvn: bvn || '' }))
        .digest('hex');

      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          verificationToken: otp,
          verificationTokenExpires: expires,
        },
      });

      await prisma.withdrawal.updateMany({
        where: { userId: req.user.id, status: 'pending' },
        data: { status: 'expired', reversed: true, reversalReason: 'Superseded by new OTP request' },
      });

      await prisma.withdrawal.create({
        data: {
          userId: req.user.id,
          amount: withdrawAmount,
          currency: 'NGN',
          bankCode: bank_code,
          accountNumber: account_number,
          bvn: bvn || undefined,
          status: 'pending',
          sourceType: 'wallet',
          otpHash: payloadHash,
          otpExpires: expires,
          otpAttempts: 0,
          lastOtpSentAt: new Date(),
        },
      });

      await sendWithdrawalOtpEmail({
        recipientEmail: user.email,
        recipientName: user.name,
        otp,
      });

      res.json({ msg: 'OTP sent to your email' });
    } catch (err) {
      console.error('Error sending withdrawal OTP:', err);
      res.status(500).json({ msg: 'Failed to send OTP' });
    }
  });

  // Update profile
  router.put('/profile', auth(), async (req, res) => {
    const { name, profilePicture, phoneNumber } = req.body;

    try {
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name ?? undefined,
          profilePicture: profilePicture ?? undefined,
          phoneNumber: phoneNumber ?? undefined,
        },
      });

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get profile
  router.get('/profile', auth(), async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json(user);
  });

  // Recalculate wallet based on actual contributions (admin-only)
  router.post('/recalculate-wallet', auth(), adminAuth, async (req, res) => {
    try {
      const targetUserId = req.body.userId || req.user.id;
      const user = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const gifts = await prisma.gift.findMany({
        where: { userId: targetUserId },
        select: { id: true }
      });

      const giftIds = gifts.map(g => g.id);

      const contributionsSum = await prisma.contribution.aggregate({
        where: {
          giftId: { in: giftIds },
          status: 'completed'
        },
        _sum: { amount: true, commission: true }
      });

      const withdrawalsSum = await prisma.withdrawal.aggregate({
        where: {
          userId: targetUserId,
          status: { in: ['completed', 'pending'] }
        },
        _sum: { amount: true }
      });

      const vendorFundingSum = await prisma.vendorPaymentFunding.aggregate({
        where: {
          userId: targetUserId,
          method: 'wallet',
          status: 'funded',
        },
        _sum: { amount: true }
      });

      const referralSum = await prisma.referralTransaction.aggregate({
        where: { referrerId: targetUserId },
        _sum: { amount: true }
      });

      const totalIn = (parseFloat(contributionsSum._sum.amount) || 0) - (parseFloat(contributionsSum._sum.commission) || 0) + (parseFloat(referralSum._sum.amount) || 0);
      const totalOut = (parseFloat(withdrawalsSum._sum.amount) || 0) + (parseFloat(vendorFundingSum._sum.amount) || 0);
      const correctWalletBalance = totalIn - totalOut;

      const currentUser = await prisma.user.findUnique({ where: { id: targetUserId } });

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { wallet: correctWalletBalance }
      });

      res.json({
        msg: 'Wallet recalculated',
        previousWallet: parseFloat(currentUser.wallet),
        newWallet: correctWalletBalance,
        details: {
          totalIn,
          totalOut,
          contributions: contributionsSum._sum.amount,
          commissions: contributionsSum._sum.commission,
          referrals: referralSum._sum.amount,
          withdrawals: withdrawalsSum._sum.amount,
          vendorFundings: vendorFundingSum._sum.amount
        },
        user: updatedUser
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Withdraw funds
  router.post('/withdraw', auth(), async (req, res) => {
    const { amount, bank_code, account_number, sourceType, otp, bvn } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount < 100) {
        return res.status(400).json({ msg: 'Minimum withdrawal amount is ₦100' });
      }

      if (withdrawAmount > Number(user.wallet)) {
        return res.status(400).json({ msg: 'Insufficient balance' });
      }

      const rateLimitKeyVal = rateLimitKey(req, 'withdraw');
      const rateCheck = checkRateLimit(withdrawalRateLimitStore, rateLimitKeyVal, WITHDRAWAL_RATE_LIMIT_WINDOW_MS, WITHDRAWAL_RATE_LIMIT_MAX);
      if (!rateCheck.allowed) {
        return res.status(429).json({ msg: `Too many withdrawal requests. Please try again in ${rateCheck.retryAfter} seconds.` });
      }

      // 1M Naira security check
      if (withdrawAmount >= 1000000) {
        if (!bvn) {
          return res.status(400).json({ msg: 'BVN is required for withdrawals of ₦1,000,000 and above' });
        }
        if (bvn.length !== 11 || !/^\d+$/.test(bvn)) {
          return res.status(400).json({ msg: 'Invalid BVN. Must be 11 digits.' });
        }

        try {
          console.log(`🛡️ [SECURITY] Verifying BVN match for ${user.email} (Amount: ₦${withdrawAmount})`);
          const matchRes = await verifyBVNMatch({
            bvn,
            account_number,
            bank_code
          });

          const matchData = matchRes?.data || {};
          const isBlacklisted = Boolean(matchData.is_blacklisted);
          const hasMatch = Boolean(matchData.account_number) || Boolean(matchData.account_name);

          if (!matchRes?.status || isBlacklisted || !hasMatch) {
            console.log(`❌ [SECURITY] BVN check failed for ${user.email}: blacklisted=${isBlacklisted}, hasMatch=${hasMatch}`);
            return res.status(400).json({ msg: 'Identity verification failed. BVN does not match the provided bank account or is blacklisted.' });
          }

          console.log(`✅ [SECURITY] BVN match verified for ${user.email}`);
        } catch (error) {
          console.error('❌ [SECURITY] BVN verification error:', error?.data?.message || error.message);
          const errorMessage = error?.data?.message || 'BVN verification failed';
          return res.status(400).json({
            msg: `Security Check Failed: ${errorMessage}. Please ensure your BVN matches your bank account.`
          });
        }
      }

      if (!otp) {
        return res.status(400).json({ msg: 'OTP is required' });
      }

      if (user.verificationToken !== otp || !user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
        return res.status(400).json({ msg: 'Invalid or expired OTP' });
      }

      const pendingWithdrawal = await prisma.withdrawal.findFirst({
        where: { userId: req.user.id, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });

      if (!pendingWithdrawal) {
        return res.status(400).json({ msg: 'No pending withdrawal request found. Please request a new OTP.' });
      }

      const expectedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          amount: withdrawAmount,
          bank_code,
          account_number,
          bvn: bvn || '',
        }))
        .digest('hex');

      if (pendingWithdrawal.otpHash !== expectedHash) {
        return res.status(400).json({ msg: 'Withdrawal details do not match the OTP request. Please start over.' });
      }

      if (pendingWithdrawal.otpExpires && pendingWithdrawal.otpExpires < new Date()) {
        return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
      }

      const otpAttempts = (pendingWithdrawal.otpAttempts || 0) + 1;
      if (otpAttempts > 5) {
        await prisma.withdrawal.update({
          where: { id: pendingWithdrawal.id },
          data: { status: 'expired', reversed: true, reversalReason: 'Too many OTP attempts' },
        });
        await prisma.user.update({
          where: { id: req.user.id },
          data: { verificationToken: null, verificationTokenExpires: null },
        });
        return res.status(429).json({ msg: 'Too many failed attempts. Please request a new OTP.' });
      }

      await prisma.withdrawal.update({
        where: { id: pendingWithdrawal.id },
        data: { otpAttempts },
      });

      if (pendingWithdrawal.otpHash !== expectedHash || pendingWithdrawal.otpExpires < new Date()) {
        return res.status(400).json({ msg: 'Invalid or expired OTP context' });
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          verificationToken: null,
          verificationTokenExpires: null,
        },
      });

      const fee = 0;
      const totalToReceive = withdrawAmount;

      const banksRes = await getBanks();
      const bank = banksRes.data ? banksRes.data.find(b => b.code === bank_code) : null;
      const bankName = bank ? bank.name : bank_code;

      const resolveRes = await resolveAccount({
        account_bank: bank_code,
        account_number,
      });
      const accountName = resolveRes.status && resolveRes.data ? resolveRes.data.account_name : null;

      let updatedUser;
      try {
        const txnRes = await prisma.$transaction([
          prisma.user.update({
            where: { id: req.user.id },
            data: { wallet: { decrement: withdrawAmount } },
          }),
          prisma.withdrawal.update({
            where: { id: pendingWithdrawal.id },
            data: { status: 'processing' },
          }),
        ]);
        updatedUser = txnRes[0];
      } catch (err) {
        console.error('Atomic wallet deduction + processing update failed:', err.message);
        return res.status(400).json({ msg: 'Insufficient balance or failed to lock withdrawal. No funds were deducted.' });
      }

      const recipientRes = await createTransferRecipient({
        account_number,
        account_bank: bank_code,
        name: accountName || user.name || 'Recipient',
      });

      if (!recipientRes.status || !recipientRes.data || !recipientRes.data.recipient_code) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: req.user.id },
            data: { wallet: { increment: withdrawAmount } },
          }),
          prisma.withdrawal.update({
            where: { id: pendingWithdrawal.id },
            data: { status: 'failed', reversalReason: recipientRes.message || 'Failed to create transfer recipient' },
          }),
        ]);
        return res.status(500).json({ msg: 'Failed to create transfer recipient', error: recipientRes.message || 'Unknown error' });
      }

      const transferPayload = {
        amount: totalToReceive,
        recipient_code: recipientRes.data.recipient_code,
        narration: `Withdrawal from Wallet`,
      };

      let response;
      try {
        response = await initiateTransfer(transferPayload);
      } catch (transferError) {
        console.error('Paystack transfer failed:', transferError);

        await prisma.$transaction([
          prisma.user.update({
            where: { id: req.user.id },
            data: { wallet: { increment: withdrawAmount } },
          }),
          prisma.withdrawal.update({
            where: { id: pendingWithdrawal.id },
            data: { status: 'failed', reversalReason: transferError.data?.message || transferError.message || 'Transfer failed' },
          }),
        ]);

        const errorMsg = transferError.data?.message || transferError.message || 'Transfer failed';
        if (errorMsg.toLowerCase().includes('balance')) {
          return res.status(400).json({
            msg: 'Withdrawal currently unavailable. Please contact support.',
            error: 'Insufficient Paystack balance'
          });
        }

        return res.status(500).json({ msg: 'Withdrawal failed', error: errorMsg });
      }

      if (!response?.status) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: req.user.id },
            data: { wallet: { increment: withdrawAmount } },
          }),
          prisma.withdrawal.update({
            where: { id: pendingWithdrawal.id },
            data: { status: 'failed', reversalReason: response?.message || 'Transfer was not initiated' },
          }),
        ]);
        return res.status(500).json({
          msg: 'Withdrawal failed',
          error: response?.message || 'Transfer was not initiated'
        });
      }

      await prisma.withdrawal.update({
        where: { id: pendingWithdrawal.id },
        data: {
          status: 'completed',
          reference: response.data ? response.data.reference : null,
          transferId: response.data ? String(response.data.id) : null,
          fee,
          amountReceived: totalToReceive,
          bankName,
          accountName: accountName || pendingWithdrawal.accountName,
        },
      });

      res.json({
        msg: 'Withdrawal initiated successfully',
        transfer: response,
        fee,
        totalToReceive,
        withdrawalId: pendingWithdrawal.id,
      });
    } catch (error) {
      console.error('Global withdrawal error:', error);
      res.status(500).json({ msg: 'An unexpected error occurred', error: error.message });
    }
  });

  // Get withdrawal history
  router.get('/withdrawals', auth(), async (req, res) => {
    try {
      const withdrawals = await prisma.withdrawal.findMany({
        where: {
          userId: req.user.id,
          status: { not: 'failed' }
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(withdrawals);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get banks list
  router.get('/banks', auth(), async (req, res) => {
    try {
      const response = await getBanks();

      if (response.status && Array.isArray(response.data)) {
        res.json({ banks: response.data });
      } else {
        // Fallback to empty array if Paystack fails
        res.json({ banks: [] });
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      // Fallback to empty array if Paystack fails
      res.json({ banks: [] });
    }
  });

  // Resolve account name
  router.post('/resolve-account', auth(), async (req, res) => {
    const { bank_code, account_number } = req.body;

    try {
      const response = await resolveAccount({
        account_bank: bank_code,
        account_number,
      });

      console.log('Resolve response:', response);

      if (response.status) {
        const accountName = response.data ? response.data.account_name : response.account_name;
        res.json({ account_name: accountName });
      } else {
        res.status(400).json({ msg: 'Account not found or invalid details' });
      }
    } catch (error) {
      console.error(error);
      res.status(error.data ? 400 : 500).json({ 
        msg: error.message || 'Error resolving account',
        details: error.data || null
      });
    }
  });

  return router;
};
