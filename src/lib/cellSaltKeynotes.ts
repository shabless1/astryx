/**
 * ASTRYX — Cell-Salt Keynotes + Domain Routing  (Directive v3.0)
 * ════════════════════════════════════════════════════════════════════════════
 * Surgical fix for the symptom-routed "Recommended Cell Salt" mismatch. Each
 * tissue salt has MULTIPLE keynotes (a physical lead AND an emotional/mental
 * one). cellSalts.json stores one description (the physical lead, in
 * `plainLanguageSignal`) which was shown regardless of which symptom routed
 * there — so a correct pairing (e.g. scarcity → Calc Fluor) printed the physical
 * "skin/veins" line and looked random.
 *
 * This is an ADDITIVE layer — it does NOT modify cellSalts.json, so the Mineral
 * Foundation + Carey/Bonacci gestation-rule surfaces (which read that file) are
 * untouched. The physical facet is still cellSalts.json `plainLanguageSignal`;
 * here we add the EMOTIONAL facet + DOMAIN tags + the symptom→salt routing.
 *
 * Compliance: all copy is traditional/educational, non-diagnostic
 * ("traditionally associated with…"). Keyed by SIGN (the stable key in
 * cellSalts.json: Aries→Kali Phos, … per the Carey/Bonacci zodiac mapping).
 */

export interface SaltKeynote {
  sign: string
  short: string
  /** Emotional / mental keynote (the NEW facet). Compliance-safe. */
  emotional: string
  /** Short clause for the one-line "why". */
  whyShort: string
  /** Somatic / emotional tags used for symptom↔salt matching. */
  domains: string[]
}

// Reference Table 1 — the 12 salts (Carey/Bonacci zodiac mapping the app uses).
export const SALT_KEYNOTES: Record<string, SaltKeynote> = {
  Aries: {
    sign: 'Aries', short: 'Kali Phos',
    emotional: 'Traditionally associated with anxiety, nervous dread, and worry-driven sleeplessness — the nerve salt for a mind that won’t settle.',
    whyShort: 'nerves and a restless, sleepless mind',
    domains: ['nerves', 'sleep', 'anxiety', 'mental-fatigue', 'fog'],
  },
  Taurus: {
    sign: 'Taurus', short: 'Nat Sulph',
    emotional: 'Traditionally associated with heaviness and low mood that travels with congestion — holding onto old emotion.',
    whyShort: 'heaviness, water retention, and a congested system',
    domains: ['liver', 'water-retention', 'heaviness', 'sluggish', 'detox'],
  },
  Gemini: {
    sign: 'Gemini', short: 'Kali Mur',
    emotional: 'Traditionally associated with sluggish, congested thinking and mental heaviness.',
    whyShort: 'mucus and lymphatic congestion',
    domains: ['mucus', 'lymph', 'congestion', 'sluggish-mind'],
  },
  Cancer: {
    sign: 'Cancer', short: 'Calc Fluor',
    emotional: 'Traditionally associated with groundless fear about money and security — a sense of instability at the foundation.',
    whyShort: 'security and scarcity fear, and tissue tone',
    domains: ['security-fear', 'scarcity', 'finances', 'instability', 'connective-tissue'],
  },
  Leo: {
    sign: 'Leo', short: 'Mag Phos',
    emotional: 'Traditionally associated with tension you can’t release — wound-tight and unable to relax.',
    whyShort: 'cramps, spasm, and wound-tight tension',
    domains: ['cramps', 'spasm', 'nerve-pain', 'tension', 'restlessness'],
  },
  Virgo: {
    sign: 'Virgo', short: 'Kali Sulph',
    emotional: 'Traditionally associated with restlessness eased by movement, and an evening fog.',
    whyShort: 'oxygen to the cells, skin, and shifting fog',
    domains: ['oxygen', 'skin', 'fog', 'restlessness'],
  },
  Libra: {
    sign: 'Libra', short: 'Nat Phos',
    emotional: 'Traditionally associated with worry-driven acidity and indecision.',
    whyShort: 'acidity, digestion, and indecision',
    domains: ['acidity', 'digestion', 'ph', 'indecision'],
  },
  Scorpio: {
    sign: 'Scorpio', short: 'Calc Sulph',
    emotional: 'Traditionally associated with festering, stuck emotional wounds seeking release and transformation.',
    whyShort: 'wound healing and emotional release',
    domains: ['wound-healing', 'skin', 'detox', 'emotional-release'],
  },
  Sagittarius: {
    sign: 'Sagittarius', short: 'Silica',
    emotional: 'Traditionally associated with low grit and stamina, oversensitivity, and trouble following through.',
    whyShort: 'stamina, grit, and connective-tissue cleansing',
    domains: ['connective-cleanse', 'stamina', 'confidence', 'expeller'],
  },
  Capricorn: {
    sign: 'Capricorn', short: 'Calc Phos',
    emotional: 'Traditionally associated with being exhausted to the foundation — the builder salt for depletion and slow recovery.',
    whyShort: 'deep depletion and rebuilding from the foundation',
    domains: ['bones', 'foundation', 'recovery', 'depletion', 'vitality'],
  },
  Aquarius: {
    sign: 'Aquarius', short: 'Nat Mur',
    emotional: 'Traditionally associated with grief, suppressed sorrow, and dwelling on the past.',
    whyShort: 'grief, tears, and fluid balance',
    domains: ['grief', 'fluid-balance', 'emotional-water', 'loss', 'sleep'],
  },
  Pisces: {
    sign: 'Pisces', short: 'Ferrum Phos',
    emotional: 'Traditionally associated with vitality depletion, low drive, and pallor.',
    whyShort: 'inflammation, oxygen, and vitality',
    domains: ['inflammation', 'oxygen', 'vitality', 'fatigue', 'fever'],
  },
}

type FacetAxis = 'emotional' | 'physical' | 'both'

interface SymptomDomainRule {
  match: string[]          // lowercase substrings of the reported symptom
  domains: string[]        // the symptom's somatic/emotional domain tags
  axis: FacetAxis          // which facet to display
  primarySign: string      // the salt (by sign) this symptom should route to
  altSign?: string
}

// Reference Table 2 — symptom → domain routing.
const SYMPTOM_DOMAIN_RULES: SymptomDomainRule[] = [
  { match: ['scarcity', 'financial', 'finance', 'money', 'security', 'worth'], domains: ['scarcity', 'security-fear', 'finances'], axis: 'emotional', primarySign: 'Cancer' },                 // Calc Fluor
  { match: ['sleep', 'insomnia'],                                              domains: ['sleep', 'nerves'],                        axis: 'emotional', primarySign: 'Aries', altSign: 'Aquarius' }, // Kali Phos / Nat Mur
  { match: ['anxious', 'anxiety', 'restless', 'overstimul', 'electric', 'nervous'], domains: ['anxiety', 'nerves'],                axis: 'emotional', primarySign: 'Aries', altSign: 'Leo' },      // Kali Phos / Mag Phos
  { match: ['exhaust', 'depleted', 'burnout', 'fatigue', 'tired', 'drained'],  domains: ['depletion', 'vitality'],                  axis: 'both',      primarySign: 'Capricorn', altSign: 'Pisces' }, // Calc Phos / Ferrum Phos
  { match: ['identity', 'not myself', 'purpose'],                              domains: ['vitality', 'foundation'],                 axis: 'emotional', primarySign: 'Capricorn', altSign: 'Pisces' },
  { match: ['fog', 'foggy', 'scattered', 'unclear', 'brain fog'],              domains: ['fog', 'nerves'],                          axis: 'emotional', primarySign: 'Aries', altSign: 'Virgo' },
  { match: ['inflam'],                                                         domains: ['inflammation'],                           axis: 'physical',  primarySign: 'Pisces' },                       // Ferrum Phos
  { match: ['heavy', 'swollen', 'sluggish', 'retention', 'bloat'],             domains: ['heaviness', 'liver'],                     axis: 'physical',  primarySign: 'Taurus' },                       // Nat Sulph
  { match: ['disconnect', 'grief', 'loss', 'lonely', 'sorrow', 'tender', 'tearful'], domains: ['grief', 'loss'],                   axis: 'emotional', primarySign: 'Aquarius' },                    // Nat Mur
  { match: ['blocked', 'stuck', 'congest'],                                    domains: ['congestion', 'expeller'],                 axis: 'physical',  primarySign: 'Gemini', altSign: 'Sagittarius' }, // Kali Mur / Silica
  { match: ['cramp', 'spasm', 'shooting', 'tension', 'tight'],                 domains: ['cramps', 'spasm'],                        axis: 'physical',  primarySign: 'Leo' },                          // Mag Phos
]

export interface SymptomSaltResolution {
  sign: string                       // chosen salt's sign (look up the raw entry by this)
  short: string                      // chosen salt short name
  facetAxis: 'emotional' | 'physical'
  score: number                      // 0-100 domain-overlap match (honest)
  why: string                        // one-line reason
  loose: boolean                     // true when score < 60
}

function overlapCount(sign: string | undefined, symptomDomains: string[]): number {
  if (!sign) return 0
  const k = SALT_KEYNOTES[sign]
  if (!k) return 0
  return k.domains.filter((d) => symptomDomains.includes(d)).length
}

/**
 * Resolve a routed symptom to the best-fitting salt by DOMAIN overlap.
 * Prefers the sign-ruled salt when it overlaps the symptom domain (keeps
 * astrological coherence); otherwise re-routes to the domain-matched salt.
 * Returns null when the symptom has no known domain (caller keeps prior behavior).
 */
export function resolveSymptomSalt(reported: string, signRuledSign?: string): SymptomSaltResolution | null {
  const text = (reported || '').toLowerCase()
  const rule = SYMPTOM_DOMAIN_RULES.find((r) => r.match.some((m) => text.includes(m)))
  if (!rule) return null

  // Prefer the sign-ruled salt IF it overlaps; else the rule's primary salt.
  const signOverlap = overlapCount(signRuledSign, rule.domains)
  const chosenSign = signRuledSign && signOverlap > 0 && SALT_KEYNOTES[signRuledSign]
    ? signRuledSign
    : (SALT_KEYNOTES[rule.primarySign] ? rule.primarySign : (rule.altSign ?? rule.primarySign))

  const k = SALT_KEYNOTES[chosenSign]
  if (!k) return null
  const ov = overlapCount(chosenSign, rule.domains)
  // Honest score: 1 overlap = 60 (borderline), 2 = 80, 3 = 100; 0 = 40 (loose).
  const score = Math.max(0, Math.min(100, 40 + ov * 20))
  const facetAxis: 'emotional' | 'physical' = rule.axis === 'physical' ? 'physical' : 'emotional'
  const why = `${k.short} — traditionally associated with ${k.whyShort}, matching your reported “${reported}.”`
  return { sign: chosenSign, short: k.short, facetAxis, score, loose: score < 60, why }
}

/** FIX D — every rule's primary salt must overlap the symptom domain by ≥1 tag. */
export function validateSaltDomains(): string[] {
  const problems: string[] = []
  for (const r of SYMPTOM_DOMAIN_RULES) {
    const k = SALT_KEYNOTES[r.primarySign]
    if (!k) { problems.push(`No keynote for primary sign ${r.primarySign} (rule "${r.match[0]}")`); continue }
    if (overlapCount(r.primarySign, r.domains) < 1) {
      problems.push(`Rule "${r.match[0]}" → ${k.short} has 0 domain overlap`)
    }
  }
  return problems
}

// Dev-time assertion (log, never crash production). Ships clean = no warnings.
if (process.env.NODE_ENV !== 'production') {
  const probs = validateSaltDomains()
  if (probs.length) console.warn('[cellSaltKeynotes] symptom→salt domain overlap issues:', probs)
}
