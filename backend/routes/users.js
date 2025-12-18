const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const { initiateTransfer, resolveAccount } = require('../utils/flutterwave');

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

  // Withdraw funds
  router.post('/withdraw', auth(), async (req, res) => {
    const { amount, bank_code, account_number } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      if (user.wallet < parseFloat(amount)) {
        return res.status(400).json({ msg: 'Insufficient balance' });
      }

      // Deduct from wallet
      await prisma.user.update({
        where: { id: req.user.id },
        data: { wallet: { decrement: parseFloat(amount) } }
      });

      // Initiate transfer
      const transferPayload = {
        account_bank: bank_code,
        account_number,
        amount: parseFloat(amount),
        narration: 'Withdrawal from Wedding Gifts',
        currency: 'NGN',
        reference: `WD-${Date.now()}-${req.user.id}`,
        callback_url: process.env.FLW_CALLBACK_URL || '',
        debit_currency: 'NGN'
      };

      const response = await initiateTransfer(transferPayload);

      res.json({ msg: 'Withdrawal initiated successfully', transfer: response });
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

  // Resolve account name
  router.post('/resolve-account', auth(), async (req, res) => {
    const { bank_code, account_number } = req.body;

    try {
      const response = await resolveAccount({
        account_bank: bank_code,
        account_number,
      });

      console.log('Resolve response:', response);

      if (response.status === 'success' || response.status === 'successful') {
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