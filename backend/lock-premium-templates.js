
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Locking all premium templates...');

  // 1. Delete all template purchases (or you can set status to 'pending' instead, but deleting is more thorough)
  console.log('Deleting all template purchases...');
  const deletedTemplatePurchases = await prisma.templatePurchase.deleteMany({});
  console.log(`Deleted ${deletedTemplatePurchases.count} template purchase records`);

  // 2. Also, update any PremiumPayment records with amount >= 10000 to status 'pending' (or lower amount)
  // because getUnlockedWebsiteTemplates checks for those to unlock all templates
  console.log('Updating premium payments that unlock templates (amount >= 10000)...');
  const updatedPremiumPayments = await prisma.premiumPayment.updateMany({
    where: {
      amount: {
        gte: 10000
      }
    },
    data: {
      status: 'pending'
    }
  });
  console.log(`Updated ${updatedPremiumPayments.count} premium payment records`);

  // Optional: Also reset any gift.website.template if it's a premium template, to a free one
  console.log('Resetting website templates to free ones if they were premium...');
  const freeTemplates = ['modern', 'joy-blossom', 'nocturne', 'rosette', 'milk', 'elegant'];
  const websitesToUpdate = await prisma.website.findMany({
    where: {
      template: {
        notIn: freeTemplates
      }
    }
  });
  console.log(`Found ${websitesToUpdate.length} websites using premium templates`);

  for (const website of websitesToUpdate) {
    await prisma.website.update({
      where: { id: website.id },
      data: { template: 'modern' }
    });
  }
  console.log(`Reset ${websitesToUpdate.length} websites to use 'modern' template`);

  console.log('✅ All premium templates locked successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error locking premium templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
