const express = require('express');
const prisma = require('../prismaClient');
const { initializePayment, verifyTransaction, verifyWebhookSignature } = require('../utils/flutterwave');

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
      
      // Log the payload for debugging
      console.error('Payment payload:', {
        tx_ref: `gift-${req.params.link}-${Date.now()}`,
        amount: parseFloat(amount),
        currency: 'NGN',
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gift/${req.params.link}`,
      });
      
      const errorPayload = {
        msg: 'Failed to initialize payment',
        error: typeof fwError === 'object' ? JSON.stringify(fwError) : String(fwError),
      };
      res.status(500).json(errorPayload);
    }
  });

  // Verify payment and create contribution
  router.post('/:link/verify-payment', async (req, res) => {
    const { transactionId, txRef, status } = req.body;

    try {
      console.log('Verifying payment:', { transactionId, txRef, status });
      
      // Try to verify with transactionId first, then with txRef
      let response;
      try {
        response = await verifyTransaction(transactionId);
      } catch (error) {
        // If verification fails and we have txRef, try using that
        if (txRef && txRef !== transactionId) {
          console.log('First verification failed, trying with txRef:', txRef);
          response = await verifyTransaction(txRef);
        } else {
          throw error;
        }
      }

      console.log('Verification response:', { 
        status: response?.status, 
        dataStatus: response?.data?.status,
        meta: response?.data?.meta 
      });

      if (response.status !== 'success' || response.data.status !== 'successful') {
        return res.status(400).json({ 
          msg: 'Payment verification failed',
          details: `Status: ${response?.status}, Data Status: ${response?.data?.status}` 
        });
      }

      const { giftId, giftLink, contributorName, contributorEmail, message: contributorMessage } = response.data.meta || {};
      const amount = response.data.amount;

      if (!giftId) {
        console.error('No giftId in transaction meta:', response.data.meta);
        return res.status(400).json({ msg: 'Invalid transaction data - missing gift ID' });
      }

      // Get gift to find userId
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // Check if contribution already exists
      const existingContribution = await prisma.contribution.findFirst({
        where: { 
          OR: [
            { transactionId: response.data.id.toString() },
            { transactionId: response.data.flw_ref },
            { transactionId: response.data.tx_ref }
          ]
        }
      });

      if (existingContribution) {
        console.log('Contribution already exists:', existingContribution.id);
        return res.json({ 
          msg: 'Payment already processed', 
          contribution: existingContribution 
        });
      }

      // Create contribution record
      const contribution = await prisma.contribution.create({
        data: {
          giftId,
          contributorName: contributorName || 'Anonymous',
          contributorEmail: contributorEmail || '',
          amount,
          message: contributorMessage || '',
          transactionId: response.data.id?.toString() || response.data.flw_ref || response.data.tx_ref,
          status: 'completed',
        },
      });

      // Update user's wallet
      await prisma.user.update({
        where: { id: gift.userId },
        data: { wallet: { increment: amount } },
      });

      console.log('Contribution created successfully:', contribution.id);
      res.json({ msg: 'Payment verified and contribution recorded', contribution });
    } catch (err) {
      console.error('Verify payment error:', err?.message || err);
      console.error('Full error:', err);
      res.status(500).json({ 
        msg: 'Payment verification failed', 
        error: err?.message || 'Server error' 
      });
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

  // Webhook for Flutterwave
  router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const secret = process.env.FLW_WEBHOOK_SECRET || process.env.FLW_SECRET_KEY;
      const signature = req.headers['verif-hash'];

      if (!secret) {
        console.error('FLW_WEBHOOK_SECRET or FLW_SECRET_KEY not set');
        return res.status(500).send('Server error');
      }

      const payload = req.body.toString();
      if (!verifyWebhookSignature(payload, signature, secret)) {
        console.error('Invalid webhook signature');
        return res.status(401).send('Unauthorized');
      }

      const event = JSON.parse(payload);
      console.log('Webhook received:', event.event);

      if (event.event === 'charge.completed') {
        const { id: transactionId, tx_ref, amount, currency, status } = event.data;

        if (status !== 'successful') {
          console.log('Payment not successful:', status);
          return res.status(200).send('OK');
        }

        // Verify transaction
        const response = await verifyTransaction(transactionId);
        if (response.status !== 'success' || response.data.status !== 'successful') {
          console.error('Transaction verification failed');
          return res.status(200).send('OK');
        }

        const { giftId, contributorName, contributorEmail, message: contributorMessage } = response.data.meta || {};

        if (!giftId) {
          console.error('No giftId in webhook meta');
          return res.status(200).send('OK');
        }

        // Check if contribution already exists
        const existingContribution = await prisma.contribution.findFirst({
          where: {
            OR: [
              { transactionId: transactionId.toString() },
              { transactionId: response.data.flw_ref },
              { transactionId: response.data.tx_ref }
            ]
          }
        });

        if (existingContribution) {
          console.log('Contribution already exists');
          return res.status(200).send('OK');
        }

        // Get gift
        const gift = await prisma.gift.findUnique({ where: { id: giftId } });
        if (!gift) {
          console.error('Gift not found');
          return res.status(200).send('OK');
        }

        // Create contribution
        const contribution = await prisma.contribution.create({
          data: {
            giftId,
            contributorName: contributorName || 'Anonymous',
            contributorEmail: contributorEmail || '',
            amount,
            message: contributorMessage || '',
            transactionId: transactionId.toString(),
            status: 'completed',
          },
        });

        // Update user's wallet
        await prisma.user.update({
          where: { id: gift.userId },
          data: { wallet: { increment: amount } },
        });

        console.log('Webhook processed successfully:', contribution.id);
      }

      res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook error:', err?.message || err);
      res.status(500).send('Server error');
    }
  });

  return router;
};