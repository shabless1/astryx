'use client'

/**
 * ASTRYX — Mandala Performance / Fallback Logic (Phase 3B)
 *
 * Renderer ladder:  webgl → svg → css
 *   webgl : R3F custom GLSL kaleidoscope (richest)
 *   svg   : layered SVG kaleidoscope (no WebGL, or low power, or runtime error)
 *   css   : radial-gradient soft field (very low power)
 *
 * Fallback triggers: WebGL unavailable · low power / battery-saver · reduced-motion.
 * Reduced-motion → SVG with rotation frozen (breath pulse only) — handled by the
 * `reducedMotion` flag + the global prefers-reduced-motion CSS rule.
 */

import { useEffect, useState } from 'react'

export type MandalaRenderer = 'webgl' | 'svg' | 'css'

export interface RendererDecision {
  renderer: MandalaRenderer
  reducedMotion: boolean
}

export function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl') || (c as any).getContext('experimental-webgl'))
  } catch {
    return false
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export function isLowPower(): boolean {
  if (typeof navigator === 'undefined') return false
  try {
    const n = navigator as any
    const cores = n.hardwareConcurrency ?? 8
    const mem = n.deviceMemory ?? 8
    const saveData = n.connection?.saveData ?? false
    return saveData || cores <= 4 || mem <= 4
  } catch {
    return false
  }
}

// AUTO defaults to the (premium, upgraded) SVG kaleidoscope because it renders
// reliably everywhere — WebGL was dropping its GPU context on some hardware
// (THREE "Context Lost"), which made it blank. WebGL is still available on demand:
// the in-Chamber "3D" toggle forces it via resolveRenderer() regardless of this
// flag, with context-loss → SVG fallback. Flip to true to make WebGL the default
// again once it's confirmed stable on the target devices.
const ENABLE_WEBGL = false

export function decideRenderer(): RendererDecision {
  // Reduced motion → SVG, rotation frozen, breath pulse only.
  if (prefersReducedMotion()) return { renderer: 'svg', reducedMotion: true }
  if (ENABLE_WEBGL && detectWebGL() && !isLowPower()) return { renderer: 'webgl', reducedMotion: false }
  return { renderer: 'svg', reducedMotion: false }
}

/** Resolve the effective renderer given a user override ('auto' uses detection). */
export function resolveRenderer(
  override: 'auto' | 'webgl' | 'svg',
  auto: RendererDecision,
): RendererDecision {
  if (override === 'svg') return { renderer: 'svg', reducedMotion: auto.reducedMotion }
  if (override === 'webgl') {
    // honour reduced-motion even when WebGL is forced
    if (auto.reducedMotion || !detectWebGL()) return { renderer: 'svg', reducedMotion: auto.reducedMotion }
    return { renderer: 'webgl', reducedMotion: false }
  }
  return auto
}

/**
 * SSR-safe: starts as 'svg' (never blank, no hydration mismatch), then upgrades
 * to the best available renderer after mount.
 */
export function useMandalaRenderer(): RendererDecision {
  const [decision, setDecision] = useState<RendererDecision>({ renderer: 'svg', reducedMotion: false })
  useEffect(() => {
    setDecision(decideRenderer())
    // React to a live reduced-motion change.
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      const onChange = () => setDecision(decideRenderer())
      mq.addEventListener?.('change', onChange)
      return () => mq.removeEventListener?.('change', onChange)
    }
  }, [])
  return decision
}
