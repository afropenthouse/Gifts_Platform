const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const adminAuth = require('../middleware/adminAuth');

module.exports = () => {
  const router = express.Router();

  // Admin Login
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (username === adminUser && password === adminPass) {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ token, user: { username, role: 'admin' } });
    }

    return res.status(401).json({ msg: 'Invalid admin credentials' });
  });

  router.get('/metrics', adminAuth, async (req, res) => {
    try {
      const { time } = req.query;
      let dateFilter = {};

      if (time && time !== 'all') {
        const now = new Date();
        const filterDate = new Date();

        switch (time) {
          case '7days':
            filterDate.setDate(now.getDate() - 7);
            break;
          case '14days':
            filterDate.setDate(now.getDate() - 14);
            break;
          case '30days':
            filterDate.setDate(now.getDate() - 30);
            break;
          case '3months':
            filterDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        dateFilter = { createdAt: { gte: filterDate } };
      }

      const [
        totalUsers,
        totalGifts,
        totalContributions,
        totalAsoebiContributions,
        totalWallet,
        openGuestEvents,
        restrictedGuestEvents,
      ] = await Promise.all([
        prisma.user.count({ where: dateFilter }),
        prisma.gift.count({ where: dateFilter }),
        prisma.contribution.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: 'completed',
            isAsoebi: false,
            ...dateFilter
          }
        }),
        prisma.contribution.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: 'completed',
            isAsoebi: true,
            ...dateFilter
          }
        }),
        prisma.user.aggregate({
          _sum: {
            wallet: true,
          },
          where: dateFilter
        }),
        prisma.gift.count({
          where: { guestListMode: 'open', ...dateFilter },
        }),
        prisma.gift.count({
          where: { guestListMode: 'restricted', ...dateFilter },
        }),
      ]);

      const [recentUsers, recentContributions] = await Promise.all([
        prisma.user.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            isActive: true
          }
        }),
        prisma.contribution.findMany({
          take: 10,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            gift: {
              select: {
                id: true,
                title: true
              }
            }
          }
        })
      ]);

      res.json({
        metrics: {
          totalUsers,
          totalGifts,
          totalContributions: totalContributions._sum.amount || 0,
          totalAsoebiContributions: totalAsoebiContributions._sum.amount || 0,
          totalWalletBalance: Number(totalWallet._sum.wallet || 0),
          guestListOpenEvents: openGuestEvents,
          guestListRestrictedEvents: restrictedGuestEvents,
        },
        recentUsers,
        recentContributions
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error fetching metrics' });
    }
  });

  // Get All Users
  router.get('/users', adminAuth, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          isActive: true,
          wallet: true,
          _count: {
            select: {
              gifts: true,
              contributions: true
            }
          }
        }
      });
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error fetching users' });
    }
  });

  // Toggle User Status
  router.put('/users/:id/toggle', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { isActive: !user.isActive }
      });

      res.json(updatedUser);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error toggling user status' });
    }
  });

  router.delete('/users/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.referralTransaction.deleteMany({
          where: {
            OR: [
              { referrerId: userId },
              { referredUserId: userId }
            ]
          }
        });

        await tx.withdrawal.deleteMany({
          where: { userId }
        });

        await tx.user.updateMany({
          where: { referredById: userId },
          data: { referredById: null }
        });

        await tx.user.delete({
          where: { id: userId }
        });
      });

      res.json({ msg: 'User deleted successfully' });
    } catch (err) {
      console.error('Error deleting user via admin route:', err);
      res.status(500).json({ msg: 'Server error deleting user' });
    }
  });

  router.get('/contributions', adminAuth, async (req, res) => {
    const { type } = req.query;

    try {
      const where = {
        status: 'completed'
      };

      if (type === 'asoebi') {
        where.isAsoebi = true;
      } else if (type === 'cash') {
        where.isAsoebi = false;
      }

      const contributions = await prisma.contribution.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          gift: {
            select: {
              id: true,
              title: true,
              type: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.json(contributions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error fetching contributions' });
    }
  });

  // Get all events (gifts)
  router.get('/events', adminAuth, async (req, res) => {
    try {
      const gifts = await prisma.gift.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          deadline: true,
          shareLink: true,
          enableCashGifts: true,
          isSellingAsoebi: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              contributions: true,
              guests: true
            }
          }
        }
      });

      res.json(gifts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error fetching events' });
    }
  });

  // Get all guests (admin)
  router.get('/guests', adminAuth, async (req, res) => {
    try {
      const { hasEmail, eventId } = req.query;
      const where = {};
      if (hasEmail === 'yes') {
        where.email = { not: null };
      } else if (hasEmail === 'no') {
        where.email = null;
      }
      if (eventId && !isNaN(parseInt(eventId))) {
        where.giftId = parseInt(eventId);
      }

      const guests = await prisma.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          giftId: true,
          gift: {
            select: { id: true, title: true }
          }
        }
      });

      res.json(guests);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error fetching guests' });
    }
  });

  // Bulk delete users by email
  router.post('/users/bulk-delete', adminAuth, async (req, res) => {
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ msg: 'Provide emails as a non-empty array' });
    }

    const results = [];
    for (const email of emails) {
      try {
        const user = await prisma.user.findUnique({
          where: { email }
        });
        if (!user) {
          results.push({ email, status: 'not_found' });
          continue;
        }

        const userId = user.id;

        await prisma.$transaction(async (tx) => {
          await tx.referralTransaction.deleteMany({
            where: {
              OR: [
                { referrerId: userId },
                { referredUserId: userId }
              ]
            }
          });

          await tx.withdrawal.deleteMany({
            where: { userId }
          });

          await tx.user.updateMany({
            where: { referredById: userId },
            data: { referredById: null }
          });

          await tx.user.delete({
            where: { id: userId }
          });
        });

        results.push({ email, status: 'deleted' });
      } catch (err) {
        console.error(`Error deleting user ${email}:`, err);
        results.push({ email, status: 'error', error: err.message });
      }
    }

    res.json({ results });
  });

  return router;
};
