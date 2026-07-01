/**
 * ASTRYX — Subscription / Trial clock  (Directive v1.0 · FIX 9 · Decision D2)
 * ════════════════════════════════════════════════════════════════════════════
 * Deliberate-opt-in model — NOT a free trial that auto-charges:
 *   • 30 days full access, NO card at download (trial starts at first onboarding).
 *   • Day 27 (3 left) + Day 29 (1 left) alerts.
 *   • Day 30: expired → locked out → subscribe-to-return gate.
 *   • The user enters payment at the GATE, deliberately → $9.99/mo AUTO-RECURRING.
 *   • Data is preserved across the wall; reactivation restores instantly.
 *
 * Billing rail = **Shopify** (SHA's existing portal). The gate's subscribe button
 * opens the Shopify subscription checkout (`NEXT_PUBLIC_SUBSCRIBE_URL`). Active-
 * status truth comes from Shopify at launch (webhook → server-side account flag);
 * `verifySubscription()` below is the single seam to wire that. Until then the
 * clock is the local source of truth (localStorage; honest + demoable).
 */

export const TRIAL_DAYS = 30
export const SUB_PRICE = '$9.99/mo'
/** Shopify subscription checkout (set at launch). Falls back to the shop root. */
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
 * Pure clock. `status='active'` (a confirmed Shopify subscription) always unlocks.
 * Otherwise the 30-day trial governs, counted from `trialStartedAt`.
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

/**
 * SEAM (wire at launch): confirm an active Shopify subscription for this account.
 * Replace the body with a call to a server route that checks Shopify (webhook-
 * updated account flag / Admin API). Returns true → caller sets status 'active'.
 * Default: not verified (the trial clock governs until Shopify is wired).
 */
export async function verifySubscription(_userId?: string): Promise<boolean> {
  // TODO(launch): GET /api/subscription/status → Shopify-confirmed active flag.
  return false
}
