const prisma = require('../prismaClient');

// Export Prisma delegate for Moment model
module.exports = prisma.moment;