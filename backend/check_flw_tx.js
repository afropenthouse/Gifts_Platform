require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    console.log('=== ALL CONTRIBUTIONS (last 20) ===');
    const all = await prisma.contribution.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, giftId: true, amount: true, transactionId: true, status: true, createdAt: true, isAsoebi: true, contributorName: true, asoebiItemsDetails: true }
    });
    console.log(JSON.stringify(all, null, 2));

    console.log('\n=== CONTRIBUTIONS WITH asoebiItemsDetails (may contain paymentMeta) ===');
    const withMeta = await prisma.contribution.findMany({
      where: { asoebiItemsDetails: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, giftId: true, amount: true, transactionId: true, status: true, createdAt: true, isAsoebi: true, contributorName: true, asoebiItemsDetails: true }
    });
    console.log(JSON.stringify(withMeta, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
})();