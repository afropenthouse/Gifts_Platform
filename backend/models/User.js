const prisma = require('../prismaClient');

// Export Prisma delegate for User model
module.exports = prisma.user;