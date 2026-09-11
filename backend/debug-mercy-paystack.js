const prisma = require('./prismaClient');

async function main() {
  const transfers = [
    { label: 'W93 (48000)', id: '1032486261' },
    { label: 'W90 (9600)', id: '1025669272' },
    { label: 'W89 (5760)', id: '1022339836' },
    { label: 'W78 (960)', id: '1011586998' },
  ];
  const sec = process.env.PAYSTACK_SECRET_KEY;
  for (const t of transfers) {
    try {
      const r = await fetch(`https://api.paystack.co/transfer/${t.id}`, { headers: { Authorization: `Bearer ${sec}` } });
      const json = await r.json();
      const d = json.data || {};
      console.log(`${t.label} | api_ok=${r.ok} | transfer_status=${d.transfer_status} | amount=${d.amount} (${d.amount ? d.amount/100 : 0} NGN) | reference=${d.reference}`);
    } catch (e) {
      console.log(`${t.label} | ERROR ${e.message}`);
    }
  }
}

main().finally(() => process.exit(0));
