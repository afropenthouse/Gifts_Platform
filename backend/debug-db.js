const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    // List first 5 users to get a valid ID
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Users found:', users.length);
    if (users.length > 0) {
      const userId = users[0].id;
      console.log(`Testing query for user ID: ${userId}`);
      
      const gifts = await prisma.gift.findMany({
        where: { userId: userId }
      });
      console.log('Gifts query successful!');
      console.log('Gifts found:', gifts.length);
      if (gifts.length > 0) {
        console.log('First gift:', gifts[0]);
      }
    } else {
      console.log('No users found in database.');
    }
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
