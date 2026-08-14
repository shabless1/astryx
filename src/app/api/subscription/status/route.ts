/**
 * /api/subscription/status — the single source of truth for "is the door open?"
 *
 * SUBSCRIPTION GATE v1 (2026-08-14). Before this route the gate was decided
 * entirely in the browser: the trial clock lived in localStorage and
 * verifySubscription() was a stub that always returned false. That made the
 * gate both trivially bypassable (clear site data → a fresh 30 days) and a
 * dead end (a member who genuinely subscribed could never get back in).
 *
 * GET  → the real state, computed server-side from the Entitlement table and
 *        the user's server-side trial clock.
 * POST → claim the 30-day trial, ONCE. Atomic (UPDATE ... WHERE IS NULL), so a
 *        second call — or two racing tabs — can never restart the clock.
 *
 * Session-gated: a caller only ever learns about their own account.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { resolveAccess } from '@/lib/entitlement'
import { prisma } from '@/lib/db'
import { TRIAL_DAYS, computeSubscription, type SubscriptionState } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export interface SubscriptionStatusResponse extends SubscriptionState {
  /** Paid/comped access is live (subscription, founding fork, or allowlist). */
  entitled: boolean
  /** Access never expires — no renewal date to show. */
  lifetime: boolean
  plan: string | null
  /** ISO renewal/expiry date for a time-bound subscription. */
  currentPeriodEnd: string | null
  /** ISO date the 30-day trial clock started, server-side. */
  trialStartedAt: string | null
  trialDays: number
}

async function buildState(
  userId: string | undefined,
  email: string | null | undefined,
): Promise<SubscriptionStatusResponse> {
  const access = await resolveAccess(email)

  let trialStartedAt: Date | null = null
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialStartedAt: true },
    })
    trialStartedAt = user?.trialStartedAt ?? null
  }

  const clock = computeSubscription(
    trialStartedAt ? trialStartedAt.toISOString() : null,
    access.entitled ? 'active' : 'trial',
  )

  return {
    ...clock,
    entitled: access.entitled,
    lifetime: access.lifetime,
    plan: access.plan,
    currentPeriodEnd: access.currentPeriodEnd,
    trialStartedAt: trialStartedAt ? trialStartedAt.toISOString() : null,
    trialDays: TRIAL_DAYS,
  }
}

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  try {
    return NextResponse.json(await buildState(session.user.id, session.user.email))
  } catch (e) {
    console.error('[subscription/status] GET failed:', e)
    // Never lock someone out because the database blinked — the client keeps
    // whatever state it already had.
    return NextResponse.json({ error: 'status unavailable' }, { status: 503 })
  }
}

/**
 * Start the trial clock (first onboarding). Idempotent by construction: the
 * conditional update only lands while trialStartedAt is still NULL, so calling
 * it again — or from a second device — returns the ORIGINAL start date.
 */
export async function POST() {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  try {
    await prisma.user.updateMany({
      where: { id: session.user.id, trialStartedAt: null },
      data: { trialStartedAt: new Date() },
    })
    return NextResponse.json(await buildState(session.user.id, session.user.email))
  } catch (e) {
    console.error('[subscription/status] POST failed:', e)
    return NextResponse.json({ error: 'status unavailable' }, { status: 503 })
  }
}
