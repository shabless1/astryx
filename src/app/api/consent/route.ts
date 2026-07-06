/**
 * ASTRYX — Consent API (LEGAL SHIELD v1 · FIX 1)
 * ════════════════════════════════════════════════════════════════════════
 * GET  → current consent version + whether THIS user has accepted it, plus the
 *        clause text the client renders (single source: src/legal).
 * POST → record an acceptance for the signed-in user (server-captured IP +
 *        text hash). Requires a session — consent attaches to an account.
 *
 * The reading-releasing routes (/api/protocol, /api/astryx, /api/intake) call
 * sessionHasConsent() and refuse to compute for an authenticated user who has
 * not accepted — the server is the enforcement point, not the UI.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { hasAcceptedCurrentConsent, recordConsent } from '@/lib/consent'
import {
  CONSENT_VERSION,
  CONSENT_INTRO,
  CONSENT_CLAUSES,
  CONSENT_CHECKBOX_LABEL,
  CONSENT_ACCEPT_CTA,
  CONSENT_FULL_TEXT,
} from '@/legal'

export async function GET() {
  const session = await getSession()
  const userId = session?.user?.id ?? null
  const accepted = userId ? await hasAcceptedCurrentConsent(userId) : false

  return NextResponse.json({
    version: CONSENT_VERSION,
    accepted,
    authenticated: !!userId,
    intro: CONSENT_INTRO,
    clauses: CONSENT_CLAUSES,
    checkboxLabel: CONSENT_CHECKBOX_LABEL,
    acceptCta: CONSENT_ACCEPT_CTA,
    fullText: CONSENT_FULL_TEXT,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Sign in before accepting the terms.' },
      { status: 401 },
    )
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null

  try {
    const row = await recordConsent({ userId, ip })
    return NextResponse.json({ success: true, version: row.consentVersion })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not record consent'
    console.error('[api/consent] error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
