const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');
const { resolveAccount, getBanks, initializePayment } = require('../utils/paystack');
const { sendEmail, mailFrom } = require('../utils/email');

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
        event: {
          userId: req.user.id
        }
      };
      if (eventId) {
        where.eventId = parseInt(eventId);
      }
      const vendors = await prisma.vendor.findMany({
        where,
        include: {
          event: {
            select: { id: true, title: true, type: true }
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
          status: 'Not Scheduled'
        },
        include: {
          event: {
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
          event: {
            select: { userId: true }
          }
        }
      });
      if (!vendor || vendor.event.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      const updatedVendor = await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          ...(category !== undefined && { category }),
          ...(vendorEmail !== undefined && { vendorEmail }),
          ...(amountAgreed !== undefined && { amountAgreed: parseFloat(amountAgreed) }),
          ...(amountPaid !== undefined && { amountPaid: parseFloat(amountPaid) }),
          ...(dueDate !== undefined && { dueDate: new Date(dueDate) })
        },
        include: {
          event: {
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
          event: {
            select: { userId: true }
          }
        }
      });
      if (!vendor || vendor.event.userId !== req.user.id) {
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
      // Check ownership
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          event: {
            select: { userId: true }
          }
        }
      });
      if (!vendor || vendor.event.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      // Initialize payment
      const reference = `vendor-schedule-${vendorId}-${Date.now()}`;
      const payment = await initializePayment({
        email: req.user.email,
        amount: parseFloat(amount) * 100, // in kobo
        reference,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
        metadata: {
          vendorId,
          amount: parseFloat(amount),
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
          scheduledAmount: vendor.scheduledAmount + parseFloat(amount),
          status: 'Scheduled',
          releaseDate,
          accountNumber,
          bankCode,
          bankName,
          accountName
        },
        include: {
          event: {
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

  // Cancel scheduled payment
  router.post('/:id/cancel-scheduled', auth(), async (req, res) => {
    const vendorId = parseInt(req.params.id);

    try {
      // Check ownership
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          event: {
            select: { userId: true }
          }
        }
      });
      if (!vendor || vendor.event.userId !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }

      if (vendor.status !== 'Scheduled' || new Date(vendor.dueDate) <= new Date()) {
        return res.status(400).json({ msg: 'Cannot cancel this payment' });
      }

      // Mock refund success

      const updatedVendor = await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          scheduledAmount: 0,
          status: 'Cancelled',
          releaseDate: null
        },
        include: {
          event: {
            select: { id: true, title: true, type: true }
          }
        }
      });

      const vendorWithCalculated = {
        ...updatedVendor,
        balance: updatedVendor.amountAgreed - updatedVendor.amountPaid - updatedVendor.scheduledAmount
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