const express = require('express');
const prisma = require('../prismaClient');
const { initializePayment, verifyTransaction, verifyWebhookSignature } = require('../utils/paystack');
const { sendContributorThankYouEmail, sendGiftReceivedEmail } = require('../utils/emailService');

module.exports = () => {
  const router = express.Router();

  // Initialize payment
  router.post('/:link(*)/initialize-payment', async (req, res) => {
    const { contributorName, contributorEmail, amount, message, isAsoebi, guestId, asoebiQuantity, asoebiType, asoebiSelection } = req.body;

    try {
      const gift = await prisma.gift.findUnique({ 
        where: { shareLink: req.params.link },
        include: { user: true }
      });
      
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      // Construct metadata
      const metadata = {
        giftId: gift.id,
        giftLink: req.params.link,
        contributorName,
        contributorEmail,
        message: message || (isAsoebi ? `Asoebi Payment${asoebiType ? ` (${asoebiType})` : ''}` : ''),
        isAsoebi,
        guestId,
        asoebiQuantity,
        asoebiType,
        asoebiSelection,
        customizations: {
          title: `Contribution to ${gift.user.name}'s ${gift.type}`,
          description: gift.title || gift.type,
        }
      };

      const payload = {
        reference: `gift-${gift.id}-${Date.now()}`,
        amount: parseFloat(amount) * 100, // Paystack amount in kobo
        currency: 'NGN',
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gift/${req.params.link}`,
        email: contributorEmail,
        metadata,
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

      const { giftId: giftIdRaw, giftLink, contributorName, contributorEmail, message: contributorMessage, isAsoebi, guestId, asoebiType, asoebiSelection } = response.data.metadata || {};
      const giftId = giftIdRaw ? parseInt(giftIdRaw, 10) : null;
      const amount = parseFloat((response.data.amount / 100).toFixed(2)); // Paystack amount in kobo, convert to Naira

      console.log('Extracted data:', { giftId, contributorName, contributorEmail, amount, rawAmount: response.data.amount, isAsoebi, guestId, asoebiType, asoebiSelection });

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
          message: contributorMessage || (isAsoebi ? `Asoebi Payment${asoebiType ? ` (${asoebiType})` : ''}` : ''),
          transactionId: response.data.id?.toString() || response.data.reference,
          status: 'completed',
        },
      });

      console.log('💾 Contribution created:', { id: contribution.id, amount, giftId });

      // If this is an Asoebi payment, update the guest record or create one if it doesn't exist
      if (isAsoebi) {
        try {
          if (guestId) {
             await prisma.guest.update({
              where: { id: parseInt(guestId) },
              data: { 
                asoebiPaid: true, 
                asoebi: true,
                asoebiSelection: asoebiSelection || undefined
              }
            });
            console.log('✅ Updated guest asoebi status for guest:', guestId);
          } else if (contributorEmail) {
             // Try to find guest by email
             const existingGuest = await prisma.guest.findFirst({
                where: {
                   email: contributorEmail,
                   giftId: giftId
                }
             });

             if (existingGuest) {
                await prisma.guest.update({
                   where: { id: existingGuest.id },
                   data: { 
                    asoebiPaid: true, 
                    asoebi: true,
                    asoebiSelection: asoebiSelection || undefined
                   }
                });
                console.log('✅ Updated guest asoebi status for guest (by email):', existingGuest.id);
             } else {
                // Create new guest
                const nameParts = (contributorName || 'Anonymous Guest').trim().split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || '-';
                
                const newGuest = await prisma.guest.create({
                   data: {
                      firstName,
                      lastName,
                      email: contributorEmail,
                      giftId: giftId,
                      userId: gift.userId,
                      asoebi: true,
                      asoebiPaid: true,
                      asoebiSelection: asoebiSelection || null,
                      attending: 'pending',
                      allowed: 1,
                      status: 'invited'
                   }
                });
                console.log('✅ Created new guest for Asoebi payment:', newGuest.id);
             }
          }
        } catch (err) {
          console.error('❌ Failed to update/create guest asoebi status:', err);
        }
      }

      // Deduct 15% commission or Asoebi fee
      let commission;
      let amountReceived;
      
      if (isAsoebi) {
        // For Asoebi, we charge a flat 1000 fee, user gets the rest
        commission = 1000;
        amountReceived = amount - commission;
        if (amountReceived < 0) amountReceived = 0; // Safety check
      } else {
        // Standard 15% commission
        commission = amount * 0.15;
        amountReceived = amount * 0.85;
      }

      // Update user's wallet
      const walletUpdateResult = await prisma.user.update({
        where: { id: gift.userId },
        data: { wallet: { increment: amountReceived } },
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
        isAsoebi,
      }).catch(err => console.error('Background gift received email failed:', err));
      
      // Send thank you email to contributor if email provided
      if (contributorEmail) {
        sendContributorThankYouEmail({
          recipientEmail: contributorEmail,
          contributorName: contributorName || 'Anonymous',
          amount,
          gift: gift,
          isAsoebi,
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

        const { giftId: giftIdRaw, contributorName, contributorEmail, message: contributorMessage, isAsoebi, guestId, asoebiType, asoebiSelection } = response.data.metadata || {};
        const giftId = giftIdRaw ? parseInt(giftIdRaw, 10) : null;

        console.log('Extracted meta data:', {
          giftId,
          contributorName,
          contributorEmail,
          contributorMessage,
          isAsoebi,
          guestId,
          asoebiType,
          asoebiSelection
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
            message: contributorMessage || (isAsoebi ? `Asoebi Payment${asoebiType ? ` (${asoebiType})` : ''}` : ''),
            transactionId: transactionId.toString(),
            status: 'completed',
          },
        });

        console.log('✓ Contribution created:', contribution.id, 'Amount:', amountInNaira);

        // If this is an Asoebi payment, update the guest record or create one if it doesn't exist
        if (isAsoebi) {
          try {
            if (guestId) {
               await prisma.guest.update({
                where: { id: parseInt(guestId) },
                data: { 
                    asoebiPaid: true, 
                    asoebi: true,
                    asoebiSelection: asoebiSelection || undefined
                }
              });
              console.log('✅ Updated guest asoebi status for guest:', guestId);
            } else if (contributorEmail) {
               // Try to find guest by email
               const existingGuest = await prisma.guest.findFirst({
                  where: {
                     email: contributorEmail,
                     giftId: giftId
                  }
               });
  
               if (existingGuest) {
                  await prisma.guest.update({
                     where: { id: existingGuest.id },
                     data: { 
                        asoebiPaid: true, 
                        asoebi: true,
                        asoebiSelection: asoebiSelection || undefined
                     }
                  });
                  console.log('✅ Updated guest asoebi status for guest (by email):', existingGuest.id);
               } else {
                  // Create new guest
                  const nameParts = (contributorName || 'Anonymous Guest').trim().split(' ');
                  const firstName = nameParts[0];
                  const lastName = nameParts.slice(1).join(' ') || '-';
                  
                  const newGuest = await prisma.guest.create({
                     data: {
                        firstName,
                        lastName,
                        email: contributorEmail,
                        giftId: giftId,
                        userId: gift.userId,
                        asoebi: true,
                        asoebiPaid: true,
                        asoebiSelection: asoebiSelection || null,
                        attending: 'pending',
                        allowed: 1,
                        status: 'invited'
                     }
                  });
                  console.log('✅ Created new guest for Asoebi payment:', newGuest.id);
               }
            }
          } catch (err) {
            console.error('❌ Failed to update/create guest asoebi status:', err);
          }
        }

        // Deduct 15% commission or Asoebi fee
        let commission;
        let amountReceived;
        
        if (isAsoebi) {
          // For Asoebi, we charge a flat 1000 fee, user gets the rest
          commission = 1000;
          amountReceived = amountInNaira - commission;
          if (amountReceived < 0) amountReceived = 0; // Safety check
        } else {
          // Standard 15% commission
          commission = amountInNaira * 0.15;
          amountReceived = amountInNaira * 0.85;
        }

        // Update user's wallet
        const updateResult = await prisma.user.update({
          where: { id: gift.userId },
          data: { wallet: { increment: amountReceived } },
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
          isAsoebi,
        }).catch(err => console.error('Background gift received email failed:', err));
        
        // Send thank you email to contributor if email provided
        if (contributorEmail) {
          sendContributorThankYouEmail({
            recipientEmail: contributorEmail,
            contributorName: contributorName || 'Anonymous',
            amount: amountInNaira,
            gift: gift,
            isAsoebi,
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

      // Deduct 15% commission
      const commission = amount * 0.15;
      const amountReceived = amount * 0.85;

      // Update user's wallet atomically
      await prisma.user.update({
        where: { id: gift.userId },
        data: { wallet: { increment: amountReceived } },
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