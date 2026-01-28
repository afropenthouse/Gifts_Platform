const prisma = require('../prismaClient');

async function main() {
  console.log('Starting migration: Updating Asoebi commission to 300...');

  try {
    // Update all contributions where isAsoebi is true
    // We are updating commission to 300.
    const result = await prisma.contribution.updateMany({
      where: {
        isAsoebi: true,
      },
      data: {
        commission: 300,
      },
    });

    console.log(`Successfully updated ${result.count} contributions.`);
  } catch (error) {
    console.error('Error updating contributions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
