const prisma = require('../prismaClient');
const { checkAndSendPostEventEmails } = require('../utils/reminderService');
const { sendPostEventEmail } = require('../utils/emailService');

const run = async () => {
  const args = process.argv.slice(2);
  const giftIdArg = args.find(arg => arg.startsWith('--giftId='));
  const userEmailArg = args.find(arg => arg.startsWith('--userEmail='));
  const forceArg = args.includes('--force');

  try {
    let gift;
    let giftId;

    if (giftIdArg) {
      giftId = parseInt(giftIdArg.split('=')[1]);
      gift = await prisma.gift.findUnique({
        where: { id: giftId },
        include: { guests: true }
      });
    } else if (userEmailArg) {
      const email = userEmailArg.split('=')[1];
      console.log(`Looking up most recent event for user: ${email}`);
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          gifts: {
            orderBy: { date: 'desc' },
            take: 1,
            include: { guests: true }
          }
        }
      });

      if (user && user.gifts.length > 0) {
        gift = user.gifts[0];
        giftId = gift.id;
        console.log(`Found event: "${gift.title}" (ID: ${gift.id}) - Date: ${gift.date}`);
      } else {
        console.error('User not found or has no events.');
        process.exit(1);
      }
    }

    if (gift) {
      console.log(`Manually triggering post-event email for Gift ID: ${giftId}`);
      
      const details = gift.details || {};
      
      if (details.postEventEmailSent && !forceArg) {
        console.log('Post-event email already sent for this gift. Use --force to resend.');
        process.exit(0);
      }

      const attendingGuests = gift.guests.filter(g => g.attending === 'yes' && g.email);
      let sentCount = 0;
      
      console.log(`Found ${attendingGuests.length} attending guests with email.`);

      for (const guest of attendingGuests) {
        const eventUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/gift/${gift.shareLink}` : '#';
        
        await sendPostEventEmail({
          recipient: guest.email,
          guestName: `${guest.firstName} ${guest.lastName}`,
          gift,
          eventUrl,
        });
        console.log(`Sent email to ${guest.email}`);
        sentCount++;
      }

      if (!details.postEventEmailSent) {
        details.postEventEmailSent = true;
        await prisma.gift.update({
          where: { id: gift.id },
          data: { details }
        });
        console.log('Marked gift as sent.');
      }

      console.log(`Done! Sent ${sentCount} emails.`);

    } else {
      console.log('Running automated check for past 14 days...');
      const count = await checkAndSendPostEventEmails();
      console.log(`Automated check complete. Sent ${count} emails.`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
};

run();
