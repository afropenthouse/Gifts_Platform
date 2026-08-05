const prisma = require('./prismaClient');

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 365 },
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
  console.log(`Wallet Balance: ${user.wallet}`);

  console.log(`\nAll Contributions (any status):`);
  for (const gift of user.gifts) {
    console.log(`\nGift ${gift.id} (${gift.title}): ${gift._count.contributions} total contributions`);
    for (const c of gift.contributions) {
      console.log(`  ID: ${c.id}, Amount: ${c.amount}, Commission: ${c.commission}, Status: ${c.status}, isAsoebi: ${c.isAsoebi}, Type: ${c.isAsoebi ? 'Asoebi' : 'Cash'}`);
    }
  }

  console.log(`\nAll Withdrawals:`);
  for (const w of user.withdrawals) {
    console.log(`  ID: ${w.id}, Amount: ${w.amount}, Status: ${w.status}, Source: ${w.sourceType}`);
  }

  console.log(`\nReferral Transactions Received:`);
  for (const r of user.referralTransactionsReceived) {
    console.log(`  ID: ${r.id}, Amount: ${r.amount}, Type: ${r.type}, From: ${r.referrer.name}`);
  }

  console.log(`\nVendor Payment Fundings:`);
  for (const v of user.vendorPaymentFundings) {
    console.log(`  ID: ${v.id}, Amount: ${v.amount}, Method: ${v.method}, Status: ${v.status}`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
