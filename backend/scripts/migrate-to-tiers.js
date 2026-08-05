const prisma = require('../prismaClient');

async function migrate() {
  console.log('Starting migration to 3-tier system...');

  try {
    // 1. Find all gifts that have a successful premium payment (these were premium)
    const premiumPayments = await prisma.premiumPayment.findMany({
      where: { status: 'success' },
      select: { giftId: true }
    });

    const premiumGiftIds = new Set(premiumPayments.map(p => p.giftId));
    console.log(`Found ${premiumGiftIds.size} premium gifts from payment records`);

    // 2. Update all Gifts: premium -> 'royal', non-premium -> 'free'
    const giftsResult = await prisma.gift.updateMany({
      where: { id: { in: Array.from(premiumGiftIds) } },
      data: { tier: 'royal' }
    });
    console.log(`Updated Gift tiers to 'royal': ${giftsResult.count} rows affected`);

    const freeGiftsResult = await prisma.gift.updateMany({
      where: { id: { not: { in: Array.from(premiumGiftIds) } } },
      data: { tier: 'free' }
    });
    console.log(`Updated Gift tiers to 'free': ${freeGiftsResult.count} rows affected`);

    // 3. Update all Invitations: if linked gift is royal -> 'royal', else -> 'free'
    const royalInvitationsResult = await prisma.invitation.updateMany({
      where: { giftId: { not: null } },
      data: { tier: 'royal' }
    });
    console.log(`Updated Invitation tiers to 'royal': ${royalInvitationsResult.count} rows affected`);

    const freeInvitationsResult = await prisma.invitation.updateMany({
      where: { giftId: null },
      data: { tier: 'free' }
    });
    console.log(`Updated Invitation tiers to 'free': ${freeInvitationsResult.count} rows affected`);

    console.log('Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- ${giftsResult.count} existing premium events mapped to Royal tier`);
    console.log(`- ${freeGiftsResult.count} existing free events remain Free tier`);
    console.log(`- ${royalInvitationsResult.count} invitations linked to premium events set to Royal`);
    console.log(`- ${freeInvitationsResult.count} standalone invitations set to Free`);
    console.log('\nTier structure:');
    console.log('- Free: Basic access');
    console.log('- VIP: Free commission only (₦50,000)');
    console.log('- Royal: Free commission + premium templates (₦100,000)');

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
