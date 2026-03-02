require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const parseEmails = () => {
  // Emails can be provided via CLI args or env var DELETE_EMAILS (comma-separated)
  // Example: node scripts/delete_users_by_email.js email1@example.com email2@example.com
  const argEmails = process.argv.slice(2).filter(Boolean);
  if (argEmails.length > 0) return argEmails;
  const envEmails = process.env.DELETE_EMAILS;
  if (envEmails) return envEmails.split(',').map(e => e.trim()).filter(Boolean);
  return [];
};

const run = async () => {
  const emails = parseEmails();
  if (emails.length === 0) {
    console.error('No emails provided. Pass emails as CLI args or set DELETE_EMAILS env.');
    process.exit(1);
  }

  console.log('Deleting users by email:', emails);

  for (const email of emails) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.log(`[SKIP] ${email} not found`);
        continue;
      }

      const userId = user.id;

      await prisma.$transaction(async (tx) => {
        await tx.referralTransaction.deleteMany({
          where: {
            OR: [
              { referrerId: userId },
              { referredUserId: userId }
            ]
          }
        });

        await tx.withdrawal.deleteMany({
          where: { userId }
        });

        await tx.user.updateMany({
          where: { referredById: userId },
          data: { referredById: null }
        });

        await tx.user.delete({
          where: { id: userId }
        });
      });

      console.log(`[OK] Deleted ${email}`);
    } catch (err) {
      console.error(`[ERR] Failed to delete ${email}:`, err.message);
    }
  }
};

run()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

