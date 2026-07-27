
const prisma = require('../prismaClient');

async function resetPremium() {
  try {
    console.log('Deleting all PremiumPayment records...');
    await prisma.premiumPayment.deleteMany({});
    console.log('Deleted PremiumPayment records.');

    console.log('Deleting all TemplatePurchase records...');
    await prisma.templatePurchase.deleteMany({});
    console.log('Deleted TemplatePurchase records.');

    console.log('Resetting Gift.isPremium to false for all gifts...');
    await prisma.gift.updateMany({
      where: { isPremium: true },
      data: { isPremium: false }
    });
    console.log('Reset Gift.isPremium.');

    console.log('Reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting premium data:', error);
    process.exit(1);
  }
}

resetPremium();
