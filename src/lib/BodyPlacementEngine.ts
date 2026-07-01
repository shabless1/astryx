/**
 * ASTRYX — Body Placement Intelligence (Chamber fork placement)
 * ════════════════════════════════════════════════════════════════════
 * Computes WHERE to place/hover each tuning fork — never planet-alone.
 * Ranked: 1) reported symptom  2) SIGN body field (primary)  3) PLANET
 * rulership (secondary)  4) chakra overlay  5) house context  6) signal state
 * (HOW to apply)  + a one-line Why.
 *
 *   Planet = frequency carrier · Sign = anatomical field · State = how to apply
 *   Chakra = energetic overlay · Symptom = current priority
 *
 * The six libraries from the directive live here as one cohesive module
 * (signBodyRulership / planetBodyRulership / chakraPlacement /
 *  signalStateApplication / housePlacementContext / bodyMapAnchors).
 * Non-diagnostic; COMPLIANCE-safe ("support", never "treat/cure").
 */

import type { BodyMapType, BodyView } from '@/lib/bodyMapPlacement'
import { chakraAddressFor } from '@/lib/forkClass'

// ─── 1. SIGN BODY RULERSHIP (primary anatomical field) ─────────────────
interface SignField {
  primaryZones: string[]
  bodyMapRegions: string[]
  defaultView: BodyView
  chakraOverlay: string[]
  keywords: string[]
}
export const signBodyRulershipLibrary: Record<string, SignField> = {
  Aries:       { primaryZones: ['head', 'face', 'skull', 'brain', 'eyes', 'forehead', 'jaw'], bodyMapRegions: ['head', 'forehead', 'jaw'], defaultView: 'anterior', chakraOverlay: ['crown', 'third_eye'], keywords: ['cranial field', 'head pressure', 'heat', 'activation'] },
  Taurus:      { primaryZones: ['throat', 'neck', 'voice', 'jaw', 'thyroid area'], bodyMapRegions: ['throat', 'neck', 'jaw'], defaultView: 'anterior', chakraOverlay: ['throat'], keywords: ['voice', 'stability', 'holding', 'value'] },
  Gemini:      { primaryZones: ['lungs', 'breath', 'shoulders', 'arms', 'hands', 'nervous pathways'], bodyMapRegions: ['lungs', 'shoulders', 'arms', 'hands'], defaultView: 'anterior', chakraOverlay: ['throat', 'heart'], keywords: ['breath', 'communication', 'nerves', 'movement'] },
  Cancer:      { primaryZones: ['chest', 'breasts', 'stomach', 'upper abdomen', 'fluid field'], bodyMapRegions: ['chest', 'stomach', 'upper_abdomen'], defaultView: 'anterior', chakraOverlay: ['heart', 'solar_plexus'], keywords: ['emotional body', 'nourishment', 'fluid', 'stomach'] },
  Leo:         { primaryZones: ['heart', 'upper spine', 'back', 'circulation', 'solar vitality'], bodyMapRegions: ['heart', 'upper_spine', 'upper_back'], defaultView: 'anterior', chakraOverlay: ['heart', 'solar_plexus'], keywords: ['vitality', 'heart field', 'radiance', 'life force'] },
  Virgo:       { primaryZones: ['intestines', 'lower abdomen', 'digestion', 'assimilation', 'gut rhythm'], bodyMapRegions: ['lower_abdomen', 'intestines', 'digestive_field'], defaultView: 'anterior', chakraOverlay: ['solar_plexus', 'sacral'], keywords: ['assimilation', 'gut', 'refinement', 'routine'] },
  Libra:       { primaryZones: ['kidneys', 'lower back', 'lumbar region', 'pelvic balance', 'skin'], bodyMapRegions: ['kidneys', 'lower_back', 'lumbar', 'pelvis'], defaultView: 'posterior', chakraOverlay: ['sacral', 'heart'], keywords: ['balance', 'symmetry', 'kidneys', 'relationship field'] },
  Scorpio:     { primaryZones: ['pelvis', 'reproductive organs', 'elimination', 'bladder', 'deep pelvic field'], bodyMapRegions: ['pelvis', 'sacral', 'reproductive_field', 'elimination_field'], defaultView: 'anterior', chakraOverlay: ['sacral', 'root'], keywords: ['release', 'depth', 'elimination', 'transformation'] },
  Sagittarius: { primaryZones: ['hips', 'thighs', 'sciatic pathway', 'liver', 'movement field'], bodyMapRegions: ['hips', 'thighs', 'liver', 'sciatic_pathway'], defaultView: 'anterior', chakraOverlay: ['sacral', 'solar_plexus'], keywords: ['movement', 'expansion', 'liver', 'mobility'] },
  Capricorn:   { primaryZones: ['knees', 'bones', 'joints', 'skeletal structure', 'skin', 'teeth'], bodyMapRegions: ['knees', 'bones', 'joints', 'spine', 'skin'], defaultView: 'posterior', chakraOverlay: ['root'], keywords: ['structure', 'restriction', 'bones', 'discipline'] },
  Aquarius:    { primaryZones: ['ankles', 'calves', 'circulation', 'nervous electricity'], bodyMapRegions: ['ankles', 'calves', 'circulation', 'nervous_pathways'], defaultView: 'posterior', chakraOverlay: ['third_eye', 'root'], keywords: ['current', 'electricity', 'ankles', 'circulation'] },
  Pisces:      { primaryZones: ['feet', 'lymph', 'fluid field', 'immune sensitivity', 'subtle body'], bodyMapRegions: ['feet', 'lymph', 'fluid_field', 'subtle_body'], defaultView: 'posterior', chakraOverlay: ['root', 'crown'], keywords: ['dissolution', 'sensitivity', 'feet', 'fluid'] },
}

// ─── 1b. PLANET → RULERSHIP SIGN(S) → body-zone HOME (v2 FIX F/H) ───────
// CALIBRATION layer (all 12 forks place by body zone, independent of chakra).
// Traditional rulerships (Phase 1: Mars rules Scorpio); PRIMARY sign first so
// the HOME station uses it. Earth forks have no zodiac rulership → whole-field.
export const RULERSHIP_SIGNS: Record<string, string[]> = {
  Sun: ['Leo'], Moon: ['Cancer'], Mercury: ['Gemini', 'Virgo'],
  Venus: ['Taurus', 'Libra'], Mars: ['Aries', 'Scorpio'],
  Jupiter: ['Sagittarius', 'Pisces'], Saturn: ['Capricorn', 'Aquarius'],
  Uranus: ['Aquarius'], Neptune: ['Pisces'], Pluto: ['Scorpio'],
  'Earth Day': [], 'Earth Year': [],
}

export interface BodyZoneHome {
  label: string
  regions: string[]
  view: BodyView
  signs: string[]      // rulership sign(s) this home derives from
  wholeField: boolean  // Earth forks integrate the whole field / ground
}

/** The body-zone HOME for a fork (calibration address). All 12 resolve here. */
export function bodyZoneHomeFor(planet: string): BodyZoneHome {
  const signs = RULERSHIP_SIGNS[planet] ?? []
  if (signs.length === 0) {
    return { label: 'Whole-field / grounding', regions: ['root', 'spine', 'feet'], view: 'anterior', signs: [], wholeField: true }
  }
  const fields = signs.map((s) => signBodyRulershipLibrary[s]).filter(Boolean)
  const regions = Array.from(new Set(fields.flatMap((f) => f.bodyMapRegions))).slice(0, 4)
  const label = Array.from(new Set(fields.flatMap((f) => f.primaryZones.slice(0, 2)))).slice(0, 3).map(cap).join(' / ')
  return { label, regions, view: fields[0]?.defaultView ?? 'anterior', signs, wholeField: false }
}

// ─── 1c. DELIVERY MODE (v2 FIX G) — contact vs off-body sweep ──────────
// Intimate / reproductive-adjacent zones are NEVER contact — they resolve to an
// off-body sweep (~6" above, no touch). Pluto is ALWAYS an off-body sacral-down
// sweep. Body-map preference (silhouette) never changes the intimacy of a placement.
export type DeliveryMode = 'contact' | 'sweep'
export interface SweepPath {
  from: { x: number; y: number }
  to?: { x: number; y: number }     // present for a directional sweep (Pluto: sacral → downward)
  instruction: string
}
// Reproductive-system / intimate region keys (mirror bodySystems/reproductive.json zones).
const INTIMATE_REGIONS = new Set(['pelvis', 'sacral', 'reproductive_field', 'elimination_field', 'root'])

export function deliveryModeFor(planet: string, regions: string[]): DeliveryMode {
  if (planet === 'Pluto') return 'sweep'                                  // Pluto is always off-body
  return regions.some((r) => INTIMATE_REGIONS.has(r)) ? 'sweep' : 'contact'
}

// Resolve mode + the sweep path for a placement/station (shared by FIX G + H).
function deliveryFor(planet: string, regions: string[], anchor: { x: number; y: number }): { mode: DeliveryMode; sweep?: SweepPath } {
  const mode = deliveryModeFor(planet, regions)
  if (mode !== 'sweep') return { mode }
  if (planet === 'Pluto') {
    return { mode, sweep: { from: anchorFor('sacral'), to: anchorFor('thighs'), instruction: 'Off-body, ~6 inches above — sweep slowly from the sacral downward. Never touching.' } }
  }
  return { mode, sweep: { from: anchor, instruction: 'Off-body, ~6 inches above — sweep gently across the field. No contact.' } }
}

// ─── 2. PLANET BODY RULERSHIP (secondary/support field) ────────────────
interface PlanetField {
  bodyMapRegions: string[]
  chakraOverlay: string[]
  placementLabel: string
}
export const planetBodyRulershipLibrary: Record<string, PlanetField> = {
  Sun:     { bodyMapRegions: ['heart', 'upper_spine', 'solar_plexus'], chakraOverlay: ['heart', 'solar_plexus'], placementLabel: 'Heart / upper spine / vitality field' },
  Moon:    { bodyMapRegions: ['chest', 'stomach', 'lower_abdomen', 'pelvis'], chakraOverlay: ['heart', 'sacral'], placementLabel: 'Chest / stomach / lower abdomen' },
  Mercury: { bodyMapRegions: ['throat', 'lungs', 'arms', 'hands', 'nervous_pathways'], chakraOverlay: ['throat', 'third_eye'], placementLabel: 'Throat / lungs / hands / nervous pathway' },
  Venus:   { bodyMapRegions: ['heart', 'throat', 'kidneys', 'lower_back', 'pelvis'], chakraOverlay: ['heart', 'sacral', 'throat'], placementLabel: 'Heart / kidneys / throat / soft-tissue field' },
  Mars:    { bodyMapRegions: ['solar_plexus', 'muscles', 'head', 'pelvis'], chakraOverlay: ['solar_plexus', 'root'], placementLabel: 'Solar plexus / muscle field / heat pathway' },
  Jupiter: { bodyMapRegions: ['liver', 'hips', 'thighs', 'solar_plexus'], chakraOverlay: ['solar_plexus', 'sacral'], placementLabel: 'Liver / hips / thighs / expansion field' },
  Saturn:  { bodyMapRegions: ['knees', 'spine', 'joints', 'bones'], chakraOverlay: ['root'], placementLabel: 'Bones / knees / spine / joints' },
  Uranus:  { bodyMapRegions: ['nervous_pathways', 'ankles', 'calves', 'upper_spine'], chakraOverlay: ['third_eye', 'crown', 'root'], placementLabel: 'Nervous system / ankles / electrical pathway' },
  Neptune: { bodyMapRegions: ['feet', 'lymph', 'fluid_field', 'head'], chakraOverlay: ['crown', 'third_eye', 'root'], placementLabel: 'Feet / lymph / subtle fluid field' },
  Pluto:   { bodyMapRegions: ['pelvis', 'root', 'sacral', 'lower_abdomen'], chakraOverlay: ['root', 'sacral'], placementLabel: 'Pelvis / root / deep regenerative field' },
}

// ─── 3. CHAKRA OVERLAY (energetic) ─────────────────────────────────────
export const chakraPlacementLibrary: Record<string, { label: string; bodyMapRegion: string; instruction: string }> = {
  crown:        { label: 'Crown',        bodyMapRegion: 'top_of_head', instruction: 'Hover above the crown, just over the top of the head.' },
  third_eye:    { label: 'Third Eye',    bodyMapRegion: 'forehead',    instruction: 'Hover near the center of the forehead or brow.' },
  throat:       { label: 'Throat',       bodyMapRegion: 'throat',      instruction: 'Hover near the throat or front of the neck.' },
  heart:        { label: 'Heart',        bodyMapRegion: 'heart',       instruction: 'Hover near the center of the chest / heart field.' },
  solar_plexus: { label: 'Solar Plexus', bodyMapRegion: 'solar_plexus',instruction: 'Hover above the upper abdomen, between ribs and navel.' },
  sacral:       { label: 'Sacral',       bodyMapRegion: 'sacral',      instruction: 'Hover near the lower abdomen / pelvic bowl.' },
  root:         { label: 'Root',         bodyMapRegion: 'root',        instruction: 'Hover below the pelvic bone / base field.' },
}

// ─── 4. SIGNAL STATE → HOW TO APPLY ────────────────────────────────────
export interface ApplicationStyle {
  distance: string; strikeStyle: string; pace: string; duration: string; instruction: string
}
export const signalStateApplicationLibrary: Record<string, ApplicationStyle> = {
  amplified:       { distance: '4–8 inches from body', strikeStyle: 'gentle', pace: 'slow', duration: 'short to moderate', instruction: 'Use a softer strike and hold the fork farther from the body to regulate without overstimulating.' },
  under_supported: { distance: '2–4 inches from body', strikeStyle: 'clear but gentle', pace: 'steady', duration: 'moderate', instruction: 'Use a clear, steady tone closer to the body to support and restore the signal.' },
  restricted:      { distance: 'begin ~6 inches away, slowly move closer', strikeStyle: 'gentle', pace: 'slow release', duration: 'moderate', instruction: 'Begin slightly away from the body and move slowly toward the field as the tone fades.' },
  coherent:        { distance: '3–6 inches from body', strikeStyle: 'gentle', pace: 'steady', duration: 'short', instruction: 'Use this placement as a stabilizing or closing tone.' },
}

// engine state (excess/deficiency/blocked/balanced) → application key
export function toApplicationState(engineState: string | undefined): keyof typeof signalStateApplicationLibrary {
  switch (engineState) {
    case 'excess':     return 'amplified'
    case 'deficiency': return 'under_supported'
    case 'blocked':    return 'restricted'
    default:           return 'coherent'
  }
}

// ─── 5. HOUSE CONTEXT (modifier only) ──────────────────────────────────
export const housePlacementContextLibrary: Record<number, string> = {
  1: 'body identity / immediate physical field', 2: 'throat, value, material body',
  3: 'breath, arms, hands, communication', 4: 'chest, stomach, emotional base',
  5: 'heart, vitality, creativity', 6: 'digestion, routine, maintenance',
  7: 'balance, kidneys, relational field', 8: 'pelvis, elimination, deep release',
  9: 'hips, thighs, liver, expansion', 10: 'knees, spine, structure, posture',
  11: 'ankles, circulation, nervous current', 12: 'feet, lymph, subtle field, rest',
}

// ─── 6. BODY-MAP ANCHORS (region → glow position, % of image) ──────────
export const bodyMapAnchorLibrary: Record<string, { x: number; y: number }> = {
  top_of_head: { x: 0.50, y: 0.04 }, head: { x: 0.50, y: 0.08 }, forehead: { x: 0.50, y: 0.10 },
  jaw: { x: 0.50, y: 0.14 }, eyes: { x: 0.50, y: 0.09 }, skull: { x: 0.50, y: 0.07 }, brain: { x: 0.50, y: 0.08 },
  throat: { x: 0.50, y: 0.16 }, neck: { x: 0.50, y: 0.15 },
  shoulders: { x: 0.36, y: 0.22 }, arms: { x: 0.30, y: 0.40 }, hands: { x: 0.24, y: 0.62 },
  lungs: { x: 0.50, y: 0.27 }, chest: { x: 0.50, y: 0.28 }, heart: { x: 0.50, y: 0.30 },
  upper_spine: { x: 0.50, y: 0.26 }, upper_back: { x: 0.50, y: 0.27 },
  solar_plexus: { x: 0.50, y: 0.37 }, stomach: { x: 0.50, y: 0.40 }, upper_abdomen: { x: 0.50, y: 0.40 },
  liver: { x: 0.43, y: 0.40 }, lower_abdomen: { x: 0.50, y: 0.45 }, intestines: { x: 0.50, y: 0.45 },
  digestive_field: { x: 0.50, y: 0.44 }, kidneys: { x: 0.50, y: 0.43 }, lower_back: { x: 0.50, y: 0.44 },
  // Patch — pelvic/reproductive/root markers sit on the LOWER ABDOMEN / pelvic
  // bowl / sacrum, never the genital region. A vibratory fork is hovered over the
  // lower belly or sacrum, not between the legs (Scorpio placements included).
  lumbar: { x: 0.50, y: 0.44 }, pelvis: { x: 0.50, y: 0.47 }, sacral: { x: 0.50, y: 0.46 },
  reproductive_field: { x: 0.50, y: 0.47 }, elimination_field: { x: 0.50, y: 0.48 }, root: { x: 0.50, y: 0.48 },
  hips: { x: 0.42, y: 0.55 }, thighs: { x: 0.42, y: 0.64 }, sciatic_pathway: { x: 0.42, y: 0.62 },
  knees: { x: 0.43, y: 0.75 }, joints: { x: 0.43, y: 0.70 }, bones: { x: 0.50, y: 0.50 }, spine: { x: 0.50, y: 0.34 },
  skin: { x: 0.50, y: 0.45 }, teeth: { x: 0.50, y: 0.13 },
  calves: { x: 0.42, y: 0.85 }, ankles: { x: 0.42, y: 0.90 }, circulation: { x: 0.42, y: 0.80 },
  nervous_pathways: { x: 0.50, y: 0.30 }, muscles: { x: 0.50, y: 0.40 },
  feet: { x: 0.44, y: 0.95 }, lymph: { x: 0.44, y: 0.92 }, fluid_field: { x: 0.50, y: 0.50 }, subtle_body: { x: 0.50, y: 0.50 },
}
// Astryx places on the womb/sacral field — NEVER the genitals. Hard floor: any
// MIDLINE anchor (x near center) is lifted out of the genital band to the
// womb/sacral line. Off-midline regions (hips/thighs/legs at x≈0.42) and the
// lower legs/feet (y>0.60) are unaffected. (Directive K.3 — any planet/sign/sex.)
const GENITAL_FLOOR_Y = 0.49
function anchorFor(region: string): { x: number; y: number } {
  const a = bodyMapAnchorLibrary[region] ?? { x: 0.50, y: 0.40 }
  if (a.x > 0.43 && a.x < 0.57 && a.y > GENITAL_FLOOR_Y && a.y < 0.60) {
    return { x: a.x, y: GENITAL_FLOOR_Y }
  }
  return a
}

/** Public region → {x,y} anchor (womb/sacral floor enforced). Used by the
 *  Reflex engine + body map to place LOCAL / REFLEX / planet-anatomy orbs. */
export function anchorForRegion(region: string): { x: number; y: number } {
  return anchorFor(region)
}

// ─── SYMPTOM → BODY ZONE (Rank 1, highest priority) ────────────────────
// Keyword scan over the user's reported symptom tags. Returns a primary field
// when a clear body complaint is present; otherwise null (sign takes over).
const SYMPTOM_ZONES: { match: string[]; label: string; regions: string[]; view: BodyView; chakra: string[] }[] = [
  { match: ['head', 'migraine', 'cranial'], label: 'Head / cranial field', regions: ['head', 'forehead'], view: 'anterior', chakra: ['crown', 'third_eye'] },
  { match: ['jaw', 'tmj'], label: 'Jaw / cranial field', regions: ['jaw', 'throat'], view: 'anterior', chakra: ['throat', 'third_eye'] },
  { match: ['shoulder', 'trapez'], label: 'Shoulders / upper arms', regions: ['shoulders', 'arms'], view: 'posterior', chakra: ['throat', 'heart'] },
  { match: ['throat', 'neck', 'voice'], label: 'Throat / neck', regions: ['throat', 'neck'], view: 'anterior', chakra: ['throat'] },
  { match: ['chest', 'heart', 'palpit'], label: 'Chest / heart field', regions: ['chest', 'heart'], view: 'anterior', chakra: ['heart'] },
  { match: ['lung', 'breath', 'respir'], label: 'Lungs / breath field', regions: ['lungs', 'chest'], view: 'anterior', chakra: ['heart', 'throat'] },
  { match: ['stomach', 'gut', 'digest', 'nausea', 'belly'], label: 'Stomach / solar plexus', regions: ['stomach', 'solar_plexus'], view: 'anterior', chakra: ['solar_plexus'] },
  { match: ['lower back', 'lumbar', 'kidney', 'sacrum'], label: 'Lumbar / kidneys / sacrum', regions: ['lower_back', 'kidneys'], view: 'posterior', chakra: ['sacral'] },
  { match: ['pelvi', 'reproduct', 'menstr', 'womb', 'bladder'], label: 'Pelvis / sacral field', regions: ['pelvis', 'sacral'], view: 'anterior', chakra: ['sacral', 'root'] },
  { match: ['knee'], label: 'Knees / joints', regions: ['knees', 'joints'], view: 'posterior', chakra: ['root'] },
  { match: ['ankle'], label: 'Ankles', regions: ['ankles', 'calves'], view: 'posterior', chakra: ['root'] },
  { match: ['foot', 'feet'], label: 'Feet / lymph field', regions: ['feet', 'lymph'], view: 'anterior', chakra: ['root', 'crown'] },
  { match: ['nervous', 'anxiet', 'overstim', 'racing', 'scattered', 'mental fog'], label: 'Nervous / cranial field', regions: ['nervous_pathways', 'forehead'], view: 'anterior', chakra: ['third_eye', 'crown'] },
  { match: ['inflammation', 'anger', 'tension', 'muscle'], label: 'Muscle / solar plexus field', regions: ['solar_plexus', 'muscles'], view: 'anterior', chakra: ['solar_plexus'] },
]
function symptomPlacement(reportedSymptoms: string[]): { label: string; regions: string[]; view: BodyView; chakra: string[] } | null {
  const blob = (reportedSymptoms ?? []).join(' ').toLowerCase()
  if (!blob.trim()) return null
  for (const z of SYMPTOM_ZONES) {
    if (z.match.some((m) => blob.includes(m))) return { label: z.label, regions: z.regions, view: z.view, chakra: z.chakra }
  }
  return null
}

// ─── PUBLIC SHAPE ──────────────────────────────────────────────────────
// Directive K.1 — a single rendered placement: a region + its anchor + delivery.
// Each anchor carries the intimate-region off-body sweep treatment independently.
export interface PlacementAnchor {
  anchor: { x: number; y: number }
  region: string
  label: string
  view: BodyView
  mode: DeliveryMode
  sweep?: SweepPath
}

export interface ForkPlacement {
  planet: string
  sign?: string
  house?: number
  applicationState: keyof typeof signalStateApplicationLibrary
  primaryLabel: string
  primaryRegions: string[]
  view: BodyView
  anchor: { x: number; y: number }
  chakraOverlay: string[]            // energetic sign/planet hint (calibration overlay)
  chakraAddress: string | null       // v2 FIX F — the fork's TRUE chakra (7 forks) for CHAKRA work; null for the 5 Extended
  mode: DeliveryMode                 // v2 FIX G — contact (on-body) vs sweep (off-body, no contact)
  sweep?: SweepPath                  // v2 FIX G — present when mode === 'sweep'
  secondaryLabel: string
  applicationStyle: ApplicationStyle
  how: string
  why: string
  // Directive K.1 — TWO placements rendered on the body map:
  //   traditional = the planet's rulership home (the zodiacal man)
  //   natal       = where the planet sits in THIS user's chart (natal sign → region)
  // sameAsTraditional collapses to ONE orb (planet in its own ruling sign / no natal).
  traditionalPlacement: PlacementAnchor
  natalPlacement: PlacementAnchor & { sameAsTraditional: boolean; sign?: string }
  natalLabel: string
  natalHow: string
}

function mergeChakras(a: string[] = [], b: string[] = []): string[] {
  return Array.from(new Set([...a, ...b])).slice(0, 3)
}

export interface ResolveInput {
  planet: string
  sign?: string
  house?: number
  engineState?: string            // excess|deficiency|blocked|balanced
  reportedSymptoms?: string[]
  correctiveDirection?: string[]
  bodyMapType?: BodyMapType
  /** Directive K.1 — the planet's NATAL sign (for the natal placement orb).
   *  Defaults to `sign` (SessionScreen already passes the chart's natal sign). */
  natalSign?: string
}

/**
 * Ranked placement resolution: symptom → sign → planet → chakra → house → state.
 */
export function resolveForkPlacement(input: ResolveInput): ForkPlacement {
  const { planet, sign, house, engineState, reportedSymptoms, correctiveDirection } = input
  const planetField = planetBodyRulershipLibrary[planet] ?? planetBodyRulershipLibrary.Sun
  const signField = sign ? signBodyRulershipLibrary[sign] : undefined
  const sym = symptomPlacement(reportedSymptoms ?? [])
  const applicationState = toApplicationState(engineState)

  // Rank 1: symptom overrides. Rank 2: sign field. Fallback: planet field.
  let primaryLabel: string
  let primaryRegions: string[]
  let view: BodyView
  let primaryChakra: string[]
  if (sym) {
    primaryLabel = sym.label; primaryRegions = sym.regions; view = sym.view; primaryChakra = sym.chakra
  } else if (signField) {
    primaryLabel = signField.primaryZones.slice(0, 3).map(cap).join(' / ')
    primaryRegions = signField.bodyMapRegions; view = signField.defaultView; primaryChakra = signField.chakraOverlay
  } else {
    primaryLabel = planetField.placementLabel; primaryRegions = planetField.bodyMapRegions
    view = 'anterior'; primaryChakra = planetField.chakraOverlay
  }

  const chakraOverlay = mergeChakras(primaryChakra, planetField.chakraOverlay)
  const anchor = anchorFor(primaryRegions[0] ?? planetField.bodyMapRegions[0])
  const style = signalStateApplicationLibrary[applicationState]

  // v2 FIX G — delivery mode (shared helper). Pluto = sacral-down sweep; intimate
  // zones = sweep; else contact.
  const { mode, sweep } = deliveryFor(planet, primaryRegions, anchor)
  const how = mode === 'sweep'
    ? `${sweep!.instruction} ${style.pace}, ${style.duration}.`
    : `${cap(style.strikeStyle)} strike — hover ${style.distance}; ${style.pace}, ${style.duration}.`

  // ── Directive K.1 / N.1 — the TWO rendered placements ──
  // TRADITIONAL = the PLANET'S OWN body rulership (Directive N.1: Mercury →
  // throat/lungs/hands, Sun → heart, Saturn → knees/bones …). Uses
  // planetBodyRulershipLibrary so each fork lands on its distinctive region —
  // never a center default. (Was the sign-rulership home, which read as a
  // generic chest orb for Mercury.)
  const traditionalPlacement = buildPlacementAnchor(
    planet,
    planetField.bodyMapRegions.length ? planetField.bodyMapRegions : ['heart'],
    planetField.placementLabel,
    'anterior',
  )
  // NATAL = the planet's natal sign → body field. Falls back to traditional when
  // the natal sign is unknown (Solar Chart edge) or maps to the same region
  // (planet in its own ruling sign) → one orb, not two stacked identically.
  const natalSign = input.natalSign ?? sign
  const nsf = natalSign ? signBodyRulershipLibrary[natalSign] : undefined
  let natalPlacement: PlacementAnchor & { sameAsTraditional: boolean; sign?: string }
  if (!nsf) {
    natalPlacement = { ...traditionalPlacement, sameAsTraditional: true, sign: natalSign }
  } else {
    const nBase = buildPlacementAnchor(
      planet, nsf.bodyMapRegions, nsf.primaryZones.slice(0, 3).map(cap).join(' / '), nsf.defaultView,
    )
    natalPlacement = { ...nBase, sameAsTraditional: nBase.region === traditionalPlacement.region, sign: natalSign }
  }
  const natalHow = natalPlacement.mode === 'sweep'
    ? `${natalPlacement.sweep!.instruction} ${style.pace}, ${style.duration}.`
    : `${cap(style.strikeStyle)} strike — hover ${style.distance}; ${style.pace}, ${style.duration}.`

  return {
    planet, sign, house, applicationState,
    primaryLabel, primaryRegions, view, anchor, chakraOverlay,
    chakraAddress: chakraAddressFor(planet),   // v2 FIX F — chakra work address (7 forks only)
    mode, sweep,                                // v2 FIX G — contact vs off-body sweep
    secondaryLabel: planetField.placementLabel,
    applicationStyle: style,
    how,
    why: generateWhy(planet, sign, engineState, primaryLabel, correctiveDirection),
    traditionalPlacement, natalPlacement,       // K.1 — dual anchors
    natalLabel: natalPlacement.label,
    natalHow,
  }
}

/** K.1 — build a single rendered placement (region → clamped anchor → delivery). */
function buildPlacementAnchor(planet: string, regions: string[], label: string, view: BodyView): PlacementAnchor {
  const region = regions[0] ?? 'root'
  const anchor = anchorFor(region)
  const { mode, sweep } = deliveryFor(planet, regions, anchor)
  return { anchor, region, label, view, mode, sweep }
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }

function generateWhy(
  planet: string, sign: string | undefined, engineState: string | undefined,
  primaryLabel: string, correctiveDirection?: string[],
): string {
  const stateWord = engineState === 'excess' ? 'amplified'
    : engineState === 'deficiency' ? 'under-supported'
    : engineState === 'blocked' ? 'compressed' : 'steady'
  const direction = correctiveDirection && correctiveDirection.length
    ? correctiveDirection.slice(0, 3).join(', ')
    : (engineState === 'excess' ? 'cool and regulate'
       : engineState === 'deficiency' ? 'support and restore'
       : engineState === 'blocked' ? 'soften and release' : 'stabilize')
  const field = sign ? `${sign} points to the ${primaryLabel.toLowerCase()}` : `the ${primaryLabel.toLowerCase()} is the active field`
  return `${planet} carries the frequency, while ${field}. Because the signal appears ${stateWord}, Astryx uses this placement to ${direction}.`
}

// ─── MULTI-STATION EMIT (v2 FIX H) ─────────────────────────────────────
// A fork INTEGRATES its relevant zones rather than picking one. Ordered stations:
//   1. HOME (always)      — the planet's rulership body zone (bodyZoneHomeFor).
//   2. NATAL (conditional)— if natal sign ≠ rulership sign, add the natal-sign zone.
//   3. SYMPTOM (conditional, held longer) — if a reported symptom lands in a zone
//      this fork governs (home ∪ natal regions).
// Each station carries its own delivery mode (FIX G). holdWeight feeds FIX I timing.
export type StationKind = 'home' | 'natal' | 'symptom'
export interface ForkStation {
  kind: StationKind
  label: string
  regions: string[]
  view: BodyView
  anchor: { x: number; y: number }
  mode: DeliveryMode
  sweep?: SweepPath
  holdWeight: number   // relative hold; symptom stations are held longer
  why: string
}
export interface ForkStationSet {
  planet: string
  chakraAddress: string | null
  applicationStyle: ApplicationStyle
  stations: ForkStation[]
}

export function resolveForkStations(input: ResolveInput): ForkStationSet {
  const { planet, sign, engineState, reportedSymptoms } = input
  const applicationState = toApplicationState(engineState)
  const stations: ForkStation[] = []

  // 1. HOME — always.
  const home = bodyZoneHomeFor(planet)
  {
    const regions = home.regions.length ? home.regions : ['root']
    const anchor = anchorFor(regions[0])
    const { mode, sweep } = deliveryFor(planet, regions, anchor)
    stations.push({
      kind: 'home', label: home.label, regions, view: home.view, anchor, mode, sweep, holdWeight: 1,
      why: home.wholeField
        ? `${planet} grounds the whole field — ${home.label.toLowerCase()}.`
        : `${planet}'s home field: ${home.label.toLowerCase()} (its rulership zone).`,
    })
  }

  // 2. NATAL — only when the natal sign differs from the planet's rulership sign(s).
  const rulerSigns = RULERSHIP_SIGNS[planet] ?? []
  if (sign && !rulerSigns.includes(sign)) {
    const sf = signBodyRulershipLibrary[sign]
    if (sf) {
      const regions = sf.bodyMapRegions
      const anchor = anchorFor(regions[0])
      const { mode, sweep } = deliveryFor(planet, regions, anchor)
      stations.push({
        kind: 'natal', label: sf.primaryZones.slice(0, 3).map(cap).join(' / '), regions, view: sf.defaultView, anchor, mode, sweep, holdWeight: 1,
        why: `Natal ${planet} in ${sign} adds the ${sf.primaryZones[0]} field.`,
      })
    }
    // (All 12 signs are defined in signBodyRulershipLibrary, so no undefined-zone gap.)
  }

  // 3. SYMPTOM — only if a reported symptom lands in a zone THIS fork governs.
  const sym = symptomPlacement(reportedSymptoms ?? [])
  if (sym) {
    const governed = new Set(stations.flatMap((s) => s.regions))
    if (sym.regions.some((r) => governed.has(r))) {
      const anchor = anchorFor(sym.regions[0])
      const { mode, sweep } = deliveryFor(planet, sym.regions, anchor)
      stations.push({
        kind: 'symptom', label: sym.label, regions: sym.regions, view: sym.view, anchor, mode, sweep, holdWeight: 1.6,
        why: `You reported a symptom in this field — this station is held longer to prioritize it.`,
      })
    }
  }

  return { planet, chakraAddress: chakraAddressFor(planet), applicationStyle: signalStateApplicationLibrary[applicationState], stations }
}
