const express = require('express');
const axios = require('axios');
const prisma = require('../prismaClient');
const paystack = require('../utils/paystack');
const flutterwave = require('../utils/flutterwave');
const { sendContributorThankYouEmail, sendGiftReceivedEmail } = require('../utils/emailService');

module.exports = () => {
  const router = express.Router();

  // Initialize payment
  router.post('/:link(*)/initialize-payment', async (req, res) => {
    const { contributorName, contributorEmail, amount, message, isAsoebi, guestId, asoebiQuantity, asoebiType, asoebiSelection,
      asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItemsDetails, currency: currencyRaw, wishlistItemId, wishlistShareLink } = req.body;

    try {
      const gift = await prisma.gift.findUnique({ 
        where: { shareLink: req.params.link },
        include: { user: true }
      });
      
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      // Construct metadata
      const currency = String(currencyRaw || 'NGN').toUpperCase();
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
        currency,
        wishlistItemId,
        wishlistShareLink,
        customizations: {
          title: `Contribution to ${gift.user.name}'s ${gift.type}`,
          description: gift.title || gift.type,
        }
      };

      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ msg: 'Invalid amount' });
      }

      // Enforce minimum amount of 1000 Naira
      if (currency === 'NGN' && parsedAmount < 1000) {
        return res.status(400).json({ msg: 'Minimum amount is ₦1000' });
      }
      if (currency !== 'NGN' && parsedAmount < 10) {
        return res.status(400).json({ msg: `Minimum amount is ${currency} 10` });
      }

      const tx_ref = `gift-${gift.id}-${Date.now()}`;
      const redirectUrl = wishlistShareLink 
        ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wishlist/${wishlistShareLink.replace('wishlist/', '')}`
        : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/gift/${req.params.link}`;

      // Route all NGN contributions through Paystack; keep other currencies on Flutterwave.
      if (currency === 'NGN') {
        const psPayload = {
          reference: tx_ref,
          amount: parsedAmount,
          currency,
          callback_url: redirectUrl,
          email: contributorEmail,
          metadata: {
            ...metadata,
            provider: 'paystack',
            reference: tx_ref,
            originalCurrency: currency,
            originalAmount: parsedAmount,
          },
        };

        const psResponse = await paystack.initializePayment(psPayload);
        if (!psResponse?.status) {
          return res.status(400).json({
            msg: 'Paystack initialization failed',
            error: psResponse?.message || 'Unknown error',
          });
        }

        return res.json({
          status: psResponse.status,
          data: {
            ...psResponse.data,
            authorization_url: psResponse?.data?.authorization_url,
            provider: 'paystack',
          },
        });
      }

      const fwPayload = {
        tx_ref,
        amount: parsedAmount,
        currency,
        redirect_url: redirectUrl,
        customer: {
          email: contributorEmail,
          name: contributorName || 'Anonymous',
        },
        meta: {
          ...metadata,
          provider: 'flutterwave',
          tx_ref,
          originalCurrency: currency,
          originalAmount: parsedAmount
        },
        customizations: {
          title: metadata?.customizations?.title,
          description: metadata?.customizations?.description,
        },
      };

      const fwResponse = await flutterwave.initializePayment(fwPayload);

      if (!fwResponse?.status) {
        return res.status(400).json({
          msg: 'Flutterwave initialization failed',
          error: fwResponse?.message || 'Unknown error',
        });
      }

      const authorization_url = fwResponse?.data?.link;
      return res.json({
        status: fwResponse.status,
        data: {
          ...fwResponse.data,
          authorization_url,
          provider: 'flutterwave',
        },
      });
    } catch (err) {
      console.error('Initialize payment error:', err?.message || err);
      const fwError = err?.response?.data || err?.data || err?.message || err;
      console.error('Initialize payment error details:', fwError);
      
      // Log the payload for debugging
      console.error('Payment payload:', {
        tx_ref: `gift-${req.params.link}-${Date.now()}`,
        amount: parseFloat(amount),
        currency: String(req.body?.currency || 'NGN').toUpperCase(),
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
      
      let provider = 'flutterwave';
      let response;

      try {
        console.log('Attempting Flutterwave verification with transactionId:', transactionId);
        response = await flutterwave.verifyTransaction(transactionId);
      } catch (flutterwaveErr) {
        try {
          console.log('Flutterwave verification failed, attempting Paystack verification with transactionId:', transactionId);
          provider = 'paystack';
          response = await paystack.verifyTransaction(transactionId);
          if (!response?.status || response?.data?.status !== 'success') {
            throw new Error('Paystack verification did not return success');
          }
        } catch (paystackErr) {
          if (txRef && txRef !== transactionId) {
            try {
              console.log('Retrying Flutterwave verification with txRef:', txRef);
              provider = 'flutterwave';
              try {
                response = await flutterwave.verifyTransaction(txRef);
              } catch (flutterwaveErr2) {
                console.log('Retrying Paystack verification with txRef:', txRef);
                provider = 'paystack';
                try {
                  response = await paystack.verifyTransaction(txRef);
                  if (!response?.status || response?.data?.status !== 'success') {
                    throw new Error('Paystack verification did not return success');
                  }
                } catch (paystackErr2) {
                  console.error('❌ Payment verification failed:', paystackErr2?.message || paystackErr2);
                  return res.status(400).json({
                    msg: 'Payment verification failed',
                    error: paystackErr2?.message || 'Could not verify transaction',
                  });
                }
              }
            } catch (retryErr) {
              console.error('❌ Payment verification failed:', retryErr?.message || retryErr);
              return res.status(400).json({
                msg: 'Payment verification failed',
                error: retryErr?.message || 'Could not verify transaction',
              });
            }
          } else {
            console.error('❌ Payment verification failed:', paystackErr?.message || paystackErr);
            return res.status(400).json({
              msg: 'Payment verification failed',
              error: paystackErr?.message || 'Could not verify transaction',
            });
          }
        }
      }

      const isPaystackSuccess =
        provider === 'paystack' && !!response?.status && response?.data?.status === 'success';
      const flutterwaveDataStatus = String(response?.data?.status || '').toLowerCase();
      const isFlutterwaveSuccess =
        provider === 'flutterwave' && response?.status === 'success' && (
          flutterwaveDataStatus === 'successful' ||
          flutterwaveDataStatus === 'success' ||
          flutterwaveDataStatus === 'completed'
        );

      if (!isPaystackSuccess && !isFlutterwaveSuccess) {
        console.error('❌ Payment verification failed - not successful');
        return res.status(400).json({
          msg: 'Payment verification failed',
          details: `Provider: ${provider}, Status: ${response?.status}, Data Status: ${response?.data?.status}`
        });
      }

      const meta = provider === 'paystack' ? (response.data.metadata || {}) : (response.data.meta || {});
      const { giftId: giftIdRaw, giftLink, contributorName, contributorEmail, message: contributorMessage, isAsoebi, guestId, asoebiType, asoebiSelection, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItemsDetails, wishlistItemId, currency: metaCurrency } = meta;
      const giftId = giftIdRaw ? parseInt(giftIdRaw, 10) : null;
      const txCurrency = String(provider === 'paystack' ? (response.data.currency || metaCurrency || 'NGN') : (response?.data?.currency || metaCurrency || 'NGN')).toUpperCase();
      const convertToNgn = async (fromCurrency, fromAmount) => {
        const from = String(fromCurrency || '').toUpperCase();
        const amountValue = Number(fromAmount);
        if (!from) throw new Error('Missing transaction currency');
        if (!Number.isFinite(amountValue) || amountValue <= 0) throw new Error('Invalid transaction amount');
        if (from === 'NGN') return { ngn: amountValue, rate: 1, date: null, source: 'na' };

        const rateKey = `FX_BUY_RATE_${from}`;
        const rate = Number(process.env[rateKey]);
        if (!Number.isFinite(rate) || rate <= 0) {
          throw new Error(`Missing FX rate for ${from}. Set ${rateKey} in .env`);
        }

        return {
          ngn: parseFloat((amountValue * rate).toFixed(2)),
          rate,
          date: null,
          source: 'env_fixed'
        };
      };

      let amount;
      let paymentMeta = null;
      if (provider === 'paystack') {
        amount = parseFloat((response.data.amount / 100).toFixed(2));
      } else {
        const txCurrency = String(response?.data?.currency || meta?.currency || '').toUpperCase();
        const chargedAmount = Number(response?.data?.charged_amount ?? 0);
        const baseAmount = Number(response?.data?.amount ?? 0);
        const rawAmount = Number.isFinite(baseAmount) && baseAmount > 0 ? baseAmount : chargedAmount;

        if (txCurrency === 'NGN') {
          amount = rawAmount;
        } else {
          const settledCurrency = String(response?.data?.settlement_currency || response?.data?.settled_currency || '').toUpperCase();
          const settledAmount = Number(response?.data?.amount_settled ?? 0);

          if (
            Number.isFinite(settledAmount) &&
            settledAmount > 0 &&
            settledCurrency === 'NGN'
          ) {
            amount = settledAmount;
            paymentMeta = {
              provider: 'flutterwave',
              currency: txCurrency,
              amount: rawAmount,
              ngnAmount: amount,
              ngnSource: 'flutterwave_settlement',
              settlementCurrency: settledCurrency,
              amountSettled: settledAmount,
            };
          } else {
            try {
              const fx = await convertToNgn(txCurrency, rawAmount, response?.data?.created_at);
              amount = fx.ngn;
              paymentMeta = {
                provider: 'flutterwave',
                currency: txCurrency,
                amount: rawAmount,
                ngnAmount: amount,
                ngnSource: 'fx',
                fxRate: fx.rate,
                fxDate: fx.date,
                fxSource: fx.source,
              };
            } catch (fxErr) {
              console.error('❌ FX conversion failed:', fxErr?.message || fxErr);
              return res.status(400).json({
                msg: 'FX conversion failed. Could not convert payment to NGN for recording.',
                error: fxErr?.message || 'FX conversion failed',
              });
            }
          }
        }
      }

      const emailCurrency = provider === 'paystack'
        ? String(response?.data?.currency || meta?.currency || 'NGN').toUpperCase()
        : txCurrency;
      const emailBaseAmount = provider === 'paystack'
        ? Number(response?.data?.amount / 100)
        : (paymentMeta?.amount || rawAmount);

      console.log('Extracted data:', { giftId, contributorName, contributorEmail, amount, emailCurrency, emailBaseAmount, isAsoebi, guestId, asoebiType, asoebiSelection, asoebiItemsDetails });

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

      const transactionIdCandidates =
        provider === 'paystack'
          ? [response?.data?.id?.toString?.(), response?.data?.reference].filter(Boolean)
          : [response?.data?.id?.toString?.(), response?.data?.tx_ref].filter(Boolean);

      // Check if contribution already exists
      const existingContribution = await prisma.contribution.findFirst({
        where: {
          OR: transactionIdCandidates.map((id) => ({ transactionId: id })),
        }
      });

      if (existingContribution) {
        if (provider === 'flutterwave' && Number(existingContribution.amount) !== Number(amount)) {
          let updatedCommission;
          if (gift.tier === 'vip' || gift.tier === 'royal') {
            updatedCommission = 0;
          } else {
            updatedCommission = existingContribution.isAsoebi
              ? 500 * Number(existingContribution.asoebiQuantity || 0)
              : Number(amount) * 0.04;
          }
          const updatedAmountReceived = Number(amount) - updatedCommission;
          const previousAmountReceived = Number(existingContribution.amount) - Number(existingContribution.commission || 0);
          const walletDelta = updatedAmountReceived - previousAmountReceived;

          await prisma.$transaction(async (tx) => {
            await tx.contribution.update({
              where: { id: existingContribution.id },
              data: {
                amount: Number(amount),
                currency: txCurrency,
                commission: updatedCommission,
                ...(existingContribution.isAsoebi ? {} : (paymentMeta ? { asoebiItemsDetails: { paymentMeta } } : {})),
              },
            });

            if (walletDelta !== 0) {
              await tx.user.update({
                where: { id: gift.userId },
                data: { wallet: { increment: walletDelta } },
              });
            }

            if (gift.user.referredById && !existingContribution.isAsoebi) {
              const fxRewardDelta = Number(amount) * 0.01 - Number(existingContribution.amount) * 0.01;
              if (fxRewardDelta !== 0) {
                const existingFxAdjustment = await tx.referralTransaction.findFirst({
                  where: {
                    referrerId: gift.user.referredById,
                    referredUserId: gift.user.id,
                    type: 'cash_gift_commission',
                    description: `FX adjustment for contribution ${existingContribution.id}`,
                  },
                });

                if (!existingFxAdjustment) {
                  await tx.user.update({
                    where: { id: gift.user.referredById },
                    data: { wallet: { increment: fxRewardDelta } },
                  });

                  await tx.referralTransaction.create({
                    data: {
                      referrerId: gift.user.referredById,
                      referredUserId: gift.user.id,
                      amount: fxRewardDelta,
                      type: 'cash_gift_commission',
                      description: `FX adjustment for contribution ${existingContribution.id}`,
                    },
                  });
                }
              }
            }
          });

          const refreshedContribution = await prisma.contribution.findUnique({
            where: { id: existingContribution.id },
          });

          return res.json({ 
            msg: 'Payment already processed', 
            contribution: refreshedContribution || existingContribution,
          });
        }

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
      
      if (gift.tier === 'vip' || gift.tier === 'royal') {
        // No commission for vip/royal events
        commission = 0;
        amountReceived = amount;
      } else {
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
          // Standard 4% commission (updated from 5% per user request)
          commission = amount * 0.04;
          amountReceived = amount * 0.96;
        }
      }

      // Create contribution record
      const contribution = await prisma.contribution.create({
        data: {
          giftId,
          wishlistItemId: wishlistItemId ? parseInt(wishlistItemId, 10) : null,
          contributorName: contributorName || 'Anonymous',
          contributorEmail: contributorEmail || '',
          amount,
          currency: txCurrency,
          commission,
          isAsoebi: !!isAsoebi,
          asoebiQuantity: isAsoebi ? asoebiTotalQty : (asoebiQuantity ? parseInt(asoebiQuantity, 10) : 0),
          asoebiQtyMen: asoebiQtyMen ? parseInt(asoebiQtyMen, 10) : 0,
          asoebiQtyWomen: asoebiQtyWomen ? parseInt(asoebiQtyWomen, 10) : 0,
          asoebiBrideMenQty: asoebiBrideMenQty ? parseInt(asoebiBrideMenQty, 10) : 0,
          asoebiBrideWomenQty: asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty, 10) : 0,
          asoebiGroomMenQty: asoebiGroomMenQty ? parseInt(asoebiGroomMenQty, 10) : 0,
          asoebiGroomWomenQty: asoebiGroomWomenQty ? parseInt(asoebiGroomWomenQty, 10) : 0,
          asoebiItemsDetails: isAsoebi ? (asoebiItemsDetails || undefined) : (paymentMeta ? { paymentMeta } : undefined),
          message: contributorMessage || (isAsoebi ? `Asoebi Payment${asoebiType ? ` (${asoebiType})` : ''}` : ''),
          transactionId: transactionIdCandidates[0] || undefined,
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

      // Update wishlist item purchased count
      if (wishlistItemId) {
        try {
          await prisma.wishlistItem.update({
            where: { id: parseInt(wishlistItemId, 10) },
            data: {
              purchased: { increment: 1 }
            }
          });
          console.log(`✅ Updated wishlist item purchased count incremented for item ${wishlistItemId}`);
        } catch (err) {
          console.error(`❌ Failed to update wishlist item purchased count for item ${wishlistItemId}:`, err);
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
        currency: emailCurrency,
        baseAmount: emailBaseAmount,
      }).catch(err => console.error('Background gift received email failed:', err));
      
      // Send thank you email to contributor if email provided
      if (contributorEmail) {
        sendContributorThankYouEmail({
          recipientEmail: contributorEmail,
          contributorName: contributorName || 'Anonymous',
          amount,
          gift: gift,
          isAsoebi,
          currency: emailCurrency,
          baseAmount: emailBaseAmount,
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
        return res.status(500).send('Internal Server Error: Missing Raw Body');
      }

      if (!paystack.verifyWebhookSignature(payloadBuffer, signature, secret)) {
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

        const isPremiumRef = String(reference || '').startsWith('premium-');
        const isTemplateRef = String(reference || '').startsWith('template-premium-');

        if (isPremiumRef || isTemplateRef) {
          console.log('=== PROCESSING PREMIUM/TEMPLATE PAYMENT VIA WEBHOOK ===');
          const response = await paystack.verifyTransaction(reference);
          const meta = response.data?.metadata || {};
          const type = meta.type === 'template_premium_upgrade' ? 'template' : 'event';
          const templateKey = meta.template ? String(meta.template).toLowerCase() : null;
          const giftId = meta.giftId ? parseInt(meta.giftId, 10) : null;

          console.log('Premium/Template webhook details:', { reference, type, templateKey, giftId });

          if (!giftId) {
            console.error('No giftId in premium webhook meta');
            return res.status(200).send('OK');
          }

          const gift = await prisma.gift.findUnique({
            where: { id: giftId },
            include: { user: true }
          });
          if (!gift) {
            console.error('Gift not found for premium webhook:', giftId);
            return res.status(200).send('OK');
          }

          if (type === 'template') {
            if (!templateKey) {
              console.error('Missing template key for template premium webhook');
              return res.status(200).send('OK');
            }

            const existingPurchase = await prisma.templatePurchase.findFirst({
              where: { transactionId: reference }
            });

            if (existingPurchase && existingPurchase.status === 'success') {
              console.log('Template purchase already processed:', existingPurchase.id);
              return res.status(200).send('OK');
            }

            const templateAmount = 30000;
            const [updatedPurchase] = await prisma.$transaction([
              prisma.templatePurchase.upsert({
                where: { giftId_template: { giftId, template: templateKey } },
                update: {
                  userId: gift.userId,
                  amount: templateAmount,
                  transactionId: reference,
                  status: 'success'
                },
                create: {
                  userId: gift.userId,
                  giftId,
                  template: templateKey,
                  amount: templateAmount,
                  transactionId: reference,
                  status: 'success'
                }
              })
            ]);

            console.log('✅ Template premium payment verified via webhook:', updatedPurchase.id);

            sendGiftReceivedEmail({
              recipientEmail: gift.user.email,
              recipientName: gift.user.name,
              contributorName: gift.user.name || 'Event Owner',
              amount: templateAmount,
              gift: gift,
              message: `Premium template "${templateKey}" unlocked`,
              isAsoebi: false,
              currency: 'NGN',
              baseAmount: templateAmount,
            }).catch(err => console.error('Background template premium email failed:', err));

            return res.status(200).send('OK');
          }

          const existingPayment = await prisma.premiumPayment.findFirst({
            where: { transactionId: reference }
          });

          if (existingPayment && existingPayment.status === 'success') {
            console.log('Premium payment already processed:', existingPayment.id);
            return res.status(200).send('OK');
          }

          const [updatedPayment] = await prisma.$transaction([
            prisma.premiumPayment.upsert({
              where: { giftId },
              update: {
                userId: gift.userId,
                amount: 50000,
                transactionId: reference,
                status: 'success'
              },
              create: {
                userId: gift.userId,
                giftId,
                amount: 50000,
                transactionId: reference,
                status: 'success'
              }
            }),
            prisma.gift.update({
              where: { id: giftId },
              data: { tier: 'royal' }
            })
          ]);

          console.log('✅ Royal payment verified via webhook:', updatedPayment.id);

          sendGiftReceivedEmail({
            recipientEmail: gift.user.email,
            recipientName: gift.user.name,
            contributorName: gift.user.name || 'Event Owner',
            amount: 50000,
            gift: gift,
            message: 'Royal Upgrade activated',
            isAsoebi: false,
            currency: 'NGN',
            baseAmount: 50000,
          }).catch(err => console.error('Background royal gift received email failed:', err));

          return res.status(200).send('OK');
        }

        console.log('Verifying transaction with Paystack...');
        // Verify transaction
        const response = await paystack.verifyTransaction(reference);
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
        const emailCurrency = String(response?.data?.currency || response?.data?.metadata?.currency || 'NGN').toUpperCase();
        const emailBaseAmount = Number(response?.data?.amount / 100);

        // Deduct commission or not if premium
        let commission;
        let amountReceived;
        
        if (gift.tier === 'vip' || gift.tier === 'royal') {
          commission = 0;
          amountReceived = amountInNaira;
        } else {
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
        }

        console.log('Creating contribution...');
        // Create contribution
        const contribution = await prisma.contribution.create({
          data: {
            giftId,
            contributorName: contributorName || 'Anonymous',
            contributorEmail: contributorEmail || '',
            amount: amountInNaira,
            currency: 'NGN',
            commission,
            isAsoebi: !!isAsoebi,
            asoebiQuantity: asoebiQuantity ? parseInt(asoebiQuantity, 10) : 0,
            asoebiQtyMen: asoebiQtyMen ? parseInt(asoebiQtyMen, 10) : 0,
            asoebiQtyWomen: asoebiQtyWomen ? parseInt(asoebiQtyWomen, 10) : 0,
            asoebiBrideMenQty: asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty, 10) : 0,
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
          currency: emailCurrency,
          baseAmount: emailBaseAmount,
        }).catch(err => console.error('Background gift received email failed:', err));
        
        // Send thank you email to contributor if email provided
        if (contributorEmail) {
          sendContributorThankYouEmail({
            recipientEmail: contributorEmail,
            contributorName: contributorName || 'Anonymous',
            amount: amountInNaira,
            gift: gift,
            isAsoebi,
            currency: emailCurrency,
            baseAmount: emailBaseAmount,
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

  // Webhook for Flutterwave
  router.post('/webhook/flutterwave', async (req, res) => {
    try {
      console.log('=== FLUTTERWAVE WEBHOOK RECEIVED ===');
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));

      const secret = process.env.FLW_SECRET_KEY;
      const signature = req.headers['verif-hash'];

      if (!secret) {
        console.error('FLW_SECRET_KEY not set');
        return res.status(500).send('Server error');
      }

      const payloadBuffer = req.rawBody;
      if (!payloadBuffer) {
        console.error('❌ Webhook Error: rawBody is missing. Check server.js middleware.');
        return res.status(500).send('Internal Server Error: Missing Raw Body');
      }

      if (!flutterwave.verifyWebhookSignature(payloadBuffer, signature, secret)) {
        console.error('❌ Invalid Flutterwave webhook signature');
        return res.status(401).send('Unauthorized');
      }

      console.log('✓ Flutterwave webhook signature verified successfully');

      const event = req.body;
      console.log('=== FLUTTERWAVE WEBHOOK EVENT ===');
      console.log('Event type:', event.event);
      console.log('Event data:', JSON.stringify(event.data, null, 2));

      const successfulEvents = new Set([
        'charge.completed',
        'card.charge.completed',
        'account.charge.completed',
        'mobilemoney.charge.completed',
        'transfer.completed',
        'transfer successful',
        'successful'
      ]);

      if (!successfulEvents.has(event.event)) {
        console.log('Ignoring non-successful event:', event.event);
        return res.status(200).send('OK');
      }

      const data = event.data || {};
      const txRef = data.tx_ref || data.reference;
      const transactionIdCandidates = [
        data.id?.toString?.(),
        txRef
      ].filter(Boolean);

      const existingContribution = await prisma.contribution.findFirst({
        where: {
          OR: transactionIdCandidates.map((id) => ({ transactionId: id })),
        },
      });

      if (existingContribution) {
        console.log('Contribution already exists:', existingContribution.id);
        return res.status(200).send('OK');
      }

      const meta = data.meta || {};
      const { giftId: giftIdRaw, contributorName, contributorEmail, message: contributorMessage, isAsoebi, guestId, asoebiType, asoebiSelection, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItemsDetails, wishlistItemId } = meta;
      const giftId = giftIdRaw ? parseInt(giftIdRaw, 10) : null;

      if (!giftId) {
        console.error('No giftId in Flutterwave webhook meta');
        return res.status(200).send('OK');
      }

      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
        include: { user: true }
      });

      if (!gift) {
        console.error('Gift not found:', giftId);
        return res.status(200).send('OK');
      }

      const txCurrency = String(data.currency || meta.currency || 'NGN').toUpperCase();
      const chargedAmount = Number(data.charged_amount ?? 0);
      const baseAmount = Number(data.amount ?? 0);
      const rawAmount = Number.isFinite(baseAmount) && baseAmount > 0 ? baseAmount : chargedAmount;

      let amount = rawAmount;
      let currency = txCurrency;

      if (txCurrency !== 'NGN') {
        const settledCurrency = String(data.settlement_currency || data.settled_currency || '').toUpperCase();
        const settledAmount = Number(data.amount_settled ?? 0);

        if (Number.isFinite(settledAmount) && settledAmount > 0 && settledCurrency === 'NGN') {
          amount = settledAmount;
        }
      }

      const amountNum = Number(amount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        console.error('Invalid amount in Flutterwave webhook:', amount);
        return res.status(200).send('OK');
      }

      let commission;
      let amountReceived;
      if (gift.tier === 'vip' || gift.tier === 'royal') {
        commission = 0;
        amountReceived = amountNum;
      } else {
        commission = amountNum * 0.04;
        amountReceived = amountNum * 0.96;
      }

      const contribution = await prisma.contribution.create({
        data: {
          giftId,
          wishlistItemId: wishlistItemId ? parseInt(wishlistItemId, 10) : null,
          contributorName: contributorName || 'Anonymous',
          contributorEmail: contributorEmail || '',
          amount: amountNum,
          currency: currency,
          commission,
          isAsoebi: !!isAsoebi,
          asoebiQuantity: isAsoebi ? (parseInt(asoebiQuantity || '0', 10) || 1) : 0,
          asoebiQtyMen: asoebiQtyMen ? parseInt(asoebiQtyMen, 10) : 0,
          asoebiQtyWomen: asoebiQtyWomen ? parseInt(asoebiQtyWomen, 10) : 0,
          asoebiBrideMenQty: asoebiBrideMenQty ? parseInt(asoebiBrideMenQty, 10) : 0,
          asoebiBrideWomenQty: asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty, 10) : 0,
          asoebiGroomMenQty: asoebiGroomMenQty ? parseInt(asoebiGroomMenQty, 10) : 0,
          asoebiGroomWomenQty: asoebiGroomWomenQty ? parseInt(asoebiGroomWomenQty, 10) : 0,
          asoebiItemsDetails: asoebiItemsDetails || undefined,
          message: contributorMessage || (isAsoebi ? `Asoebi Payment${asoebiType ? ` (${asoebiType})` : ''}` : ''),
          transactionId: transactionIdCandidates[0] || undefined,
          status: 'completed',
        },
      });

      console.log('✅ Flutterwave webhook contribution created:', contribution.id);

      await prisma.user.update({
        where: { id: gift.userId },
        data: { wallet: { increment: amountReceived } },
      });

      sendGiftReceivedEmail({
        recipientEmail: gift.user.email,
        recipientName: gift.user.name,
        contributorName: contributorName || 'Anonymous',
        amount: amountNum,
        gift: gift,
        message: contributorMessage || '',
        isAsoebi,
        currency: txCurrency,
        baseAmount: baseAmount,
      }).catch(err => console.error('Background gift received email failed:', err));

      if (contributorEmail) {
        sendContributorThankYouEmail({
          recipientEmail: contributorEmail,
          contributorName: contributorName || 'Anonymous',
          amount: amountNum,
          gift: gift,
          isAsoebi,
          currency: txCurrency,
          baseAmount: baseAmount,
        }).catch(err => console.error('Background contributor thank you email failed:', err));
      }

      res.status(200).send('OK');
    } catch (err) {
      console.log('=== FLUTTERWAVE WEBHOOK ERROR ===');
      console.error('Error message:', err?.message || err);
      console.error('Full error:', err);
      res.status(500).send('Server error');
    }
  });

  // Submit a note/wish (0 amount contribution)
  router.post('/note/submit', async (req, res) => {
    const { contributorName, contributorEmail, message, shareLink } = req.body;

    try {
      const gift = await prisma.gift.findUnique({ 
        where: { shareLink: shareLink },
        include: { user: true }
      });
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      if (!gift.enableGuestNotes) {
        return res.status(400).json({ msg: 'Guest notes are disabled for this event' });
      }

      // Save the wish as a contribution with 0 amount
      const contribution = await prisma.contribution.create({
        data: {
          giftId: gift.id,
          contributorName: contributorName || 'Anonymous',
          contributorEmail: contributorEmail || '',
          amount: 0,
          currency: 'NGN',
          message: message,
          status: 'completed',
        },
      });

      console.log('💾 Wish/Note saved as contribution:', contribution.id);

      // Only send notification email for the first wish (amount 0) per gift
      const existingWishesCount = await prisma.contribution.count({
        where: {
          giftId: gift.id,
          amount: 0,
        },
      });

      if (existingWishesCount === 1) {
        // Send gift received email to owner for the first wish (amount 0)
        sendGiftReceivedEmail({
          recipientEmail: gift.user.email,
          recipientName: gift.user.name,
          contributorName: contributorName || 'Anonymous',
          amount: 0,
          gift: gift,
          message: message,
          isAsoebi: false,
        }).catch(err => console.error('Background wish notification email failed:', err));
        console.log(`📧 First wish notification email sent to owner ${gift.user.email}`);
      } else {
        console.log(`ℹ️ Subsequent wish received, skipping email notification (Wishes count: ${existingWishesCount})`);
      }

      res.json({ msg: 'Note sent successfully', contribution });
    } catch (err) {
      console.error('Submit note error:', err);
      res.status(500).json({ msg: 'Server error' });
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
          currency: 'NGN',
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
          currency: 'NGN',
          baseAmount: amount,
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
