const prisma = require('../prismaClient');

async function main() {
  console.log('Starting migration: Updating Asoebi commission to 300 × quantity...');

  try {
    const contributions = await prisma.contribution.findMany({
      where: { isAsoebi: true },
      select: {
        id: true,
        commission: true,
        asoebiQuantity: true,
        asoebiQtyMen: true,
        asoebiQtyWomen: true,
        asoebiBrideMenQty: true,
        asoebiBrideWomenQty: true,
        asoebiGroomMenQty: true,
        asoebiGroomWomenQty: true,
      },
    });

    let updated = 0;
    for (const c of contributions) {
      const qtySum =
        (c.asoebiQuantity || 0) +
        (c.asoebiQtyMen || 0) +
        (c.asoebiQtyWomen || 0) +
        (c.asoebiBrideMenQty || 0) +
        (c.asoebiBrideWomenQty || 0) +
        (c.asoebiGroomMenQty || 0) +
        (c.asoebiGroomWomenQty || 0);
      const quantity = qtySum > 0 ? qtySum : 1;
      const newCommission = 300 * quantity;

      if (c.commission !== newCommission) {
        await prisma.contribution.update({
          where: { id: c.id },
          data: { commission: newCommission },
        });
        updated++;
      }
    }

    console.log(`Successfully updated ${updated} contributions.`);
  } catch (error) {
    console.error('Error updating contributions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
