
const prisma = require('./prismaClient');

async function checkDbState() {
  try {
    console.log('--- Database State Check ---');

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        contributions: true,
        withdrawals: true,
        guests: true,
      }
    });

    for (const user of users) {
      console.log(`\nUser: ${user.name} (${user.email})`);
      console.log(`Current Wallet Balance: ${user.wallet}`);

      // Calculate expected wallet balance
      let totalContributions = 0;
      let totalCommission = 0;
      let totalWithdrawals = 0;
      let asoebiContributionsCount = 0;
      let giftContributionsCount = 0;
      
      // Analyze contributions
      for (const c of user.contributions) {
        // Skip contributions that are not completed if necessary, assuming 'completed' is the only valid status
        if (c.status !== 'completed') continue;

        totalContributions += c.amount;
        totalCommission += c.commission;

        if (c.isAsoebi) {
            asoebiContributionsCount++;
        } else {
            giftContributionsCount++;
        }
      }

      // Analyze withdrawals
      for (const w of user.withdrawals) {
          // Assuming 'pending' withdrawals might still deduct from wallet or 'success' only?
          // Usually wallet balance reflects completed transactions. 
          // However, typically withdrawals deduct immediately. Let's assume all withdrawals deduct.
          // Adjust logic if only 'completed' withdrawals count.
          // In many systems, pending withdrawal locks funds.
          // Let's assume all withdrawals in the table reduce the available balance or are already deducted.
          // If status is failed/cancelled, it might be refunded.
          // For now, let's sum all withdrawals to see.
          totalWithdrawals += Number(w.amount);
      }

      const netContributions = totalContributions - totalCommission;
      const calculatedBalance = netContributions - totalWithdrawals;

      console.log(`Total Contributions (Gross): ${totalContributions}`);
      console.log(`Total Commission: ${totalCommission}`);
      console.log(`Total Withdrawals: ${totalWithdrawals}`);
      console.log(`Calculated Balance (Gross - Commission - Withdrawals): ${calculatedBalance}`);
      console.log(`Difference: ${Number(user.wallet) - calculatedBalance}`);

      console.log(`Asoebi Contributions Count: ${asoebiContributionsCount}`);
      console.log(`Gift Contributions Count: ${giftContributionsCount}`);

      // Check Guests
      const paidGuests = user.guests.filter(g => g.asoebiPaid).length;
      const totalAsoebiGuests = user.guests.filter(g => g.asoebi).length;
      
      console.log(`Guests with asoebiPaid=true: ${paidGuests}`);
      console.log(`Guests with asoebi=true (intent): ${totalAsoebiGuests}`);
      
      if (paidGuests !== asoebiContributionsCount) {
          console.log(`WARNING: Mismatch between paid guests (${paidGuests}) and asoebi contributions (${asoebiContributionsCount})`);
      } else {
          console.log(`OK: Paid guests match asoebi contributions.`);
      }

      // Sample a few contributions to check fields
      const sampleContributions = user.contributions.slice(0, 3);
      console.log('Sample Contributions:');
      sampleContributions.forEach(c => {
          console.log(`  ID: ${c.id}, Amount: ${c.amount}, Commission: ${c.commission}, isAsoebi: ${c.isAsoebi}, Qty: ${c.asoebiQuantity}`);
      });
    }

  } catch (error) {
    console.error('Error checking DB state:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDbState();
