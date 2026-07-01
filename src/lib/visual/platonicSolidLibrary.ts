/**
 * ASTRYX — Platonic Solid Library (Phase 3C)
 *
 * 2D wireframe projections of the five Platonic solids (vertices + edges) on the
 * 0..400 viewBox. The renderer floats + slowly rotates these (CSS pseudo-3D
 * perspective tilt) so they read as glowing solids tumbling in depth — no WebGL.
 */

export const PC = 200
const TAU = Math.PI * 2

export type PlatonicName = 'tetrahedron' | 'cube' | 'octahedron' | 'icosahedron' | 'dodecahedron'

export interface PlatonicWire {
  verts: [number, number][]
  edges: [number, number][]
}

const ring = (n: number, r: number, rot = -Math.PI / 2): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * TAU
    return [PC + r * Math.cos(a), PC + r * Math.sin(a)] as [number, number]
  })

function tetrahedron(R: number): PlatonicWire {
  const outer = ring(3, R)              // 0,1,2
  const verts: [number, number][] = [...outer, [PC, PC]] // 3 = centre apex
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 0], [0, 3], [1, 3], [2, 3]]
  return { verts, edges }
}

function cube(R: number): PlatonicWire {
  const front = ring(4, R * 0.8, -Math.PI / 4)            // 0-3
  const back = ring(4, R * 0.52, -Math.PI / 4).map(([x, y]) => [x + R * 0.22, y - R * 0.22] as [number, number]) // 4-7
  const verts = [...front, ...back]
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ]
  return { verts, edges }
}

function octahedron(R: number): PlatonicWire {
  const mid = ring(4, R * 0.78)                            // 0-3
  const verts: [number, number][] = [...mid, [PC, PC - R], [PC, PC + R]] // 4 top, 5 bottom
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [0, 4], [1, 4], [2, 4], [3, 4],
    [0, 5], [1, 5], [2, 5], [3, 5],
  ]
  return { verts, edges }
}

function icosahedron(R: number): PlatonicWire {
  const top = ring(5, R * 0.62, -Math.PI / 2)             // 0-4
  const bot = ring(5, R * 0.62, -Math.PI / 2 + Math.PI / 5).map(([x, y]) => [x, y] as [number, number]) // 5-9
  const verts: [number, number][] = [...top, ...bot, [PC, PC - R], [PC, PC + R]] // 10 top apex, 11 bottom apex
  const edges: [number, number][] = []
  for (let i = 0; i < 5; i++) {
    edges.push([i, (i + 1) % 5])               // top pentagon
    edges.push([5 + i, 5 + ((i + 1) % 5)])     // bottom pentagon
    edges.push([i, 10]); edges.push([5 + i, 11])
    edges.push([i, 5 + i]); edges.push([i, 5 + ((i + 4) % 5)]) // zigzag belt
  }
  return { verts, edges }
}

function dodecahedron(R: number): PlatonicWire {
  const outer = ring(5, R, -Math.PI / 2)                  // 0-4
  const mid = ring(5, R * 0.62, -Math.PI / 2 + Math.PI / 5) // 5-9
  const inner = ring(5, R * 0.34, -Math.PI / 2)           // 10-14
  const verts = [...outer, ...mid, ...inner]
  const edges: [number, number][] = []
  for (let i = 0; i < 5; i++) {
    edges.push([i, (i + 1) % 5])                 // outer pentagon
    edges.push([10 + i, 10 + ((i + 1) % 5)])     // inner pentagon
    edges.push([i, 5 + i]); edges.push([5 + i, (i + 1) % 5]) // outer→mid
    edges.push([5 + i, 10 + i]); edges.push([5 + i, 10 + ((i + 1) % 5)]) // mid→inner
  }
  return { verts, edges }
}

const BUILDERS: Record<PlatonicName, (R: number) => PlatonicWire> = {
  tetrahedron, cube, octahedron, icosahedron, dodecahedron,
}

export function platonicWire(name: PlatonicName, R = 78): PlatonicWire {
  return (BUILDERS[name] ?? octahedron)(R)
}
