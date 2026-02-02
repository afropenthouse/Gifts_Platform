
const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const multer = require('multer');
const { uploadImage } = require('../utils/cloudinary');
const { sendReminderEmail, sendRsvpCancellationEmail } = require('../utils/emailService');
const { sendRemindersForGift } = require('../utils/reminderService');

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
    const { type, title, description, date, deadline, address, details, customType, guestListMode, isSellingAsoebi, asoebiPrice, asoebiPriceMen, asoebiPriceWomen, asoebiBrideMenPrice, asoebiBrideWomenPrice, asoebiGroomMenPrice, asoebiGroomWomenPrice, asoebiBrideDescription, asoebiGroomDescription, asoebiBrideMenDescription, asoebiBrideWomenDescription, asoebiGroomMenDescription, asoebiGroomWomenDescription, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty } = req.body;

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
          deadline: deadline ? new Date(deadline) : null,
          address,
          picture: pictureUrl,
          details: details ? (typeof details === 'string' ? JSON.parse(details) : details) : null,
          customType,
          shareLink,
          guestListMode: guestListMode || 'restricted',
          isSellingAsoebi: isSellingAsoebi === 'true' || isSellingAsoebi === true,
          asoebiPrice: asoebiPrice ? parseFloat(asoebiPrice) : null,
          asoebiPriceMen: asoebiPriceMen ? parseFloat(asoebiPriceMen) : null,
          asoebiPriceWomen: asoebiPriceWomen ? parseFloat(asoebiPriceWomen) : null,
          asoebiBrideMenPrice: asoebiBrideMenPrice ? parseFloat(asoebiBrideMenPrice) : null,
          asoebiBrideWomenPrice: asoebiBrideWomenPrice ? parseFloat(asoebiBrideWomenPrice) : null,
          asoebiGroomMenPrice: asoebiGroomMenPrice ? parseFloat(asoebiGroomMenPrice) : null,
          asoebiGroomWomenPrice: asoebiGroomWomenPrice ? parseFloat(asoebiGroomWomenPrice) : null,
          asoebiBrideDescription,
          asoebiGroomDescription,
          asoebiBrideMenDescription,
          asoebiBrideWomenDescription,
          asoebiGroomMenDescription,
          asoebiGroomWomenDescription,
          asoebiQuantity: asoebiQuantity ? parseInt(asoebiQuantity) : null,
          asoebiQtyMen: asoebiQtyMen ? parseInt(asoebiQtyMen) : null,
          asoebiQtyWomen: asoebiQtyWomen ? parseInt(asoebiQtyWomen) : null,
          asoebiBrideMenQty: asoebiBrideMenQty ? parseInt(asoebiBrideMenQty) : null,
          asoebiBrideWomenQty: asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty) : null,
          asoebiGroomMenQty: asoebiGroomMenQty ? parseInt(asoebiGroomMenQty) : null,
          asoebiGroomWomenQty: asoebiGroomWomenQty ? parseInt(asoebiGroomWomenQty) : null,
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
      const gifts = await prisma.gift.findMany({ 
        where: { userId: req.user.id },
        include: {
          contributions: {
            where: { status: 'completed' },
            select: {
              asoebiQuantity: true,
              asoebiQtyMen: true,
              asoebiQtyWomen: true,
              asoebiBrideMenQty: true,
              asoebiBrideWomenQty: true,
              asoebiGroomMenQty: true,
              asoebiGroomWomenQty: true
            }
          }
        }
      });

      const giftsWithStats = gifts.map(gift => {
        const sold = {
          soldAsoebiQuantity: 0,
          soldAsoebiQtyMen: 0,
          soldAsoebiQtyWomen: 0,
          soldAsoebiBrideMenQty: 0,
          soldAsoebiBrideWomenQty: 0,
          soldAsoebiGroomMenQty: 0,
          soldAsoebiGroomWomenQty: 0
        };

        if (gift.contributions) {
          gift.contributions.forEach(c => {
            sold.soldAsoebiQuantity += c.asoebiQuantity || 0;
            sold.soldAsoebiQtyMen += c.asoebiQtyMen || 0;
            sold.soldAsoebiQtyWomen += c.asoebiQtyWomen || 0;
            sold.soldAsoebiBrideMenQty += c.asoebiBrideMenQty || 0;
            sold.soldAsoebiBrideWomenQty += c.asoebiBrideWomenQty || 0;
            sold.soldAsoebiGroomMenQty += c.asoebiGroomMenQty || 0;
            sold.soldAsoebiGroomWomenQty += c.asoebiGroomWomenQty || 0;
          });
        }
        
        // Remove contributions array to keep response clean
        const { contributions, ...giftData } = gift;
        return { ...giftData, ...sold };
      });

      res.json(giftsWithStats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update gift
  router.put('/:id', auth(), upload.single('picture'), async (req, res) => {
    const { type, title, description, date, deadline, address, details, customType, guestListMode, isSellingAsoebi, asoebiPrice, asoebiPriceMen, asoebiPriceWomen, asoebiBrideMenPrice, asoebiBrideWomenPrice, asoebiGroomMenPrice, asoebiGroomWomenPrice, asoebiBrideDescription, asoebiGroomDescription, asoebiBrideMenDescription, asoebiBrideWomenDescription, asoebiGroomMenDescription, asoebiGroomWomenDescription, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty } = req.body;
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
          deadline: deadline ? new Date(deadline) : null,
          address,
          picture: pictureUrl,
          details: details ? (typeof details === 'string' ? JSON.parse(details) : details) : null,
          customType,
          guestListMode,
          isSellingAsoebi: isSellingAsoebi === 'true' || isSellingAsoebi === true,
          asoebiPrice: asoebiPrice ? parseFloat(asoebiPrice) : null,
          asoebiPriceMen: asoebiPriceMen ? parseFloat(asoebiPriceMen) : null,
          asoebiPriceWomen: asoebiPriceWomen ? parseFloat(asoebiPriceWomen) : null,
          asoebiBrideMenPrice: asoebiBrideMenPrice ? parseFloat(asoebiBrideMenPrice) : null,
          asoebiBrideWomenPrice: asoebiBrideWomenPrice ? parseFloat(asoebiBrideWomenPrice) : null,
          asoebiGroomMenPrice: asoebiGroomMenPrice ? parseFloat(asoebiGroomMenPrice) : null,
          asoebiGroomWomenPrice: asoebiGroomWomenPrice ? parseFloat(asoebiGroomWomenPrice) : null,
          asoebiBrideDescription,
          asoebiGroomDescription,
          asoebiBrideMenDescription,
          asoebiBrideWomenDescription,
          asoebiGroomMenDescription,
          asoebiGroomWomenDescription,
          asoebiQuantity: asoebiQuantity ? parseInt(asoebiQuantity) : null,
          asoebiQtyMen: asoebiQtyMen ? parseInt(asoebiQtyMen) : null,
          asoebiQtyWomen: asoebiQtyWomen ? parseInt(asoebiQtyWomen) : null,
          asoebiBrideMenQty: asoebiBrideMenQty ? parseInt(asoebiBrideMenQty) : null,
          asoebiBrideWomenQty: asoebiBrideWomenQty ? parseInt(asoebiBrideWomenQty) : null,
          asoebiGroomMenQty: asoebiGroomMenQty ? parseInt(asoebiGroomMenQty) : null,
          asoebiGroomWomenQty: asoebiGroomWomenQty ? parseInt(asoebiGroomWomenQty) : null,
        },
      });

      const soldStats = await prisma.contribution.aggregate({
        where: { 
          giftId: giftId,
          status: 'completed'
        },
        _sum: {
          asoebiQuantity: true,
          asoebiQtyMen: true,
          asoebiQtyWomen: true,
          asoebiBrideMenQty: true,
          asoebiBrideWomenQty: true,
          asoebiGroomMenQty: true,
          asoebiGroomWomenQty: true
        }
      });

      const sold = {
        soldAsoebiQuantity: soldStats._sum.asoebiQuantity || 0,
        soldAsoebiQtyMen: soldStats._sum.asoebiQtyMen || 0,
        soldAsoebiQtyWomen: soldStats._sum.asoebiQtyWomen || 0,
        soldAsoebiBrideMenQty: soldStats._sum.asoebiBrideMenQty || 0,
        soldAsoebiBrideWomenQty: soldStats._sum.asoebiBrideWomenQty || 0,
        soldAsoebiGroomMenQty: soldStats._sum.asoebiGroomMenQty || 0,
        soldAsoebiGroomWomenQty: soldStats._sum.asoebiGroomWomenQty || 0
      };

      res.json({ ...updatedGift, ...sold });
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
        if (!gift.date) {
          return res.status(400).json({ msg: 'Event date is required for this reminder type' });
        }
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
        await sendRemindersForGift(updatedGift);
        // Fetch updated gift to return correct details (reminder cleared)
        const finalGift = await prisma.gift.findUnique({ where: { id: giftId } });
        return res.json(finalGift);
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
        include: { 
          user: { select: { name: true, profilePicture: true } },
          _count: { select: { contributions: true } }
        },
      });
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      // Aggregate sold Asoebi quantities
      const soldStats = await prisma.contribution.aggregate({
        where: { 
          giftId: gift.id,
          isAsoebi: true,
          status: 'completed'
        },
        _sum: {
          asoebiQuantity: true,
          asoebiQtyMen: true,
          asoebiQtyWomen: true,
          asoebiBrideMenQty: true,
          asoebiBrideWomenQty: true,
          asoebiGroomMenQty: true,
          asoebiGroomWomenQty: true
        }
      });

      const giftWithStats = {
        ...gift,
        soldAsoebiQuantity: soldStats._sum.asoebiQuantity || 0,
        soldAsoebiQtyMen: soldStats._sum.asoebiQtyMen || 0,
        soldAsoebiQtyWomen: soldStats._sum.asoebiQtyWomen || 0,
        soldAsoebiBrideMenQty: soldStats._sum.asoebiBrideMenQty || 0,
        soldAsoebiBrideWomenQty: soldStats._sum.asoebiBrideWomenQty || 0,
        soldAsoebiGroomMenQty: soldStats._sum.asoebiGroomMenQty || 0,
        soldAsoebiGroomWomenQty: soldStats._sum.asoebiGroomWomenQty || 0,
      };

      res.json(giftWithStats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};
