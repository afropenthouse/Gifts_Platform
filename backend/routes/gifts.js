
const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const multer = require('multer');
const { uploadImage } = require('../utils/cloudinary');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

module.exports = () => {
  const router = express.Router();

  // Create gift
  router.post('/', auth(), upload.single('picture'), async (req, res) => {
    const { type, title, description, date, details, customType, guestListMode } = req.body;

    try {
      let pictureUrl = null;

      // Upload image to Cloudinary if file is provided
      if (req.file) {
        const uploadResult = await uploadImage(req.file.buffer);
        pictureUrl = uploadResult.secure_url;
      }

      // Generate unique shareLink
      let shareLink;
      let attempts = 0;
      do {
        const slug = slugify(title);
        const code = Math.floor(10000 + Math.random() * 90000);
        shareLink = `${slug}/${code}`;
        attempts++;
        if (attempts > 10) {
          // Fallback to old format if too many collisions
          shareLink = `${req.user.id}-${Date.now()}`;
          break;
        }
        var existing = await prisma.gift.findUnique({ where: { shareLink } });
      } while (existing);

      const gift = await prisma.gift.create({
        data: {
          userId: req.user.id,
          type,
          title,
          description,
          date: date ? new Date(date) : null,
          picture: pictureUrl,
          details: details ? (typeof details === 'string' ? JSON.parse(details) : details) : null,
          customType,
          shareLink,
          guestListMode: guestListMode || 'restricted',
        },
      });

      res.json(gift);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get user's gifts
  router.get('/my', auth(), async (req, res) => {
    try {
      const gifts = await prisma.gift.findMany({ where: { userId: req.user.id } });
      res.json(gifts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update gift
  router.put('/:id', auth(), upload.single('picture'), async (req, res) => {
    const { type, title, description, date, details, customType, guestListMode } = req.body;
    const giftId = parseInt(req.params.id);

    try {
      const gift = await prisma.gift.findUnique({ 
        where: { id: giftId },
        select: { id: true, userId: true, picture: true } // Only select needed fields
      });
      
      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      let pictureUrl = gift.picture; // Keep existing picture by default

      // Upload new image to Cloudinary if file is provided
      if (req.file) {
        const uploadResult = await uploadImage(req.file.buffer);
        pictureUrl = uploadResult.secure_url;
      }

      const updatedGift = await prisma.gift.update({
        where: { id: giftId },
        data: {
          type,
          title,
          description,
          date: date ? new Date(date) : null,
          picture: pictureUrl,
          details: details ? (typeof details === 'string' ? JSON.parse(details) : details) : null,
          customType,
          guestListMode,
        },
      });

      res.json(updatedGift);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Set reminder for gift
  router.post('/:id/set-reminder', auth(), async (req, res) => {
    const giftId = parseInt(req.params.id);
    const { reminder, reminderDateTime } = req.body;

    try {
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
        select: { id: true, userId: true, details: true, date: true, shareLink: true }
      });

      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      const details = gift.details || {};
      details.reminder = reminder;
      let scheduledDateTime;
      if (reminder === 'custom' && reminderDateTime) {
        details.reminderDateTime = reminderDateTime;
        scheduledDateTime = new Date(reminderDateTime);
      } else if (reminder !== 'custom' && reminder !== 'none') {
        // For predefined, set default time 09:00 on the calculated date
        const eventDate = new Date(gift.date);
        let reminderDate;
        switch (reminder) {
          case '1week':
            reminderDate = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '3days':
            reminderDate = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
            break;
          case '1day':
            reminderDate = new Date(eventDate.getTime() - 1 * 24 * 60 * 60 * 1000);
            break;
        }
        if (reminderDate) {
          reminderDate.setHours(9, 0, 0, 0); // 9 AM
          details.reminderDateTime = reminderDate.toISOString();
          scheduledDateTime = reminderDate;
        }
      }

      const updatedGift = await prisma.gift.update({
        where: { id: giftId },
        data: { details }
      });

      // If the scheduled time is now or in the past, send reminders immediately
      if (scheduledDateTime && new Date() >= scheduledDateTime) {
        // Import the sendReminderEmail function
        const { sendReminderEmail } = require('./guests'); // Assuming it's exported, but it's not, wait.

        // Actually, since it's in the same module, but to avoid circular, let's duplicate the logic or call the endpoint.

        // For simplicity, duplicate the sending logic here
        const guests = await prisma.guest.findMany({
          where: { giftId: gift.id, attending: 'yes' },
          select: { email: true, firstName: true, lastName: true }
        });

        const eventUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/gift/${gift.shareLink}` : null;

        // Import the function from guests.js - but since it's not exported, let's copy the code
        const nodemailer = require('nodemailer');
        const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '465', 10);
        const smtpSecure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true;
        const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
        const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
        const mailFrom = process.env.MAIL_FROM || smtpUser;
        const emailEnabled = Boolean(smtpUser && smtpPass);

        if (emailEnabled) {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const formatEventHeading = (gift) => {
            if (!gift) return 'Event Celebration';
            if (gift.type === 'wedding' && gift.details?.groomName && gift.details?.brideName) {
              return `${gift.details.groomName} & ${gift.details.brideName}`;
            }
            return gift.title || 'Event Celebration';
          };

          const formatEventDate = (date) => {
            if (!date) return null;
            return new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          };

          const sendReminderEmail = async ({ recipient, guestName, gift, eventUrl }) => {
            if (!recipient) return { delivered: false, reason: 'No recipient provided' };

            const heading = formatEventHeading(gift);
            const eventDate = formatEventDate(gift?.date);
            const eventAddress = gift?.details?.address;
            const accent = '#2E235C';
            const muted = '#f6f4ff';

            const html = `
              <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
                <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
                  <div style="padding: 28px 28px 18px; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">${heading} Reminder</h2>
                    <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">Don't forget this upcoming event!</p>
                    ${eventDate ? `<p style=\"margin: 0; font-size: 14px; color: #6b7280;\">Date: ${eventDate}</p>` : ''}
                    ${eventAddress ? `<p style=\"margin: 4px 0 0; font-size: 14px; color: #6b7280;\">Location: ${eventAddress}</p>` : ''}
                  </div>
                  <div style="padding: 0 24px 24px; text-align: center;">
                    <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
                      <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${guestName || 'there'},</p>
                      <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">This is a friendly reminder about the upcoming event. We hope to see you there!</p>
                    </div>
                    <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">
                      <a href="${eventUrl}" style="color: ${accent}; text-decoration: none; font-weight: 600;">View Event Details</a>
                    </p>
                  </div>
                </div>
              </div>
            `;

            try {
              await transporter.sendMail({
                from: mailFrom,
                to: recipient,
                subject: `${heading} – Event Reminder`,
                html,
              });
              return { delivered: true };
            } catch (error) {
              console.error('Failed to send reminder email:', error?.message || error);
              return { delivered: false, error: error?.message || 'Unknown error' };
            }
          };

          for (const guest of guests) {
            if (guest.email) {
              await sendReminderEmail({
                recipient: guest.email,
                guestName: `${guest.firstName} ${guest.lastName}`,
                gift: updatedGift,
                eventUrl,
              });
            }
          }
        }
      }

      res.json(updatedGift);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get featured gifts (public)
  router.get('/public/featured', async (req, res) => {
    try {
      const gifts = await prisma.gift.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { contributions: true }
          }
        }
      });

      // Transform the data to match frontend expectations
      const featuredGifts = gifts.map(gift => ({
        id: gift.id,
        title: gift.title,
        type: gift.type,
        date: gift.date ? gift.date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : null,
        picture: gift.picture,
        shareLink: gift.shareLink,
        giftersCount: gift._count.contributions,
        details: gift.details,
        customType: gift.customType
      }));

      res.json(featuredGifts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete gift
  router.delete('/:id', auth(), async (req, res) => {
    const giftId = parseInt(req.params.id);

    // Import nodemailer and email config from contributions.js for consistency
    const nodemailer = require('nodemailer');
    const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '465', 10);
    const smtpSecure = process.env.EMAIL_SECURE
      ? process.env.EMAIL_SECURE === 'true'
      : process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : true;
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const mailFrom = process.env.MAIL_FROM || smtpUser || 'teambethere@gmail.com';
    const emailEnabled = Boolean(smtpUser && smtpPass);
    const transporter = emailEnabled
      ? nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: { user: smtpUser, pass: smtpPass },
        })
      : null;

    function formatEventHeading(gift) {
      if (gift?.type === 'wedding') {
        return gift.title || 'Wedding Gift';
      }
      return gift?.title || gift?.type || 'Gift';
    }
    function formatEventDate(date) {
      if (!date) return null;
      try {
        return new Date(date).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        });
      } catch (error) { return null; }
    }

    async function sendRsvpCancellationEmail({ recipient, guestName, gift }) {
      if (!emailEnabled || !transporter) {
        console.warn('RSVP cancellation email skipped: SMTP configuration is missing');
        return { delivered: false, skipped: true };
      }
      if (!recipient) return { delivered: false, reason: 'No recipient provided' };
      const heading = formatEventHeading(gift);
      const eventDate = formatEventDate(gift?.date);
      const accent = '#2E235C';
      const muted = '#f6f4ff';
      const html = `
        <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
          <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
            <div style="padding: 28px 28px 18px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">Event Cancelled</h2>
              <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">${heading}</p>
              ${eventDate ? `<p style=\"margin: 0; font-size: 14px; color: #6b7280;\">Date: ${eventDate}</p>` : ''}
            </div>
            <div style="padding: 0 24px 24px; text-align: center;">
              <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${guestName || 'there'},</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">We regret to inform you that this event has been cancelled. Thank you for your RSVP and understanding.</p>
              </div>
              <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">If you have any questions, please reply to this email.</p>
            </div>
          </div>
        </div>
      `;
      try {
        await transporter.sendMail({
          from: mailFrom,
          to: recipient,
          subject: `${heading} – Event Cancelled`,
          html,
        });
        return { delivered: true };
      } catch (error) {
        console.error('Failed to send RSVP cancellation email:', error?.message || error);
        return { delivered: false, error: error?.message || 'Unknown error' };
      }
    }

    try {
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
        select: { id: true, userId: true, title: true, date: true, type: true, guests: { where: { email: { not: null } }, select: { email: true, firstName: true, lastName: true } } }
      });
      
      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      if (gift.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to delete this gift' });
      }

      // Send cancellation email to all RSVPs (guests with email)
      if (gift.guests && gift.guests.length > 0) {
        for (const guest of gift.guests) {
          sendRsvpCancellationEmail({
            recipient: guest.email,
            guestName: `${guest.firstName || ''} ${guest.lastName || ''}`.trim(),
            gift,
          }).catch(err => console.error('Background RSVP cancellation email failed:', err));
        }
      }

      await prisma.gift.delete({ where: { id: giftId } });

      res.json({ msg: 'Gift deleted successfully' });
    } catch (err) {
      console.error('Error deleting gift:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get gift by share link (supports slashes in shareLink like "slug/123")
  router.get('/:link(*)', async (req, res) => {
    try {
      const gift = await prisma.gift.findUnique({
        where: { shareLink: req.params.link },
        include: { user: { select: { name: true, profilePicture: true } } },
      });
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });
      res.json(gift);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};
