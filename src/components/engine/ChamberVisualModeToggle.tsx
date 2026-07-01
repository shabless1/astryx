'use client'

/**
 * ASTRYX — Chamber Visual Mode Toggle (Phase 3)
 *
 * Body | Color | Mandala | Combined. Switching views NEVER touches audio, the
 * timer, or the session phase — it only changes which visual layer renders.
 *
 * Placement (SHA 2026-06-28): lives as the CENTER item of the chamber top bar,
 * in the empty band between the left "Resonance Chamber" panel and the right
 * session/exit panel. Sized to match those panels (same glass surface, height,
 * radius) so it reads as a peer control. State lives in the parent (SessionScreen);
 * this component is purely presentational.
 */

import { hexToRgba } from '@/lib/utils'

// SHA 2026-06-28 — 'combined' retired (the body map over the mandala overlapped
// and read as confusing). Body · Color · Mandala only.
export type ChamberVisualMode = 'body' | 'color' | 'mandala'

const MODES: { key: ChamberVisualMode; label: string; glyph: string }[] = [
  { key: 'body',     label: 'Body',     glyph: '☥' },
  { key: 'color',    label: 'Color',    glyph: '◓' },
  { key: 'mandala',  label: 'Mandala',  glyph: '✦' },
]

export default function ChamberVisualModeToggle({
  value, onChange, accentColor,
}: {
  value: ChamberVisualMode
  onChange: (m: ChamberVisualMode) => void
  accentColor: string
}) {
  return (
    <div
      className="inline-flex items-center p-1 rounded-2xl pointer-events-auto flex-shrink-0"
      style={{
        background: 'rgba(5,7,20,0.7)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
      role="tablist"
      aria-label="Chamber visual view"
    >
      {MODES.map((m) => {
        const active = value === m.key
        return (
          <button
            key={m.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.key)}
            title={m.label}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-[12px] tracking-[0.16em] uppercase transition-all"
            style={{
              background: active ? hexToRgba(accentColor, 0.22) : 'transparent',
              color: active ? accentColor : 'rgba(255,255,255,0.6)',
              border: active ? `1px solid ${hexToRgba(accentColor, 0.5)}` : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: active ? 600 : 400,
            }}
          >
            <span className="text-[13px] sm:text-[14px] opacity-85" aria-hidden>{m.glyph}</span>
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
