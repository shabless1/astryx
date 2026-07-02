/**
 * POST /api/readings — persist a generated reading (Directive v4.0 · Fix 1).
 *
 * Called fire-and-forget from the client after the deterministic engine
 * commits a ProtocolOutput to the Zustand store. Auth-guarded; guests keep
 * localStorage-only persistence (unchanged behavior).
 *
 * chartHash = sha256 of the determinism-relevant intake fields, so the same
 * birth data + intake can be verified to reproduce the same protocol later.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computeChartHash } from '@/lib/chartHash'

export const dynamic = 'force-dynamic'

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

  const { intake, protocol, chartData, accentColor } = body ?? {}
  if (!intake || !protocol) {
    return NextResponse.json({ error: 'intake and protocol are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const reading = await prisma.reading.create({
    data: {
      userId:      user.id,
      intake,
      protocol,
      chartData:   chartData ?? undefined,
      accentColor: typeof accentColor === 'string' ? accentColor : undefined,
      chartHash:   computeChartHash(intake),
    },
    select: { id: true, createdAt: true },
  })

  // Keep the user's natal snapshot current so a fresh device can rebuild.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      birthData: {
        name:          intake.name ?? '',
        birthDate:     intake.birthDate ?? '',
        birthTime:     intake.birthTime ?? '',
        birthLocation: intake.birthLocation ?? '',
        birthCoords:   intake.birthCoords ?? null,
      },
    },
  })

  return NextResponse.json({ success: true, id: reading.id })
}
