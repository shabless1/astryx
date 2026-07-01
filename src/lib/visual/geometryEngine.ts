/**
 * ASTRYX — Sacred Geometry Engine (Canvas 2D)
 * Per Final 20% Directive §10 + acceptance criteria 1-5.
 *
 * Six renderers — one per aspect. Each accepts a phase-aware context
 * (brightness, motionIntensity, geometryComplexity) and a palette so
 * the same renderer evolves across Entry → Activation → Peak → Regulation
 * → Integration without state changes.
 *
 * Canvas 2D, no Three.js. ~180 KB bundle saved vs R3F + Drei.
 */

import type { ElementVisual, ModalityMotion } from '@/lib/protocol/elementModalityMaps'

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  cx: number
  cy: number
  width: number
  height: number
  t: number              // accumulated frame time
  /** Phase scalars (from sessionPhaseMap.getBlendedPhaseValues) */
  brightness: number
  motionIntensity: number
  geometryComplexity: number
  introduceRegulator: boolean
  blendColors: boolean
  /** Live audio RMS energy 0..1 */
  audioEnergy: number
  /** Color palette */
  primary: [number, number, number]    // RGB tuple
  secondary: [number, number, number]
  regulator: [number, number, number]
  /** Element + modality modifiers */
  element: ElementVisual
  modality: ModalityMotion
}

// ─── Helpers ─────────────────────────────────────────────────────

function rgba([r, g, b]: [number, number, number], a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Blend two RGB tuples by t∈[0,1]. */
function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

/**
 * Resolve dominant geometry color for the current phase.
 * Entry/Activation/Peak  → primary
 * Regulation             → primary fading toward regulator
 * Integration            → regulator with secondary tint
 */
function geomColor(c: RenderContext): [number, number, number] {
  if (c.blendColors) return mixRgb(c.regulator, c.secondary, 0.35)
  if (c.introduceRegulator) return mixRgb(c.primary, c.regulator, 0.55)
  return c.primary
}

// ═══════════════════════════════════════════════════════════════
// 1. CONJUNCTION — Concentric Circles
// ═══════════════════════════════════════════════════════════════
export function drawConcentricCircles(c: RenderContext) {
  const baseCount = 3 + Math.round(c.geometryComplexity * 12)
  const motion = c.motionIntensity * c.element.movementSpeed
  const color = geomColor(c)
  const glow = c.element.glowIntensity

  // Concentric ring families with density curve toward center
  for (let i = 0; i < baseCount; i++) {
    const k = i / Math.max(1, baseCount - 1)
    const baseR = 30 + i * 32
    const breath = Math.sin(c.t * 0.6 + i * 0.4) * (10 + c.audioEnergy * 30)
    const r = baseR + breath * motion
    const alpha = (0.55 - k * 0.45) * c.brightness * (0.6 + c.audioEnergy * 0.6)

    c.ctx.beginPath()
    c.ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2)
    c.ctx.strokeStyle = rgba(color, Math.max(0, alpha))
    c.ctx.lineWidth = (0.7 + (1 - k) * 1.4) * glow
    c.ctx.stroke()
  }

  // Hot center pulse — amplification per directive
  const coreR = (16 + Math.sin(c.t * 1.4) * 6 + c.audioEnergy * 20) * c.motionIntensity
  const grad = c.ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, Math.max(2, coreR * 3))
  grad.addColorStop(0, rgba(color, 0.95 * c.brightness))
  grad.addColorStop(0.4, rgba(color, 0.35 * c.brightness))
  grad.addColorStop(1, 'transparent')
  c.ctx.fillStyle = grad
  c.ctx.beginPath()
  c.ctx.arc(c.cx, c.cy, coreR * 3, 0, Math.PI * 2)
  c.ctx.fill()
}

// ═══════════════════════════════════════════════════════════════
// 2. OPPOSITION — Mirrored Axis
// ═══════════════════════════════════════════════════════════════
export function drawMirroredAxis(c: RenderContext) {
  const color = geomColor(c)
  const sepAmplitude = 240 * c.geometryComplexity
  const osc = Math.sin(c.t * 0.7 * c.motionIntensity) * 0.5 + 0.5  // 0..1
  // Two focal nodes oscillate apart from center then merge in Integration
  const sep = c.blendColors
    ? sepAmplitude * (1 - c.geometryComplexity * 0.6)   // collapse during integration
    : sepAmplitude * osc

  const leftX = c.cx - sep
  const rightX = c.cx + sep

  // Mirrored particle clusters
  const count = 6 + Math.round(c.geometryComplexity * 14)
  for (let side = -1; side <= 1; side += 2) {
    const focal = side < 0 ? leftX : rightX
    for (let i = 0; i < count; i++) {
      const k = i / count
      const r = 18 + k * 90 + Math.sin(c.t * 1.2 + i + side) * 14 * c.motionIntensity
      const a = i / count * Math.PI * 2
      const px = focal + Math.cos(a) * r
      const py = c.cy + Math.sin(a) * r * 0.6
      const alpha = (0.35 + k * 0.25) * c.brightness
      c.ctx.beginPath()
      c.ctx.arc(px, py, 1.2 + c.audioEnergy * 2.5, 0, Math.PI * 2)
      c.ctx.fillStyle = rgba(color, alpha)
      c.ctx.fill()
    }
    // Outline ring around each focal
    c.ctx.beginPath()
    c.ctx.arc(focal, c.cy, 110 + Math.sin(c.t + side) * 12, 0, Math.PI * 2)
    c.ctx.strokeStyle = rgba(color, 0.35 * c.brightness)
    c.ctx.lineWidth = 1
    c.ctx.stroke()
  }

  // Connecting bilateral line — gets brighter at peak, dims into integration
  c.ctx.beginPath()
  c.ctx.moveTo(leftX, c.cy)
  c.ctx.lineTo(rightX, c.cy)
  c.ctx.strokeStyle = rgba(color, 0.4 * c.brightness)
  c.ctx.lineWidth = 1 + c.audioEnergy * 1.5
  c.ctx.stroke()

  // Midpoint flare during regulation/integration (the merge)
  if (c.introduceRegulator) {
    const flareR = 60 + Math.sin(c.t * 2) * 20
    const grad = c.ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, flareR)
    grad.addColorStop(0, rgba(c.regulator, 0.7 * c.brightness))
    grad.addColorStop(1, 'transparent')
    c.ctx.fillStyle = grad
    c.ctx.beginPath()
    c.ctx.arc(c.cx, c.cy, flareR, 0, Math.PI * 2)
    c.ctx.fill()
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. SQUARE — Grid Cube (Compression-Release)
// ═══════════════════════════════════════════════════════════════
export function drawGridCube(c: RenderContext) {
  const color = geomColor(c)
  // 4 → 8 → 12 cells per side as complexity climbs
  const N = 4 + Math.round(c.geometryComplexity * 8)
  // Square pulse for hard-edge feel — sign() of sine
  const pulseRate = 0.60 * c.motionIntensity  // Hz per CLAUDE.md
  const pulseWave = Math.sign(Math.sin(c.t * pulseRate * Math.PI * 2))
  const pulseAmp = 1 + 0.15 * pulseWave * c.motionIntensity

  const baseSize = Math.min(c.width, c.height) * 0.45
  const cellSize = (baseSize / N) * pulseAmp

  // Draw N×N grid centered on (cx, cy)
  const half = (N * cellSize) / 2
  c.ctx.save()
  c.ctx.translate(c.cx, c.cy)
  c.ctx.rotate(Math.sin(c.t * 0.1) * 0.02)  // tiny ambient rotation

  for (let i = 0; i <= N; i++) {
    const offset = -half + i * cellSize
    const alpha = (0.18 + (1 - Math.abs(i / N - 0.5) * 2) * 0.22) * c.brightness
    c.ctx.strokeStyle = rgba(color, alpha)
    c.ctx.lineWidth = 0.7
    // Horizontal line
    c.ctx.beginPath()
    c.ctx.moveTo(-half, offset)
    c.ctx.lineTo( half, offset)
    c.ctx.stroke()
    // Vertical line
    c.ctx.beginPath()
    c.ctx.moveTo(offset, -half)
    c.ctx.lineTo(offset,  half)
    c.ctx.stroke()
  }

  // Three nested rotating frames at the center — the "cube" shape hint
  const frames = 3
  for (let f = 1; f <= frames; f++) {
    const sz = (half * 0.35) * f
    const rot = (c.t * 0.18 * (f % 2 ? 1 : -1)) + pulseWave * 0.04
    c.ctx.save()
    c.ctx.rotate(rot)
    c.ctx.strokeStyle = rgba(color, (0.55 / f) * c.brightness)
    c.ctx.lineWidth = 1.1
    c.ctx.strokeRect(-sz, -sz, sz * 2, sz * 2)
    c.ctx.restore()
  }

  // Friction stress lines on pulse beat — random diagonals
  if (pulseWave > 0 && c.audioEnergy > 0.05) {
    c.ctx.strokeStyle = rgba(color, 0.5 * c.brightness)
    c.ctx.lineWidth = 0.9
    for (let s = 0; s < 4; s++) {
      const a = Math.PI * (s / 4 + 0.2 * pulseWave)
      const len = 80 + c.audioEnergy * 60
      c.ctx.beginPath()
      c.ctx.moveTo(0, 0)
      c.ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len)
      c.ctx.stroke()
    }
  }
  c.ctx.restore()
}

// ═══════════════════════════════════════════════════════════════
// 4. TRINE — Triangle Flow (Three nodes + ribbon arcs)
// ═══════════════════════════════════════════════════════════════
export function drawTriangleFlow(c: RenderContext) {
  const color = geomColor(c)
  const R = 80 + 140 * c.geometryComplexity
  const t = c.t * 0.4 * c.motionIntensity

  // Three nodes at 120° intervals
  const nodes: [number, number][] = []
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2 + Math.sin(t + i) * 0.04
    nodes.push([c.cx + Math.cos(a) * R, c.cy + Math.sin(a) * R])
  }

  // Quadratic Bézier arcs between consecutive nodes
  c.ctx.strokeStyle = rgba(color, 0.65 * c.brightness)
  c.ctx.lineWidth = 1.5
  c.ctx.lineCap = 'round'
  c.ctx.lineJoin = 'round'
  for (let i = 0; i < 3; i++) {
    const [x1, y1] = nodes[i]
    const [x2, y2] = nodes[(i + 1) % 3]
    const mx = (x1 + x2) / 2 + (c.cx - (x1 + x2) / 2) * (0.5 + 0.3 * Math.sin(c.t + i))
    const my = (y1 + y2) / 2 + (c.cy - (y1 + y2) / 2) * (0.5 + 0.3 * Math.cos(c.t + i))
    c.ctx.beginPath()
    c.ctx.moveTo(x1, y1)
    c.ctx.quadraticCurveTo(mx, my, x2, y2)
    c.ctx.stroke()
  }

  // Ribbon particles traveling around the circuit
  const ribbonCount = Math.round(18 * c.geometryComplexity)
  for (let i = 0; i < ribbonCount; i++) {
    const phase = (i / Math.max(1, ribbonCount) + t * 0.08) % 1
    const seg = Math.floor(phase * 3)
    const segT = (phase * 3) - seg
    const [x1, y1] = nodes[seg]
    const [x2, y2] = nodes[(seg + 1) % 3]
    const mx = (x1 + x2) / 2 + (c.cx - (x1 + x2) / 2) * 0.6
    const my = (y1 + y2) / 2 + (c.cy - (y1 + y2) / 2) * 0.6
    // Quadratic Bézier point at segT
    const u = 1 - segT
    const px = u * u * x1 + 2 * u * segT * mx + segT * segT * x2
    const py = u * u * y1 + 2 * u * segT * my + segT * segT * y2
    c.ctx.beginPath()
    c.ctx.arc(px, py, 2.2 + c.audioEnergy * 2.2, 0, Math.PI * 2)
    c.ctx.fillStyle = rgba(color, (0.5 + 0.5 * Math.sin(phase * Math.PI)) * c.brightness)
    c.ctx.fill()
  }

  // Node halos
  for (const [nx, ny] of nodes) {
    const grad = c.ctx.createRadialGradient(nx, ny, 0, nx, ny, 28)
    grad.addColorStop(0, rgba(color, 0.85 * c.brightness))
    grad.addColorStop(1, 'transparent')
    c.ctx.fillStyle = grad
    c.ctx.beginPath()
    c.ctx.arc(nx, ny, 28, 0, Math.PI * 2)
    c.ctx.fill()
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. SEXTILE — Hexagon Honeycomb (axial-coord tessellation)
// ═══════════════════════════════════════════════════════════════
export function drawHexagonHoneycomb(c: RenderContext) {
  const color = geomColor(c)
  const hexSize = 32 + 18 * c.geometryComplexity
  const maxRing = Math.max(2, Math.round(2 + c.geometryComplexity * 4))
  const t = c.t * 0.4 * c.motionIntensity

  // Flat-top hex axial coords (q, r). dist from center → ringIndex.
  for (let q = -maxRing; q <= maxRing; q++) {
    for (let r = -maxRing; r <= maxRing; r++) {
      const s = -q - r
      const ringIdx = Math.max(Math.abs(q), Math.abs(r), Math.abs(s))
      if (ringIdx > maxRing) continue

      const x = c.cx + hexSize * 1.5 * q
      const y = c.cy + hexSize * Math.sqrt(3) * (r + q / 2)

      // Outward harmonic wave
      const brightness = 0.3 + 0.7 * Math.sin(t * 1.4 - ringIdx * 0.5)
      const alpha = brightness * c.brightness * (1 - ringIdx / (maxRing + 1)) * 0.85

      drawHexCell(c.ctx, x, y, hexSize * 0.9, rgba(color, Math.max(0, alpha)))

      // Connecting "weave" lines at peak phase
      if (c.motionIntensity > 0.6 && ringIdx < maxRing) {
        const nx = c.cx + hexSize * 1.5 * (q + 1)
        const ny = y
        c.ctx.beginPath()
        c.ctx.moveTo(x + hexSize * 0.9, y)
        c.ctx.lineTo(nx - hexSize * 0.9, ny)
        c.ctx.strokeStyle = rgba(color, alpha * 0.45)
        c.ctx.lineWidth = 0.6
        c.ctx.stroke()
      }
    }
  }
}

function drawHexCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, stroke: string) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const px = x + Math.cos(angle) * size
    const py = y + Math.sin(angle) * size
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 0.9
  ctx.stroke()
}

// ═══════════════════════════════════════════════════════════════
// 6. QUINCUNX — Offset Spiral (sheared, correcting toward alignment)
// ═══════════════════════════════════════════════════════════════
export function drawOffsetSpiral(c: RenderContext) {
  const color = geomColor(c)
  const samples = Math.round(120 + 280 * c.geometryComplexity)
  const a = 6
  const b = 4

  // Skew center based on phase — drifts off-axis at peak, settles in integration
  const skewT = c.blendColors ? 0 : Math.sin(c.t * 0.5) * c.motionIntensity
  const skewX = skewT * 80
  const skewY = Math.cos(c.t * 0.4) * 40 * c.motionIntensity

  c.ctx.save()
  c.ctx.translate(c.cx + skewX, c.cy + skewY)
  // Apply shear transform — the "skewed lattice" feel
  c.ctx.transform(1, 0.18 * (1 - (c.blendColors ? 1 : 0)), 0.12 * c.motionIntensity, 1, 0, 0)

  c.ctx.strokeStyle = rgba(color, 0.55 * c.brightness)
  c.ctx.lineWidth = 1.1
  c.ctx.beginPath()
  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * Math.PI * 6
    const r = a + b * theta
    const px = Math.cos(theta) * r
    const py = Math.sin(theta) * r
    if (i === 0) c.ctx.moveTo(px, py)
    else c.ctx.lineTo(px, py)
  }
  c.ctx.stroke()

  // Particle scatter along the spiral path
  const partCount = Math.round(20 * c.geometryComplexity)
  for (let i = 0; i < partCount; i++) {
    const phase = ((i / partCount) + c.t * 0.04) % 1
    const theta = phase * Math.PI * 6
    const r = a + b * theta
    const px = Math.cos(theta) * r
    const py = Math.sin(theta) * r
    c.ctx.beginPath()
    c.ctx.arc(px, py, 1.6 + c.audioEnergy * 1.8, 0, Math.PI * 2)
    c.ctx.fillStyle = rgba(color, (0.4 + 0.6 * Math.sin(phase * Math.PI)) * c.brightness)
    c.ctx.fill()
  }
  c.ctx.restore()
}

// ─── Dispatcher ──────────────────────────────────────────────────

import type { GeometryKind } from '@/lib/protocol/aspectGeometryMap'

const renderers: Record<GeometryKind, (c: RenderContext) => void> = {
  concentricCircles: drawConcentricCircles,
  mirroredAxis:      drawMirroredAxis,
  gridCube:          drawGridCube,
  triangleFlow:      drawTriangleFlow,
  hexagonHoneycomb:  drawHexagonHoneycomb,
  offsetSpiral:      drawOffsetSpiral,
}

export function renderGeometry(geometry: GeometryKind, c: RenderContext) {
  const fn = renderers[geometry] ?? drawConcentricCircles
  fn(c)
}
