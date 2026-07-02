/**
 * GET /api/readings/latest — most recent persisted reading (Fix 1).
 *
 * Called on login to rehydrate a fresh device / cleared localStorage.
 * localStorage wins when both exist (client decides — it only calls this
 * when its own store is empty).
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true, birthData: true },
  })
  if (!user) return NextResponse.json({ reading: null })

  const reading = await prisma.reading.findFirst({
    where:   { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select:  {
      id: true,
      intake: true,
      protocol: true,
      chartData: true,
      accentColor: true,
      chartHash: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ reading, birthData: user.birthData ?? null })
}
