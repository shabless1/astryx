// ─── SACRED TONES — FORK OWNERSHIP (Directive v2 Part C2) ─────
// The physical product is the 10 PLANETARY tuning forks. The
// sacredTones_nervousSystem.json file also contains three Earth/cosmic
// reference tones (Earth Day 194.18 Hz, Earth Year/Om 136.10 Hz, Platonic
// Year) — these are NOT forks the user holds. They are APP-PLAYED background
// tones. The app must never instruct a user to "strike/apply" one of these;
// instead it pairs them with a planetary fork the user owns.
export const APP_PLAYED_TONES: ReadonlySet<string> = new Set([
  'Earth Day', 'Earth Year', 'Platonic Year',
])

/** True when this Sacred-Tone name is a physical planetary fork the user owns. */
export function isOwnedPlanetaryFork(forkName: string): boolean {
  return !APP_PLAYED_TONES.has(forkName)
}

// ─── COLOR UTILITIES ─────────────────────────────────────────
export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) || 0
  const g = parseInt(clean.slice(2, 4), 16) || 0
  const b = parseInt(clean.slice(4, 6), 16) || 0
  return `${r},${g},${b}`
}

export function hexToRgba(hex: string, alpha: number): string {
  return `rgba(${hexToRgb(hex)},${alpha})`
}

// ─── GLASS MORPHISM STYLE ────────────────────────────────────
export function glassStyle(
  accentColor?: string,
  opacity = 0.05,
  blur = 20
): React.CSSProperties {
  const bg = accentColor
    ? `rgba(${hexToRgb(accentColor)},${opacity})`
    : `rgba(255,255,255,${opacity})`
  return {
    background: bg,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
  }
}

// ─── FORMAT TIME ─────────────────────────────────────────────
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── CLAMP ───────────────────────────────────────────────────
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

// ─── RANDOM SEEDED ───────────────────────────────────────────
export function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// ─── CAPITALIZE ──────────────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── GENERATE SESSION ID ─────────────────────────────────────
export function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
