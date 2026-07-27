
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all pending template purchases...');
  
  const result = await prisma.templatePurchase.updateMany({
    where: { status: 'pending' },
    data: { status: 'cancelled' }
  });
  
  console.log(`Updated ${result.count} pending template purchases to 'cancelled'`);
}

main()
  .catch((e) => {
    console.error('Error clearing pending purchases:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
