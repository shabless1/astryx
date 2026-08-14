/**
 * Access entitlement (Directive v4.0 · Fix 2 → SUBSCRIPTION GATE v1).
 *
 * A user has access when ANY of these is true:
 *   • their email is in BETA_ALLOWLIST (SHA's manual grant — no DB row needed,
 *     and it survives a database wipe, which is why it stays first), OR
 *   • an active Entitlement row exists for their normalized email that has
 *     NOT lapsed — meaning currentPeriodEnd is NULL (lifetime) or in the future.
 *
 * Rows are APPEND-ONLY, one per paid Shopify order. Effective access is the
 * most generous live row, so a renewal can only ever extend — a rebill that
 * lands with a shorter period can never claw back time someone already holds.
 * That is the same "never shorten" guarantee the Sacred Vault webhook carries,
 * expressed as data instead of as branching logic.
 *
 * Server-only.
 */

import { prisma } from './db'

export interface AccessState {
  /** Access is live right now. */
  entitled: boolean
  /** Access never expires (founding fork buyer, or BETA_ALLOWLIST). */
  lifetime: boolean
  /** 'lifetime' | 'monthly' | 'yearly' | null when not entitled. */
  plan: string | null
  /** ISO expiry, or null for lifetime / not entitled. */
  currentPeriodEnd: string | null
  source: string | null
}

const NO_ACCESS: AccessState = {
  entitled: false, lifetime: false, plan: null, currentPeriodEnd: null, source: null,
}

function allowlisted(normalized: string): boolean {
  return (process.env.BETA_ALLOWLIST || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized)
}

/**
 * The full picture for one email — what kind of access, and until when.
 * Used by the subscription-status route so the gate can show an honest
 * renewal date instead of a bare locked/unlocked flag.
 */
export async function resolveAccess(email: string | null | undefined): Promise<AccessState> {
  if (!email) return NO_ACCESS
  const normalized = email.trim().toLowerCase()

  if (allowlisted(normalized)) {
    return { entitled: true, lifetime: true, plan: 'lifetime', currentPeriodEnd: null, source: 'allowlist' }
  }

  try {
    const rows = await prisma.entitlement.findMany({
      where: { email: normalized, status: 'active' },
      select: { plan: true, currentPeriodEnd: true, source: true },
    })
    if (rows.length === 0) return NO_ACCESS

    // Lifetime beats everything — no date can undercut it.
    const forever = rows.find((r) => r.currentPeriodEnd === null)
    if (forever) {
      return { entitled: true, lifetime: true, plan: forever.plan, currentPeriodEnd: null, source: forever.source }
    }

    // Otherwise the furthest-out live row wins.
    const now = Date.now()
    const live = rows
      .filter((r) => r.currentPeriodEnd !== null && r.currentPeriodEnd.getTime() > now)
      .sort((a, b) => b.currentPeriodEnd!.getTime() - a.currentPeriodEnd!.getTime())[0]
    if (!live) return NO_ACCESS

    return {
      entitled: true,
      lifetime: false,
      plan: live.plan,
      currentPeriodEnd: live.currentPeriodEnd!.toISOString(),
      source: live.source,
    }
  } catch (e) {
    // A DB hiccup must never lock a paying user out mid-session; the JWT keeps
    // whatever was stamped at sign-in. Fail closed only for NEW stamps.
    console.error('[entitlement] lookup failed:', e)
    return NO_ACCESS
  }
}

/** Boolean form — what the NextAuth JWT stamps at sign-in. */
export async function hasEntitlement(email: string | null | undefined): Promise<boolean> {
  return (await resolveAccess(email)).entitled
}
