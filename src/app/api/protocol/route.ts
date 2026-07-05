/**
 * ASTRYX — Protocol engine API (Security Directive v1.1 · FIX 1A)
 * ════════════════════════════════════════════════════════════════════════
 * The deterministic protocol engine (`runEngine`) and the proprietary data
 * corpus now execute ONLY here, on the server. The client sends inputs (intake
 * + resolved birth coords) and receives the COMPUTED output only — the model
 * and its data never enter the browser bundle.
 *
 * Determinism is unchanged: this route is a thin transport around the exact same
 * `runEngine`. Same inputs → byte-identical protocol (golden suite locks it).
 *
 * TODO(FIX 3): add per-user/IP rate-limiting + entitlement checks here — because
 * a deterministic engine behind an open endpoint is an input→output oracle. FIX
 * 1A relocates the code/data off the client; FIX 3 raises the cost of scraping.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { runEngine } from '@/lib/engine'
import { enforceRateLimit, clientIdentity } from '@/lib/rateLimit'
import type { IntakeData } from '@/types'

interface ProtocolRequestBody {
  intake?: IntakeData
  coords?: { lat: number; lon: number; tzOffset?: number }
}

// FIX 3 — burst caps per caller. Generous for humans (a reading is occasional),
// tight enough to make scripted input→output scraping slow + visible.
const PROTOCOL_LIMIT = 20
const PROTOCOL_WINDOW_SEC = 300 // 5 minutes

export async function POST(req: NextRequest) {
  try {
    // FIX 3 — server-enforced rate limit on the engine oracle (per user, else IP).
    const session = await getSession()
    const id = clientIdentity(req, session?.user?.id ?? null)
    const rl = enforceRateLimit('protocol', id, PROTOCOL_LIMIT, PROTOCOL_WINDOW_SEC)
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many calibrations in a short window — please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      )
    }

    const body = (await req.json()) as ProtocolRequestBody
    const intake = body?.intake
    const coords = body?.coords

    if (!intake || typeof intake !== 'object') {
      return NextResponse.json({ success: false, error: 'Missing intake data' }, { status: 400 })
    }

    const protocol = await runEngine(intake, coords)
    if (!protocol) {
      return NextResponse.json({ success: false, error: 'Engine returned no protocol' }, { status: 502 })
    }

    return NextResponse.json({ success: true, protocol })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Engine error'
    console.error('[api/protocol] error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
