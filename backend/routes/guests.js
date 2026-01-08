const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');

module.exports = () => {
  const router = express.Router();

  // Create guest
  router.post('/', auth(), async (req, res) => {
    const { firstName, lastName, email, phone, allowed, attending, giftId } = req.body;

    try {
      const guest = await prisma.guest.create({
        data: {
          userId: req.user.id,
          giftId: giftId ? parseInt(giftId) : null,
          firstName,
          lastName,
          email,
          phone,
          allowed: allowed ? parseInt(allowed) : 1,
          attending: attending || 'yes',
          status: attending === 'yes' ? 'confirmed' : 'declined',
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
    const { firstName, lastName, email, phone, allowed, attending, giftId } = req.body;
    const guestId = parseInt(req.params.id);

    try {
      const guest = await prisma.guest.findUnique({ where: { id: guestId } });
      if (!guest || guest.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Guest not found' });
      }

      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: {
          firstName,
          lastName,
          email,
          phone,
          allowed: allowed ? parseInt(allowed) : guest.allowed,
          attending,
          status: attending === 'yes' ? 'confirmed' : 'declined',
          giftId: giftId ? parseInt(giftId) : guest.giftId,
        },
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
      const guest = await prisma.guest.findUnique({ where: { id: guestId } });
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
  router.post('/rsvp/:shareLink', async (req, res) => {
    const { shareLink } = req.params;
    const { firstName, lastName, email, attending } = req.body;

    try {
      // Find the gift by share link
      const gift = await prisma.gift.findUnique({
        where: { shareLink },
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // Check if guest exists on the list (by firstName and lastName for this gift)
      const existingGuest = await prisma.guest.findFirst({
        where: {
          giftId: gift.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
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

      res.json({ msg: 'RSVP submitted successfully', guest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Check if guest name is on the list (validation only)
  router.post('/check/:shareLink', async (req, res) => {
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
          firstName: firstName.trim(),
          lastName: lastName.trim(),
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