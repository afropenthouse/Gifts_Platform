const prisma = require('../prismaClient');
const { sendReminderEmail } = require('./emailService');

const sendRemindersForGift = async (gift) => {
  try {
    // If guests are not included, fetch them
    let guests = gift.guests;
    if (!guests) {
      const giftWithGuests = await prisma.gift.findUnique({
        where: { id: gift.id },
        include: { guests: true }
      });
      guests = giftWithGuests?.guests || [];
    }

    const rsvpGuests = guests.filter(g => g.attending === 'yes' && g.email);
    let sentCount = 0;

    for (const guest of rsvpGuests) {
      const eventUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/gift/${gift.shareLink}` : null;
      await sendReminderEmail({
        recipient: guest.email,
        guestName: `${guest.firstName} ${guest.lastName}`,
        gift,
        eventUrl,
      });
      sentCount++;
    }

    // Clear the reminder after sending to prevent duplicates
    // We update the gift details to remove the reminder
    const details = gift.details || {};
    details.reminder = 'none';
    details.reminderDateTime = null;

    await prisma.gift.update({
      where: { id: gift.id },
      data: { details }
    });
    
    console.log(`Sent reminders for gift ${gift.id}: ${sentCount} emails`);
    return sentCount;
  } catch (err) {
    console.error(`Error sending reminders for gift ${gift.id}:`, err);
    throw err;
  }
};

const checkAndSendReminders = async () => {
  try {
    // 1. Backfill default reminders for any gift that doesn't have one set
    // Fetch all gifts with dates and filter in JS for safety across different DBs.
    const allGiftsWithDates = await prisma.gift.findMany({
      where: { date: { not: null } }
    });

    for (const gift of allGiftsWithDates) {
      const details = gift.details || {};
      if (!details.reminder || details.reminder === 'none') {
        const eventDateObj = new Date(gift.date);
        const reminderDate = new Date(eventDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
        reminderDate.setHours(9, 0, 0, 0);

        // Only set if the reminder date hasn't passed yet
        if (reminderDate > new Date()) {
          details.reminder = '1week';
          details.reminderDateTime = reminderDate.toISOString();

          await prisma.gift.update({
            where: { id: gift.id },
            data: { details }
          });
          console.log(`Auto-backfilled 7-day reminder for existing gift ${gift.id}`);
        }
      }
    }

    const now = new Date();
    // Fetch all gifts that might have reminders
    // Note: In a production app with many records, we should index and query specifically for pending reminders.
    // Since details is a JSON field, this is trickier. For now, we fetch gifts with details.
    const gifts = await prisma.gift.findMany({
      where: {
        details: { not: null }
      },
      include: { guests: true }
    });

    let remindersSent = 0;

    for (const gift of gifts) {
      const reminder = gift.details?.reminder;

      if (!reminder || reminder === 'none') {
        continue;
      }

      const reminderDateTime = new Date(gift.details?.reminderDateTime);

      if (!reminderDateTime || isNaN(reminderDateTime.getTime())) {
        continue;
      }

      // Check if current time is past the reminder time
      if (now >= reminderDateTime) {
        const count = await sendRemindersForGift(gift);
        remindersSent += count;
      }
    }

    return remindersSent;
  } catch (err) {
    console.error('Error checking reminders:', err);
    throw err;
  }
};

module.exports = { checkAndSendReminders, sendRemindersForGift };
