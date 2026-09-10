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

/** The two access tiers. SHA cut the Verified tier 2026-09-10 — Astryx builds
 *  systems and tools and will not act as a credentialing body. */
export type AccessTier = 'individual' | 'practitioner'

export interface AccessState {
  /** Access is live right now. */
  entitled: boolean
  /** WHAT they bought. Resolved SERVER-SIDE only — never from a request body.
   *  'individual' | 'practitioner'. The highest tier across live rows wins. */
  tier: AccessTier
  /** Access never expires (founding fork buyer, or BETA_ALLOWLIST). */
  lifetime: boolean
  /** 'lifetime' | 'monthly' | 'yearly' | null when not entitled. */
  plan: string | null
  /** ISO expiry, or null for lifetime / not entitled. */
  currentPeriodEnd: string | null
  source: string | null
}

const NO_ACCESS: AccessState = {
  entitled: false, lifetime: false, tier: 'individual', plan: null, currentPeriodEnd: null, source: null,
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
    // The owner allowlist carries the practitioner tier — SHA runs her own
    // sessions on the full surface without buying from herself.
    return { entitled: true, lifetime: true, tier: 'practitioner', plan: 'lifetime', currentPeriodEnd: null, source: 'allowlist' }
  }

  try {
    const rows = await prisma.entitlement.findMany({
      where: { email: normalized, status: 'active' },
      select: { plan: true, tier: true, currentPeriodEnd: true, source: true },
    })
    if (rows.length === 0) return NO_ACCESS

    // TIER is resolved across ALL live rows independently of which row wins on
    // duration. Someone holding a lifetime fork-kit grant AND a monthly
    // practitioner subscription is a practitioner: the lifetime row decides how
    // long they keep access, the practitioner row decides how much surface they
    // see. Collapsing these onto one row would silently downgrade that person.
    const now = Date.now()
    const liveRows = rows.filter((r) => r.currentPeriodEnd === null || r.currentPeriodEnd.getTime() > now)
    const tier: AccessTier = liveRows.some((r) => r.tier === 'practitioner') ? 'practitioner' : 'individual'

    // Lifetime beats everything on DURATION — no date can undercut it.
    const forever = rows.find((r) => r.currentPeriodEnd === null)
    if (forever) {
      return { entitled: true, lifetime: true, tier, plan: forever.plan, currentPeriodEnd: null, source: forever.source }
    }

    // Otherwise the furthest-out live row wins on duration.
    const live = rows
      .filter((r) => r.currentPeriodEnd !== null && r.currentPeriodEnd.getTime() > now)
      .sort((a, b) => b.currentPeriodEnd!.getTime() - a.currentPeriodEnd!.getTime())[0]
    if (!live) return NO_ACCESS

    return {
      entitled: true,
      lifetime: false,
      tier,
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

/** The tier alone. Server-side only. */
export async function tierFor(email: string | null | undefined): Promise<AccessTier> {
  return (await resolveAccess(email)).tier
}

/** Boolean form — what the NextAuth JWT stamps at sign-in. */
export async function hasEntitlement(email: string | null | undefined): Promise<boolean> {
  return (await resolveAccess(email)).entitled
}
