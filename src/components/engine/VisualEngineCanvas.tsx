'use client'

/**
 * Astryx Visual Engine v4.0 — Aspect-Driven Sacred Geometry Renderer
 * Per Final 20% Directive §3-10, acceptance criteria 1-5.
 *
 * What changed from v3:
 *   • Geometry is now aspect-driven (concentric / mirrored / grid / triangle /
 *     hexagon / spiral), not "circles for everything"
 *   • Each session evolves through 5 phases (Entry → Activation → Peak →
 *     Regulation → Integration) driven by sessionTime / totalDuration
 *   • Regulator color enters during Regulation phase
 *   • Color palette comes from dominant planet (planetColorMap), not just accent
 *   • Element + Modality drive movement speed, glow, line style, motion behavior
 *   • Audio energy still modulates pulse amplitude in real time
 *
 * Canvas 2D — no Three.js (~180 KB bundle saved).
 */

import { useEffect, useRef } from 'react'
import type { ProtocolOutput } from '@/types'
import { getWaveformData } from '@/lib/soundEngine'
import { geometryForAspect } from '@/lib/protocol/aspectGeometryMap'
import { paletteForPlanet, regulatorForPlanet, regulatorColorMap } from '@/lib/protocol/planetColorMap'
import { elementVisualFor, modalityMotionFor } from '@/lib/protocol/elementModalityMaps'
import { getBlendedPhaseValues } from '@/lib/protocol/sessionPhaseMap'
import { renderGeometry, type RenderContext } from '@/lib/visual/geometryEngine'

interface VisualEngineCanvasProps {
  // v4.3 — null for the chart-independent Full Body ladder (neutral visuals).
  protocol: ProtocolOutput | null
  accentColor: string
  /** Wall-clock elapsed seconds (drives phase progression) */
  sessionTime?: number
  /** Total session duration (defaults to 1200s = 20 min) */
  totalDuration?: number
  /**
   * Polarity color override. When the Remedy Polarity Engine has applied a
   * corrective (e.g. Mars excess → cooling), SessionScreen passes the chamber's
   * corrective palette here so the visual field flips to the regulator's colors
   * (blues/greens for Mars excess) instead of amplifying the detected planet.
   * Geometry still comes from the aspect — only color shifts.
   */
  colorOverride?: { primary: string; secondary: string; regulator: string } | null
}

// Parse #RRGGBB into RGB tuple. Falls back to cyan #22D3EE.
function parseHex(hex: string): [number, number, number] {
  const clean = (hex || '').replace('#', '')
  if (clean.length < 6) return [34, 211, 238]
  return [
    parseInt(clean.slice(0, 2), 16) || 34,
    parseInt(clean.slice(2, 4), 16) || 211,
    parseInt(clean.slice(4, 6), 16) || 238,
  ]
}

export default function VisualEngineCanvas({
  protocol,
  accentColor,
  sessionTime,
  totalDuration = 1200,
  colorOverride,
}: VisualEngineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const timeRef   = useRef(0)
  const energyRef = useRef(0)
  const sessionTimeRef = useRef(0)
  const totalDurationRef = useRef(totalDuration)

  // Keep refs in sync without restarting the RAF loop
  useEffect(() => { sessionTimeRef.current = sessionTime ?? 0 }, [sessionTime])
  useEffect(() => { totalDurationRef.current = totalDuration }, [totalDuration])

  // v4.3 — neutral defaults when no protocol (Full Body ladder): a calm
  // Earth-toned trine field, identical for every user.
  const pattern = protocol?.dominant_pattern
  const aspect  = pattern?.aspect ?? 'trine'
  const planet1 = pattern?.planets?.[0] ?? 'Sun'
  const planet2 = pattern?.planets?.[1] ?? planet1
  const elementModality = pattern?.element_modality ?? 'earth fixed'
  const [elementToken, modalityToken] = elementModality.split(/\s+/)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Resolve aspect → geometry kind once
    const { geometry } = geometryForAspect(aspect)

    // Planet palettes (primary planet → primary palette; secondary planet → secondary).
    // Polarity override: when a corrective is active, the chamber's corrective
    // palette replaces the planet palette so the visual cools/warms/grounds with
    // the chamber instead of amplifying the detected planet's raw character.
    const p1 = paletteForPlanet(planet1)
    const p2 = paletteForPlanet(planet2)
    const regulatorRole = regulatorForPlanet(planet1)
    const primaryRgb   = parseHex(colorOverride?.primary   ?? p1.primary)
    const secondaryRgb = parseHex(colorOverride?.secondary ?? p2.primary)
    const regulatorRgb = parseHex(colorOverride?.regulator ?? regulatorColorMap[regulatorRole])

    // Element + modality modifiers
    const element  = elementVisualFor(elementToken)
    const modality = modalityMotionFor(modalityToken)

    const animate = () => {
      const W = parseFloat(canvas.style.width)
      const H = parseFloat(canvas.style.height)
      const cx = W / 2
      const cy = H / 2

      // ─── Audio energy (RMS, smoothed) ──────────────────────
      const waveform = getWaveformData()
      if (waveform && waveform.length > 0) {
        let sum = 0
        for (let k = 0; k < waveform.length; k++) sum += waveform[k] * waveform[k]
        const rms = Math.sqrt(sum / waveform.length)
        energyRef.current = energyRef.current * 0.82 + rms * 0.18
      } else {
        // H.3 — the synthesis layer no longer runs (music-only chamber), so the
        // Tone waveform tap is silent. Breathe on a gentle deterministic pulse
        // instead of decaying to stillness.
        const t = performance.now() / 1000
        const breath = 0.10 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.45))
        energyRef.current = energyRef.current * 0.95 + breath * 0.05
      }
      const audioEnergy = energyRef.current

      // ─── Phase resolution ──────────────────────────────────
      const phase = getBlendedPhaseValues(sessionTimeRef.current, totalDurationRef.current)

      // ─── Background gradient — tinted by current phase color ────
      ctx.clearRect(0, 0, W, H)
      const bgTint = phase.blendColors ? regulatorRgb : primaryRgb
      const bg = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy, Math.max(W, H) * 0.85)
      bg.addColorStop(0, `rgba(${bgTint[0]}, ${bgTint[1]}, ${bgTint[2]}, ${0.06 * phase.brightness})`)
      bg.addColorStop(0.5, 'rgba(2, 2, 8, 0.75)')
      bg.addColorStop(1, 'rgba(2, 2, 8, 0.96)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // ─── Render aspect-driven geometry ─────────────────────
      const renderCtx: RenderContext = {
        ctx,
        cx,
        cy,
        width: W,
        height: H,
        t: timeRef.current,
        brightness: phase.brightness,
        motionIntensity: phase.motionIntensity,
        geometryComplexity: phase.geometryComplexity,
        introduceRegulator: phase.introduceRegulator,
        blendColors: phase.blendColors,
        audioEnergy,
        primary:   primaryRgb,
        secondary: secondaryRgb,
        regulator: regulatorRgb,
        element,
        modality,
      }
      renderGeometry(geometry, renderCtx)

      // ─── Persistent orbital particles (planet color washes) ────
      const t = timeRef.current
      const orbitCount = Math.round(36 * phase.geometryComplexity)
      for (let i = 0; i < orbitCount; i++) {
        const useReg = phase.blendColors && i % 3 === 0
        const col = useReg ? regulatorRgb : (i % 2 === 0 ? primaryRgb : secondaryRgb)
        const a = (i / orbitCount) * Math.PI * 2 + t * (0.18 + (i % 3) * 0.06) * phase.motionIntensity
        const r = 150 + Math.sin(t * 1.2 + i * 0.3) * 40 + audioEnergy * 26
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        const size = 1.4 + Math.sin(t + i) * 0.7 + audioEnergy * 1.2
        const alpha = (0.32 + Math.sin(t * 1.0 + i) * 0.22) * phase.brightness
        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${Math.min(0.95, alpha + audioEnergy * 0.2)})`
        ctx.fill()
      }

      // Time advances faster at peak, slower at entry/integration
      timeRef.current += 0.012 * phase.motionIntensity * element.movementSpeed + audioEnergy * 0.008
      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
    // accentColor intentionally NOT in deps — palette comes from planet,
    // accentColor stays only as a fallback. aspect/planet/polarity change ↦ re-init.
  }, [aspect, planet1, planet2, elementToken, modalityToken,
      colorOverride?.primary, colorOverride?.secondary, colorOverride?.regulator])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      data-aspect={aspect}
    />
  )
}
