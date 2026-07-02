/**
 * Beta entitlement check (Directive v4.0 · Fix 2).
 *
 * A user is entitled when:
 *   • an active Entitlement row exists for their normalized email
 *     (written by the Shopify orders/paid webhook), OR
 *   • their email is in the BETA_ALLOWLIST env (comma-separated — lets SHA
 *     grant access manually without touching the database).
 *
 * Server-only. The result is stamped into the NextAuth JWT at sign-in
 * (cached — we never hit the DB per request).
 */

import { prisma } from './db'

export async function hasEntitlement(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  const normalized = email.trim().toLowerCase()

  const allowlist = (process.env.BETA_ALLOWLIST || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (allowlist.includes(normalized)) return true

  try {
    const row = await prisma.entitlement.findFirst({
      where: { email: normalized, status: 'active' },
      select: { id: true },
    })
    return !!row
  } catch (e) {
    // A DB hiccup must never lock a paying user out mid-session; the JWT
    // keeps whatever was stamped at sign-in. Fail closed for new stamps.
    console.error('[entitlement] lookup failed:', e)
    return false
  }
}
