
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_EMAIL = 'oluwaseunpaul98@gmail.com';

async function main() {
  console.log('Fixing user gifts for:', USER_EMAIL);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: USER_EMAIL }
  });

  if (!user) {
    console.error('User not found!');
    return;
  }

  // Set all user's gifts to isPremium: false
  const updateResult = await prisma.gift.updateMany({
    where: { userId: user.id },
    data: { isPremium: false }
  });

  console.log('Updated', updateResult.count, 'gifts for user');
  console.log('✅ Done! All gifts are now non-premium.');
}

main()
  .catch((e) => {
    console.error('Error fixing user gifts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
