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

module.exports = () => {
  const router = express.Router();

  // Create gift
  router.post('/', auth(), upload.single('picture'), async (req, res) => {
    const { type, title, description, date, details, customType } = req.body;

    try {
      let pictureUrl = null;

      // Upload image to Cloudinary if file is provided
      if (req.file) {
        const uploadResult = await uploadImage(req.file.buffer);
        pictureUrl = uploadResult.secure_url;
      }

      const shareLink = `${req.user.id}-${Date.now()}`;
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
    const { type, title, description, date, details, customType } = req.body;
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
        },
      });

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

    try {
      const gift = await prisma.gift.findUnique({ 
        where: { id: giftId },
        select: { id: true, userId: true }
      });
      
      if (!gift) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      if (gift.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to delete this gift' });
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