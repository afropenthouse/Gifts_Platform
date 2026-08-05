const prisma = require('./prismaClient');

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 195 },
    include: {
      gifts: {
        include: {
          contributions: {
            where: { status: 'completed' }
          }
        }
      },
      withdrawals: true
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const totalReceived = user.gifts.reduce((sum, gift) => {
    return sum + gift.contributions.reduce((s, c) => s + (c.amount || 0), 0);
  }, 0);

  const totalWithdrawn = user.withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  console.log(`User: ${user.name} (ID: ${user.id})`);
  console.log(`Email: ${user.email}`);
  console.log(`Total Received: ${totalReceived}`);
  console.log(`Total Withdrawn: ${totalWithdrawn}`);
  console.log(`Wallet Balance: ${user.wallet}`);
  console.log(`Gifts Count: ${user.gifts.length}`);
  console.log(`Withdrawals Count: ${user.withdrawals.length}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
