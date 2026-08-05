const prisma = require('./prismaClient');

async function main() {
  const users = await prisma.user.findMany({
    where: {
      name: {
        equals: 'Praise Green',
        mode: 'insensitive'
      }
    },
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
  console.log(JSON.stringify(users, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
