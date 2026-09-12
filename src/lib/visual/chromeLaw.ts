/**
 * ASTRYX — THE CHROME LAW
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12: *"depleted days should NEVER be hot red, blood red,
 * crimsoned red."*
 *
 * This module has NO dependencies on purpose. The law is imported by both the
 * palettes (which assert themselves against it at module load) and the resolver,
 * so it cannot live in either without a circular import that would leave
 * `RED_BAND` in the temporal dead zone at exactly the moment the assertions run.
 *
 * WHAT THE LAW IS FOR
 * ───────────────────
 * Chrome used to take `PLANET_COLORS[dominant]` — a planet's raw identity hue —
 * and push it through every button, border, label, card glow and the
 * full-viewport nebula. Mars base is Crimson; Pluto base is Burgundy. The app
 * rendered the exact colour its own therapy library lists under `avoid`, while
 * the reading on screen said "let the heat dissolve into the cool field."
 *
 * The failure was never one bad hex. It was that nothing stopped one. This is
 * the thing that stops one.
 *
 * See the house-style skill §3c THE CHROME LAW.
 */

// Hot red, blood red, crimson: the warm-red wedge of the hue circle at any
// meaningful saturation. A desaturated warm grey in the same wedge is fine —
// stone is allowed to be warm; the room is not allowed to be red.
export const RED_BAND = { hueLow: 28, hueHigh: 335, minSaturation: 0.30 } as const

export interface Hsl { h: number; s: number; l: number }

export function hexToHsl(hex: string): Hsl {
  const m = hex.trim().replace('#', '')
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0))
  else if (max === g) h = ((b - r) / d + 2)
  else                h = ((r - g) / d + 4)
  return { h: h * 60, s, l }
}

/** True when a colour is a hot / blood / crimson red at a strength the eye reads as red. */
export function isRedBand(hex: string): boolean {
  const { h, s } = hexToHsl(hex)
  return (h < RED_BAND.hueLow || h > RED_BAND.hueHigh) && s > RED_BAND.minSaturation
}

/**
 * The law, as a callable. Throws on a red-band value so a bad chrome colour
 * fails loudly at the point it is introduced instead of shipping quietly.
 */
export function assertChromeSafe(hex: string, label: string): string {
  if (isRedBand(hex)) {
    const { h, s } = hexToHsl(hex)
    throw new Error(
      `[chrome] ${label} = ${hex} is in the red band (h=${h.toFixed(0)}° s=${s.toFixed(2)}). ` +
      `No chrome element may render a hot, blood or crimson red. See house-style §3c.`
    )
  }
  return hex
}

// ─── THE SECOND LAW, added 2026-09-12 ────────────────────────────────────────
// SHA, on the first neutral ladder: *"it has no soul. no flavor, no vibe. you
// either kill me with red or deplete me with stale colors."*
//
// The first version of this file only said what chrome must NOT be, so the
// palette got built out of avoidance and came back beige. Avoiding red is half
// the law. This is the other half.
//
// HONEST NOTE ON WHY THIS IS TWO CHECKS AND NOT ONE NUMBER
// ────────────────────────────────────────────────────────
// No single scalar separates the rejected ladder from the good ones. Measured
// per colour, they overlap: the rejected House Gold #C9A961 sits at saturation
// 0.49 and chroma 0.41, which is higher than Lilac Release #C98FE8 (chroma
// 0.35) from a palette SHA loved. In isolation #C9A961 is a perfectly decent
// antique gold.
//
// Its problem was never one colour. It was the LADDER:
//
//   rejected:  balanced 42°  ·  depleted 39°  ·  blocked 41°  ·  elevated 173°
//
// Three of the four rooms were the same hue within 3°. The app could not tell
// you anything by changing colour, because it barely changed colour — and what
// it did show was one muted family used as flat fill. That is the sterility, and
// a range check is what actually catches it.
export const STALE_FLOOR = { minSaturation: 0.45 } as const

/** Hue distance on the circle, 0–180°. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * True when a colour is too washed out to read as lit on deep space. Catches the
 * genuinely drained values (Cooled Stone 0.13, Dry Stone 0.18); the ladder-level
 * failure is caught by `paletteHueFamilies` below, not here.
 */
export function isStale(hex: string): boolean {
  return hexToHsl(hex).s < STALE_FLOOR.minSaturation
}

/** Minimum separation for two hues to count as different families. */
export const FAMILY_SEPARATION = 40

/**
 * How many distinct hue families a set of room colours spans. The rejected
 * ladder scores 2; every shipped palette scores 3 or more.
 */
export function paletteHueFamilies(hexes: string[]): number {
  const families: number[] = []
  for (const hex of hexes) {
    const { h } = hexToHsl(hex)
    if (!families.some((f) => hueDistance(f, h) < FAMILY_SEPARATION)) families.push(h)
  }
  return families.length
}

export const MIN_HUE_FAMILIES = 3

/** Throws when a palette has no range — the failure that produced the beige ladder. */
export function assertPaletteRange(hexes: string[], label: string): void {
  const n = paletteHueFamilies(hexes)
  if (n < MIN_HUE_FAMILIES) {
    throw new Error(
      `[chrome] palette "${label}" spans only ${n} hue famil${n === 1 ? 'y' : 'ies'} ` +
      `(minimum ${MIN_HUE_FAMILIES}). A ladder whose rooms share one hue cannot tell the ` +
      `user anything by changing colour. See house-style §3c.`
    )
  }
}
