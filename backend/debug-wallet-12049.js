const prisma = require('./prismaClient');

async function main() {
  // 1) Platform total of all stored wallet balances
  const total = await prisma.$queryRawUnsafe(`SELECT SUM(wallet) AS total, COUNT(*) AS n_users FROM "User"`);
  console.log(`=== PLATFORM TOTAL wallet balance ===`);
  console.log(`Total users: ${total[0].n_users}`);
  console.log(`SUM(all wallets): ${Number(total[0].total).toFixed(2)}`);

  // 2) Every user with wallet > 0 (the contributors to the total)
  const users = await prisma.user.findMany({
    where: { wallet: { gt: 0 } },
    select: { id: true, name: true, email: true, phoneNumber: true, wallet: true },
    orderBy: { wallet: 'desc' }
  });
  console.log(`\n=== Users with wallet > 0 (${users.length}) ===`);
  let sumPositive = 0;
  for (const u of users) {
    sumPositive += Number(u.wallet);
    console.log(`  id=${u.id} | ${u.name} | ${u.email} | phone=${u.phoneNumber || '-'} | wallet=${Number(u.wallet).toFixed(2)}`);
  }
  console.log(`Sum of wallets>0: ${sumPositive.toFixed(2)}`);

  // 3) Per user, the events (gifts) and net contributions that accumulated to their wallet
  console.log(`\n=== Per-user EVENT breakdown (net contributions per event) ===`);
  const breakdown = await prisma.$queryRawUnsafe(`
    SELECT u.id AS uid, u.name, u.wallet AS stored_wallet,
           g.id AS gift_id, g.title, g."type",
           SUM(co.amount) AS gross, SUM(co.commission) AS comm,
           SUM(co.amount) - SUM(co.commission) AS net
    FROM "User" u
    JOIN "Gift" g ON g."userId" = u.id
    JOIN "Contribution" co ON co."giftId" = g.id
    WHERE co.status = 'completed'
    GROUP BY u.id, u.name, u.wallet, g.id, g.title, g."type"
    ORDER BY u.id, g.id
  `);
  for (const b of breakdown) {
    console.log(`  [uid=${b.uid} ${b.name} | wallet=${Number(b.stored_wallet)}] Gift#${b.gift_id} "${b.title}" (${b.type}) | gross=${Number(b.gross).toFixed(2)} - comm=${Number(b.comm).toFixed(2)} = net=${Number(b.net).toFixed(2)}`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
