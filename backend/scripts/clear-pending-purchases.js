
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing pending template purchases...');
  
  const updated = await prisma.templatePurchase.updateMany({
    where: { status: 'pending' },
    data: { status: 'cancelled' }
  });
  
  console.log(`Updated ${updated.count} pending template purchases to 'cancelled'`);
  
  const updatedEvent = await prisma.premiumPayment.updateMany({
    where: { status: 'pending' },
    data: { status: 'cancelled' }
  });
  
  console.log(`Updated ${updatedEvent.count} pending event premium payments to 'cancelled'`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

