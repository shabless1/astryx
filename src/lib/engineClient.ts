/**
 * ASTRYX — Client-safe engine utilities (Security Directive v1.1 · FIX 1A)
 * ════════════════════════════════════════════════════════════════════════
 * The heavy deterministic engine + the proprietary data corpus live in
 * `engine.ts`, which is now SERVER-ONLY (behind `/api/protocol`). This module
 * holds ONLY the small, presentational helpers that client components need to
 * RENDER already-computed output. It imports NO domain data (`src/data/*`) and
 * NO sub-engines, so it never drags the model into the browser bundle.
 *
 * Relocated verbatim from engine.ts (relocate, not rewrite): PLANET_COLORS,
 * getAccentColor, geocodeLocation, feltStateLanguage (+ its element/state
 * tables), and freshTransitInterpretation (now reads the interpretation the
 * server already baked onto each transit — see engine.ts `shapeActiveTransit`).
 */

import type { ProtocolOutput } from '@/types'

// ─── PLANET → COLOR (presentational; chart wheel, body map, accents) ─────────
export const PLANET_COLORS: Record<string, string> = {
  Sun:     '#F4A940',
  Moon:    '#A8C4D0',
  Mercury: '#9EC832',
  Venus:   '#4CAF89',
  Mars:    '#C4756A',
  Jupiter: '#6B7FD4',
  Saturn:  '#C9993A',
  Uranus:  '#2EC4B6',
  Neptune: '#9B5DE5',
  Pluto:   '#9F7AEA',
}

/**
 * THE HOUSE ACCENT — the app's fixed chrome colour.
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12: "everything defaults to red. I hate it. We need softer
 * default colors. The only time the color should change is in the chamber with
 * the mandalas and color therapy."
 *
 * The app chrome used to take its colour from the user's DOMINANT PLANET, so
 * every button, border, label, card glow and page nebula swung to whatever that
 * planet happened to be — red for Mars or Pluto, acid green for Mercury. A
 * personal chart was deciding the product's visual identity, which is not what
 * an accent is for.
 *
 * Chrome is now FIXED: a soft antique gold, the brand's own colour, warm
 * against the bone title strips and calm at full strength on a button.
 *
 * The planetary palette is NOT gone — it still drives everything that is meant
 * to change: the mandala, colour therapy, the tone ladder dots, the chart wheel
 * and the body map, all of which read their hues from PLANET_COLORS or
 * planetColorTherapyLibrary directly. Those are the signal. This is the room.
 */
export const HOUSE_ACCENT = '#C9A961'

/** The accent color for the app's chrome. Fixed by house ruling — see above. */
export function getAccentColor(_protocol: ProtocolOutput): string {
  return HOUSE_ACCENT
}

/** The dominant planet's own hue — for the chamber visuals that SHOULD move. */
export function planetAccentFor(protocol: ProtocolOutput): string {
  return PLANET_COLORS[protocol.dominant_pattern.planets[0]] ?? HOUSE_ACCENT
}

// ─── PLANET → ELEMENT (drives felt-state language) ───────────────────────────
export const PLANET_ELEMENT: Record<string, string> = {
  Sun: 'Fire', Moon: 'Water', Mercury: 'Air', Venus: 'Earth', Mars: 'Fire',
  Jupiter: 'Fire', Saturn: 'Earth', Uranus: 'Air', Neptune: 'Water', Pluto: 'Water',
}

// ─── FELT-STATE LANGUAGE (element- & state-true words; shared everywhere) ─────
export interface FeltLanguage { felt: string; body: string; verbs: string }
const ELEMENT_EXCESS_LANGUAGE: Record<string, FeltLanguage> = {
  Fire:  { felt: 'running hot',   body: 'may be over-active — inflamed, driven, burning through reserves', verbs: 'cool and calm' },
  Air:   { felt: 'running fast',  body: 'may be over-active — scattered, wired, racing ahead of the body', verbs: 'settle, slow, and ground' },
  Earth: { felt: 'running heavy', body: 'may be over-consolidated — rigid, weighted, walled-in',           verbs: 'soften, release, and lighten' },
  Water: { felt: 'running high',  body: 'may be flooded — foggy, dissolved, washing past its banks',       verbs: 'clarify, contain, and ground' },
}
const DEFICIENCY_LANGUAGE: FeltLanguage = {
  felt: 'running low', body: 'may be under-resourced — depleted, dim, slow to rise', verbs: 'build, warm, and strengthen',
}
const BLOCKED_LANGUAGE: FeltLanguage = {
  felt: 'held or stuck', body: 'may be held — stuck, frozen, slow to move', verbs: 'mobilize and free',
}
const BALANCED_LANGUAGE: FeltLanguage = {
  felt: 'steady', body: 'appears steady', verbs: 'maintain',
}

/** Element- and state-true felt language for a planet. Exported so the hero,
 *  diagnostic, chamber, and Astryx all speak the same planet-true words. */
export function feltStateLanguage(planet: string, state: string): FeltLanguage {
  if (state === 'deficiency') return DEFICIENCY_LANGUAGE
  if (state === 'blocked')    return BLOCKED_LANGUAGE
  if (state === 'excess') {
    const el = PLANET_ELEMENT[planet] ?? 'Earth'
    return ELEMENT_EXCESS_LANGUAGE[el] ?? ELEMENT_EXCESS_LANGUAGE.Earth
  }
  return BALANCED_LANGUAGE
}

// ─── GEOCODING (thin client → /api/geocode) ──────────────────────────────────
export interface GeoResult {
  name: string
  lat: number
  lon: number
  country: string
}

export async function geocodeLocation(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (data.success) return data.results
    return []
  } catch {
    return []
  }
}

/**
 * Render-time transit copy. The server bakes each transit's `interpretation`
 * (effect/intervention/duration) via engine.ts `shapeActiveTransit`, which reads
 * the current data files server-side. Client display surfaces read that baked
 * copy here — the proprietary `medicalAstrology` corpus never ships to the
 * browser. (FIX 1A: was a live client-side lookup into medicalAstrology.json.)
 */
export function freshTransitInterpretation(transit: any):
  { effect: string; intervention: string; duration: string } | undefined {
  return transit?.interpretation ?? undefined
}
