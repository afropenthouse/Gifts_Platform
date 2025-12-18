const Flutterwave = require('flutterwave-node-v3');

function getClient() {
  const pub = process.env.FLW_PUBLIC_KEY;
  const sec = process.env.FLW_SECRET_KEY;
  if (!pub || !sec) {
    const msg = 'Flutterwave keys missing. Set FLW_PUBLIC_KEY and FLW_SECRET_KEY in .env';
    const err = new Error(msg);
    err.code = 'FLW_KEYS_MISSING';
    throw err;
  }
  return new Flutterwave(pub, sec);
}

async function initializePayment(payload) {
  const flw = getClient();
  // SDK method is Payment.initialize
  return await flw.Payment.initialize(payload);
}

async function verifyTransaction(id) {
  const flw = getClient();
  return await flw.Transaction.verify({ id });
}

module.exports = { initializePayment, verifyTransaction };
