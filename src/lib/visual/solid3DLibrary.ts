/**
 * ASTRYX — Sacred Solid Library, TRUE 3D / 4D  (Phase 3D)
 * ════════════════════════════════════════════════════════════════════════════
 * Replaces the old flat 2D-wireframe projections. Each solid is stored as REAL
 * geometry — 3D vertices (x,y,z), or 4D for the tesseract (x,y,z,w) — and is
 * rotated + perspective-projected EVERY FRAME by the overlay. That is what gives
 * genuine depth: vertices move in z, near edges read brighter/thicker, faces pass
 * in front of and behind each other. The tesseract rotates through 4D planes and
 * projects 4D→3D→2D — the hypercube "turning inside-out".
 *
 * No WebGL / no Three.js (build rule). Pure math + SVG. Deterministic geometry;
 * the only time-varying input is the rotation angle (a visual, not protocol data).
 *
 * SHA directive 2026-06-21 — planet → form correspondences:
 *   Mercury/Venus octahedron · Mars dodecahedron · Jupiter tetrahedron ·
 *   Saturn cube · Uranus cuboctahedron (Vector Equilibrium) ·
 *   Neptune torus · Pluto stellated dodecahedron + tesseract.
 *   (Sun/Moon keep tetra+dodeca / icosa — not in SHA's list.)
 */

export type SolidName =
  | 'tetrahedron' | 'cube' | 'octahedron' | 'icosahedron' | 'dodecahedron'
  | 'cuboctahedron' | 'stellatedDodecahedron' | 'torus' | 'tesseract'
  // Luminary forms (SHA 2026-06-21) — Sun = sphere + golden spiral, Moon = vesica + crescent.
  | 'sphere' | 'goldenSpiral' | 'vesicaPiscis' | 'crescent'

export type V3 = [number, number, number]
export type V4 = [number, number, number, number]
export type Edge = [number, number]

export interface Solid {
  dims: 3 | 4
  /** populated when dims === 3 */
  verts3?: V3[]
  /** populated when dims === 4 */
  verts4?: V4[]
  edges: Edge[]
  /** draw a small node at each vertex (off for dense solids like the torus) */
  drawNodes: boolean
}

/** SVG viewBox is 0..400; everything is centred here. */
export const CENTER = 200

const PHI = (1 + Math.sqrt(5)) / 2
const IPHI = 1 / PHI

// ── helpers ────────────────────────────────────────────────────
function norm3(v: V3): number { return Math.hypot(v[0], v[1], v[2]) }
function scaleToUnit3(verts: V3[]): V3[] {
  const max = Math.max(...verts.map(norm3)) || 1
  return verts.map(([x, y, z]) => [x / max, y / max, z / max] as V3)
}
function scaleToUnit4(verts: V4[]): V4[] {
  const max = Math.max(...verts.map((v) => Math.hypot(v[0], v[1], v[2], v[3]))) || 1
  return verts.map(([x, y, z, w]) => [x / max, y / max, z / max, w / max] as V4)
}
// Edges of a regular solid = the pairs at the minimum vertex-to-vertex distance.
function edgesByMinDist(verts: V3[], tol = 1.08): Edge[] {
  const d2 = (a: V3, b: V3) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  let min = Infinity
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++)
      min = Math.min(min, d2(verts[i], verts[j]))
  const thr = min * tol * tol
  const edges: Edge[] = []
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++)
      if (d2(verts[i], verts[j]) <= thr) edges.push([i, j])
  return edges
}

// ── vertex sets ────────────────────────────────────────────────
const TETRA: V3[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]

const CUBE: V3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
]

const OCTA: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]

const ICOSA: V3[] = [
  [0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI],
  [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1],
]

const DODECA: V3[] = [
  [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
  [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
  [0, IPHI, PHI], [0, IPHI, -PHI], [0, -IPHI, PHI], [0, -IPHI, -PHI],
  [IPHI, PHI, 0], [IPHI, -PHI, 0], [-IPHI, PHI, 0], [-IPHI, -PHI, 0],
  [PHI, 0, IPHI], [PHI, 0, -IPHI], [-PHI, 0, IPHI], [-PHI, 0, -IPHI],
]

const CUBOCTA: V3[] = [
  [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
  [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
  [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
]

// Stellated dodecahedron: the dodecahedron + 12 pentagonal spike apexes. A
// dodecahedron's faces point toward the 12 icosahedron-vertex directions (the
// dual), so each apex sits over one face; connect it to that face's 5 vertices.
function buildStellatedDodeca(): Solid {
  const base = scaleToUnit3(DODECA)            // 20 verts, radius 1
  const baseEdges = edgesByMinDist(base)
  const dirs = scaleToUnit3(ICOSA)             // 12 face directions (unit)
  const SPIKE = 1.7
  const apexes: V3[] = dirs.map(([x, y, z]) => [x * SPIKE, y * SPIKE, z * SPIKE])
  const verts: V3[] = [...base, ...apexes]
  const edges: Edge[] = [...baseEdges]
  const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  apexes.forEach((_, ai) => {
    const dir = dirs[ai]
    // the 5 base vertices most aligned with this face direction
    const ranked = base
      .map((v, i) => ({ i, d: dot(v, dir) }))
      .sort((p, q) => q.d - p.d)
      .slice(0, 5)
    ranked.forEach(({ i }) => edges.push([20 + ai, i]))
  })
  return { dims: 3, verts3: scaleToUnit3(verts), edges, drawNodes: false }
}

// 3D torus wireframe — ring of rings (major U loops × minor V loops).
function buildTorus(U = 10, V = 5, Rm = 0.72, Rt = 0.3): Solid {
  const verts: V3[] = []
  for (let i = 0; i < U; i++) {
    const u = (i / U) * Math.PI * 2
    for (let j = 0; j < V; j++) {
      const v = (j / V) * Math.PI * 2
      const r = Rm + Rt * Math.cos(v)
      verts.push([Math.cos(u) * r, Math.sin(u) * r, Rt * Math.sin(v)])
    }
  }
  const idx = (i: number, j: number) => (i % U) * V + (j % V)
  const edges: Edge[] = []
  for (let i = 0; i < U; i++) {
    for (let j = 0; j < V; j++) {
      edges.push([idx(i, j), idx(i + 1, j)])   // around the big ring
      edges.push([idx(i, j), idx(i, j + 1)])   // around the tube
    }
  }
  return { dims: 3, verts3: scaleToUnit3(verts), edges, drawNodes: false }
}

// 4D tesseract — 16 vertices (±1,±1,±1,±1); edges join vertices differing in
// exactly one coordinate (32 edges).
function buildTesseract(): Solid {
  const verts: V4[] = []
  for (let i = 0; i < 16; i++) {
    verts.push([
      (i & 1) ? 1 : -1,
      (i & 2) ? 1 : -1,
      (i & 4) ? 1 : -1,
      (i & 8) ? 1 : -1,
    ])
  }
  const edges: Edge[] = []
  for (let i = 0; i < 16; i++)
    for (let j = i + 1; j < 16; j++) {
      const diff = (i ^ j)
      if (diff && (diff & (diff - 1)) === 0) edges.push([i, j]) // power of two = one-bit difference
    }
  return { dims: 4, verts4: scaleToUnit4(verts), edges, drawNodes: true }
}

// ── Luminary forms (SHA 2026-06-21) ────────────────────────────
// Sun = Sphere (wireframe globe) + Golden Spiral (phi). Moon = Vesica Piscis
// (two overlapping circles, the cosmic womb) + Crescent. Curve-based forms that
// still rotate + kaleidoscope through the same pipeline.

// Wireframe sphere — latitude rings + longitude meridians.
function buildSphere(L = 6, M = 12): Solid {
  const verts: V3[] = []
  for (let i = 0; i <= L; i++) {
    const phi = -Math.PI / 2 + (i / L) * Math.PI
    const y = Math.sin(phi), r = Math.cos(phi)
    for (let j = 0; j < M; j++) {
      const th = (j / M) * Math.PI * 2
      verts.push([r * Math.cos(th), y, r * Math.sin(th)])
    }
  }
  const idx = (i: number, j: number) => i * M + (j % M)
  const edges: Edge[] = []
  for (let i = 0; i <= L; i++)
    for (let j = 0; j < M; j++) {
      edges.push([idx(i, j), idx(i, j + 1)])             // latitude ring
      if (i < L) edges.push([idx(i, j), idx(i + 1, j)])  // meridian
    }
  return { dims: 3, verts3: scaleToUnit3(verts), edges, drawNodes: false }
}

// Golden (logarithmic / phi) spiral, drawn twice mirrored so it reads as a
// double solar spiral rather than a single tail.
function buildGoldenSpiral(turns = 2.6, steps = 90): Solid {
  const b = Math.log(PHI) / (Math.PI / 2)
  const arm = (sign: number): V3[] =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const th = (i / steps) * turns * Math.PI * 2
      const r = 0.05 * Math.exp(b * th)
      return [sign * r * Math.cos(th), sign * r * Math.sin(th), 0] as V3
    })
  const a1 = arm(1), a2 = arm(-1)
  const verts = [...a1, ...a2]
  const edges: Edge[] = []
  for (let i = 0; i < a1.length - 1; i++) edges.push([i, i + 1])
  const off = a1.length
  for (let i = 0; i < a2.length - 1; i++) edges.push([off + i, off + i + 1])
  return { dims: 3, verts3: scaleToUnit3(verts), edges, drawNodes: false }
}

// Vesica Piscis — two equal circles whose centres each sit on the other's rim.
function buildVesicaPiscis(N = 60, sep = 0.5): Solid {
  const ring = (cx: number): V3[] =>
    Array.from({ length: N }, (_, k) => {
      const a = (k / N) * Math.PI * 2
      return [cx + Math.cos(a), Math.sin(a), 0] as V3
    })
  const r1 = ring(-sep), r2 = ring(sep)
  const verts = [...r1, ...r2]
  const edges: Edge[] = []
  for (let k = 0; k < N; k++) edges.push([k, (k + 1) % N])
  for (let k = 0; k < N; k++) edges.push([N + k, N + ((k + 1) % N)])
  return { dims: 3, verts3: scaleToUnit3(verts), edges, drawNodes: false }
}

// Crescent — an outer circle and an offset, slightly smaller inner circle; the
// gap between them reads as the lunar crescent.
function buildCrescent(N = 60): Solid {
  const outer: V3[] = Array.from({ length: N }, (_, k) => {
    const a = (k / N) * Math.PI * 2
    return [Math.cos(a), Math.sin(a), 0] as V3
  })
  const inner: V3[] = Array.from({ length: N }, (_, k) => {
    const a = (k / N) * Math.PI * 2
    return [0.42 + 0.74 * Math.cos(a), 0.74 * Math.sin(a), 0] as V3
  })
  const verts = [...outer, ...inner]
  const edges: Edge[] = []
  for (let k = 0; k < N; k++) edges.push([k, (k + 1) % N])
  for (let k = 0; k < N; k++) edges.push([N + k, N + ((k + 1) % N)])
  return { dims: 3, verts3: scaleToUnit3(verts), edges, drawNodes: false }
}

// ── build + cache ──────────────────────────────────────────────
function build(name: SolidName): Solid {
  switch (name) {
    case 'tetrahedron':         return { dims: 3, verts3: scaleToUnit3(TETRA), edges: edgesByMinDist(scaleToUnit3(TETRA)), drawNodes: true }
    case 'cube':                return { dims: 3, verts3: scaleToUnit3(CUBE),  edges: edgesByMinDist(scaleToUnit3(CUBE)),  drawNodes: true }
    case 'octahedron':          return { dims: 3, verts3: scaleToUnit3(OCTA),  edges: edgesByMinDist(scaleToUnit3(OCTA)),  drawNodes: true }
    case 'icosahedron':         return { dims: 3, verts3: scaleToUnit3(ICOSA), edges: edgesByMinDist(scaleToUnit3(ICOSA)), drawNodes: true }
    case 'dodecahedron':        return { dims: 3, verts3: scaleToUnit3(DODECA),edges: edgesByMinDist(scaleToUnit3(DODECA)),drawNodes: true }
    case 'cuboctahedron':       return { dims: 3, verts3: scaleToUnit3(CUBOCTA),edges: edgesByMinDist(scaleToUnit3(CUBOCTA)),drawNodes: true }
    case 'stellatedDodecahedron': return buildStellatedDodeca()
    case 'torus':               return buildTorus()
    case 'tesseract':           return buildTesseract()
    case 'sphere':              return buildSphere()
    case 'goldenSpiral':        return buildGoldenSpiral()
    case 'vesicaPiscis':        return buildVesicaPiscis()
    case 'crescent':            return buildCrescent()
  }
}

const CACHE = new Map<SolidName, Solid>()
export function getSolid(name: SolidName): Solid {
  let s = CACHE.get(name)
  if (!s) { s = build(name); CACHE.set(name, s) }
  return s
}

// ── rotation + projection ──────────────────────────────────────
export function rot3(v: V3, ax: number, ay: number, az: number): V3 {
  let [x, y, z] = v
  let c = Math.cos(ax), s = Math.sin(ax); [y, z] = [y * c - z * s, y * s + z * c]   // X
  c = Math.cos(ay); s = Math.sin(ay);     [x, z] = [x * c + z * s, -x * s + z * c]   // Y
  c = Math.cos(az); s = Math.sin(az);     [x, y] = [x * c - y * s, x * s + y * c]   // Z
  return [x, y, z]
}

export interface Angles4 { xy: number; zw: number; xw: number; yz: number }
export function rot4(v: V4, a: Angles4): V4 {
  let [x, y, z, w] = v
  let c = Math.cos(a.xy), s = Math.sin(a.xy); [x, y] = [x * c - y * s, x * s + y * c]
  c = Math.cos(a.zw); s = Math.sin(a.zw);     [z, w] = [z * c - w * s, z * s + w * c]
  c = Math.cos(a.xw); s = Math.sin(a.xw);     [x, w] = [x * c - w * s, x * s + w * c]
  c = Math.cos(a.yz); s = Math.sin(a.yz);     [y, z] = [y * c - z * s, y * s + z * c]
  return [x, y, z, w]
}

const DIST_W = 2.6   // 4D camera distance (w axis)
const DIST_Z = 3.4   // 3D camera distance (z axis)

/** 4D → 3D perspective projection. */
export function project4to3(v: V4): V3 {
  const k = DIST_W / (DIST_W - v[3])
  return [v[0] * k, v[1] * k, v[2] * k]
}

export interface ScreenPoint { x: number; y: number; depth: number }
/** 3D → 2D perspective projection onto the 0..400 viewBox. depth ∈ ~[-1,1]. */
export function project3to2(v: V3, R: number): ScreenPoint {
  const k = DIST_Z / (DIST_Z - v[2])
  return { x: CENTER + v[0] * R * k, y: CENTER + v[1] * R * k, depth: v[2] }
}
