const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');

module.exports = () => {
  const router = express.Router();

  // Create gift
  router.post('/', auth(), async (req, res) => {
    const { type, title, description, date, picture, details, customType } = req.body;

    try {
      const shareLink = `${req.user.id}-${Date.now()}`;
      const gift = await prisma.gift.create({
        data: {
          userId: req.user.id,
          type,
          title,
          description,
          date: date ? new Date(date) : null,
          picture,
          details,
          customType,
          shareLink,
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
  router.put('/:id', auth(), async (req, res) => {
    const { type, title, description, date, picture, details, customType } = req.body;
    const giftId = parseInt(req.params.id);

    try {
      const gift = await prisma.gift.findUnique({ where: { id: giftId } });
      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      const updatedGift = await prisma.gift.update({
        where: { id: giftId },
        data: {
          type,
          title,
          description,
          date: date ? new Date(date) : null,
          picture,
          details,
          customType,
        },
      });

      res.json(updatedGift);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get gift by share link
  router.get('/:link', async (req, res) => {
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