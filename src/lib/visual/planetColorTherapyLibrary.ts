/**
 * ASTRYX — Planet Color Therapy Library (Phase 3)
 *
 * Per-planet color fields by signal state. Colors are CORRECTIVE first:
 * when a planet is amplified/heated/electrified we COOL and GROUND it — we
 * never amplify it. Chakra color is blended softly on top and never overrides
 * the corrective color (see chakraTint + the engine).
 *
 * State buckets mirror signalCopy.DisplayState:
 *   elevated  = amplified / over-radiant / overactivated / accelerated / intensified / electrified / diffused / overextended
 *   depleted  = under-supported / dimmed
 *   blocked   = restricted / compressed
 *   balanced  = coherent / stable / resourced
 *
 * motion tokens (color field):
 *   settle-down   slow downward settling (cooling)
 *   expand-warm   slow warm expansion (restoring)
 *   bloom-release compression → release bloom (opening)
 *   steady-pulse  balanced slow pulse (integrating)
 */

export type ColorState = 'elevated' | 'depleted' | 'blocked' | 'balanced'
export type ColorMotion = 'settle-down' | 'expand-warm' | 'bloom-release' | 'steady-pulse'

export interface ColorStateProfile {
  colors: string[]       // hex — dominant → support → accent
  colorNames: string[]   // human labels for the UI ("Teal", "Deep Blue", …)
  motion: ColorMotion
  motionWords: string
  avoid: string[]
  instruction: string
}

export interface PlanetColorProfile {
  base: string[]
  baseNames: string[]
  states: Record<ColorState, ColorStateProfile>
}

// Coherent/balanced fields share a calm template built from the base palette.
const coherent = (colors: string[], names: string[]): ColorStateProfile => ({
  colors, colorNames: names, motion: 'steady-pulse',
  motionWords: 'slow steady pulse · soft integration glow',
  avoid: ['high contrast', 'fast movement'],
  instruction: 'Rest in the steady field. Let the breath stay even.',
})

export const PLANET_COLOR_THERAPY: Record<string, PlanetColorProfile> = {
  Sun: {
    base: ['#F5B301', '#FFB347', '#F4F1E8'],
    baseNames: ['Gold', 'Amber', 'Soft White'],
    states: {
      elevated: {
        colors: ['#E8C879', '#BFD8F5', '#F4F1E8'],
        colorNames: ['Restorative Gold', 'Pale Blue', 'Soft White'],
        motion: 'settle-down',
        motionWords: 'slow radiant breathing · light softens on exhale',
        avoid: ['intense orange-red', 'blinding white', 'rapid solar flare'],
        instruction: 'Let the brightness soften. Long, slow exhale.',
      },
      depleted: {
        colors: ['#F5B301', '#FFD56B', '#F4F1E8'],
        colorNames: ['Warm Gold', 'Sunrise Yellow', 'Soft White'],
        motion: 'expand-warm',
        motionWords: 'slow sunrise expansion · light grows with the inhale',
        avoid: ['cold empty fields', 'overly dark visuals'],
        instruction: 'Draw the warm light in on the inhale.',
      },
      blocked: {
        colors: ['#FFD56B', '#E8C879', '#F4F1E8'],
        colorNames: ['Sunrise Yellow', 'Soft Gold', 'Soft White'],
        motion: 'bloom-release',
        motionWords: 'slow opening bloom · light returns gently',
        avoid: ['hard static blocks', 'aggressive pulsing'],
        instruction: 'Let the light open through. Soften on the exhale.',
      },
      balanced: coherent(['#F5B301', '#FFD56B', '#F4F1E8'], ['Gold', 'Sunrise Yellow', 'Soft White']),
    },
  },
  Moon: {
    base: ['#EDEAE2', '#C9CCD4', '#C3D8EE'],
    baseNames: ['Pearl', 'Silver', 'Pale Blue'],
    states: {
      elevated: {
        colors: ['#AAB6C6', '#D6D9DF', '#9FD4CC'],
        colorNames: ['Soft Blue-Gray', 'Pale Silver', 'Muted Aqua'],
        motion: 'settle-down',
        motionWords: 'slow tidal settling · no bright flashes',
        avoid: ['bright flashes', 'high contrast'],
        instruction: 'Let the tide settle. Steady, even breath.',
      },
      depleted: {
        colors: ['#F1EFE8', '#AEE8E0', '#C3D8EE'],
        colorNames: ['Pearl White', 'Soft Aqua', 'Moon-Blue'],
        motion: 'expand-warm',
        motionWords: 'slow circular drift · soft swelling with the breath',
        avoid: ['cold empty fields', 'overly dark visuals'],
        instruction: 'Let the soft water nourish. Breathe slow and round.',
      },
      blocked: {
        colors: ['#AEE8E0', '#C3D8EE', '#EDEAE2'],
        colorNames: ['Soft Aqua', 'Moon-Blue', 'Pearl'],
        motion: 'bloom-release',
        motionWords: 'gentle wave opening · feeling moves and releases',
        avoid: ['dense pressure', 'aggressive pulsing'],
        instruction: 'Let feeling move. Soften and release on the exhale.',
      },
      balanced: coherent(['#EDEAE2', '#AEE8E0', '#C3D8EE'], ['Pearl', 'Soft Aqua', 'Moon-Blue']),
    },
  },
  Mercury: {
    base: ['#4FD8E8', '#3FA9F5', '#C9CCD4'],
    baseNames: ['Cyan', 'Electric Blue', 'Silver'],
    states: {
      elevated: {
        colors: ['#9CC4E8', '#9BE3CE', '#C2C6CC'],
        colorNames: ['Soft Blue', 'Seafoam', 'Muted Silver'],
        motion: 'settle-down',
        motionWords: 'slow organizing lines · gentle left-right flow',
        avoid: ['fast electric sparks', 'jittering', 'rapid flashing'],
        instruction: 'Let the thoughts slow and organize. Even breath.',
      },
      depleted: {
        colors: ['#5DE0EE', '#F3E9A6', '#A9CDEA'],
        colorNames: ['Clear Cyan', 'Pale Yellow', 'Light Blue'],
        motion: 'expand-warm',
        motionWords: 'organized pathways form slowly · gentle clarity',
        avoid: ['cold empty fields', 'over-stimulation'],
        instruction: 'Let clarity wake gently. Light, steady breath.',
      },
      blocked: {
        colors: ['#9CC4E8', '#5DE0EE', '#EDEAE2'],
        colorNames: ['Soft Blue', 'Clear Cyan', 'Pearl'],
        motion: 'bloom-release',
        motionWords: 'static loosens · the lines connect again slowly',
        avoid: ['hard blocks', 'aggressive pulsing'],
        instruction: 'Let the static loosen. Exhale and let thought move.',
      },
      balanced: coherent(['#4FD8E8', '#9BE3CE', '#A9CDEA'], ['Cyan', 'Seafoam', 'Light Blue']),
    },
  },
  Venus: {
    base: ['#2FAE78', '#E58FA6', '#E6B7A0'],
    baseNames: ['Emerald', 'Rose', 'Rose Gold'],
    states: {
      elevated: {
        colors: ['#2FAE78', '#ECE6DD', '#F2C9D4'],
        colorNames: ['Emerald', 'Soft White', 'Pale Rose'],
        motion: 'bloom-release',
        motionWords: 'gentle clearing bloom · petals soften on the exhale',
        avoid: ['heavy pink saturation', 'sugary visuals', 'rapid heart pulsing'],
        instruction: 'Let the sweetness clear and lighten. Slow exhale.',
      },
      depleted: {
        colors: ['#E6B7A0', '#2FAE78', '#ECE6DD'],
        colorNames: ['Rose Gold', 'Emerald', 'Soft Pearl'],
        motion: 'expand-warm',
        motionWords: 'slow flower bloom · heart field expansion',
        avoid: ['cold empty fields', 'harsh contrast'],
        instruction: 'Let the heart field open warmly with the inhale.',
      },
      blocked: {
        colors: ['#E58FA6', '#2FAE78', '#E6B7A0'],
        colorNames: ['Rose', 'Emerald', 'Rose Gold'],
        motion: 'bloom-release',
        motionWords: 'slow symmetrical opening · connection flows again',
        avoid: ['dense pressure', 'aggressive pulsing'],
        instruction: 'Let connection open. Soften and bloom on the exhale.',
      },
      balanced: coherent(['#2FAE78', '#E58FA6', '#E6B7A0'], ['Emerald', 'Rose', 'Rose Gold']),
    },
  },
  Mars: {
    base: ['#C5283D', '#FFB347', '#E2632A'],
    baseNames: ['Crimson', 'Amber', 'Deep Orange'],
    states: {
      elevated: {
        colors: ['#2E9D8F', '#3A3F8F', '#8A6F52'],
        colorNames: ['Blue-Green', 'Deep Indigo', 'Earth Brown'],
        motion: 'settle-down',
        motionWords: 'slow cooling contraction · heat dissolves downward',
        avoid: ['intensifying red', 'fire bursts', 'rapid pulses', 'aggressive triangles'],
        instruction: 'Let the heat dissolve into the cool field. Long exhale.',
      },
      depleted: {
        colors: ['#E0673A', '#FFB347', '#E2B24C'],
        colorNames: ['Warm Red-Orange', 'Amber', 'Steady Gold'],
        motion: 'expand-warm',
        motionWords: 'steady activation pulse · gentle forward heat build',
        avoid: ['cold empty fields', 'over-stimulation'],
        instruction: 'Let a steady warmth build. Even, forward breath.',
      },
      blocked: {
        colors: ['#CF5B5B', '#4FB3A6', '#D9A85C'],
        colorNames: ['Soft Red', 'Green-Blue Release', 'Muted Amber'],
        motion: 'bloom-release',
        motionWords: 'compression then release · the triangle softens to a circle',
        avoid: ['hard static blocks', 'aggressive pulsing'],
        instruction: 'Compress on the inhale, release the heat on the exhale.',
      },
      balanced: coherent(['#D24238', '#FFB347', '#E2B24C'], ['Warm Red', 'Amber', 'Steady Gold']),
    },
  },
  Jupiter: {
    base: ['#3B5BCC', '#8B5CF6', '#F5B301'],
    baseNames: ['Royal Blue', 'Violet', 'Gold'],
    states: {
      elevated: {
        colors: ['#2C3E8C', '#C9A24B', '#A98EDB'],
        colorNames: ['Deep Blue', 'Muted Gold', 'Soft Violet'],
        motion: 'settle-down',
        motionWords: 'expansion slows into containment · the outer ring holds',
        avoid: ['runaway expansion', 'too much sparkle', 'chaotic spirals'],
        instruction: 'Let the expansion settle inside the holding ring.',
      },
      depleted: {
        colors: ['#3B5BCC', '#F5B301', '#4A4E94'],
        colorNames: ['Royal Blue', 'Gold', 'Warm Indigo'],
        motion: 'expand-warm',
        motionWords: 'gentle expansion · slow uplift · broad breathing field',
        avoid: ['cold empty fields', 'harsh contrast'],
        instruction: 'Let the field expand gently. Broad, easy breath.',
      },
      blocked: {
        colors: ['#3B5BCC', '#C9A24B', '#A98EDB'],
        colorNames: ['Royal Blue', 'Muted Gold', 'Soft Violet'],
        motion: 'bloom-release',
        motionWords: 'expansion frees and moves at a steady pace',
        avoid: ['dense pressure', 'aggressive pulsing'],
        instruction: 'Let room open. Expand steadily on the inhale.',
      },
      balanced: coherent(['#3B5BCC', '#8B5CF6', '#F5B301'], ['Royal Blue', 'Violet', 'Gold']),
    },
  },
  Saturn: {
    base: ['#2E2E36', '#54627A', '#C9A24B'],
    baseNames: ['Charcoal', 'Slate Blue', 'Muted Gold'],
    states: {
      elevated: {
        colors: ['#8A8378', '#C9A24B', '#9CC4E8'],
        colorNames: ['Warm Gray', 'Muted Gold', 'Soft Blue'],
        motion: 'bloom-release',
        motionWords: 'slow compression-release · pressure softens outward',
        avoid: ['heavy black fields', 'claustrophobic visuals', 'hard static blocks'],
        instruction: 'Breathe into the structure. Let pressure soften outward.',
      },
      depleted: {
        colors: ['#D2A94E', '#54627A', '#ECE7D9'],
        colorNames: ['Structured Gold', 'Slate Blue', 'Bone White'],
        motion: 'expand-warm',
        motionWords: 'the grid forms slowly · architecture strengthens',
        avoid: ['cold empty fields', 'heavy darkness'],
        instruction: 'Let a steady structure form. Slow, grounded breath.',
      },
      blocked: {
        colors: ['#8A8378', '#C9A24B', '#ECE7D9'],
        colorNames: ['Warm Gray', 'Muted Gold', 'Bone White'],
        motion: 'bloom-release',
        motionWords: 'the grid gently expands · the boundary eases',
        avoid: ['hard static blocks', 'dense pressure'],
        instruction: 'Ease the boundary. Let the grid expand on the exhale.',
      },
      balanced: coherent(['#54627A', '#C9A24B', '#ECE7D9'], ['Slate Blue', 'Muted Gold', 'Bone White']),
    },
  },
  Uranus: {
    base: ['#3FA9F5', '#4FD8E8', '#8B5CF6'],
    baseNames: ['Electric Blue', 'Cyan', 'Violet'],
    states: {
      elevated: {
        colors: ['#2FA8A0', '#2C3E8C', '#C9A24B'],
        colorNames: ['Teal', 'Deep Blue', 'Muted Gold'],
        motion: 'settle-down',
        motionWords: 'slow stabilizing wave downward · the current grounds',
        avoid: ['sharp electric flicker', 'glitch effects', 'rapid sparks', 'flashing white'],
        instruction: 'Slow exhale — let the current settle and ground.',
      },
      depleted: {
        colors: ['#2E9BF0', '#4FD8E8', '#C8B6E4'],
        colorNames: ['Electric Blue', 'Cyan', 'Soft Violet'],
        motion: 'expand-warm',
        motionWords: 'gentle spark activation · light nodes wake slowly',
        avoid: ['cold empty fields', 'harsh contrast'],
        instruction: 'Let fresh current wake gently. Light, easy breath.',
      },
      blocked: {
        colors: ['#2FA8A0', '#2E9BF0', '#8FD8E6'],
        colorNames: ['Teal', 'Electric Blue', 'Soft Cyan'],
        motion: 'bloom-release',
        motionWords: 'circuit lines reconnect slowly · change moves through',
        avoid: ['sharp flicker', 'aggressive pulsing'],
        instruction: 'Let change move through cleanly. Exhale and release.',
      },
      balanced: coherent(['#3FA9F5', '#4FD8E8', '#8B5CF6'], ['Electric Blue', 'Cyan', 'Violet']),
    },
  },
  Neptune: {
    base: ['#9BE3CE', '#8B5CF6', '#C3B2E8'],
    baseNames: ['Seafoam', 'Violet', 'Lavender'],
    states: {
      elevated: {
        colors: ['#4FA3DD', '#C9CCD4', '#3C9B92'],
        colorNames: ['Clear Blue', 'Silver Boundary', 'Grounding Teal'],
        motion: 'settle-down',
        motionWords: 'fog clears slowly · boundary lines appear',
        avoid: ['heavy fog', 'too much blur', 'sedating darkness'],
        instruction: 'Let the edges return. Clear, steady breath.',
      },
      depleted: {
        colors: ['#C3B2E8', '#9BE3CE', '#C8B6E4'],
        colorNames: ['Lavender', 'Seafoam', 'Pale Violet'],
        motion: 'expand-warm',
        motionWords: 'gentle shimmer · a slow meditative dream drift',
        avoid: ['heavy darkness', 'cold empty fields'],
        instruction: 'Let the soft shimmer return. Dreamy, slow breath.',
      },
      blocked: {
        colors: ['#4FA3DD', '#B6E6D6', '#C9CCD4'],
        colorNames: ['Clear Blue', 'Soft Seafoam', 'Silver'],
        motion: 'bloom-release',
        motionWords: 'the veil clears · clarity returns gently',
        avoid: ['heavy fog', 'aggressive pulsing'],
        instruction: 'Let the fog lift. Exhale into clarity.',
      },
      balanced: coherent(['#9BE3CE', '#8B5CF6', '#C3B2E8'], ['Seafoam', 'Violet', 'Lavender']),
    },
  },
  Pluto: {
    base: ['#5B2A86', '#6E1F36', '#11131F'],
    baseNames: ['Deep Violet', 'Burgundy', 'Black-Blue'],
    states: {
      elevated: {
        colors: ['#5B2A86', '#11131F', '#D9B65C'],
        colorNames: ['Deep Violet', 'Black-Blue', 'Gold Containment'],
        motion: 'settle-down',
        motionWords: 'very slow inward spiral · the field dissolves and reforms',
        avoid: ['overwhelming dark red', 'rapid vortex', 'threatening visuals', 'violent pulsing'],
        instruction: 'Let it move slowly. Contain and breathe through it.',
      },
      depleted: {
        colors: ['#5E1B30', '#D69A4A', '#1A1E2E'],
        colorNames: ['Deep Burgundy', 'Gold Ember', 'Warm Black-Blue'],
        motion: 'expand-warm',
        motionWords: 'slow empowering pulse · the root glow strengthens gently',
        avoid: ['cold empty fields', 'heavy darkness'],
        instruction: 'Let a steady depth return. Slow, rooted breath.',
      },
      blocked: {
        colors: ['#5B2A86', '#6E1F36', '#CDA94E'],
        colorNames: ['Deep Violet', 'Soft Burgundy', 'Gold Boundary'],
        motion: 'bloom-release',
        motionWords: 'slow release from the centre outward · the vortex opens gently',
        avoid: ['rapid vortex', 'violent pulsing'],
        instruction: 'Let what is ready release. Open slowly on the exhale.',
      },
      balanced: coherent(['#5B2A86', '#6E1F36', '#D9B65C'], ['Deep Violet', 'Burgundy', 'Soft Gold']),
    },
  },
}

// ─── CHAKRA COLOR ALIGNMENT ──────────────────────────────────
// Gently blended ON TOP of the corrective field — never overrides it.
export const CHAKRA_TINT: Record<string, string> = {
  crown:        '#C8A2FF',
  third_eye:    '#4B3FA8',
  throat:       '#3FA9F5',
  heart:        '#3FBF8F',
  solar_plexus: '#F2C84B',
  sacral:       '#F2873E',
  root:         '#C53A4A',
}

export function chakraTint(chakra?: string): string | null {
  if (!chakra) return null
  return CHAKRA_TINT[chakra] ?? null
}

export function planetColorProfile(planet: string): PlanetColorProfile {
  return PLANET_COLOR_THERAPY[planet] ?? PLANET_COLOR_THERAPY.Sun
}
