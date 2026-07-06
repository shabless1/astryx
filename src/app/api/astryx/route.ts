/**
 * ASTRYX — Astryx Intelligence · POST /api/astryx  (Directive L.3 + L.7)
 * ════════════════════════════════════════════════════════════════════════════
 * The full-canon brain. Server-only orchestration:
 *   1. Crisis gate FIRST (no model call on match).
 *   2. Retrieve top-K canon chunks (lib/astryx/canon).
 *   3. Assemble grounding = persona/operating-contract (buildAstryxSystem)
 *      + the user's DERIVED reading summary + the cited canon passages + tier rules.
 *   4. Model call via the swappable adapter (Gemini default).
 *   5. Output guard (banned-phrase lint → regenerate once → safe fallback).
 *   6. Attach the micro-disclaimer + source attributions.
 *
 * ── SOVEREIGNTY CONTRACT (L.7 — hard) ──
 * MAY leave to the model: the question · retrieved canon passages (SHA's own
 *   distilled, lineage-cited knowledge) · a MINIMAL reading summary (signs, states,
 *   current protocol LABELS only).
 * MUST NEVER leave: the engine's selection logic/source · full birth time + birth
 *   location (only derived signs/placements are summarized) · account, email,
 *   payment, XRP/wallet data · any other user's data.
 * The LLM affects ONLY this chat; it never recomputes the deterministic reading.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  detectCrisis, CRISIS_RESOURCES_CARD, MICRO_DISCLAIMER, lintForBannedPhrases,
  lintClinicalClaims,
} from '@/lib/compliance'
import { retrieve } from '@/lib/astryx/canon'
import { buildAstryxSystem } from '@/lib/astryx/persona'
import { getAstryxModel, modelConfigured } from '@/lib/astryx/modelAdapter'
import { buildTransitContext } from '@/lib/astryx/transitContext'
import { fetchWebContext, ASTRYX_WEB_ENABLED } from '@/lib/astryx/webSources'
import { deriveAstryxActions } from '@/lib/astryx/actions'
import { enforceRateLimit } from '@/lib/rateLimit'
import { sessionHasConsent } from '@/lib/consent'

export const runtime = 'nodejs'

const INDIVIDUAL_DAILY_LIMIT = 20
const MAX_MESSAGE_CHARS = 2000
const RETRIEVE_K = 5   // leaner grounding → fewer tokens/request (free-tier-friendly)

// FIX 3 — short-window burst cap (anti-scrape) layered over the daily allowance.
const CHAT_BURST_LIMIT = 15
const CHAT_BURST_WINDOW_SEC = 60
// In-memory daily counters (backstop, resets on cold start — same as /api/teach).
const dailyCounts = new Map<string, number>()
const dayKey = () => new Date().toISOString().slice(0, 10)
function identityFor(req: NextRequest, userId: string | null): string {
  if (userId) return `user:${userId}`
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'anon'
  return `ip:${ip}`
}

// Teacher-scoped lint — the base linter bans the NOUN "prescription(s)", which is
// core Astryx vocabulary (the report has a "Prescriptions" section). Strip only the
// noun before linting; the VERB "prescribe" + all clinical phrases stay banned.
//
// Directive S spot-check fix — the base lint also fired on a banned VERB used in a
// NEGATED / disclaimer sense ("does not treat", "isn't a cure", "rather than
// treating", "we can't diagnose"). Those are compliance-POSITIVE, but the guard
// nuked the whole answer and fell back to the canned reply (test fails C12 + F21).
// Strip a negation→banned-verb window before linting so honest disclaimers pass;
// any UN-negated clinical claim ("this treats arthritis") still trips the guard.
const NEGATED_BANNED =
  /\b(?:not|never|no|cannot|can'?t|do(?:es)?\s+not|don'?t|won'?t|would\s+not|wouldn'?t|without|rather\s+than|instead\s+of|isn'?t|aren'?t|is\s+not|are\s+not|nor)\s+(?:\w+\s+){0,4}?(?:treat(?:s|ing|ment|ments)?|cure[sd]?|curing|diagnos(?:e|es|ing|is)|prescrib(?:e|es|ing))\b/gi
// Safe DISCLAIMER noun-phrases — "medical treatment/advice/care", "a substitute /
// replacement / complement / alternative for|to … treatment", "not medical advice".
// These are compliance-POSITIVE (Astryx deferring to real care) and must not trip
// the guard (test F21 fell back because the model wrote "medical treatment").
const SAFE_CLINICAL_PHRASES =
  /\b(?:medical|professional|conventional|clinical|qualified|licensed)\s+(?:treatment|treatments|advice|care)\b|\b(?:replacement|substitute|complement|alternative)\s+(?:for|to)\s+(?:\w+\s+){0,4}?(?:treatment|treatments|medical care)\b/gi
// A1.5 — a POSITIVE treatment/heal/cure CLAIM on the chat surface: a product /
// fork / frequency / Astryx / "this" acting on a body-object, WITHOUT negation
// (negated + disclaimer uses are stripped first, so a survivor here is a real
// claim like "this fork treats your sciatica" / "it heals the joint"). Base lint
// doesn't even catch "treats"/"heals", so this detector is what enforces it.
const POSITIVE_TREATMENT_CLAIM =
  /\b(?:this|that|it|the|these|those|a|your|my|his|her|astryx|forks?|frequency|frequencies|tone|tones|calibration|session|remedy|remedies)\b[^.?!\n]{0,40}?\b(?:treats?|treating|heals?|healing|cures?|curing)\b\s+(?:your|the|my|his|her|this|that|a|an|it|any)\b/i
function teacherLint(text: string): string[] {
  if (!text) return []
  const stripped = text
    .replace(/\bprescriptions?\b/gi, '')
    .replace(NEGATED_BANNED, ' ')
    .replace(SAFE_CLINICAL_PHRASES, ' ')
  // CHAT SURFACE: allow the bare verb/noun "treat"/"treatment" once negated +
  // disclaimer uses are stripped — in conversation it's overwhelmingly a safe
  // deferral ("not a substitute for treatment"), and a canned fallback over it is
  // LESS helpful without being more compliant (tests C12/F21). Every dangerous ban
  // stays (cure, diagnose, prescribe, guarantee, "you have", "this causes"); the
  // strict lint still governs reports / PDFs / data.
  const hits = lintForBannedPhrases(stripped).filter((h) => !/^treat(s|ing|ment|ments)?$/i.test(h))
  // But STILL flag a positive treatment/heal/cure claim → regenerate / rewrite.
  if (POSITIVE_TREATMENT_CLAIM.test(stripped)) hits.push('treatment-claim')
  return hits
}

const SAFE_FALLBACK =
  "Let me keep this to what your chart actually shows. I can explain why a particular tone, herb, color, crystal, or transit appears in your calibration, or teach you a term like your Ascendant or what the Planet-is-not-the-Remedy idea means. For anything about a symptom or a health decision, that belongs with your licensed practitioner. What would you like me to open up?"

// ── SOVEREIGNTY: build the MINIMAL derived reading summary that may leave. ──
// Derived signs/states/protocol LABELS only — never birth time/location/account.
function buildReadingSummary(report: any, intention?: string[]): string {
  if (!report) return 'No reading is loaded yet — answer generally and invite them to generate their calibration.'
  const L: string[] = []
  // N.2 — the user's STATED INTENTION drives a guaranteed fork (intentionMap).
  // Astryx must know it so she attributes that fork to the intention, not just
  // chart dynamics (e.g. "Jupiter is here because you chose Abundance").
  const chips = (intention ?? []).filter(Boolean)
  if (chips.length || report.intentionPlanet) {
    const planet = report.intentionPlanet ? ` → its fork is ${report.intentionPlanet}` : ''
    L.push(`Stated intention: ${chips.length ? chips.join(', ') : '(open text)'}${planet}. This intention is WHY that fork is guaranteed in the sequence — attribute it to the intention, alongside any chart dynamic.`)
  }
  const sh = report.signalHierarchy
  if (sh?.primary) L.push(`Primary signal: ${sh.primary.planet} (${sh.primary.state})`)
  if (sh?.secondary) L.push(`Secondary signal: ${sh.secondary.planet} (${sh.secondary.state})`)
  if (sh?.tertiary) L.push(`Tertiary / aggravator: ${sh.tertiary.planet} (${sh.tertiary.state})`)
  const dp = report.dominantPolarity
  if (dp) L.push(`Dominant polarity: ${dp.planet} — ${dp.dominant_state}; corrective direction: ${(dp.protocol?.corrective_direction ?? []).slice(0, 3).join(', ') || 'stabilize'}`)
  if (report.environment?.element) L.push(`Session element: ${report.environment.element}`)
  // Directive S — the body-zone signals + LOCAL/REFLEX/planet placements, so
  // Astryx can explain planet-vs-sign, the reflex, and BOTH placements for THIS
  // user ("your knees mirror to the stomach and head"). Derived zones only.
  if (Array.isArray(report.reflexPlacements) && report.reflexPlacements.length) {
    for (const r of report.reflexPlacements.slice(0, 3)) {
      L.push(`Body signal: ${(r.localZones ?? []).slice(0, 2).join('/') || r.localSign} — action ${r.actionPlanet} (${r.state}) in ${r.localSign}; reflex mirrors to ${r.oppositeSign} + squares ${(r.squareSigns ?? []).join('/')}; co-governs ${r.coGovernedSystem || 'its polarity axis'}. LOCAL comfort fork at the zone, PLANETARY/REFLEX root fork at ${r.actionPlanet}'s anatomy + the reflex zones.`)
    }
  }
  const sl = report.sacredLayer
  if (sl?.botanical?.name) L.push(`Botanical ally: ${sl.botanical.name}`)
  if (sl?.crystal?.name) L.push(`Featured crystal: ${sl.crystal.name}`)
  if (sl?.dominantFork?.planet) L.push(`Dominant fork: ${sl.dominantFork.planet}`)
  const d = report.diagnostic
  if (d?.sunSign) L.push(`Sun sign: ${d.sunSign}`)
  if (d?.risingSign) L.push(`Rising sign: ${d.risingSign}`)
  if (d?.headlineTransit) L.push(`Headline transit: ${d.headlineTransit.transitingPlanet} ${d.headlineTransit.aspect} natal ${d.headlineTransit.natalPlanet}`)
  if (Array.isArray(report.prescriptions) && report.prescriptions.length) {
    L.push(`Prescription signatures: ${report.prescriptions.map((p: any) => p.planet || p.title).filter(Boolean).slice(0, 4).join(', ')}`)
  }
  return L.length ? L.join('\n') : 'A reading exists but carries no named signals; answer from the canon and invite a fresh calibration.'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const message = (body?.message ?? '').trim()
    const report = body?.report ?? null
    // Directive P — the user's natal chart (positions/angles) so the route can
    // compute TODAY'S live sky server-side. Stays server-side: only the DERIVED
    // sky block reaches the model; ascendant/houses/birth data never do (L.7).
    const chart = body?.chart ?? null
    const intention: string[] = Array.isArray(body?.intention) ? body.intention : []
    const history: { role: 'user' | 'model'; text: string }[] = Array.isArray(body?.history) ? body.history : []

    if (!message) return NextResponse.json({ error: 'Empty message.' }, { status: 400 })
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ error: `Message too long (max ${MAX_MESSAGE_CHARS}).` }, { status: 400 })
    }

    // 1. Crisis gate — trumps everything, NO model call.
    if (detectCrisis(message).isCrisis) {
      return NextResponse.json({ crisis: true, reply: CRISIS_RESOURCES_CARD, disclaimer: MICRO_DISCLAIMER })
    }

    // If the model isn't configured, tell the client to use its local brain.
    if (!modelConfigured()) {
      return NextResponse.json({ fallback: true, reason: 'model-unconfigured' })
    }

    // Tier + metering.
    const session = await getSession()
    const userId = session?.user?.id ?? null
    const isPremium = session?.user?.isPremium ?? false
    const tier: 'individual' | 'practitioner' = isPremium ? 'practitioner' : 'individual'

    // LEGAL SHIELD v1 · FIX 1 — an authenticated user who has not accepted the
    // current consent version cannot receive chat output. Anonymous callers are
    // not gated here (they still see the AI disclosure + disclaimers).
    if (!(await sessionHasConsent(session))) {
      return NextResponse.json({
        consentRequired: true, code: 'consent_required',
        reply: 'Please review and accept the Terms & Consent to continue.',
        disclaimer: MICRO_DISCLAIMER, tier,
      }, { status: 403 })
    }

    const metered = tier === 'individual'
    const identity = identityFor(req, userId)
    // FIX 3 — short-window BURST cap (anti-scrape) on top of the daily allowance.
    const burst = enforceRateLimit('astryx', identity, CHAT_BURST_LIMIT, CHAT_BURST_WINDOW_SEC)
    if (!burst.ok) {
      return NextResponse.json({
        limited: true,
        reply: 'You are sending messages very quickly — give it a few seconds and try again.',
        disclaimer: MICRO_DISCLAIMER, tier, remaining: burst.remaining,
      }, { status: 429, headers: { 'Retry-After': String(burst.retryAfterSec) } })
    }
    const key = `${identity}:${dayKey()}`
    let used = dailyCounts.get(key) ?? 0
    if (metered && used >= INDIVIDUAL_DAILY_LIMIT) {
      return NextResponse.json({
        limited: true,
        reply: `You've reached today's free allowance of ${INDIVIDUAL_DAILY_LIMIT} Astryx questions. Your calibration, prescriptions, and a new session are still fully available — and your allowance refreshes tomorrow. Practitioner access removes the daily limit.`,
        disclaimer: MICRO_DISCLAIMER, tier, remaining: 0,
      })
    }

    // 2. Retrieve canon (over the message + recent history for continuity).
    const retrievalQuery = [history.slice(-2).map((h) => h.text).join(' '), message].join(' ').trim()
    const chunks = retrieve(retrievalQuery, RETRIEVE_K)

    // 3. Assemble grounding (sovereign — derived summary + cited canon only).
    const readingSummary = buildReadingSummary(report, intention)
    const canonBlock = chunks.length
      ? chunks.map((c, i) => `[${i + 1}] (${c.topic} — source: ${c.source})\n${c.text}`).join('\n\n')
      : '(no canon passage matched — answer from your established astrological knowledge, fenced as general context, or invite a more specific question.)'

    // Directive P — TODAY'S LIVE SKY, computed server-side from the natal chart.
    // The personal signal lets the daily-element note reconcile sky vs reading.
    const primarySignal = report?.signalHierarchy?.primary
    const transit = buildTransitContext(
      chart, new Date(),
      primarySignal ? { planet: primarySignal.planet, state: primarySignal.state } : undefined,
    )

    // Directive Q (B.4) — Tier-3 curated web (allowlist only; OFF until the flag +
    // a real extractor land). The seam is wired so flipping ASTRYX_WEB_ENABLED is
    // the only change needed; while OFF this returns [] and grounding is unchanged.
    let webBlock = ''
    if (ASTRYX_WEB_ENABLED) {
      try {
        const snippets = await fetchWebContext(retrievalQuery, 3)
        if (snippets.length) {
          webBlock = [
            'TIER 3 — LIVE WEB (allowlisted sources; fenced, never diagnostic; cite only if asked):',
            snippets.map((s) => `• ${s.text} (${s.source})`).join('\n'),
            '',
          ].join('\n')
        }
      } catch (e) {
        console.warn('[astryx] web context fetch failed (continuing without):', e)
      }
    }

    const context = [
      "THIS USER'S READING (derived facts — explain from these; never recompute the reading):",
      readingSummary,
      '',
      transit.groundingBlock,
      '',
      webBlock,
      'CANON PASSAGES (Tier-1 authority for Astryx PROPRIETARY specifics — fork Hz, the Lotus Spectrum, the five-sense protocol logic, cell-salt/botanical/crystal mappings. Synthesize in YOUR OWN WORDS, never paste raw):',
      canonBlock,
      '',
      history.length ? `RECENT CONVERSATION:\n${history.slice(-6).map((h) => `${h.role === 'user' ? 'User' : 'Astryx'}: ${h.text}`).join('\n')}` : '',
      `USER TIER: ${tier}${tier === 'individual' ? ' (plain language; route clinical questions to their practitioner)' : ' (clinical terminology + classical citations permitted)'}.`,
    ].join('\n')

    // 4. Model call (swappable adapter). On any failure → client local fallback.
    const model = getAstryxModel()
    const system = buildAstryxSystem()
    let reply: string | undefined
    let flagged = false
    // Two attempts — the free model tier can return a transient 429/503 under
    // bursty load; a brief backoff + one retry recovers most blips before we fall
    // back to the local brain.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        reply = await model.complete({ system, context, message })
        break
      } catch (e) {
        if (attempt === 1) {
          console.error('[astryx] model error (after retry):', e)
          return NextResponse.json({ fallback: true, reason: 'model-error' })
        }
        await new Promise((r) => setTimeout(r, 700))
      }
    }
    if (reply === undefined) return NextResponse.json({ fallback: true, reason: 'model-error' })

    // 5. Output guard — regenerate once stricter, else safe fallback.
    // LEGAL SHIELD v1 · FIX 3 — for the FREE (individual) tier the guard also
    // catches disease-naming + explicit dosing that could be surfaced from the
    // canon's practitioner clinical layer. Practitioner tier keeps clinical
    // terminology, so lintClinicalClaims is applied only when tier==='individual'.
    const guardHits = (text: string): string[] => [
      ...teacherLint(text),
      ...(tier === 'individual' ? lintClinicalClaims(text) : []),
    ]
    if (guardHits(reply).length > 0) {
      flagged = true
      const hits = guardHits(reply)
      const stricter = `${system}\n\nOUTPUT GUARD: your previous draft used disallowed phrasing (${hits.join(', ')}). Rewrite with the SAME meaning but strictly probabilistic, non-clinical framing. Do not name diseases/medical conditions or give supplement doses. Never use "you have", "treats", "cures", "diagnose", "will", "guaranteed", "permanently", or the verb "prescribe". Use "may suggest", "may support", "is classically associated with".`
      try { reply = await model.complete({ system: stricter, context, message }) } catch { /* keep first */ }
    }
    if (!reply || guardHits(reply).length > 0) {
      reply = SAFE_FALLBACK
      flagged = true
    }

    if (metered) { used += 1; dailyCounts.set(key, used) }

    // 6. Source attributions (deduped) + disclaimer.
    const sources = Array.from(new Set(chunks.map((c) => c.source))).slice(0, 4)
    // v4.4 Fix 2 — the ACTION ENVELOPE: deterministic, server-derived from
    // keyword intent + the engine's already-computed daily state. The LLM
    // never generates or configures actions; its text just refers to them.
    const actions = deriveAstryxActions(message, report)
    return NextResponse.json({
      reply,
      sources,
      actions,
      disclaimer: MICRO_DISCLAIMER,
      tier,
      remaining: metered ? Math.max(0, INDIVIDUAL_DAILY_LIMIT - used) : null,
      flagged,
      provider: model.provider,
    })
  } catch (err: any) {
    console.error('[astryx] route error:', err)
    // Graceful: tell the client to fall back to its local sovereign brain.
    return NextResponse.json({ fallback: true, reason: 'route-error' }, { status: 200 })
  }
}
