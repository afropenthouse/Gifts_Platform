const prisma = require('../prismaClient');

// Export Prisma delegate for Gift model
module.exports = prisma.gift;