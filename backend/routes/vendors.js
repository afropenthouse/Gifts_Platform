const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');

function calculateStatus(amountAgreed, amountPaid, dueDate) {
  const balance = amountAgreed - amountPaid;
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
        balance: vendor.amountAgreed - vendor.amountPaid,
        status: calculateStatus(vendor.amountAgreed, vendor.amountPaid, vendor.dueDate)
      }));

      res.json(vendorsWithCalculated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Create a new vendor
  router.post('/', auth(), async (req, res) => {
    const { eventId, category, amountAgreed, amountPaid = 0, dueDate } = req.body;

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
          amountAgreed: parseFloat(amountAgreed),
          amountPaid: parseFloat(amountPaid),
          dueDate: new Date(dueDate),
          status: calculateStatus(parseFloat(amountAgreed), parseFloat(amountPaid), new Date(dueDate))
        },
        include: {
          event: {
            select: { id: true, title: true, type: true }
          }
        }
      });

      const vendorWithCalculated = {
        ...vendor,
        balance: vendor.amountAgreed - vendor.amountPaid
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
    const { category, amountAgreed, amountPaid, dueDate } = req.body;

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

      // Recalculate status
      const finalAmountAgreed = amountAgreed !== undefined ? parseFloat(amountAgreed) : updatedVendor.amountAgreed;
      const finalAmountPaid = amountPaid !== undefined ? parseFloat(amountPaid) : updatedVendor.amountPaid;
      const finalDueDate = dueDate !== undefined ? new Date(dueDate) : updatedVendor.dueDate;

      const vendorWithCalculated = {
        ...updatedVendor,
        balance: finalAmountAgreed - finalAmountPaid,
        status: calculateStatus(finalAmountAgreed, finalAmountPaid, finalDueDate)
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

  return router;
};