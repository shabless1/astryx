'use client'

import { useEffect, useRef, useMemo } from 'react'
import type { AppScreen } from '@/types'
import { hexToRgb, seededRandom } from '@/lib/utils'

interface CosmicBackgroundProps {
  screen: AppScreen
  accentColor: string
  dominantPlanet?: string   // Play 2 — drives atmosphere tint + hue rotation
}

interface Star {
  x: number
  y: number
  size: number
  delay: number
  duration: number
  opacity: number
}

// ── Planet atmosphere configuration ────────────────────────────
// Each planet gets a unique atmospheric color character applied as:
//   • hueRot  — hue-rotate degrees on the background video
//   • atmosRgb — secondary nebula color (R,G,B string)
//   • nebulaStrength — opacity of the secondary nebula layer (0–1)
//   • nebulaPos — CSS ellipse center (e.g. "75% 25%") for placement contrast
//
// Design intent: the user's planetary signature shapes the entire room.
// Saturn feels containment-dark. Mars feels kinetic-red. Neptune drifts oceanic.
const PLANET_ATMOSPHERE: Record<string, {
  hueRot: number
  atmosRgb: string
  nebulaStrength: number
  nebulaPos: string
}> = {
  sun:     { hueRot: 28,  atmosRgb: '244,169,64',   nebulaStrength: 0.13, nebulaPos: '75% 25%' },
  moon:    { hueRot: 195, atmosRgb: '168,195,220',  nebulaStrength: 0.09, nebulaPos: '25% 30%' },
  mercury: { hueRot: 58,  atmosRgb: '188,224,60',   nebulaStrength: 0.10, nebulaPos: '80% 70%' },
  venus:   { hueRot: 145, atmosRgb: '72,200,140',   nebulaStrength: 0.11, nebulaPos: '30% 70%' },
  mars:    { hueRot: 0,   atmosRgb: '220,60,50',    nebulaStrength: 0.14, nebulaPos: '70% 30%' },
  jupiter: { hueRot: 235, atmosRgb: '100,120,200',  nebulaStrength: 0.10, nebulaPos: '20% 25%' },
  saturn:  { hueRot: 265, atmosRgb: '90,80,130',    nebulaStrength: 0.08, nebulaPos: '80% 80%' },
  uranus:  { hueRot: 178, atmosRgb: '56,190,248',   nebulaStrength: 0.12, nebulaPos: '50% 18%' },
  neptune: { hueRot: 215, atmosRgb: '100,130,210',  nebulaStrength: 0.10, nebulaPos: '35% 65%' },
  pluto:   { hueRot: 340, atmosRgb: '150,40,40',    nebulaStrength: 0.09, nebulaPos: '65% 85%' },
}
const DEFAULT_ATMOSPHERE = {
  hueRot: 0,
  atmosRgb: '192,132,252',
  nebulaStrength: 0.07,
  nebulaPos: '20% 40%',
}

export default function CosmicBackground({
  screen,
  accentColor,
  dominantPlanet,
}: CosmicBackgroundProps) {
  const rgb = hexToRgb(accentColor)
  const showFemale = ['intake', 'analysis', 'history', 'settings'].includes(screen)
  const showMale = ['results', 'practitioner'].includes(screen)

  // Resolve atmosphere for current dominant planet
  const atm = dominantPlanet
    ? (PLANET_ATMOSPHERE[dominantPlanet.toLowerCase()] ?? DEFAULT_ATMOSPHERE)
    : DEFAULT_ATMOSPHERE

  // ── Three-layer parallax star field (Play 3) ──────────────────
  // Stars split into far / mid / near depth layers.
  // Each layer uses a different seeded RNG so positions are independent.
  // Near stars are larger, brighter, and shift most on mouse movement.
  // Far stars are tiny, dim, and barely move — creating spatial depth.
  // PR #2 — hologram pivot — star counts capped per handoff doc
  // (50 / 25 / 10 vs prior 100 / 70 / 30) and tinted cyan #9BE9FF.
  const farStars = useMemo<Star[]>(() => {
    const rng = seededRandom(42)
    return Array.from({ length: 50 }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 1.1 + 0.3,
      delay: rng() * 6,
      duration: rng() * 4 + 3,
      opacity: rng() * 0.35 + 0.1,
    }))
  }, [])

  const midStars = useMemo<Star[]>(() => {
    const rng = seededRandom(142)
    return Array.from({ length: 25 }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 1.5 + 0.6,
      delay: rng() * 5,
      duration: rng() * 3 + 2,
      opacity: rng() * 0.5 + 0.2,
    }))
  }, [])

  const nearStars = useMemo<Star[]>(() => {
    const rng = seededRandom(242)
    return Array.from({ length: 10 }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 2.2 + 1,
      delay: rng() * 4,
      duration: rng() * 2.5 + 1.5,
      opacity: rng() * 0.7 + 0.3,
    }))
  }, [])

  // Refs for the three star layer wrappers — transform applied directly
  // to avoid React re-renders on every mousemove frame.
  const farLayerRef  = useRef<HTMLDivElement>(null)
  const midLayerRef  = useRef<HTMLDivElement>(null)
  const nearLayerRef = useRef<HTMLDivElement>(null)
  const mouseRef     = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const applyParallax = () => {
      const { x, y } = mouseRef.current
      const dx = x - 0.5  // −0.5 to 0.5
      const dy = y - 0.5

      // Layer coefficients: near moves most (depth illusion)
      if (farLayerRef.current) {
        farLayerRef.current.style.transform = `translate(${dx * 7}px, ${dy * 5}px)`
      }
      if (midLayerRef.current) {
        midLayerRef.current.style.transform = `translate(${dx * 17}px, ${dy * 13}px)`
      }
      if (nearLayerRef.current) {
        nearLayerRef.current.style.transform = `translate(${dx * 32}px, ${dy * 24}px)`
      }
    }

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
      applyParallax()
    }

    // Mobile: device tilt drives parallax instead of cursor
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return
      mouseRef.current = {
        x: 0.5 + Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 90)),
        y: 0.5 + Math.max(-0.3, Math.min(0.3, (e.beta  ?? 0) / 90)),
      }
      applyParallax()
    }

    window.addEventListener('mousemove', handleMouse, { passive: true })
    window.addEventListener('deviceorientation', handleOrientation, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  // Shared inline style for star layer wrappers
  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '-5%',            // slight oversize so stars don't clip at edges during parallax
    width: '110%',
    height: '110%',
    transition: 'transform 1.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
    willChange: 'transform',
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">

      {/* Deep space base — pure #020208 per hologram pivot */}
      <div className="absolute inset-0" style={{ background: '#020208' }} />

      {/* Background video — clipped to a HUD lower-third readout strip
          (not full-bleed) per handoff doc. hue-rotate retained. */}
      <video
        className="absolute w-full object-cover"
        style={{
          left: 0,
          right: 0,
          bottom: '8%',
          height: '20%',
          opacity: screen === 'session' ? 0.18 : 0.10,
          transition: 'opacity 1.5s ease, filter 2s ease',
          filter: `hue-rotate(${atm.hueRot}deg) saturate(1.4)`,
          clipPath: 'inset(0 8% round 8px)',
        }}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/ASTRYX_BACKGROUND_VIDEO.mp4" type="video/mp4" />
        <source src="/videos/background_video_2.mp4" type="video/mp4" />
      </video>

      {/* Top horizon glow — single cyan band, replaces all purple nebulae */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(94,224,255,0.10) 0%, transparent 240px)',
        }}
      />

      {/* Grid mesh — always on, scaffolds the medical-scanner field */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(94,224,255,0.04) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(94,224,255,0.04) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '64px 64px',
        }}
      />

      {/* Subtle planet-tint vignette (kept very low) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 70% 50% at ${atm.nebulaPos}, rgba(${atm.atmosRgb},${Math.min(atm.nebulaStrength, 0.05)}) 0%, transparent 65%)`,
        }}
      />

      {/* Bottom black falloff — gives content room to breathe */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 60%, rgba(2,2,8,0.7) 100%)',
        }}
      />

      {/* ── Parallax star layers (Play 3) ────────────────────── */}

      {/* Far layer — tiny, dim, barely moves */}
      <div ref={farLayerRef} style={layerStyle}>
        {farStars.map((s, i) => (
          <div
            key={`f${i}`}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: '#9BE9FF',
              opacity: s.opacity,
              animation: `starTwinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Mid layer — medium depth */}
      <div ref={midLayerRef} style={layerStyle}>
        {midStars.map((s, i) => (
          <div
            key={`m${i}`}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: '#9BE9FF',
              opacity: s.opacity,
              animation: `starTwinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Near layer — largest, brightest, most movement */}
      <div ref={nearLayerRef} style={layerStyle}>
        {nearStars.map((s, i) => (
          <div
            key={`n${i}`}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: '#9BE9FF',
              opacity: s.opacity,
              animation: `starTwinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Female figure — intake / analysis / history / settings */}
      {showFemale && (
        <div className="absolute inset-0 flex items-end justify-center overflow-hidden pointer-events-none">
          <img
            src="/images/ASTRYX_BACKGROUND.png"
            alt=""
            className="h-[88%] w-auto object-contain object-bottom animate-cosmic-breath"
            style={{
              // Lower opacity so it doesn't compete with foreground content
              opacity: 0.18,
              filter: `drop-shadow(0 0 60px rgba(94,224,255,0.25))`,
              transition: 'opacity 1.5s ease, filter 1.5s ease',
            }}
          />
        </div>
      )}

      {/* Right-side body figure REMOVED — competed with the new BodyMap
          which now uses the high-fidelity per-sex holographic anatomy.
          The grid mesh + scanlines + horizon glow carry these screens. */}

      {/* Analysis screen overlay */}
      {screen === 'analysis' && (
        <div
          className="absolute inset-0 scan-lines pointer-events-none"
          style={{ opacity: 0.4 }}
        />
      )}

      {/* Accent glow ring at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] transition-all duration-1000"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${rgb},0.4), transparent)`,
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(5,7,20,0.85))',
        }}
      />
    </div>
  )
}
