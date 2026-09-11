require('dotenv').config();
const paystack = require('./utils/paystack');

async function main() {
  const transferIds = ['1025669272', '1022339836', '1011586998'];
  for (const id of transferIds) {
    try {
      const res = await paystack.initiateTransfer; // placeholder, use raw request instead
      // direct fetch via psRequest not exported; use fetch with Paystack secret
      const sec = process.env.PAYSTACK_SECRET_KEY;
      const r = await fetch(`https://api.paystack.co/transfer/${id}`, {
        headers: { 'Authorization': `Bearer ${sec}` },
      });
      const json = await r.json();
      const d = json.data || {};
      console.log(`Transfer ${id}: status=${r.ok} | transfer_status=${d.transfer_status || d.status} | amount=${d.amount} | fee=${d.fee} | reference=${d.reference} | recipient=${d.recipient} | createdAt=${d.created_at} | updatedAt=${d.updated_at} | message=${json.message}`);
    } catch (e) {
      console.log(`Transfer ${id}: ERROR ${e.message}`);
    }
  }
}

// psRequest is internal; use direct fetch with loaded env
main().finally(() => process.exit(0));
