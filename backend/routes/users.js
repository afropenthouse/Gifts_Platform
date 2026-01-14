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
      const result = await prisma.contribution.aggregate({
        where: { giftId: { in: giftIds } },
        _sum: { amount: true }
      });

      const correctWalletBalance = parseFloat(result._sum.amount) || 0;
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
        user: updatedUser
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Withdraw funds
  router.post('/withdraw', auth(), async (req, res) => {
    const { amount, bank_code, account_number } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount < 100) {
        return res.status(400).json({ msg: 'Minimum withdrawal amount is ₦100' });
      }

      // Calculate 5% fee
      const fee = Math.ceil(withdrawAmount * 0.05 * 100) / 100; // round up to 2 decimals
      const totalToReceive = withdrawAmount - fee;
      if (totalToReceive <= 0) {
        return res.status(400).json({ msg: 'Withdrawal amount too low after fee deduction.' });
      }

      if (user.wallet < withdrawAmount) {
        return res.status(400).json({ msg: 'Insufficient balance' });
      }

      // Deduct from wallet
      await prisma.user.update({
        where: { id: req.user.id },
        data: { wallet: { decrement: withdrawAmount } }
      });

      // 1. Create transfer recipient
      const recipientRes = await createTransferRecipient({
        account_number,
        account_bank: bank_code,
        name: user.name || 'Recipient',
      });
      if (!recipientRes.status || !recipientRes.data || !recipientRes.data.recipient_code) {
        // Refund wallet if recipient creation fails
        await prisma.user.update({
          where: { id: req.user.id },
          data: { wallet: { increment: withdrawAmount } }
        });
        return res.status(500).json({ msg: 'Failed to create transfer recipient', error: recipientRes.message || 'Unknown error' });
      }
      // 2. Initiate transfer using recipient_code
      const transferPayload = {
        amount: totalToReceive,
        recipient_code: recipientRes.data.recipient_code,
        narration: `Withdrawal from Wedding Gifts (Fee: ₦${fee.toFixed(2)})`,
      };
      const response = await initiateTransfer(transferPayload);

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
      } catch (refundError) {
        console.error('Refund failed:', refundError);
      }
      res.status(500).json({ msg: 'Withdrawal failed', error: error.message });
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