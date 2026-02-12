
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
    const { type, title, description, story, date, deadline, address, details, customType, guestListMode, enableCashGifts, isSellingAsoebi, asoebiPrice, asoebiPriceMen, asoebiPriceWomen, asoebiBrideMenPrice, asoebiBrideWomenPrice, asoebiGroomMenPrice, asoebiGroomWomenPrice, asoebiBrideDescription, asoebiGroomDescription, asoebiBrideMenDescription, asoebiBrideWomenDescription, asoebiGroomMenDescription, asoebiGroomWomenDescription, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItems } = req.body;

    try {
      let pictureUrl = null;

      // Upload image to Cloudinary if file is provided
      if (req.file) {
        const uploadResult = await uploadImage(req.file.buffer);
        pictureUrl = uploadResult.secure_url;
      }

      // Parse asoebiItems if present
      let asoebiItemsParsed = [];
      if (asoebiItems) {
        try {
          asoebiItemsParsed = typeof asoebiItems === 'string' ? JSON.parse(asoebiItems) : asoebiItems;
        } catch (e) {
          console.error("Error parsing asoebiItems", e);
        }
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

      const detailsParsed = details ? (typeof details === 'string' ? JSON.parse(details) : details) : {};
      
      // Automatically set a reminder for 1 week (7 days) before the event if date is provided
      if (date) {
        const eventDateObj = new Date(date);
        const reminderDate = new Date(eventDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
        reminderDate.setHours(9, 0, 0, 0); // 9 AM
        
        detailsParsed.reminder = '1week';
        detailsParsed.reminderDateTime = reminderDate.toISOString();
      }

      const gift = await prisma.gift.create({
        data: {
          userId: req.user.id,
          type,
          title,
          description,
          story,
          date: date ? new Date(date) : null,
          deadline: deadline ? new Date(deadline) : null,
          address,
          picture: pictureUrl,
          details: detailsParsed,
          customType,
          shareLink,
          guestListMode: guestListMode || 'restricted',
          enableCashGifts: enableCashGifts === 'true' || enableCashGifts === true,
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
          asoebiItems: {
            create: asoebiItemsParsed.map(item => ({
              name: item.name,
              price: parseFloat(item.price),
              stock: parseInt(item.stock || 0),
              category: item.category || null
            }))
          }
        },
        include: {
          asoebiItems: true
        }
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
          asoebiItems: true,
          contributions: {
            where: { status: 'completed' },
            select: {
              asoebiQuantity: true,
              asoebiQtyMen: true,
              asoebiQtyWomen: true,
              asoebiBrideMenQty: true,
              asoebiBrideWomenQty: true,
              asoebiGroomMenQty: true,
              asoebiGroomWomenQty: true,
              asoebiItemsDetails: true
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

        const soldItemsMap = {};

        if (gift.contributions) {
          gift.contributions.forEach(c => {
            sold.soldAsoebiQuantity += c.asoebiQuantity || 0;
            sold.soldAsoebiQtyMen += c.asoebiQtyMen || 0;
            sold.soldAsoebiQtyWomen += c.asoebiQtyWomen || 0;
            sold.soldAsoebiBrideMenQty += c.asoebiBrideMenQty || 0;
            sold.soldAsoebiBrideWomenQty += c.asoebiBrideWomenQty || 0;
            sold.soldAsoebiGroomMenQty += c.asoebiGroomMenQty || 0;
            sold.soldAsoebiGroomWomenQty += c.asoebiGroomWomenQty || 0;
            
            if (c.asoebiItemsDetails && Array.isArray(c.asoebiItemsDetails)) {
               c.asoebiItemsDetails.forEach(item => {
                  if (item.asoebiItemId) {
                     soldItemsMap[item.asoebiItemId] = (soldItemsMap[item.asoebiItemId] || 0) + (item.quantity || 0);
                  }
               });
            }
          });
        }
        
        // Attach sold stats to asoebiItems
        if (gift.asoebiItems) {
            gift.asoebiItems = gift.asoebiItems.map(item => ({
                ...item,
                sold: soldItemsMap[item.id] || 0
            }));
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
    const { type, title, description, story, date, deadline, address, details, customType, guestListMode, enableCashGifts, isSellingAsoebi, asoebiPrice, asoebiPriceMen, asoebiPriceWomen, asoebiBrideMenPrice, asoebiBrideWomenPrice, asoebiGroomMenPrice, asoebiGroomWomenPrice, asoebiBrideDescription, asoebiGroomDescription, asoebiBrideMenDescription, asoebiBrideWomenDescription, asoebiGroomMenDescription, asoebiGroomWomenDescription, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItems } = req.body;
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

      // Parse asoebiItems if present
      let asoebiItemsParsed = [];
      if (asoebiItems) {
        try {
          asoebiItemsParsed = typeof asoebiItems === 'string' ? JSON.parse(asoebiItems) : asoebiItems;
        } catch (e) {
          console.error("Error parsing asoebiItems", e);
        }
      }

      const detailsParsed = details ? (typeof details === 'string' ? JSON.parse(details) : details) : {};
      
      // Automatically update/set reminder for 1 week (7 days) before the event if date is provided
      if (date) {
        const eventDateObj = new Date(date);
        const reminderDate = new Date(eventDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
        reminderDate.setHours(9, 0, 0, 0); // 9 AM
        
        // Only set automatically if no reminder exists or if it was already an automatic 1week reminder
        if (!detailsParsed.reminder || detailsParsed.reminder === 'none' || detailsParsed.reminder === '1week') {
          detailsParsed.reminder = '1week';
          detailsParsed.reminderDateTime = reminderDate.toISOString();
        }
      }

      const updateData = {
          type,
          title,
          description,
          story,
          date: date ? new Date(date) : null,
          deadline: deadline ? new Date(deadline) : null,
          address,
          picture: pictureUrl,
          details: detailsParsed,
          customType,
          guestListMode,
          enableCashGifts: enableCashGifts === 'true' || enableCashGifts === true,
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
      };

      // Perform main update first
      await prisma.gift.update({
        where: { id: giftId },
        data: updateData,
      });

      // Handle Asoebi Items manually to preserve Sold history
      if (asoebiItemsParsed.length > 0 || (isSellingAsoebi === 'true' || isSellingAsoebi === true)) {
          const existingItems = await prisma.asoebiItem.findMany({ where: { giftId } });
          const incomingIds = asoebiItemsParsed.filter(i => i.id).map(i => parseInt(i.id));
          
          // Delete removed items
          const itemsToDelete = existingItems.filter(i => !incomingIds.includes(i.id));
          if (itemsToDelete.length > 0) {
             await prisma.asoebiItem.deleteMany({
                 where: { id: { in: itemsToDelete.map(i => i.id) } }
             });
          }

          // Update or Create items
          for (const item of asoebiItemsParsed) {
              if (item.id) {
                  const existing = existingItems.find(e => e.id === parseInt(item.id));
                  if (existing) {
                      // Calculate Total Stock = Available (User Input) + Sold (Already Sold)
                      const availableInput = parseInt(item.stock || 0);
                      const totalStock = availableInput + existing.sold;
                      
                      await prisma.asoebiItem.update({
                          where: { id: existing.id },
                          data: {
                              name: item.name,
                              price: parseFloat(item.price),
                              stock: totalStock,
                              category: item.category || null
                          }
                      });
                  }
              } else {
                  await prisma.asoebiItem.create({
                      data: {
                          giftId: giftId,
                          name: item.name,
                          price: parseFloat(item.price),
                          stock: parseInt(item.stock || 0),
                          category: item.category || null
                      }
                  });
              }
          }
      }

      const updatedGift = await prisma.gift.findUnique({
        where: { id: giftId },
        include: { asoebiItems: true }
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
    const { reminder, reminderDateTime, eventDate } = req.body;

    try {
      const gift = await prisma.gift.findUnique({
        where: { id: giftId },
        select: { id: true, userId: true, details: true, date: true, shareLink: true }
      });

      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      // If eventDate is provided, update the gift's date first
      let currentGiftDate = gift.date;
      if (eventDate) {
        const updatedDate = new Date(eventDate);
        if (!isNaN(updatedDate.getTime())) {
          await prisma.gift.update({
            where: { id: giftId },
            data: { date: updatedDate }
          });
          currentGiftDate = updatedDate;
        }
      }

      const details = gift.details || {};
      details.reminder = reminder;
      let scheduledDateTime;
      if (reminder === 'custom' && reminderDateTime) {
        details.reminderDateTime = reminderDateTime;
        scheduledDateTime = new Date(reminderDateTime);
      } else if (reminder !== 'custom' && reminder !== 'none') {
        if (!currentGiftDate) {
          return res.status(400).json({ msg: 'Event date is required for this reminder type' });
        }
        // For predefined, set default time 09:00 on the calculated date
        const eventDateObj = new Date(currentGiftDate);
        let reminderDate;
        switch (reminder) {
          case '14days':
            reminderDate = new Date(eventDateObj.getTime() - 14 * 24 * 60 * 60 * 1000);
            break;
          case '1week':
            reminderDate = new Date(eventDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '3days':
            reminderDate = new Date(eventDateObj.getTime() - 3 * 24 * 60 * 60 * 1000);
            break;
          case '1day':
            reminderDate = new Date(eventDateObj.getTime() - 1 * 24 * 60 * 60 * 1000);
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
          _count: { select: { contributions: true } },
          asoebiItems: true,
          contributions: {
             where: { status: 'completed', isAsoebi: true },
             select: { asoebiItemsDetails: true }
          }
        },
      });
      if (!gift) return res.status(404).json({ msg: 'Gift not found' });

      // Aggregate sold Asoebi quantities (Legacy)
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

      // Calculate sold items for dynamic list
      const soldItemsMap = {};
      if (gift.contributions) {
         gift.contributions.forEach(c => {
             if (c.asoebiItemsDetails && Array.isArray(c.asoebiItemsDetails)) {
                c.asoebiItemsDetails.forEach(item => {
                   if (item.asoebiItemId) {
                      soldItemsMap[item.asoebiItemId] = (soldItemsMap[item.asoebiItemId] || 0) + (item.quantity || 0);
                   }
                });
             }
         });
      }

      const asoebiItemsWithStats = gift.asoebiItems ? gift.asoebiItems.map(item => ({
          ...item,
          sold: soldItemsMap[item.id] || 0
      })) : [];

      // Remove contributions to clean up response
      const { contributions, ...giftData } = gift;

      const giftWithStats = {
        ...giftData,
        asoebiItems: asoebiItemsWithStats,
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
