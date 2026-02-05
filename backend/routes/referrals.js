const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const auth = require('../middleware/auth');
const crypto = require('crypto');

module.exports = () => {
  // Get referral stats
  router.get('/', auth(), async (req, res) => {
    try {
      let user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          referrals: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              isVerified: true
            }
          },
          referralTransactions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) return res.status(404).json({ msg: 'User not found' });

      // Generate referral code if missing (for existing users)
      if (!user.referralCode) {
        let newReferralCode;
        let isUnique = false;
        while (!isUnique) {
          const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
          const namePart = user.name ? user.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'USE';
          newReferralCode = `${namePart}${randomPart}`;
          const existing = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
          if (!existing) isUnique = true;
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: newReferralCode },
          include: {
            referrals: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                isVerified: true
              }
            },
            referralTransactions: {
              orderBy: { createdAt: 'desc' }
            }
          }
        });
      }

      // Calculate total earnings
      const totalEarnings = user.referralTransactions.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

      res.json({
        referralCode: user.referralCode,
        referralLink: `${process.env.FRONTEND_URL}/signup?ref=${user.referralCode}`,
        referralsCount: user.referrals.length,
        totalEarnings,
        referrals: user.referrals,
        transactions: user.referralTransactions
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};
