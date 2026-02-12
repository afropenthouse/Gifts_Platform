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

  // Get Metrics
  router.get('/metrics', adminAuth, async (req, res) => {
    try {
      const totalUsers = await prisma.user.count();
      const totalGifts = await prisma.gift.count();
      const totalContributions = await prisma.contribution.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'completed',
          isAsoebi: false
        }
      });

      const totalAsoebiContributions = await prisma.contribution.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'completed',
          isAsoebi: true
        }
      });

      const recentUsers = await prisma.user.findMany({
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
      });

      const recentContributions = await prisma.contribution.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          gift: {
            select: {
              title: true
            }
          }
        }
      });

      res.json({
        metrics: {
          totalUsers,
          totalGifts,
          totalContributions: totalContributions._sum.amount || 0,
          totalAsoebiContributions: totalAsoebiContributions._sum.amount || 0,
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

  return router;
};
