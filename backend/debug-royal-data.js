const prisma = require('./prismaClient');

async function main() {
  const user = await prisma.user.findUnique({ where: { id: 290 } });
  console.log(`CURRENT wallet: ${user.wallet}`);

  const ws = await prisma.$queryRaw`SELECT id, amount, status, "transferId", reference, "createdAt" FROM "Withdrawal" WHERE "userId" = 290 ORDER BY "createdAt" DESC`;
  console.log('\nALL withdrawal records (current):');
  for (const w of ws) {
    console.log(`  W${w.id} | amount=${w.amount} | status=${w.status} | transferId=${w.transferId} | ref=${w.reference} | date=${new Date(w.createdAt).toISOString().split('T')[0]}`);
  }
  const completedSum = ws.filter(w => String(w.status) === 'completed').reduce((s, w) => s + parseFloat(w.amount), 0);
  const failedSum = ws.filter(w => String(w.status) === 'failed').reduce((s, w) => s + parseFloat(w.amount), 0);
  const pendingSum = ws.filter(w => String(w.status) === 'pending').reduce((s, w) => s + parseFloat(w.amount), 0);
  console.log(`\nSum completed: ${completedSum} | failed: ${failedSum} | pending: ${pendingSum} | count: ${ws.length}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
