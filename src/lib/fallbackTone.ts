/**
 * ASTRYX — Fallback Tone  (CORRECT & FINISH Directive · Fix 2)
 * ════════════════════════════════════════════════════════════════════════════
 * A minimal Web Audio API oscillator that plays the CALIBRATED FREQUENCY when
 * the music track fails to load. The chamber must never be silent-but-pretending:
 * if the MP3 errors, this carries the session at the active fork's Hz so the
 * frequency layer is still present. Independent of the HTMLAudio music layer.
 *
 * Single oscillator, gentle sine, soft gain. Must be started from a user gesture
 * (the Play click) for autoplay policies. Routed through audioSession.panicStop.
 */

let ctx: AudioContext | null = null
let osc: OscillatorNode | null = null
let gain: GainNode | null = null

const DEFAULT_HZ = 136.10 // Earth Om — safe grounding fallback
// Patch 2.2 — when a track 404s the oscillator IS the session's audio, so it must
// be clearly audible (was 0.10 ≈ inaudible). Still a gentle sine, not harsh.
const TARGET_GAIN = 0.24

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

/** Start (or retune) the fallback tone at `hz`. Idempotent — safe to call repeatedly. */
export function startFallbackTone(hz: number): void {
  const c = ac()
  if (!c) return
  const freq = Number.isFinite(hz) && hz > 0 ? hz : DEFAULT_HZ
  try {
    if (c.state === 'suspended') c.resume().catch(() => {})
    if (!osc) {
      osc = c.createOscillator()
      gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, c.currentTime)
      gain.gain.setValueAtTime(0, c.currentTime)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start()
      gain.gain.linearRampToValueAtTime(TARGET_GAIN, c.currentTime + 1.5) // gentle fade-in
    } else {
      osc.frequency.setValueAtTime(freq, c.currentTime)
    }
  } catch { /* noop */ }
}

/** Retune the running fallback tone (e.g. the session moved to a new fork). */
export function setFallbackHz(hz: number): void {
  if (osc && ctx && Number.isFinite(hz) && hz > 0) {
    try { osc.frequency.setValueAtTime(hz, ctx.currentTime) } catch { /* noop */ }
  }
}

/** Stop + dispose the fallback tone (graceful fade). Idempotent. */
export function stopFallbackTone(): void {
  if (!osc || !ctx) { osc = null; gain = null; return }
  const o = osc, g = gain, c = ctx
  osc = null; gain = null
  try { g?.gain.linearRampToValueAtTime(0, c.currentTime + 0.4) } catch { /* noop */ }
  setTimeout(() => {
    try { o?.stop() } catch { /* noop */ }
    try { o?.disconnect(); g?.disconnect() } catch { /* noop */ }
  }, 500)
}

export function fallbackToneActive(): boolean {
  return osc !== null
}
