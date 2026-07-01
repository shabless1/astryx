/**
 * ASTRYX — Transit Preview Audio (Directive v2 Part C1)
 * ════════════════════════════════════════════════════════════════════
 * Each transit card must play ITS OWN audio — the transit's planet+state
 * Astryx audio track when one exists, otherwise that planet's own TONE (clearly
 * labelled tone-only) — NEVER the global dominant track/tone.
 *
 * This is a fully ISOLATED preview player: its own HTMLAudioElement for
 * tracks and a single Web Audio oscillator for the tone fallback. It does
 * NOT touch `astryxPlayer` (the chamber's sole controller) or `soundEngine`
 * (Tone.js) — so the transit preview can never entangle with the live
 * session audio (Rule 8: don't retune soundEngine for the audio library layer).
 */

import { selectTrackFilename, buildTrackUrl, type AudioFolderState } from '@/lib/astryxAudioLibrary'

export const STATE_MAP: Record<string, AudioFolderState> = {
  excess: 'exc', deficiency: 'def', blocked: 'blk', balanced: 'nat',
}

export interface TransitAudioPlan {
  hasTrack: boolean
  url: string | null
  trackPlanet: string   // audio folder planet (corrective planet when correcting)
  state: AudioFolderState
  toneHz: number        // tone-only fallback frequency (regulator Hz when correcting)
  tonePlanet: string    // label for the tone-only fallback
}

/** Deterministic 32-bit hash (FNV-1a) — stable variant selection per user/transit. */
export function seedFromString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h | 0)
}

/**
 * Resolve a transit's audio: its own planet+state track if the catalog + CDN
 * have one, else a tone-only plan at that transit's frequency.
 */
export function planTransitAudio(opts: {
  trackPlanet: string
  state: AudioFolderState
  toneHz: number
  tonePlanet: string
  seed: number
}): TransitAudioPlan {
  const { trackPlanet, state, toneHz, tonePlanet, seed } = opts
  const filename = selectTrackFilename(trackPlanet, state, seed)
  const baseConfigured = !!process.env.NEXT_PUBLIC_AUDIO_BASE_URL
  const hasTrack = !!filename && baseConfigured
  return {
    hasTrack,
    url: hasTrack ? buildTrackUrl(trackPlanet, state, filename as string) : null,
    trackPlanet,
    state,
    toneHz,
    tonePlanet,
  }
}

// ─── ISOLATED PREVIEW PLAYER ────────────────────────────────────────
let trackEl: HTMLAudioElement | null = null
let actx: AudioContext | null = null
let osc: OscillatorNode | null = null
let gain: GainNode | null = null
let endTimer: ReturnType<typeof setTimeout> | null = null
let fadeRaf: number | null = null

export function stopTransitPreview(): void {
  if (typeof window === 'undefined') return
  if (fadeRaf !== null) { cancelAnimationFrame(fadeRaf); fadeRaf = null }
  if (endTimer !== null) { clearTimeout(endTimer); endTimer = null }
  if (trackEl) {
    try { trackEl.pause(); trackEl.src = ''; trackEl.load() } catch { /* noop */ }
    trackEl = null
  }
  if (osc) {
    try { osc.stop() } catch { /* already stopped */ }
    try { osc.disconnect() } catch { /* noop */ }
    osc = null
  }
  if (gain) { try { gain.disconnect() } catch { /* noop */ } gain = null }
}

/**
 * Play a transit preview for `seconds`. Track plays looped with a fade-in;
 * tone plays a single sine with fade in/out. Auto-stops at `seconds`.
 * Call from a user gesture (autoplay policy).
 */
export function playTransitPreview(plan: TransitAudioPlan, seconds = 24): void {
  if (typeof window === 'undefined') return
  stopTransitPreview()

  if (plan.hasTrack && plan.url) {
    const el = document.createElement('audio')
    el.src = plan.url
    el.loop = true
    el.preload = 'auto'
    el.volume = 0
    el.play().catch((err) => console.warn('[transitAudio] track play blocked:', err))
    trackEl = el
    const start = performance.now()
    const fade = () => {
      if (!trackEl) return
      const t = Math.min(1, (performance.now() - start) / 1500)
      // H.3 — music-forward: previews play near full level
      trackEl.volume = 0.9 * (0.5 - 0.5 * Math.cos(t * Math.PI))
      if (t < 1) fadeRaf = requestAnimationFrame(fade)
    }
    fadeRaf = requestAnimationFrame(fade)
    endTimer = setTimeout(stopTransitPreview, seconds * 1000)
    return
  }

  // Tone-only fallback — a single sine at the transit's own frequency.
  const Ctx = window.AudioContext || (window as any).webkitAudioContext
  if (!Ctx) return
  actx = actx ?? new Ctx()
  if (actx.state === 'suspended') actx.resume().catch(() => {})
  const o = actx.createOscillator()
  const g = actx.createGain()
  o.type = 'sine'
  o.frequency.value = plan.toneHz > 0 ? plan.toneHz : 144.72
  const now = actx.currentTime
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.18, now + 1.2)
  g.gain.setValueAtTime(0.18, Math.max(now + 1.3, now + seconds - 1.5))
  g.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
  o.connect(g).connect(actx.destination)
  o.start(now)
  o.stop(now + seconds + 0.05)
  o.onended = () => { osc = null; gain = null }
  osc = o
  gain = g
}
