const prisma = require('./prismaClient');

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 195 },
    include: {
      gifts: {
        include: {
          contributions: true,
          _count: { select: { contributions: true } }
        }
      },
      withdrawals: true,
      referralTransactionsReceived: true,
      referralTransactions: true,
      vendorPaymentFundings: true
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`User: ${user.name} (ID: ${user.id})`);
  console.log(`Email: ${user.email}`);
  console.log(`Wallet Balance: ${user.wallet}`);

  console.log(`\nAll Contributions (any status):`);
  for (const gift of user.gifts) {
    console.log(`\nGift ${gift.id} (${gift.title}): ${gift._count.contributions} total contributions`);
    for (const c of gift.contributions) {
      console.log(`  ID: ${c.id}, Amount: ${c.amount}, Commission: ${c.commission}, Status: ${c.status}, isAsoebi: ${c.isAsoebi}, Type: ${c.isAsoebi ? 'Asoebi' : 'Cash'}`);
    }
  }

  const totalGross = user.gifts.reduce((sum, gift) => {
    return sum + gift.contributions.reduce((s, c) => s + (c.amount || 0), 0);
  }, 0);
  const totalCommission = user.gifts.reduce((sum, gift) => {
    return sum + gift.contributions.reduce((s, c) => s + (c.commission || 0), 0);
  }, 0);
  const totalNet = totalGross - totalCommission;

  console.log(`\n--- Contribution Summary ---`);
  console.log(`Total Gross Contributions: ${totalGross}`);
  console.log(`Total Commission Deducted: ${totalCommission}`);
  console.log(`Total Net to Wallet: ${totalNet}`);

  console.log(`\nAll Withdrawals:`);
  for (const w of user.withdrawals) {
    console.log(`  ID: ${w.id}, Amount: ${w.amount}, Status: ${w.status}, Source: ${w.sourceType}`);
  }

  const totalWithdrawn = user.withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  console.log(`\n--- Wallet Math ---`);
  console.log(`Total Net: ${totalNet}`);
  console.log(`Total Withdrawn: ${totalWithdrawn}`);
  console.log(`Expected Wallet (Net - Withdrawn): ${totalNet - totalWithdrawn}`);
  console.log(`Actual Wallet: ${user.wallet}`);
  console.log(`Discrepancy: ${parseFloat(user.wallet) - (totalNet - totalWithdrawn)}`);

  const referralReceived = user.referralTransactionsReceived.reduce((s, r) => s + parseFloat(r.amount), 0);
  const referralSent = user.referralTransactions.reduce((s, r) => s + parseFloat(r.amount), 0);
  console.log(`\nReferral Credits Received: ${referralReceived}`);
  console.log(`Referral Debits Sent: ${referralSent}`);

  console.log(`\nVendor Payment Fundings:`);
  for (const v of user.vendorPaymentFundings) {
    console.log(`  ID: ${v.id}, Amount: ${v.amount}, Method: ${v.method}, Status: ${v.status}`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
