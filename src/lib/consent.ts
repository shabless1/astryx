/**
 * Informed-consent + assumption-of-risk gate (LEGAL SHIELD v1 · FIX 1).
 *
 * Server-only. A user has "current consent" when a ConsentAcceptance row
 * exists for them whose consentVersion === the app's CONSENT_VERSION. The gate
 * is enforced at the server boundary that releases a reading (see the
 * requireConsent() guard used by /api/protocol, /api/astryx, /api/intake) — so
 * it holds even if the client UI is bypassed or "accepted" state is forged.
 *
 * Mirrors the entitlement.ts pattern: the positive result is stamped into the
 * NextAuth JWT at sign-in AND refreshed via the session `update` trigger right
 * after the user accepts, so the gate flips within the same session without a
 * DB read per request. requireConsent() falls back to a DB check when the JWT
 * has no positive stamp yet (e.g. the user accepted mid-session).
 */

import { createHash } from 'node:crypto'
import type { Session } from 'next-auth'
import { prisma } from './db'
import { CONSENT_VERSION, CONSENT_FULL_TEXT } from '@/legal'

/** sha256 of the exact consent text the user agreed to — stored per acceptance. */
export function consentTextHash(text: string = CONSENT_FULL_TEXT): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/** True iff the user has accepted the CURRENT consent version. */
export async function hasAcceptedCurrentConsent(
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false
  try {
    const row = await prisma.consentAcceptance.findFirst({
      where: { userId, consentVersion: CONSENT_VERSION },
      select: { id: true },
    })
    return !!row
  } catch (e) {
    // Fail CLOSED for the gate: a DB hiccup must not silently release a reading
    // to a user with no recorded consent.
    console.error('[consent] lookup failed:', e)
    return false
  }
}

/**
 * Record a fresh acceptance of the current consent version. Idempotent-ish: a
 * user re-accepting the same version simply adds another dated row (cheap, and
 * preserves the full history). Returns the stored row id.
 */
export async function recordConsent(args: {
  userId: string
  ip?: string | null
}): Promise<{ id: string; consentVersion: string }> {
  const row = await prisma.consentAcceptance.create({
    data: {
      userId: args.userId,
      consentVersion: CONSENT_VERSION,
      ipAtAcceptance: args.ip ?? null,
      consentTextHash: consentTextHash(),
    },
    select: { id: true, consentVersion: true },
  })
  return row
}

/**
 * Server gate used by reading-releasing routes. Consent applies to
 * AUTHENTICATED users (per the directive: "first authenticated session").
 *   • No session (anonymous free use) → gate does not apply; there is no
 *     account to record consent against. (Anonymous users still see the
 *     disclaimers everywhere via FIX 2.)
 *   • Session present → require current consent. Trusts the JWT positive stamp;
 *     falls back to a DB read only when the stamp is absent (user accepted
 *     mid-session before their token refreshed).
 */
export async function sessionHasConsent(session: Session | null): Promise<boolean> {
  const userId = session?.user?.id
  if (!userId) return true // anonymous — not gated by the consent record
  if (session?.user?.consented === true) return true
  return hasAcceptedCurrentConsent(userId)
}

/** The most recent acceptance across ALL versions (for the Terms & Consent view). */
export async function latestConsent(userId: string | null | undefined) {
  if (!userId) return null
  try {
    return await prisma.consentAcceptance.findFirst({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
      select: { consentVersion: true, acceptedAt: true },
    })
  } catch (e) {
    console.error('[consent] latest lookup failed:', e)
    return null
  }
}
