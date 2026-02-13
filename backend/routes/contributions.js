const express = require('express');
const prisma = require('../prismaClient');
const { initializePayment, verifyTransaction, verifyWebhookSignature } = require('../utils/paystack');
const { sendContributorThankYouEmail, sendGiftReceivedEmail } = require('../utils/emailService');

module.exports = () => {
  const router = express.Router();

  // Initialize payment
  router.post('/:link(*)/initialize-payment', async (req, res) => {
    const { contributorName, contributorEmail, amount, message, isAsoebi, guestId, asoebiQuantity, asoebiType, asoebiSelection,
      asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItemsDetails } = req.body;

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
        asoebiQtyMen,
        asoebiQtyWomen,
        asoebiBrideMenQty,
        asoebiBrideWomenQty,
        asoebiGroomMenQty,
        asoebiGroomWomenQty,
        asoebiItemsDetails,
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

      // Enforce minimum amount of 1000 Naira
      if (parseFloat(amount) < 1000) {
        return res.status(400).json({ msg: 'Minimum amount is ₦1000' });
      }

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

      const { giftId: giftIdRaw, giftLink, contributorName, contributorEmail, message: contributorMessage, isAsoebi, guestId, asoebiType, asoebiSelection, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItemsDetails } = response.data.metadata || {};
      const giftId = giftIdRaw ? parseInt(giftIdRaw, 10) : null;
      const amount = parseFloat((response.data.amount / 100).toFixed(2)); // Paystack amount in kobo, convert to Naira

      console.log('Extracted data:', { giftId, contributorName, contributorEmail, amount, rawAmount: response.data.amount, isAsoebi, guestId, asoebiType, asoebiSelection, asoebiItemsDetails });

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

      // Calculate commission and amount to receive
      let commission;
      let amountReceived;
      let asoebiTotalQty = 0;
      
      if (isAsoebi) {
        const breakdownSum =
          (asoebiQtyMen ? parseInt(asoebiQtyMen, 10) : 0) +
          (asoebiQtyWomen ? parseInt(asoebiQtyWomen, 10) : 0) +
          (asoebiBrideMenQty ? parseInt(asoebiBrideMenQty, 10) : 0) +
          (asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty, 10) : 0) +
          (asoebiGroomMenQty ? parseInt(asoebiGroomMenQty, 10) : 0) +
          (asoebiGroomWomenQty ? parseInt(asoebiGroomWomenQty, 10) : 0);
        
        // Use breakdown sum if present, otherwise fall back to generic quantity
        // This prevents double counting if frontend sends both sum and breakdown
        const quantity = breakdownSum > 0 ? breakdownSum : (asoebiQuantity ? parseInt(asoebiQuantity, 10) : 0);
        
        // Ensure at least 1 for calculation if something went wrong but amount is > 0
        const finalQty = quantity > 0 ? quantity : 1;
        
        asoebiTotalQty = finalQty;
        commission = 500 * finalQty;
        amountReceived = amount - commission;
        if (amountReceived < 0) amountReceived = 0; // Safety check
        
        // Update asoebiQuantity to be the true total for DB storage
        // This ensures Dashboard and other views relying on asoebiQuantity see the correct total
        if (breakdownSum > 0) {
           // We are in a local scope, so we can't change the const/let from destructured vars easily if we rely on them later.
           // But we construct the prisma create object explicitly below.
        }
      } else {
        // Standard 5% commission
        commission = amount * 0.05;
        amountReceived = amount * 0.95;
      }

      // Create contribution record
      const contribution = await prisma.contribution.create({
        data: {
          giftId,
          contributorName: contributorName || 'Anonymous',
          contributorEmail: contributorEmail || '',
          amount,
          commission,
          isAsoebi: !!isAsoebi,
          asoebiQuantity: isAsoebi ? asoebiTotalQty : (asoebiQuantity ? parseInt(asoebiQuantity, 10) : 0),
          asoebiQtyMen: asoebiQtyMen ? parseInt(asoebiQtyMen, 10) : 0,
          asoebiQtyWomen: asoebiQtyWomen ? parseInt(asoebiQtyWomen, 10) : 0,
          asoebiBrideMenQty: asoebiBrideMenQty ? parseInt(asoebiBrideMenQty, 10) : 0,
          asoebiBrideWomenQty: asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty, 10) : 0,
          asoebiGroomMenQty: asoebiGroomMenQty ? parseInt(asoebiGroomMenQty, 10) : 0,
          asoebiGroomWomenQty: asoebiGroomWomenQty ? parseInt(asoebiGroomWomenQty, 10) : 0,
          asoebiItemsDetails: asoebiItemsDetails || undefined,
          message: contributorMessage || (isAsoebi ? `Asoebi Payment${asoebiType ? ` (${asoebiType})` : ''}` : ''),
          transactionId: response.data.id?.toString() || response.data.reference,
          status: 'completed',
        },
      });

      console.log('💾 Contribution created:', { id: contribution.id, amount, commission, giftId });

      // Update stock for dynamic Asoebi items
      if (isAsoebi && asoebiItemsDetails && Array.isArray(asoebiItemsDetails)) {
        console.log('🔄 Updating stock for dynamic items:', asoebiItemsDetails.length);
        for (const item of asoebiItemsDetails) {
          if (item.asoebiItemId && item.quantity > 0) {
            try {
              await prisma.asoebiItem.update({
                  where: { id: parseInt(item.asoebiItemId) },
                  data: {
                    sold: { increment: parseInt(item.quantity) }
                  }
                });
                console.log(`✅ Updated sold count for item ${item.asoebiItemId}: +${item.quantity}`);
            } catch (err) {
              console.error(`❌ Failed to update stock for item ${item.asoebiItemId}:`, err);
            }
          }
        }
      }

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

      // --- Referral Reward Logic ---
      if (gift.user.referredById) {
        try {
          const referrerId = gift.user.referredById;
          let rewardAmount = 0;
          let rewardType = '';
          let rewardDesc = '';

          if (isAsoebi) {
            // 100 Naira per Asoebi order
            rewardAmount = 100;
            rewardType = 'asoebi_commission';
            rewardDesc = `Commission for Asoebi order by ${gift.user.name}`;
          } else {
            // 1% of Cash Gift
            rewardAmount = amount * 0.01;
            rewardType = 'cash_gift_commission';
            rewardDesc = `1% Commission for Cash Gift received by ${gift.user.name}`;
          }

          if (rewardAmount > 0) {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: referrerId },
                data: { wallet: { increment: rewardAmount } }
              }),
              prisma.referralTransaction.create({
                data: {
                  referrerId,
                  referredUserId: gift.user.id,
                  amount: rewardAmount,
                  type: rewardType,
                  description: rewardDesc
                }
              })
            ]);
            console.log(`💰 Referral reward credited: ${rewardAmount} to user ${referrerId}`);
          }
        } catch (refErr) {
          console.error('❌ Failed to process referral reward:', refErr);
        }
      }
      // -----------------------------

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

      // rawBody is set in server.js verify hook
      const payloadBuffer = req.rawBody;

      if (!payloadBuffer) {
        console.error('❌ Webhook Error: rawBody is missing. Check server.js middleware.');
        // If rawBody is missing, verification will likely fail, but we'll try fallback as last resort
      }

      const finalPayload = payloadBuffer || Buffer.from(JSON.stringify(req.body || {}));

      if (!verifyWebhookSignature(finalPayload, signature, secret)) {
        console.error('❌ Invalid webhook signature');
        console.error('Verification failed - signature mismatch. Ensure PAYSTACK_WEBHOOK_SECRET matches Paystack dashboard.');
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

        const { giftId: giftIdRaw, contributorName, contributorEmail, message: contributorMessage, isAsoebi, guestId, asoebiType, asoebiSelection, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItemsDetails } = response.data.metadata || {};
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

        const amountInNaira = amount / 100; // Convert kobo to Naira

        // Deduct 15% commission or Asoebi fee
        let commission;
        let amountReceived;
        
        if (isAsoebi) {
          const qtySum =
            (asoebiQuantity ? parseInt(asoebiQuantity, 10) : 0) +
            (asoebiQtyMen ? parseInt(asoebiQtyMen, 10) : 0) +
            (asoebiQtyWomen ? parseInt(asoebiQtyWomen, 10) : 0) +
            (asoebiBrideMenQty ? parseInt(asoebiBrideMenQty, 10) : 0) +
            (asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty, 10) : 0) +
            (asoebiGroomMenQty ? parseInt(asoebiGroomMenQty, 10) : 0) +
            (asoebiGroomWomenQty ? parseInt(asoebiGroomWomenQty, 10) : 0);
          const quantity = qtySum > 0 ? qtySum : 1;
          commission = 500 * quantity;
          amountReceived = amountInNaira - commission;
          if (amountReceived < 0) amountReceived = 0; // Safety check
        } else {
          // Standard 4% commission
          commission = amountInNaira * 0.04;
          amountReceived = amountInNaira * 0.96;
        }

        console.log('Creating contribution...');
        // Create contribution
        const contribution = await prisma.contribution.create({
          data: {
            giftId,
            contributorName: contributorName || 'Anonymous',
            contributorEmail: contributorEmail || '',
            amount: amountInNaira,
            commission,
            isAsoebi: !!isAsoebi,
            asoebiQuantity: asoebiQuantity ? parseInt(asoebiQuantity, 10) : 0,
            asoebiQtyMen: asoebiQtyMen ? parseInt(asoebiQtyMen, 10) : 0,
            asoebiQtyWomen: asoebiQtyWomen ? parseInt(asoebiQtyWomen, 10) : 0,
            asoebiBrideMenQty: asoebiBrideMenQty ? parseInt(asoebiBrideMenQty, 10) : 0,
            asoebiBrideWomenQty: asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty, 10) : 0,
            asoebiGroomMenQty: asoebiGroomMenQty ? parseInt(asoebiGroomMenQty, 10) : 0,
            asoebiGroomWomenQty: asoebiGroomWomenQty ? parseInt(asoebiGroomWomenQty, 10) : 0,
            asoebiItemsDetails: asoebiItemsDetails || undefined,
            message: contributorMessage || (isAsoebi ? `Asoebi Payment${asoebiType ? ` (${asoebiType})` : ''}` : ''),
            transactionId: transactionId.toString(),
            status: 'completed',
          },
        });

        console.log('✓ Contribution created:', contribution.id, 'Amount:', amountInNaira);

        // Update stock for dynamic Asoebi items
        if (isAsoebi && asoebiItemsDetails && Array.isArray(asoebiItemsDetails)) {
          console.log('🔄 Updating stock for dynamic items (webhook):', asoebiItemsDetails.length);
          for (const item of asoebiItemsDetails) {
            if (item.asoebiItemId && item.quantity > 0) {
              try {
                await prisma.asoebiItem.update({
                  where: { id: parseInt(item.asoebiItemId) },
                  data: {
                    sold: { increment: parseInt(item.quantity) }
                  }
                });
                console.log(`✅ Updated stock for item ${item.asoebiItemId}: -${item.quantity}`);
              } catch (err) {
                console.error(`❌ Failed to update stock for item ${item.asoebiItemId}:`, err);
              }
            }
          }
        }

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

      // --- Referral Reward Logic ---
      if (gift.user.referredById) {
        try {
          const referrerId = gift.user.referredById;
          let rewardAmount = 0;
          let rewardType = '';
          let rewardDesc = '';

          if (isAsoebi) {
            // 100 Naira per Asoebi order
            rewardAmount = 100;
            rewardType = 'asoebi_commission';
            rewardDesc = `Commission for Asoebi order from ${gift.user.name}`;
          } else {
            // 1% of Cash Gift
            rewardAmount = amountInNaira * 0.01;
            rewardType = 'cash_gift_commission';
            rewardDesc = `1% Commission for Cash Gift received by ${gift.user.name}`;
          }

          if (rewardAmount > 0) {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: referrerId },
                data: { wallet: { increment: rewardAmount } }
              }),
              prisma.referralTransaction.create({
                data: {
                  referrerId,
                  referredUserId: gift.user.id,
                  amount: rewardAmount,
                  type: rewardType,
                  description: rewardDesc
                }
              })
            ]);
            console.log(`💰 Referral reward credited: ${rewardAmount} to user ${referrerId}`);
          }
        } catch (refErr) {
          console.error('❌ Failed to process referral reward:', refErr);
        }
      }
      // -----------------------------

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
