
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_EMAIL = 'oluwaseunpaul98@gmail.com';

async function main() {
  console.log('=== Debugging user data for:', USER_EMAIL, '===');

  // 1. Find the user
  const user = await prisma.user.findUnique({
    where: { email: USER_EMAIL }
  });

  if (!user) {
    console.error('❌ User not found');
    return;
  }
  console.log('\n✅ User:', {
    id: user.id,
    name: user.name,
    email: user.email
  });

  // 2. Find all user's gifts with isPremium
  const gifts = await prisma.gift.findMany({
    where: { userId: user.id },
    include: {
      premiumPayment: true,
      templatePurchases: true,
      website: true
    }
  });
  console.log('\n📦 User\'s gifts:', gifts.length);
  gifts.forEach((gift, idx) => {
    console.log(`\n🎁 Gift ${idx + 1} (id: ${gift.id})`, {
      title: gift.title,
      isPremium: gift.isPremium,
      premiumPayment: gift.premiumPayment ? {
        id: gift.premiumPayment.id,
        amount: gift.premiumPayment.amount.toString(),
        status: gift.premiumPayment.status
      } : null,
      templatePurchases: gift.templatePurchases.map(tp => ({
        id: tp.id,
        template: tp.template,
        status: tp.status,
        amount: tp.amount.toString()
      })),
      website: gift.website ? {
        id: gift.website.id,
        template: gift.website.template,
        published: gift.website.published
      } : null
    });
  });

  // 3. Find all template purchases for user
  const allTemplatePurchases = await prisma.templatePurchase.findMany({
    where: { userId: user.id }
  });
  console.log('\n🛒 All template purchases for user:', allTemplatePurchases);

  // 4. Find all premium payments for user
  const allPremiumPayments = await prisma.premiumPayment.findMany({
    where: { userId: user.id }
  });
  console.log('\n💰 All premium payments for user:', allPremiumPayments.map(p => ({
    ...p,
    amount: p.amount.toString()
  })));

}

main()
  .catch((e) => {
    console.error('Error in debug:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
