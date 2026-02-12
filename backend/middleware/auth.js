const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const auth = () => async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!req.user) return res.status(401).json({ msg: 'User not found' });
    if (!req.user.isActive) return res.status(403).json({ msg: 'Your account has been deactivated. Please contact support.' });
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;