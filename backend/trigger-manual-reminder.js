const { PrismaClient } = require('@prisma/client');
const { sendReminderEmail } = require('./utils/emailService');
require('dotenv').config();

const prisma = new PrismaClient();

async function triggerManualReminder() {
  const email = 'oluwaseunpaul98@gmail.com';
  console.log(`🚀 Starting manual reminder trigger for: ${email}`);

  try {
    // 1. Find the guest with this email
    const guest = await prisma.guest.findFirst({
      where: { email: email },
      include: {
        gift: true // This is the event/gift they are attending
      }
    });

    if (!guest) {
      console.error(`❌ No guest found with email: ${email}`);
      return;
    }

    if (!guest.gift) {
      console.error(`❌ Guest found, but they are not associated with any event/gift.`);
      return;
    }

    console.log(`📦 Found guest: ${guest.firstName} ${guest.lastName} for event: ${guest.gift.title}`);

    // 2. Prepare event URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://bethereexperience.com';
    const eventUrl = `${frontendUrl}/share/${guest.gift.shareLink}`;

    // 3. Trigger the reminder email
    console.log(`📧 Sending reminder email...`);
    await sendReminderEmail({
      recipient: guest.email,
      guestName: `${guest.firstName} ${guest.lastName}`,
      gift: guest.gift,
      eventUrl: eventUrl
    });

    console.log(`✅ Success! Reminder email sent to ${email}`);

  } catch (error) {
    console.error('❌ Error triggering manual reminder:', error);
  } finally {
    await prisma.$disconnect();
  }
}

triggerManualReminder();
