
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_EMAIL = 'oluwaseunpaul98@gmail.com';

async function main() {
  console.log('Checking for pending template purchases for:', USER_EMAIL);

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email: USER_EMAIL }
  });

  if (!user) {
    console.error('User not found!');
    return;
  }

  // 2. Find pending template purchases for user's gifts
  const pendingPurchases = await prisma.templatePurchase.findMany({
    where: {
      userId: user.id,
      status: 'pending'
    },
    include: { gift: true }
  });

  console.log('Found', pendingPurchases.length, 'pending template purchase(s) for user');

  if (pendingPurchases.length > 0) {
    console.log('Pending purchases:', pendingPurchases.map(p => ({
      id: p.id,
      template: p.template,
      giftId: p.giftId,
      giftTitle: p.gift?.title
    })));

    // 3. Delete all pending purchases to clear the "processing" state
    const deleteResult = await prisma.templatePurchase.deleteMany({
      where: {
        userId: user.id,
        status: 'pending'
      }
    });

    console.log('Deleted', deleteResult.count, 'pending template purchase(s)');
  }

  console.log('✅ Done! No more pending template purchases for user');
}

main()
  .catch((e) => {
    console.error('Error fixing pending purchases:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
