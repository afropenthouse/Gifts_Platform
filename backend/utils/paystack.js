// Create a transfer recipient
async function createTransferRecipient({ account_number, account_bank, name }) {
  const payload = {
    type: 'nuban',
    name,
    account_number,
    bank_code: account_bank,
    currency: 'NGN',
  };
  const response = await psRequest('POST', '/transferrecipient', payload);
  return response;
}
const crypto = require('crypto');

// Minimal REST helper using Node 18+ global fetch
async function psRequest(method, path, body) {
  const baseUrl = 'https://api.paystack.co';
  const sec = process.env.PAYSTACK_SECRET_KEY;

  if (!sec) {
    const msg = 'Paystack secret key missing. Set PAYSTACK_SECRET_KEY in .env';
    const err = new Error(msg);
    err.code = 'PS_SECRET_MISSING';
    throw err;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${sec}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.message || `Paystack API ${method} ${path} failed`);
    err.data = json;
    throw err;
  }
  return json;
}

async function initializePayment(payload) {
  try {
    // Safely log minimal identifying info
    try {
      const safeEmail = payload?.email || payload?.customer?.email || payload?.metadata?.contributorEmail || '***';
      console.log('Initializing Paystack payment with payload:', {
        reference: payload?.reference || payload?.tx_ref,
        amount: payload?.amount,
        email: safeEmail,
      });
    } catch (e) {
      console.log('Initializing Paystack payment (unable to fully inspect payload)');
    }

    // Accept multiple payload shapes used across the app
    const reference = payload?.tx_ref || payload?.reference || payload?.ref;
    const email = payload?.email || payload?.customer?.email || payload?.metadata?.contributorEmail;

    // Amount: prefer integer kobo if provided, otherwise convert NGN to kobo
    let amount = payload?.amount;
    if (amount == null) throw new Error('Missing amount in payment payload');

    // If amount is not an integer (e.g., 50.5), assume it's NGN and convert to kobo
    if (!Number.isInteger(amount)) {
      amount = Math.round(Number(amount) * 100);
    }

    const callback_url = payload?.callback_url || payload?.redirect_url || payload?.callbackUrl;
    const metadata = payload?.metadata || payload?.meta || {};

    const psPayload = {
      email,
      amount, // already in kobo
      reference,
      callback_url,
      metadata,
      channels: ['bank_transfer', 'card', 'ussd', 'qr', 'mobile_money', 'bank'],
    };

    const response = await psRequest('POST', '/transaction/initialize', psPayload);
    console.log('Paystack payment initialization response:', response?.status);
    return response;
  } catch (error) {
    console.error('Paystack Payment.initialize error:', error?.message || error);
    throw error;
  }
}

async function verifyTransaction(reference) {
  try {
    console.log('Verifying Paystack transaction:', reference);

    const response = await psRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
    console.log('Paystack transaction verify response:', response?.status);
    return response;
  } catch (error) {
    console.error('Paystack Transaction.verify error:', error?.message || error);
    throw error;
  }
}

async function initiateTransfer(payload) {
  try {
    console.log('Initiating Paystack transfer with payload:', {
      ...payload,
      account_number: payload.account_number,
      amount: payload.amount
    });

    // Paystack transfer payload
    const psPayload = {
      source: 'balance',
      amount: payload.amount * 100, // in kobo
      recipient: payload.recipient_code, // Assuming recipient_code is provided
      reason: payload.narration || 'Transfer'
    };

    const response = await psRequest('POST', '/transfer', psPayload);
    console.log('Paystack transfer initiation response:', response?.status);
    return response;
  } catch (error) {
    console.error('Paystack Transfer.initiate error:', error?.message || error);
    throw error;
  }
}

async function resolveAccount(payload) {
  try {
    console.log('Resolving Paystack account:', { account_bank: payload.account_bank, account_number: payload.account_number });

    const response = await psRequest('GET', `/bank/resolve?account_number=${payload.account_number}&bank_code=${payload.account_bank}`);

    console.log('Paystack account resolve response:', response?.status);
    return response;
  } catch (error) {
    console.error('Paystack resolveAccount error:', error?.message || error);
    throw error;
  }
}

async function getBanks() {
  try {
      // console.log('Fetching Paystack banks list');
        
      const response = await psRequest('GET', '/bank?country=nigeria');

      // console.log('Paystack banks fetch response:', response?.status);
    return response;
  } catch (error) {
    console.error('Paystack getBanks error:', error?.message || error);
    throw error;
  }
}

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return signature === expectedSignature;
}

module.exports = { initializePayment, verifyTransaction, initiateTransfer, resolveAccount, getBanks, verifyWebhookSignature, createTransferRecipient };