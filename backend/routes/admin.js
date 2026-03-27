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
      const { time, type, eventId } = req.query;
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

      const parsedEventId = eventId && !Number.isNaN(parseInt(eventId, 10)) ? parseInt(eventId, 10) : null;
      const eventGift = parsedEventId
        ? await prisma.gift.findUnique({
            where: { id: parsedEventId },
            select: { userId: true },
          })
        : null;
      const eventOwnerId = eventGift?.userId || null;

      let totalWalletBalance = 0;
      if (time && time !== 'all') {
        const [
          contributionsStats,
          referralStats,
          withdrawalStats
        ] = await Promise.all([
          prisma.contribution.aggregate({
            _sum: {
              amount: true,
              commission: true,
            },
            where: {
              status: 'completed',
              ...dateFilter
            }
          }),
          prisma.referralTransaction.aggregate({
            _sum: {
              amount: true,
            },
            where: dateFilter
          }),
          prisma.withdrawal.aggregate({
            _sum: {
              amount: true,
            },
            where: {
              status: { in: ['completed', 'pending'] },
              ...dateFilter
            }
          })
        ]);

        const actualIn = (Number(contributionsStats._sum.amount) || 0) - (Number(contributionsStats._sum.commission) || 0) + (Number(referralStats._sum.amount) || 0);
        const totalOut = Number(withdrawalStats._sum.amount) || 0;
        totalWalletBalance = actualIn - totalOut;
      } else {
        const totalWallet = await prisma.user.aggregate({
          _sum: {
            wallet: true,
          }
        });
        totalWalletBalance = Number(totalWallet._sum.wallet || 0);
      }

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
          totalContributions: totalContributions._sum.amount || 0,
          totalAsoebiContributions: totalAsoebiContributions._sum.amount || 0,
          totalWalletBalance: totalWalletBalance,
          guestListOpenEvents: openGuestEvents,
          guestListRestrictedEvents: restrictedGuestEvents,
          totalRevenue: platformRevenue,
          referralRevenue,
          estimatedPaystackFees: totalPaystackFees,
          payoutFees,
          netProfit
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
      const gifts = await prisma.gift.findMany({
        orderBy: {
          createdAt: 'desc'
        },
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

  return router;
};
