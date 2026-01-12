const express = require('express');
const prisma = require('../prismaClient');
const { initializePayment, verifyTransaction, verifyWebhookSignature } = require('../utils/paystack');
const nodemailer = require('nodemailer');

// Email configuration (aligned with guests route: supports EMAIL_* fallbacks)
const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '465', 10);
const smtpSecure = process.env.EMAIL_SECURE
  ? process.env.EMAIL_SECURE === 'true'
  : process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : true;
const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser || 'teambethere@gmail.com';
const emailEnabled = Boolean(smtpUser && smtpPass);

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

const formatEventHeading = (gift) => {
  if (gift?.type === 'wedding') {
    return gift.title || 'Wedding Gift';
  }
  return gift?.title || gift?.type || 'Gift';
};

const formatEventDate = (date) => {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return null;
  }
};

module.exports = () => {
  const router = express.Router();

  // Send thank you email to gift contributor
  const sendContributorThankYouEmail = async ({ recipientEmail, contributorName, amount, gift }) => {
    if (!emailEnabled || !transporter) {
      console.warn('Contributor thank you email skipped: SMTP configuration is missing');
      return { delivered: false, skipped: true };
    }

    if (!recipientEmail) {
      return { delivered: false, reason: 'No recipient email provided' };
    }

    const heading = formatEventHeading(gift);
    const eventDate = formatEventDate(gift?.date);
    const accent = '#2E235C';
    const muted = '#f6f4ff';

    const html = `
      <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
          <div style="padding: 28px 28px 18px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">Thank You for Your Gift</h2>
            <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">${heading}</p>
            ${eventDate ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Date: ${eventDate}</p>` : ''}
          </div>

          <div style="padding: 0 24px 24px; text-align: center;">
            <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
              <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${contributorName || 'there'},</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
                Thank you for your generous gift of <strong>₦${amount.toLocaleString()}</strong>. Your kindness means so much to us.
              </p>
            </div>

            <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">We appreciate your support!</p>
          </div>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: mailFrom,
        to: recipientEmail,
        subject: `Thank you for your gift to ${heading}`,
        html,
      });
      return { delivered: true };
    } catch (error) {
      console.error('Failed to send contributor thank you email:', error?.message || error);
      return { delivered: false, error: error?.message || 'Unknown error' };
    }
  };

  // Send gift received email to gift owner
  const sendGiftReceivedEmail = async ({ recipientEmail, recipientName, contributorName, amount, gift, message }) => {
    if (!emailEnabled || !transporter) {
      console.warn('Gift received email skipped: SMTP configuration is missing');
      return { delivered: false, skipped: true };
    }

    if (!recipientEmail) {
      return { delivered: false, reason: 'No recipient email provided' };
    }

    const heading = formatEventHeading(gift);
    const eventDate = formatEventDate(gift?.date);
    const accent = '#2E235C';
    const muted = '#f6f4ff';
    const isAnonymous = contributorName === 'Anonymous';
    const senderDisplay = isAnonymous ? 'An anonymous guest' : contributorName;

    const html = `
      <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
          <div style="padding: 28px 28px 18px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">You Received a Gift!</h2>
            <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">${heading}</p>
            ${eventDate ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Date: ${eventDate}</p>` : ''}
          </div>

          <div style="padding: 0 24px 24px; text-align: center;">
            <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
              <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${recipientName || 'there'},</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
                ${senderDisplay} has sent you a cash gift of <strong>₦${amount.toLocaleString()}</strong>.
              </p>
              ${message && !isAnonymous ? `<p style="margin: 8px 0 0; font-size: 13px; color: #4b5563; font-style: italic; line-height: 20px;">"${message}"</p>` : ''}
            </div>

            <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="color: ${accent}; text-decoration: none; font-weight: 600;">View your gifts in your dashboard</a>
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: mailFrom,
        to: recipientEmail,
        subject: `You received a gift for ${heading}!`,
        html,
      });
      return { delivered: true };
    } catch (error) {
      console.error('Failed to send gift received email:', error?.message || error);
      return { delivered: false, error: error?.message || 'Unknown error' };
    }
  };

  // Initialize payment
  router.post('/:link(*)/initialize-payment', async (req, res) => {
    const { contributorName, contributorEmail, amount, message } = req.body;

    try {
      const gift = await prisma.gift.findUnique({ 
        where: { shareLink: req.params.link },
        include: { user: true }
      });
      
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      const payload = {
        reference: `gift-${gift.id}-${Date.now()}`,
        amount: parseFloat(amount) * 100, // Paystack amount in kobo
        currency: 'NGN',
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gift/${req.params.link}`,
        email: contributorEmail,
        metadata: {
          giftId: gift.id,
          giftLink: req.params.link,
          contributorName,
          contributorEmail,
          message: message || '',
          customizations: {
            title: `Contribution to ${gift.user.name}'s ${gift.type}`,
            description: gift.title || gift.type,
          }
        },
      };

      const response = await initializePayment(payload);

      if (!response?.status) {
        return res.status(400).json({
          msg: 'Paystack initialization failed',
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
  router.post('/:link(*)/verify-payment', async (req, res) => {
    const { transactionId, txRef, status } = req.body;

    try {
      console.log('\n=== VERIFY PAYMENT START ===');
      console.log('Link:', req.params.link);
      console.log('Request body:', { transactionId, txRef, status });
      
      // Try to verify with transactionId first, then with txRef
      let response;
      try {
        console.log('Attempting to verify with transactionId:', transactionId);
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
        meta: response?.data?.metadata 
      });

      if (!response.status || response.data.status !== 'success') {
        console.error('❌ Payment verification failed - not success');
        return res.status(400).json({
          msg: 'Payment verification failed',
          details: `Status: ${response?.status}, Data Status: ${response?.data?.status}`
        });
      }

      const { giftId: giftIdRaw, giftLink, contributorName, contributorEmail, message: contributorMessage } = response.data.metadata || {};
      const giftId = giftIdRaw ? parseInt(giftIdRaw, 10) : null;
      const amount = parseFloat((response.data.amount / 100).toFixed(2)); // Paystack amount in kobo, convert to Naira

      console.log('Extracted data:', { giftId, contributorName, contributorEmail, amount, rawAmount: response.data.amount });

      if (!giftId) {
        console.error('❌ No giftId in transaction meta');
        return res.status(400).json({ msg: 'Invalid transaction data - missing gift ID' });
      }

      // Get gift with user info (for wallet update and emails)
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
        include: { user: true }
      });

      if (!gift) {
        console.error('❌ Gift not found:', giftId);
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // Check if contribution already exists
      const existingContribution = await prisma.contribution.findFirst({
        where: {
          OR: [
            { transactionId: response.data.id.toString() },
            { transactionId: response.data.reference }
          ]
        }
      });

      if (existingContribution) {
        console.log('⚠️  Contribution already exists:', existingContribution.id);
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
          transactionId: response.data.id?.toString() || response.data.reference,
          status: 'completed',
        },
      });

      console.log('💾 Contribution created:', { id: contribution.id, amount, giftId });

      // Update user's wallet
      const walletUpdateResult = await prisma.user.update({
        where: { id: gift.userId },
        data: { wallet: { increment: amount } },
      });

      console.log('✅ CONTRIBUTION SAVED:', { id: contribution.id, amount, wallet: walletUpdateResult.wallet });
      console.log('💰 Wallet Update Details:', { userId: gift.userId, walletBefore: gift.user.wallet, walletAfter: walletUpdateResult.wallet, amountAdded: amount });
      console.log('=== VERIFY PAYMENT SUCCESS ===\n');

      // Send gift received email to owner and thank you email to contributor in background without blocking response
      sendGiftReceivedEmail({
        recipientEmail: gift.user.email,
        recipientName: gift.user.name,
        contributorName: contributorName || 'Anonymous',
        amount,
        gift: gift,
        message: contributorMessage || '',
      }).catch(err => console.error('Background gift received email failed:', err));
      
      // Send thank you email to contributor if email provided
      if (contributorEmail) {
        sendContributorThankYouEmail({
          recipientEmail: contributorEmail,
          contributorName: contributorName || 'Anonymous',
          amount,
          gift: gift,
        }).catch(err => console.error('Background contributor thank you email failed:', err));
      }

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

  // Webhook for Paystack
  router.post('/webhook', async (req, res) => {
    try {
      console.log('=== WEBHOOK RECEIVED ===');
      console.log('Headers:', req.headers);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Query:', req.query);
      console.log('Signature (x-paystack-signature):', req.headers['x-paystack-signature']);

      const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
      const signature = req.headers['x-paystack-signature'];

      console.log('Expected secret:', secret ? 'SET' : 'NOT SET');
      console.log('Received signature:', signature ? 'PRESENT' : 'MISSING');

      if (!secret) {
        console.error('PAYSTACK_WEBHOOK_SECRET not set');
        return res.status(500).send('Server error');
      }

      // rawBody is set in server.js verify hook; fallback to reconstructed body
      const payloadBuffer = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));

      if (!verifyWebhookSignature(payloadBuffer, signature, secret)) {
        console.error('Invalid webhook signature');
        console.error('Verification failed - signature mismatch');
        return res.status(401).send('Unauthorized');
      }

      console.log('✓ Webhook signature verified successfully');

      const event = req.body; // Already parsed
      console.log('=== WEBHOOK EVENT ===');
      console.log('Event type:', event.event);
      console.log('Event data:', JSON.stringify(event.data, null, 2));
      console.log('Transaction ID:', event.data?.id);
      console.log('Status:', event.data?.status);

      if (event.event === 'charge.success') {
        console.log('=== PROCESSING CHARGE.SUCCESS ===');
        const { id: transactionId, reference, amount, currency, status } = event.data;

        console.log('Transaction details:', {
          transactionId,
          reference,
          amount,
          currency,
          status
        });

        if (status !== 'success') {
          console.log('Payment not successful:', status);
          return res.status(200).send('OK');
        }

        console.log('Verifying transaction with Paystack...');
        // Verify transaction
        const response = await verifyTransaction(reference);
        console.log('Verification response:', {
          status: response.status,
          dataStatus: response.data?.status,
          metadata: response.data?.metadata
        });

        if (!response.status || response.data.status !== 'success') {
          console.error('Transaction verification failed');
          return res.status(200).send('OK');
        }

        const { giftId: giftIdRaw, contributorName, contributorEmail, message: contributorMessage } = response.data.metadata || {};
        const giftId = giftIdRaw ? parseInt(giftIdRaw, 10) : null;

        console.log('Extracted meta data:', {
          giftId,
          contributorName,
          contributorEmail,
          contributorMessage
        });

        if (!giftId) {
          console.error('No giftId in webhook meta or failed to parse');
          return res.status(200).send('OK');
        }

        // Check if contribution already exists
        const existingContribution = await prisma.contribution.findFirst({
          where: {
            OR: [
              { transactionId: transactionId.toString() },
              { transactionId: response.data.reference }
            ]
          }
        });

        if (existingContribution) {
          console.log('Contribution already exists:', existingContribution.id);
          return res.status(200).send('OK');
        }

        // Get gift
        const gift = await prisma.gift.findUnique({ 
          where: { id: giftId },
          include: { user: true }
        });
        if (!gift) {
          console.error('Gift not found:', giftId);
          return res.status(200).send('OK');
        }

        console.log('Creating contribution...');
        const amountInNaira = amount / 100; // Convert kobo to Naira
        // Create contribution
        const contribution = await prisma.contribution.create({
          data: {
            giftId,
            contributorName: contributorName || 'Anonymous',
            contributorEmail: contributorEmail || '',
            amount: amountInNaira,
            message: contributorMessage || '',
            transactionId: transactionId.toString(),
            status: 'completed',
          },
        });

        console.log('✓ Contribution created:', contribution.id, 'Amount:', amountInNaira);

        // Update user's wallet
        const updateResult = await prisma.user.update({
          where: { id: gift.userId },
          data: { wallet: { increment: amountInNaira } },
        });

        console.log('✓ Wallet updated for user:', gift.userId, 'New balance should be:', updateResult.wallet);
        
        // Send gift received email to owner and thank you email to contributor in background without blocking response
        sendGiftReceivedEmail({
          recipientEmail: gift.user.email,
          recipientName: gift.user.name,
          contributorName: contributorName || 'Anonymous',
          amount: amountInNaira,
          gift: gift,
          message: contributorMessage || '',
        }).catch(err => console.error('Background gift received email failed:', err));
        
        // Send thank you email to contributor if email provided
        if (contributorEmail) {
          sendContributorThankYouEmail({
            recipientEmail: contributorEmail,
            contributorName: contributorName || 'Anonymous',
            amount: amountInNaira,
            gift: gift,
          }).catch(err => console.error('Background contributor thank you email failed:', err));
        }
        
        console.log('=== WEBHOOK SUCCESS ===');
        console.log('Contribution ID:', contribution.id);
      }

      res.status(200).send('OK');
    } catch (err) {
      console.log('=== WEBHOOK ERROR ===');
      console.error('Error message:', err?.message || err);
      console.error('Full error:', err);
      res.status(500).send('Server error');
    }
  });

  // Contribute to gift (without payment - optional)
  router.post('/:link(*)', async (req, res) => {
    const { contributorName, contributorEmail, amount, message } = req.body;

    try {
      const gift = await prisma.gift.findUnique({ where: { shareLink: req.params.link }, include: { user: true } });
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
      
      // Send thank you email to contributor if email provided in background
      if (contributorEmail) {
        sendContributorThankYouEmail({
          recipientEmail: contributorEmail,
          contributorName: contributorName || 'Anonymous',
          amount,
          gift: gift,
        }).catch(err => console.error('Background contributor thank you email failed:', err));
      }

      res.json({ msg: 'Contribution successful' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get contributions for gift
  router.get('/:link(*)', async (req, res) => {
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