const prisma = require('./prismaClient');

async function main() {
  const userId = 290; // Francis Anumudu

  const user = await prisma.user.findUnique({ where: { id: userId } });
  console.log('=== USER ===');
  console.log(`Name: ${user.name} | Email: ${user.email}`);
  console.log(`Current Wallet: ${user.wallet}`);
  console.log(`isActive: ${user.isActive}`);

  // All gifts for this user
  const gifts = await prisma.gift.findMany({
    where: { userId },
    select: { id: true, title: true, type: true, tier: true, createdAt: true, shareLink: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log('\n=== ALL GIFTS for user ===');
  console.log(`Count: ${gifts.length}`);
  gifts.forEach(g => console.log(`  Gift ${g.id} | "${g.title}" | type=${g.type} | tier=${g.tier} | created=${g.createdAt.toISOString().split('T')[0]} | link=${g.shareLink}`));

  const giftIds = gifts.map(g => g.id);

  // ALL contributions across ALL gifts (completed only, like recompute-wallet)
  const contributions = await prisma.contribution.findMany({
    where: { giftId: { in: giftIds }, status: 'completed' },
    select: { id: true, giftId: true, amount: true, commission: true, isAsoebi: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n=== ALL CONTRIBUTIONS (completed, across all gifts) ===');
  console.log(`Count: ${contributions.length}`);
  let totalGross = 0, totalCommission = 0;
  for (const c of contributions) {
    totalGross += c.amount;
    totalCommission += c.commission;
    const g = gifts.find(x => x.id === c.giftId);
    const label = g ? `"${g.title}"` : '?';
    console.log(`  C${c.id} | gift=${c.giftId} ${label} | Amount: ${c.amount} | Commission: ${c.commission} | Net: ${c.amount - c.commission} | isAsoebi: ${c.isAsoebi} | Date: ${c.createdAt.toISOString().split('T')[0]}`);
  }
  const totalNet = totalGross - totalCommission;
  console.log(`\nTotal Gross: ${totalGross}`);
  console.log(`Total Commission: ${totalCommission}`);
  console.log(`Total Net: ${totalNet}`);

  // Withdrawals
  const withdrawals = await prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  console.log('\n=== ALL WITHDRAWALS ===');
  console.log(`Count: ${withdrawals.length}`);
  let totalWithdrawnCompleted = 0;
  let totalWithdrawnAll = 0;
  for (const w of withdrawals) {
    const amt = parseFloat(w.amount);
    totalWithdrawnAll += amt;
    if (w.status === 'completed') totalWithdrawnCompleted += amt;
    console.log(`  W${w.id} | Amount: ${w.amount} | Status: ${w.status} | Date: ${w.createdAt.toISOString().split('T')[0]}`);
  }
  console.log(`Completed withdrawals sum: ${totalWithdrawnCompleted}`);
  console.log(`ALL withdrawals sum (incl pending): ${totalWithdrawnAll}`);

  // Referral rewards credited to this user (as referrer)
  const referralTxs = await prisma.referralTransaction.findMany({ where: { referrerId: userId } });
  let totalReferrals = 0;
  for (const r of referralTxs) {
    totalReferrals += parseFloat(r.amount);
    console.log(`  Referral | type=${r.type} | amount=${r.amount} | desc=${r.description} | date=${r.createdAt.toISOString().split('T')[0]}`);
  }
  console.log(`Total referral rewards credited: ${totalReferrals}`);

  // Vendor payment fundings (wallet deductions for vendor funding)
  const vendorFunding = await prisma.vendorPaymentFunding.findMany({ where: { userId, method: 'wallet', status: 'funded' } });
  let totalVendorFunding = 0;
  for (const v of vendorFunding) {
    const amt = parseFloat(v.amount);
    totalVendorFunding += amt;
    console.log(`  VendorFunding | amount=${v.amount} | vendorId=${v.vendorId} | date=${v.createdAt.toISOString().split('T')[0]}`);
  }
  console.log(`Total vendor fundings (wallet method): ${totalVendorFunding}`);

  // Premium payments (use raw SQL to avoid royal enum validation crash)
  console.log('\n=== PREMIUM PAYMENTS (raw SQL to avoid enum crash) ===');
  const ppRows = await prisma.$queryRaw`SELECT id, "giftId", amount, tier, status, "transactionId", "createdAt" FROM "PremiumPayment" WHERE "userId" = ${userId}`;
  let totalPremium = 0;
  for (const p of ppRows) {
    const amt = parseFloat(p.amount);
    totalPremium += amt;
    console.log(`  PP${p.id} | gift=${p.giftId} | amount=${p.amount} | tier=${p.tier} | status=${p.status} | tx=${p.transactionId} | date=${new Date(p.createdAt).toISOString().split('T')[0]}`);
  }
  console.log(`Total SUCCESS premium payments: ${totalPremium}`);

  // Full recompute using the same formula as /recalculate-wallet
  console.log('\n=== RECOMPUTE (matching recalculate-wallet logic) ===');
  // withdrawals: completed + pending (matching the route)
  const withdrawalsForRecalc = await prisma.withdrawal.aggregate({
    where: { userId, status: { in: ['completed', 'pending'] } },
    _sum: { amount: true }
  });
  const totalOutWithdrawals = parseFloat(withdrawalsForRecalc._sum.amount) || 0;
  const totalIn = totalNet + totalReferrals;
  const totalOut = totalOutWithdrawals + totalVendorFunding;
  const correctWallet = totalIn - totalOut;

  console.log(`totalIn (contributions net + referrals): ${totalIn}`);
  console.log(`totalOut (withdrawals completed+pending + vendor fundings): ${totalOut}`);
  console.log(`  - withdrawals (completed+pending): ${totalOutWithdrawals}`);
  console.log(`  - vendor fundings: ${totalVendorFunding}`);
  console.log(`Expected wallet: ${correctWallet}`);
  console.log(`Actual wallet: ${Number(user.wallet)}`);
  console.log(`Discrepancy: ${Number(user.wallet) - correctWallet}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
