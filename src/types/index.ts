// ─── TRI-SOURCE SCORING (Build Directive v2.0 FIX 5) ────────
// Per-planet activation score combining 3 inputs:
//   Planet Score = (Natal × 0.35) + (Transit Pressure × 0.40) + (Symptom Score × 0.25)
// Each component is normalized 0-10. Final score is the weighted sum.
// Urgency is derived from final score thresholds.
export interface ActivePlanet {
  planet:           string
  score:            number    // 0-10 weighted total
  urgency:          'critical' | 'elevated' | 'active'
  natalWeight:      number    // 0-10
  transitPressure:  number    // 0-10
  symptomScore:     number    // 0-10
  transitDescription: string  // plain-language summary
  calibrationWindow:  string  // "Optimal window: now through [date]"
}

// ─── INTAKE ──────────────────────────────────────────────────
export interface IntakeData {
  name: string
  birthDate: string
  birthTime: string
  birthLocation: string
  symptoms: string[]
  // Multi-select (up to 3 each). User picks the states/goals that resonate.
  emotionalState: string[]
  intention: string[]
  mode: 'user' | 'practitioner'
  // Play A — Intelligent Intake fields
  narrative?: string                          // Free-text: "what's going on in your own words"
  intentionText?: string                      // Open intention field
  narrativeScores?: Record<string, number>    // Planet scores 0-100 from Claude API interpretation
  // Directive I.1 — planets the user marks as feeling balanced / strong. These
  // are RESOURCES the Planet≠Remedy engine can borrow from (regulator
  // preference), never deficits. Mutually exclusive per-planet with imbalance
  // statements in the Resonance Scan.
  resourcedPlanets?: string[]
  // Body Map directive — routes which body-map family the Chamber shows.
  // 'neutral' = "Prefer not to say" (defaults to female maps for now).
  bodyMapType?: 'male' | 'female' | 'neutral'
  // v2 FIX 1 — pre-session energy baseline (1–10) captured at intake, so the
  // History card can show a real BEFORE→AFTER delta and the trend chart works.
  energyBefore?: number
  // Directive S — the light somatic moment ("where are you holding it today?").
  // bodyZones = ZONE_CHIPS keys; autonomic = the wired/weary axis. Both feed the
  // body-zone resolver → {sign+planet+state} → the polarity engine (user signal
  // is authority). Optional, so older flows are unaffected.
  bodyZones?: string[]
  autonomic?: 'wired' | 'weary' | null
}

// ─── REFLEX / DUAL PLACEMENT (Directive S · S1.2) ─────────────
// LOCAL (where it hurts) + REFLEX (opposite + squares) + planet-anatomy zones
// for one body signal. Powers the dual-placement body map; the full reasoning
// lives behind Astryx. (Structurally identical to ReflexEngine.ReflexZoneSet.)
export interface ReflexPlacement {
  localSign: string
  actionPlanet: string
  state: string
  localRegions: string[]
  localZones: string[]
  oppositeSign: string
  squareSigns: [string, string]
  reflexRegions: string[]
  planetRegions: string[]
  coGovernedSystem: string
  /** A1.2 — true when house-derived (secondary), ranked below primary signals. */
  secondary?: boolean
}

// ─── CHART PATTERN ───────────────────────────────────────────
export interface DominantPattern {
  title: string
  subtitle: string
  planets: string[]
  aspect: string
  signs: string[]
  houses: number[]
  element_modality: string
  confidence_score: number
}

// ─── SOAP OUTPUT ─────────────────────────────────────────────
export interface SOAPOutput {
  subjective: string[]
  objective: string[]
  assessment: string
  plan: string
}

// ─── 5-PHASE SESSION ENVELOPE (shared between Visual + Sound) ──
// Standardized naming per handoff doc: entry | activation | peak | regulation | integration

export type SessionPhaseName =
  | 'entry' | 'activation' | 'peak' | 'regulation' | 'integration'

export interface SessionPhase {
  name: SessionPhaseName
  duration_seconds: number
  hz_focus: number           // dominant anchor Hz for the phase
  intensity: number          // 0..1 amplitude / mix level
  binaural_offset?: number   // L/R delta in Hz (0 = no binaural)
}

// ─── SOUND PROTOCOL (renderer-ready) ─────────────────────────
// Structured for soundEngine.ts consumption. Display fields preserved
// so existing UI cards (style/duration/description) continue to render.

export type RhythmStyle =
  | 'steady' | 'syncopated' | 'call_response'
  | 'steady_or_heavy' | 'interactive' | 'corrective'

export type SoundMode =
  | 'tone_sequence' | 'ambient_drone' | 'binaural_layer' | 'pulsed_regulation'

export interface Regulator {
  name: string
  hz: number
}

export interface AspectBehavior {
  interval_style: string[]    // e.g. ['minor_2nd', 'tritone']
  chord_style: string         // 'dense' | 'cluster' | 'open' | 'alternating' | 'airy_support' | 'skewed'
  rhythm: RhythmStyle
  resolution: string          // 'delayed' | 'natural' | 'midpoint_merge' | 'supportive' | 'adaptive' | 'context_dependent'
}

export interface SoundProtocol {
  // Renderer-ready structured fields (NEW)
  mode: SoundMode
  primary_anchors: number[]
  aspect_behavior: AspectBehavior
  rhythm_style: RhythmStyle
  regulator: Regulator           // upgraded from string
  session_phases: SessionPhase[] // shared timeline with VisualProtocol
  // Display fields retained for UI cards
  style?: string
  duration?: string
  description?: string
  variants?: string[]
}

// ─── SCENT PROTOCOL ──────────────────────────────────────────
export interface ScentProtocol {
  action: string
  oils: string[]
  delivery: string
  duration: string
}

// ─── TASTE PROTOCOL ──────────────────────────────────────────
export interface TasteProtocol {
  blend_type: string
  taste_profile: string[]
  ingredients: string[]
  preparation: string
  timing: string
}

// ─── BODY PROTOCOL ───────────────────────────────────────────
export interface BodyProtocol {
  breath: string
  movement: string
  posture: string
  touch: string
  orientation: string
}

// ─── VISUAL PROTOCOL (renderer-ready) ─────────────────────────
// Consumed by VisualEngineCanvas.tsx. primary/secondary color slots
// let the renderer composite layered palettes per phase.

export type MotionType =
  | 'center_intensification' | 'oscillation' | 'collision_pulse'
  | 'continuous_expansion'  | 'harmonic_opening' | 'skewed_adjustment'

export type KaleidoscopeMode =
  | 'dense_bloom' | 'dual_reflection' | 'structured_tension'
  | 'flow_symmetry' | 'harmonic_weave' | 'adaptive_misalignment'

export interface AnimationPhase {
  name: SessionPhaseName       // shares enum with SoundProtocol.session_phases
  duration_seconds: number
  intensity: number            // 0..1 — drives opacity, scale, motion amplitude
  dominant_color: string       // hex
  motion_modifier?: string     // 'slow_inhale' | 'rapid_pulse' | 'still'
}

export interface VisualProtocol {
  // Renderer-ready structured fields (NEW)
  primary_colors: string[]       // dominant planet palette (1-3 hex)
  secondary_colors: string[]     // secondary planet palette (1-3 hex)
  regulator_color: string        // single regulator hex
  geometry_base: string          // dominant planet shape (circle, square, triangle)
  geometry_overlay: string       // aspect-driven shape from geometry.json
  motion_type: MotionType
  kaleidoscope_mode: KaleidoscopeMode
  animation_phases: AnimationPhase[]
  // Back-compat shorthand fields (some screens still read these directly)
  colors?: string[]              // = [primary[0], regulator, secondary[0]]
  geometry?: string              // = geometry_overlay (legacy alias)
  motion?: string                // = motion_type (legacy alias)
  delivery?: string[]
  description?: string
}

// Legacy alias — kept for any consumer not yet migrated
export type SightProtocol = VisualProtocol

// ─── DIAGNOSTIC OUTPUT ───────────────────────────────────────
// The car-diagnostic layer. Translates the chart pattern into:
//   1. Cosmic mechanism (what's happening astrologically)
//   2. Body layer    (what it does in your anatomy)
//   3. Action layer  (what to do about it — protocol)
//
// Powered by medicalAstrology.json (planet → anatomy → root cause)
// and cellSalts.json (sign → mineral prescription + gestation deficiency).
export interface CellSaltPrescription {
  sign: string
  saltName: string         // commonName, e.g. "Kali Phosphoricum"
  saltShort: string        // shortName,  e.g. "Kali Phos"
  epithet: string          // "The Brain Cell Salt"
  plainLanguageSignal?: string
  foodSources?: string[]
  dosing?: string
  affirmation?: string
  reason?: string          // why this salt for this user (used in gestation deficiencies)
  color?: string
  // v3 — symptom-routed display facet + honest domain-overlap match.
  displaySignal?: string   // the keynote facet matching the routed symptom (emotional or physical)
  matchReason?: string     // one-line "why this salt" for the routed symptom
  matchScore?: number      // 0-100 domain-overlap match for the routed symptom
  looseMatch?: boolean     // true when matchScore < 60 → label "loose match", not "Recommended"
}

// Symptom routing — given a user-reported symptom (e.g. "anxiety"),
// the engine matches it against medicalAstrology.rootCauseIndex,
// parses candidate planetary signatures, scores each against the
// user's natal chart + active transits, and returns the most-likely
// signature with its diagnostic prescription. This is the
// "symptom-first" entry point that makes Astryx feel like a
// diagnostic tool rather than a generic reading.
export interface SymptomRouting {
  reportedSymptom: string                  // user's raw input
  matchedRootCauseKey?: string             // normalized key (e.g. "anxiety_general")
  matchedSubtype?: string                  // subtype key if matched (e.g. "mental_loop_thinking")
  matchedSubtypeDescription?: string       // human-readable description of subtype
  matchedSignature: string                 // best-scoring signature string ("Mercury-Saturn")
  matchedPlanets: string[]                 // parsed planets from signature
  primaryPlanet: string                    // the lead planet driving the diagnostic
  activationScore: number                  // 0-100, how active this signature is
  evidence: string[]                       // explanation of why this matched
  rootCause: {
    headline:    string
    cosmicLayer: string
    bodyLayer:   string
    actionLayer: string
  }
  recommendedCellSalt?: CellSaltPrescription
}

// Daily transit signal — what's hitting the user's chart RIGHT NOW.
// This is the daily-return data layer. Recalculated every request.
export interface ActiveTransit {
  transitingPlanet: string
  transitingSign:   string
  transitingRetrograde: boolean
  natalPlanet:      string
  natalSign:        string
  aspect:           string       // "conjunction", "square", etc.
  orb:              number       // degrees from exact
  exactness:        number       // 0–1, 1 = exact today
  applying:         boolean      // intensifying (true) or fading (false)
  daysToExact:      number       // signed: + applying, − separating
  weight:           number       // ranking score
  // Plain-language interpretation pulled from medicalAstrology.transitInterpretation
  interpretation?: {
    effect:       string         // "Cortisol dysregulation. Lymphatic sluggishness."
    intervention: string         // "Ashwagandha + Calc Phos..."
    duration:     string         // "2-3 years"
  }
  /** Directive H.0.4 — landmark life events (Saturn Return etc.). When set,
   *  the transit is elevated to a distinct, weighted card — never buried as a
   *  generic transit. */
  lifeEvent?: {
    key:   string   // 'saturn-return' | 'saturn-sun' | 'saturn-moon' | 'jupiter-return'
    label: string   // "Saturn Return"
    description: string
  }
}

export interface DiagnosticOutput {
  // Chart context
  sunSign: string
  moonSign?: string
  risingSign?: string
  dominantPlanet: string

  // Daily transit weather — what's active in the sky against natal chart right now
  activeTransits: ActiveTransit[]   // ranked by weight, max 7
  headlineTransit?: ActiveTransit   // the single most important transit right now

  // The three-layer translation — the headline output
  rootCause: {
    headline:    string  // "Saturn is the dominant signature in your chart"
    cosmicLayer: string  // "Saturn–Moon square in Capricorn/Cancer"
    bodyLayer:   string  // "Cortisol dysregulation. Lymphatic sluggishness."
    actionLayer: string  // "Ashwagandha + Calc Phos + Black Tourmaline..."
  }

  // Anatomy block from medicalAstrology.json
  anatomy: {
    bodySystems:      string[]
    organs:           string[]
    endocrineGlands:  string[]
    nervousSystem:    { branch: string; brainwaveAffinity: string }
  }

  // Symptom signatures for the dominant planet under stress
  symptomSignatures: {
    headline:  string
    physical:  string[]
    emotional: string[]
    mental:    string[]
  }

  // Mineral layer — the cell salt prescription
  cellSaltPrescription: {
    primarySalt:           CellSaltPrescription  // Salt of dominant planet's ruling sign
    sunSignSalt:           CellSaltPrescription  // Daily baseline (user's natal sun sign)
    gestationDeficiencies: CellSaltPrescription[] // The 3 innate baseline deficiencies (Bonacci's rule)
  }

  // Symptom-routed diagnoses — one per reported symptom that matched
  symptomRouting?: SymptomRouting[]

  // Plain-language bridge — what a non-practitioner reads first
  plainLanguage: {
    whatItGoverns:    string
    whenItsBalanced:  string
    whenItsOff:       string
    howToRestore:     string
  }
}

// ─── UNIFIED PRESCRIPTION ────────────────────────────────────
// One cohesive prescription per planetary signature. Bundles all five
// sensory channels + crystal + cell salt + botanical + tuning fork —
// every layer keyed to the SAME planet so the protocol coheres instead
// of fragmenting. This is what the UI renders as a single prescription
// card. Multiple signatures (dominant, symptom-routed, transit-driven)
// each get their own UnifiedPrescription.
export interface UnifiedPrescription {
  // Why this prescription exists
  signature: {
    planet:       string
    source:       'dominant' | 'symptom' | 'transit'
    triggerLabel: string   // "Saturn-Moon dominant pattern" / "Your reported anxiety" / "Saturn transiting Moon"
  }

  // Headline & framing
  prescription: {
    headline:  string      // "Saturn Calibration Protocol"
    summary:   string      // 1-2 sentences from medicalAstrology plainLanguageBridge
    duration:  string      // "20-30 min session" / "Daily for 2 weeks"
  }

  // The five sensory channels — all keyed to the same planet
  fiveSenses: {
    sound:  { fork: string; hz: number;   note?: string;  instruction: string }
    scent:  { oils: string[];             delivery: string; instruction: string }
    taste:  { tea: string;  ingredients: string[];          instruction: string }
    body:   { breath: string; movement: string; placement: string; orientation?: string }
    sight:  { colors: string[]; geometry?: string;          instruction: string }
  }

  // Mineral / plant / crystal / fork cross-references
  mineral:   CellSaltPrescription | null
  botanical: SacredBotanical      | null
  crystal:   CrystalExpanded      | null
  fork:      SacredFork           | null

  // Safety + integration
  safetyNotes:     string[]   // collected from all referenced data files
  integrationNote: string     // step-by-step paragraph: how to weave the 5 senses in one session
}

// ─── FULL PROTOCOL OUTPUT ────────────────────────────────────
export interface ProtocolOutput {
  dominant_pattern: DominantPattern
  soap: SOAPOutput
  plan: {
    sound: SoundProtocol
    scent: ScentProtocol
    taste: TasteProtocol
    body: BodyProtocol
    sight: SightProtocol
  }
  // Sacred Extension Layer — populated by engine.ts via resolveSacredLayer()
  // from the five extension JSON files (botanicals, crystals, lotus, kits, forks).
  sacredLayer?: {
    botanical:     SacredBotanical | null
    crystal:       CrystalExpanded | null
    lotusSpectrum: LotusEntry[]
    dominantFork:  SacredFork | null
    starterKit:    StarterKit | null
  }
  // Diagnostic Layer — the car-diagnostic translation (cellSalts + medicalAstrology)
  diagnostic?: DiagnosticOutput

  // Unified Prescriptions — one cohesive prescription card per signature
  // (dominant, symptom-routed, transit-driven). Deduplicated by primary planet.
  prescriptions?: UnifiedPrescription[]

  // Tri-source ranked active planets (Build Directive v2.0 FIX 5)
  // Top 3 planets weighted by natal prominence + transit pressure + symptom score.
  activePlanets?: ActivePlanet[]

  // Remedy Polarity (Phase B) — the intelligence layer that determines whether
  // each detected planet needs amplification, cooling, calming, draining,
  // grounding, etc. All downstream renderers should read corrective protocols
  // from here, never amplify raw planetary character blindly.
  // Sorted by confidence descending. polarityResults[0] = strongest signal.
  polarityResults?: PolarityResultLike[]
  /** Convenience: dominant planet's polarity result (or undefined if balanced/none) */
  dominantPolarity?: PolarityResultLike
  /** Directive B.1 — the ONE ranked source of truth for the subject of the
   *  reading. Every text surface AND every audio layer reads from this; no
   *  surface ever recomputes its own "dominant". */
  signalHierarchy?: SignalHierarchy
  /** Directive J.5 — the planet the user's stated intention maps to (the fork the
   *  composer guarantees a slot). null when no intention was expressed. */
  intentionPlanet?: string | null
  /** Directive F — the elemental setting/manner of the session (corrective). */
  environment?: EnvironmentLayer
  /** CORRECT & FINISH Fix 4 — why THIS calibration. Proves the user's narrative +
   *  intention shaped the sequence (individual gets whyThisSequence; practitioner
   *  gets the full evidence list). Also feeds honest intake copy (Fix 13). */
  reasoningTrace?: ReasoningTrace
  /** Directive S — LOCAL + REFLEX + planet-anatomy placement per body-zone signal
   *  (the Reflex engine). Powers the dual-placement body map; depth via Astryx. */
  reflexPlacements?: ReflexPlacement[]
}

// ─── REASONING TRACE (CORRECT & FINISH Fix 4) ─────────────────
// Trust + testability: surface WHY the engine resolved this primary/support so
// the calibration never feels like a preset. Individual reads whyThisSequence;
// practitioner reads narrativeThemes + evidence.
export interface ReasoningTrace {
  /** Individual-facing plain sentence. */
  whyThisSequence: string
  primarySignal: { planet: string; state: string; word: string }
  secondarySupport?: { planet: string; reason: string }
  tertiaryIntegration?: { planet: string; reason: string }
  /** Human-readable themes detected in the free-text narrative (Fix 13 copy). */
  narrativeThemes: string[]
  /** Human-readable intention labels parsed from intake. */
  intentionLabels: string[]
  /** True when the free-text narrative contributed at least one signal. */
  narrativeContributed: boolean
  /** Practitioner detail — the contributing reasoning lines. */
  evidence: string[]
}

// ─── SIGNAL HIERARCHY (Directive B.1) ─────────────────────────
// surface → root → aggravator. One ranked list drives the words, the tone
// field, and the music; the session always resolves home on the primary.
export interface SignalTier {
  planet: string
  state: PolarityStateLike
  confidence_band?: ConfidenceBandLike
  role: 'surface' | 'root' | 'aggravator'
}

export interface SignalHierarchy {
  /** Symptom-driven dominant (Part A) — what the user feels. */
  primary: SignalTier
  /** The chart "root" the symptom routes to — context, NOT a competing protocol. */
  secondary?: SignalTier
  /** The current aggravator — the top-weighted active transit. */
  tertiary?: SignalTier
  /** B.1 cleanup — the planet the user's reported symptoms most implicate, when
   *  it differs from the resolved primary. Keeps the bridge visible:
   *  "you reported a Mars signal → it traces to a Sun root." */
  reportedPlanet?: string
}

// ─── ENVIRONMENT LAYER (Directive F) ──────────────────────────
// The setting + manner of the session, derived from the CORRECTION (the regulator
// element) so it obeys "never amplify" by construction — water when you're hot,
// warmth when you're low. Offered as "if you can…" invitations, never commands.
export interface EnvironmentLayer {
  /** Corrective element — the element of the primary's regulator (or the
   *  primary's own element when balanced). Fire | Earth | Air | Water. */
  element: string
  /** Astro provenance for practitioner display, e.g. "Moon · Water". */
  elementSource: string
  /** Posture follows the element: Fire/Air → projective, Water/Earth → receptive. */
  polarity: 'projective' | 'receptive'
  /** Tempo from the primary planet's sign modality. Cardinal | Fixed | Mutable. */
  modality: string
  setting: string   // "near still water — a quiet bath, or a glass of water within reach"
  posture: string   // "still, receiving inward"
  tempo: string     // "let it flow and dissolve"
  /** True when derived from the regulator (a real correction), vs the primary's own element. */
  corrective: boolean
}

// ─── REMEDY POLARITY (Phase A export) ─────────────────────────
// Re-exported here so any UI / engine consumer can read polarity from
// ProtocolOutput without importing from the engine module directly.

export type PolarityStateLike = 'excess' | 'deficiency' | 'blocked' | 'balanced'
export type ConfidenceBandLike = 'weak' | 'moderate' | 'strong'

export interface CorrectiveProtocolLike {
  indicators: string[]
  corrective_direction: string[]
  avoid: string[]
  regulator_planets: string[]
  color_palette: string[]
  herbs: string[]
  scents: string[]
  breath: string
  sound_character: string
  visual_motion: string
  scale_override: string | null
  support_style: string
}

export interface PolarityResultLike {
  planet: string
  dominant_state: PolarityStateLike
  secondary_state?: PolarityStateLike
  confidence: number
  confidence_band: ConfidenceBandLike
  scores: Record<PolarityStateLike, number>
  reasoning: string[]
  overridden: boolean
  symptomDriven?: boolean
  /** Directive I.1 — user marked this planet balanced/strong (a resource). */
  resourced?: boolean
  protocol: CorrectiveProtocolLike
}

// ─── SESSION HISTORY ─────────────────────────────────────────
export interface SessionRecord {
  id: string
  date: string
  pattern: string
  summary: string
  accentColor: string
  protocol: ProtocolOutput
}

// ─── POST-SESSION FLOW (Phase 1 — Chamber session loop) ──────
// The "After" half of the Before → During → After → Next loop. When a
// Chamber session completes, the Chamber writes a SessionSummarySnapshot
// (the "During" record) into the store and routes to the post-session
// screen. There the user reviews the summary, completes a check-in, and
// receives a Continuation Protocol — then the whole thing is saved to the
// Progress History as a ProgressEntry. (Sacred Tea matching + color therapy
// are LATER phases; tea here is a placeholder from the existing taste protocol.)

/** The compact "During" record the Chamber hands off to the post-session page. */
export interface SessionSummarySnapshot {
  planetaryCarrier: string         // dominant planet — the session's carrier signal
  signalState: string              // display word (resonance vocab, e.g. "Compressed")
  signalStateRaw: string           // engine state: excess|deficiency|blocked|balanced
  correctiveDirection: string      // the calibration response sentence
  selectedSessionContainer: string // Fix 3 — '15_PERSONAL' | '30_DEEP' | '60_PRACTITIONER'
  intention: string[]              // Fix 3 — the user's stated intention(s) at intake
  forkSequence: string[]           // fork planet names, in sequence order (deduped)
  bodyPlacements: string[]         // anatomical placement labels touched this session
  primaryBodyPlacement: string     // the main placement to observe afterward
  sessionDurationSec: number       // actual time the chamber ran
  chamberFocus: string             // one-sentence focus of the session
  element: string                  // corrective element (Fire|Earth|Air|Water)
  chakraOverlay?: string           // primary chakra touched
  // Continuation source data (placeholders later phases will deepen)
  tasteTea?: string                // tea name (placeholder — NOT the matching engine)
  tasteIngredients: string[]
  breathProtocol: string           // breath pattern name
  colorProtocol?: string           // hex color
  // "Before" state — for before/after comparison
  preSessionSymptoms: string[]
  preSessionEmotional: string[]
  energyBefore?: number            // v2 FIX 1 — pre-session energy 1–10 (baseline)
  // Practitioner context (drives optional client-session save)
  isPractitioner: boolean
  activeClientId: string | null
  forkPlanetsUsed: string[]
  crystalsUsed: string[]
  accentColor: string
  protocolSnapshot?: any           // full ProtocolOutput for client history
}

/** The user's post-session check-in answers. */
export interface PostSessionAnswers {
  feeling: string[]                // multi-select mood
  energyLevel?: number             // 1–10
  bodyState: string[]              // multi-select
  mentalState: string[]            // multi-select
  placementAccuracy?: 'Yes' | 'Somewhat' | 'No' | 'Not sure'
  feltMostWhere?: string           // optional free text
  chamberSupport?: 'Yes' | 'Somewhat' | 'No' | 'Too intense' | 'Too soft'
  notes?: string                   // free text
  // Practitioner-only
  practitionerNotes?: string
  vagalToneRating?: number         // 1–5
}

/** The generated continuation protocol — what to carry forward. */
export interface ContinuationProtocol {
  focus: string
  forkFollowUp: string
  teaPlaceholder: string           // from existing taste protocol (placeholder layer)
  breath: string
  color?: string                   // hex
  bodyAreaToObserve: string
  whatToAvoid: string
  nextCheckIn: string
  responseNote?: string            // answer-driven guidance line (directive logic)
}

/** A saved entry in the Progress History (the After → Next record). */
export interface ProgressEntry {
  id: string
  dateTime: string                 // ISO timestamp — the SOURCE OF TRUTH; display
                                   // labels (date/time) are derived at RENDER time
                                   // in the user's LOCAL zone, never stored (Fix 3).
  userMode: AppMode
  planetaryCarrier: string
  signalState: string
  correctiveDirection: string
  selectedSessionContainer?: string // Fix 3 — which container ran (15/30/60)
  intention?: string[]              // Fix 3 — stated intention at intake
  sacredTeaSupport?: string         // Fix 3 — recommended prepared blend (display)
  forkSequence: string[]
  bodyPlacements: string[]
  sessionDuration: number          // seconds
  preSessionState: { symptoms: string[]; emotional: string[] }
  postSessionState: PostSessionAnswers
  energyBefore?: number            // v2 FIX 1 — pre-session energy 1–10 (BEFORE)
  energyRating?: number            // post-session energy 1–10 (AFTER)
  bodyState: string[]
  mentalState: string[]
  chamberSupportRating?: string
  forkPlacementRating?: string
  notes?: string
  continuationProtocol: ContinuationProtocol
}

// ─── APP STATE ───────────────────────────────────────────────
export type AppScreen =
  | 'landing'
  | 'auth'
  | 'payment'
  | 'subscribe-gate'
  | 'consent'
  | 'intake'
  | 'analysis'
  | 'daily-checkin'
  | 'dashboard'
  | 'today-signal'
  | 'results'
  | 'session'
  | 'post-session'
  | 'practitioner'
  | 'history'
  | 'settings'
  | 'body-system'
  | 'client-roster'
  | 'home'
  | 'chart'
  | 'body-grid'
  | 'library'
  | 'fork-access'
  | 'session-mode'

// ─── MUSIC LIBRARY (Directive I.5) ───────────────────────────
// The audio folder-state a track lives under (mirrors AudioFolderState in astryxAudioLibrary).
export type SoundFolderState = 'nat' | 'exc' | 'def' | 'blk'

/** A reference to one track — enough to rebuild its URL via buildTrackUrl. */
export interface SavedTrack {
  planet: string
  state: SoundFolderState
  filename: string
}

/** A user-assembled "build your own chamber" sequence. */
export interface CustomSequence {
  id: string
  name: string
  tracks: SavedTrack[]
  createdAt: string
}

// ─── PRACTITIONER LENS (Build Directive Fix 4) ───────────────
// User/practitioner-selected modality. Reconfigures the practitioner view
// to show the slice of Astryx relevant to their scope of practice.
// Persisted in Zustand. Default: 'individual'.
export type PractitionerLens =
  | 'individual'
  | 'medical_astrologer'
  | 'reiki'
  | 'bodyworker'
  | 'naturopath_herbalist'
  | 'ayurvedic'
  | 'acupuncturist_tcm'
  | 'pastoral_spiritual'

// ─── CLIENT ROSTER (Build Directive Fix 2) ───────────────────
// A practitioner manages multiple clients. Each ClientRecord stores their
// birth data + practitioner-attested informed consent. ClientSession
// captures what happened in each session for history + progress tracking.
export interface ClientRecord {
  id: string                    // uuid — crypto.randomUUID()
  name: string
  birthDate: string             // YYYY-MM-DD
  birthTime: string             // HH:MM | 'unknown'
  birthLocation: string         // city, country
  birthCoords?: { lat: number; lon: number; tzOffset?: number }
  modality: string              // the practitioner's modality for this client
  notes: string                 // free text
  consentConfirmed: boolean     // REQUIRED — practitioner attests informed consent (COMPLIANCE.md §10)
  createdAt: string             // ISO timestamp
  lastSessionAt?: string        // ISO timestamp, updated after each session
}

export interface ClientSession {
  id: string
  clientId: string
  date: string                  // ISO timestamp
  forksUsed: string[]           // planet names of forks applied
  crystalsUsed: string[]
  vagalToneRating?: number      // 1-5 — 1=Dysregulated, 5=Deep Coherence
  notes: string
  protocolSnapshot?: any        // full ProtocolOutput at session time (snapshot for history)
}

export type AppMode = 'user' | 'practitioner'
export type BackgroundState = 'idle' | 'active' | 'session'

// ─── PLANET DATA ─────────────────────────────────────────────
export interface PlanetData {
  planet: string
  anchor_hz: number
  alt_anchor_hz?: number
  function: string[]
  systems: string[]
  taste_bias: string[]
  color_bias: string[]
  sound_role: string[]
  body_role: string[]
  scent_bias: string[]
}

// ─── TUNING FORK ─────────────────────────────────────────────
export interface TuningFork {
  label: string
  hz: string
  note: string
  color: string
  planet: string
}

// ─── SACRED EXTENSION TYPES ──────────────────────────────────
// Five proprietary Astryx layers that sit on top of the base library.
// Source files: sacredBotanicals.json · crystalsExpanded.json ·
// lotusSpectrum.json · starterKits.json · sacredTones_nervousSystem.json

export interface SacredBotanical {
  planet: string
  sacredBotanical: string
  latinName: string
  tier: number
  color: string
  colorVibration: string
  esotericSignature: string
  biologicalSystem: string
  biologicalMechanism: string
  endocrineTarget: string
  nervousSystem: string
  brainwaveAffinity: string
  wellnessBenefits: string[]
  teaSafe: boolean
  teaProfile: string
  traditionalUse: string
  bodyPlacement: string
  safetyNote: string
  kitProduct?: string
  kitEligible?: boolean
}

export interface CrystalExpanded {
  planet: string
  featuredCrystal: string
  existingGems: string[]
  metal: string
  hex: string
  featuredCrystalData: {
    name: string
    mineralComposition: string
    biologicalMechanism: string
    biologicalSystem: string
    endocrineTarget: string
    nervousSystem: string
    bodyPlacement: string
    placementNote: string
    safetyNote: string
    kitEligible?: boolean
  }
}

export interface LotusEntry {
  variety: string
  latinName: string
  sanskritName: string
  primaryPlanet: string
  secondaryPlanet: string
  element: string
  chakra: string
  color: string
  colorVibration: string
  esotericSignature: string
  biologicalSystem: string
  biologicalMechanism: string
  endocrineTarget: string
  nervousSystem: string
  wellnessBenefits: string[]
  teaSafe: boolean
  teaProfile: string
  traditionalUse: string
  bodyPlacement: string
  safetyNote: string
  kitEligible?: boolean
}

export interface StarterKit {
  kitId: string
  kitName: string
  tagline: string
  description: string
  variants: string
  contents: string[]
  shopLink: string
  proposedPrice: string
  appIntegration: string
  kitEligible: boolean
}

// Sacred Tones — physical tuning fork specs (Hz as a string in the JSON;
// the engine never does math on it, only renders it).
export interface SacredFork {
  planet: string
  chakra: string
  hz: string          // PRIMARY IDENTITY — Cousto cosmic-octave Hz (sequence/placement/display)
  // v2 FIX E — labeled FALLBACK only: the chakra's Solfeggio tone, so a user
  // WITHOUT the (future) dedicated Solfeggio fork still gets a chakra tone from
  // their planetary fork. NOT the fork's native frequency. Present on the 7
  // chakra forks only; the 5 Extended forks are Cousto-only (field absent).
  solfeggioFallback?: number
  note: string
  color: string
  nervePlexus: string
  boneApplicationPoint: string
  vagusConnection: string
  vagusStrength: string
  brainwaveAffinity: string
  brainwaveState: string
  ANSEffect: string
  clinicalNote: string
}
