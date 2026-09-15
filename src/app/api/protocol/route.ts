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
 * FIX 3 — per-user/IP rate-limiting + consent gate (below).
 *
 * 2026-09-09 (Positioning Roadmap Phase 1.6 / Security FIX 1 concrete):
 *   • RESPONSE SHAPING — the sacred layer is returned as a tiered DISPLAY
 *     SUBSET (see src/lib/sacredShape.ts). The full records (and the entire
 *     Lotus Spectrum + starter kits) were shipping to every browser and were
 *     enumerable in ~10 requests. Sell the output, never the dataset.
 *   • SOLAR CHART — `solarChart` is now threaded through to the engine, so a
 *     "birth time unknown" reading is computed on the Solar Chart the user was
 *     shown, not on a silent noon-default natal chart.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { runEngine } from '@/lib/engine'
import { enforceRateLimit, clientIdentity } from '@/lib/rateLimit'
import { sessionHasConsent } from '@/lib/consent'
import {
  shapeSacredLayerForClient,
  shapePrescriptionsForClient,
  shapePolarityResultsForClient,
  shapeDominantPolarityForClient,
  shapeActivePlanetsForClient,
  shapeDiagnosticForClient,
  sacredTierFor,
} from '@/lib/sacredShape'
import type { IntakeData, ProtocolOutput } from '@/types'

interface ProtocolRequestBody {
  intake?: IntakeData
  coords?: { lat: number; lon: number; tzOffset?: number }
  /** True when the user declared their birth time unknown (Solar Chart mode). */
  solarChart?: boolean
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

    // LEGAL SHIELD v1 · FIX 1 — server-side consent gate. An authenticated user
    // who has not accepted the current consent version cannot release a reading,
    // even if the client UI is bypassed. Anonymous callers are not gated here.
    if (!(await sessionHasConsent(session))) {
      return NextResponse.json(
        { success: false, error: 'Consent required before a reading can be generated.', code: 'consent_required' },
        { status: 403 },
      )
    }

    const body = (await req.json()) as ProtocolRequestBody
    const intake = body?.intake
    const coords = body?.coords

    if (!intake || typeof intake !== 'object') {
      return NextResponse.json({ success: false, error: 'Missing intake data' }, { status: 400 })
    }

    const protocol = await runEngine(intake, coords, { solarChart: body?.solarChart === true })
    if (!protocol) {
      return NextResponse.json({ success: false, error: 'Engine returned no protocol' }, { status: 502 })
    }

    // Shape the sacred layer to the caller's tier. The engine's own output
    // (and the golden suite that locks it) is untouched — only what leaves
    // the server changes. The shaped object is a subset of the declared type;
    // every client reader touches only fields present at its tier.
    // P0 — the TIER comes off the session, never off `intake.mode`. That field
    // is a display preference the client controls; it is not an entitlement.
    const sessionTier = (session?.user as { tier?: string } | undefined)?.tier
    const tier = sacredTierFor(sessionTier, !!session?.user)
    const clientProtocol: ProtocolOutput = {
      ...protocol,
      sacredLayer: shapeSacredLayerForClient(protocol.sacredLayer, tier) as unknown as ProtocolOutput['sacredLayer'],
      // The SECOND door. Every prescription carries its own copy of the same
      // botanical / crystal / fork records; shaping sacredLayer alone contained
      // nothing. Found live 2026-09-10 while verifying the P0 gate.
      prescriptions: shapePrescriptionsForClient(
        protocol.prescriptions, tier,
      ) as unknown as ProtocolOutput['prescriptions'],
      // The THIRD door, found 2026-09-13 while building the Worker's tiered
      // shaping. The spread above is the whole point: every field NOT named
      // here has always gone out raw. That included the remedyPolarity
      // corrective rows, the per-state score maps, the tri-source ranking
      // weights and the medicalAstrology routing keys.
      //
      // The scores, the weights and the routing keys stop here outright —
      // nothing client-side ever read them. The corrective row is trimmed to
      // exactly what the screens render, slice lengths included, because the
      // client is a renderer of that row and cannot be starved of it. That is a
      // reduction, not a closure; sacredShape.ts says so at length, and the
      // real fix is the app consuming the Worker.
      polarityResults: shapePolarityResultsForClient(
        protocol.polarityResults,
      ) as unknown as ProtocolOutput['polarityResults'],
      dominantPolarity: shapeDominantPolarityForClient(
        protocol.dominantPolarity,
      ) as unknown as ProtocolOutput['dominantPolarity'],
      activePlanets: shapeActivePlanetsForClient(
        protocol.activePlanets,
      ) as unknown as ProtocolOutput['activePlanets'],
      diagnostic: shapeDiagnosticForClient(
        protocol.diagnostic,
      ) as unknown as ProtocolOutput['diagnostic'],
    }

    return NextResponse.json({ success: true, protocol: clientProtocol })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Engine error'
    console.error('[api/protocol] error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
