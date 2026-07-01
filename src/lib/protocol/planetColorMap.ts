/**
 * ASTRYX — Planet → Color Map (Final 20% Directive §5)
 *
 * Per directive: the app uses too much green. Green stays a regulator only.
 * Default palette is driven by dominant planet pair.
 */

export interface PlanetPalette {
  primary: string
  secondary: string
}

export const planetColorMap: Record<string, PlanetPalette> = {
  Sun:     { primary: '#FFD166', secondary: '#FFF3B0' },
  Moon:    { primary: '#C9E7FF', secondary: '#D9D9D9' },
  Mercury: { primary: '#B8FFEA', secondary: '#7DF9FF' },
  Venus:   { primary: '#50E3A4', secondary: '#FF8FB7' },
  Mars:    { primary: '#FF3B3B', secondary: '#FFB000' },
  Jupiter: { primary: '#6C63FF', secondary: '#9B5DE5' },
  Saturn:  { primary: '#3A3A3A', secondary: '#C8A951' },
  Uranus:  { primary: '#00D9FF', secondary: '#7A5CFF' },
  Neptune: { primary: '#6FFFE9', secondary: '#B388FF' },
  Pluto:   { primary: '#5A0014', secondary: '#0A0A0A' },
}

export function paletteForPlanet(planet: string): PlanetPalette {
  return planetColorMap[planet] ?? { primary: '#7DF9FF', secondary: '#50E3A4' }
}

// Regulator colors per directive §6 — used in Regulation + Integration phases
export type RegulatorRole =
  | 'calm' | 'restore' | 'strengthen' | 'reset' | 'ground' | 'soften'

export const regulatorColorMap: Record<RegulatorRole, string> = {
  calm:       '#5DADEC',
  restore:    '#50E3A4',
  strengthen: '#FFD166',
  reset:      '#FFFFFF',
  ground:     '#8A6F3D',
  soften:     '#B388FF',
}

/** Pick a default regulator role for a dominant planet. */
export function regulatorForPlanet(planet: string): RegulatorRole {
  const map: Record<string, RegulatorRole> = {
    Sun:     'strengthen',
    Moon:    'soften',
    Mercury: 'reset',
    Venus:   'restore',
    Mars:    'calm',
    Jupiter: 'restore',
    Saturn:  'ground',
    Uranus:  'reset',
    Neptune: 'soften',
    Pluto:   'ground',
  }
  return map[planet] ?? 'restore'
}
