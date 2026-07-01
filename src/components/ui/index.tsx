'use client'

/**
 * ASTRYX shared UI primitives.
 *
 * Built from CLAUDE.md v1.4 design system:
 *   bg #020208 · gold #F59E0B · purple #C084FC · cyan #38BDF8
 *   wordmark Cinzel Decorative · headings Cinzel · body Exo 2
 *
 * All components accept the accent color as a prop so a per-blueprint
 * accent (driven by dominant planet) can flow through every surface.
 */

import { ReactNode, CSSProperties, ChangeEvent } from 'react'
import type { AppMode } from '@/types'
import { hexToRgba } from '@/lib/utils'

// ──────────────────────────────────────────────────────────────
// GlassCard — surface card with frosted-glass border + subtle inner glow
// ──────────────────────────────────────────────────────────────
export function GlassCard({
  children,
  className = '',
  style,
  accentColor,
  opacity = 0.22,        // strength of the accent border tint
  topBorder = false,     // adds a glowing top edge (used on payment confirmation)
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  accentColor?: string
  opacity?: number
  topBorder?: boolean
}) {
  const accent = accentColor || '#22D3EE'
  // Hologram recipe per PR #2: vertical gradient bg, cyan hairline borders
  // with a brighter top "scan-pass" rim, layered inset+halo+drop shadows.
  // Per-planet accent shows in border + glow only — never washes the body.
  return (
    <div
      className={`relative rounded-xl backdrop-blur-md transition-all duration-300 ${className}`}
      style={{
        background:
          'linear-gradient(180deg, rgba(8,14,28,0.72) 0%, rgba(2,2,8,0.92) 100%)',
        border: `1px solid ${hexToRgba(accent, Math.max(0.22, opacity))}`,
        borderTop: `1px solid ${hexToRgba(accent, topBorder ? 0.65 : 0.4)}`,
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.06)',
          `0 0 0 1px ${hexToRgba(accent, 0.08)}`,
          `0 24px 60px -24px ${hexToRgba(accent, 0.30)}`,
        ].join(', '),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// PrimaryButton — universal CTA
// ──────────────────────────────────────────────────────────────
export function PrimaryButton({
  label,
  onClick,
  accent = '#22D3EE',
  outlined = false,
  glow = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
}: {
  label: ReactNode
  onClick?: () => void
  accent?: string
  outlined?: boolean
  glow?: boolean
  fullWidth?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}) {
  const filled = !outlined
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-heading text-sm tracking-[0.18em] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      }`}
      style={{
        background: filled ? accent : 'transparent',
        color: filled ? '#020208' : '#FFFFFF',
        border: `1px solid ${filled ? accent : hexToRgba(accent, 0.55)}`,
        boxShadow: glow
          ? `0 0 28px -4px ${hexToRgba(accent, 0.7)}, 0 0 56px -16px ${hexToRgba(accent, 0.5)}`
          : 'none',
      }}
    >
      {label}
    </button>
  )
}

// ──────────────────────────────────────────────────────────────
// SectionLabel — small uppercase Cinzel label
// ──────────────────────────────────────────────────────────────
export function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`font-heading uppercase tracking-[0.3em] text-[0.7rem] text-purple ${className}`}
    >
      {children}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// FormField — labeled input
// ──────────────────────────────────────────────────────────────
export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  accentColor = '#22D3EE',
  disabled = false,
  className = '',
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  accentColor?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span
        className="block font-heading uppercase tracking-[0.18em] text-[0.72rem] text-slate mb-1.5"
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-lg bg-[rgba(15,15,26,0.7)] text-white placeholder-slate/60 outline-none transition-all duration-150"
        style={{
          border: `1px solid ${hexToRgba(accentColor, 0.22)}`,
          boxShadow: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.7)
          e.currentTarget.style.boxShadow = `0 0 0 3px ${hexToRgba(accentColor, 0.12)}`
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.22)
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
    </label>
  )
}

// ──────────────────────────────────────────────────────────────
// ModeToggle — Free vs Practitioner mode pill
// ──────────────────────────────────────────────────────────────
export function ModeToggle({
  mode,
  setMode,
  accentColor = '#22D3EE',
}: {
  mode: AppMode
  setMode: (m: AppMode) => void
  accentColor?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Mode"
      className="inline-flex items-center p-1 rounded-full"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${hexToRgba(accentColor, 0.18)}` }}
    >
      {(['free', 'practitioner'] as AppMode[]).map((m) => {
        const active = mode === m
        return (
          <button
            key={m}
            role="radio"
            aria-checked={active}
            onClick={() => setMode(m)}
            className="px-3.5 py-1.5 rounded-full font-heading uppercase tracking-[0.18em] text-[0.62rem] transition-all"
            style={{
              background: active ? accentColor : 'transparent',
              color: active ? '#020208' : 'rgba(255,255,255,0.7)',
            }}
          >
            {m}
          </button>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// PlanetBadge — glyph + name pill
// ──────────────────────────────────────────────────────────────
const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Chiron: '⚷', 'North Node': '☊', 'South Node': '☋',
  Ascendant: 'ASC', Midheaven: 'MC',
}

export function PlanetBadge({
  name,
  accent,
}: {
  name: string
  accent?: string
}) {
  const glyph = PLANET_GLYPHS[name] || '✦'
  const color = accent || '#22D3EE'
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] tracking-[0.15em] uppercase"
      style={{
        background: hexToRgba(color, 0.10),
        border: `1px solid ${hexToRgba(color, 0.35)}`,
        color: '#FFFFFF',
      }}
    >
      <span style={{ color, fontSize: '0.9rem', lineHeight: 1 }}>{glyph}</span>
      {name}
    </span>
  )
}

// ──────────────────────────────────────────────────────────────
// Tag — generic label pill
// ──────────────────────────────────────────────────────────────
export function Tag({
  label,
  accent = 'rgba(255,255,255,0.25)',
  small = false,
}: {
  label: ReactNode
  accent?: string
  small?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-body tracking-[0.12em] uppercase ${
        small ? 'px-2 py-0.5 text-[0.6rem]' : 'px-2.5 py-1 text-[0.66rem]'
      }`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accent}`,
        color: 'rgba(255,255,255,0.85)',
      }}
    >
      {label}
    </span>
  )
}

// ──────────────────────────────────────────────────────────────
// DataPoint — label + value pair
// ──────────────────────────────────────────────────────────────
export function DataPoint({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div>
      <div className="font-heading uppercase tracking-[0.18em] text-[0.6rem] text-slate mb-0.5">
        {label}
      </div>
      <div className="text-sm text-white/95 leading-snug">
        {value ?? '—'}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// ConfidenceBar — 0–100 progress strip
// ──────────────────────────────────────────────────────────────
export function ConfidenceBar({
  value,
  color = '#22D3EE',
}: {
  value: number
  color?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full">
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 12px -2px ${hexToRgba(color, 0.7)}`,
          }}
        />
      </div>
      <div className="text-[0.6rem] tracking-[0.2em] uppercase text-slate/80 mt-1">
        {pct.toFixed(0)}% confidence
      </div>
    </div>
  )
}
