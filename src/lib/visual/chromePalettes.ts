/**
 * ASTRYX — THE FIVE ROOMS
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12, on the first model-C ladder:
 *
 *   "i do not like the palette you are choosing when it comes to color therapy.
 *    it has no soul. no flavor, no vibe. you either kill me with red or deplete
 *    me with stale colors."
 *
 * She was right about the cause. That ladder was built out of AVOIDANCE — the
 * red-band law said where not to go, and the answer retreated into warm neutrals
 * at mid-saturation (Dry Stone, Tallow, Warm Gray). On a #020208 ground that is
 * the one place colour neither glows nor recedes; it just sits there. A palette
 * made of absences.
 *
 * Meanwhile `planetColorTherapyLibrary.ts` had the life in it the whole time —
 * Blue-Green, Deep Indigo, Deep Violet, Gold Containment, Seafoam. Those are the
 * Astryx world. **Never-amplify means don't feed the heat. It never meant be
 * beige.** Every value here runs at saturation 0.50–0.87 where the stale set sat
 * at 0.13–0.55, and every one is still outside the red band.
 *
 * Then, on seeing the five: *"I love them all! this is what i am talking about
 * baby!"* — so none of them is thrown away. All five ship, the user picks, and
 * the default is the one that is most the brand's own.
 *
 * WHAT A PALETTE IS
 * ─────────────────
 * A palette is the instrument's FINISH. The room within it is still resolved by
 * the carrier's STATE and never by the planet (model C), so the colour still
 * carries the reading — the palette only says in which material.
 *
 *   elevated  → cools   (running hot; the room settles it)
 *   depleted  → warms   (running low; the room builds)
 *   blocked   → opens   (compressed; the room loosens)
 *   balanced  → rests   (coherent; the room at rest)
 *
 * THE INVARIANT, UNCHANGED
 * ────────────────────────
 * No room may sit in the red band. `assertChromeSafe` runs over every value of
 * every palette at module load and throws, so a new palette cannot be added with
 * a red in it. See the house-style skill §3c THE CHROME LAW.
 */

import { assertChromeSafe, isStale, hexToHsl, assertPaletteRange } from './chromeLaw'
import type { DisplayState } from '@/lib/signalCopy'

export type ChromePaletteId = 'amethyst' | 'aurora' | 'ember' | 'water' | 'lapis'

export interface ChromeRoom {
  hex: string
  name: string
  /** Which way this room moves the temperature. Drives the page bloom. */
  temperature: 'cool' | 'warm' | 'open' | 'steady'
}

export interface ChromePalette {
  id: ChromePaletteId
  name: string
  /** One line, in SHA's register — shown in the picker. */
  soul: string
  /** Where the colours come from, so the palette is never decoration. */
  source: string
  rooms: Record<DisplayState, ChromeRoom>
}

export const CHROME_PALETTES: Record<ChromePaletteId, ChromePalette> = {
  // ── DEFAULT ────────────────────────────────────────────────────────────────
  // Violet and gold are the brand's two originals (--purple / --gold), and
  // Pluto's own balanced field is Deep Violet held with Gold Containment. This
  // is deep space wearing its own colour, which is why it is the default.
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst Chamber',
    soul: 'The room is violet and the light inside it changes.',
    source: 'Violet and gold, the brand’s two originals — and Pluto’s own balanced field.',
    rooms: {
      balanced: { hex: '#9B6BE0', name: 'Amethyst',      temperature: 'steady' },
      elevated: { hex: '#3FBFB0', name: 'Lit Teal',      temperature: 'cool'   },
      depleted: { hex: '#F0A93C', name: 'Ember Gold',    temperature: 'warm'   },
      blocked:  { hex: '#C98FE8', name: 'Lilac Release', temperature: 'open'   },
    },
  },

  // Northern light seen through ice. Cold sky, hot core.
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    soul: 'Northern light seen through ice. The room is never grey, it is always some colour of lit.',
    source: 'Jade for a coherent field; the deep indigo Mars itself prescribes for heat.',
    rooms: {
      balanced: { hex: '#22C39B', name: 'Jade Light',   temperature: 'steady' },
      elevated: { hex: '#3A63D6', name: 'Deep Indigo',  temperature: 'cool'   },
      depleted: { hex: '#F2A83C', name: 'Ember Gold',   temperature: 'warm'   },
      blocked:  { hex: '#A971E0', name: 'Orchid',       temperature: 'open'   },
    },
  },

  // Gold, molten instead of dusted — the direct answer to the sterile one.
  ember: {
    id: 'ember',
    name: 'Obsidian & Ember',
    soul: 'Gold, but molten instead of dusted. Lit from inside rather than drained.',
    source: 'The Sun’s own Warm Gold and Sunrise Yellow; Pluto’s Gold Containment.',
    rooms: {
      balanced: { hex: '#F0A93C', name: 'Molten Gold',  temperature: 'steady' },
      elevated: { hex: '#1E8F82', name: 'Blue-Green',   temperature: 'cool'   },
      depleted: { hex: '#FFD56B', name: 'Sunrise',      temperature: 'warm'   },
      blocked:  { hex: '#B97AD8', name: 'Smoke Violet', temperature: 'open'   },
    },
  },

  // Submerged light. Everything reads as depth rather than surface.
  water: {
    id: 'water',
    name: 'Deep Water',
    soul: 'Submerged light. Everything reads as depth rather than surface.',
    source: 'Neptune’s corrective field — Clear Blue for the fog, Seafoam for the release.',
    rooms: {
      // NOT #3FA9F5 — that is Uranus's and Mercury's own base identity hue, and
      // chrome may never wear a planet's identity. Shifted deeper into the blue.
      balanced: { hex: '#3E92E8', name: 'Clear Blue',   temperature: 'steady' },
      elevated: { hex: '#2C3E8C', name: 'Deep Indigo',  temperature: 'cool'   },
      depleted: { hex: '#F2A83C', name: 'Ember Gold',   temperature: 'warm'   },
      blocked:  { hex: '#7FE0C4', name: 'Seafoam',      temperature: 'open'   },
    },
  },

  // Lapis and gold. The oldest manufactured pigment on earth, next to the metal.
  lapis: {
    id: 'lapis',
    name: 'Egyptian Blue',
    soul: 'Lapis and gold. Ancient, sacred, and unmistakably ours.',
    source: 'The Lotus Spectrum’s Egyptian Blue — proprietary Astryx IP, read as a room.',
    rooms: {
      balanced: { hex: '#4C7FE8', name: 'Egyptian Blue', temperature: 'steady' },
      elevated: { hex: '#2AA79C', name: 'Nile Teal',     temperature: 'cool'   },
      depleted: { hex: '#E8C15A', name: 'Leaf Gold',     temperature: 'warm'   },
      blocked:  { hex: '#9D8CE8', name: 'Lotus Violet',  temperature: 'open'   },
    },
  },
}

/** Deep space wearing its own colour. */
export const DEFAULT_PALETTE_ID: ChromePaletteId = 'amethyst'

export const PALETTE_ORDER: ChromePaletteId[] =
  ['amethyst', 'aurora', 'ember', 'water', 'lapis']

// THE LAW, applied at module load, so a palette that breaks it cannot be added
// without failing at import. Both halves run: no room may be red, no room may be
// washed out, and no palette may lack range.
for (const palette of Object.values(CHROME_PALETTES)) {
  const hexes: string[] = []
  for (const [state, room] of Object.entries(palette.rooms)) {
    const label = `${palette.id}.${state} (${room.name})`
    assertChromeSafe(room.hex, label)
    if (isStale(room.hex)) {
      throw new Error(
        `[chrome] ${label} = ${room.hex} is washed out ` +
        `(s=${hexToHsl(room.hex).s.toFixed(2)}, floor 0.45). On a #020208 ground a room ` +
        `this drained neither glows nor recedes. See house-style §3c.`
      )
    }
    hexes.push(room.hex)
  }
  // The check that actually catches the ladder SHA rejected: three of its four
  // rooms sat within 3 degrees of hue, so the room could barely change at all.
  assertPaletteRange(hexes, palette.name)
}

export function paletteById(id?: string | null): ChromePalette {
  return CHROME_PALETTES[(id as ChromePaletteId)] ?? CHROME_PALETTES[DEFAULT_PALETTE_ID]
}
