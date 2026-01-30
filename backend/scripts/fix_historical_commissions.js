const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting audit of historical Asoebi commissions...');

  try {
    // 1. Fetch all Asoebi contributions
    const contributions = await prisma.contribution.findMany({
      where: {
        isAsoebi: true
      },
      include: {
        gift: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`Found ${contributions.length} Asoebi contributions.`);

    let updatedCount = 0;
    let totalRefundedToWallets = 0;
    let totalDeductedFromWallets = 0;

    for (const contribution of contributions) {
      // Calculate true quantity
      const breakdownSum = 
        (contribution.asoebiQtyMen || 0) +
        (contribution.asoebiQtyWomen || 0) +
        (contribution.asoebiBrideMenQty || 0) +
        (contribution.asoebiBrideWomenQty || 0) +
        (contribution.asoebiGroomMenQty || 0) +
        (contribution.asoebiGroomWomenQty || 0);

      const trueQuantity = breakdownSum > 0 ? breakdownSum : (contribution.asoebiQuantity || 1);
      
      const correctCommission = 500 * trueQuantity;
      const currentCommission = contribution.commission;
      const commissionDiff = currentCommission - correctCommission;

      // Check if adjustment is needed (allowing for small float differences)
      if (Math.abs(commissionDiff) > 0.01) {
        console.log(`\nFixing Contribution ID ${contribution.id}:`);
        console.log(`  - Breakdown Sum: ${breakdownSum}`);
        console.log(`  - Stored asoebiQuantity: ${contribution.asoebiQuantity}`);
        console.log(`  - True Quantity: ${trueQuantity}`);
        console.log(`  - Current Commission: ${currentCommission}`);
        console.log(`  - Correct Commission: ${correctCommission}`);
        console.log(`  - Diff (Refund to Wallet): ${commissionDiff}`);

        const userId = contribution.gift?.userId;
        if (!userId) {
            console.warn(`  ! Skipping wallet update: No associated User found for Gift ID ${contribution.giftId}`);
            continue;
        }

        // Atomic update transaction
        await prisma.$transaction([
          // Update Contribution
          prisma.contribution.update({
            where: { id: contribution.id },
            data: { 
                commission: correctCommission,
                // Ensure asoebiQuantity reflects the true total if it was wrong (e.g. if it was 0 but breakdown existed, or if it was duplicate)
                // Actually, let's trust our trueQuantity calculation and normalize the field
                asoebiQuantity: trueQuantity
            }
          }),
          // Update User Wallet
          prisma.user.update({
            where: { id: userId },
            data: {
              wallet: {
                increment: commissionDiff // Add the difference back to wallet (if positive) or deduct (if negative)
              }
            }
          })
        ]);

        console.log(`  ✓ Updated successfully.`);
        updatedCount++;
        if (commissionDiff > 0) totalRefundedToWallets += commissionDiff;
        else totalDeductedFromWallets += Math.abs(commissionDiff);
      }
    }

    console.log('\n------------------------------------------------');
    console.log('Audit Complete.');
    console.log(`Total Contributions Processed: ${contributions.length}`);
    console.log(`Total Contributions Fixed: ${updatedCount}`);
    console.log(`Total Amount Refunded to Wallets: ₦${totalRefundedToWallets}`);
    console.log(`Total Amount Deducted from Wallets: ₦${totalDeductedFromWallets}`);

  } catch (error) {
    console.error('Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
