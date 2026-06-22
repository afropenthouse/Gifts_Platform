
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

  // Create wishlist
  router.post('/', auth(), async (req, res) => {
    const { title, description, address, giftId } = req.body;

    try {
      if (!giftId) {
        return res.status(400).json({ msg: 'Event is required' });
      }

      // Verify gift belongs to user
      const gift = await prisma.gift.findFirst({
        where: {
          id: parseInt(giftId),
          userId: req.user.id,
        },
      });
      if (!gift) {
        return res.status(403).json({ msg: 'Not authorized to use this event' });
      }

      // Generate unique shareLink
      let shareLink;
      let attempts = 0;
      do {
        const slug = slugify(title);
        const code = Math.floor(10000 + Math.random() * 90000);
        shareLink = `wishlist/${slug}/${code}`;
        attempts++;
        if (attempts > 10) {
          // Fallback
          shareLink = `wishlist/${req.user.id}-${Date.now()}`;
          break;
        }
        var existing = await prisma.wishlist.findUnique({ where: { shareLink } });
      } while (existing);

      const wishlist = await prisma.wishlist.create({
        data: {
          userId: req.user.id,
          title,
          description,
          address,
          giftId: parseInt(giftId),
          shareLink,
        },
        include: {
          items: true,
          gift: true,
        },
      });

      res.json(wishlist);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get user's wishlists
  router.get('/my', auth(), async (req, res) => {
    try {
      const wishlists = await prisma.wishlist.findMany({
        where: { userId: req.user.id },
        include: { items: true, gift: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json(wishlists);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get wishlist by id (auth required, user must own it)
  router.get('/:id', auth(), async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.id);
      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
        include: { items: true, gift: true },
      });

      if (!wishlist) return res.status(404).json({ msg: 'Wishlist not found' });
      if (wishlist.userId !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

      res.json(wishlist);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update wishlist
  router.put('/:id', auth(), async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.id);
      const { title, description, address, giftId } = req.body;

      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
      });

      if (!wishlist) return res.status(404).json({ msg: 'Wishlist not found' });
      if (wishlist.userId !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

      if (!giftId) {
        return res.status(400).json({ msg: 'Event is required' });
      }

      // Verify gift belongs to user
      const gift = await prisma.gift.findFirst({
        where: {
          id: parseInt(giftId),
          userId: req.user.id,
        },
      });
      if (!gift) {
        return res.status(403).json({ msg: 'Not authorized to use this event' });
      }

      const updatedWishlist = await prisma.wishlist.update({
        where: { id: wishlistId },
        data: { title, description, address, giftId: parseInt(giftId) },
        include: { items: true, gift: true },
      });

      res.json(updatedWishlist);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete wishlist
  router.delete('/:id', auth(), async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.id);

      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
      });

      if (!wishlist) return res.status(404).json({ msg: 'Wishlist not found' });
      if (wishlist.userId !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

      await prisma.wishlist.delete({ where: { id: wishlistId } });

      res.json({ msg: 'Wishlist deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Add item to wishlist
  router.post('/:id/items', auth(), upload.single('image'), async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.id);
      const { name, productUrl, price, quantity, description, imageUrl: existingImageUrl } = req.body;

      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
      });

      if (!wishlist) return res.status(404).json({ msg: 'Wishlist not found' });
      if (wishlist.userId !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

      let finalImageUrl = existingImageUrl || null;

      // Upload image to Cloudinary if file is provided
      if (req.file) {
        const uploadResult = await uploadImage(req.file.buffer);
        finalImageUrl = uploadResult.secure_url;
      }

      const item = await prisma.wishlistItem.create({
        data: {
          wishlistId,
          name,
          productUrl,
          price: price ? parseFloat(price) : null,
          quantity: quantity ? parseInt(quantity) : 1,
          imageUrl: finalImageUrl,
          description,
          isCashGiftAllowed: true
        },
      });

      res.json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update wishlist item
  router.put('/:wishlistId/items/:itemId', auth(), upload.single('image'), async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.wishlistId);
      const itemId = parseInt(req.params.itemId);
      const { name, productUrl, price, quantity, description, imageUrl: existingImageUrl } = req.body;

      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
      });

      if (!wishlist) return res.status(404).json({ msg: 'Wishlist not found' });
      if (wishlist.userId !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

      const item = await prisma.wishlistItem.findUnique({
        where: { id: itemId },
      });

      if (!item || item.wishlistId !== wishlistId) return res.status(404).json({ msg: 'Item not found' });

      let finalImageUrl = existingImageUrl || item.imageUrl;

      // Upload new image to Cloudinary if file is provided
      if (req.file) {
        const uploadResult = await uploadImage(req.file.buffer);
        finalImageUrl = uploadResult.secure_url;
      }

      const updatedItem = await prisma.wishlistItem.update({
        where: { id: itemId },
        data: {
          name,
          productUrl,
          price: price ? parseFloat(price) : null,
          quantity: quantity ? parseInt(quantity) : 1,
          imageUrl: finalImageUrl,
          description,
          isCashGiftAllowed: true
        },
      });

      res.json(updatedItem);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete wishlist item
  router.delete('/:wishlistId/items/:itemId', auth(), async (req, res) => {
    try {
      const wishlistId = parseInt(req.params.wishlistId);
      const itemId = parseInt(req.params.itemId);

      const wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
      });

      if (!wishlist) return res.status(404).json({ msg: 'Wishlist not found' });
      if (wishlist.userId !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

      const item = await prisma.wishlistItem.findUnique({
        where: { id: itemId },
      });

      if (!item || item.wishlistId !== wishlistId) return res.status(404).json({ msg: 'Item not found' });

      await prisma.wishlistItem.delete({ where: { id: itemId } });

      res.json({ msg: 'Item deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get public wishlist by share link
  router.get('/public/:link(*)', async (req, res) => {
    try {
      const shareLink = `wishlist/${req.params.link}`;
      const wishlist = await prisma.wishlist.findUnique({
        where: { shareLink },
        include: {
          items: true,
          user: { select: { name: true, profilePicture: true } },
          gift: { select: { shareLink: true, id: true, title: true, type: true } },
        },
      });

      if (!wishlist) return res.status(404).json({ msg: 'Wishlist not found' });

      res.json(wishlist);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};
