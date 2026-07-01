/**
 * ASTRYX — Sacred Geometry Base Library (Phase 3C)
 *
 * Exact procedural sacred-geometry constructions, returned as primitive arrays
 * (circles / lines / paths / nodes) on a 0..400 viewBox centred at (200,200).
 * The renderer turns these into luminous linework. Density is the point —
 * Flower of Life, Metatron's Cube, Sri-Yantra triangle fields, rose curves.
 *
 * All math is finite by construction. Nothing here claims to be a real-time
 * astronomical orbit — the rosettes are "orbital-resonance-inspired geometry".
 */

export const SC = 200
const TAU = Math.PI * 2

export interface Circle { cx: number; cy: number; r: number }
export interface Line { x1: number; y1: number; x2: number; y2: number }
export interface Node { x: number; y: number }
export interface GeoLayer {
  circles?: Circle[]
  lines?: Line[]
  paths?: string[]
  nodes?: Node[]
}

const pt = (a: number, r: number): [number, number] => [SC + r * Math.cos(a), SC + r * Math.sin(a)]

// ─── FLOWER OF LIFE ──────────────────────────────────────────
// Hex-lattice of overlapping circles (radius = spacing → petal overlap).
export function flowerOfLife(R = 38, rings = 2): GeoLayer {
  const centers: [number, number][] = []
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      if (Math.abs(-q - r) > rings) continue
      const x = R * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r)
      const y = R * (1.5 * r)
      centers.push([SC + x, SC + y])
    }
  }
  const circles = centers.map(([cx, cy]) => ({ cx, cy, r: R }))
  // intersection nodes ≈ circle rims at hex directions (soft luminous points)
  const nodes: Node[] = centers.map(([cx, cy]) => ({ x: cx, y: cy }))
  // outer containment circle
  circles.push({ cx: SC, cy: SC, r: R * (rings + 0.7) * 1.05 })
  return { circles, nodes }
}

// ─── SEED OF LIFE ────────────────────────────────────────────
export function seedOfLife(R = 46): GeoLayer {
  const circles: Circle[] = [{ cx: SC, cy: SC, r: R }]
  const nodes: Node[] = [{ x: SC, y: SC }]
  for (let i = 0; i < 6; i++) {
    const [x, y] = pt((i / 6) * TAU - Math.PI / 2, R)
    circles.push({ cx: x, cy: y, r: R })
    nodes.push({ x, y })
  }
  circles.push({ cx: SC, cy: SC, r: R * 2.05 })
  return { circles, nodes }
}

// ─── METATRON'S CUBE ─────────────────────────────────────────
// 13 Fruit-of-Life nodes + every connecting line (the hidden solids).
export function metatronsCube(d = 44): GeoLayer {
  const nodes: Node[] = [{ x: SC, y: SC }]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU - Math.PI / 2
    nodes.push({ x: SC + d * Math.cos(a), y: SC + d * Math.sin(a) })       // inner ring
    nodes.push({ x: SC + 2 * d * Math.cos(a), y: SC + 2 * d * Math.sin(a) }) // outer ring
  }
  const lines: Line[] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      lines.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y })
    }
  }
  const circles: Circle[] = nodes.map((n) => ({ cx: n.x, cy: n.y, r: 7 }))
  circles.push({ cx: SC, cy: SC, r: 2 * d * 1.12 })
  return { nodes, lines, circles }
}

// ─── SRI-YANTRA-INSPIRED TRIANGLE FIELD ──────────────────────
// Interlocking up/down triangles + central bindu + lotus edge. Not a copy of
// the sacred Sri Yantra — a triangle-field inspired by it.
export function triangleField(R = 150): GeoLayer {
  const lines: Line[] = []
  const tri = (radius: number, up: boolean, rot = 0) => {
    const base = up ? -Math.PI / 2 : Math.PI / 2
    const p = [0, 1, 2].map((k) => pt(base + rot + (k / 3) * TAU, radius))
    lines.push({ x1: p[0][0], y1: p[0][1], x2: p[1][0], y2: p[1][1] })
    lines.push({ x1: p[1][0], y1: p[1][1], x2: p[2][0], y2: p[2][1] })
    lines.push({ x1: p[2][0], y1: p[2][1], x2: p[0][0], y2: p[0][1] })
  }
  const sizes = [R, R * 0.82, R * 0.64, R * 0.46]
  sizes.forEach((s) => { tri(s, true); tri(s * 0.95, false) })
  const circles: Circle[] = [
    { cx: SC, cy: SC, r: 9 },                 // bindu
    { cx: SC, cy: SC, r: R * 1.04 },          // containment
    { cx: SC, cy: SC, r: R * 1.16 },          // lotus edge ring
  ]
  // lotus petals on the outer edge
  const nodes: Node[] = []
  for (let i = 0; i < 16; i++) nodes.push({ x: pt((i / 16) * TAU, R * 1.1)[0], y: pt((i / 16) * TAU, R * 1.1)[1] })
  return { lines, circles, nodes }
}

// ─── TORUS FIELD ─────────────────────────────────────────────
// Central orb + looping arcs (ellipses) circulating around the core.
export function torusField(R = 150): GeoLayer {
  const paths: string[] = []
  const loops = 12
  for (let i = 0; i < loops; i++) {
    const rot = (i / loops) * 180
    // an ellipse drawn as a path, rotated about centre
    const rx = R, ry = R * 0.34
    paths.push(
      `M ${SC - rx} ${SC} A ${rx} ${ry} ${rot} 1 1 ${SC + rx} ${SC} A ${rx} ${ry} ${rot} 1 1 ${SC - rx} ${SC} Z`,
    )
  }
  const circles: Circle[] = [
    { cx: SC, cy: SC, r: 12 },
    { cx: SC, cy: SC, r: R * 0.5 },
    { cx: SC, cy: SC, r: R },
  ]
  return { paths, circles }
}

// ─── SPIRAL VORTEX ───────────────────────────────────────────
export function spiralVortex(R = 160, turns = 3, dir: 1 | -1 = -1): GeoLayer {
  const build = (phase: number) => {
    let d = ''
    const steps = Math.round(turns * 60)
    for (let i = 0; i <= steps; i++) {
      const f = i / steps
      const rad = 8 + (R - 8) * f
      const a = phase + dir * f * turns * TAU
      const x = SC + rad * Math.cos(a), y = SC + rad * Math.sin(a)
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `
    }
    return d
  }
  const paths = [build(0), build(TAU / 3), build((2 * TAU) / 3)]
  const circles: Circle[] = [
    { cx: SC, cy: SC, r: 10 },
    { cx: SC, cy: SC, r: R * 0.55 },
    { cx: SC, cy: SC, r: R },
  ]
  return { paths, circles }
}

// ─── ORBITAL RESONANCE ROSETTE ───────────────────────────────
// Rose curve r = R·cos(k·θ). `petals` controls the fold (Venus → 5).
// Orbital-resonance-INSPIRED geometry (not a real ephemeris orbit).
export function orbitalRosette(R = 150, petals = 5): GeoLayer {
  const k = petals % 2 === 0 ? petals / 2 : petals // rose petal count rule
  let d = ''
  const steps = 720
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * TAU
    const rad = R * Math.abs(Math.cos(k * t))
    const x = SC + rad * Math.cos(t), y = SC + rad * Math.sin(t)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `
  }
  // nested orbital circles + planet-like nodes along the rim
  const circles: Circle[] = [
    { cx: SC, cy: SC, r: R * 0.5 },
    { cx: SC, cy: SC, r: R * 0.78 },
    { cx: SC, cy: SC, r: R },
  ]
  const nodes: Node[] = []
  const nodeCount = petals
  for (let i = 0; i < nodeCount; i++) {
    const a = (i / nodeCount) * TAU - Math.PI / 2
    nodes.push({ x: SC + R * Math.cos(a), y: SC + R * Math.sin(a) })
  }
  return { paths: [d], circles, nodes }
}

// ─── STAR-FIELD PARTICLE NODES ───────────────────────────────
export function starfieldNodes(count = 60): Node[] {
  // deterministic pseudo-random scatter (no Math.random — stable across renders)
  const nodes: Node[] = []
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996323 // golden angle
    const rad = 30 + ((i * 53) % 170)
    nodes.push({ x: SC + rad * Math.cos(a), y: SC + rad * Math.sin(a) })
  }
  return nodes
}

export type SacredBaseName =
  | 'flowerOfLife' | 'seedOfLife' | 'metatronsCube' | 'triangleField'
  | 'torusField' | 'spiralVortex' | 'orbitalRosette'

export function buildBase(name: SacredBaseName, opts?: { petals?: number }): GeoLayer {
  switch (name) {
    case 'flowerOfLife':  return flowerOfLife(38, 2)
    case 'seedOfLife':    return seedOfLife(46)
    case 'metatronsCube': return metatronsCube(44)
    case 'triangleField': return triangleField(150)
    case 'torusField':    return torusField(150)
    case 'spiralVortex':  return spiralVortex(160, 3, -1)
    case 'orbitalRosette':return orbitalRosette(150, opts?.petals ?? 5)
  }
}
