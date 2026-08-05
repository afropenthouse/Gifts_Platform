const prisma = require('./prismaClient');

async function main() {
  const users = await prisma.user.findMany({
    where: {
      name: {
        contains: 'ayomide',
        mode: 'insensitive'
      }
    },
    select: { id: true, name: true, email: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
