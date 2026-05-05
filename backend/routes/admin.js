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
      const { time, type, eventId, startDate, endDate } = req.query;
      let dateFilter = {};

      // Handle custom date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        
        dateFilter = {
          createdAt: {
            gte: start,
            lte: end
          }
        };
      } else if (time && time !== 'all') {
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

      const parsedEventId = eventId && !Number.isNaN(parseInt(eventId, 10)) ? parseInt(eventId, 10) : null;
      const eventGift = parsedEventId
        ? await prisma.gift.findUnique({
            where: { id: parsedEventId },
            select: { userId: true },
          })
        : null;
      const eventOwnerId = eventGift?.userId || null;

      const totalWallet = await prisma.user.aggregate({
        _sum: {
          wallet: true,
        },
      });
      const totalWalletBalance = Number(totalWallet._sum.wallet || 0);

      const contributionScopeWhere = {
        status: 'completed',
        amount: { gt: 0 },
        ...(type === 'asoebi' ? { isAsoebi: true } : {}),
        ...(type === 'cash' ? { isAsoebi: false } : {}),
        ...(parsedEventId ? { giftId: parsedEventId } : {}),
        ...dateFilter,
      };

      const referralScopeWhere = {
        ...(type === 'asoebi' ? { type: 'asoebi_commission' } : {}),
        ...(type === 'cash' ? { type: 'cash_gift_commission' } : {}),
        ...(eventOwnerId ? { referredUserId: eventOwnerId } : {}),
        ...dateFilter,
      };

      const withdrawalScopeWhere = {
        status: 'completed',
        ...(eventOwnerId ? { userId: eventOwnerId } : {}),
        ...dateFilter,
      };

      const [
        totalUsers,
        totalGifts,
        totalGifters,
        totalAsoebi,
        totalContributions,
        totalAsoebiContributions,
        openGuestEvents,
        restrictedGuestEvents,
        totalRevenue,
        totalReferralRevenue,
        allContributions,
        allWithdrawals,
        activeUsers,
        totalTransactionsCount,
      ] = await Promise.all([
        prisma.user.count({ where: dateFilter }),
        prisma.gift.count({ where: dateFilter }),
        prisma.contribution.count({
          where: {
            status: 'completed',
            isAsoebi: false,
            amount: { gt: 0 },
            ...dateFilter
          }
        }),
        prisma.contribution.count({
          where: {
            status: 'completed',
            isAsoebi: true,
            amount: { gt: 0 },
            ...dateFilter
          }
        }),
        prisma.contribution.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: 'completed',
            isAsoebi: false,
            amount: { gt: 0 },
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
            amount: { gt: 0 },
            ...dateFilter
          }
        }),
        prisma.gift.count({
          where: { guestListMode: 'open', ...dateFilter },
        }),
        prisma.gift.count({
          where: { guestListMode: 'restricted', ...dateFilter },
        }),
        prisma.contribution.aggregate({
          _sum: {
            commission: true,
          },
          where: contributionScopeWhere
        }),
        prisma.referralTransaction.aggregate({
          _sum: {
            amount: true,
          },
          where: referralScopeWhere,
        }),
        prisma.contribution.findMany({
          where: {
            status: 'completed',
            amount: { gt: 0 },
            ...dateFilter
          },
          select: { amount: true }
        }),
        prisma.withdrawal.findMany({
          where: withdrawalScopeWhere,
          select: { amount: true }
        }),
        prisma.user.count({
          where: {
            gifts: {
              some: {}
            },
            ...dateFilter
          }
        }),
        prisma.contribution.count({
          where: {
            status: 'completed',
            amount: { gt: 0 },
            ...dateFilter
          }
        }),
      ]);

      const platformRevenue = Number(totalRevenue._sum.commission || 0);
      const referralRevenue = Number(totalReferralRevenue._sum.amount || 0);
      
      // Correct Paystack Fee Calculation (Nigeria)
      // 1. Transfer Fees (Payout): ₦10 (<=5k), ₦25 (5k-50k), ₦50 (>50k)
      // 2. Stamp Duty: ₦50 for transfers >= ₦10,000
      
      let payoutFees = 0;
      for (const w of allWithdrawals) {
        const amount = Number(w.amount);
        // Transfer fees
        if (amount <= 5000) {
          payoutFees += 10;
        } else if (amount <= 50000) {
          payoutFees += 25;
        } else {
          payoutFees += 50;
        }
        // Stamp duty
        if (amount >= 10000) {
          payoutFees += 50;
        }
      }

      const totalPaystackFees = payoutFees;
      const netProfit = platformRevenue - totalPaystackFees - referralRevenue;
      
      // Calculate Profit Ratio (percentage)
      const totalGrossAmount = allContributions.reduce((sum, c) => sum + Number(c.amount), 0);
      const profitRatio = totalGrossAmount > 0 ? (netProfit / totalGrossAmount) * 100 : 0;

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
          totalGifters,
          totalAsoebi,
          totalTransactions: totalTransactionsCount,
          totalContributions: totalContributions._sum.amount || 0,
          totalAsoebiContributions: totalAsoebiContributions._sum.amount || 0,
          totalWalletBalance: totalWalletBalance,
          guestListOpenEvents: openGuestEvents,
          guestListRestrictedEvents: restrictedGuestEvents,
          totalRevenue: platformRevenue,
          referralRevenue,
          estimatedPaystackFees: totalPaystackFees,
          payoutFees,
          netProfit,
          profitRatio: parseFloat(profitRatio.toFixed(2)),
          activeUsers
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
          phoneNumber: true,
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
    const { type, time, eventId } = req.query;

    try {
      const where = {
        status: 'completed'
      };

      if (type === 'asoebi') {
        where.isAsoebi = true;
      } else if (type === 'cash') {
        where.isAsoebi = false;
      }

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
        where.createdAt = { gte: filterDate };
      }

      if (eventId && !Number.isNaN(parseInt(eventId, 10))) {
        where.giftId = parseInt(eventId, 10);
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
      const { dateRange, status, type } = req.query;
      let where = {};

      // Status filter (active/past)
      if (status === 'active') {
        where.date = {
          gte: new Date() // Events today or in the future
        };
      } else if (status === 'past') {
        where.date = {
          lt: new Date() // Events before today
        };
      }

      // Event type filter
      if (type && type !== 'all') {
        where.type = type;
      }

      // Date range filter (1-12 months from current date) - only apply if no status filter
      if (dateRange && !Number.isNaN(parseInt(dateRange, 10)) && !status) {
        const months = parseInt(dateRange, 10);
        const now = new Date();
        const startDate = new Date();
        const endDate = new Date();
        
        startDate.setMonth(now.getMonth() - months); // Start X months ago from today
        endDate.setTime(now.getTime()); // End at current time
        
        where.date = {
          gte: startDate,
          lte: endDate
        };
      }

      // Sort by creation date when showing all events or past events, otherwise sort by event date
      const orderBy = (status === 'past' || (!status && !dateRange))
        ? { createdAt: 'desc' } // Sort by creation date for all events and past events
        : [{ date: 'asc' }, { createdAt: 'desc' }]; // Sort by event date for active events and date range

      const gifts = await prisma.gift.findMany({
        where,
        orderBy,
        select: {
          id: true,
          title: true,
          type: true,
          date: true,
          createdAt: true,
          deadline: true,
          shareLink: true,
          enableCashGifts: true,
          isSellingAsoebi: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true
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

      const asoebiCounts = await prisma.contribution.groupBy({
        by: ['giftId'],
        where: {
          status: 'completed',
          isAsoebi: true,
          amount: { gt: 0 }
        },
        _count: { _all: true }
      });

      const asoebiCountByGiftId = asoebiCounts.reduce((acc, row) => {
        acc[row.giftId] = row._count._all;
        return acc;
      }, {});

      res.json(
        gifts.map((g) => ({
          ...g,
          asoebiSalesCount: asoebiCountByGiftId[g.id] || 0
        }))
      );
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

  router.get('/wallet-stats', adminAuth, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          wallet: true,
        },
      });
      const totalBalance = users.reduce((acc, user) => acc + Number(user.wallet), 0);
      res.json({ totalBalance });
    } catch (error) {
      res.status(500).json({ msg: 'Server error' });
    }
  });

  const isEmailTemplateTableMissing = (error) => {
    const message = String(error?.message || '');
    const code = String(error?.code || '');
    const cause = String(error?.meta?.cause || '');
    return (
      code === 'P2021' ||
      message.toLowerCase().includes('emailtemplate') && message.toLowerCase().includes('does not exist') ||
      message.toLowerCase().includes('relation') && message.toLowerCase().includes('"emailtemplate"') && message.toLowerCase().includes('does not exist') ||
      code === '42P01' ||
      cause === '42P01'
    );
  };

  const ensureEmailTemplatesTable = async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailTemplate" (
        "id" SERIAL NOT NULL,
        "key" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "preheader" TEXT,
        "heading" TEXT NOT NULL,
        "greeting" TEXT,
        "body" TEXT NOT NULL,
        "ctaLabel" TEXT,
        "ctaUrl" TEXT,
        "footer" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplate_key_key" ON "EmailTemplate"("key");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailTemplate_key_idx" ON "EmailTemplate"("key");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailTemplate_updatedAt_idx" ON "EmailTemplate"("updatedAt");`);
  };

  const defaultWelcomeTemplate = {
    key: 'welcome_default',
    name: 'Welcome Email (Default)',
    subject: 'Thank you for joining BeThere 🎉',
    preheader: "Welcome to BeThere — create your first event link",
    heading: 'Welcome to BeThere',
    greeting: 'Hi {name},',
    body: [
      "Thank you for signing up to BeThere! We're thrilled to help you celebrate your special moments.",
      'BeThere Experience helps you to:',
      '- Manage RSVPs',
      '- Sell Asoebi',
      '- Collect cash gifts all in one place.',
      'Ready to get started?',
    ].join('\n'),
    ctaLabel: 'Create Event Link',
    ctaUrl: 'https://bethereexperience.com/dashboard',
    footer: "If you have any questions, simply reply to this email. We're here to help!",
  };

  const toTemplateKey = (input) => {
    const base = String(input || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return base || `template_${Date.now()}`;
  };

  router.get('/email-templates/default-welcome', adminAuth, async (req, res) => {
    try {
      await ensureEmailTemplatesTable();
      const template = await prisma.emailTemplate.upsert({
        where: { key: defaultWelcomeTemplate.key },
        update: {},
        create: { ...defaultWelcomeTemplate, updatedAt: new Date() },
      });
      res.json(template);
    } catch (error) {
      if (isEmailTemplateTableMissing(error)) {
        try {
          await ensureEmailTemplatesTable();
          const template = await prisma.emailTemplate.upsert({
            where: { key: defaultWelcomeTemplate.key },
            update: {},
            create: { ...defaultWelcomeTemplate, updatedAt: new Date() },
          });
          return res.json(template);
        } catch (inner) {
          console.error('EmailTemplate table creation failed:', inner);
          return res.status(500).json({ msg: 'Email templates are not available yet (database setup needed).' });
        }
      }
      console.error('Error fetching default welcome template:', error);
      res.status(500).json({ msg: 'Server error fetching template' });
    }
  });

  router.get('/email-templates', adminAuth, async (req, res) => {
    try {
      await ensureEmailTemplatesTable();
      const templates = await prisma.emailTemplate.findMany({
        orderBy: { updatedAt: 'desc' },
      });
      res.json(templates);
    } catch (error) {
      if (isEmailTemplateTableMissing(error)) {
        try {
          await ensureEmailTemplatesTable();
          const templates = await prisma.emailTemplate.findMany({
            orderBy: { updatedAt: 'desc' },
          });
          return res.json(templates);
        } catch (inner) {
          console.error('EmailTemplate table creation failed:', inner);
          return res.status(500).json({ msg: 'Email templates are not available yet (database setup needed).' });
        }
      }
      console.error('Error listing templates:', error);
      res.status(500).json({ msg: 'Server error fetching templates' });
    }
  });

  router.get('/email-templates/:id', adminAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ msg: 'Invalid template id' });
    }

    try {
      await ensureEmailTemplatesTable();
      const template = await prisma.emailTemplate.findUnique({ where: { id } });
      if (!template) return res.status(404).json({ msg: 'Template not found' });
      res.json(template);
    } catch (error) {
      if (isEmailTemplateTableMissing(error)) {
        return res.status(404).json({ msg: 'Templates are not available yet.' });
      }
      console.error('Error fetching template:', error);
      res.status(500).json({ msg: 'Server error fetching template' });
    }
  });

  router.post('/email-templates', adminAuth, async (req, res) => {
    const { key, name, subject, preheader, heading, greeting, body, ctaLabel, ctaUrl, footer } = req.body || {};

    const safeName = String(name || '').trim();
    const safeSubject = String(subject || '').trim();
    const safeHeading = String(heading || '').trim();
    const safeBody = String(body || '').trim();

    if (!safeName || !safeSubject || !safeHeading || !safeBody) {
      return res.status(400).json({ msg: 'name, subject, heading, and body are required' });
    }

    const safeKey = String(key || '').trim() || toTemplateKey(safeName);

    try {
      await ensureEmailTemplatesTable();
      const created = await prisma.emailTemplate.create({
        data: {
          key: safeKey,
          name: safeName,
          subject: safeSubject,
          preheader: preheader ? String(preheader) : null,
          heading: safeHeading,
          greeting: greeting ? String(greeting) : null,
          body: safeBody,
          ctaLabel: ctaLabel ? String(ctaLabel) : null,
          ctaUrl: ctaUrl ? String(ctaUrl) : null,
          footer: footer ? String(footer) : null,
          updatedAt: new Date(),
        },
      });
      res.status(201).json(created);
    } catch (error) {
      const code = error?.code || error?.meta?.cause;
      if (code === 'P2002') {
        return res.status(409).json({ msg: 'Template key already exists. Choose a different name or key.' });
      }
      console.error('Error creating template:', error);
      res.status(500).json({ msg: 'Server error creating template' });
    }
  });

  router.put('/email-templates/:id', adminAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ msg: 'Invalid template id' });
    }

    const { name, subject, preheader, heading, greeting, body, ctaLabel, ctaUrl, footer } = req.body || {};

    const safeName = String(name || '').trim();
    const safeSubject = String(subject || '').trim();
    const safeHeading = String(heading || '').trim();
    const safeBody = String(body || '').trim();

    if (!safeName || !safeSubject || !safeHeading || !safeBody) {
      return res.status(400).json({ msg: 'name, subject, heading, and body are required' });
    }

    try {
      await ensureEmailTemplatesTable();
      const updated = await prisma.emailTemplate.update({
        where: { id },
        data: {
          name: safeName,
          subject: safeSubject,
          preheader: preheader ? String(preheader) : null,
          heading: safeHeading,
          greeting: greeting ? String(greeting) : null,
          body: safeBody,
          ctaLabel: ctaLabel ? String(ctaLabel) : null,
          ctaUrl: ctaUrl ? String(ctaUrl) : null,
          footer: footer ? String(footer) : null,
        },
      });
      res.json(updated);
    } catch (error) {
      if (isEmailTemplateTableMissing(error)) {
        return res.status(500).json({ msg: 'Email templates are not available yet (database setup needed).' });
      }
      console.error('Error updating template:', error);
      res.status(500).json({ msg: 'Server error updating template' });
    }
  });

  router.post('/send-bulk-welcome', adminAuth, async (req, res) => {
    const { emails, templateId } = req.body;
    const { sendWelcomeEmail, sendTemplatedEmail } = require('../utils/emailService');

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ msg: 'No emails provided' });
    }

    try {
      try {
        await ensureEmailTemplatesTable();
      } catch (ensureError) {
        console.error('EmailTemplate ensure failed (fallback to default welcome):', ensureError);
      }
      const chosenTemplate = templateId
        ? await prisma.emailTemplate.findUnique({ where: { id: Number(templateId) } })
        : await prisma.emailTemplate.findUnique({ where: { key: defaultWelcomeTemplate.key } });

      const results = await Promise.all(
        emails.map(async (email) => {
          try {
            // Try to find user name if it's a registered user
            const user = await prisma.user.findUnique({ where: { email } });
            const guest = !user ? await prisma.guest.findFirst({ where: { email } }) : null;
            const name = user?.name || guest?.firstName || 'there';

            if (chosenTemplate) {
              return await sendTemplatedEmail({
                recipientEmail: email,
                template: chosenTemplate,
                vars: { name },
              });
            }

            return await sendWelcomeEmail({ recipientEmail: email, recipientName: name });
          } catch (err) {
            return { delivered: false, error: err.message, email };
          }
        })
      );

      const successful = results.filter((r) => r.delivered).length;
      const failed = results.filter((r) => !r.delivered).length;

      res.json({
        msg: `Sent ${successful} emails successfully, ${failed} failed.`,
        successful,
        failed,
      });
    } catch (error) {
      console.error('Bulk email error:', error);
      res.status(500).json({ msg: 'Failed to send bulk emails' });
    }
  });

  // Get Country Statistics
  router.get('/country-stats', adminAuth, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          phoneNumber: {
            not: null
          }
        },
        select: {
          phoneNumber: true
        }
      });

      // Country code to name mapping
      const countryNames = {
        '+234': 'Nigeria',
        '+1-USA': 'USA',
        '+1-CA': 'Canada',
        '+1242': 'Bahamas',
        '+1246': 'Barbados',
        '+1264': 'Anguilla',
        '+1268': 'Antigua & Barbuda',
        '+1284': 'British Virgin Islands',
        '+1340': 'US Virgin Islands',
        '+1345': 'Cayman Islands',
        '+1441': 'Bermuda',
        '+1473': 'Grenada',
        '+1649': 'Turks & Caicos Islands',
        '+1664': 'Montserrat',
        '+1670': 'Northern Mariana Islands',
        '+1671': 'Guam',
        '+1684': 'American Samoa',
        '+1721': 'Sint Maarten',
        '+1758': 'St. Lucia',
        '+1767': 'Dominica',
        '+1784': 'St. Vincent & Grenadines',
        '+1787': 'Puerto Rico',
        '+1809': 'Dominican Republic',
        '+1829': 'Dominican Republic',
        '+1849': 'Dominican Republic',
        '+1868': 'Trinidad & Tobago',
        '+1869': 'St. Kitts & Nevis',
        '+1876': 'Jamaica',
        '+1939': 'Puerto Rico',
        '+44': 'United Kingdom',
        '+33': 'France',
        '+49': 'Germany',
        '+39': 'Italy',
        '+34': 'Spain',
        '+31': 'Netherlands',
        '+41': 'Switzerland',
        '+46': 'Sweden',
        '+47': 'Norway',
        '+45': 'Denmark',
        '+358': 'Finland',
        '+351': 'Portugal',
        '+30': 'Greece',
        '+90': 'Turkey',
        '+20': 'Egypt',
        '+27': 'South Africa',
        '+254': 'Kenya',
        '+256': 'Uganda',
        '+233': 'Ghana',
        '+225': 'Ivory Coast',
        '+229': 'Benin',
        '+228': 'Togo',
        '+227': 'Niger',
        '+213': 'Algeria',
        '+212': 'Morocco',
        '+216': 'Tunisia',
        '+218': 'Libya',
        '+251': 'Ethiopia',
        '+258': 'Mozambique',
        '+260': 'Zambia',
        '+263': 'Zimbabwe',
        '+265': 'Malawi',
        '+266': 'Lesotho',
        '+267': 'Botswana',
        '+268': 'Eswatini',
        '+269': 'Comoros',
        '+250': 'Rwanda',
        '+257': 'Burundi',
        '+240': 'Equatorial Guinea',
        '+241': 'Gabon',
        '+242': 'Congo (Brazzaville)',
        '+243': 'Congo (Kinshasa)',
        '+244': 'Angola',
        '+245': 'Guinea-Bissau',
        '+246': 'Diego Garcia',
        '+247': 'Ascension Island',
        '+248': 'Seychelles',
        '+249': 'Tanzania',
        '+220': 'Gambia',
        '+221': 'Senegal',
        '+222': 'Mauritania',
        '+223': 'Mali',
        '+224': 'Guinea',
        '+226': 'Burkina Faso',
        '+232': 'Sierra Leone',
        '+231': 'Liberia',
        '+237': 'Cameroon',
        '+238': 'Cape Verde',
        '+239': 'Sao Tome & Principe',
        '+230': 'Mauritius',
        '+261': 'Madagascar',
        '+262': 'Reunion',
        '+269': 'Mayotte',
        '+290': 'Saint Helena',
        '+291': 'Eritrea',
        '+297': 'Aruba',
        '+298': 'Bonaire, Sint Eustatius & Saba',
        '+299': 'Greenland',
        '+351': 'Portugal',
        '+352': 'Luxembourg',
        '+353': 'Ireland',
        '+354': 'Iceland',
        '+355': 'Albania',
        '+356': 'Malta',
        '+357': 'Cyprus',
        '+358': 'Finland',
        '+359': 'Bulgaria',
        '+36': 'Hungary',
        '+370': 'Lithuania',
        '+371': 'Latvia',
        '+372': 'Estonia',
        '+373': 'Moldova',
        '+374': 'Armenia',
        '+375': 'Belarus',
        '+376': 'Andorra',
        '+377': 'Monaco',
        '+378': 'San Marino',
        '+380': 'Ukraine',
        '+381': 'Serbia',
        '+382': 'Montenegro',
        '+383': 'Kosovo',
        '+385': 'Croatia',
        '+386': 'Slovenia',
        '+387': 'Bosnia & Herzegovina',
        '+389': 'North Macedonia',
        '+40': 'Romania',
        '+41': 'Switzerland',
        '+420': 'Czech Republic',
        '+421': 'Slovakia',
        '+423': 'Liechtenstein',
        '+43': 'Austria',
        '+992': 'Tajikistan',
        '+993': 'Turkmenistan',
        '+994': 'Azerbaijan',
        '+995': 'Georgia',
        '+996': 'Kyrgyzstan',
        '+998': 'Uzbekistan',
        '+7': 'Russia/Kazakhstan',
        '+81': 'Japan',
        '+82': 'South Korea',
        '+84': 'Vietnam',
        '+86': 'China',
        '+852': 'Hong Kong',
        '+853': 'Macau',
        '+855': 'Cambodia',
        '+856': 'Laos',
        '+60': 'Malaysia',
        '+61': 'Australia',
        '+62': 'Indonesia',
        '+63': 'Philippines',
        '+64': 'New Zealand',
        '+65': 'Singapore',
        '+66': 'Thailand',
        '+670': 'East Timor',
        '+672': 'Australian External Territories',
        '+673': 'Brunei',
        '+674': 'Nauru',
        '+675': 'Papua New Guinea',
        '+676': 'Tonga',
        '+677': 'Solomon Islands',
        '+678': 'Vanuatu',
        '+679': 'Fiji',
        '+680': 'Palau',
        '+681': 'Wallis & Futuna',
        '+682': 'Cook Islands',
        '+683': 'Niue',
        '+684': 'American Samoa',
        '+685': 'Samoa',
        '+686': 'Kiribati',
        '+687': 'New Caledonia',
        '+688': 'Tuvalu',
        '+689': 'French Polynesia',
        '+690': 'Tokelau',
        '+691': 'Micronesia',
        '+692': 'Marshall Islands',
        '+850': 'North Korea',
        '+853': 'Macau',
        '+855': 'Cambodia',
        '+856': 'Laos',
        '+880': 'Bangladesh',
        '+881': 'Global Mobile Satellite System',
        '+882': 'International Networks',
        '+886': 'Taiwan',
        '+960': 'Maldives',
        '+961': 'Lebanon',
        '+962': 'Jordan',
        '+963': 'Syria',
        '+964': 'Iraq',
        '+965': 'Kuwait',
        '+966': 'Saudi Arabia',
        '+967': 'Yemen',
        '+968': 'Oman',
        '+970': 'Palestine',
        '+971': 'United Arab Emirates',
        '+972': 'Israel',
        '+973': 'Bahrain',
        '+974': 'Qatar',
        '+975': 'Bhutan',
        '+976': 'Mongolia',
        '+977': 'Nepal',
        '+92': 'Pakistan',
        '+93': 'Afghanistan',
        '+94': 'Sri Lanka',
        '+95': 'Myanmar',
        '+98': 'Iran',
        '+994': 'Azerbaijan',
        '+995': 'Georgia',
        '+996': 'Kyrgyzstan',
        '+998': 'Uzbekistan'
      };

      // Extract country codes from phone numbers
      const countryCounts = {};
      users.forEach(user => {
        const phone = user.phoneNumber;
        if (phone && phone.startsWith('+')) {
          let countryCode = '';
          
          // Handle common country codes properly
          if (phone.startsWith('+234')) {
            countryCode = '+234'; // Nigeria
          } else if (phone.startsWith('+1')) {
            // Differentiate between USA and Canada by area code
            const afterCountryCode = phone.substring(2);
            const areaCode = afterCountryCode.substring(0, 3);
            
            // Canadian area codes (common ones)
            const canadianAreaCodes = [
              '204', '226', '236', '249', '250', '289', '306', '343', '365', '403', '416', '418', '431',
              '437', '438', '450', '506', '514', '519', '548', '579', '581', '587', '604', '613', '639',
              '647', '672', '705', '709', '778', '780', '782', '807', '819', '825', '867', '873', '902', '905'
            ];
            
            if (canadianAreaCodes.includes(areaCode)) {
              countryCode = '+1-CA'; // Canada
            } else {
              countryCode = '+1-USA'; // USA (default)
            }
          } else if (phone.startsWith('+44')) {
            countryCode = '+44'; // UK
          } else if (phone.startsWith('+33')) {
            countryCode = '+33'; // France
          } else if (phone.startsWith('+49')) {
            countryCode = '+49'; // Germany
          } else if (phone.startsWith('+39')) {
            countryCode = '+39'; // Italy
          } else if (phone.startsWith('+34')) {
            countryCode = '+34'; // Spain
          } else if (phone.startsWith('+31')) {
            countryCode = '+31'; // Netherlands
          } else if (phone.startsWith('+41')) {
            countryCode = '+41'; // Switzerland
          } else if (phone.startsWith('+46')) {
            countryCode = '+46'; // Sweden
          } else if (phone.startsWith('+47')) {
            countryCode = '+47'; // Norway
          } else if (phone.startsWith('+45')) {
            countryCode = '+45'; // Denmark
          } else if (phone.startsWith('+358')) {
            countryCode = '+358'; // Finland
          } else if (phone.startsWith('+351')) {
            countryCode = '+351'; // Portugal
          } else if (phone.startsWith('+30')) {
            countryCode = '+30'; // Greece
          } else if (phone.startsWith('+90')) {
            countryCode = '+90'; // Turkey
          } else if (phone.startsWith('+20')) {
            countryCode = '+20'; // Egypt
          } else if (phone.startsWith('+27')) {
            countryCode = '+27'; // South Africa
          } else if (phone.startsWith('+254')) {
            countryCode = '+254'; // Kenya
          } else if (phone.startsWith('+256')) {
            countryCode = '+256'; // Uganda
          } else if (phone.startsWith('+233')) {
            countryCode = '+233'; // Ghana
          } else if (phone.startsWith('+225')) {
            countryCode = '+225'; // Ivory Coast
          } else {
            // Fallback: extract first 3 digits for other countries
            const match = phone.match(/^\+(\d{3})/);
            if (match) {
              countryCode = '+' + match[1];
            }
          }
          
          if (countryCode) {
            countryCounts[countryCode] = (countryCounts[countryCode] || 0) + 1;
          }
        }
      });

      // Convert to array with country names and sort by count (descending)
      const countryStats = Object.entries(countryCounts)
        .map(([code, count]) => ({ 
          code, 
          name: countryNames[code] || code, // Use country name or fallback to code
          count 
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);

      res.json({
        totalUsersWithPhone: users.length,
        countryStats
      });
    } catch (err) {
      console.error('Error fetching country stats:', err);
      res.status(500).json({ msg: 'Server error fetching country statistics' });
    }
  });

  return router;
};
