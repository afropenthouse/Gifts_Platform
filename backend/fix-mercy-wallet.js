const prisma = require('./prismaClient');

async function main() {
  const userId = 290; // Francis Anumudu

  const user = await prisma.user.findUnique({ where: { id: userId } });
  console.log(`Before: wallet = ${user.wallet}`);

  // Restore the 3 withdrawal records the user confirmed are real (failed -> completed).
  // (They were erroneously voided earlier when we wrongly believed "no withdrawals".)
  const restored = await prisma.withdrawal.updateMany({
    where: { userId, status: 'failed' },
    data: { status: 'completed' }
  });
  console.log(`Withdrawals restored to completed: ${restored.count}`);

  // Recompute wallet exactly like /api/users/recalculate-wallet
  const gifts = await prisma.gift.findMany({ where: { userId }, select: { id: true } });
  const giftIds = gifts.map(g => g.id);

  const contributionsSum = await prisma.contribution.aggregate({
    where: { giftId: { in: giftIds }, status: 'completed' },
    _sum: { amount: true, commission: true }
  });
  const referralSum = await prisma.referralTransaction.aggregate({
    where: { referrerId: userId },
    _sum: { amount: true }
  });
  const withdrawalsSum = await prisma.withdrawal.aggregate({
    where: { userId, status: { in: ['completed', 'pending'] } },
    _sum: { amount: true }
  });
  const vendorFundingSum = await prisma.vendorPaymentFunding.aggregate({
    where: { userId, method: 'wallet', status: 'funded' },
    _sum: { amount: true }
  });

  const totalIn = (parseFloat(contributionsSum._sum.amount) || 0)
    - (parseFloat(contributionsSum._sum.commission) || 0)
    + (parseFloat(referralSum._sum.amount) || 0);
  const totalOut = (parseFloat(withdrawalsSum._sum.amount) || 0)
    + (parseFloat(vendorFundingSum._sum.amount) || 0);
  const correctWallet = totalIn - totalOut;

  console.log('Breakdown:');
  console.log('  contributions gross:', contributionsSum._sum.amount, 'commission:', contributionsSum._sum.commission);
  console.log('  referrals:', referralSum._sum.amount);
  console.log('  withdrawals (completed+pending):', withdrawalsSum._sum.amount, '->', withdrawalsSum._sum);
  console.log('  vendor fundings:', vendorFundingSum._sum);
  console.log('  totalIn:', totalIn, 'totalOut:', totalOut, 'correctWallet:', correctWallet);

  const updated = await prisma.user.update({ where: { id: userId }, data: { wallet: correctWallet } });
  console.log(`After: wallet = ${updated.wallet}`);
  console.log(`Delta applied: ${Number(updated.wallet) - Number(user.wallet)}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
