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

/**
 * Resolve a session's user to a REAL User.id row. The JWT `id` can be stale
 * (e.g. the DB was reset/migrated and cuids regenerated) or absent, while the
 * account still exists by email. We trust the id only if a row exists; otherwise
 * we reconcile by email. Returns null when neither resolves (truly unknown user).
 */
export async function resolveUserId(
  userId: string | null | undefined,
  email?: string | null,
): Promise<string | null> {
  try {
    if (userId) {
      const byId = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      if (byId) return byId.id
    }
    const normEmail = email?.toLowerCase().trim()
    if (normEmail) {
      const byEmail = await prisma.user.findUnique({ where: { email: normEmail }, select: { id: true } })
      if (byEmail) return byEmail.id
    }
    return null
  } catch (e) {
    console.error('[consent] resolveUserId failed:', e)
    return null
  }
}

/** True iff the user has accepted the CURRENT consent version. Reconciles a
 *  stale/absent JWT id to the real User row by email before checking. */
export async function hasAcceptedCurrentConsent(
  userId: string | null | undefined,
  email?: string | null,
): Promise<boolean> {
  const realId = await resolveUserId(userId, email)
  if (!realId) return false
  try {
    const row = await prisma.consentAcceptance.findFirst({
      where: { userId: realId, consentVersion: CONSENT_VERSION },
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
  email?: string | null
  ip?: string | null
}): Promise<{ id: string; consentVersion: string }> {
  // Reconcile to a REAL User row (the JWT id may be stale) — otherwise the FK
  // to User is violated and the acceptance can never be recorded.
  const realId = await resolveUserId(args.userId, args.email)
  if (!realId) {
    throw new Error('We could not find your account to record consent — please sign out and sign in again.')
  }
  const row = await prisma.consentAcceptance.create({
    data: {
      userId: realId,
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
  return hasAcceptedCurrentConsent(userId, session?.user?.email)
}

/** The most recent acceptance across ALL versions (for the Terms & Consent view). */
export async function latestConsent(userId: string | null | undefined, email?: string | null) {
  const realId = await resolveUserId(userId, email)
  if (!realId) return null
  try {
    return await prisma.consentAcceptance.findFirst({
      where: { userId: realId },
      orderBy: { acceptedAt: 'desc' },
      select: { consentVersion: true, acceptedAt: true },
    })
  } catch (e) {
    console.error('[consent] latest lookup failed:', e)
    return null
  }
}
