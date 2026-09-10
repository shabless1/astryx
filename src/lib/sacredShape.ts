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
 * TIER SEAM — today `practitioner` is derived from the request's intake.mode,
 * which is a self-attested Settings toggle (bypassable by design until the
 * real Practitioner entitlement lands in Phase 2). This is the exact plug
 * point: when that entitlement exists, derive the tier from it HERE and
 * nowhere else. Until then, basic is the default for every Individual reading.
 */

import type { ProtocolOutput } from '@/types'

export type SacredTier = 'basic' | 'practitioner'
type FullSacred = NonNullable<ProtocolOutput['sacredLayer']>

/** Copy only the listed keys (skips undefined so the JSON stays lean). */
function pick<T extends object>(src: T | null | undefined, keys: readonly (keyof T)[]): Partial<T> | null {
  if (!src) return null
  const out: Partial<T> = {}
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
 * Derive the sacred-layer tier for a request. Server-side only.
 * TODAY: practitioner mode (self-attested) + an authenticated session.
 * PHASE 2: replace the body with a real Practitioner entitlement check.
 */
export function sacredTierFor(mode: string | undefined, authenticated: boolean): SacredTier {
  return mode === 'practitioner' && authenticated ? 'practitioner' : 'basic'
}
