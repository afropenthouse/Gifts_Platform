const express = require('express');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');

module.exports = () => {
  const router = express.Router();

  const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '465', 10);
  const smtpSecure = process.env.EMAIL_SECURE
    ? process.env.EMAIL_SECURE === 'true'
    : process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : true;
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const mailFrom = process.env.MAIL_FROM || smtpUser;
  const emailEnabled = Boolean(smtpUser && smtpPass);

  const transporter = emailEnabled
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

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

  const sendRsvpEmail = async ({ recipient, guestName, attending, gift, eventUrl }) => {
    if (!emailEnabled || !transporter) {
      console.warn('RSVP email skipped: SMTP configuration is missing');
      return { delivered: false, skipped: true };
    }

    if (!recipient) {
      return { delivered: false, reason: 'No recipient provided' };
    }

    const heading = formatEventHeading(gift);
    const eventDate = formatEventDate(gift?.date);
    const eventAddress = gift?.details?.address;
    const accent = '#2E235C';
    const muted = '#f6f4ff';
    const responseLine = attending
      ? `Thank you for letting us know you will attend. We cannot wait to celebrate with you${eventDate ? ` on ${eventDate}` : ''}.`
      : 'Thank you for letting us know. If your plans change, reply to this email and we will update your RSVP.';
    const yesStyles = attending
      ? `background: ${accent}; color: #ffffff; border-radius: 12px; padding: 12px 0; font-weight: 700; font-size: 14px;`
      : 'border: 1px solid #d1d5db; color: #4b5563; border-radius: 12px; padding: 12px 0; font-weight: 600; font-size: 14px; background: #ffffff;';
    const noStyles = attending
      ? 'border: 1px solid #d1d5db; color: #4b5563; border-radius: 12px; padding: 12px 0; font-weight: 600; font-size: 14px; background: #ffffff;'
      : `background: ${accent}; color: #ffffff; border-radius: 12px; padding: 12px 0; font-weight: 700; font-size: 14px;`;

    const googleMapsUrl = eventAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventAddress)}` : null;
    const html = `
      <div style=\"background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;\">
        <div style=\"max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;\">
          <div style=\"padding: 28px 28px 18px; text-align: center;\">
            <h2 style=\"margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;\">${heading}</h2>
            <p style=\"margin: 12px 0 4px; font-size: 15px; color: #374151;\">We've received your RSVP.</p>
          </div>

          <div style=\"padding: 0 24px 24px; text-align: center;\">
            <div style=\"margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;\">
              <p style=\"margin: 0; font-size: 14px; color: #111827;\">Hi ${guestName || 'there'},</p>
              <p style=\"margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;\">${responseLine}</p>
              ${eventAddress ? `<p style=\\"margin: 12px 0 0; font-size: 14px; color: #6b7280;\\">Location: <a href='${googleMapsUrl}' style='color: ${accent}; text-decoration: underline;'>${eventAddress}</a></p>` : ''}
            </div>

            <p style=\"margin: 12px 0 0; font-size: 12px; color: #6b7280;\">If you need to update your response, just reply to this email.</p>
          </div>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: mailFrom,
        to: recipient,
        subject: `${heading} – RSVP confirmed`,
        html,
      });
      return { delivered: true };
    } catch (error) {
      console.error('Failed to send RSVP email:', error?.message || error);
      return { delivered: false, error: error?.message || 'Unknown error' };
    }
  };

  const sendReminderEmail = async ({ recipient, guestName, gift, eventUrl }) => {
    if (!emailEnabled || !transporter) {
      console.warn('Reminder email skipped: SMTP configuration is missing');
      return { delivered: false, skipped: true };
    }

    if (!recipient) {
      return { delivered: false, reason: 'No recipient provided' };
    }

    const heading = formatEventHeading(gift);
    const eventDate = formatEventDate(gift?.date);
    const eventAddress = gift?.details?.address;
    const accent = '#2E235C';
    const muted = '#f6f4ff';
    const eventPicture = gift?.picture || 'https://placehold.co/600x400?text=Event+Image';
    const calendarUrl = eventUrl ? `${eventUrl}/calendar` : '#';
    const directionsUrl = eventAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventAddress)}` : '#';
    const websiteUrl = eventUrl || '#';

    const html = `
      <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
        <div style="max-width: 420px; margin: 0 auto; background: #fff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46,35,92,0.08); overflow: hidden;">
          <div style="padding: 24px 24px 0; text-align: center;">
            <div style="font-size: 22px; font-weight: 700; color: ${accent}; margin-bottom: 8px;">Joy</div>
            <div style="font-size: 18px; font-weight: 600; color: #222; margin-bottom: 2px;">${heading}</div>
            ${eventDate ? `<div style=\"font-size: 13px; color: #444; margin-bottom: 12px;\">${eventDate}</div>` : ''}
            <img src="${eventPicture}" alt="Event" style="width: 100%; max-width: 320px; border-radius: 12px; margin-bottom: 18px; object-fit: cover;" />
            <div style="font-size: 20px; font-weight: 700; color: #222; margin-bottom: 8px;">The Final Countdown!<br>1 Month Away</div>
            <div style="font-size: 13px; color: #666; margin-bottom: 18px;">Keep this email for reference. It includes important information about this event.</div>
          </div>
          <div style="padding: 0 18px 18px;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${eventAddress ? `<li style=\"margin-bottom: 8px;\"><a href='${directionsUrl}' style='color: ${accent}; text-decoration: underline; font-size: 14px;'>Get Directions</a></li>` : ''}
              <li style="margin-bottom: 8px;"><a href="${calendarUrl}" style="color: ${accent}; text-decoration: underline; font-size: 14px;">Add To Calendar</a></li>
              <li style="margin-bottom: 8px;"><a href="${websiteUrl}" style="color: ${accent}; text-decoration: underline; font-size: 14px;">Open Event Website</a></li>
            </ul>
            <div style="margin: 18px 0 0; text-align: center;">
              <span style="font-size: 13px; color: #888;">Planning your own event?</span><br>
              <a href="https://withjoy.com" style="display: inline-block; margin-top: 8px; padding: 8px 18px; background: ${accent}; color: #fff; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">Learn More</a>
            </div>
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

  const sendOwnerNotificationEmail = async ({ ownerEmail, ownerName, guestName, attending, gift }) => {
    if (!emailEnabled || !transporter) {
      console.warn('Owner notification email skipped: SMTP configuration is missing');
      return { delivered: false, skipped: true };
    }

    if (!ownerEmail) {
      return { delivered: false, reason: 'No owner email provided' };
    }

    const heading = formatEventHeading(gift);
    const eventDate = formatEventDate(gift?.date);
    const accent = '#2E235C';
    const muted = '#f6f4ff';
    const statusText = attending ? 'will attend' : 'cannot attend';
    const statusColor = attending ? '#10b981' : '#ef4444';

    const html = `
      <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
          <div style="padding: 28px 28px 18px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">New RSVP Response</h2>
            <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">${heading}</p>
            ${eventDate ? `<p style=\"margin: 0; font-size: 14px; color: #6b7280;\">Date: ${eventDate}</p>` : ''}
          </div>

          <div style="padding: 0 24px 24px; text-align: center;">
            <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
              <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${ownerName || 'there'},</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">
                <strong>${guestName}</strong> has responded to your invitation and 
                <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span> your event.
              </p>
            </div>

            <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="color: ${accent}; text-decoration: none; font-weight: 600;">View all RSVPs in your dashboard</a>
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: mailFrom,
        to: ownerEmail,
        subject: `${heading} – New RSVP from ${guestName}`,
        html,
      });
      return { delivered: true };
    } catch (error) {
      console.error('Failed to send owner notification email:', error?.message || error);
      return { delivered: false, error: error?.message || 'Unknown error' };
    }
  };

  // Create guest
  router.post('/', auth(), async (req, res) => {
    const { firstName, lastName, email, phone, allowed, attending, giftId, tableSitting } = req.body;

    try {
      const trimmedFirst = firstName?.trim();
      const trimmedLast = lastName?.trim();

      if (!trimmedFirst || !trimmedLast) {
        return res.status(400).json({ msg: 'First name and last name are required' });
      }

      // Enforce case-insensitive uniqueness per event
      const existing = await prisma.guest.findFirst({
        where: {
          giftId: giftId ? parseInt(giftId) : null,
          firstName: { equals: trimmedFirst, mode: 'insensitive' },
          lastName: { equals: trimmedLast, mode: 'insensitive' },
        },
      });

      if (existing) {
        return res.status(409).json({ msg: 'A guest with this name already exists for this event.' });
      }

      const guest = await prisma.guest.create({
        data: {
          userId: req.user.id,
          giftId: giftId ? parseInt(giftId) : null,
          firstName: trimmedFirst,
          lastName: trimmedLast,
          email: email?.trim().toLowerCase() || null,
          phone,
          allowed: allowed ? parseInt(allowed) : 1,
          attending: attending || 'yes',
          status: attending === 'yes' ? 'confirmed' : 'declined',
          tableSitting: tableSitting || 'Table sitting',
        },
      });

      res.json(guest);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get user's guests
  router.get('/', auth(), async (req, res) => {
    const { giftId } = req.query;
    try {
      const where = { userId: req.user.id };
      if (giftId) {
        where.giftId = parseInt(giftId);
      }
      const guests = await prisma.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      res.json(guests);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update guest
  router.put('/:id', auth(), async (req, res) => {
    const { firstName, lastName, email, phone, allowed, attending, giftId, tableSitting } = req.body;
    const guestId = parseInt(req.params.id);

    try {
      const trimmedFirst = firstName?.trim();
      const trimmedLast = lastName?.trim();

      if (!trimmedFirst || !trimmedLast) {
        return res.status(400).json({ msg: 'First name and last name are required' });
      }

      const guest = await prisma.guest.findUnique({ 
        where: { id: guestId },
        select: { id: true, userId: true, allowed: true, giftId: true } // Only select needed fields
      });
      
      if (!guest || guest.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Guest not found' });
      }

      // Enforce case-insensitive uniqueness per event (excluding current guest)
      const targetGiftId = giftId ? parseInt(giftId) : guest.giftId;
      const duplicate = await prisma.guest.findFirst({
        where: {
          id: { not: guestId },
          giftId: targetGiftId,
          firstName: { equals: trimmedFirst, mode: 'insensitive' },
          lastName: { equals: trimmedLast, mode: 'insensitive' },
        },
      });

      if (duplicate) {
        return res.status(409).json({ msg: 'A guest with this name already exists for this event.' });
      }

      const updateData = {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: email?.trim().toLowerCase() || null,
        phone,
        allowed: allowed ? parseInt(allowed) : guest.allowed,
        attending,
        status: attending === 'yes' ? 'confirmed' : 'declined',
        giftId: targetGiftId,
      };

      // Only update tableSitting if it's provided in the request
      if (tableSitting !== undefined) {
        updateData.tableSitting = tableSitting;
      }

      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: updateData,
      });

      res.json(updatedGuest);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete guest
  router.delete('/:id', auth(), async (req, res) => {
    const guestId = parseInt(req.params.id);

    try {
      const guest = await prisma.guest.findUnique({ 
        where: { id: guestId },
        select: { id: true, userId: true } // Only select needed fields
      });
      
      if (!guest || guest.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Guest not found' });
      }

      await prisma.guest.delete({ where: { id: guestId } });
      res.json({ msg: 'Guest deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Public RSVP endpoint (no auth required)
  router.post('/rsvp/:shareLink(*)', async (req, res) => {
    const { shareLink } = req.params;
    const { firstName, lastName, email, attending, hasGuests, additionalGuests } = req.body;

    try {
      // Find the gift by share link
      const gift = await prisma.gift.findUnique({
        where: { shareLink },
        include: { user: true }
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      let guest;

      if (gift.guestListMode === 'open') {
        // Open guest list: allow anyone to RSVP and add them to the list
        const trimmedFirst = firstName?.trim();
        const trimmedLast = lastName?.trim();

        if (!trimmedFirst || !trimmedLast) {
          return res.status(400).json({ msg: 'First name and last name are required' });
        }

        // Check if guest already exists (case-insensitive)
        const existingGuest = await prisma.guest.findFirst({
          where: {
            giftId: gift.id,
            firstName: { equals: trimmedFirst, mode: 'insensitive' },
            lastName: { equals: trimmedLast, mode: 'insensitive' },
          },
        });

        if (existingGuest && existingGuest.attending !== 'pending') {
          return res.status(409).json({ msg: 'You have already submitted an RSVP for this event.' });
        }

        if (existingGuest) {
          // Update existing guest
          guest = await prisma.guest.update({
            where: { id: existingGuest.id },
            data: {
              email: email?.trim().toLowerCase() || existingGuest.email,
              attending: attending ? 'yes' : 'no',
              status: attending ? 'confirmed' : 'declined',
            },
          });
        } else {
          // Create new guest
          guest = await prisma.guest.create({
            data: {
              userId: gift.userId,
              giftId: gift.id,
              firstName: trimmedFirst,
              lastName: trimmedLast,
              email: email?.trim().toLowerCase() || null,
              attending: attending ? 'yes' : 'no',
              status: attending ? 'confirmed' : 'declined',
              allowed: 1, // Default for open RSVPs
              tableSitting: 'Table seating',
            },
          });
        }
      } else {
        // Restricted guest list: check if guest exists
        const existingGuest = await prisma.guest.findFirst({
          where: {
            giftId: gift.id,
            firstName: { equals: firstName.trim(), mode: 'insensitive' },
            lastName: { equals: lastName.trim(), mode: 'insensitive' },
          },
        });

        if (!existingGuest) {
          return res.status(403).json({
            msg: 'Your name is not on the guest list. Please contact the event organizer.'
          });
        }

        if (existingGuest.attending !== 'pending') {
          return res.status(409).json({ msg: 'You have already submitted an RSVP for this event.' });
        }

        // Update existing guest with RSVP response and email
        const updateData = {
          email: email?.trim().toLowerCase() || existingGuest.email,
          attending: attending ? 'yes' : 'no',
          status: attending ? 'confirmed' : 'declined',
        };

        // Adjust allowed based on hasGuests for attending yes
        if (attending && hasGuests !== undefined) {
          updateData.allowed = hasGuests ? existingGuest.allowed : (additionalGuests !== undefined ? additionalGuests + 1 : 1);
        }

        guest = await prisma.guest.update({
          where: { id: existingGuest.id },
          data: updateData,
        });
      }

      const guestName = `${guest.firstName} ${guest.lastName}`.trim();
      const eventUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/gift/${shareLink}` : null;

      // Send emails in background without blocking response
      sendRsvpEmail({
        recipient: guest.email,
        guestName,
        attending: Boolean(attending),
        gift,
        eventUrl,
      }).catch(err => console.error('Background RSVP email failed:', err));

      sendOwnerNotificationEmail({
        ownerEmail: gift.user.email,
        ownerName: gift.user.name,
        guestName,
        attending: Boolean(attending),
        gift,
      }).catch(err => console.error('Background owner notification failed:', err));

      res.json({ msg: 'RSVP submitted successfully', guest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Send reminder emails for events
  router.post('/send-reminders', async (req, res) => {
    try {
      const now = new Date();
      const gifts = await prisma.gift.findMany({
        where: {
          date: { not: null },
          details: { not: null }
        },
        include: { guests: true }
      });

      let remindersSent = 0;

      for (const gift of gifts) {
        const reminder = gift.details?.reminder;
        console.log('DEBUG: Checking gift', gift.id, 'reminder:', reminder);

        if (!reminder || reminder === 'none') {
          console.log('DEBUG: Skipping gift', gift.id, '- no reminder set');
          continue;
        }

        const eventDate = new Date(gift.date);
        let reminderDate;

        let reminderDateTime;
        if (reminder === 'custom') {
          reminderDateTime = new Date(gift.details?.reminderDateTime);
        } else {
          // For predefined, use the stored datetime
          reminderDateTime = new Date(gift.details?.reminderDateTime);
        }

        console.log('DEBUG: Gift', gift.id, 'reminderDateTime:', reminderDateTime, 'now:', now);

        if (!reminderDateTime || isNaN(reminderDateTime.getTime())) {
          console.log('DEBUG: Invalid reminderDateTime for gift', gift.id);
          continue;
        }

        // Check if current time is past the reminder time
        if (now >= reminderDateTime) {
          console.log('DEBUG: Sending scheduled reminders for gift', gift.id, 'at', reminderDateTime);
          // Send reminders to guests who RSVP'd yes
          const rsvpGuests = gift.guests.filter(g => g.attending === 'yes' && g.email);
          console.log('DEBUG: Found', rsvpGuests.length, 'attending guests with emails for gift', gift.id);

          for (const guest of rsvpGuests) {
            const eventUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/gift/${gift.shareLink}` : null;
            console.log('DEBUG: Sending reminder to', guest.email, 'for gift', gift.id);
            await sendReminderEmail({
              recipient: guest.email,
              guestName: `${guest.firstName} ${guest.lastName}`,
              gift,
              eventUrl,
            });
            remindersSent++;
          }

          // Clear the reminder after sending to prevent duplicates
          await prisma.gift.update({
            where: { id: gift.id },
            data: {
              details: {
                ...gift.details,
                reminder: 'none',
                reminderDateTime: null,
              }
            }
          });
        }
      }

      res.json({ message: `Sent ${remindersSent} reminder emails` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Send reminder emails for a specific gift
  router.post('/send-reminders/:giftId', auth(), async (req, res) => {
    const giftId = parseInt(req.params.giftId);

    try {
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
        include: { guests: true }
      });

      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      let remindersSent = 0;

      // Send reminders to guests who RSVP'd yes
      const rsvpGuests = gift.guests.filter(g => g.attending === 'yes' && g.email);

      for (const guest of rsvpGuests) {
        const eventUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/gift/${gift.shareLink}` : null;
        await sendReminderEmail({
          recipient: guest.email,
          guestName: `${guest.firstName} ${guest.lastName}`,
          gift,
          eventUrl,
        });
        remindersSent++;
      }

      res.json({ message: `Sent ${remindersSent} reminder emails` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Check if guest name is on the list (validation only)
  router.post('/check/:shareLink(*)', async (req, res) => {
    const { shareLink } = req.params;
    const { firstName, lastName } = req.body;

    try {
      // Find the gift by share link
      const gift = await prisma.gift.findUnique({
        where: { shareLink },
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // For open guest list, always allow
      if (gift.guestListMode === 'open') {
        return res.json({ msg: 'Open RSVP allowed', exists: true });
      }

      // Check if guest exists on the list (restricted mode)
      const existingGuest = await prisma.guest.findFirst({
        where: {
          giftId: gift.id,
          firstName: { equals: firstName.trim(), mode: 'insensitive' },
          lastName: { equals: lastName.trim(), mode: 'insensitive' },
        },
      });

      if (!existingGuest) {
        return res.status(403).json({
          msg: 'Your name is not on the guest list. Please contact the event organizer.'
        });
      }

      res.json({ msg: 'Guest found', exists: true, guest: existingGuest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};