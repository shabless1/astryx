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
