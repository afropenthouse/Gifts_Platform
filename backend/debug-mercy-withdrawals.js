const prisma = require('./prismaClient');

async function main() {
  const userId = 290;

  console.log('=== FULL WITHDRAWAL RECORDS (userId 290) ===');
  const ws = await prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(ws, null, 2));

  // Also check contributions around the withdrawal dates and their wallet-credit behavior
  console.log('\n=== CONTRIBUTIONS with transactionId (paid via Paystack) ===');
  const cs = await prisma.contribution.findMany({
    where: { giftId: 220 },
    select: { id: true, amount: true, commission: true, isAsoebi: true, status: true, transactionId: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });
  for (const c of cs) {
    console.log(`C${c.id} | amount=${c.amount} | commission=${c.commission} | net=${c.amount - c.commission} | isAsoebi=${c.isAsoebi} | status=${c.status} | tx=${c.transactionId} | date=${c.createdAt.toISOString().split('T')[0]}`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
