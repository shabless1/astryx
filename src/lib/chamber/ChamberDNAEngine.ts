/**
 * ASTRYX Chamber DNA Engine
 *
 * The architectural keystone. Generates the immutable identity of a chamber
 * from chart + birth data + seed. Every downstream engine (visual, harmonic,
 * melody, breath, color) reads from this DNA — never from the chart directly.
 *
 * "Chart → DNA → Everything" — Sha's directive.
 *
 * The DNA is deterministic. Same birth data + same chart = same DNA.
 * Two consumers in the same session see the identical structure.
 *
 * User-facing language is the "physical laws of the room" model — astrology
 * terms are hidden behind environmental terms (Pressure / Flow / Dialogue).
 * Practitioner mode reveals the underlying chart.
 */

import type { ProtocolOutput, DominantPattern, PolarityResultLike, PolarityStateLike } from '@/types'
import {
  hashChamberSeed,
  createPRNG,
  formatChamberSignature,
  type ChamberSeedInput,
} from './chamberSeed'
import {
  geometryForAspect,
  type GeometryKind,
  type MotionKind,
} from '@/lib/protocol/aspectGeometryMap'
import type { KaleidoscopeMode } from '@/types'
import {
  paletteForPlanet,
  regulatorForPlanet,
  regulatorColorMap,
  type RegulatorRole,
} from '@/lib/protocol/planetColorMap'
import {
  elementVisualFor,
  modalityMotionFor,
  type Element,
  type Modality,
  type ElementVisual,
  type ModalityMotion,
} from '@/lib/protocol/elementModalityMaps'

// ─── DNA SHAPE ─────────────────────────────────────────────────────

export type AspectKey =
  | 'conjunction' | 'opposition' | 'square'
  | 'trine' | 'sextile' | 'quincunx'

/** Aspect ratios per Sha's polyrhythm spec (advanced engine, applied subtly). */
export interface PolyRhythmRatio {
  num: number
  den: number
}

const POLYRHYTHM_BY_ASPECT: Record<AspectKey, PolyRhythmRatio> = {
  conjunction: { num: 1, den: 1 },
  opposition:  { num: 2, den: 1 },
  trine:       { num: 3, den: 2 },
  square:      { num: 4, den: 3 },
  sextile:     { num: 6, den: 5 },
  quincunx:    { num: 5, den: 6 },
}

/**
 * User-facing chamber name (environmental, no astrology jargon).
 * Per Sha's accessibility directive.
 */
const CHAMBER_NAME_BY_ASPECT: Record<AspectKey, string> = {
  conjunction: 'Convergence',
  opposition:  'Dialogue',
  square:      'Pressure',
  trine:       'Flow',
  sextile:     'Connection',
  quincunx:    'Adjustment',
}

const CHAMBER_FEELING_BY_ASPECT: Record<AspectKey, string> = {
  conjunction: 'A chamber of focus, union, and centering.',
  opposition:  'A chamber of reflection, mirroring, and balance.',
  square:      'A chamber of pressure, adaptation, and transformation.',
  trine:       'A chamber of flow, ease, and expansion.',
  sextile:     'A chamber of opportunity, connection, and cooperation.',
  quincunx:    'A chamber of adjustment, asymmetry, and gradual correction.',
}

/**
 * Default breath pattern per element. Per Sha's safety directive: aggressive
 * patterns (breath of fire, full alternate-nostril) are NOT defaults.
 * Practitioner mode can unlock stronger patterns.
 */
type BreathPattern = 'box' | '4-7-8' | 'wave' | 'balanced' | 'gentle-activating'

interface BreathPlan {
  pattern: BreathPattern
  inhaleSec: number
  holdSec: number
  exhaleSec: number
  holdAfterSec?: number
  description: string
  intensity: number    // 0..1 — gates how much the visual/sound responds to breath
}

const BREATH_BY_ELEMENT: Record<Element, BreathPlan> = {
  fire:  { pattern: 'gentle-activating', inhaleSec: 4, holdSec: 2, exhaleSec: 4,           description: 'Steady activating breath — even in, brief hold, even out.', intensity: 0.7 },
  earth: { pattern: 'box',               inhaleSec: 4, holdSec: 4, exhaleSec: 4, holdAfterSec: 4, description: 'Box breathing — four equal counts.',                       intensity: 0.55 },
  air:   { pattern: 'balanced',          inhaleSec: 4, holdSec: 0, exhaleSec: 4,           description: 'Balanced rhythmic breath — equal in and out.',                  intensity: 0.6 },
  water: { pattern: '4-7-8',             inhaleSec: 4, holdSec: 7, exhaleSec: 8,           description: 'Extended exhale — 4 in, 7 hold, 8 out.',                         intensity: 0.5 },
}

// ─── DNA INTERFACES ────────────────────────────────────────────────

export interface VisualDNA {
  geometry: GeometryKind
  motionType: MotionKind
  kaleidoscope: KaleidoscopeMode
  primaryColor: string
  secondaryColor: string
  regulatorColor: string
  element: ElementVisual
  modality: ModalityMotion
  /** Base complexity scalar 0..1 — phase engine multiplies up/down */
  complexity: number
}

export interface HarmonicDNA {
  primaryHz: number
  secondaryHz: number
  earthOmHz: 136.10
  /** Aspect angle ratio (subtle polyrhythm voice relationship) */
  polyrhythm: PolyRhythmRatio
  /** Master pulse rate (aspect-derived Hz for tremolo / pulse layer) */
  pulseHz: number
  /** Behavior tag from music_behavior — used by ChordEngine in Deploy 2 */
  behaviorTag: string
  /** Solfeggio overlay choice for the chamber (role → Hz) */
  solfeggioRole: 'grounding' | 'corrective' | 'coherence' | 'release' | 'depth'
}

export interface BreathDNA extends BreathPlan {}

export interface ColorDNA {
  primary: string
  secondary: string
  regulator: string
  /** Full 5-color palette for visual interpolation */
  palette: [string, string, string, string, string]
}

export interface ChamberDNA {
  // Identity
  seed: number                   // 32-bit hash of birth data
  signature: string              // 'ASTRYX-CH-XXXXXXXX'
  chamberName: string            // user-facing: 'Pressure', 'Flow', 'Dialogue', ...
  experientialDescription: string
  technicalSignature: string     // practitioner: 'Mars Square Saturn in Capricorn / Cardinal'

  // Source attribution
  primaryPlanet: string
  secondaryPlanet: string
  // Directive B.1 — the three tiers from signalHierarchy (so DNA and text can
  // NEVER diverge). Each tier carries its OWN state (a balanced secondary plays
  // its NAT track even while primary is corrected).
  tertiaryPlanet?: string
  tierStates?: {
    primary: PolarityStateLike
    secondary?: PolarityStateLike
    tertiary?: PolarityStateLike
  }
  dominantAspect: AspectKey
  dominantElement: Element
  dominantModality: Modality
  primarySign: string
  secondarySign: string

  // Phase C — Polarity awareness
  /** Polarity result for the primary planet (or undefined if not run) */
  polarity?: PolarityResultLike
  /** True if polarity is at moderate+ confidence in excess/deficiency/blocked */
  applyCorrective: boolean
  /**
   * The planet whose character downstream engines should use for SOUND + COLOR.
   * When applyCorrective: regulator planet (e.g. Moon for Mars Excess).
   * Otherwise: primaryPlanet.
   * Identity (chamberName, signature) is NOT changed — only sonic/visual character.
   */
  effectivePlanet: string

  // Sub-DNAs
  visualDNA: VisualDNA
  harmonicDNA: HarmonicDNA
  breathDNA: BreathDNA
  colorDNA: ColorDNA
}

// ─── INTERNAL HELPERS ──────────────────────────────────────────────

/** Lookup planet anchor Hz from planetary-anchors. Lazy require avoids circular deps. */
function planetHz(planet: string, fallback: number): number {
  // Inline mapping — keeps Chamber DNA self-contained (no engine.ts coupling)
  const HZ: Record<string, number> = {
    Sun: 126.22, Moon: 210.42, Mercury: 141.27, Venus: 221.23,
    Mars: 144.72, Jupiter: 183.58, Saturn: 147.85,
    Uranus: 207.36, Neptune: 211.44, Pluto: 140.25,
  }
  return HZ[planet] ?? fallback
}

/** Aspect → master pulse rate in Hz (matches existing soundEngine PHASE_PLAN). */
function pulseRateForAspect(aspect: AspectKey): number {
  const map: Record<AspectKey, number> = {
    conjunction: 0.08, square: 0.60, opposition: 0.20,
    trine: 0.12, sextile: 0.25, quincunx: 0.18,
  }
  return map[aspect] ?? 0.15
}

/** Aspect → behavior tag (from existing aspects.json music_behavior). */
function behaviorTagForAspect(aspect: AspectKey): string {
  const map: Record<AspectKey, string> = {
    conjunction: 'stacking_amplification',
    opposition:  'call_response',
    square:      'tension_syncopation',
    trine:       'flow_harmonic',
    sextile:     'cooperation_responsive',
    quincunx:    'adjustment_offset',
  }
  return map[aspect] ?? 'flow_harmonic'
}

/** Default solfeggio role per planet (Deploy 2 will refine per phase). */
function solfeggioRoleForPlanet(planet: string): HarmonicDNA['solfeggioRole'] {
  const map: Record<string, HarmonicDNA['solfeggioRole']> = {
    Sun: 'coherence',   Moon: 'release',     Mercury: 'corrective',
    Venus: 'coherence', Mars: 'corrective',  Jupiter: 'coherence',
    Saturn: 'grounding', Uranus: 'corrective', Neptune: 'depth',
    Pluto: 'depth',
  }
  return map[planet] ?? 'coherence'
}

/** Parse the legacy 'fire cardinal' style string from DominantPattern. */
function parseElementModality(s: string): { element: Element; modality: Modality } {
  const lower = (s ?? 'air mutable').toLowerCase()
  const elementMatch = (['fire', 'earth', 'air', 'water'] as const).find((e) => lower.includes(e))
  const modalityMatch = (['cardinal', 'fixed', 'mutable'] as const).find((m) => lower.includes(m))
  return {
    element: elementMatch ?? 'air',
    modality: modalityMatch ?? 'mutable',
  }
}

// ─── MAIN DNA BUILDER ──────────────────────────────────────────────

export interface DNABuildInput {
  protocol: ProtocolOutput
  birthData: ChamberSeedInput
  /** Phase C — optional polarity result for the dominant planet.
   *  When provided AND state is excess/deficiency/blocked at moderate+ confidence,
   *  DNA flips to corrective character (regulator planet voice + corrective colors). */
  polarity?: PolarityResultLike
}

export function generateChamberDNA(input: DNABuildInput): ChamberDNA {
  const { protocol, birthData, polarity } = input
  const pattern: DominantPattern = protocol.dominant_pattern

  // Phase C — decide whether to apply corrective character to DNA
  const applyCorrective =
    !!polarity &&
    polarity.dominant_state !== 'balanced' &&
    polarity.confidence_band !== 'weak'

  // 1. Seed — the immutable root
  const seed = hashChamberSeed(birthData)
  const rng = createPRNG(seed)
  const signature = formatChamberSignature(seed)

  // 2. Source attribution — Directive B.1: the SUBJECT planet comes from the
  // signalHierarchy primary (the same planet the hero/diagnostic/prescription
  // name), NOT the raw chart lead. This is what stopped the chamber from saying
  // "Sun" while the hero said "Mars". The aspect/element (the chamber's IDENTITY,
  // i.e. Pressure/Flow) still come from the pattern relationship.
  const hierarchy       = protocol.signalHierarchy
  const primaryPlanet   = hierarchy?.primary.planet ?? pattern.planets[0] ?? 'Sun'
  const secondaryPlanet = hierarchy?.secondary?.planet ?? pattern.planets[1] ?? primaryPlanet
  const tertiaryPlanet  = hierarchy?.tertiary?.planet
  const tierStates = hierarchy
    ? {
        primary:   hierarchy.primary.state,
        secondary: hierarchy.secondary?.state,
        tertiary:  hierarchy.tertiary?.state,
      }
    : undefined
  const aspect          = ((pattern.aspect ?? 'conjunction').toLowerCase() as AspectKey)
  const dominantAspect: AspectKey =
    (['conjunction','opposition','square','trine','sextile','quincunx'] as const).includes(aspect)
      ? aspect
      : 'conjunction'
  const { element, modality } = parseElementModality(pattern.element_modality)
  const primarySign   = pattern.signs?.[0] ?? '—'
  const secondarySign = pattern.signs?.[1] ?? primarySign

  // 3. User-facing language
  const chamberName              = CHAMBER_NAME_BY_ASPECT[dominantAspect]
  const experientialDescription  = CHAMBER_FEELING_BY_ASPECT[dominantAspect]
  const technicalSignature       = `${primaryPlanet} ${dominantAspect} ${secondaryPlanet} in ${primarySign} (${element}/${modality})`

  // 4. Visual DNA — geometry / motion / color
  const { geometry, motion, symmetry } = geometryForAspect(dominantAspect)
  const motionType: MotionKind = motion
  const kaleidoscope: KaleidoscopeMode = (
    dominantAspect === 'conjunction' ? 'dense_bloom' :
    dominantAspect === 'opposition'  ? 'dual_reflection' :
    dominantAspect === 'square'      ? 'structured_tension' :
    dominantAspect === 'trine'       ? 'flow_symmetry' :
    dominantAspect === 'sextile'     ? 'harmonic_weave' :
                                       'adaptive_misalignment'
  )
  const primaryPalette   = paletteForPlanet(primaryPlanet)
  const secondaryPalette = paletteForPlanet(secondaryPlanet)
  const regulatorRole: RegulatorRole = regulatorForPlanet(primaryPlanet)
  const regulatorColor   = regulatorColorMap[regulatorRole]

  const visualDNA: VisualDNA = {
    geometry,
    motionType,
    kaleidoscope,
    primaryColor: primaryPalette.primary,
    secondaryColor: secondaryPalette.primary,
    regulatorColor,
    element: elementVisualFor(element),
    modality: modalityMotionFor(modality),
    // Subtle PRNG nudge so two charts with same aspect/element diverge by ±5%
    complexity: 0.85 + (rng() - 0.5) * 0.10,
  }

  // 5. Harmonic DNA — chamber frequency identity
  const primaryHz   = planetHz(primaryPlanet,   144.72)
  const secondaryHz = planetHz(secondaryPlanet, 147.85)

  const harmonicDNA: HarmonicDNA = {
    primaryHz,
    secondaryHz,
    earthOmHz: 136.10,
    polyrhythm: POLYRHYTHM_BY_ASPECT[dominantAspect],
    pulseHz: pulseRateForAspect(dominantAspect),
    behaviorTag: behaviorTagForAspect(dominantAspect),
    solfeggioRole: solfeggioRoleForPlanet(primaryPlanet),
  }

  // 6. Breath DNA — element-derived, safe defaults
  let breathDNA: BreathDNA = { ...BREATH_BY_ELEMENT[element] }
  if (applyCorrective && polarity!.protocol.breath) {
    // Map polarity's breath token to BreathPlan structure
    const tok = polarity!.protocol.breath
    if (tok === '4-7-8') {
      breathDNA = { pattern: '4-7-8', inhaleSec: 4, holdSec: 7, exhaleSec: 8, description: 'Extended exhale — 4 in, 7 hold, 8 out.', intensity: 0.5 }
    } else if (tok === 'box_breathing') {
      breathDNA = { pattern: 'box', inhaleSec: 4, holdSec: 4, exhaleSec: 4, holdAfterSec: 4, description: 'Box breathing — four equal counts.', intensity: 0.55 }
    } else if (tok === 'balanced' || tok === 'balanced_activating' || tok === 'alternate_nostril') {
      breathDNA = { pattern: 'balanced', inhaleSec: 4, holdSec: 0, exhaleSec: 4, description: 'Balanced rhythmic breath — equal in and out.', intensity: 0.6 }
    } else {
      // Soft/extended/expansive variants → gentle soft breath
      breathDNA = { pattern: 'gentle-activating', inhaleSec: 4, holdSec: 2, exhaleSec: 6, description: tok.replace(/_/g, ' '), intensity: 0.45 }
    }
  }

  // 7. Color DNA — 5-stop palette per phase
  // Phase C — when applying corrective, use polarity's color_palette as the
  // primary chamber colors (e.g. blues/greens for Mars Excess).
  let palette: [string, string, string, string, string]
  let colorDNA: ColorDNA
  if (applyCorrective && polarity!.protocol.color_palette.length > 0) {
    const cp = polarity!.protocol.color_palette
    const correctivePrimary   = cp[0]
    const correctiveSecondary = cp[1] ?? cp[0]
    const correctiveRegulator = cp[2] ?? cp[0]
    palette = [
      correctiveSecondary,
      correctivePrimary,
      correctivePrimary,
      correctiveRegulator,
      correctiveSecondary,
    ]
    colorDNA = {
      primary:   correctivePrimary,
      secondary: correctiveSecondary,
      regulator: correctiveRegulator,
      palette,
    }
  } else {
    palette = [
      primaryPalette.secondary,
      primaryPalette.primary,
      secondaryPalette.primary,
      regulatorColor,
      primaryPalette.secondary,
    ]
    colorDNA = {
      primary:   primaryPalette.primary,
      secondary: secondaryPalette.primary,
      regulator: regulatorColor,
      palette,
    }
  }

  // Phase C — also bend visualDNA colors to match when correcting
  if (applyCorrective) {
    visualDNA.primaryColor   = colorDNA.primary
    visualDNA.secondaryColor = colorDNA.secondary
    visualDNA.regulatorColor = colorDNA.regulator
  }

  // effectivePlanet = regulator planet when correcting, else primary planet.
  // Downstream engines (Scale / Chord / Melody / Instruments) read this
  // instead of primaryPlanet so their character flips automatically.
  const effectivePlanet = applyCorrective
    ? (polarity!.protocol.regulator_planets[0] ?? primaryPlanet)
    : primaryPlanet

  return {
    seed,
    signature,
    chamberName,
    experientialDescription,
    technicalSignature,
    primaryPlanet,
    secondaryPlanet,
    tertiaryPlanet,
    tierStates,
    dominantAspect,
    dominantElement: element,
    dominantModality: modality,
    primarySign,
    secondarySign,
    polarity,
    applyCorrective,
    effectivePlanet,
    visualDNA,
    harmonicDNA,
    breathDNA,
    colorDNA,
  }
}

/**
 * Re-derive a deterministic detail from existing DNA — used by Deploy 2's
 * ScaleEngine / MelodyGenerator so they don't have to re-thread the seed.
 */
export function dnaToPRNG(dna: ChamberDNA): () => number {
  return createPRNG(dna.seed)
}
