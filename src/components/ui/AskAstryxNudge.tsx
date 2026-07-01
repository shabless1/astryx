'use client'

/**
 * ASTRYX — Ask-Astryx Nudge  (Directive S · Part 7)
 * ════════════════════════════════════════════════════════════════════════════
 * The bridge between the deliberately-SHALLOW surfaces (report, summary, body
 * map, Explore Deeper) and the depth-on-demand brain. A gentle, contextual chip:
 * the report answers WHAT; Astryx answers WHY / HOW / WHERE-ELSE. We invite,
 * never overwhelm — anything not on the page is one warm tap away.
 */

interface Nudge { label: string; prompt: string }

export default function AskAstryxNudge({
  prompts,
  onAsk,
  accentColor = '#C084FC',
  className = '',
}: {
  /** One or more contextual invitations. */
  prompts: Nudge[]
  /** Opens the Astryx chat seeded with the prompt. */
  onAsk: (seed: string) => void
  accentColor?: string
  className?: string
}) {
  if (!prompts.length) return null
  const rgba = (hex: string, a: number) => {
    if (!hex.startsWith('#')) return hex
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {prompts.map((n) => (
        <button
          key={n.label}
          onClick={() => onAsk(n.prompt)}
          className="text-[11.5px] px-3 py-1.5 rounded-full transition-all duration-200"
          style={{
            background: rgba(accentColor, 0.08),
            border: `1px solid ${rgba(accentColor, 0.3)}`,
            color: 'rgba(255,255,255,0.82)',
            cursor: 'pointer',
          }}
        >
          {n.label} <span style={{ color: accentColor }}>→</span>
        </button>
      ))}
    </div>
  )
}
