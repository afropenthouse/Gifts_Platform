
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Test Gift query
    const gift = await prisma.gift.findFirst({
      where: { shareLink: { not: null } }
    });
    
    if (gift) {
      console.log('Gift found via findFirst:', gift.id, gift.shareLink);
      
      // Test the failing query
      const giftByLink = await prisma.gift.findUnique({
        where: { shareLink: gift.shareLink }
      });
      console.log('Gift found via findUnique:', giftByLink ? 'Success' : 'Failed');
    } else {
      console.log('No gift with shareLink found.');
      // Create one if needed? No, let's just check if findUnique throws
      // Try to find a non-existent one
      const noGift = await prisma.gift.findUnique({
        where: { shareLink: 'non-existent-link-12345' }
      });
      console.log('Non-existent gift query result:', noGift);
    }

  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
