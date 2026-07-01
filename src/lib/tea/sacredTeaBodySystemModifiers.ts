/**
 * ASTRYX — Sacred Tea Body-System Modifiers (Phase 2)
 *
 * The body system(s) touched in the session boost certain blends. These are
 * SOFT boosts layered on top of the planetary rule — they nudge, they don't
 * override the planet match outright.
 */

import type { SacredTeaBlend } from './sacredTeaBlendProfiles'

export interface BodySystemModifier {
  key: string
  /** lowercase substrings matched against the session's body-placement blob */
  match: string[]
  boost: SacredTeaBlend[]
}

export const SACRED_TEA_BODY_SYSTEM_MODIFIERS: BodySystemModifier[] = [
  {
    key: 'Digestive / Gut / Lower Abdomen',
    match: ['digest', 'gut', 'lower abdomen', 'intestine', 'assimilat', 'stomach'],
    boost: ['The Phoenix — Sacred Gut Reset', 'Equinox', 'The Wise Elder'],
  },
  {
    key: 'Heart / Chest / Emotional Field',
    match: ['heart', 'chest', 'emotional', 'breast'],
    boost: ['Red Lotus Flowers', 'Blue Lotus Magic', 'The Wise Elder'],
  },
  {
    key: 'Nervous System / Breath / Throat / Hands',
    match: ['nervous', 'breath', 'throat', 'hand', 'lung', 'cranial', 'mental'],
    boost: ['Euphoria', 'Equinox', 'White Lotus Flowers'],
  },
  {
    key: 'Pelvis / Root / Elimination',
    match: ['pelvis', 'root', 'elimination', 'reproductive', 'sacral', 'bladder'],
    boost: ['Red Lotus Flowers', 'The Phoenix — Sacred Gut Reset', 'The Wise Elder'],
  },
  {
    key: 'Feet / Lymph / Diffusion',
    match: ['feet', 'foot', 'lymph', 'diffusion', 'fluid', 'subtle'],
    boost: ['Equinox', 'White Lotus Flowers', 'The Wise Elder'],
  },
  {
    key: 'Liver / Hips / Solar Plexus',
    match: ['liver', 'hip', 'thigh', 'solar plexus'],
    boost: ['Equinox', 'The Phoenix — Sacred Gut Reset', 'Blue Lotus Magic'],
  },
  {
    key: 'Bones / Knees / Spine / Joints',
    match: ['bone', 'knee', 'spine', 'joint', 'skeletal'],
    boost: ['The Wise Elder', 'Equinox'],
  },
]
