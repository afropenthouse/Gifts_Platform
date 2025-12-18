const prisma = require('../prismaClient');

// Export Prisma delegate for Contribution model
module.exports = prisma.contribution;