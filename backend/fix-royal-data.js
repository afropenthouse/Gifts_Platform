const prisma = require('./prismaClient');

async function main() {
  const before = await prisma.$queryRaw`SELECT id, "giftId", amount, tier, status FROM "PremiumPayment" WHERE tier = 'royal'`;
  console.log('Before migration (royal records):', JSON.stringify(before, null, 2));

  // 'royal' is fully deprecated in the schema enum (only free/vip) and in code
  // (webhook now writes 'vip'). Migrate the legacy royal payment to 'vip' so it
  // no longer crashes Prisma enum validation on reads (e.g. premium payments route).
  const updated = await prisma.$executeRaw`UPDATE "PremiumPayment" SET tier = 'vip' WHERE tier = 'royal'`;
  console.log('Rows migrated (royal -> vip):', Number(updated.count !== undefined ? updated.count : updated));

  const afterRoyal = await prisma.$queryRaw`SELECT id, "giftId", amount, tier, status FROM "PremiumPayment" WHERE tier = 'royal'`;
  console.log('After migration (royal records left):', JSON.stringify(afterRoyal, null, 2));

  const pp61 = await prisma.$queryRaw`SELECT id, "giftId", "userId", amount, tier, status, "transactionId", "createdAt" FROM "PremiumPayment" WHERE "giftId" = 220`;
  console.log('PP61 now:', JSON.stringify(pp61, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
