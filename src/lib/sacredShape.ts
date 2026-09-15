/**
 * ASTRYX — Sacred-layer response shaping (IP containment)
 * Positioning Roadmap Phase 1.6 · Security FIX 1 made concrete · 2026-09-09
 * ════════════════════════════════════════════════════════════════════════
 * runEngine() resolves the FULL sacred records — the botanical, the crystal,
 * the ENTIRE Lotus Spectrum, the fork spec sheet, the starter kits — because
 * the server needs them. The client never did:
 *   • no screen reads `lotusSpectrum` or `starterKit` at all;
 *   • the Individual surfaces read only names / placement / tea / safety;
 *   • the mechanism / endocrine / nervous-system / clinical fields are printed
 *     ONLY by the practitioner screen and the practitioner PDF.
 * Shipping whole records to every browser was an enumerable corpus leak
 * (~10 authenticated requests dumped the sacred layer). This module returns
 * the DISPLAY SUBSET, by tier, at the /api/protocol door.
 *
 * Rule: sell the output, never the dataset. Server-only.
 *
 * TIER SEAM — CLOSED 2026-09-10 (P0). `practitioner` now comes from
 * `Entitlement.tier`, resolved server-side and stamped on the JWT. It is no
 * longer derived from the request's `intake.mode`, which was a client-supplied
 * string and therefore not a gate at all. Basic remains the default.
 */

import type { ProtocolOutput } from '@/types'

export type SacredTier = 'basic' | 'practitioner'
type FullSacred = NonNullable<ProtocolOutput['sacredLayer']>

/** Copy only the listed keys (skips undefined so the JSON stays lean). */
function pick<T extends object>(src: T | null | undefined, keys: readonly (keyof T)[]): Partial<T> | null
function pick(src: Record<string, unknown> | null | undefined, keys: readonly string[]): Record<string, unknown> | null
function pick(src: any, keys: readonly any[]): any {
  if (!src) return null
  const out: Record<string, unknown> = {}
  for (const k of keys) {
    const v = src[k]
    if (v !== undefined) out[k] = v
  }
  return out
}

// ── Botanical ──────────────────────────────────────────────────────────────
// basic: what SessionScreen (tea step) renders. practitioner: + what the
// PractitionerScreen card and the practitioner PDF print.
const BOTANICAL_BASIC = [
  'planet', 'sacredBotanical', 'latinName', 'color',
  'teaProfile', 'bodyPlacement', 'wellnessBenefits', 'safetyNote',
] as const
const BOTANICAL_PRACTITIONER = [
  ...BOTANICAL_BASIC,
  'biologicalSystem', 'biologicalMechanism', 'endocrineTarget', 'nervousSystem', 'brainwaveAffinity',
] as const
// Never shipped at any tier: esotericSignature, colorVibration, tier, teaSafe,
// traditionalUse, kitProduct, kitEligible.

// ── Crystal ────────────────────────────────────────────────────────────────
const CRYSTAL_DATA_BASIC = ['name', 'bodyPlacement', 'placementNote', 'safetyNote'] as const
const CRYSTAL_DATA_PRACTITIONER = [
  ...CRYSTAL_DATA_BASIC,
  'mineralComposition', 'biologicalMechanism', 'biologicalSystem', 'endocrineTarget', 'nervousSystem',
] as const
// Never shipped: existingGems, metal, kitEligible.

// ── Dominant fork ──────────────────────────────────────────────────────────
// NOTE: the chamber composes sessions client-side from forkRite's own copy of
// the fork data, so this shaping contains the API copy only; the fork spec
// sheet itself is contained by the Worker port (Phase 1.2).
const FORK_BASIC = ['planet', 'chakra', 'hz', 'solfeggioFallback', 'note', 'color', 'boneApplicationPoint'] as const
const FORK_PRACTITIONER = [
  ...FORK_BASIC,
  'nervePlexus', 'vagusConnection', 'vagusStrength', 'brainwaveAffinity', 'brainwaveState', 'ANSEffect', 'clinicalNote',
] as const

/**
 * The client-safe sacred layer for a given tier. lotusSpectrum and starterKit
 * are NEVER returned — nothing client-side reads them, and the Lotus Spectrum
 * is flagship proprietary IP (CLAUDE.md Rule 5). Server-side consumers that
 * need the lotus data (the teacher grounding) read it from the data file
 * directly, never from the client's copy of the report.
 */
export function shapeSacredLayerForClient(
  sl: FullSacred | null | undefined,
  tier: SacredTier,
): Record<string, unknown> | null {
  if (!sl) return null
  const pro = tier === 'practitioner'

  const botanical = pick(sl.botanical, (pro ? BOTANICAL_PRACTITIONER : BOTANICAL_BASIC) as readonly (keyof NonNullable<FullSacred['botanical']>)[])

  const crystal = sl.crystal
    ? {
        planet:          sl.crystal.planet,
        featuredCrystal: sl.crystal.featuredCrystal,
        hex:             sl.crystal.hex,
        featuredCrystalData: pick(
          sl.crystal.featuredCrystalData,
          (pro ? CRYSTAL_DATA_PRACTITIONER : CRYSTAL_DATA_BASIC) as readonly (keyof NonNullable<FullSacred['crystal']>['featuredCrystalData'])[],
        ),
      }
    : null

  const dominantFork = pick(sl.dominantFork, (pro ? FORK_PRACTITIONER : FORK_BASIC) as readonly (keyof NonNullable<FullSacred['dominantFork']>)[])

  return {
    botanical,
    crystal,
    dominantFork,
    // Deliberately absent: lotusSpectrum, starterKit.
    tier,
  }
}

/**
 * The SECOND door — `protocol.prescriptions[]`.
 *
 * Found live 2026-09-10 while verifying the P0 tier gate: shaping `sacredLayer`
 * alone contained nothing, because every prescription carries its OWN copy of
 * the same botanical, crystal and fork records — unshaped. An unauthenticated
 * POST to /api/protocol returned `nervePlexus`, `clinicalNote`, `ANSEffect`,
 * `biologicalMechanism`, `endocrineTarget`, and even `esotericSignature` and
 * `traditionalUse`, which are documented above as shipping at NO tier.
 *
 * Same field lists, same tier, one door each. Any future path that carries a
 * sacred record must come through here too — the whole-payload test in
 * tests/practitionerTier.test.ts fails the build if a third copy appears.
 */
export function shapePrescriptionsForClient(
  prescriptions: unknown,
  tier: SacredTier,
): unknown {
  if (!Array.isArray(prescriptions)) return prescriptions
  const pro = tier === 'practitioner'

  return prescriptions.map((rx) => {
    if (!rx || typeof rx !== 'object') return rx
    const r = rx as Record<string, unknown>
    const out: Record<string, unknown> = { ...r }

    if (r.botanical) {
      out.botanical = pick(
        r.botanical as Record<string, unknown>,
        (pro ? BOTANICAL_PRACTITIONER : BOTANICAL_BASIC) as readonly string[],
      )
    }
    if (r.crystal) {
      const c = r.crystal as Record<string, unknown>
      out.crystal = {
        planet: c.planet,
        featuredCrystal: c.featuredCrystal,
        hex: c.hex,
        featuredCrystalData: pick(
          c.featuredCrystalData as Record<string, unknown>,
          (pro ? CRYSTAL_DATA_PRACTITIONER : CRYSTAL_DATA_BASIC) as readonly string[],
        ),
      }
    }
    if (r.fork) {
      out.fork = pick(
        r.fork as Record<string, unknown>,
        (pro ? FORK_PRACTITIONER : FORK_BASIC) as readonly string[],
      )
    }
    return out
  })
}

/**
 * Derive the sacred-layer tier for a request. SERVER-SIDE ONLY.
 *
 * P0, 2026-09-10 — this used to branch on `intake.mode`, a string the CLIENT
 * puts in the request body. Anyone who could send a request could ask for the
 * practitioner sacred layer and get it. It now reads the tier NextAuth stamped
 * on the JWT from `Entitlement.tier`, which only the Shopify webhook writes.
 *
 * Pass `session.user.tier`. Never pass anything that came from a request body.
 */
export function sacredTierFor(serverTier: string | undefined, authenticated: boolean): SacredTier {
  return authenticated && serverTier === 'practitioner' ? 'practitioner' : 'basic'
}

// ════════════════════════════════════════════════════════════════════════════
// THE THIRD DOOR — everything that is NOT sacredLayer or prescriptions
// ════════════════════════════════════════════════════════════════════════════
//
// Found 2026-09-13 while building the Worker's tiered shaping. The route
// returns `{ ...protocol, sacredLayer: shaped, prescriptions: shaped }`, so the
// two doors above are closed and every other field of the protocol has always
// gone out raw. To any signed-in caller that meant:
//
//   · `polarityResults[].protocol` — the whole remedyPolarity corrective row.
//     PHASE1_WORKER_PORT_SCOPE §7 ranks that file crown jewel #1: "dumping it
//     reproduces the intelligence layer."
//   · `scores` — the per-state weights, i.e. the ranking model in numbers.
//   · `activePlanets[]` raw weights — the tri-source ranking model.
//   · `symptomRouting[].matched*` — literal medicalAstrology lookup keys.
//
// WHAT THIS FIXES, AND WHAT IT HONESTLY DOES NOT.
//
// The scores, the weights and the routing keys are gone outright: nothing
// client-side reads any of them, so they were pure exposure and they now stop
// at the server.
//
// The corrective row is a harder problem, and it is worth being exact about it
// rather than claiming a win. The app's own client is a RENDERER of that row —
// ResultsScreen prints the direction, the regulator, the herbs, the scents, the
// palette and the avoid-list; ChamberDNAEngine reads the breath and the palette;
// ScaleEngine reads the scale override; forkRite composes the session from the
// regulators. Those fields cannot be withheld from a client that exists to
// display them. What CAN be done, and is done below, is to send exactly what
// the screens render — including their slice lengths, since every one of them
// already truncates — plus drop the two fields nothing reads at all. The UI is
// byte-identical; the payload loses the tail of every list.
//
// That is a reduction, not a closure. The real fix is architectural and it is
// already on the roadmap: when the app consumes the Worker (Phase 1.2 step 12)
// the composition happens server-side and the row stops travelling at all.
// This function is the interim, and the comment is here so nobody later
// mistakes it for the end of the job.

/**
 * How much of each list the screens actually show. `null` = ship it whole,
 * because something genuinely iterates all of it.
 *
 * The numbers are not taste — they are read off the call sites:
 * ResultsScreen slices corrective_direction to 3, avoid to 4, herbs to 4,
 * scents to 3, color_palette to 3. `regulator_planets` stays whole because
 * forkRite filters the full list when it picks a counterweight.
 */
const PROTOCOL_DISPLAY_CAPS: Record<string, number | null> = {
  regulator_planets:    null,
  corrective_direction: 3,
  avoid:                4,
  herbs:                4,
  scents:               3,
  color_palette:        3,
  sound_character:      null,
  support_style:        null,
  breath:               null,
  scale_override:       null,
}
// Absent from the map, therefore never shipped: `indicators` and
// `visual_motion`. Nothing client-side reads either.

function shapeCorrectiveProtocol(p: unknown): Record<string, unknown> | null {
  if (!p || typeof p !== 'object') return null
  const src = p as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [key, cap] of Object.entries(PROTOCOL_DISPLAY_CAPS)) {
    const v = src[key]
    if (v === undefined) continue
    out[key] = cap !== null && Array.isArray(v) ? v.slice(0, cap) : v
  }
  return out
}

/**
 * The per-planet polarity results.
 *
 * `scores` never ships — four numbers per planet is the ranking model, and no
 * screen has ever read them. The numeric `confidence` goes too: the band is
 * what the UI prints, and the one place that shows the raw number reads it off
 * `dominantPolarity`, which keeps it below.
 */
export function shapePolarityResultsForClient(results: unknown): unknown {
  if (!Array.isArray(results)) return results
  return results.map((r) => {
    if (!r || typeof r !== 'object') return r
    const src = r as Record<string, unknown>
    return {
      planet:          src.planet,
      dominant_state:  src.dominant_state,
      secondary_state: src.secondary_state,
      confidence_band: src.confidence_band,
      overridden:      src.overridden,
      symptomDriven:   src.symptomDriven,
      resourced:       src.resourced,
      reasoning:       src.reasoning,
      protocol:        shapeCorrectiveProtocol(src.protocol),
    }
  })
}

/**
 * The dominant planet's result. Same shaping, and it keeps the numeric
 * `confidence` because the practitioner DNA panel prints it.
 */
export function shapeDominantPolarityForClient(p: unknown): unknown {
  if (!p || typeof p !== 'object') return p
  const src = p as Record<string, unknown>
  const [shaped] = shapePolarityResultsForClient([src]) as Record<string, unknown>[]
  return { ...shaped, confidence: src.confidence }
}

/**
 * The tri-source ranked planets.
 *
 * Nothing client-side reads this array at all, let alone its four score
 * columns — so what ships is the readable part and the model stays home.
 */
export function shapeActivePlanetsForClient(list: unknown): unknown {
  if (!Array.isArray(list)) return list
  return list.map((a) => {
    if (!a || typeof a !== 'object') return a
    const src = a as Record<string, unknown>
    return {
      planet:              src.planet,
      urgency:             src.urgency,
      transitDescription:  src.transitDescription,
      calibrationWindow:   src.calibrationWindow,
    }
  })
}

/** The cell-salt display projection the symptom cards render. */
function shapeRoutedSalt(s: unknown): Record<string, unknown> | null {
  if (!s || typeof s !== 'object') return null
  const src = s as Record<string, unknown>
  return pick(src, [
    'saltName', 'saltShort', 'epithet', 'plainLanguageSignal',
    'displaySignal', 'matchReason', 'matchScore', 'looseMatch',
  ])
}

/**
 * The diagnostic layer.
 *
 * Only `symptomRouting` needed changing: its `matchedRootCauseKey`,
 * `matchedSignature` and `matchedSubtype` are the medicalAstrology index's own
 * lookup keys — the shape of thing that turns a paid API into a copy of the
 * index — and no screen reads any of the three. The human-readable
 * `matchedSubtypeDescription` stays, because that is what a person is shown.
 */
export function shapeDiagnosticForClient(d: unknown): unknown {
  if (!d || typeof d !== 'object') return d
  const src = d as Record<string, unknown>
  if (!Array.isArray(src.symptomRouting)) return src
  return {
    ...src,
    symptomRouting: src.symptomRouting.map((s) => {
      if (!s || typeof s !== 'object') return s
      const r = s as Record<string, unknown>
      return {
        reportedSymptom:           r.reportedSymptom,
        primaryPlanet:             r.primaryPlanet,
        matchedSubtypeDescription: r.matchedSubtypeDescription,
        rootCause:                 r.rootCause,
        activationScore:           r.activationScore,
        evidence:                  r.evidence,
        recommendedCellSalt:       shapeRoutedSalt(r.recommendedCellSalt),
      }
    }),
  }
}
