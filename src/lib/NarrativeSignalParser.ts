/**
 * ASTRYX — Narrative Signal Parser  (CORRECT & FINISH Directive · Fix 4 + Fix 13)
 * ════════════════════════════════════════════════════════════════════════════
 * The user's free-text check-in ("what's going on, in your own words") MUST shape
 * the calibration. Before this module, intake.narrative did nothing unless the
 * Claude API happened to return narrativeScores — so a typed paragraph could not
 * move the sequence. That is the "preset" smell the directive calls out.
 *
 * DESIGN (deterministic, no randomness, no network):
 *   We detect themes in the narrative and map each to canonical symptoms.json
 *   SLUGS. Those slugs already carry related_planets + state_signal + weight +
 *   corrective_direction, so parsed narrative flows through the EXACT same
 *   RemedyPolarityEngine + tri-source scoring path as checkbox symptoms — no
 *   parallel scoring system, no double-counting risk. The parser is purely a
 *   free-text → slug + theme-label translator.
 *
 * OUTPUTS:
 *   slugs        canonical symptoms.json slugs to fold into the symptom signal
 *   themes       {id,label} hits — for the reasoning trace + honest intake copy
 *   planetHints  planet → soft weight (0-100) — feeds intake.narrativeScores when
 *                the Claude API did not (computeSymptomScore reads narrativeScores)
 *
 * Intention is parsed separately (parseIntention) — it does not name a PROBLEM,
 * it names the DESIRED corrective direction, so it biases support/regulator and
 * breath rather than the primary signal.
 */

import symptomsData from '@/data/symptoms.json'

interface SymptomEntry {
  symptom: string
  related_planets?: string[]
  state_signal?: string
  weight?: number
}
const SYMPTOMS = symptomsData as SymptomEntry[]
const KNOWN_SLUGS = new Set(SYMPTOMS.map((s) => s.symptom))

export interface NarrativeTheme {
  id: string
  /** Human-facing label for the reasoning trace + intake copy. */
  label: string
  /** Lowercase substrings / words that signal this theme. */
  keywords: string[]
  /** Canonical symptoms.json slugs this theme contributes (must exist in symptoms.json). */
  slugs: string[]
}

// ─── NARRATIVE THEME TABLE ──────────────────────────────────────────────────
// Each theme maps to slugs that EXIST in symptoms.json (verified against the
// file). The planet + state come from the slug, never invented here. Ordered
// roughly specific → general; all matching themes contribute (additive).
export const NARRATIVE_THEMES: NarrativeTheme[] = [
  {
    id: 'mental_acceleration',
    label: 'mental acceleration',
    keywords: ['racing thought', 'racing thoughts', 'mind racing', 'cant slow', "can't slow", 'thoughts moving', 'too fast', 'spinning', 'mind wont', "mind won't", 'busy mind'],
    slugs: ['racing_thoughts', 'overthinking'],
  },
  {
    id: 'mental_scatter',
    label: 'mental scatter',
    keywords: ['scattered', 'cant focus', "can't focus", 'unfocused', 'distracted', 'all over the place', 'cant concentrate', "can't concentrate"],
    slugs: ['scattered_attention'],
  },
  {
    id: 'nervous_charge',
    label: 'nervous-system charge / overstimulation',
    keywords: ['overstimulated', 'overstimulation', 'wired', 'on edge', 'jittery', 'restless', 'cant sit still', "can't sit still", 'buzzing', 'electric'],
    slugs: ['nervous_overstimulation'],
  },
  {
    id: 'anxiety',
    label: 'anxiety',
    keywords: ['anxious', 'anxiety', 'panic', 'worried', 'worry', 'nervous', 'dread', 'uneasy'],
    slugs: ['anxiety'],
  },
  {
    id: 'sleeplessness',
    label: 'disrupted sleep',
    keywords: ['cant sleep', "can't sleep", 'insomnia', 'cannot sleep', 'awake all night', 'no sleep', 'wired at night'],
    slugs: ['insomnia'],
  },
  {
    id: 'heat_anger',
    label: 'heat / anger / frustration',
    keywords: ['angry', 'anger', 'rage', 'furious', 'irritated', 'irritable', 'frustrated', 'frustration', 'impatient', 'hot', 'heated', 'fed up', 'short fuse', 'snapping'],
    slugs: ['anger', 'irritation', 'heat', 'frustration'],
  },
  {
    id: 'depleted_vitality',
    label: 'vitality depletion',
    keywords: ['tired', 'exhausted', 'fatigue', 'fatigued', 'drained', 'depleted', 'no energy', 'low energy', 'burnt out', 'burned out', 'dim', 'disconnected from my energy', 'running on empty', 'worn out'],
    slugs: ['fatigue', 'low_vitality', 'low_energy'],
  },
  {
    id: 'low_confidence',
    label: 'low confidence',
    keywords: ['low confidence', 'no confidence', 'insecure', 'small', 'invisible', 'unsure of myself', 'doubting myself', 'not good enough'],
    slugs: ['poor_confidence'],
  },
  {
    id: 'low_drive',
    label: 'low drive / motivation',
    keywords: ['no motivation', 'unmotivated', 'cant get going', "can't get going", 'no drive', 'lethargic', 'apathetic', 'cant start', "can't start"],
    slugs: ['low_drive', 'low_motivation'],
  },
  {
    id: 'scarcity_worth',
    label: 'scarcity / value wounds',
    keywords: ['money', 'financial', 'finances', 'scarcity', 'broke', 'cant afford', "can't afford", 'unsupported', 'not enough', 'worthless', 'self-worth', 'self worth', 'my worth', 'undervalued'],
    slugs: ['lack_of_pleasure', 'pessimism'],
  },
  {
    id: 'grief_tenderness',
    label: 'emotional tenderness / grief',
    keywords: ['grief', 'grieving', 'sad', 'sadness', 'tender', 'tearful', 'crying', 'heartbroken', 'heartbreak', 'lonely', 'loneliness', 'overwhelmed', 'overwhelm', 'need comfort', 'fragile', 'raw'],
    slugs: ['emotional_overwhelm', 'hypersensitivity'],
  },
  {
    id: 'relational_pain',
    label: 'relationship pain',
    keywords: ['relationship', 'breakup', 'break up', 'rejected', 'unloved', 'unwanted', 'disconnected from people', 'no connection', 'pushed away'],
    slugs: ['emotional_dryness', 'lack_of_pleasure'],
  },
  {
    id: 'fog_dissociation',
    label: 'fog / dissociation',
    keywords: ['foggy', 'fog', 'brain fog', 'unclear', 'spacey', 'spaced out', 'dissociat', 'detached', 'numb', 'far away', 'not here', 'cant think straight', "can't think straight", 'hazy'],
    slugs: ['fog', 'confusion', 'dissociation'],
  },
  {
    id: 'intensity_control',
    label: 'intensity / control / shadow',
    keywords: ['control', 'controlling', 'obsess', 'obsessive', 'cant let go', "can't let go", 'fixated', 'intense', 'consumed', 'power', 'shadow', 'compuls'],
    slugs: ['control_issues', 'obsession', 'fixation'],
  },
  {
    id: 'stuck_heavy',
    label: 'stuck / heavy / restricted',
    keywords: ['stuck', 'blocked', 'heavy', 'restricted', 'trapped', 'cant move forward', "can't move forward", 'weighed down', 'frozen', 'rigid', 'walled', 'cant move', "can't move"],
    slugs: ['restriction', 'tension', 'tightness', 'frustration'],
  },
  {
    id: 'heaviness_depression',
    label: 'heaviness / low mood',
    keywords: ['depress', 'hopeless', 'flat', 'empty', 'darkness', 'cant get up', "can't get up", 'no point'],
    slugs: ['depression'],
  },
  {
    id: 'overexpansion',
    label: 'overdoing / overexpansion',
    keywords: ['too much', 'overdoing', 'overextend', 'overwhelmed with commitments', 'taking on too much', 'cant say no', "can't say no", 'spread thin', 'overcommitted', 'excess', 'appetite', 'craving'],
    slugs: ['excess_appetite', 'indulgence'],
  },
  {
    id: 'fear_burden',
    label: 'fear / burden',
    keywords: ['afraid', 'fear', 'fearful', 'scared', 'terrified', 'burden', 'burdened', 'pressure', 'too much weight', 'responsibility crushing'],
    slugs: ['fear', 'pressure'],
  },
]

export interface NarrativeParseResult {
  /** Canonical symptoms.json slugs to fold into the symptom signal. */
  slugs: string[]
  /** Detected themes (for reasoning trace + honest intake copy). */
  themes: { id: string; label: string }[]
  /** Plain-language labels of detected themes (deduped). */
  themeLabels: string[]
  /** planet → soft 0-100 hint (feeds narrativeScores when API didn't). */
  planetHints: Record<string, number>
  /** True when the narrative produced at least one usable signal. */
  matched: boolean
}

const EMPTY: NarrativeParseResult = { slugs: [], themes: [], themeLabels: [], planetHints: {}, matched: false }

/** Lightweight normalization — lowercase, collapse whitespace, keep letters/spaces. */
function norm(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim()
}

/**
 * Parse a free-text narrative into canonical symptom slugs + theme labels.
 * Deterministic; safe on empty/garbage input (returns EMPTY).
 */
export function parseNarrative(narrative?: string): NarrativeParseResult {
  if (!narrative || !narrative.trim()) return EMPTY
  const text = norm(narrative)
  if (text.length < 3) return EMPTY

  const slugSet = new Set<string>()
  const themes: { id: string; label: string }[] = []
  const planetHints: Record<string, number> = {}

  for (const theme of NARRATIVE_THEMES) {
    const hit = theme.keywords.some((kw) => text.includes(kw))
    if (!hit) continue
    themes.push({ id: theme.id, label: theme.label })
    for (const slug of theme.slugs) {
      if (KNOWN_SLUGS.has(slug)) slugSet.add(slug)
    }
  }

  // Build planet hints from the matched slugs (planet weight ≈ slug weight,
  // scaled to the 0-100 narrativeScores convention computeSymptomScore expects).
  for (const slug of Array.from(slugSet)) {
    const entry = SYMPTOMS.find((s) => s.symptom === slug)
    if (!entry) continue
    const w = (entry.weight ?? 1) * 10 // 0-100 scale (computeSymptomScore divides by 10)
    for (const p of entry.related_planets ?? []) {
      planetHints[p] = Math.min(100, (planetHints[p] ?? 0) + w)
    }
  }

  const themeLabels = Array.from(new Set(themes.map((t) => t.label)))
  return {
    slugs: Array.from(slugSet),
    themes,
    themeLabels,
    planetHints,
    matched: slugSet.size > 0,
  }
}

// ─── INTENTION → CORRECTIVE SUPPORT ─────────────────────────────────────────
// Intention does NOT name the problem — it names the desired direction. So it
// biases the SECONDARY support / regulator choice and the breath/close, never
// the primary signal. Maps to planet "support preferences" the hierarchy builder
// and polarity regulator-ordering can honor. Planets here are SUPPORT candidates.

export interface IntentionSupport {
  id: string
  label: string
  keywords: string[]
  /** Planets that best deliver this intention as SUPPORT (ordered preference). */
  supportPlanets: string[]
  /** Suggested breath family token (matches engine breathLabel keys). */
  breath?: string
}

export const INTENTION_SUPPORTS: IntentionSupport[] = [
  { id: 'focus',       label: 'focus',            keywords: ['focus', 'concentrate', 'clarity of mind', 'sharp'], supportPlanets: ['Mercury', 'Saturn'], breath: 'box_breathing' },
  { id: 'calm',        label: 'calm',             keywords: ['calm', 'calmer', 'peace', 'settle', 'relax', 'ease'], supportPlanets: ['Moon', 'Saturn'], breath: 'extended_exhale' },
  { id: 'energy',      label: 'energy',           keywords: ['energy', 'energized', 'vitality', 'wake up', 'aliveness'], supportPlanets: ['Sun', 'Mars'], breath: 'balanced_activating' },
  { id: 'release',     label: 'release',          keywords: ['release', 'let go', 'let it go', 'surrender', 'unburden'], supportPlanets: ['Pluto', 'Moon'], breath: 'long_exhale_release' },
  { id: 'confidence',  label: 'confidence',       keywords: ['confidence', 'confident', 'self-worth', 'self worth', 'empower'], supportPlanets: ['Sun', 'Jupiter'], breath: 'warm_expansive' },
  { id: 'emotional',   label: 'emotional balance', keywords: ['emotional balance', 'feel steady', 'emotional steadiness', 'heart'], supportPlanets: ['Moon', 'Venus'], breath: 'soft_extended' },
  { id: 'grounding',   label: 'grounding',        keywords: ['ground', 'grounded', 'grounding', 'rooted', 'stable', 'stability'], supportPlanets: ['Saturn'], breath: 'soft_extended' },
  { id: 'clarity',     label: 'clarity',          keywords: ['clarity', 'clear', 'clear-headed', 'see clearly'], supportPlanets: ['Mercury', 'Sun'], breath: 'box_breathing' },
  { id: 'protection',  label: 'protection / boundaries', keywords: ['boundaries', 'boundary', 'protect', 'protection', 'safe'], supportPlanets: ['Saturn', 'Mars'], breath: 'box_breathing' },
  { id: 'love',        label: 'love / softness',  keywords: ['love', 'softness', 'tenderness', 'compassion', 'gentle'], supportPlanets: ['Venus', 'Moon'], breath: 'heart_opening' },
  { id: 'creativity',  label: 'creativity',       keywords: ['creativ', 'inspired', 'flow', 'express'], supportPlanets: ['Venus', 'Sun', 'Mercury'], breath: 'expansive_inhale' },
  { id: 'sleep',       label: 'sleep / rest',     keywords: ['sleep', 'rest', 'restore', 'deep rest'], supportPlanets: ['Moon', 'Neptune', 'Saturn'], breath: 'extended_exhale' },
  { id: 'motivation',  label: 'motivation',       keywords: ['motivation', 'motivated', 'drive', 'get going', 'momentum'], supportPlanets: ['Sun', 'Mars', 'Jupiter'], breath: 'balanced_activating' },
]

export interface IntentionParseResult {
  /** Support planets in priority order (deduped) across all matched intentions. */
  supportPlanets: string[]
  /** Matched intention labels (for reasoning trace). */
  labels: string[]
  /** First matched breath family (suggestion only). */
  breath?: string
  matched: boolean
}

/**
 * Parse intention(s) — accepts the multi-select `intention[]` and/or the open
 * `intentionText`. Returns SUPPORT planet preferences + a breath suggestion.
 */
export function parseIntention(
  intention?: string[] | string,
  intentionText?: string,
): IntentionParseResult {
  const parts: string[] = []
  if (Array.isArray(intention)) parts.push(...intention)
  else if (typeof intention === 'string') parts.push(intention)
  if (intentionText) parts.push(intentionText)
  const text = norm(parts.join(' '))
  if (!text) return { supportPlanets: [], labels: [], matched: false }

  const support: string[] = []
  const labels: string[] = []
  let breath: string | undefined
  for (const it of INTENTION_SUPPORTS) {
    if (!it.keywords.some((kw) => text.includes(kw))) continue
    labels.push(it.label)
    if (!breath) breath = it.breath
    for (const p of it.supportPlanets) if (!support.includes(p)) support.push(p)
  }
  return { supportPlanets: support, labels, breath, matched: support.length > 0 }
}
