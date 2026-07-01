/**
 * ASTRYX — Mandala Geometry Helpers (Phase 3B)
 *
 * Pure SVG geometry used by the layered SVG kaleidoscope fallback. ViewBox is
 * 0 0 400 400, centre (200,200). All outputs are finite by construction.
 */

export const MC = 200          // mandala centre
export const TAU = Math.PI * 2

export function ptsOnCircle(r: number, n: number, rot = 0, cx = MC, cy = MC): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const t = rot + (i / n) * TAU
    out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)])
  }
  return out
}

export function polyPoints(r: number, sides: number, rot = -Math.PI / 2, cx = MC, cy = MC): string {
  return ptsOnCircle(r, sides, rot, cx, cy).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
}

export function starPoints(rO: number, rI: number, points: number, rot = -Math.PI / 2, cx = MC, cy = MC): string {
  const out: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rO : rI
    const t = rot + (i / (points * 2)) * TAU
    out.push(`${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`)
  }
  return out.join(' ')
}

export function spiralPath(rStart: number, rEnd: number, turns: number, dir: 1 | -1, cx = MC, cy = MC): string {
  let d = ''
  const steps = Math.max(8, Math.round(turns * 48))
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const r = rStart + (rEnd - rStart) * f
    const t = dir * f * turns * TAU
    const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `
  }
  return d
}

/** A petal/lens pointing along +x from the centre; rotate via transform. */
export function petalPath(r: number, w: number, cx = MC, cy = MC): string {
  return `M${cx} ${cy} Q ${cx + r * 0.5} ${cy - w}, ${cx + r} ${cy} Q ${cx + r * 0.5} ${cy + w}, ${cx} ${cy} Z`
}

/** A crescent (two arcs); rotate via transform. */
export function crescentPath(r: number, cx = MC, cy = MC): string {
  const r2 = r * 0.8
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r2} ${r2} 0 0 0 ${cx - r} ${cy} Z`
}
