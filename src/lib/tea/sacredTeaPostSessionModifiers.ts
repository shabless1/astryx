/**
 * ASTRYX — Sacred Tea Post-Session (Outtake) Modifiers (Phase 2)
 *
 * The user's post-session check-in adjusts the match:
 *   • prefer       → blends to boost
 *   • avoidPrimary → blends that may NOT be the primary recommendation
 *                    (they can still appear as a gentle secondary)
 *
 * Tokens are matched (lowercased) against the flattened outtake answers
 * (chamberSupport + feeling + bodyState + mentalState). "grounded / calmer /
 * clearer" intentionally have no modifier — they keep the original planetary match.
 *
 * This is where Phoenix (and Egyptian Blue Lotus) get held back for sensitive
 * or over-activated sessions — the core of acceptance rule 10.
 */

import type { SacredTeaBlend } from './sacredTeaBlendProfiles'

export interface PostSessionTeaModifier {
  token: string
  prefer: SacredTeaBlend[]
  avoidPrimary: SacredTeaBlend[]
}

export const SACRED_TEA_POST_SESSION_MODIFIERS: PostSessionTeaModifier[] = [
  {
    token: 'too intense',
    prefer: ['The Wise Elder', 'Red Lotus Flowers', 'White Lotus Flowers'],
    avoidPrimary: ['The Phoenix — Sacred Gut Reset', 'Egyptian Blue Lotus Flowers'],
  },
  {
    token: 'too soft',
    prefer: ['Equinox', 'Blue Lotus Magic', 'Euphoria'],
    avoidPrimary: [],
  },
  {
    token: 'still activated',
    prefer: ['Euphoria', 'The Wise Elder', 'White Lotus Flowers'],
    avoidPrimary: ['The Phoenix — Sacred Gut Reset', 'Egyptian Blue Lotus Flowers'],
  },
  {
    token: 'still racing',
    prefer: ['Euphoria', 'The Wise Elder', 'White Lotus Flowers'],
    avoidPrimary: ['The Phoenix — Sacred Gut Reset', 'Egyptian Blue Lotus Flowers'],
  },
  {
    token: 'restless',
    prefer: ['Euphoria', 'The Wise Elder', 'White Lotus Flowers'],
    avoidPrimary: ['The Phoenix — Sacred Gut Reset', 'Egyptian Blue Lotus Flowers'],
  },
  {
    token: 'sleepy',
    prefer: ['Equinox', 'The Wise Elder'],
    avoidPrimary: ['Egyptian Blue Lotus Flowers'],
  },
  {
    token: 'heavy',
    prefer: ['Equinox', 'The Wise Elder'],
    avoidPrimary: ['Egyptian Blue Lotus Flowers'],
  },
  {
    token: 'emotional',
    prefer: ['The Wise Elder', 'Red Lotus Flowers', 'Blue Lotus Magic'],
    avoidPrimary: [],
  },
]
