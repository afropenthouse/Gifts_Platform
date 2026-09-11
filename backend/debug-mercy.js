const prisma = require('./prismaClient');

async function main() {
  const userId = 290; // Francis Anumudu
  const giftId = 220; // #MercyMeetsPeace'26

  // Get all contributions for this gift
  const contributions = await prisma.contribution.findMany({
    where: { giftId },
    orderBy: { createdAt: 'desc' }
  });

  console.log('=== All Contributions for Gift #MercyMeetsPeace\'26 ===');
  console.log(`Total: ${contributions.length}`);

  let cashGross = 0, cashCommission = 0, cashNet = 0;
  let asoebiGross = 0, asoebiCommission = 0, asoebiNet = 0;
  let zeroAmount = 0;

  for (const c of contributions) {
    if (c.amount === 0 || c.amount === 0.0) zeroAmount++;
    if (c.isAsoebi) {
      asoebiGross += c.amount;
      asoebiCommission += c.commission;
      asoebiNet += c.amount - c.commission;
    } else {
      cashGross += c.amount;
      cashCommission += c.commission;
      cashNet += c.amount - c.commission;
    }
    const type = c.isAsoebi ? 'ASOEBI' : 'CASH GIFT';
    console.log(`  ID:${c.id} | ${type} | Amount: ${c.amount} | Commission: ${c.commission} | Net: ${c.amount - c.commission} | Status: ${c.status} | Date: ${c.createdAt.toISOString().split('T')[0]}`);
  }

  console.log(`\n=== Breakdown ===`);
  console.log(`Cash Gifts: ${contributions.filter(c=>!c.isAsoebi).length - zeroAmount} paid (+ ${zeroAmount} zero-amount)`);
  console.log(`  Gross: ${cashGross} | Commission: ${cashCommission} | Net: ${cashNet}`);
  console.log(`Asoebi Orders: ${contributions.filter(c=>c.isAsoebi).length}`);
  console.log(`  Gross: ${asoebiGross} | Commission: ${asoebiCommission} | Net: ${asoebiNet}`);

  const totalGross = cashGross + asoebiGross;
  const totalCommission = cashCommission + asoebiCommission;
  const totalNet = cashNet + asoebiNet;
  console.log(`\nTotal Gross: ${totalGross}`);
  console.log(`Total Commission: ${totalCommission}`);
  console.log(`Total Net (expected wallet credit): ${totalNet}`);

  // Check withdrawals
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { withdrawals: true }
  });

  console.log(`\n=== User ===`);
  console.log(`Name: ${user.name} | Email: ${user.email}`);
  console.log(`Current Wallet: ${user.wallet}`);
  console.log(`Withdrawals: ${user.withdrawals.length}`);
  const completedWithdrawals = user.withdrawals.filter(w => w.status === 'completed');
  const totalWithdrawn = completedWithdrawals.reduce((s, w) => s + parseFloat(w.amount), 0);
  console.log(`Completed withdrawals: ${totalWithdrawn}`);
  for (const w of user.withdrawals) {
    console.log(`  - W${w.id} | Amount: ${w.amount} | Status: ${w.status} | Date: ${w.createdAt.toISOString().split('T')[0]}`);
  }

  const expectedWallet = totalNet - totalWithdrawn;
  console.log(`\nExpected Wallet (Net - Withdrawn): ${expectedWallet}`);
  console.log(`Actual Wallet: ${user.wallet}`);
  console.log(`Discrepancy: ${Number(user.wallet) - expectedWallet}`);

  // Check if there are any other wallet-affecting records
  const premiumPayments = await prisma.premiumPayment.findMany({
    where: { userId }
  });
  console.log(`\nPremium Payments for user: ${premiumPayments.length}`);
  for (const p of premiumPayments) {
    console.log(`  - GiftId: ${p.giftId} | Amount: ${p.amount} | Status: ${p.status} | Tier: ${p.tier}`);
  }

}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
