'use client'

import { useState, useEffect } from 'react'
import { hexToRgb, hexToRgba } from '@/lib/utils'

const PHASES = [
  'Parsing natal positions...',
  'Detecting planetary patterns...',
  'Scoring aspect configurations...',
  'Mapping sign localizations...',
  'Cross-referencing your signals...',
  'Building sensory protocol...',
]

export default function AnalysisScreen({ accentColor }: { accentColor: string }) {
  const rgb = hexToRgb(accentColor)
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIdx((p) => (p + 1) % PHASES.length)
    }, 580)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 font-rajdhani">
      {/* Sacred Geometry Loader */}
      <div className="relative" style={{ width: 280, height: 280, marginBottom: 56 }}>
        {/* Outer ring with dots */}
        <div
          className="absolute"
          style={{
            inset: -24,
            borderRadius: '50%',
            border: `1px solid rgba(${rgb},0.18)`,
            animation: 'rotate 20s linear infinite',
          }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className="absolute rounded-full"
              style={{
                top: '50%',
                left: '50%',
                width: 5,
                height: 5,
                marginTop: -2.5,
                marginLeft: -2.5,
                background: accentColor,
                opacity: 0.7,
                transform: `rotate(${angle}deg) translateX(164px)`,
              }}
            />
          ))}
        </div>

        {/* Mid ring with hexagon nodes */}
        <div
          className="absolute"
          style={{
            inset: 24,
            borderRadius: '50%',
            border: `1px solid rgba(${rgb},0.3)`,
            animation: 'counterRotate 12s linear infinite',
          }}
        >
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <div
              key={angle}
              className="absolute rounded-full"
              style={{
                top: '50%',
                left: '50%',
                width: 8,
                height: 8,
                marginTop: -4,
                marginLeft: -4,
                border: `1.5px solid ${accentColor}`,
                background: hexToRgba(accentColor, 0.2),
                opacity: 0.9,
                transform: `rotate(${angle}deg) translateX(92px)`,
              }}
            />
          ))}
        </div>

        {/* Inner SVG Hexagon */}
        <div
          className="absolute"
          style={{
            inset: 60,
            animation: 'rotate 8s linear infinite',
            opacity: 0.75,
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon
              points="50,5 93,27 93,73 50,95 7,73 7,27"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.2"
            />
            <line x1="50" y1="5" x2="50" y2="95" stroke={accentColor} strokeWidth="0.5" opacity="0.4" />
            <line x1="7" y1="27" x2="93" y2="73" stroke={accentColor} strokeWidth="0.5" opacity="0.4" />
            <line x1="93" y1="27" x2="7" y2="73" stroke={accentColor} strokeWidth="0.5" opacity="0.4" />
            {[0, 60, 120, 180, 240, 300].map((a, i) => {
              const rad = (a * Math.PI) / 180
              const x = 50 + 40 * Math.sin(rad)
              const y = 50 - 40 * Math.cos(rad)
              return (
                <circle key={i} cx={x} cy={y} r="16" fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.3" />
              )
            })}
          </svg>
        </div>

        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full animate-pulse-glow"
            style={{
              width: 64,
              height: 64,
              background: `radial-gradient(circle, rgba(${rgb},0.4) 0%, transparent 70%)`,
              border: `1px solid rgba(${rgb},0.5)`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 22,
              height: 22,
              background: hexToRgba(accentColor, 0.9),
              boxShadow: `0 0 24px rgba(${rgb},0.9), 0 0 48px rgba(${rgb},0.4)`,
            }}
          />
        </div>

        {/* Ripple rings */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              border: `1px solid rgba(${rgb},0.3)`,
              animation: `ripple 3s ${i * 1}s ease-out infinite`,
              transformOrigin: 'center',
            }}
          />
        ))}
      </div>

      {/* Text block */}
      <div className="text-center">
        <h2 className="font-cinzel text-2xl font-semibold tracking-[0.15em] text-white mb-2">
          Analyzing Your Resonance
        </h2>
        <p
          className="text-[11px] tracking-[0.3em] uppercase text-white/40 transition-all duration-300"
          style={{ minHeight: 20 }}
        >
          {PHASES[phaseIdx]}
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="mt-8 rounded-sm overflow-hidden"
        style={{ width: 280, height: 2, background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-sm"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor})`,
            animation: 'progressFill 3.5s linear forwards',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progressFill {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
