const prisma = require('../prismaClient');

async function removeUserPayments() {
  const email = 'oluwaseunpaul98@gmail.com';
  console.log(`Finding user with email: ${email}`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Found user: ${user.name} (ID: ${user.id})`);

    // 1. Delete PremiumPayment records
    const premiumPayments = await prisma.premiumPayment.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Deleted ${premiumPayments.count} premium payment records`);

    // 2. Delete TemplatePurchase records
    const templatePurchases = await prisma.templatePurchase.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Deleted ${templatePurchases.count} template purchase records`);

    // 3. Delete ReferralTransaction records (where user is referrer or referred)
    const referralTransactions = await prisma.referralTransaction.deleteMany({
      where: {
        OR: [
          { referrerId: user.id },
          { referredUserId: user.id }
        ]
      }
    });
    console.log(`Deleted ${referralTransactions.count} referral transaction records`);

    // 4. Delete Withdrawal records
    const withdrawals = await prisma.withdrawal.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Deleted ${withdrawals.count} withdrawal records`);

    // 5. Reset all user's gifts to free tier
    const giftsReset = await prisma.gift.updateMany({
      where: { userId: user.id },
      data: { tier: 'free' }
    });
    console.log(`Reset ${giftsReset.count} gifts to free tier`);

    // 6. Reset all user's invitations to free tier
    const invitationsReset = await prisma.invitation.updateMany({
      where: { userId: user.id },
      data: { tier: 'free' }
    });
    console.log(`Reset ${invitationsReset.count} invitations to free tier`);

    // 7. Reset wallet to 0
    const walletReset = await prisma.user.update({
      where: { id: user.id },
      data: { wallet: 0 }
    });
    console.log(`Reset wallet to 0. New balance: ${walletReset.wallet}`);

    console.log('\nAll payments removed successfully!');
    console.log('Summary:');
    console.log(`- ${premiumPayments.count} premium payments deleted`);
    console.log(`- ${templatePurchases.count} template purchases deleted`);
    console.log(`- ${referralTransactions.count} referral transactions deleted`);
    console.log(`- ${withdrawals.count} withdrawals deleted`);
    console.log(`- ${giftsReset.count} gifts reset to free tier`);
    console.log(`- ${invitationsReset.count} invitations reset to free tier`);
    console.log(`- Wallet reset to 0`);

  } catch (err) {
    console.error('Error removing payments:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeUserPayments();
