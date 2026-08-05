const prisma = require('../prismaClient');

async function migrate() {
  try {
    const user = await prisma.user.findFirst({
      where: { name: { contains: 'Ayomide Akindele', mode: 'insensitive' } },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user.name, user.email);

    const gifts = await prisma.gift.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, tier: true }
    });

    console.log('Gifts:', gifts);

    for (const gift of gifts) {
      if (gift.tier !== 'vip') {
        await prisma.gift.update({
          where: { id: gift.id },
          data: { tier: 'vip' }
        });
        console.log('Updated gift', gift.id, 'to vip');
      } else {
        console.log('Gift', gift.id, 'already vip');
      }
    }

    const payments = await prisma.premiumPayment.findMany({
      where: { userId: user.id }
    });

    for (const p of payments) {
      await prisma.premiumPayment.update({
        where: { id: p.id },
        data: { tier: 'vip', amount: 50000 }
      });
      console.log('Updated payment', p.id, 'to vip 50000');
    }

    console.log('Migration completed');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
