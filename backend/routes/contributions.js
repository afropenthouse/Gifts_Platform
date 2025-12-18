const express = require('express');
const prisma = require('../prismaClient');
const { initializePayment, verifyTransaction } = require('../utils/flutterwave');

module.exports = () => {
  const router = express.Router();

  // Initialize payment
  router.post('/:link/initialize-payment', async (req, res) => {
    const { contributorName, contributorEmail, amount, message } = req.body;

    try {
      const gift = await prisma.gift.findUnique({ 
        where: { shareLink: req.params.link },
        include: { user: true }
      });
      
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      const payload = {
        tx_ref: `gift-${gift.id}-${Date.now()}`,
        amount: parseFloat(amount),
        currency: 'NGN',
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gift/${req.params.link}`,
        customer: {
          email: contributorEmail,
          name: contributorName,
        },
        customizations: {
          title: `Contribution to ${gift.user.name}'s ${gift.type}`,
          description: gift.title || gift.type,
        },
        meta: {
          giftId: gift.id,
          giftLink: req.params.link,
          contributorName,
          contributorEmail,
          message: message || '',
        },
      };

      const response = await initializePayment(payload);

      if (response?.status !== 'success') {
        return res.status(400).json({
          msg: 'Flutterwave initialization failed',
          error: response?.message || 'Unknown error',
        });
      }

      res.json({ status: response.status, data: response.data });
    } catch (err) {
      console.error('Initialize payment error:', err?.message || err);
        const fwError = err?.response?.data || err?.data || err?.message || err;
        console.error('Initialize payment error details:', fwError);
        const payload = {
          msg: 'Failed to initialize payment',
          error: fwError,
        };
        res.status(500).json(payload);
    }
  });

  // Verify payment and create contribution
  router.post('/:link/verify-payment', async (req, res) => {
    const { transactionId } = req.body;

    try {
      const response = await verifyTransaction(transactionId);

      if (response.status !== 'success' || response.data.status !== 'successful') {
        return res.status(400).json({ msg: 'Payment verification failed' });
      }

      const { giftId, giftLink, contributorName, contributorEmail, message: contributorMessage } = response.data.meta || {};
      const amount = response.data.amount;

      // Get gift to find userId
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // Create contribution record
      const contribution = await prisma.contribution.create({
        data: {
          giftId,
          contributorName,
          contributorEmail,
          amount,
          message: contributorMessage || '',
          transactionId: response.data.id,
          status: 'completed',
        },
      });

      // Update user's wallet
      await prisma.user.update({
        where: { id: gift.userId },
        data: { wallet: { increment: amount } },
      });

      res.json({ msg: 'Payment verified and contribution recorded', contribution });
    } catch (err) {
      console.error('Verify payment error:', err?.message || err);
      res.status(500).json({ msg: 'Payment verification failed', error: err?.message || 'Server error' });
    }
  });

  // Contribute to gift (without payment - optional)
  router.post('/:link', async (req, res) => {
    const { contributorName, contributorEmail, amount, message } = req.body;

    try {
      const gift = await prisma.gift.findUnique({ where: { shareLink: req.params.link } });
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      await prisma.contribution.create({
        data: {
          giftId: gift.id,
          contributorName,
          contributorEmail,
          amount,
          message,
        },
      });

      // Update user's wallet atomically
      await prisma.user.update({
        where: { id: gift.userId },
        data: { wallet: { increment: amount } },
      });

      res.json({ msg: 'Contribution successful' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get contributions for gift
  router.get('/:link', async (req, res) => {
    try {
      const gift = await prisma.gift.findUnique({ where: { shareLink: req.params.link } });
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      const contributions = await prisma.contribution.findMany({ where: { giftId: gift.id } });
      res.json(contributions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};