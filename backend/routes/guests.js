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

    const html = `
      <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
          <div style="padding: 28px 28px 18px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${accent}; letter-spacing: 0.4px;">${heading}</h2>
            <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">We've received your RSVP.</p>
            ${eventDate ? `<p style=\"margin: 0; font-size: 14px; color: #6b7280;\">Date: ${eventDate}</p>` : ''}
          </div>

          <div style="padding: 0 24px 24px; text-align: center;">
            <div style="margin: 0 auto 8px; max-width: 420px; background: ${muted}; border: 1px solid #e7e4f5; border-radius: 14px; padding: 14px 16px;">
              <p style="margin: 0; font-size: 14px; color: #111827;">Hi ${guestName || 'there'},</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #4b5563; line-height: 20px;">${responseLine}</p>
            </div>

            <p style="margin: 12px 0 0; font-size: 12px; color: #6b7280;">If you need to update your response, just reply to this email.</p>
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
    const { firstName, lastName, email, attending } = req.body;

    try {
      // Find the gift by share link
      const gift = await prisma.gift.findUnique({
        where: { shareLink },
        include: { user: true }
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // Check if guest exists on the list (by firstName and lastName for this gift)
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

      // Update existing guest with RSVP response and email
      const guest = await prisma.guest.update({
        where: { id: existingGuest.id },
        data: {
          email: email?.trim().toLowerCase() || existingGuest.email,
          attending: attending ? 'yes' : 'no',
          status: attending ? 'confirmed' : 'declined',
        },
      });

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

      // Check if guest exists on the list
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

      res.json({ msg: 'Guest found', exists: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};