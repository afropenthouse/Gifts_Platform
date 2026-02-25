const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const { initiateTransfer, resolveAccount, getBanks, createTransferRecipient } = require('../utils/paystack');

module.exports = () => {
  const router = express.Router();

  // Update profile
  router.put('/profile', auth(), async (req, res) => {
    const { name, profilePicture } = req.body;

    try {
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name ?? undefined,
          profilePicture: profilePicture ?? undefined,
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

  // Recalculate wallet based on actual contributions
  router.post('/recalculate-wallet', auth(), async (req, res) => {
    try {
      // Get all gifts for this user
      const gifts = await prisma.gift.findMany({
        where: { userId: req.user.id },
        select: { id: true }
      });

      const giftIds = gifts.map(g => g.id);

      // Sum all contributions for user's gifts
      const contributionsSum = await prisma.contribution.aggregate({
        where: { 
          giftId: { in: giftIds },
          status: 'completed'
        },
        _sum: { amount: true, commission: true }
      });

      // Sum all withdrawals for user
      const withdrawalsSum = await prisma.withdrawal.aggregate({
        where: { 
          userId: req.user.id,
          status: { in: ['completed', 'pending'] }
        },
        _sum: { amount: true }
      });

      // Sum referral rewards
      const referralSum = await prisma.referralTransaction.aggregate({
        where: { referrerId: req.user.id },
        _sum: { amount: true }
      });

      const totalIn = (parseFloat(contributionsSum._sum.amount) || 0) - (parseFloat(contributionsSum._sum.commission) || 0) + (parseFloat(referralSum._sum.amount) || 0);
      const totalOut = parseFloat(withdrawalsSum._sum.amount) || 0;
      const correctWalletBalance = totalIn - totalOut;
      
      const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

      // Update user's wallet
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
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
          withdrawals: withdrawalsSum._sum.amount
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
    const { amount, bank_code, account_number, sourceType } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount < 100) {
        return res.status(400).json({ msg: 'Minimum withdrawal amount is ₦100' });
      }

      // No fee on withdrawal
      const fee = 0;
      const totalToReceive = withdrawAmount;
      if (totalToReceive <= 0) {
        return res.status(400).json({ msg: 'Withdrawal amount too low after fee deduction.' });
      }

      // Use Number() for safe comparison with Decimal
      if (Number(user.wallet) < withdrawAmount) {
        return res.status(400).json({ msg: 'Insufficient balance' });
      }

      // Get bank name from code (assuming we have it)
      const banksRes = await getBanks();
      const bank = banksRes.data ? banksRes.data.find(b => b.code === bank_code) : null;
      const bankName = bank ? bank.name : bank_code;

      // Resolve account name
      const resolveRes = await resolveAccount({
        account_bank: bank_code,
        account_number,
      });
      const accountName = resolveRes.status && resolveRes.data ? resolveRes.data.account_name : null;

      // Create withdrawal record
      const withdrawal = await prisma.withdrawal.create({
        data: {
          userId: req.user.id,
          amount: withdrawAmount,
          bankCode: bank_code,
          bankName: bankName,
          accountNumber: account_number,
          accountName: accountName,
          status: 'pending',
          sourceType: sourceType || 'wallet',
        },
      });

      // Deduct from wallet with an extra safety check
      try {
        await prisma.user.update({
          where: { 
            id: req.user.id,
            wallet: { gte: withdrawAmount }
          },
          data: { wallet: { decrement: withdrawAmount } }
        });
      } catch (err) {
        // If the update fails (likely due to balance changing), return error
        return res.status(400).json({ msg: 'Insufficient balance or balance updated' });
      }

      // 1. Create transfer recipient
      const recipientRes = await createTransferRecipient({
        account_number,
        account_bank: bank_code,
        name: accountName || user.name || 'Recipient',
      });
      if (!recipientRes.status || !recipientRes.data || !recipientRes.data.recipient_code) {
        // Refund wallet if recipient creation fails
        await prisma.user.update({
          where: { id: req.user.id },
          data: { wallet: { increment: withdrawAmount } }
        });
        // Update withdrawal status to failed
        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: 'failed' },
        });
        return res.status(500).json({ msg: 'Failed to create transfer recipient', error: recipientRes.message || 'Unknown error' });
      }
      // 2. Initiate transfer using recipient_code
      const transferPayload = {
        amount: totalToReceive,
        recipient_code: recipientRes.data.recipient_code,
        narration: `Withdrawal from Wallet (Fee: ₦${fee.toFixed(2)})`,
      };
      const response = await initiateTransfer(transferPayload);

      // Update withdrawal with transfer details
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          reference: response.data ? response.data.reference : null,
          transferId: response.data ? String(response.data.id) : null,
          status: response.status ? 'completed' : 'failed',
        },
      });

      res.json({
        msg: 'Withdrawal initiated successfully',
        transfer: response,
        fee: fee,
        totalToReceive: totalToReceive
      });
    } catch (error) {
      console.error(error);
      // If transfer fails, refund the amount
      try {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { wallet: { increment: parseFloat(amount) } }
        });
        // Update withdrawal status to failed if it was created
        if (req.body.amount) {
          await prisma.withdrawal.updateMany({
            where: {
              userId: req.user.id,
              amount: parseFloat(amount),
              status: 'pending',
            },
            data: { status: 'failed' },
          });
        }
      } catch (refundError) {
        console.error('Refund failed:', refundError);
      }
      res.status(500).json({ msg: 'Withdrawal failed', error: error.message });
    }
  });

  // Get withdrawal history
  router.get('/withdrawals', auth(), async (req, res) => {
    try {
      const withdrawals = await prisma.withdrawal.findMany({
        where: { userId: req.user.id },
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

      if (response.status) {
        res.json({ banks: response.data || response });
      } else {
        res.status(400).json({ msg: 'Failed to fetch banks' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Error fetching banks' });
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
      res.status(500).json({ msg: 'Error resolving account' });
    }
  });

  return router;
};