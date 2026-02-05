const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function backfillReferralCodes() {
  try {
    console.log('🔄 Starting referral code backfill...');

    // Find all users without a referral code
    const users = await prisma.user.findMany({
      where: {
        referralCode: null
      }
    });

    console.log(`📋 Found ${users.length} users needing referral codes.`);

    let updatedCount = 0;

    for (const user of users) {
      let newReferralCode;
      let isUnique = false;
      
      // Generate unique code loop
      while (!isUnique) {
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        const namePart = user.name ? user.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'USE';
        newReferralCode = `${namePart}${randomPart}`;
        
        const existing = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
        if (!existing) isUnique = true;
      }

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: newReferralCode }
      });

      console.log(`✅ Updated user ${user.email} with code: ${newReferralCode}`);
      updatedCount++;
    }

    console.log(`\n🎉 Backfill complete! Updated ${updatedCount} users.`);
  } catch (error) {
    console.error('❌ Error backfilling referral codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillReferralCodes();
