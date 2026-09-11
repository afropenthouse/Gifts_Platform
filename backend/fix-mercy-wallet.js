const prisma = require('./prismaClient');

async function main() {
  const userId = 290; // Francis Anumudu

  const userBefore = await prisma.user.findUnique({ where: { id: userId } });
  console.log(`Before: wallet = ${userBefore.wallet}`);

  // Recompute the correct wallet = net contributions only (user confirmed no withdrawals are real)
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

  const vendorFundingSum = await prisma.vendorPaymentFunding.aggregate({
    where: { userId, method: 'wallet', status: 'funded' },
    _sum: { amount: true }
  });

  const totalNet = (parseFloat(contributionsSum._sum.amount) || 0)
    - (parseFloat(contributionsSum._sum.commission) || 0)
    + (parseFloat(referralSum._sum.amount) || 0);

  const totalOut = (parseFloat(vendorFundingSum._sum.amount) || 0); // withdrawals to be voided below

  const correctWallet = totalNet - totalOut; // 64320 - 0 = 64320

  // Void the 3 withdrawal records the user confirms were not real withdrawals.
  // Status -> 'failed' so they are excluded from the /recalculate-wallet formula
  // (which sums status IN ['completed','pending']) and hidden from the UI
  // (GET /withdrawals filters status != 'failed').
  const voidUpdate = await prisma.withdrawal.updateMany({
    where: { userId, status: 'completed' },
    data: { status: 'failed' }
  });
  console.log(`Withdrawals voided (completed -> failed): ${voidUpdate.count}`);

  // Set wallet to the correct net value
  const userAfter = await prisma.user.update({
    where: { id: userId },
    data: { wallet: correctWallet }
  });

  console.log(`After: wallet = ${userAfter.wallet}`);
  console.log(`Credited delta: ${Number(userAfter.wallet) - Number(userBefore.wallet)}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
