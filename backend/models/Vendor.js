const prisma = require('../prismaClient');

// Export Prisma delegate for Vendor model
module.exports = prisma.vendor;