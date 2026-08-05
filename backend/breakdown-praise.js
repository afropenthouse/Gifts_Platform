const prisma = require('./prismaClient');

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 365 },
    include: {
      gifts: {
        include: {
          contributions: {
            where: { status: 'completed' }
          }
        }
      },
      withdrawals: true,
      referralTransactionsReceived: true,
      referralTransactions: true
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`User: ${user.name} (ID: ${user.id})`);
  console.log(`Email: ${user.email}`);
  console.log(`Wallet Balance: ${user.wallet}`);
  console.log(`\nGifts Breakdown:`);

  let totalGross = 0;
  let totalNet = 0;

  for (const gift of user.gifts) {
    const giftGross = gift.contributions.reduce((s, c) => s + (c.amount || 0), 0);
    const giftCommission = gift.contributions.reduce((s, c) => s + (c.commission || 0), 0);
    const giftNet = gift.contributions.reduce((s, c) => s + ((c.amount || 0) - (c.commission || 0)), 0);
    totalGross += giftGross;
    totalNet += giftNet;

    console.log(`\n  Gift ID: ${gift.id} (${gift.title})`);
    console.log(`  Is Premium: ${gift.isPremium}`);
    console.log(`  Contributions Count: ${gift.contributions.length}`);
    console.log(`  Gross Amount: ${giftGross}`);
    console.log(`  Commission: ${giftCommission}`);
    console.log(`  Net Amount: ${giftNet}`);
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total Gross Contributions: ${totalGross}`);
  console.log(`Total Commission Deducted: ${totalGross - totalNet}`);
  console.log(`Total Net to Wallet: ${totalNet}`);

  const totalWithdrawn = user.withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  console.log(`Total Withdrawn: ${totalWithdrawn}`);
  console.log(`Expected Wallet (Net - Withdrawn): ${totalNet - totalWithdrawn}`);

  const referralReceived = user.referralTransactionsReceived.reduce((s, r) => s + parseFloat(r.amount), 0);
  const referralSent = user.referralTransactions.reduce((s, r) => s + parseFloat(r.amount), 0);
  console.log(`Referral Credits Received: ${referralReceived}`);
  console.log(`Referral Debits Sent: ${referralSent}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
