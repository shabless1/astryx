/**
 * ASTRYX — Sacred Geometry Engine (Phase 3C)
 *
 * Resolves a KaleidoscopeMandala spec (planet, state, corrective colours, motion)
 * into a concrete, colour-assigned, multi-layer sacred-geometry spec for the
 * SacredGeometryMandalaView. Linework uses luminous gold/pearl for the base
 * sacred grids + the corrective planet colours for accents — so it always reads
 * as signal-state correct.
 */

import type { KaleidoscopeMandala } from './KaleidoscopeMandalaEngine'
import { buildBase, starfieldNodes, type GeoLayer, type Node, type SacredBaseName } from './sacredGeometryBaseLibrary'
import { planetGeometry } from './planetSacredGeometryMap'
import type { SolidName } from './solid3DLibrary'

export type GeometryQuality = 'high' | 'medium' | 'low'

const LUM_GOLD = '#F3E3AC'
const LUM_PEARL = '#EAF1FF'

// ── Vibrancy (SHA feedback: the mandala read muted/scribbly) ──
// The corrective colour library is intentionally desaturated (we cool, never
// amplify). For the VISUAL field that made the kaleidoscope look dull. vivify()
// keeps each corrective HUE but pushes saturation + luminance into a vivid
// range so the mandala reads as a living, stimulating kaleidoscope.
function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, s, l]
}
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const mm = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60)       { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else              { r = c; g = 0; b = x }
  const to = (v: number) => Math.round((v + mm) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}
export function vivify(hex: string): string {
  if (!hex || hex[0] !== '#') return hex
  try {
    const [h, s, l] = hexToHsl(hex)
    const s2 = Math.min(1, s * 1.5 + 0.3)         // push saturation up, vivid
    const l2 = Math.min(0.64, Math.max(0.5, l))   // keep it bright, never washed/dark
    return hslToHex(h, s2, l2)
  } catch { return hex }
}

export interface SacredBaseRender {
  name: SacredBaseName
  layer: GeoLayer
  color: string
  strokeW: number
}
export interface SacredPlatonicRender {
  name: SolidName
  color: string
  scale: number
}

export interface SacredGeometrySpec {
  planet: string
  stateKey: string
  feeling: string
  primary: string
  support: string
  accent: string
  core: string
  glow: string
  chakra: string | null
  bases: SacredBaseRender[]
  rosettePetals?: number
  platonics: SacredPlatonicRender[]
  particleNodes: Node[]
  rotationPrimarySec: number
  rotationSecondarySec: number
  pulseRate: number
  brightness: number
  depth: number
  quality: GeometryQuality
}

export function buildSacredGeometry(
  m: KaleidoscopeMandala,
  quality: GeometryQuality = 'high',
): SacredGeometrySpec {
  const g = planetGeometry(m.planet)
  // SHA — the Venus mandala is the "Rose of Venus": emerald green, pink quartz,
  // pastel + brilliant white. A balanced, pleasant color-therapy palette.
  const isVenus = m.planet === 'Venus'
  const primary = isVenus ? '#2FAE78' : vivify(m.colorPalette[0])  // emerald
  const support = isVenus ? '#F4A6C0' : vivify(m.colorPalette[1])  // pink quartz
  const accent  = isVenus ? '#F6F2EA' : vivify(m.colorPalette[2])  // brilliant white

  const baseCount = quality === 'low' ? 1 : 2
  const accentColors = [support, accent, primary]
  const bases: SacredBaseRender[] = g.bases.slice(0, baseCount).map((name, i) => ({
    name,
    layer: buildBase(name, { petals: g.rosettePetals }),
    // base sacred grids glow gold/pearl; planet geometry uses corrective colour
    color: name === 'metatronsCube' ? LUM_GOLD
      : name === 'flowerOfLife' ? LUM_PEARL
      : name === 'seedOfLife' ? LUM_GOLD
      : accentColors[i % accentColors.length],
    // Bolder lines so the geometry reads as a kaleidoscope, not thin scribble.
    strokeW: name === 'metatronsCube' || name === 'flowerOfLife' || name === 'seedOfLife' ? 1.15 : 1.7,
  }))

  const platCount = quality === 'low' ? 0 : quality === 'medium' ? 1 : g.platonics.length
  const platonics: SacredPlatonicRender[] = g.platonics.slice(0, platCount).map((name, i) => ({
    name,
    color: i === 0 ? accent : LUM_GOLD,
    scale: 1 - i * 0.18,
  }))

  const particleNodes =
    quality === 'high' ? starfieldNodes(64)
    : quality === 'medium' ? starfieldNodes(32)
    : []

  return {
    planet: m.planet,
    stateKey: m.stateKey,
    feeling: g.feeling,
    primary, support, accent,
    core: isVenus ? '#F7CAD9' : vivify(m.coreColor),   // pink-quartz heart for Venus
    glow: isVenus ? '#9FE3C4' : vivify(m.glowColor),   // soft emerald halo for Venus
    chakra: m.chakraAccent,
    bases,
    rosettePetals: g.rosettePetals,
    platonics,
    particleNodes,
    rotationPrimarySec: m.rotationPrimarySec,
    rotationSecondarySec: m.rotationSecondarySec,
    pulseRate: m.pulseRate,
    brightness: m.brightness,
    depth: m.depth,
    quality,
  }
}
