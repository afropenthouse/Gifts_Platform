const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const crypto = require('crypto');
const { uploadImage } = require('../utils/cloudinary');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Invitation templates configuration
const INVITATION_TEMPLATES = [
  {
    id: 'botanical-sprig',
    name: 'Botanical Sprig',
    description: 'Clean white card with soft greenery along the edge',
    tier: 'premium',
    previewColor: '#1f2933',
    accentColor: '#7b9a78'
  },
  {
    id: 'garden-oval',
    name: 'Garden Oval',
    description: 'Vintage botanical frame with an oval name plate',
    tier: 'premium',
    previewColor: '#2f5f3d',
    accentColor: '#8eb28a'
  },
  {
    id: 'luxury-minimal',
    name: 'Luxury Minimal',
    description: 'Black card with a thin gold border and elegant serif typography',
    tier: 'premium',
    previewColor: '#0a0a0a',
    accentColor: '#c9a96e'
  },
  {
    id: 'watercolor-floral',
    name: 'Watercolor Floral',
    description: 'Soft pink cream background with dreamy watercolor blooms',
    tier: 'premium',
    previewColor: '#5c4a4a',
    accentColor: '#e8a0a0'
  },
  {
    id: 'modern-geometric',
    name: 'Modern Geometric',
    description: 'Navy and white with clean geometric lines and modern typography',
    tier: 'premium',
    previewColor: '#1e3a5f',
    accentColor: '#ffffff'
  },
  {
    id: 'romantic-rose',
    name: 'Romantic Rose',
    description: 'Blush pink with elegant rose petal watercolor accents',
    tier: 'premium',
    previewColor: '#8b5a5a',
    accentColor: '#d4a0a0'
  },
  {
    id: 'art-deco-greenery',
    name: 'Art Deco Greenery',
    description: 'Sophisticated art deco frame with lush green foliage',
    tier: 'premium',
    previewColor: '#1A3B2B',
    accentColor: '#D49A6A'
  },
  {
    id: 'classic-invitation',
    name: 'Classic',
    description: 'Simple navy and gold bordered invitation',
    tier: 'premium',
    previewColor: '#1e3a5f',
    accentColor: '#c9a96e'
  }
];

module.exports = () => {
  const router = express.Router();

  // Get all invitation templates
  router.get('/templates', (req, res) => {
    try {
      res.json(INVITATION_TEMPLATES);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get all invitations for the authenticated user
  router.get('/', auth(), async (req, res) => {
    try {
      const invitations = await prisma.invitation.findMany({
        where: { userId: req.user.id },
        include: {
          gift: {
            select: {
              id: true,
              title: true,
              type: true,
              date: true,
              picture: true,
              shareLink: true,
              wishlists: {
                select: { id: true, shareLink: true, title: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const mappedInvitations = invitations.map(invitation => ({
        id: invitation.id,
        title: invitation.gift?.title || 'My Invitation',
        template: invitation.template,
        tier: invitation.tier === 'royal' ? 'premium' : 'free',
        theme: {
          primaryColor: invitation.primaryColor,
          secondaryColor: invitation.secondaryColor,
          fontFamily: invitation.fontFamily
        },
        content: {
          coupleNames: `${invitation.coupleName1 || ''} & ${invitation.coupleName2 || ''}`.trim(),
          eventDate: invitation.gift?.date,
          eventLocation: invitation.venue,
          story: invitation.story
        },
        heroImage: invitation.gift?.picture,
        heroTitle: invitation.heroTitle || (invitation.coupleName1 ? `${invitation.coupleName1} & ${invitation.coupleName2}` : undefined),
        heroSubtitle: invitation.heroSubtitle,
        isPublished: invitation.published,
        shareLink: invitation.shareLink,
        slug: invitation.slug,
        gallery: invitation.gallery,
        showWellWishes: invitation.showWellWishes,
        enableWishlistButton: invitation.enableWishlistButton,
        gift: invitation.gift ? {
          id: invitation.gift.id,
          title: invitation.gift.title,
          type: invitation.gift.type,
          date: invitation.gift.date,
          picture: invitation.gift.picture,
          shareLink: invitation.gift.shareLink
        } : undefined
      }));

      res.json(mappedInvitations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get invitation by gift ID
  router.get('/gift/:giftId', auth(), async (req, res) => {
    try {
      const { giftId } = req.params;
      
      const invitation = await prisma.invitation.findFirst({
        where: { 
          giftId: parseInt(giftId),
          userId: req.user.id
        },
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

      if (!invitation) {
        return res.status(404).json({ msg: 'Invitation not found' });
      }

      const mappedInvitation = {
        id: invitation.id,
        title: invitation.gift?.title || 'My Invitation',
        template: invitation.template,
        tier: invitation.tier === 'royal' ? 'premium' : 'free',
        theme: {
          primaryColor: invitation.primaryColor,
          secondaryColor: invitation.secondaryColor,
          fontFamily: invitation.fontFamily
        },
        content: {
          coupleNames: `${invitation.coupleName1 || ''} & ${invitation.coupleName2 || ''}`.trim(),
          eventDate: invitation.gift?.date,
          eventLocation: invitation.venue,
          story: invitation.story
        },
        heroImage: invitation.gift?.picture,
        heroTitle: invitation.heroTitle || (invitation.coupleName1 ? `${invitation.coupleName1} & ${invitation.coupleName2}` : undefined),
        heroSubtitle: invitation.heroSubtitle,
        isPublished: invitation.published,
        shareLink: invitation.shareLink,
        slug: invitation.slug,
        gallery: invitation.gallery,
        showWellWishes: invitation.showWellWishes,
        enableWishlistButton: invitation.enableWishlistButton,
        gift: invitation.gift
      };

      res.json(mappedInvitation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Create a new invitation
  router.post('/', auth(), async (req, res) => {
    try {
      const { giftId, title, template, heroImage, heroTitle, heroSubtitle, theme, content, tier: invitationTier } = req.body;

      // Check if template is premium and user has access
      const templateConfig = INVITATION_TEMPLATES.find(t => t.id === template);
      let resolvedTier = invitationTier || 'free';
      if (giftId) {
        const gift = await prisma.gift.findUnique({
          where: { id: parseInt(giftId) },
          select: { tier: true }
        });
        if (gift) {
          resolvedTier = gift.tier;
        }
      }
      if (templateConfig?.tier === 'premium' && resolvedTier !== 'royal') {
        return res.status(403).json({ msg: 'Premium template requires Royal upgrade' });
      }

      const shareLink = crypto.randomBytes(16).toString('hex');
      const slug = `${(title || 'invitation').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      const coupleNames = content?.coupleNames?.split(' & ') || [];
      const coupleName1 = coupleNames[0] || '';
      const coupleName2 = coupleNames[1] || '';

      const invitation = await prisma.invitation.create({
        data: {
          userId: req.user.id,
          giftId: giftId ? parseInt(giftId) : null,
          slug,
          shareLink,
          template: template || 'botanical-sprig',
          tier: resolvedTier,
          published: false,
          venue: content?.eventLocation,
          coupleName1,
          coupleName2,
          story: content?.story,
          primaryColor: theme?.primaryColor,
          secondaryColor: theme?.secondaryColor,
          heroTitle: heroTitle || (coupleName1 ? `${coupleName1} & ${coupleName2}` : undefined),
          heroSubtitle: heroSubtitle || 'We invite you to celebrate our special day',
          fontFamily: theme?.fontFamily || 'Georgia, serif',
          gallery: content?.gallery || [],
          showWellWishes: content?.showWellWishes || false,
          enableWishlistButton: content?.enableWishlistButton !== undefined ? content.enableWishlistButton : true,
          // Additional wedding-specific fields
          parentGroomName1: content?.parentGroomName1,
          parentGroomName2: content?.parentGroomName2,
          parentBrideName1: content?.parentBrideName1,
          parentBrideName2: content?.parentBrideName2,
          weddingTime: content?.weddingTime,
          ceremonyVenue: content?.ceremonyVenue,
          ceremonyTime: content?.ceremonyTime,
          receptionVenue: content?.receptionVenue,
          receptionTime: content?.receptionTime,
          bestMan: content?.bestMan,
          maidOfHonor: content?.maidOfHonor,
          dressCode: content?.dressCode,
          hashtag: content?.hashtag
        },
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

      const mappedInvitation = {
        id: invitation.id,
        title: invitation.gift?.title || title || 'My Invitation',
        template: invitation.template,
        tier: invitation.tier === 'royal' ? 'premium' : 'free',
        theme: {
          primaryColor: invitation.primaryColor,
          secondaryColor: invitation.secondaryColor,
          fontFamily: invitation.fontFamily
        },
        content: {
          coupleNames: `${invitation.coupleName1 || ''} & ${invitation.coupleName2 || ''}`.trim(),
          eventDate: invitation.gift?.date,
          eventLocation: invitation.venue,
          story: invitation.story
        },
        heroImage: invitation.gift?.picture,
        heroTitle: invitation.heroTitle || (invitation.coupleName1 ? `${invitation.coupleName1} & ${invitation.coupleName2}` : undefined),
        heroSubtitle: invitation.heroSubtitle,
        isPublished: invitation.published,
        shareLink: invitation.shareLink,
        slug: invitation.slug,
        gallery: invitation.gallery,
        showWellWishes: invitation.showWellWishes,
        enableWishlistButton: invitation.enableWishlistButton,
        gift: invitation.gift
      };

      res.json(mappedInvitation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update an invitation
  router.put('/:id', auth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { giftId, title, template, heroImage, heroTitle, heroSubtitle, theme, content, tier: invitationTier } = req.body;

      const existingInvitation = await prisma.invitation.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingInvitation || existingInvitation.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Invitation not found' });
      }

      // Check if template is premium and user has access
      const templateConfig = INVITATION_TEMPLATES.find(t => t.id === template);
      let resolvedTier = invitationTier !== undefined ? invitationTier : existingInvitation.tier;
      if (giftId && invitationTier === undefined) {
        const gift = await prisma.gift.findUnique({
          where: { id: parseInt(giftId) },
          select: { tier: true }
        });
        if (gift) {
          resolvedTier = gift.tier;
        }
      }
      if (templateConfig?.tier === 'premium' && resolvedTier !== 'royal' && existingInvitation.tier !== 'royal') {
        return res.status(403).json({ msg: 'Premium template requires Royal upgrade' });
      }

      const coupleNames = content?.coupleNames?.split(' & ') || [];
      const coupleName1 = coupleNames[0] || '';
      const coupleName2 = coupleNames[1] || '';

      const updatedInvitation = await prisma.invitation.update({
        where: { id: parseInt(id) },
        data: {
          giftId: giftId ? parseInt(giftId) : existingInvitation.giftId,
          template: template || existingInvitation.template,
          tier: resolvedTier,
          venue: content?.eventLocation,
          coupleName1,
          coupleName2,
          story: content?.story,
          primaryColor: theme?.primaryColor || existingInvitation.primaryColor,
          secondaryColor: theme?.secondaryColor || existingInvitation.secondaryColor,
          heroTitle: heroTitle || existingInvitation.heroTitle,
          heroSubtitle: heroSubtitle || existingInvitation.heroSubtitle,
          fontFamily: theme?.fontFamily || existingInvitation.fontFamily,
          gallery: content?.gallery !== undefined ? content.gallery : existingInvitation.gallery,
          showWellWishes: content?.showWellWishes !== undefined ? content.showWellWishes : existingInvitation.showWellWishes,
          enableWishlistButton: content?.enableWishlistButton !== undefined ? content.enableWishlistButton : existingInvitation.enableWishlistButton,
          // Additional wedding-specific fields
          parentGroomName1: content?.parentGroomName1,
          parentGroomName2: content?.parentGroomName2,
          parentBrideName1: content?.parentBrideName1,
          parentBrideName2: content?.parentBrideName2,
          weddingTime: content?.weddingTime,
          ceremonyVenue: content?.ceremonyVenue,
          ceremonyTime: content?.ceremonyTime,
          receptionVenue: content?.receptionVenue,
          receptionTime: content?.receptionTime,
          bestMan: content?.bestMan,
          maidOfHonor: content?.maidOfHonor,
          dressCode: content?.dressCode,
          hashtag: content?.hashtag
        },
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

      const mappedInvitation = {
        id: updatedInvitation.id,
        title: updatedInvitation.gift?.title || title || 'My Invitation',
        template: updatedInvitation.template,
        tier: updatedInvitation.tier === 'royal' ? 'premium' : 'free',
        theme: {
          primaryColor: updatedInvitation.primaryColor,
          secondaryColor: updatedInvitation.secondaryColor,
          fontFamily: updatedInvitation.fontFamily
        },
        content: {
          coupleNames: `${updatedInvitation.coupleName1 || ''} & ${updatedInvitation.coupleName2 || ''}`.trim(),
          eventDate: updatedInvitation.gift?.date,
          eventLocation: updatedInvitation.venue,
          story: updatedInvitation.story
        },
        heroImage: updatedInvitation.gift?.picture,
        heroTitle: updatedInvitation.heroTitle || (updatedInvitation.coupleName1 ? `${updatedInvitation.coupleName1} & ${updatedInvitation.coupleName2}` : undefined),
        heroSubtitle: updatedInvitation.heroSubtitle,
        isPublished: updatedInvitation.published,
        shareLink: updatedInvitation.shareLink,
        slug: updatedInvitation.slug,
        gallery: updatedInvitation.gallery,
        showWellWishes: updatedInvitation.showWellWishes,
        enableWishlistButton: updatedInvitation.enableWishlistButton,
        gift: updatedInvitation.gift
      };

      res.json(mappedInvitation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Toggle publish status
  router.patch('/:id/publish', auth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;

      const invitation = await prisma.invitation.findUnique({
        where: { id: parseInt(id) }
      });

      if (!invitation || invitation.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Invitation not found' });
      }

      const updatedInvitation = await prisma.invitation.update({
        where: { id: parseInt(id) },
        data: { published: isPublished },
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

      const mappedInvitation = {
        id: updatedInvitation.id,
        title: updatedInvitation.gift?.title || 'My Invitation',
        template: updatedInvitation.template,
        tier: updatedInvitation.tier === 'royal' ? 'premium' : 'free',
        theme: {
          primaryColor: updatedInvitation.primaryColor,
          secondaryColor: updatedInvitation.secondaryColor,
          fontFamily: updatedInvitation.fontFamily
        },
        content: {
          coupleNames: `${updatedInvitation.coupleName1 || ''} & ${updatedInvitation.coupleName2 || ''}`.trim(),
          eventDate: updatedInvitation.gift?.date,
          eventLocation: updatedInvitation.venue,
          story: updatedInvitation.story
        },
        heroImage: updatedInvitation.gift?.picture,
        heroTitle: updatedInvitation.heroTitle || (updatedInvitation.coupleName1 ? `${updatedInvitation.coupleName1} & ${updatedInvitation.coupleName2}` : undefined),
        heroSubtitle: updatedInvitation.heroSubtitle,
        isPublished: updatedInvitation.published,
        shareLink: updatedInvitation.shareLink,
        slug: updatedInvitation.slug,
        gallery: updatedInvitation.gallery,
        showWellWishes: updatedInvitation.showWellWishes,
        enableWishlistButton: updatedInvitation.enableWishlistButton,
        gift: updatedInvitation.gift
      };

      res.json(mappedInvitation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete an invitation
  router.delete('/:id', auth(), async (req, res) => {
    try {
      const { id } = req.params;

      const invitation = await prisma.invitation.findUnique({
        where: { id: parseInt(id) }
      });

      if (!invitation || invitation.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Invitation not found' });
      }

      await prisma.invitation.delete({
        where: { id: parseInt(id) }
      });

      res.json({ msg: 'Invitation deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Upload gallery image
  router.post('/upload-image', auth(), upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: 'No image file provided' });
      }

      const result = await uploadImage(req.file.buffer, 'invitation-gallery');
      
      res.json({ 
        url: result.secure_url,
        publicId: result.public_id
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      res.status(500).json({ msg: 'Failed to upload image' });
    }
  });

  // Get invitation by share link (public)
  router.get('/public/:shareLink', async (req, res) => {
    try {
      const { shareLink } = req.params;
      
      const invitation = await prisma.invitation.findUnique({
        where: { shareLink },
        include: {
          gift: {
            select: {
              id: true,
              title: true,
              type: true,
              date: true,
              picture: true,
              shareLink: true,
              wishlists: {
                select: { id: true, shareLink: true, title: true }
              }
            }
          }
        }
      });

      if (!invitation) {
        return res.status(404).json({ msg: 'Invitation not found' });
      }

      if (!invitation.published) {
        return res.status(403).json({ msg: 'Invitation not published yet' });
      }

      const mappedInvitation = {
        id: invitation.id,
        template: invitation.template,
        venue: invitation.venue,
        coupleName1: invitation.coupleName1,
        coupleName2: invitation.coupleName2,
        story: invitation.story,
        date: invitation.date,
        primaryColor: invitation.primaryColor,
        secondaryColor: invitation.secondaryColor,
        heroTitle: invitation.heroTitle,
        heroSubtitle: invitation.heroSubtitle,
        fontFamily: invitation.fontFamily,
        gallery: invitation.gallery,
        showWellWishes: invitation.showWellWishes,
        enableWishlistButton: invitation.enableWishlistButton,
        shareLink: invitation.shareLink,
        slug: invitation.slug,
        isPublished: invitation.published,
        // Wedding-specific fields
        parentGroomName1: invitation.parentGroomName1,
        parentGroomName2: invitation.parentGroomName2,
        parentBrideName1: invitation.parentBrideName1,
        parentBrideName2: invitation.parentBrideName2,
        weddingTime: invitation.weddingTime,
        ceremonyVenue: invitation.ceremonyVenue,
        ceremonyTime: invitation.ceremonyTime,
        receptionVenue: invitation.receptionVenue,
        receptionTime: invitation.receptionTime,
        bestMan: invitation.bestMan,
        maidOfHonor: invitation.maidOfHonor,
        dressCode: invitation.dressCode,
        hashtag: invitation.hashtag,
        gift: invitation.gift
      };

      res.json(mappedInvitation);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};
