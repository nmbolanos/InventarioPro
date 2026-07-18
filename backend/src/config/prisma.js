const { PrismaClient } = require('@prisma/client');

// Instancia única de PrismaClient para evitar problemas de conexión en desarrollo
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

module.exports = prisma;
