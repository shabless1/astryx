/**
 * ASTRYX — Subscription / Trial clock  (Directive v1.0 · FIX 9 · Decision D2)
 * ════════════════════════════════════════════════════════════════════════════
 * Deliberate-opt-in model — NOT a free trial that auto-charges:
 *   • 30 days full access, NO card at sign-up (clock starts at first onboarding).
 *   • Day 27 (3 left) + Day 29 (1 left) alerts.
 *   • Day 30: expired → locked out → subscribe-to-return gate.
 *   • The user enters payment at the GATE, deliberately → $9.99/mo or $99/yr.
 *   • Data is preserved across the wall; reactivation restores instantly.
 *
 * SUBSCRIPTION GATE v1 (2026-08-14) — the clock and the entitlement are now
 * SERVER-side (`/api/subscription/status`); this module holds the pure clock
 * plus the thin client calls into it. The old localStorage-only clock is kept
 * as an offline fallback, never as the authority.
 *
 * Billing rail = **Shopify**, and only Shopify. Every buy CTA opens the ASTRYX
 * product page on sacredtea.net — there is no in-app payment portal, by ruling.
 */

export const TRIAL_DAYS = 30

export const PRICE_MONTHLY = '$9.99/mo'
export const PRICE_YEARLY = '$99/yr'
/** Headline price on the gate. */
export const SUB_PRICE = PRICE_MONTHLY
/** What the yearly lane saves, stated plainly. */
export const YEARLY_SAVING = 'save $20 — two months free'

/**
 * The ASTRYX subscription product on sacredtea.net — both plans live on that
 * one page, where the buyer picks between them.
 * NEXT_PUBLIC_SUBSCRIBE_URL points at
 *   /products/astryx-cosmic-calibration-access
 * The fallback is deliberately the shop ROOT, not the product path: a product
 * that is still in draft 404s, and a dead link at the gate is worse than the
 * storefront's front door.
 */
export const SUBSCRIBE_URL =
  process.env.NEXT_PUBLIC_SUBSCRIBE_URL || 'https://sacredtea.net'

export type SubscriptionStatus = 'trial' | 'active' | 'expired'

export interface SubscriptionState {
  status: SubscriptionStatus
  daysLeft: number              // whole days remaining in the trial (0 when expired)
  locked: boolean               // true → app is gated, show the subscribe gate
  alert: null | '3days' | '1day' // in-app reminder to surface on entry
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Pure clock. `status='active'` (a live entitlement — subscription, founding
 * fork, or allowlist) always unlocks. Otherwise the 30-day trial governs,
 * counted from `trialStartedAt`.
 */
export function computeSubscription(
  trialStartedAt: string | null,
  status: SubscriptionStatus,
  now: Date = new Date(),
): SubscriptionState {
  if (status === 'active') {
    return { status: 'active', daysLeft: Infinity, locked: false, alert: null }
  }
  // No trial start recorded yet → treat as a fresh, full trial.
  if (!trialStartedAt) {
    return { status: 'trial', daysLeft: TRIAL_DAYS, locked: false, alert: null }
  }
  const started = new Date(trialStartedAt).getTime()
  const elapsedDays = Math.floor((now.getTime() - started) / DAY_MS)
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsedDays)

  if (daysLeft <= 0) {
    return { status: 'expired', daysLeft: 0, locked: true, alert: null }
  }
  // Day 27 = 3 days out, Day 29 = 1 day out (per directive).
  const alert: SubscriptionState['alert'] = daysLeft <= 1 ? '1day' : daysLeft <= 3 ? '3days' : null
  return { status: 'trial', daysLeft, locked: false, alert }
}

// ─── Client → server ─────────────────────────────────────────────────────────

export interface ServerSubscriptionState extends SubscriptionState {
  entitled: boolean
  lifetime: boolean
  plan: string | null
  currentPeriodEnd: string | null
  trialStartedAt: string | null
  trialDays: number
}

/**
 * Read the authoritative state. Returns null when it can't be reached (signed
 * out, offline, DB asleep) — callers keep whatever they already had rather
 * than locking someone out on a network blip.
 */
export async function fetchSubscriptionState(): Promise<ServerSubscriptionState | null> {
  try {
    const res = await fetch('/api/subscription/status', { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as ServerSubscriptionState
  } catch {
    return null
  }
}

/**
 * Start the 30-day clock at first onboarding. Safe to call repeatedly — the
 * server only honours the first claim and returns the original start date.
 */
export async function startTrialClock(): Promise<ServerSubscriptionState | null> {
  try {
    const res = await fetch('/api/subscription/status', { method: 'POST', cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as ServerSubscriptionState
  } catch {
    return null
  }
}

/**
 * "I've subscribed — restore my access." Asks the server whether a live
 * entitlement now exists for this account (the Shopify orders/paid webhook
 * writes it within seconds of checkout).
 */
export async function verifySubscription(_userId?: string): Promise<boolean> {
  const state = await fetchSubscriptionState()
  return state?.entitled === true
}
