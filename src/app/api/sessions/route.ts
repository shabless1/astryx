/**
 * POST /api/sessions — record a completed chamber session (Directive v4.3).
 *
 * kind: "reading" (calibrated) | "daily" | "full_body". Auth-guarded,
 * fire-and-forget from the client on completion; guests keep local history.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const KINDS = new Set(['reading', 'daily', 'full_body'])

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const kind = KINDS.has(body?.kind) ? body.kind : 'reading'
  const startedAt = body?.startedAt ? new Date(body.startedAt) : new Date()
  const completedAt = body?.completedAt ? new Date(body.completedAt) : new Date()
  const completedPhases = Number.isFinite(body?.completedPhases) ? Math.max(0, Math.trunc(body.completedPhases)) : 0

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const row = await prisma.chamberSession.create({
    data: {
      userId: user.id,
      kind,
      completedPhases,
      startedAt: Number.isNaN(startedAt.getTime()) ? new Date() : startedAt,
      completedAt: Number.isNaN(completedAt.getTime()) ? new Date() : completedAt,
    },
    select: { id: true },
  })

  return NextResponse.json({ success: true, id: row.id })
}
