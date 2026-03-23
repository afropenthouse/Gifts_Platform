const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const { resolveAccount, getBanks, initializePayment } = require('../utils/paystack');
const { sendEmail, mailFrom } = require('../utils/email');
const { sendWalletOtpEmail } = require('../utils/emailService');

function calculateStatus(amountAgreed, amountPaid, scheduledAmount, dueDate, status) {
  // Use stored status if it's the new ones
  if (['Not Scheduled', 'Scheduled', 'Released', 'Cancelled'].includes(status)) {
    return status;
  }
  // Fallback to old logic
  const balance = amountAgreed - amountPaid - scheduledAmount;
  if (balance <= 0) return 'paid';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  if (due < today) return 'overdue';
  return 'pending';
}

module.exports = () => {
  const router = express.Router();

  // Get vendors for authenticated user, optionally filtered by event
  router.get('/', auth(), async (req, res) => {
    try {
      const { eventId } = req.query;
      const where = {
      Gift: {
        userId: req.user.id
      }
    };
    if (eventId) {
      where.eventId = parseInt(eventId);
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        Gift: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      },
        orderBy: { dueDate: 'asc' }
      });

      // Calculate balance and status
      const vendorsWithCalculated = vendors.map(vendor => ({
        ...vendor,
        balance: vendor.amountAgreed - vendor.amountPaid - vendor.scheduledAmount,
        status: calculateStatus(vendor.amountAgreed, vendor.amountPaid, vendor.scheduledAmount, vendor.dueDate, vendor.status)
      }));

      res.json(vendorsWithCalculated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Create a new vendor
  router.post('/', auth(), async (req, res) => {
    const { eventId, category, vendorEmail, amountAgreed, amountPaid = 0, dueDate } = req.body;

    try {
      // Check if event belongs to user
      const event = await prisma.gift.findUnique({
        where: { id: parseInt(eventId) },
        select: { userId: true }
      });
      if (!event || event.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      const vendor = await prisma.vendor.create({
        data: {
          eventId: parseInt(eventId),
          category,
          vendorEmail,
          amountAgreed: parseFloat(amountAgreed),
          amountPaid: parseFloat(amountPaid),
          dueDate: new Date(dueDate),
          status: 'Not Scheduled',
          updatedAt: new Date()
        },
        include: {
          Gift: {
            select: { id: true, title: true, type: true }
          }
        }
      });

      const vendorWithCalculated = {
        ...vendor,
        balance: vendor.amountAgreed - vendor.amountPaid - vendor.scheduledAmount
      };

      res.json(vendorWithCalculated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Update a vendor
  router.put('/:id', auth(), async (req, res) => {
    const vendorId = parseInt(req.params.id);
    const { category, vendorEmail, amountAgreed, amountPaid, dueDate } = req.body;

    try {
      // Check ownership
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          Gift: {
            select: { userId: true }
          }
        }
      });
      if (!vendor || vendor.Gift.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      const updatedVendor = await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          ...(category !== undefined && { category }),
          ...(vendorEmail !== undefined && { vendorEmail }),
          ...(amountAgreed !== undefined && { amountAgreed: parseFloat(amountAgreed) }),
          ...(amountPaid !== undefined && { amountPaid: parseFloat(amountPaid) }),
          ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
          updatedAt: new Date()
        },
        include: {
          Gift: {
            select: { id: true, title: true, type: true }
          }
        }
      });

      // Recalculate balance
      const finalAmountAgreed = amountAgreed !== undefined ? parseFloat(amountAgreed) : updatedVendor.amountAgreed;
      const finalAmountPaid = amountPaid !== undefined ? parseFloat(amountPaid) : updatedVendor.amountPaid;
      const finalScheduledAmount = updatedVendor.scheduledAmount;
      const finalDueDate = dueDate !== undefined ? new Date(dueDate) : updatedVendor.dueDate;

      const vendorWithCalculated = {
        ...updatedVendor,
        balance: finalAmountAgreed - finalAmountPaid - finalScheduledAmount,
        status: calculateStatus(finalAmountAgreed, finalAmountPaid, finalScheduledAmount, finalDueDate, updatedVendor.status)
      };

      res.json(vendorWithCalculated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete a vendor
  router.delete('/:id', auth(), async (req, res) => {
    const vendorId = parseInt(req.params.id);

    try {
      // Check ownership
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          Gift: {
            select: { userId: true }
          }
        }
      });
      if (!vendor || vendor.Gift.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      await prisma.vendor.delete({ where: { id: vendorId } });
      res.json({ msg: 'Vendor deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Schedule payment for a vendor
  router.post('/:id/schedule-payment', auth(), async (req, res) => {
    const vendorId = parseInt(req.params.id);
    const { amount, vendorEmail, accountName, accountNumber, bankCode, bankName } = req.body;

    try {
      const scheduleAmount = parseFloat(amount);
      if (Number.isNaN(scheduleAmount) || scheduleAmount <= 0) {
        return res.status(400).json({ msg: 'Invalid amount' });
      }

      // Check ownership
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          Gift: {
            select: { userId: true }
          }
        }
      });
      if (!vendor || vendor.Gift.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      const remainingBalance = Number(vendor.amountAgreed) - Number(vendor.amountPaid) - Number(vendor.scheduledAmount);
      if (scheduleAmount > remainingBalance) {
        return res.status(400).json({ msg: 'Amount exceeds outstanding balance' });
      }

      // Initialize payment
      const reference = `vendor-schedule-${vendorId}-${Date.now()}`;
      const payment = await initializePayment({
        email: req.user.email,
        amount: scheduleAmount * 100, // in kobo
        reference,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
        metadata: {
          vendorId,
          amount: scheduleAmount,
          vendorEmail,
          accountName,
          accountNumber,
          bankCode,
          bankName
        }
      });

      // For demo, assume payment success and update vendor
      // In real app, update after webhook or verification

      // Release 24 hours after due date (Old Logic)
      const releaseDate = new Date(vendor.dueDate.getTime() + 24 * 60 * 60 * 1000);

      // // Release 5 minutes after payment (for testing)
      // const releaseDate = new Date(Date.now() + 5 * 60 * 1000);

      const updatedVendor = await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          vendorEmail,
          scheduledAmount: { increment: scheduleAmount },
          status: 'Scheduled',
          releaseDate,
          accountNumber,
          bankCode,
          bankName,
          accountName
        },
        include: {
          Gift: {
            select: { id: true, title: true, type: true }
          }
        }
      });

      const vendorWithCalculated = {
        ...updatedVendor,
        balance: updatedVendor.amountAgreed - updatedVendor.amountPaid - updatedVendor.scheduledAmount,
        paymentUrl: payment.data.authorization_url
      };


      res.json(vendorWithCalculated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Schedule payment for a vendor using wallet balance
  router.post('/:id/send-wallet-otp', auth(), async (req, res) => {
    const vendorId = parseInt(req.params.id);
    const { amount } = req.body;

    try {
      const scheduleAmount = parseFloat(amount);
      if (Number.isNaN(scheduleAmount) || scheduleAmount <= 0) {
        return res.status(400).json({ msg: 'Invalid amount' });
      }

      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          Gift: { select: { userId: true } }
        }
      });

      if (!vendor || vendor.Gift.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      const remainingBalance = Number(vendor.amountAgreed) - Number(vendor.amountPaid) - Number(vendor.scheduledAmount);
      if (scheduleAmount > remainingBalance) {
        return res.status(400).json({ msg: 'Amount exceeds outstanding balance' });
      }

      const latestUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!latestUser) return res.status(404).json({ msg: 'User not found' });

      if (Number(latestUser.wallet) < scheduleAmount) {
        return res.status(400).json({ msg: 'Insufficient wallet balance' });
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          verificationToken: otp,
          verificationTokenExpires: expires,
        }
      });

      await sendWalletOtpEmail({
        recipientEmail: latestUser.email,
        recipientName: latestUser.name,
        otp,
      });

      res.json({ msg: 'OTP sent to your email' });
    } catch (err) {
      console.error('Error sending wallet OTP:', err);
      res.status(500).json({ msg: 'Failed to send OTP' });
    }
  });

  router.post('/:id/schedule-payment-wallet', auth(), async (req, res) => {
    const vendorId = parseInt(req.params.id);
    const { amount, vendorEmail, accountName, accountNumber, bankCode, bankName, otp } = req.body;

    try {
      const scheduleAmount = parseFloat(amount);
      if (Number.isNaN(scheduleAmount) || scheduleAmount <= 0) {
        return res.status(400).json({ msg: 'Invalid amount' });
      }

      if (!otp) {
        return res.status(400).json({ msg: 'OTP is required' });
      }

      const latestUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!latestUser) return res.status(404).json({ msg: 'User not found' });

      if (
        latestUser.verificationToken !== otp ||
        !latestUser.verificationTokenExpires ||
        latestUser.verificationTokenExpires < new Date()
      ) {
        return res.status(400).json({ msg: 'Invalid or expired OTP' });
      }

      await prisma.user.update({
        where: { id: latestUser.id },
        data: {
          verificationToken: null,
          verificationTokenExpires: null,
        }
      });

      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          Gift: {
            select: { userId: true }
          }
        }
      });

      if (!vendor || vendor.Gift.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      const remainingBalance = Number(vendor.amountAgreed) - Number(vendor.amountPaid) - Number(vendor.scheduledAmount);
      if (scheduleAmount > remainingBalance) {
        return res.status(400).json({ msg: 'Amount exceeds outstanding balance' });
      }

      const releaseDate = new Date(new Date(vendor.dueDate).getTime() + 24 * 60 * 60 * 1000);

      const { updatedVendor, updatedUser } = await prisma.$transaction(async (tx) => {
        const walletUpdate = await tx.user.updateMany({
          where: { id: req.user.id, wallet: { gte: scheduleAmount } },
          data: { wallet: { decrement: scheduleAmount } },
        });

        if (walletUpdate.count !== 1) {
          throw new Error('INSUFFICIENT_WALLET');
        }

        const funding = await tx.vendorPaymentFunding.create({
          data: {
            userId: req.user.id,
            vendorId,
            amount: scheduleAmount,
            method: 'wallet',
            status: 'funded',
          },
        });

        const updatedVendor = await tx.vendor.update({
          where: { id: vendorId },
          data: {
            vendorEmail,
            scheduledAmount: { increment: scheduleAmount },
            status: 'Scheduled',
            releaseDate,
            accountNumber,
            bankCode,
            bankName,
            accountName,
            updatedAt: new Date(),
          },
          include: {
            Gift: {
              select: { id: true, title: true, type: true }
            }
          }
        });

        const updatedUser = await tx.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            profilePicture: true,
            wallet: true,
          }
        });

        return { updatedVendor, updatedUser, funding };
      });

      const vendorWithCalculated = {
        ...updatedVendor,
        balance: updatedVendor.amountAgreed - updatedVendor.amountPaid - updatedVendor.scheduledAmount,
      };

      res.json({
        vendor: vendorWithCalculated,
        user: {
          ...updatedUser,
          wallet: parseFloat(updatedUser.wallet) || 0
        }
      });
    } catch (err) {
      if (err?.message === 'INSUFFICIENT_WALLET') {
        return res.status(400).json({ msg: 'Insufficient wallet balance' });
      }
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Cancel scheduled payment
  router.post('/:id/cancel-scheduled', auth(), async (req, res) => {
    const vendorId = parseInt(req.params.id);

    try {
      // Check ownership
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          Gift: {
            select: { userId: true }
          }
        }
      });
      if (!vendor || vendor.Gift.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      if (vendor.status !== 'Scheduled' || new Date(vendor.dueDate) <= new Date()) {
        return res.status(400).json({ msg: 'Cannot cancel this payment' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const walletFundings = await tx.vendorPaymentFunding.findMany({
          where: {
            vendorId,
            userId: req.user.id,
            method: 'wallet',
            status: 'funded',
          },
          select: { id: true, amount: true },
        });

        const refundAmount = walletFundings.reduce((sum, f) => sum + Number(f.amount || 0), 0);

        if (refundAmount > 0) {
          await tx.user.update({
            where: { id: req.user.id },
            data: { wallet: { increment: refundAmount } },
          });

          await tx.vendorPaymentFunding.updateMany({
            where: {
              id: { in: walletFundings.map(f => f.id) },
            },
            data: { status: 'refunded' },
          });
        }

        const updatedVendor = await tx.vendor.update({
          where: { id: vendorId },
          data: {
            scheduledAmount: 0,
            status: 'Cancelled',
            releaseDate: null
          },
          include: {
            Gift: {
              select: { id: true, title: true, type: true }
            }
          }
        });

        return { updatedVendor, refundAmount };
      });

      const vendorWithCalculated = {
        ...result.updatedVendor,
        balance: result.updatedVendor.amountAgreed - result.updatedVendor.amountPaid - result.updatedVendor.scheduledAmount
      };

      res.json(vendorWithCalculated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get banks
  router.get('/banks', auth(), async (req, res) => {
    try {
      const result = await getBanks();
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Failed to get banks' });
    }
  });

  // Resolve account details
  router.post('/resolve-account', auth(), async (req, res) => {
    const { accountNumber, bankCode } = req.body;

    try {
      const result = await resolveAccount({ account_number: accountNumber, account_bank: bankCode });
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Failed to resolve account' });
    }
  });

  return router;
};
