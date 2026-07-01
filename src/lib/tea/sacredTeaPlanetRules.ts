/**
 * ASTRYX — Sacred Tea Planetary Matching Rules (Phase 2)
 *
 * planet × signal-state → { primary, secondary } prepared blend.
 *
 * State vocabulary mirrors signalCopy.DisplayState so the engine can reuse
 * toDisplayState():
 *   excess      → 'elevated'   (amplified / over-radiant / overactivated / accelerated / intensified / overextended / electrified / diffused)
 *   deficiency  → 'depleted'   (under-supported)
 *   blocked     → 'blocked'    (restricted)
 *   balanced    → 'balanced'   (coherent)
 *
 * Where the directive did not specify a state for a planet, the missing branch
 * falls back to the planet's 'balanced' rule (a safe, neutral choice).
 *
 * NOTE: Phoenix appearing as primary (Jupiter elevated, Pluto elevated) is
 * intentional — those ARE the deep-clearing signatures. The engine still demotes
 * Phoenix for sensitive / "too intense" / "still activated" outtakes.
 */

import type { SacredTeaBlend } from './sacredTeaBlendProfiles'

export type TeaDisplayState = 'elevated' | 'depleted' | 'blocked' | 'balanced'

export interface PlanetTeaRule {
  primary: SacredTeaBlend
  secondary: SacredTeaBlend
}

export const SACRED_TEA_PLANET_RULES: Record<string, Record<TeaDisplayState, PlanetTeaRule>> = {
  Sun: {
    elevated:  { primary: 'The Wise Elder',   secondary: 'Equinox' },
    depleted:  { primary: 'Blue Lotus Magic', secondary: 'Equinox' },
    blocked:   { primary: 'Equinox',          secondary: 'Blue Lotus Magic' },
    balanced:  { primary: 'Equinox',          secondary: 'Blue Lotus Magic' },
  },
  Moon: {
    elevated:  { primary: 'The Wise Elder',     secondary: 'Equinox' },
    depleted:  { primary: 'The Wise Elder',     secondary: 'White Lotus Flowers' },
    blocked:   { primary: 'White Lotus Flowers', secondary: 'The Wise Elder' },
    balanced:  { primary: 'White Lotus Flowers', secondary: 'The Wise Elder' },
  },
  Mercury: {
    elevated:  { primary: 'Euphoria',         secondary: 'Equinox' },
    depleted:  { primary: 'Blue Lotus Magic', secondary: 'Euphoria' },
    blocked:   { primary: 'Euphoria',         secondary: 'White Lotus Flowers' },
    balanced:  { primary: 'Equinox',          secondary: 'Euphoria' },
  },
  Venus: {
    elevated:  { primary: 'Equinox',           secondary: 'The Wise Elder' },
    depleted:  { primary: 'Blue Lotus Magic',  secondary: 'Red Lotus Flowers' },
    blocked:   { primary: 'Red Lotus Flowers', secondary: 'Blue Lotus Magic' },
    balanced:  { primary: 'Blue Lotus Magic',  secondary: 'Red Lotus Flowers' },
  },
  Mars: {
    elevated:  { primary: 'Equinox', secondary: 'The Wise Elder' },
    depleted:  { primary: 'Equinox', secondary: 'Blue Lotus Magic' },
    blocked:   { primary: 'Equinox', secondary: 'The Wise Elder' },
    balanced:  { primary: 'Equinox', secondary: 'Blue Lotus Magic' },
  },
  Jupiter: {
    elevated:  { primary: 'The Phoenix — Sacred Gut Reset', secondary: 'Equinox' },
    depleted:  { primary: 'Blue Lotus Magic',               secondary: 'Equinox' },
    blocked:   { primary: 'Equinox',                        secondary: 'The Wise Elder' },
    balanced:  { primary: 'Equinox',                        secondary: 'Blue Lotus Magic' },
  },
  Saturn: {
    elevated:  { primary: 'The Wise Elder', secondary: 'Equinox' },
    depleted:  { primary: 'The Wise Elder', secondary: 'The Phoenix — Sacred Gut Reset' },
    blocked:   { primary: 'The Wise Elder', secondary: 'Equinox' },
    balanced:  { primary: 'The Wise Elder', secondary: 'Equinox' },
  },
  Uranus: {
    elevated:  { primary: 'Euphoria',       secondary: 'The Wise Elder' },
    depleted:  { primary: 'Euphoria',       secondary: 'Blue Lotus Magic' },
    blocked:   { primary: 'The Wise Elder', secondary: 'Euphoria' },
    balanced:  { primary: 'Euphoria',       secondary: 'Equinox' },
  },
  Neptune: {
    elevated:  { primary: 'Equinox',           secondary: 'White Lotus Flowers' },
    depleted:  { primary: 'Blue Lotus Magic',  secondary: 'Egyptian Blue Lotus Flowers' },
    blocked:   { primary: 'White Lotus Flowers', secondary: 'The Wise Elder' },
    balanced:  { primary: 'Blue Lotus Magic',  secondary: 'White Lotus Flowers' },
  },
  Pluto: {
    elevated:  { primary: 'The Phoenix — Sacred Gut Reset', secondary: 'Red Lotus Flowers' },
    depleted:  { primary: 'Red Lotus Flowers',              secondary: 'The Wise Elder' },
    blocked:   { primary: 'Red Lotus Flowers',              secondary: 'The Phoenix — Sacred Gut Reset' },
    balanced:  { primary: 'Red Lotus Flowers',              secondary: 'The Wise Elder' },
  },
}
