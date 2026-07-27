
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_EMAIL = 'oluwaseunpaul98@gmail.com';

async function main() {
  console.log('Locking all premium templates for user:', USER_EMAIL);

  // 1. Find the user by email
  const user = await prisma.user.findUnique({
    where: { email: USER_EMAIL }
  });

  if (!user) {
    console.error('User with email', USER_EMAIL, 'not found!');
    return;
  }
  console.log('Found user with ID:', user.id);

  // 2. Delete all template purchases for this user
  console.log('Deleting template purchases...');
  const deletedTemplatePurchases = await prisma.templatePurchase.deleteMany({
    where: { userId: user.id }
  });
  console.log('Deleted', deletedTemplatePurchases.count, 'template purchase records for this user');

  // 3. Update premium payments >= 10000 for this user's gifts to 'pending' status
  console.log('Updating premium payments for this user...');
  const updatedPremiumPayments = await prisma.premiumPayment.updateMany({
    where: {
      userId: user.id,
      amount: { gte: 10000 }
    },
    data: {
      status: 'pending'
    }
  });
  console.log('Updated', updatedPremiumPayments.count, 'premium payment records for this user');

  // 4. Reset all this user's website templates to free ones if they were premium
  console.log('Resetting website templates for this user...');
  const freeTemplates = ['modern', 'nocturne', 'rosette', 'milk', 'elegant'];
  const userWebsites = await prisma.website.findMany({
    where: {
      userId: user.id,
      template: { notIn: freeTemplates }
    }
  });
  console.log('Found', userWebsites.length, 'websites for this user using premium templates');

  for (const website of userWebsites) {
    await prisma.website.update({
      where: { id: website.id },
      data: { template: 'modern' }
    });
  }
  console.log('Reset', userWebsites.length, 'websites for this user to use "modern" template');

  console.log('All premium templates locked successfully for user:', USER_EMAIL);
}

main()
  .catch((e) => {
    console.error('Error locking premium templates for user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
