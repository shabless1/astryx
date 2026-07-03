/**
 * ASTRYX Audio Player — HTML Audio Layer (v2 — overlap-proof)
 *
 * Plays ONE Astryx audio track at a time. The chamber music + Music Library both
 * drive this single singleton.
 *
 * OVERLAP SAFETY (Final QA fix):
 *   Every <audio> element ever created is tracked in `els`. Cross-fades ramp the
 *   old element(s) down and then HARD-DISPOSE them — guaranteed by a per-element
 *   setTimeout that fires regardless of any animation-frame cancellation. `stop()`
 *   disposes EVERY tracked element. This makes it impossible for tracks to stack
 *   (the previous bug: a shared rAF id was cancelled by the next fade/phase ramp,
 *   so the old element was never disposed and kept playing forever).
 *
 * VOLUME: masterVolume (0..1) × AUDIO_LEVEL × phaseMultiplier.
 * LOOP: tracks loop by default (sessions outlast a 3–5 min track); the Music
 * Library sets loop off so a finite sequence advances on `ended`.
 */

type PhaseKey = 'entry' | 'activation' | 'peak' | 'regulation' | 'integration'

// Patch 2.2 — audio was reportedly far too quiet. Raise the phase floor so even
// the gentlest phases stay clearly audible at a normal device volume.
const PHASE_VOLUME: Record<PhaseKey, number> = {
  entry:       0.95,
  activation:  1.00,
  peak:        1.00,
  regulation:  0.97,
  integration: 0.95,
}

const AUDIO_LEVEL = 1.0
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

class AstryxPlayerClass {
  private audioEl: HTMLAudioElement | null = null
  // Patch 2.2 — default master volume raised 0.7 → 1.0 (clearly audible by default).
  private masterVolume = 1.0
  private phaseMultiplier = PHASE_VOLUME.entry
  private currentUrl: string | null = null
  private _initialized = false
  private _loop = true
  private _timeCbs: Set<() => void> = new Set()
  private _endedCb: (() => void) | null = null
  // Fix 2 — REAL playback truth. _error flips on a load/decode error and resets
  // when a new track loads or starts playing. _stateCbs notify subscribers of
  // genuine state changes so the UI's LIVE badge + waveform reflect reality.
  //
  // v4.2 FIX 2 — errors are URL-ATTRIBUTED. _errorUrl records WHICH track
  // failed, and only elements still in the live pipeline (current or pending)
  // may set the flag. Previously, _kill()'s `src = ''` teardown fired the
  // still-attached error listener on DISPOSED elements, flipping the global
  // flag on every crossfade — the controller then "skipped" perfectly good
  // tracks and cascaded whole phases down to the Earth fallback.
  private _error = false
  private _errorUrl: string | null = null
  private _stateCbs: Set<() => void> = new Set()

  // Overlap safety — EVERY element + EVERY active rAF id are tracked so we can
  // always tear everything down.
  private els: Set<HTMLAudioElement> = new Set()
  private rafs: Set<number> = new Set()

  // Load-then-swap: a probe element buffering a candidate track. We only swap to
  // it (and dispose the old track) once it can ACTUALLY play — so a 404 / missing
  // variant never cuts the session to silence and never stacks a second copy.
  private _pending: HTMLAudioElement | null = null
  private _pendingUrl: string | null = null

  // ── STATE ────────────────────────────────────────────────────────────
  get isReady(): boolean { return this._initialized && this.audioEl !== null }
  get isPlaying(): boolean { return this.audioEl !== null && !this.audioEl.paused }

  // Fix 2 — the ONLY honest "is sound actually happening" signal. LIVE/waveform
  // must key off this, never off optimistic React intent state.
  get isLive(): boolean {
    return this.audioEl !== null && !this.audioEl.paused &&
           this.audioEl.readyState >= 3 && !this._error
  }
  get hasError(): boolean { return this._error }
  /** v4.2 — the URL whose load/decode actually failed (null when clean). The
   *  controller reacts ONLY when this matches its currently selected track. */
  getErrorUrl(): string | null { return this._error ? this._errorUrl : null }
  // Playback truth that IGNORES the _error flag — "is a track audibly playing
  // right now". Used by the UI so a stale error (e.g. a later probe 404 after a
  // good track already committed) can never make the player claim "unavailable"
  // while the user can plainly hear audio. (SHA 2026-06-28.)
  get isAudiblyPlaying(): boolean {
    return this.audioEl !== null && !this.audioEl.paused && this.audioEl.readyState >= 3
  }
  get readyState(): number { return this.audioEl?.readyState ?? 0 }
  /** Subscribe to REAL audio-state changes (play/pause/canplay/error/ended). */
  onStateChange(cb: () => void): () => void {
    this._stateCbs.add(cb)
    return () => { this._stateCbs.delete(cb) }
  }
  private _notifyState(): void { this._stateCbs.forEach((cb) => cb()) }

  getCurrentUrl(): string | null { return this.currentUrl }
  getCurrentTime(): number { return this.audioEl?.currentTime ?? 0 }
  getDuration(): number {
    const d = this.audioEl?.duration ?? 0
    return Number.isFinite(d) ? d : 0
  }
  seekTo(sec: number): void {
    if (this.audioEl && Number.isFinite(this.audioEl.duration)) {
      this.audioEl.currentTime = Math.max(0, Math.min(this.audioEl.duration, sec))
    }
  }
  restart(): void { this.seekTo(0) }
  setLoop(loop: boolean): void {
    this._loop = loop
    if (this.audioEl) this.audioEl.loop = loop
  }
  onTimeUpdate(cb: () => void): () => void {
    this._timeCbs.add(cb)
    return () => { this._timeCbs.delete(cb) }
  }
  setOnEnded(cb: (() => void) | null): void { this._endedCb = cb }

  // ── ELEMENT LIFECYCLE (overlap-proof) ────────────────────────────────
  private _make(url: string): HTMLAudioElement {
    const el = document.createElement('audio')
    el.src = url
    el.loop = this._loop
    el.preload = 'auto'
    el.volume = 0
    // crossOrigin intentionally NOT set — element is played directly, never
    // routed through Web Audio, so no R2 CORS policy is needed.
    el.addEventListener('error', (e) => {
      // v4.2 — disposed elements fire a spurious error when their src is
      // cleared during teardown; those must NEVER set the global flag.
      if ((el as any).__disposed) return
      // Only the live pipeline (current track or the buffering probe) counts.
      if (el !== this.audioEl && el !== this._pending) return
      this._error = true
      this._errorUrl = url
      console.error('[AstryxPlayer] load error:', e, url)
      this._notifyState()
    })
    el.addEventListener('canplaythrough', () => { this._initialized = true; this._error = false; this._errorUrl = null; this._notifyState() })
    el.addEventListener('canplay',  () => { this._error = false; this._errorUrl = null; this._notifyState() })
    el.addEventListener('playing',  () => { this._error = false; this._errorUrl = null; this._notifyState() })
    el.addEventListener('pause',    () => { this._notifyState() })
    el.addEventListener('waiting',  () => { this._notifyState() })
    el.addEventListener('stalled',  () => { this._notifyState() })
    el.addEventListener('loadedmetadata', () => { this._timeCbs.forEach((cb) => cb()) })
    el.addEventListener('timeupdate', () => { this._timeCbs.forEach((cb) => cb()) })
    el.addEventListener('ended', () => { this._notifyState(); if (!el.loop) this._endedCb?.() })
    this.els.add(el)
    return el
  }

  /** Hard-dispose a single element. Idempotent. */
  private _kill(el: HTMLAudioElement | null | undefined): void {
    if (!el) return
    ;(el as any).__disposed = true   // v4.2 — mute the teardown error event
    try { el.pause() } catch { /* noop */ }
    try { el.src = ''; el.load() } catch { /* noop */ }
    this.els.delete(el)
    if (el === this.audioEl) this.audioEl = null
    if (el === this._pending) { this._pending = null; this._pendingUrl = null }
  }

  /** Dispose every tracked element except an optional one to keep. */
  private _killAllExcept(keep?: HTMLAudioElement): void {
    for (const el of Array.from(this.els)) if (el !== keep) this._kill(el)
  }

  /** Per-element volume ramp. Returns nothing; safe if interrupted. */
  private _ramp(el: HTMLAudioElement, to: number, durSec: number, onDone?: () => void): void {
    if (typeof window === 'undefined') { onDone?.(); return }
    const target = clamp01(to)
    const start = el.volume
    const t0 = performance.now()
    const dur = Math.max(50, durSec * 1000)
    let id = 0
    const tick = () => {
      this.rafs.delete(id)
      const t = Math.min(1, (performance.now() - t0) / dur)
      const e = 0.5 - 0.5 * Math.cos(t * Math.PI)
      try { el.volume = clamp01(start + (target - start) * e) } catch { /* detached */ }
      if (t < 1) { id = requestAnimationFrame(tick); this.rafs.add(id) }
      else { onDone?.() }
    }
    id = requestAnimationFrame(tick)
    this.rafs.add(id)
  }

  private _cancelAllRafs(): void {
    this.rafs.forEach((id) => cancelAnimationFrame(id))
    this.rafs.clear()
  }

  // ── LOAD ─────────────────────────────────────────────────────────────
  /** Load a URL as the current element (no autoplay). Disposes all others. */
  load(url: string): this {
    if (typeof window === 'undefined') { this.currentUrl = url; return this }
    if (url === this.currentUrl && this.audioEl) return this
    this._killAllExcept()          // dispose EVERYTHING
    this._error = false            // fresh track — clear any prior error
    const el = this._make(url)
    this.audioEl = el
    this.currentUrl = url
    return this
  }

  // ── PLAY / PAUSE / RESUME ────────────────────────────────────────────
  play(fadeSec = 2): void {
    if (typeof window === 'undefined' || !this.audioEl) return
    if (this.isPlaying) return
    const el = this.audioEl
    el.volume = 0
    el.play().catch((err) => console.warn('[AstryxPlayer] play blocked:', err))
    this._ramp(el, this._targetVolume(), fadeSec)
  }

  pause(fadeSec = 1): void {
    const el = this.audioEl
    if (!el || el.paused) return
    this._ramp(el, 0, fadeSec, () => { try { el.pause() } catch { /* noop */ } })
  }

  resume(fadeSec = 1): void {
    const el = this.audioEl
    if (!el || !el.paused) return
    el.play().catch(() => {})
    this._ramp(el, this._targetVolume(), fadeSec)
  }

  // ── STOP — kills EVERYTHING ──────────────────────────────────────────
  stop(fadeSec = 2): void {
    const all = Array.from(this.els)
    this.audioEl = null
    this.currentUrl = null
    this._pending = null
    this._pendingUrl = null
    this._initialized = false
    this._error = false
    this._cancelAllRafs()
    this._notifyState()
    if (typeof window === 'undefined' || fadeSec <= 0) {
      all.forEach((el) => this._kill(el))
      return
    }
    // Fade each out, then hard-kill — with a guaranteed timeout backstop.
    all.forEach((el) => {
      this._ramp(el, 0, fadeSec, () => this._kill(el))
      setTimeout(() => this._kill(el), fadeSec * 1000 + 300)
    })
  }

  // ── CROSS-FADE — overlap-proof ───────────────────────────────────────
  /**
   * LOAD-THEN-SWAP cross-fade. Buffer the candidate track on a SILENT probe
   * element; only once it can actually play do we fade it in and dispose the old
   * track(s). If it can't load (404 / missing variant):
   *   • if a track is already playing → keep it (skip the variant, no silence)
   *   • if nothing is playing (first track) → surface the error
   * This makes stacking impossible (we never attach a second audible source) and
   * keeps the session musical through gaps in the hosted catalog.
   */
  crossFadeTo(url: string, fadeSec = 4): void {
    if (typeof window === 'undefined' || !url) return
    if (url === this.currentUrl && this.isPlaying) return
    if (url === this._pendingUrl) return            // already buffering this one

    // Supersede any in-flight probe for a different track.
    if (this._pending) this._kill(this._pending)

    const probe = this._make(url)
    probe.volume = 0
    this._pending = probe
    this._pendingUrl = url
    // Kick playback inside the (still-trusted) call stack so the first Play
    // gesture unlocks audio. The probe stays SILENT (vol 0) until it commits.
    probe.play().catch(() => { /* canplay / error will resolve it */ })

    const commit = () => {
      if (this._pending !== probe) return           // superseded by a newer call
      this._pending = null
      this._pendingUrl = null
      this._error = false
      this.audioEl = probe
      this.currentUrl = url
      const olds = Array.from(this.els).filter((el) => el !== probe)
      this._ramp(probe, this._targetVolume(), fadeSec)
      olds.forEach((el) => {
        this._ramp(el, 0, fadeSec, () => this._kill(el))
        setTimeout(() => this._kill(el), fadeSec * 1000 + 300)  // guaranteed disposal
      })
      this._notifyState()
    }
    const fail = () => {
      if (this._pending !== probe) return
      this._pending = null
      this._pendingUrl = null
      this._kill(probe)
      // Recompute NOW (don't trust the stale `hadLive` capture — the probe can
      // fail up to 9s later via the backstop, by which point another track may
      // have committed and be playing). Only surface an error if NOTHING is
      // currently audible, so a still-playing track never shows "unavailable".
      const stillLive = !!this.audioEl && !this.audioEl.paused && this.audioEl.readyState >= 3
      this._error = !stillLive
      this._notifyState()
    }

    probe.addEventListener('canplay', commit, { once: true })
    probe.addEventListener('error', fail, { once: true })
    if (probe.readyState >= 3) commit()                          // already cached
    window.setTimeout(() => { if (this._pending === probe) fail() }, 9000)  // backstop
  }

  // ── VOLUME ───────────────────────────────────────────────────────────
  setMasterVolume(vol: number): void {
    this.masterVolume = clamp01(vol)
    if (this.audioEl) this.audioEl.volume = clamp01(this._targetVolume())
  }

  setPhase(phase: PhaseKey): void {
    this.phaseMultiplier = PHASE_VOLUME[phase] ?? 1.0
    if (this.audioEl && this.isPlaying) this._ramp(this.audioEl, this._targetVolume(), 3)
  }

  private _targetVolume(): number {
    return clamp01(this.masterVolume * AUDIO_LEVEL * this.phaseMultiplier)
  }

  // ── DISPOSE ──────────────────────────────────────────────────────────
  dispose(): void { this.stop(0) }
}

// ─── SINGLETON ────────────────────────────────────────────────────────────────
export const astryxPlayer = new AstryxPlayerClass()
