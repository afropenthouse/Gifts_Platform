const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'wedding';
}

async function main() {
  console.log('Fixing website slugs...');

  const websites = await prisma.website.findMany({
    include: { gift: { select: { title: true } } }
  });

  let updated = 0;
  let skipped = 0;

  for (const website of websites) {
    const giftTitle = website.gift?.title;
    if (!giftTitle) {
      skipped++;
      continue;
    }

    const expectedSlug = slugify(giftTitle);
    if (website.slug === expectedSlug) {
      skipped++;
      continue;
    }

    const existing = await prisma.website.findFirst({
      where: { slug: expectedSlug, id: { not: website.id } }
    });

    let newSlug = expectedSlug;
    if (existing) {
      newSlug = `${expectedSlug}-${crypto.randomBytes(4).toString('hex')}`;
    }

    await prisma.website.update({
      where: { id: website.id },
      data: { slug: newSlug }
    });

    console.log(`Updated website ${website.id}: ${website.slug} -> ${newSlug}`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} slugs, skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error('Error fixing website slugs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });