const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const multer = require('multer');
const { uploadImage } = require('../utils/cloudinary');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for moments
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

module.exports = () => {
  const router = express.Router();

  // Upload moment (picture) - allow anonymous uploads
  router.post('/', upload.single('picture'), async (req, res) => {
    const { giftId, event } = req.body;

    try {
      if (!req.file) {
        return res.status(400).json({ msg: 'Picture is required' });
      }

      if (!giftId || !event) {
        return res.status(400).json({ msg: 'Gift ID and event are required' });
      }

      // Verify the gift exists
      const gift = await prisma.gift.findUnique({
        where: { id: parseInt(giftId) },
        select: { id: true, title: true }
      });

      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // Upload image to Cloudinary
      const uploadResult = await uploadImage(req.file.buffer);
      const imageUrl = uploadResult.secure_url;

      const moment = await prisma.moment.create({
        data: {
          userId: req.user ? req.user.id : null, // Allow anonymous uploads
          giftId: parseInt(giftId),
          imageUrl,
          event
        }
      });

      res.json(moment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get moments for user (moments from user's events)
  router.get('/my', auth(), async (req, res) => {
    try {
      const moments = await prisma.moment.findMany({
        where: {
          gift: {
            userId: req.user.id
          }
        },
        include: {
          gift: {
            select: { id: true, title: true, type: true, date: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(moments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get moments for a specific gift
  router.get('/gift/:giftId', auth(), async (req, res) => {
    const giftId = parseInt(req.params.giftId);

    try {
      // Verify the gift belongs to the user
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
        select: { id: true, userId: true }
      });

      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      const moments = await prisma.moment.findMany({
        where: { giftId },
        orderBy: { createdAt: 'desc' }
      });

      res.json(moments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete moment
  router.delete('/:id', auth(), async (req, res) => {
    const momentId = parseInt(req.params.id);

    try {
      const moment = await prisma.moment.findUnique({
        where: { id: momentId },
        include: { gift: true }
      });

      if (!moment || moment.gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Moment not found' });
      }

      await prisma.moment.delete({ where: { id: momentId } });

      res.json({ msg: 'Moment deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};