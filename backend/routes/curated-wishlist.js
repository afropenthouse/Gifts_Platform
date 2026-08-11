const express = require('express');
const prisma = require('../prismaClient');
const paystack = require('../utils/paystack');
const flutterwave = require('../utils/flutterwave');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/curated-wishlist.json');

function readCuratedWishlist() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading curated wishlist:', err);
    return [];
  }
}

function writeCuratedWishlist(items) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
  } catch (err) {
    console.error('Error writing curated wishlist:', err);
  }
}

async function getBethereGift() {
  let gift = await prisma.gift.findFirst({
    where: { title: 'BeThere Curated Wishlist' },
    include: { user: true }
  });

  if (!gift) {
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found in database. Please create a user first.');
    }

    gift = await prisma.gift.create({
      data: {
        userId: user.id,
        type: 'other',
        title: 'BeThere Curated Wishlist',
        shareLink: 'bethere-curated-wishlist',
      },
      include: { user: true }
    });
  }

  return gift;
}

router.get('/', async (req, res) => {
  try {
    const items = readCuratedWishlist();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/initialize-payment', async (req, res) => {
  const { contributorName, contributorEmail, amount, message, currency: currencyRaw, itemId, wishlistShareLink } = req.body;

  try {
    const gift = await getBethereGift();
    const items = readCuratedWishlist();
    const item = items.find(i => i.id === parseInt(itemId));

    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }

    const currency = String(currencyRaw || 'NGN').toUpperCase();
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ msg: 'Invalid amount' });
    }

    if (currency === 'NGN' && parsedAmount < 1000) {
      return res.status(400).json({ msg: 'Minimum amount is ₦1000' });
    }
    if (currency !== 'NGN' && parsedAmount < 10) {
      return res.status(400).json({ msg: `Minimum amount is ${currency} 10` });
    }

    const tx_ref = `curated-${item.id}-${Date.now()}`;
    const redirectUrl = wishlistShareLink
      ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wishlist/${wishlistShareLink.replace('wishlist/', '')}?curated=true`
      : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/`;

    const metadata = {
      giftId: gift.id,
      giftLink: gift.shareLink,
      contributorName,
      contributorEmail,
      message: message || `Contribution to: ${item.name}`,
      currency,
      itemId: parseInt(itemId),
      isCurated: true,
      customizations: {
        title: `Contribution to ${gift.user.name}'s Curated Wishlist`,
        description: item.name,
      }
    };

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
    res.status(500).json({ msg: 'Failed to initialize payment', error: err?.message || 'Server error' });
  }
});

router.post('/verify-payment', async (req, res) => {
  const { transactionId, txRef, status } = req.body;

  try {
    console.log('\n=== VERIFY CURATED PAYMENT START ===');
    console.log('Transaction ID:', transactionId, 'TxRef:', txRef, 'Status:', status);

    let provider = 'flutterwave';
    let response;

    try {
      console.log('Attempting Flutterwave verification with transactionId:', transactionId);
      response = await flutterwave.verifyTransaction(transactionId);
    } catch (flutterwaveErr) {
      try {
        console.log('Flutterwave failed, attempting Paystack verification');
        provider = 'paystack';
        response = await paystack.verifyTransaction(transactionId);
        if (!response?.status || response?.data?.status !== 'success') {
          throw new Error('Paystack verification did not return success');
        }
      } catch (paystackErr) {
        if (txRef && txRef !== transactionId) {
          try {
            console.log('Retrying Flutterwave with txRef:', txRef);
            provider = 'flutterwave';
            response = await flutterwave.verifyTransaction(txRef);
          } catch (flutterwaveErr2) {
            try {
              console.log('Retrying Paystack with txRef:', txRef);
              provider = 'paystack';
              response = await paystack.verifyTransaction(txRef);
              if (!response?.status || response?.data?.status !== 'success') {
                throw new Error('Paystack verification did not return success');
              }
            } catch (paystackErr2) {
              console.error('Payment verification failed:', paystackErr2?.message || paystackErr2);
              return res.status(400).json({
                msg: 'Payment verification failed',
                error: paystackErr2?.message || 'Could not verify transaction',
              });
            }
          }
        } else {
          console.error('Payment verification failed:', paystackErr?.message || paystackErr);
          return res.status(400).json({
            msg: 'Payment verification failed',
            error: paystackErr?.message || 'Could not verify transaction',
          });
        }
      }
    }

    const isPaystackSuccess = provider === 'paystack' && !!response?.status && response?.data?.status === 'success';
    const flutterwaveDataStatus = String(response?.data?.status || '').toLowerCase();
    const isFlutterwaveSuccess = provider === 'flutterwave' && response?.status === 'success' && (
      flutterwaveDataStatus === 'successful' || flutterwaveDataStatus === 'success' || flutterwaveDataStatus === 'completed'
    );

    if (!isPaystackSuccess && !isFlutterwaveSuccess) {
      console.error('Payment verification failed - not successful');
      return res.status(400).json({
        msg: 'Payment verification failed',
        details: `Provider: ${provider}, Status: ${response?.status}, Data Status: ${response?.data?.status}`
      });
    }

    const meta = provider === 'paystack' ? (response.data.metadata || {}) : (response.data.meta || {});
    const { contributorName, contributorEmail, message: contributorMessage, currency: metaCurrency, itemId } = meta;
    const txCurrency = String(provider === 'paystack' ? (response.data.currency || metaCurrency || 'NGN') : (response?.data?.currency || metaCurrency || 'NGN')).toUpperCase();

    let amount;
    if (provider === 'paystack') {
      amount = parseFloat((response.data.amount / 100).toFixed(2));
    } else {
      const rawAmount = Number(response?.data?.amount ?? 0);
      amount = rawAmount;
    }

    const transactionIdCandidates = provider === 'paystack'
      ? [response?.data?.id?.toString?.(), response?.data?.reference].filter(Boolean)
      : [response?.data?.id?.toString?.(), response?.data?.tx_ref].filter(Boolean);

    const existingContribution = await prisma.contribution.findFirst({
      where: {
        OR: transactionIdCandidates.map((id) => ({ transactionId: id })),
      }
    });

    if (existingContribution) {
      console.log('Contribution already exists:', existingContribution.id);
      return res.json({ msg: 'Payment already processed', contribution: existingContribution });
    }

    const gift = await getBethereGift();

    const contribution = await prisma.contribution.create({
      data: {
        giftId: gift.id,
        contributorName: contributorName || 'Anonymous',
        contributorEmail: contributorEmail || '',
        amount,
        currency: txCurrency,
        message: contributorMessage || '',
        transactionId: transactionIdCandidates[0] || undefined,
        status: 'completed',
      },
    });

    const items = readCuratedWishlist();
    const itemIndex = items.findIndex(i => i.id === parseInt(itemId));
    if (itemIndex !== -1) {
      items[itemIndex].raised = (items[itemIndex].raised || 0) + amount;
      items[itemIndex].contributorCount = (items[itemIndex].contributorCount || 0) + 1;
      writeCuratedWishlist(items);
    }

    console.log('✅ Curated contribution saved:', contribution.id, 'Amount:', amount);
    console.log('=== VERIFY CURATED PAYMENT SUCCESS ===\n');

    res.json({ msg: 'Payment verified and contribution recorded', contribution });
  } catch (err) {
    console.error('Verify payment error:', err?.message || err);
    res.status(500).json({
      msg: 'Payment verification failed',
      error: err?.message || 'Server error'
    });
  }
});

module.exports = () => router;
