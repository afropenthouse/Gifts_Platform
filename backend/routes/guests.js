const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const { sendRsvpEmail, sendOwnerNotificationEmail, sendReminderEmail } = require('../utils/emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

module.exports = () => {
  const router = express.Router();

  // Create guest
  router.post('/', auth(), async (req, res) => {
    const { firstName, lastName, email, phone, allowed, attending, giftId, tableSitting } = req.body;

    try {
      const trimmedFirst = firstName?.trim();
      const trimmedLast = lastName?.trim();

      if (!trimmedFirst || !trimmedLast) {
        return res.status(400).json({ msg: 'First name and last name are required' });
      }

      // Enforce case-insensitive uniqueness per event - REMOVED per user request
      /*
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
      */

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
    const { firstName, lastName, email, phone, allowed, attending, giftId, tableSitting, asoebi } = req.body;
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

      const targetGiftId = giftId ? parseInt(giftId) : guest.giftId;

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

      if (asoebi !== undefined) {
        updateData.asoebi = asoebi;
      }

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

      const isAttendingYes = Boolean(attending);

      const isPremiumEvent = gift.tier && gift.tier !== 'free';

      if (isAttendingYes) {
        let checkInToken;
        if (isPremiumEvent) {
          checkInToken = crypto.randomBytes(32).toString('hex');
          await prisma.guest.update({
            where: { id: guest.id },
            data: { checkInToken },
          });
        }

        sendRsvpEmail({
          recipient: guest.email,
          guestName,
          attending: isAttendingYes,
          gift,
          eventUrl,
          checkInToken,
        }).catch(err => console.error('Background RSVP email failed:', err));
      } else {
        sendRsvpEmail({
          recipient: guest.email,
          guestName,
          attending: isAttendingYes,
          gift,
          eventUrl,
        }).catch(err => console.error('Background RSVP email failed:', err));
      }

      sendOwnerNotificationEmail({
        ownerEmail: gift.user.email,
        ownerName: gift.user.name,
        guestName,
        guestEmail: guest.email,
        attending: isAttendingYes,
        gift,
      }).catch(err => console.error('Background owner notification failed:', err));

      res.json({ msg: 'RSVP submitted successfully', guest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update asoebi status (public)
  router.post('/asoebi-update', async (req, res) => {
    const { shareLink, guestId, asoebi, asoebiSelection } = req.body;
    console.log('Asoebi update request:', { shareLink, guestId, asoebi, asoebiSelection });

    if (!shareLink || !guestId) {
      console.log('Missing shareLink or guestId');
      return res.status(400).json({ msg: 'Missing shareLink or guestId' });
    }

    try {
      // Verify gift exists
      const gift = await prisma.gift.findUnique({
        where: { shareLink },
      });

      if (!gift) {
        console.log('Gift not found for shareLink:', shareLink);
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // Verify guest exists and belongs to this gift
      const parsedGuestId = parseInt(guestId);
      if (isNaN(parsedGuestId)) {
        console.log('Invalid guestId:', guestId);
        return res.status(400).json({ msg: 'Invalid guestId' });
      }

      const guest = await prisma.guest.findFirst({
        where: {
          id: parsedGuestId,
          giftId: gift.id
        }
      });

      if (!guest) {
        console.log('Guest not found:', { parsedGuestId, giftId: gift.id });
        return res.status(404).json({ msg: 'Guest not found' });
      }

      const updatedGuest = await prisma.guest.update({
        where: { id: guest.id },
        data: { 
          asoebi: Boolean(asoebi),
          asoebiSelection: asoebiSelection || null
        }
      });

      console.log('Guest updated successfully:', updatedGuest.id);
      res.json(updatedGuest);
    } catch (err) {
      console.error('Error in asoebi-update:', err);
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  });

  // Send reminder emails for events (triggered manually or via cron)
  router.post('/send-reminders', async (req, res) => {
    try {
      const { checkAndSendReminders } = require('../utils/reminderService');
      const remindersSent = await checkAndSendReminders();
      res.json({ msg: 'Reminders processed', count: remindersSent });
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

  router.post('/checkin-scanner-token/:giftId', auth(), async (req, res) => {
    const giftId = parseInt(req.params.giftId);

    try {
      const gift = await prisma.gift.findFirst({
        where: { id: giftId, userId: req.user.id },
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Event not found' });
      }

      const scannerToken = jwt.sign(
        { giftId, type: 'checkin-scanner' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ scannerToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  router.post('/checkin/:token', async (req, res) => {
    const { token } = req.params;
    const scannerToken = req.header('X-Scanner-Token');

    if (!scannerToken) {
      return res.status(401).json({ msg: 'Scanner authorization required' });
    }

    try {
      const decoded = jwt.verify(scannerToken, process.env.JWT_SECRET);
      if (decoded.type !== 'checkin-scanner') {
        return res.status(401).json({ msg: 'Invalid scanner token' });
      }
    } catch (err) {
      return res.status(401).json({ msg: 'Invalid scanner token' });
    }

    try {
      const guest = await prisma.guest.findFirst({
        where: { checkInToken: token },
        include: { gift: true },
      });

      if (!guest) {
        return res.status(404).json({ msg: 'Invalid check-in code' });
      }

      if (guest.checkedIn) {
        return res.status(200).json({ msg: 'Already checked in', guest, alreadyCheckedIn: true });
      }

      const updatedGuest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          checkedIn: true,
          checkedInAt: new Date(),
        },
      });

      res.json({ msg: 'Checked in successfully', guest: updatedGuest, alreadyCheckedIn: false });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  router.post('/checkin-manual/:id', auth(), async (req, res) => {
    const guestId = parseInt(req.params.id);

    try {
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: { gift: true },
      });

      if (!guest || guest.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Guest not found' });
      }

      if (guest.checkedIn) {
        return res.status(200).json({ msg: 'Already checked in', alreadyCheckedIn: true });
      }

      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: {
          checkedIn: true,
          checkedInAt: new Date(),
        },
      });

      res.json({ msg: 'Checked in successfully', guest: updatedGuest, alreadyCheckedIn: false });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  router.get('/checkin-stats/:giftId', auth(), async (req, res) => {
    const giftId = parseInt(req.params.giftId);

    try {
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
      });

      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      const guests = await prisma.guest.findMany({
        where: { giftId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          attending: true,
          checkedIn: true,
          checkedInAt: true,
          checkInToken: true,
        },
      });

      const totalInvited = guests.length;
      const totalCheckedIn = guests.filter(g => g.checkedIn).length;
      const totalAttending = guests.filter(g => g.attending === 'yes').length;
      const checkInRate = totalInvited > 0 ? Math.round((totalCheckedIn / totalInvited) * 100) : 0;

      const guestList = guests.map(g => ({
        id: g.id,
        name: `${g.firstName} ${g.lastName}`,
        email: g.email,
        attending: g.attending,
        checkedIn: g.checkedIn,
        checkedInAt: g.checkedInAt,
      }));

      res.json({
        giftId,
        totalInvited,
        totalAttending,
        totalCheckedIn,
        checkInRate,
        guests: guestList,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  router.get('/checkin-event/:eventId', async (req, res) => {
    const eventId = parseInt(req.params.eventId);

    try {
      const gift = await prisma.gift.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          type: true,
          date: true,
          details: true,
        },
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Event not found' });
      }

      const guests = await prisma.guest.findMany({
        where: { giftId: eventId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          allowed: true,
          attending: true,
          checkedIn: true,
          checkedInAt: true,
        },
        orderBy: { lastName: 'asc' },
      });

      res.json({ gift, guests });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};
