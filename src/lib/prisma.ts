import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Optimize connection management
if (process.env.NODE_ENV === 'production') {
  // In production, use connection pooling optimizations
  prisma.$connect()
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}