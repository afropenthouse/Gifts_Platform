const Flutterwave = require('flutterwave-node-v3');

function getClient() {
  const pub = process.env.FLW_PUBLIC_KEY;
  const sec = process.env.FLW_SECRET_KEY;
  
  console.log('Flutterwave keys check - Public Key exists:', !!pub, 'Secret Key exists:', !!sec);
  
  if (!pub || !sec) {
    const msg = 'Flutterwave keys missing. Set FLW_PUBLIC_KEY and FLW_SECRET_KEY in .env';
    const err = new Error(msg);
    err.code = 'FLW_KEYS_MISSING';
    throw err;
  }
  try {
    const flw = new Flutterwave(pub, sec);
    console.log('Flutterwave client created successfully');
    console.log('Flutterwave client keys:', Object.keys(flw || {}));
    return flw;
  } catch (error) {
    console.error('Error creating Flutterwave client:', error?.message || error);
    throw error;
  }
}

// Minimal REST helper using Node 18+ global fetch
async function fwRequest(method, path, body) {
  const baseUrl = 'https://api.flutterwave.com/v3';
  const sec = process.env.FLW_SECRET_KEY;

  if (!sec) {
    const msg = 'Flutterwave secret key missing. Set FLW_SECRET_KEY in .env';
    const err = new Error(msg);
    err.code = 'FLW_SECRET_MISSING';
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
    const err = new Error(json?.message || `Flutterwave API ${method} ${path} failed`);
    err.data = json;
    throw err;
  }
  return json;
}

async function initializePayment(payload) {
  try {
    console.log('Initializing payment with payload:', {
      ...payload,
      customer: { ...payload.customer, email: '***' }
    });

    // Use REST API directly for broad compatibility
    const response = await fwRequest('POST', '/payments', payload);
    console.log('Payment initialization response:', response?.status);
    return response;
  } catch (error) {
    console.error('Flutterwave Payment.initialize error:', error?.message || error);
    throw error;
  }
}

async function verifyTransaction(id) {
  try {
    console.log('Verifying transaction:', id);
    // Use REST API for verification
    const response = await fwRequest('GET', `/transactions/${id}/verify`);
    console.log('Transaction verify response:', response?.status);
    return response;
  } catch (error) {
    console.error('Flutterwave Transaction.verify error:', error?.message || error);
    throw error;
  }
}

async function initiateTransfer(payload) {
  try {
    console.log('Initiating transfer with payload:', {
      ...payload,
      account_bank: payload.account_bank,
      account_number: payload.account_number,
      amount: payload.amount
    });
    
    const flw = getClient();
    
    let response;
    if (typeof flw.Transfer !== 'undefined' && typeof flw.Transfer.initiate === 'function') {
      response = await flw.Transfer.initiate(payload);
    } else {
      throw new Error(`Flutterwave Transfer.initiate method not found. Available methods: ${Object.keys(flw).join(', ')}`);
    }
    
    console.log('Transfer initiation response:', response?.status);
    return response;
  } catch (error) {
    console.error('Flutterwave Transfer.initiate error:', error?.message || error);
    throw error;
  }
}

async function resolveAccount(payload) {
  try {
    console.log('Resolving account:', { account_bank: payload.account_bank, account_number: payload.account_number });
    
    const flw = getClient();
    
    let response;
    if (typeof flw.Misc !== 'undefined' && typeof flw.Misc.resolveAccount === 'function') {
      response = await flw.Misc.resolveAccount(payload);
    } else if (typeof flw.resolveAccount === 'function') {
      response = await flw.resolveAccount(payload);
    } else if (typeof flw.Transfer !== 'undefined' && typeof flw.Transfer.resolveAccount === 'function') {
      response = await flw.Transfer.resolveAccount(payload);
    } else {
      throw new Error(`Flutterwave resolveAccount method not found. Available methods: ${Object.keys(flw).join(', ')}`);
    }
    
    console.log('Account resolve response:', response?.status);
    return response;
  } catch (error) {
    console.error('Flutterwave resolveAccount error:', error?.message || error);
    throw error;
  }
}

module.exports = { initializePayment, verifyTransaction, initiateTransfer, resolveAccount };
