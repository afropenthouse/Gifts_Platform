
const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const multer = require('multer');
const { uploadImage } = require('../utils/cloudinary');
const { sendReminderEmail, sendRsvpCancellationEmail } = require('../utils/emailService');
const { sendRemindersForGift } = require('../utils/reminderService');
const paystack = require('../utils/paystack');
const flutterwave = require('../utils/flutterwave');

const PREMIUM_WEBSITE_TEMPLATES = ['emerald', 'sapphire', 'ruby', 'pearl', 'amethyst'];

const getUnlockedWebsiteTemplates = async (gift) => {
  if (!gift) {
    return { hasTemplatePremium: false, unlockedTemplates: [], pendingTemplatePurchase: null };
  }

  // Check for legacy premium payment (unlocks all templates)
  const legacyPayment = await prisma.premiumPayment.findUnique({
    where: { giftId: gift.id }
  });
  const hasTemplatePremium = !!legacyPayment && legacyPayment.status === 'success' && legacyPayment.amount >= 10000;

  // Check for individual template purchases
  const templatePurchases = await prisma.templatePurchase.findMany({
    where: { giftId: gift.id, status: 'success' }
  });
  const unlockedTemplates = templatePurchases.map(tp => tp.template);

  // Check for pending template purchase
  const pendingTemplatePurchase = await prisma.templatePurchase.findFirst({
    where: { giftId: gift.id, status: 'pending' }
  });

  return {
    hasTemplatePremium,
    unlockedTemplates: hasTemplatePremium ? [...PREMIUM_WEBSITE_TEMPLATES] : unlockedTemplates,
    pendingTemplatePurchase: pendingTemplatePurchase ? pendingTemplatePurchase.template : null
  };
};

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
    const { type, title, description, story, date, deadline, address, details, customType, guestListMode, enableRSVP, enableGuestNotes, enableCashGifts, isSellingAsoebi, asoebiPrice, asoebiPriceMen, asoebiPriceWomen, asoebiBrideMenPrice, asoebiBrideWomenPrice, asoebiGroomMenPrice, asoebiGroomWomenPrice, asoebiBrideDescription, asoebiGroomDescription, asoebiBrideMenDescription, asoebiBrideWomenDescription, asoebiGroomMenDescription, asoebiGroomWomenDescription, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItems } = req.body;

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
          enableRSVP: enableRSVP === 'true' || enableRSVP === true,
          enableGuestNotes: enableGuestNotes === 'true' || enableGuestNotes === true,
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
          wishlists: {
            select: {
              id: true,
              shareLink: true,
              title: true
            }
          },
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
    const { type, title, description, story, date, deadline, address, details, customType, guestListMode, enableRSVP, enableGuestNotes, enableCashGifts, isSellingAsoebi, asoebiPrice, asoebiPriceMen, asoebiPriceWomen, asoebiBrideMenPrice, asoebiBrideWomenPrice, asoebiGroomMenPrice, asoebiGroomWomenPrice, asoebiBrideDescription, asoebiGroomDescription, asoebiBrideMenDescription, asoebiBrideWomenDescription, asoebiGroomMenDescription, asoebiGroomWomenDescription, asoebiQuantity, asoebiQtyMen, asoebiQtyWomen, asoebiBrideMenQty, asoebiBrideWomenQty, asoebiGroomMenQty, asoebiGroomWomenQty, asoebiItems } = req.body;
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
          enableRSVP: enableRSVP === 'true' || enableRSVP === true,
          enableGuestNotes: enableGuestNotes === 'true' || enableGuestNotes === true,
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

  // Get website by share link (public) - supports both /website/:shareLink and /website/:template/:shareLink
  router.get('/website/*', async (req, res) => {
    try {
      const parts = req.params[0].split('/').filter(Boolean);
      let shareLink;
      
      // If there are two parts, the second is the share link
      if (parts.length === 2) {
        shareLink = parts[1];
      } else if (parts.length === 1) {
        // If only one part, that's the share link
        shareLink = parts[0];
      }
      
      if (!shareLink) {
        return res.status(400).json({ msg: 'Share link is required' });
      }

      const website = await prisma.website.findUnique({
        where: { shareLink },
        include: {
          gift: {
            select: {
              id: true,
              type: true,
              title: true,
              date: true,
              picture: true,
              shareLink: true,
              isPremium: true,
              enableGuestNotes: true,
              wishlists: {
                include: { items: true }
              }
            }
          }
        }
      });

      if (!website) {
        return res.status(404).json({ msg: 'Website not found' });
      }

      if (!website.published) {
        return res.status(403).json({ msg: 'Website is not published' });
      }

      const premiumState = await getUnlockedWebsiteTemplates(website.gift);

      res.json({
        ...website,
        ...premiumState
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get website settings for a gift (must come before catch-all /:link(*) route)
  router.get('/:id/website', auth(), async (req, res) => {
    const giftId = parseInt(req.params.id);

    try {
      const gift = await prisma.gift.findUnique({ where: { id: giftId } });
      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      let website = await prisma.website.findUnique({
        where: { giftId: giftId },
        include: {
          gift: {
            select: {
              id: true,
              title: true,
              type: true,
              date: true,
              picture: true,
              shareLink: true,
              isPremium: true
            }
          }
        }
      });

      if (!website) {
        const names = (gift.title || '').split(' & ');
        website = await prisma.website.create({
          data: {
            userId: req.user.id,
            giftId: giftId,
            template: 'elegant',
            primaryColor: '#2E235C',
            secondaryColor: '#E2B06B',
            venue: '',
            coupleName1: names[0] || '',
            coupleName2: names[1] || '',
            story: '',
            published: false,
            slug: `${gift.title?.toLowerCase().replace(/\s+/g, '-') || 'wedding'}-${Date.now()}`,
            shareLink: crypto.randomBytes(16).toString('hex'),
            heroTitle: names[0] ? `${names[0]} & ${names[1] || ''}` : undefined,
            heroSubtitle: 'We invite you to celebrate our special day',
            fontFamily: 'Georgia, serif'
          },
          include: {
            gift: {
              select: {
                id: true,
                title: true,
                type: true,
                date: true,
                picture: true,
                shareLink: true,
                isPremium: true
              }
            }
          }
        });
      }

      const { hasTemplatePremium, unlockedTemplates, pendingTemplatePurchase } = await getUnlockedWebsiteTemplates(gift);

      res.json({
        ...website,
        hasTemplatePremium,
        unlockedTemplates,
        pendingTemplatePurchase,
        isEventPremium: gift.isPremium
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get gift by share link (supports slashes in shareLink like "slug/123")
  router.get('/:link(*)', async (req, res, next) => {
    try {
      // Skip the wildcard for known reserved route prefixes so routes defined
      // later (e.g. GET /premium/payments, GET /:id/website) are reachable.
      const firstSegment = String(req.params.link || '').split('/')[0];
      const reservedPrefixes = ['premium', 'my', 'public', 'website', 'vendors', 'guests', 'contributions'];
      if (reservedPrefixes.includes(firstSegment)) {
        return next();
      }
      const gift = await prisma.gift.findUnique({
        where: { shareLink: req.params.link },
        include: { 
          user: { select: { name: true, profilePicture: true } },
          _count: { 
            select: { 
              contributions: {
                where: { amount: { gt: 0 } }
              } 
            } 
          },
          asoebiItems: true,
          wishlists: {
            include: { items: true }
          },
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

  // Update website settings
  router.put('/:id/website', auth(), async (req, res) => {
    const giftId = parseInt(req.params.id);
    const { 
      template, 
      primaryColor, 
      secondaryColor, 
      venue, 
      coupleName1, 
      coupleName2, 
      story,
      published,
      heroTitle,
      heroSubtitle,
      fontFamily,
      ceremony,
      reception,
      date,
      content
    } = req.body;

    try {
      const gift = await prisma.gift.findUnique({ where: { id: giftId } });
      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      let website = await prisma.website.findUnique({
        where: { giftId: giftId }
      });

      const requestedTemplate = String(template || '').toLowerCase();
      const effectiveTemplate = requestedTemplate || website?.template || '';
      const premiumState = await getUnlockedWebsiteTemplates(gift);
      if (
        effectiveTemplate &&
        PREMIUM_WEBSITE_TEMPLATES.includes(effectiveTemplate) &&
        !premiumState.unlockedTemplates.includes(effectiveTemplate)
      ) {
        return res.status(403).json({ msg: 'Please unlock this premium template before previewing, saving, or publishing it.' });
      }

      if (website) {
        website = await prisma.website.update({
          where: { giftId: giftId },
          data: {
            template: template || website.template,
            primaryColor: primaryColor || website.primaryColor,
            secondaryColor: secondaryColor || website.secondaryColor,
            venue: venue,
            coupleName1: coupleName1,
            coupleName2: coupleName2,
            story: story,
            heroTitle: heroTitle,
            heroSubtitle: heroSubtitle,
            fontFamily: fontFamily,
            ceremony: ceremony !== undefined ? ceremony : website.ceremony,
            reception: reception !== undefined ? reception : website.reception,
            date: date !== undefined ? date : website.date,
            published: published !== undefined ? published : website.published,
            gallery: content?.gallery !== undefined ? content.gallery : website.gallery,
            showWellWishes: content?.showWellWishes !== undefined ? content.showWellWishes : website.showWellWishes,
            enableWishlistButton: content?.enableWishlistButton !== undefined ? content.enableWishlistButton : website.enableWishlistButton
          }
        });
      } else {
        const websiteSlug = `${gift.title?.toLowerCase().replace(/\s+/g, '-') || 'wedding'}-${Date.now()}`;
        const websiteShareLink = crypto.randomBytes(16).toString('hex');
        
        const coupleNames = (coupleName1 || gift.title || '').split(' & ');
        
        website = await prisma.website.create({
          data: {
            userId: req.user.id,
            giftId: giftId,
            template: template || 'elegant',
            primaryColor: primaryColor || '#2E235C',
            secondaryColor: secondaryColor || '#E2B06B',
            venue: venue,
            coupleName1: coupleName1 || (coupleNames[0] || ''),
            coupleName2: coupleName2 || (coupleNames[1] || ''),
            story: story,
            published: published || false,
            slug: websiteSlug,
            shareLink: websiteShareLink,
            heroTitle: heroTitle || (coupleName1 ? `${coupleName1} & ${coupleName2}` : undefined),
            heroSubtitle: heroSubtitle || 'We invite you to celebrate our special day',
            fontFamily: fontFamily || 'Georgia, serif',
            ceremony: ceremony || null,
            reception: reception || null,
            date: date || null,
            gallery: content?.gallery || [],
            showWellWishes: content?.showWellWishes || false,
            enableWishlistButton: content?.enableWishlistButton !== undefined ? content.enableWishlistButton : true
          }
        });
      }

      const enriched = await prisma.website.findUnique({
        where: { id: website.id },
        include: {
          gift: {
            select: {
              id: true,
              title: true,
              type: true,
              date: true,
              picture: true,
              shareLink: true
            }
          }
        }
      });

      res.json({
        ...enriched,
        ...premiumState,
        isEventPremium: gift.isPremium
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });


  // Initialize premium upgrade payment
  router.post('/:id/premium/initialize', auth(), async (req, res) => {
    const giftId = parseInt(req.params.id);
    const { type = 'event', template } = req.body; // 'event' (50k) or 'template' (10k per template)
    const PREMIUM_TEMPLATES = PREMIUM_WEBSITE_TEMPLATES;
    console.log('Premium initialize request body:', req.body);
    try {
      const gift = await prisma.gift.findUnique({ 
        where: { id: giftId },
        include: { user: true }
      });
      
      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      if (type === 'event' && gift.isPremium) {
        return res.status(400).json({ msg: 'This gift is already premium' });
      }

      // Template unlocks are now per-template; a template name is required.
      let templateKey = null;
      if (type === 'template') {
        templateKey = String(template || '').toLowerCase();
        console.log('templateKey set to:', templateKey);
        if (!PREMIUM_TEMPLATES.includes(templateKey)) {
          return res.status(400).json({ msg: 'Invalid premium template' });
        }
        // Already unlocked? (per-template, legacy single-payment, or full premium event)
        const existingTemplatePurchase = await prisma.templatePurchase.findUnique({
          where: { giftId_template: { giftId, template: templateKey } }
        });
        if (gift.isPremium || (existingTemplatePurchase && existingTemplatePurchase.status === 'success')) {
          return res.status(400).json({ msg: 'This template is already unlocked' });
        }
        const legacyPayment = await prisma.premiumPayment.findUnique({ where: { giftId } });
        if (legacyPayment && legacyPayment.status === 'success' && legacyPayment.amount >= 10000) {
          return res.status(400).json({ msg: 'Premium templates are already unlocked for this event' });
        }
        // Auto-cancel any stale pending template purchase for this gift/template so the user can retry cleanly.
        await prisma.templatePurchase.updateMany({
          where: { giftId, template: templateKey, status: 'pending' },
          data: { status: 'cancelled' }
        });
      }

      // Check if there's already a successful payment for this type
      const existingPayment = await prisma.premiumPayment.findUnique({
        where: { giftId }
      });
      
      if (type === 'event' && existingPayment && existingPayment.status === 'success' && existingPayment.amount >= 50000) {
        return res.status(400).json({ msg: 'This gift is already premium' });
      }

      const amount = type === 'template' ? 10000 : 50000; // 10k or 50k NGN
      const tx_ref = `${type === 'template' ? `template-premium-${templateKey}` : 'premium'}-${giftId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const redirect_url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?giftId=${giftId}&reference=${tx_ref}&type=${type}${templateKey ? `&template=${templateKey}` : ''}`;

      const metadata = {
        giftId,
        userId: req.user.id,
        type: type === 'template' ? 'template_premium_upgrade' : 'premium_upgrade',
        template: templateKey || undefined,
        customizations: {
          title: type === 'template' ? `Premium Template (${templateKey})` : 'Premium Upgrade',
          description: type === 'template' 
            ? `Unlock the ${templateKey} premium wedding website template for ${gift.title || 'your gift'}`
            : `Upgrade ${gift.title || 'your gift'} to premium`
        }
      };

      // Initialize Paystack (since it's NGN)
      const psPayload = {
        reference: tx_ref,
        amount,
        currency: 'NGN',
        callback_url: redirect_url,
        email: req.user.email,
        metadata,
        channels: ['bank_transfer', 'card', 'ussd', 'qr', 'mobile_money', 'bank'],
      };

      const psResponse = await paystack.initializePayment(psPayload);
      
      // Keep a payment row in sync so the dashboard can show history reliably.
      if (type === 'template') {
        await prisma.templatePurchase.upsert({
          where: { giftId_template: { giftId, template: templateKey } },
          update: {
            userId: req.user.id,
            amount,
            transactionId: tx_ref,
            status: 'pending'
          },
          create: {
            userId: req.user.id,
            giftId,
            template: templateKey,
            amount,
            transactionId: tx_ref,
            status: 'pending'
          }
        });
      } else {
        await prisma.premiumPayment.upsert({
          where: { giftId },
          update: {
            userId: req.user.id,
            amount,
            transactionId: tx_ref,
            status: 'pending'
          },
          create: {
            userId: req.user.id,
            giftId,
            amount,
            transactionId: tx_ref,
            status: 'pending'
          }
        });
      }

      // Return the Paystack response directly for simplicity
      return res.json({
        ...psResponse,
        authorization_url: psResponse?.data?.authorization_url,
        provider: 'paystack',
      });
    } catch (err) {
      console.error('Initialize premium payment error:', err?.message || err);
      res.status(500).json({ msg: 'Failed to initialize payment', error: err?.message });
    }
  });

  // Cancel pending premium template purchase
  router.post('/:id/premium/cancel', auth(), async (req, res) => {
    const giftId = parseInt(req.params.id);
    const { template } = req.body;
    if (!template) {
      return res.status(400).json({ msg: 'Template is required' });
    }
    const templateKey = String(template).toLowerCase();
    try {
      const gift = await prisma.gift.findUnique({ where: { id: giftId } });
      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }
      await prisma.templatePurchase.updateMany({
        where: {
          giftId,
          template: templateKey,
          status: 'pending'
        },
        data: { status: 'cancelled' }
      });
      res.json({ msg: 'Pending template purchase cancelled' });
    } catch (err) {
      console.error('Cancel pending template purchase error:', err?.message || err);
      res.status(500).json({ msg: 'Failed to cancel pending purchase', error: err?.message });
    }
  });

  // Verify premium upgrade payment
  router.post('/:id/premium/verify', auth(), async (req, res) => {
    const giftId = parseInt(req.params.id);
    // Get reference from query params or request body
    const reference = req.query.reference || req.body.transactionId || req.body.txRef;
    const type = req.query.type || req.body.type || (String(reference).startsWith('template-premium') ? 'template' : 'event');
    const PREMIUM_TEMPLATES = PREMIUM_WEBSITE_TEMPLATES;
    if (!reference) {
      return res.status(400).json({ msg: 'Transaction reference is required' });
    }

    // Resolve which premium template this payment is for (template flow only)
    let templateKey = req.query.template || req.body.template || null;
    if (type === 'template' && !templateKey && String(reference).startsWith('template-premium-')) {
      const parts = String(reference).split('-'); // template-premium-<template>-<giftId>-<ts>
      if (parts.length >= 3) templateKey = parts[2];
    }
    if (type === 'template') {
      templateKey = String(templateKey || '').toLowerCase();
      if (!PREMIUM_TEMPLATES.includes(templateKey)) {
        return res.status(400).json({ msg: 'Invalid premium template' });
      }
    }

    try {
      const gift = await prisma.gift.findUnique({ 
        where: { id: giftId },
        include: { user: true }
      });
      
      if (!gift || gift.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Gift not found' });
      }

      let response;
      let provider = 'paystack';

      try {
        response = await paystack.verifyTransaction(reference);
      } catch (psErr) {
        try {
          response = await flutterwave.verifyTransaction(reference);
          provider = 'flutterwave';
        } catch (fwErr) {
          console.error('Premium payment verification failed:', psErr, fwErr);
          return res.status(400).json({ msg: 'Payment verification failed' });
        }
      }

      const isSuccess = provider === 'paystack' 
        ? !!response?.status && response?.data?.status === 'success'
        : !!response?.status && ['successful', 'success', 'completed'].includes(String(response?.data?.status).toLowerCase());

      if (!isSuccess) {
        if (type === 'template' && templateKey) {
          await prisma.templatePurchase.updateMany({
            where: {
              giftId,
              template: templateKey,
              status: 'pending'
            },
            data: { status: 'failed' }
          });
        } else if (type === 'event') {
          await prisma.premiumPayment.updateMany({
            where: {
              giftId,
              status: 'pending'
            },
            data: { status: 'failed' }
          });
        }
        return res.status(400).json({ msg: 'Payment not successful' });
      }

      const amount = type === 'template' ? 10000 : 50000;

      if (type === 'template') {
        // Record the per-template unlock
        await prisma.templatePurchase.upsert({
          where: { giftId_template: { giftId, template: templateKey } },
          update: {
            userId: req.user.id,
            amount,
            transactionId: reference,
            status: 'success'
          },
          create: {
            userId: req.user.id,
            giftId,
            template: templateKey,
            amount,
            transactionId: reference,
            status: 'success'
          }
        });

        return res.json({ msg: `The ${templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} template is now unlocked`, type, template: templateKey });
      }

      // Event upgrade flow (unchanged) — mark gift premium
      const paymentUpdate = {
        userId: req.user.id,
        amount,
        transactionId: reference,
        status: 'success'
      };

      const operations = [
        prisma.premiumPayment.upsert({
          where: { giftId },
          update: paymentUpdate,
          create: { ...paymentUpdate, giftId }
        }),
        prisma.gift.update({
          where: { id: giftId },
          data: { isPremium: true }
        })
      ];

      await prisma.$transaction(operations);

      const updatedGift = await prisma.gift.findUnique({ where: { id: giftId } });
      res.json({ msg: 'Premium upgrade successful', gift: updatedGift, type });
    } catch (err) {
      console.error('Verify premium payment error:', err?.message || err);
      res.status(500).json({ msg: 'Failed to verify payment', error: err?.message });
    }
  });

  // Get user's premium payments
  router.get('/premium/payments', auth(), async (req, res) => {
    try {
      const premiumGifts = await prisma.gift.findMany({
        where: { userId: req.user.id, isPremium: true },
        select: { id: true }
      });

      const existingPayments = await prisma.premiumPayment.findMany({
        where: { userId: req.user.id },
        select: { giftId: true }
      });

      const existingGiftIds = new Set(existingPayments.map((payment) => payment.giftId));

      for (const gift of premiumGifts) {
        if (!existingGiftIds.has(gift.id)) {
          await prisma.premiumPayment.upsert({
            where: { giftId: gift.id },
            update: {
              userId: req.user.id,
              amount: 50000,
              status: 'success'
            },
            create: {
              userId: req.user.id,
              giftId: gift.id,
              amount: 50000,
              status: 'success',
              transactionId: `legacy-premium-${gift.id}`
            }
          });
        }
      }

      const [premiumPayments, templatePurchases] = await Promise.all([
        prisma.premiumPayment.findMany({
          where: { userId: req.user.id },
          include: { gift: true },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.templatePurchase.findMany({
          where: { userId: req.user.id },
          include: { gift: true },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const payments = [
        ...premiumPayments.map((p) => ({ ...p, paymentType: 'event' })),
        ...templatePurchases.map((p) => ({ ...p, paymentType: 'template' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(payments);
    } catch (err) {
      console.error('Get premium payments error:', err?.message || err);
      res.status(500).json({ msg: 'Failed to fetch payments' });
    }
  });

  return router;

};
