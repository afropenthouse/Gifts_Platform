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

// Static fallback list of Nigerian banks (CBN/NIBSS codes, as Paystack reports them).
// Used when the Paystack bank list API is unavailable or returns an empty result
// (e.g. /bank?country=ng returns no banks, or the request 504s), so that the
// Withdraw Funds bank dropdown always populates.
const NIGERIA_BANK_FALLBACK = [
  { name: 'Access Bank', code: '044' },
  { name: 'Access Bank (Diamond)', code: '063' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Coronation Merchant Bank', code: '559' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'FirstTrust Mortgage Bank Nigeria', code: '413' },
  { name: 'FSDH Merchant Bank Limited', code: '501' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Greenwich Merchant Bank', code: '562' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Lotus Bank', code: '303' },
  { name: 'NOVA BANK', code: '561' },
  { name: 'Parkway - ReadyCash', code: '311' },
  { name: 'Parallex Bank', code: '104' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'PremiumTrust Bank', code: '105' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Rand Merchant Bank', code: '502' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Suntrust Bank', code: '100' },
  { name: 'TAJ Bank', code: '302' },
  { name: 'Titan Bank', code: '102' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${sec}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const body = json?.message || json?.data || `Paystack API ${method} ${path} failed (status ${res.status})`;
      const err = new Error(body);
      err.status = res.status;
      err.data = json;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(timeoutId);
  }
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

    // Amount: convert NGN to kobo for Paystack
    let amount = payload?.amount;
    if (amount == null) throw new Error('Missing amount in payment payload');

    // Always convert to kobo since Paystack expects amounts in kobo
    // Check if amount is already in kobo (large numbers) or in NGN (smaller numbers)
    if (amount > 1000000) {
      // Amount is likely already in kobo, use as-is
      console.log('Amount appears to be in kobo:', amount);
    } else {
      // Amount is in NGN, convert to kobo
      amount = Math.round(Number(amount) * 100);
      console.log('Converted NGN to kobo:', amount);
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
    console.log('Paystack payment initialization response:', response);
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

async function verifyBVNMatch({ bvn, account_number, bank_code }) {
  try {
    console.log('Verifying BVN match for account:', { account_number, bank_code });
    
    // Paystack BVN Match API
    // Note: This requires specific permissions on your Paystack account
    const response = await psRequest('POST', '/bvn/match', {
      bvn,
      account_number,
      bank_code
    });

    console.log('Paystack BVN match response:', response?.status);
    return response;
  } catch (error) {
    console.error('Paystack verifyBVNMatch error:', error?.message || error);
    // If the error is that the feature is not enabled, we'll log it but maybe let it pass in dev
    // or return a specific error structure.
    throw error;
  }
}

async function getBanks(country = 'ng') {
  try {
    // NOTE: Paystack's /bank?country=ng endpoint has been observed to return an
    // empty bank list, while /bank?currency=NGN and the bare /bank endpoint
    // return the full Nigerian list. We try several variants and use the first
    // one that yields a non-empty, valid result.
    const endpoints = [
      `/bank?currency=${encodeURIComponent('NGN')}`,
      `/bank?country=${encodeURIComponent(country)}`,
      '/bank',
    ];
    let lastError;

    for (const path of endpoints) {
      try {
        const response = await psRequest('GET', path);
        if (response?.status && Array.isArray(response.data) && response.data.length > 0) {
          return response;
        }
      } catch (err) {
        lastError = err;
        console.error(`Paystack getBanks error for ${path}:`, err?.message || err);
      }
    }

    // All live attempts failed or returned empty results. Fall back to a
    // static Nigerian bank list so the Withdraw Funds feature still works.
    console.warn(
      'Paystack getBanks returned no results:',
      lastError ? lastError?.message || lastError : 'empty response'
    );
    return {
      status: true,
      message: 'Banks retrieved',
      data: NIGERIA_BANK_FALLBACK,
    };
  } catch (error) {
    console.error('Paystack getBanks error:', error?.message || error);
    // Last-resort fallback so the bank dropdown always populates.
    return {
      status: true,
      message: 'Banks retrieved',
      data: NIGERIA_BANK_FALLBACK,
    };
  }
}

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return signature === expectedSignature;
}

module.exports = { initializePayment, verifyTransaction, initiateTransfer, resolveAccount, getBanks, verifyWebhookSignature, createTransferRecipient, verifyBVNMatch };