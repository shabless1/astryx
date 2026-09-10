/**
 * ASTRYX — Practitioner tier gate (P0)
 * ════════════════════════════════════════════════════════════════════════════
 * The portal audit's one-sentence blocker was this: there was no practitioner
 * tier anywhere in the money path, so the whole practitioner surface was free
 * to any subscriber who opened Settings and flipped a toggle.
 *
 * THE RULE — the tier comes from the SERVER, always.
 *   · `Entitlement.tier` is written by the Shopify webhook, classified by SKU.
 *   · `resolveAccess()` resolves it and NextAuth stamps it on the JWT.
 *   · Every gate below reads that stamp.
 *   · `intake.mode` is a display preference. It has never been, and must never
 *     become, an access decision. A client can put anything in a request body.
 *
 * SHA cut the Verified tier on 2026-09-10, so there are two tiers and no
 * credentialing. Astryx builds systems and tools; it is not a board.
 */

import { useSession } from 'next-auth/react'

export type AccessTier = 'individual' | 'practitioner'

/** Where an individual goes to become a practitioner. Payments are Shopify-only. */
export const PRACTITIONER_PRODUCT_URL =
  process.env.NEXT_PUBLIC_PRACTITIONER_URL ||
  'https://sacredtea.net/products/astryx-practitioner-access'

/** Feature flag — the door stays shut until SHA activates the Shopify product. */
export const PRACTITIONER_TIER_LIVE =
  process.env.NEXT_PUBLIC_PRACTITIONER_TIER_LIVE === 'true'

/**
 * The signed-in user's tier, from the JWT. Never from local state.
 * Returns 'individual' while the session is still loading, so a gate never
 * flashes open before the answer arrives.
 */
export function useAccessTier(): { tier: AccessTier; loading: boolean } {
  const { data, status } = useSession()
  const tier = ((data?.user as { tier?: AccessTier } | undefined)?.tier ?? 'individual') as AccessTier
  return { tier, loading: status === 'loading' }
}

/** Is this user entitled to the practitioner surface? */
export function useIsPractitioner(): boolean {
  const { tier, loading } = useAccessTier()
  return !loading && tier === 'practitioner'
}

/**
 * Server-side form. Pass the tier off the session, never off a request body.
 * Kept here so there is one definition of the question in the codebase.
 */
export function isPractitionerTier(tier: string | undefined | null): boolean {
  return tier === 'practitioner'
}
