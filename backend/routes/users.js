const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');

module.exports = () => {
  const router = express.Router();

  // Update profile
  router.put('/profile', auth(), async (req, res) => {
    const { name, profilePicture } = req.body;

    try {
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name ?? undefined,
          profilePicture: profilePicture ?? undefined,
        },
      });

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get profile
  router.get('/profile', auth(), async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json(user);
  });

  return router;
};