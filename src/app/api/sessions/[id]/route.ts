/**
 * PATCH /api/sessions/:id — OUTCOME CAPTURE step 2 (Roadmap 0.2, 2026-09-09).
 *
 * Writes how the session landed: energyAfter (1–10) + the whitelisted
 * check-in answers + outcomeAt. Auth-guarded and OWNER-scoped: the update is
 * a single `updateMany` filtered by { id, userId, outcomeAt: null }, so a
 * user can never touch another user's row and a recorded outcome is never
 * overwritten (second write → 409). Abandoned sessions simply keep step 1.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { shapeSessionOutcome } from '@/lib/outcomeCapture'

export const dynamic = 'force-dynamic'

const ID_RE = /^[a-z0-9]{20,32}$/i

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = params?.id ?? ''
  if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const out = shapeSessionOutcome(body)
  if (out.energyAfter === undefined && !out.outcome) {
    return NextResponse.json({ error: 'Nothing to record' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const res = await prisma.chamberSession.updateMany({
    where: { id, userId: user.id, outcomeAt: null },
    data: {
      energyAfter: out.energyAfter ?? null,
      outcome: out.outcome ?? undefined,
      outcomeAt: new Date(),
    },
  })

  if (res.count === 0) {
    // Not this user's session, unknown id, or already recorded — same answer
    // for all three (no existence oracle).
    return NextResponse.json({ error: 'Session not open for outcome' }, { status: 409 })
  }

  return NextResponse.json({ success: true, id })
}
