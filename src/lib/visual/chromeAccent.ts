/**
 * ASTRYX — CHROME ACCENT (the room's colour)
 * ════════════════════════════════════════════════════════════════════════════
 * SHA's ruling, 2026-09-12 — model C:
 *
 *   "neutral chrome that warms or cools by STATE only, never by planet
 *    identity — and depleted days should NEVER be hot red, blood red,
 *    crimsoned red."
 *
 * WHY THIS MODULE EXISTS
 * ──────────────────────
 * Chrome used to take `PLANET_COLORS[dominant]` — a planet's raw *identity*
 * hue — and push it through every button, border, label, card glow, nav pill
 * and the full-viewport background nebula. Mars base is Crimson. Pluto base is
 * Burgundy. So on a Mars or Pluto day the room rendered the exact colour the
 * engine's own therapy library lists under `avoid` ("intensifying red",
 * "overwhelming dark red"), while the reading on screen said *"let the heat
 * dissolve into the cool field."* The engine was never wrong. The presentation
 * layer was never wired to it.
 *
 * THE MODEL
 * ─────────
 * One neutral family, temperature-shifted by the carrier's STATE. The planet's
 * identity never reaches the chrome at all — a Mars day and a Neptune day in
 * the same state give the same room. What moves is temperature, and it moves in
 * the direction the therapy moves:
 *
 *   elevated  → cools   (the signal is running hot; the room settles it)
 *   depleted  → warms   (the signal is running low; the room builds warmth)
 *   blocked   → loosens (compressed; the room opens and dries out)
 *   balanced  → steady  (the house colour, the room at rest)
 *
 * The corrective per-planet palette is NOT gone and must not be moved here. It
 * still drives the mandala, the colour-therapy field, the tone-ladder dots, the
 * chart wheel and the body map. Those are the signal. This is the room.
 *
 * THE INVARIANT
 * ─────────────
 * No chrome value may sit in the RED BAND. This is enforced by
 * `assertChromeSafe`, which runs over the table at module load in development
 * and is asserted for every value by `tests/chromeAccent.test.ts` on every
 * build — because the failure was never one bad hex, it was that nothing
 * stopped one.
 *
 * See the house-style skill §3c THE CHROME LAW.
 */

import type { ProtocolOutput } from '@/types'
import { toDisplayState, type DisplayState } from '@/lib/signalCopy'

// ─── THE RED BAND ────────────────────────────────────────────────────────────
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

// ─── THE FOUR ROOMS ──────────────────────────────────────────────────────────
// One neutral family. Warm and cool are separated by hue and by saturation, so
// the shift reads on a near-black ground without any of them shouting. Every
// value sits well clear of the red band: the two warm entries are amber-gold at
// h≈40°, a full twelve degrees above the band's edge.
export interface ChromeRoom { hex: string; name: string; temperature: 'cool' | 'warm' | 'dry' | 'steady' }

export const CHROME_BY_STATE: Record<DisplayState, ChromeRoom> = {
  // Running hot — the room cools. Stone with the warmth taken out of it.
  elevated: { hex: '#8FA9A6', name: 'Cooled Stone', temperature: 'cool' },
  // Running low — the room warms. Amber-gold, deeper and warmer than the house
  // colour, and nowhere near red: h≈38°, which is the far side of the band.
  depleted: { hex: '#CFA65C', name: 'Warm Amber', temperature: 'warm' },
  // Compressed — the room loosens. Dry stone, the warmth present but unsaturated.
  blocked:  { hex: '#B3A891', name: 'Dry Stone', temperature: 'dry' },
  // Coherent — the room at rest. The house colour.
  balanced: { hex: '#C9A961', name: 'House Gold', temperature: 'steady' },
}

// The law, applied to the table itself, at module load.
for (const [state, room] of Object.entries(CHROME_BY_STATE)) {
  assertChromeSafe(room.hex, `CHROME_BY_STATE.${state}`)
}

/** The room at rest — used before a reading exists, and as every fallback. */
export const CHROME_DEFAULT = CHROME_BY_STATE.balanced

/**
 * The carrier's current state, as chrome reads it. The PLANET is deliberately
 * not consulted: under model C a Mars day and a Neptune day in the same state
 * give the same room.
 */
export function chromeStateFor(protocol?: ProtocolOutput | null): DisplayState {
  const raw = protocol?.signalHierarchy?.primary?.state
  return toDisplayState(raw as string | undefined)
}

/** The room's colour for this reading. Never a planet's identity hue, never red. */
export function resolveChromeAccent(protocol?: ProtocolOutput | null): string {
  return (CHROME_BY_STATE[chromeStateFor(protocol)] ?? CHROME_DEFAULT).hex
}

/** The room's colour + its name, for anywhere that labels what it is showing. */
export function resolveChromeRoom(protocol?: ProtocolOutput | null): ChromeRoom {
  return CHROME_BY_STATE[chromeStateFor(protocol)] ?? CHROME_DEFAULT
}
