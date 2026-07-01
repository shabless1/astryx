'use client'

/**
 * ASTRYX — Mandala Shader Plane (Phase 3B · WebGL primary)
 *
 * A fullscreen kaleidoscope shader quad (drei ScreenQuad). u_time + u_breathPhase
 * advance per frame; all other uniforms are driven by the mandala spec. Breath
 * phase is a smooth sine over the breath cycle (inhale expand / exhale settle).
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ScreenQuad } from '@react-three/drei'
import * as THREE from 'three'
import type { KaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'
import {
  mandalaVertexShader, mandalaFragmentShader, makeMandalaUniforms,
  signalStateToInt,
} from './KaleidoscopeShaderMaterial'

export default function MandalaShaderPlane({ mandala }: { mandala: KaleidoscopeMandala }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => makeMandalaUniforms(), [])

  // Drive mandala-derived uniforms each render (cheap, just assignments).
  const u = uniforms
  u.u_symmetryCount.value = mandala.symmetryCount
  u.u_shaderMode.value = mandala.shaderMode
  u.u_rotationPrimary.value = mandala.rotationPrimary
  u.u_rotationSecondary.value = mandala.rotationSecondary
  u.u_intensity.value = mandala.intensity
  u.u_brightness.value = mandala.brightness
  u.u_depth.value = mandala.depth
  u.u_softness.value = mandala.softness
  u.u_signalState.value = signalStateToInt(mandala.drift, mandala.bloom)
  ;(u.u_planetPrimaryColor.value as THREE.Color).set(mandala.colorPalette[0])
  ;(u.u_planetSecondaryColor.value as THREE.Color).set(mandala.colorPalette[1])
  ;(u.u_planetAccentColor.value as THREE.Color).set(mandala.colorPalette[2])
  ;(u.u_chakraAccentColor.value as THREE.Color).set(mandala.chakraAccent ?? '#000000')
  u.u_chakraStrength.value = mandala.chakraAccent ? 0.18 : 0

  useFrame((_state, delta) => {
    const mu = matRef.current?.uniforms
    if (!mu) return
    // clamp delta so a tab-restore can't jump the animation
    mu.u_time.value += Math.min(0.05, delta)
    const cyc = Math.max(6, mandala.pulseRate)
    mu.u_breathPhase.value = 0.5 + 0.5 * Math.sin((mu.u_time.value / cyc) * Math.PI * 2 - Math.PI / 2)
  })

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={mandalaVertexShader}
        fragmentShader={mandalaFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </ScreenQuad>
  )
}
