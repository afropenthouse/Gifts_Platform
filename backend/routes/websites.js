const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const crypto = require('crypto');

module.exports = () => {
  const router = express.Router();

  // Get all websites for the authenticated user
  router.get('/', auth(), async (req, res) => {
    try {
      const websites = await prisma.website.findMany({
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

      const mappedWebsites = websites.map(website => ({
        id: website.id,
        title: website.gift?.title || 'My Wedding Website',
        template: website.template,
        theme: {
          primaryColor: website.primaryColor,
          secondaryColor: website.secondaryColor,
          fontFamily: website.fontFamily
        },
        content: {
          coupleNames: `${website.coupleName1 || ''} & ${website.coupleName2 || ''}`.trim(),
          eventDate: website.gift?.date,
          eventLocation: website.venue,
          story: website.story
        },
        heroImage: website.gift?.picture,
        heroTitle: website.heroTitle || (website.coupleName1 ? `${website.coupleName1} & ${website.coupleName2}` : undefined),
        heroSubtitle: website.heroSubtitle,
        isPublished: website.published,
        shareLink: website.shareLink,
        slug: website.slug,
        gift: website.gift ? {
          id: website.gift.id,
          title: website.gift.title,
          type: website.gift.type,
          date: website.gift.date,
          picture: website.gift.picture,
          shareLink: website.gift.shareLink
        } : undefined
      }));

      res.json(mappedWebsites);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Create a new website
  router.post('/', auth(), async (req, res) => {
    try {
      const { giftId, title, template, heroImage, heroTitle, heroSubtitle, theme, content } = req.body;

      const shareLink = crypto.randomBytes(16).toString('hex');
      const slug = `${(title || 'wedding').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      const coupleNames = content?.coupleNames?.split(' & ') || [];
      const coupleName1 = coupleNames[0] || '';
      const coupleName2 = coupleNames[1] || '';

      const website = await prisma.website.create({
        data: {
          userId: req.user.id,
          giftId: giftId ? parseInt(giftId) : null,
          slug,
          shareLink,
          template: template || 'elegant',
          published: false,
          venue: content?.eventLocation,
          coupleName1,
          coupleName2,
          story: content?.story,
          primaryColor: theme?.primaryColor,
          secondaryColor: theme?.secondaryColor,
          heroTitle: heroTitle || (coupleName1 ? `${coupleName1} & ${coupleName2}` : undefined),
          heroSubtitle: heroSubtitle || 'We invite you to celebrate our special day',
          fontFamily: theme?.fontFamily || 'Georgia, serif'
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

      const mappedWebsite = {
        id: website.id,
        title: website.gift?.title || title || 'My Wedding Website',
        template: website.template,
        theme: {
          primaryColor: website.primaryColor,
          secondaryColor: website.secondaryColor,
          fontFamily: website.fontFamily
        },
        content: {
          coupleNames: `${website.coupleName1 || ''} & ${website.coupleName2 || ''}`.trim(),
          eventDate: website.gift?.date,
          eventLocation: website.venue,
          story: website.story
        },
        heroImage: website.gift?.picture,
        heroTitle: website.heroTitle || (website.coupleName1 ? `${website.coupleName1} & ${website.coupleName2}` : undefined),
        heroSubtitle: website.heroSubtitle,
        isPublished: website.published,
        shareLink: website.shareLink,
        slug: website.slug,
        gift: website.gift
      };

      res.json(mappedWebsite);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update a website
  router.put('/:id', auth(), async (req, res) => {
    try {
      const { id } = req.params;
      const { giftId, title, template, heroImage, heroTitle, heroSubtitle, theme, content } = req.body;

      const existingWebsite = await prisma.website.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingWebsite || existingWebsite.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Website not found' });
      }

      const coupleNames = content?.coupleNames?.split(' & ') || [];
      const coupleName1 = coupleNames[0] || '';
      const coupleName2 = coupleNames[1] || '';

      const updatedWebsite = await prisma.website.update({
        where: { id: parseInt(id) },
        data: {
          giftId: giftId ? parseInt(giftId) : existingWebsite.giftId,
          template: template || existingWebsite.template,
          venue: content?.eventLocation,
          coupleName1,
          coupleName2,
          story: content?.story,
          primaryColor: theme?.primaryColor || existingWebsite.primaryColor,
          secondaryColor: theme?.secondaryColor || existingWebsite.secondaryColor,
          heroTitle: heroTitle || existingWebsite.heroTitle,
          heroSubtitle: heroSubtitle || existingWebsite.heroSubtitle,
          fontFamily: theme?.fontFamily || existingWebsite.fontFamily
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

      const mappedWebsite = {
        id: updatedWebsite.id,
        title: updatedWebsite.gift?.title || title || 'My Wedding Website',
        template: updatedWebsite.template,
        theme: {
          primaryColor: updatedWebsite.primaryColor,
          secondaryColor: updatedWebsite.secondaryColor,
          fontFamily: updatedWebsite.fontFamily
        },
        content: {
          coupleNames: `${updatedWebsite.coupleName1 || ''} & ${updatedWebsite.coupleName2 || ''}`.trim(),
          eventDate: updatedWebsite.gift?.date,
          eventLocation: updatedWebsite.venue,
          story: updatedWebsite.story
        },
        heroImage: updatedWebsite.gift?.picture,
        heroTitle: updatedWebsite.heroTitle || (updatedWebsite.coupleName1 ? `${updatedWebsite.coupleName1} & ${updatedWebsite.coupleName2}` : undefined),
        heroSubtitle: updatedWebsite.heroSubtitle,
        isPublished: updatedWebsite.published,
        shareLink: updatedWebsite.shareLink,
        slug: updatedWebsite.slug,
        gift: updatedWebsite.gift
      };

      res.json(mappedWebsite);
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

      const website = await prisma.website.findUnique({
        where: { id: parseInt(id) }
      });

      if (!website || website.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Website not found' });
      }

      const updatedWebsite = await prisma.website.update({
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

      const mappedWebsite = {
        id: updatedWebsite.id,
        title: updatedWebsite.gift?.title || 'My Wedding Website',
        template: updatedWebsite.template,
        theme: {
          primaryColor: updatedWebsite.primaryColor,
          secondaryColor: updatedWebsite.secondaryColor,
          fontFamily: updatedWebsite.fontFamily
        },
        content: {
          coupleNames: `${updatedWebsite.coupleName1 || ''} & ${updatedWebsite.coupleName2 || ''}`.trim(),
          eventDate: updatedWebsite.gift?.date,
          eventLocation: updatedWebsite.venue,
          story: updatedWebsite.story
        },
        heroImage: updatedWebsite.gift?.picture,
        heroTitle: updatedWebsite.heroTitle || (updatedWebsite.coupleName1 ? `${updatedWebsite.coupleName1} & ${updatedWebsite.coupleName2}` : undefined),
        heroSubtitle: updatedWebsite.heroSubtitle,
        isPublished: updatedWebsite.published,
        shareLink: updatedWebsite.shareLink,
        slug: updatedWebsite.slug,
        gift: updatedWebsite.gift
      };

      res.json(mappedWebsite);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete a website
  router.delete('/:id', auth(), async (req, res) => {
    try {
      const { id } = req.params;

      const website = await prisma.website.findUnique({
        where: { id: parseInt(id) }
      });

      if (!website || website.userId !== req.user.id) {
        return res.status(404).json({ msg: 'Website not found' });
      }

      await prisma.website.delete({
        where: { id: parseInt(id) }
      });

      res.json({ msg: 'Website deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};
