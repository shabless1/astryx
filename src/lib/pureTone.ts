/**
 * ASTRYX — Pure Tone player (chakra Solfeggio tones)
 * ════════════════════════════════════════════════════════════════════════════
 * A single Web Audio sine oscillator for playing a PURE frequency — used for the
 * chakra Solfeggio tones (396 / 417 / 528 / 639 / 741 / 852 / 963 Hz) on the Body
 * Map and in the Music Library. One tone at a time; gentle fade in/out so it's
 * never a harsh click.
 *
 * This is NOT the chamber audio — the chamber is music-only (Directive H.3). This
 * is a deliberate, user-triggered "hear this chakra's tone" feature. It routes
 * through audioSession (stopPureTone is added to the panic path) so it can never
 * overlap the chamber or library music, and stops on any screen change.
 *
 * Must be started from a user gesture (the tap) per browser autoplay policy.
 */

let ctx: AudioContext | null = null
let osc: OscillatorNode | null = null
let gain: GainNode | null = null
let currentHz: number | null = null

const TARGET_GAIN = 0.16            // soft for a pure sine (higher = piercing)
const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((l) => { try { l() } catch { /* noop */ } })
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

/** Start (or retune to) a pure sine at `hz`. Idempotent. */
export function playPureTone(hz: number): void {
  const c = ac()
  if (!c) return
  const freq = Number.isFinite(hz) && hz > 0 ? hz : 432
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
      gain.gain.linearRampToValueAtTime(TARGET_GAIN, c.currentTime + 0.4) // soft attack
    } else {
      osc.frequency.linearRampToValueAtTime(freq, c.currentTime + 0.1)
      gain?.gain.linearRampToValueAtTime(TARGET_GAIN, c.currentTime + 0.2)
    }
    currentHz = freq
    notify()
  } catch { /* noop */ }
}

/** Stop the tone with a gentle fade. Idempotent. */
export function stopPureTone(): void {
  currentHz = null
  if (!osc || !ctx) { osc = null; gain = null; notify(); return }
  const o = osc, g = gain, c = ctx
  osc = null; gain = null
  try { g?.gain.linearRampToValueAtTime(0, c.currentTime + 0.25) } catch { /* noop */ }
  setTimeout(() => {
    try { o?.stop() } catch { /* noop */ }
    try { o?.disconnect(); g?.disconnect() } catch { /* noop */ }
  }, 300)
  notify()
}

/**
 * Crown / CNS integration AMBIENT — 172.06 Hz (Directive v2.0 · FIX D). This is
 * the frequency formerly assigned to the retired "Platonic Year" fork, repurposed
 * as an AMBIENT INTEGRATION TONE. It is NOT a fork: it never enters
 * `buildForkSequence`, the fork set, the body map, or the manufacturing spec —
 * it is only ever played as a tone (Music Library "Chakra" tab / silent-integration).
 */
export const INTEGRATION_AMBIENT = { hz: 172.06, label: 'Crown / CNS Integration' } as const

/** The Hz currently sounding, or null. */
export function pureToneHz(): number | null { return currentHz }

/** Subscribe to play/stop changes (for UI state). Returns an unsubscribe fn. */
export function onPureToneChange(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}
