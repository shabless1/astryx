/**
 * Prisma client singleton (Directive v4.0 · Fix 1).
 *
 * Standard Next.js pattern: cache the client on globalThis in dev so HMR
 * doesn't exhaust the connection pool. On Vercel each lambda gets one client
 * pointed at the Supavisor pooled connection (DATABASE_URL, pgbouncer=true).
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
