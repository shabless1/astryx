/**
 * ASTRYX — CHROME ACCENT (the red-band law, and the resolver)
 * ════════════════════════════════════════════════════════════════════════════
 * SHA's ruling, 2026-09-12 — model C:
 *
 *   "neutral chrome that warms or cools by STATE only, never by planet
 *    identity — and depleted days should NEVER be hot red, blood red,
 *    crimsoned red."
 *
 * This module owns THE LAW (the red band + assertChromeSafe) and the resolver.
 * The rooms themselves live in `chromePalettes.ts`.
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
 * The room is resolved by the carrier's STATE. The planet's identity never
 * reaches the chrome at all — a Mars day and a Neptune day in the same state
 * give the same room. What moves is temperature, and it moves in the direction
 * the therapy moves:
 *
 *   elevated  → cools   (the signal is running hot; the room settles it)
 *   depleted  → warms   (the signal is running low; the room builds warmth)
 *   blocked   → opens   (compressed; the room loosens)
 *   balanced  → rests   (coherent; the room at rest)
 *
 * The corrective per-planet palette is NOT gone and must not be moved here. It
 * still drives the mandala, the colour-therapy field, the tone-ladder dots, the
 * chart wheel and the body map. Those are the signal. This is the room.
 *
 * THE INVARIANT
 * ─────────────
 * No chrome value may sit in the RED BAND. `assertChromeSafe` throws, and runs
 * over EVERY value of EVERY palette at module load, so a palette with a red in
 * it cannot be added without failing at import. `tests/chromeAccent.test.ts`
 * asserts it again on every build — because the failure was never one bad hex,
 * it was that nothing stopped one.
 *
 * See the house-style skill §3c THE CHROME LAW.
 */

import type { ProtocolOutput } from '@/types'
import { toDisplayState, type DisplayState } from '@/lib/signalCopy'
export * from './chromeLaw'
import {
  CHROME_PALETTES as CHROME_PALETTES_T,
  DEFAULT_PALETTE_ID as DEFAULT_PALETTE_ID_T,
  paletteById as paletteByIdT,
  type ChromeRoom as ChromeRoomT,
} from './chromePalettes'

// ─── THE ROOMS ───────────────────────────────────────────────────────────────
// The four rooms now live in `chromePalettes.ts`, one set per palette. A palette
// is the instrument's FINISH; the room within it is still resolved by the
// carrier's STATE and never by the planet, so the colour still carries the
// reading — the palette only says in which material.
//
// SHA, 2026-09-12, on the first (neutral) ladder: *"it has no soul. no flavor,
// no vibe. you either kill me with red or deplete me with stale colors."* That
// ladder was built out of avoidance. These are built out of the engine's own
// therapy palettes. See `chromePalettes.ts` for the full account.
export type { ChromePaletteId, ChromePalette, ChromeRoom } from './chromePalettes'
export {
  CHROME_PALETTES, PALETTE_ORDER, DEFAULT_PALETTE_ID, paletteById,
} from './chromePalettes'

/** The room at rest in the default palette — used before a reading exists. */
export const CHROME_DEFAULT: ChromeRoomT =
  CHROME_PALETTES_T[DEFAULT_PALETTE_ID_T].rooms.balanced

/**
 * The carrier's current state, as chrome reads it. The PLANET is deliberately
 * not consulted: under model C a Mars day and a Neptune day in the same state
 * give the same room.
 */
export function chromeStateFor(protocol?: ProtocolOutput | null): DisplayState {
  const raw = protocol?.signalHierarchy?.primary?.state
  return toDisplayState(raw as string | undefined)
}

/** The room for this reading, in this palette. Never a planet hue, never red. */
export function resolveChromeRoom(
  protocol?: ProtocolOutput | null,
  paletteId?: string | null,
): ChromeRoomT {
  return paletteByIdT(paletteId).rooms[chromeStateFor(protocol)] ?? CHROME_DEFAULT
}

/** The room's colour for this reading, in this palette. */
export function resolveChromeAccent(
  protocol?: ProtocolOutput | null,
  paletteId?: string | null,
): string {
  return resolveChromeRoom(protocol, paletteId).hex
}

/** Every colour any palette can ever put on the chrome — for audits and tests. */
export function allChromeHexes(): string[] {
  return Object.values(CHROME_PALETTES_T)
    .flatMap((p) => Object.values(p.rooms).map((r) => r.hex))
}
