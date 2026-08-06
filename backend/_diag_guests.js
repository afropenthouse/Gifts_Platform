require('dotenv').config();
const prisma = require('./prismaClient');

(async () => {
  try {
    const u = await prisma.user.findUnique({
      where: { email: 'oluwaseunpaul98@gmail.com' },
      select: { id: true, name: true, email: true }
    });
    if (!u) {
      console.log('User not found');
      return;
    }
    console.log('User:', JSON.stringify(u));
    const count = await prisma.guest.count({ where: { userId: u.id } });
    console.log('Guest count to delete:', count);
  } catch (e) {
    console.error('ERR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
