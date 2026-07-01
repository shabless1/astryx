/**
 * ASTRYX — Sacred Tea Blend Profiles (Phase 2)
 *
 * The APPROVED Sacred Tea / House of MahMah Tea inventory + per-blend matching
 * metadata. This is a product-matching convenience layer, NOT the remedy system.
 *
 * RULES (non-negotiable):
 *  • Only these ten real products may ever be shown to a user.
 *  • Never invent new product names. Never show an unavailable product.
 *  • Phoenix is the strongest clearing blend — it is NOT a default for
 *    depleted / sensitive / "too intense" / "still activated" sessions.
 *  • Copy stays short and supportive — never "cures / treats / required".
 */

export type SacredTeaBlend =
  | 'The Phoenix — Sacred Gut Reset'
  | 'The Wise Elder'
  | 'Blue Lotus Magic'
  | 'Equinox'
  | 'Euphoria'
  | 'Egyptian Blue Lotus Flowers'
  | 'Blue Lotus Flowers'
  | 'White Lotus Flowers'
  | 'Red Lotus Flowers'
  | 'All Four Lotus Collection'

/** The ONLY products that may be recommended to a user. */
export const SACRED_TEA_INVENTORY: SacredTeaBlend[] = [
  'The Phoenix — Sacred Gut Reset',
  'The Wise Elder',
  'Blue Lotus Magic',
  'Equinox',
  'Euphoria',
  'Egyptian Blue Lotus Flowers',
  'Blue Lotus Flowers',
  'White Lotus Flowers',
  'Red Lotus Flowers',
  'All Four Lotus Collection',
]

export interface BlendProfile {
  name: SacredTeaBlend
  /** The "why" tail — what this prepared blend supports (lane). Short. */
  lane: string
  /** Suggested longer copy (admin/expandable; not the short user line). */
  copy: string
  /** How-to-use line shown to the user (one sentence). */
  usageTiming: string
  /** Continuation instruction (one sentence). */
  sessionInstruction: string
  /** Themes/protocols this blend is FOR (used for soft scoring/explanations). */
  useFor: string[]
  /** Conditions where this blend should NOT be the primary recommendation. */
  avoidPrimaryFor: string[]
  /** Gentle universal fallback (The Wise Elder) — never vetoed as a safe option. */
  universalFallback?: boolean
  /** Beginner-friendly lotus (gentle introduction). */
  beginnerFriendly?: boolean
  /** Advanced / practitioner-leaning (not a default for beginners). */
  advanced?: boolean
}

export const SACRED_TEA_BLEND_PROFILES: Record<SacredTeaBlend, BlendProfile> = {
  'The Phoenix — Sacred Gut Reset': {
    name: 'The Phoenix — Sacred Gut Reset',
    lane: 'deeper release, bitter support, and reset-focused follow-up',
    copy: 'The Phoenix is the strongest clearing blend in the current Sacred Tea library. Astryx recommends it when the protocol calls for deeper release, bitter support, or reset-focused follow-up.',
    usageTiming: 'Sip later in the day, away from the Chamber, with food or water nearby.',
    sessionInstruction: 'Use as deeper-clearing continuation support — not back-to-back with an intense session.',
    useFor: [
      'deep clearing', 'bitter reset', 'gut reset', 'digestive reset', 'release',
      'pluto intensified', 'jupiter overextended', 'scorpio', '8th house', 'elimination',
      'virgo digestion when clearing indicated', 'mars heat when clearing indicated',
    ],
    avoidPrimaryFor: [
      'very depleted', 'highly sensitive nervous system', 'gentle nourishment only',
      'too intense', 'still activated',
    ],
  },
  'The Wise Elder': {
    name: 'The Wise Elder',
    lane: 'grounding, steadiness, and gentle restoration after the Chamber',
    copy: 'The Wise Elder is recommended when the protocol calls for nourishment, steadiness, grounding, and gentle restoration after the Chamber.',
    usageTiming: 'Sip after the Chamber or in the evening.',
    sessionInstruction: 'Use as post-session grounding support.',
    useFor: [
      'grounding', 'restoration', 'elder support', 'saturn compressed', 'moon under-supported',
      'post-session nourishment', 'emotional steadiness', 'root support', 'gentle daily support',
      'recovery after intense chamber', 'sleepy', 'heavy', 'too intense',
    ],
    avoidPrimaryFor: [],
    universalFallback: true,
  },
  'Blue Lotus Magic': {
    name: 'Blue Lotus Magic',
    lane: 'soft opening, dream-state support, and upper-chakra calibration',
    copy: 'Blue Lotus Magic is recommended when the protocol calls for soft opening, dream-state support, meditation, or upper-chakra calibration.',
    usageTiming: 'Sip in the soft evening hours as integration support.',
    sessionInstruction: 'Use as gentle upper-chakra continuation support.',
    useFor: [
      'third eye', 'crown', 'dream state', 'venus under-supported', 'neptune under-supported',
      'sun under-supported', 'soft evening integration', 'meditation', 'upper-chakra calibration',
      'beauty', 'pleasure', 'softening',
    ],
    avoidPrimaryFor: [],
  },
  Equinox: {
    name: 'Equinox',
    lane: 'cooling clarity and a bright reset without making the session feel heavy',
    copy: 'Equinox is recommended when the protocol calls for balance, cooling clarity, and a bright reset without making the session feel heavy.',
    usageTiming: 'Sip after the Chamber or through the day for a bright, balanced lift.',
    sessionInstruction: 'Use as balancing continuation support.',
    useFor: [
      'seasonal reset', 'cooling clarity', 'mars overactivated', 'mercury accelerated',
      'jupiter overextended', 'solar plexus', 'liver', 'hips', 'bright reset',
      'balance between clearing and vitality', 'clarity without heavy clearing', 'sleepy', 'heavy',
    ],
    avoidPrimaryFor: [],
  },
  Euphoria: {
    name: 'Euphoria',
    lane: 'breath awareness and nervous-system softening while the body settles after activation',
    copy: 'Euphoria is recommended when the protocol calls for aromatic clearing, breath awareness, and nervous-system softening around the Chamber.',
    usageTiming: 'Sip after the Chamber or later in the day when the current still feels high.',
    sessionInstruction: 'Use as a gentle continuation support after the fork session.',
    useFor: [
      'breath support', 'mercury accelerated', 'uranus electrified', 'nervous-system softening',
      'aromatic clearing', 'crown', 'third eye', 'sacred feminine', 'still activated', 'restless',
      'still racing',
    ],
    avoidPrimaryFor: [],
  },
  'Egyptian Blue Lotus Flowers': {
    name: 'Egyptian Blue Lotus Flowers',
    lane: 'deep dream-state, meditation, and upper-chakra support',
    copy: 'Egyptian Blue Lotus is the deepest lotus option in the current library and should be reserved for dream-state, meditation, and upper-chakra protocols.',
    usageTiming: 'Reserve for a quiet evening dedicated to meditation or dream work.',
    sessionInstruction: 'Use for deep upper-chakra continuation — not when the body is tired or activated.',
    useFor: [
      'deep dream work', 'third eye', 'crown', 'neptune', 'upper-chakra chamber',
      'traditional meditation', 'advanced lotus',
    ],
    avoidPrimaryFor: ['too intense', 'still activated', 'sleepy', 'heavy'],
    advanced: true,
  },
  'Blue Lotus Flowers': {
    name: 'Blue Lotus Flowers',
    lane: 'a gentle calm opening and light relaxation',
    copy: 'Blue Lotus Flowers are a gentle lotus introduction — calm opening, soft relaxation, and light meditation support.',
    usageTiming: 'Sip in a calm moment as a light, soft opening.',
    sessionInstruction: 'Use as a gentle introductory lotus support.',
    useFor: [
      'gentle lotus introduction', 'calm opening', 'soft relaxation', 'first-time lotus',
      'light meditation',
    ],
    avoidPrimaryFor: [],
    beginnerFriendly: true,
  },
  'White Lotus Flowers': {
    name: 'White Lotus Flowers',
    lane: 'crown clarity, stillness, and a quiet mind',
    copy: 'White Lotus Flowers are recommended for crown clarity, stillness, quiet mind, and soft nervous-system support.',
    usageTiming: 'Sip in stillness, ideally toward the end of the day.',
    sessionInstruction: 'Use as quiet-mind continuation support.',
    useFor: [
      'crown clarity', 'stillness', 'moon support', 'neptune support', 'quiet mind',
      'meditation', 'soft nervous-system support',
    ],
    avoidPrimaryFor: [],
  },
  'Red Lotus Flowers': {
    name: 'Red Lotus Flowers',
    lane: 'heart-root integration after deep release without pushing the clearing harder',
    copy: 'Red Lotus Flowers are recommended for heart opening, emotional warmth, and gentle integration after release.',
    usageTiming: 'Sip later in the day after grounding.',
    sessionInstruction: 'Use gently. Do not stack intense protocols back-to-back.',
    useFor: [
      'heart opening', 'venus support', 'pluto integration', 'root-heart bridge',
      'emotional warmth', 'post-release tenderness', 'emotional',
    ],
    avoidPrimaryFor: [],
  },
  'All Four Lotus Collection': {
    name: 'All Four Lotus Collection',
    lane: 'multi-chakra lotus exploration over time',
    copy: 'The All Four Lotus Collection supports advanced, multi-chakra lotus exploration — a practitioner-leaning option, not a beginner default.',
    usageTiming: 'Explore one lotus at a time across several sessions and observe your body’s response.',
    sessionInstruction: 'Use as an exploratory multi-chakra lotus path over time.',
    useFor: [
      'advanced lotus exploration', 'practitioner recommendation', 'multi-chakra lotus',
      'explore body response over time',
    ],
    avoidPrimaryFor: ['beginner default'],
    advanced: true,
  },
}
