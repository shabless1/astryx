/**
 * POST /api/sessions — record a completed chamber session (Directive v4.3).
 *
 * kind: "reading" (calibrated) | "daily" | "full_body". Auth-guarded,
 * fire-and-forget from the client on completion; guests keep local history.
 *
 * OUTCOME CAPTURE step 1 (Roadmap 0.2, 2026-09-09): the completion payload
 * also carries what ran — energyBefore, carrier planet, signal state, fork
 * sequence, intention. readingId + chartHash are resolved HERE from the
 * user's latest persisted Reading (the client never asserts which chart it
 * ran on), and the Calibration Standard version is stamped server-side.
 * The returned id is what the check-in PATCHes with energyAfter (step 2).
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { shapeSessionStart, CALIBRATION_STANDARD_VERSION } from '@/lib/outcomeCapture'

export const dynamic = 'force-dynamic'

const KINDS = new Set(['reading', 'daily', 'full_body', 'chakra_solfeggio', 'chakra_planetary'])

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
  const start = shapeSessionStart(body)

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // The chart this session ran on = the user's most recent persisted reading.
  // Chakra ladders and Full Body runs are chart-independent but still get
  // linked when a reading exists (the user's signature is still the context).
  const latest = await prisma.reading.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, chartHash: true },
  })

  const row = await prisma.chamberSession.create({
    data: {
      userId: user.id,
      kind,
      completedPhases,
      startedAt: Number.isNaN(startedAt.getTime()) ? new Date() : startedAt,
      completedAt: Number.isNaN(completedAt.getTime()) ? new Date() : completedAt,
      readingId: latest?.id ?? null,
      chartHash: latest?.chartHash ?? null,
      standardVersion: CALIBRATION_STANDARD_VERSION,
      energyBefore: start.energyBefore ?? null,
      carrierPlanet: start.carrierPlanet ?? null,
      signalState: start.signalState ?? null,
      forkSequence: start.forkSequence ?? undefined,
      intention: start.intention ?? undefined,
    },
    select: { id: true },
  })

  return NextResponse.json({ success: true, id: row.id })
}
