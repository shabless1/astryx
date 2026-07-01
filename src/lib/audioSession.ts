/**
 * ASTRYX — AudioSessionManager (Final QA: audio overlap / stop bug)
 * ════════════════════════════════════════════════════════════════════
 * THE SINGLE SOURCE OF TRUTH for app audio. There is exactly one active audio
 * session at a time. No screen may leave orphaned audio after unmount, screen
 * change, exit, or track switch.
 *
 * Every audio surface routes through here:
 *   • Chamber (SoundEngineController) → claim('chamber')
 *   • Music Library (MusicLibraryScreen) → claim('musicLibrary')
 *
 * `panicStop()` is the one call wired to EVERY exit point: Stop button, Exit
 * Session, screen change (page.tsx), new session, track switch, and page unload.
 *
 * IMPLEMENTATION NOTE — the chamber is MUSIC-ONLY (Directive H.3): Tone.js
 * (`soundEngine.ts`) is NOT started anywhere in the live app, so the only live
 * audio is the HTMLAudio layer (`astryxPlayer`) + the dormant transit-preview
 * oscillator (`transitAudio`). Both are stopped here. If Tone playback is ever
 * revived, also stop it here (stopSessionSound(0) / stopPreview() /
 * disposeSoundEngine()) so this stays the single panic point.
 */

import { astryxPlayer } from './astryxPlayer'
import { stopTransitPreview } from './transitAudio'
import { stopFallbackTone } from './fallbackTone'
import { stopPureTone } from './pureTone'

export type AudioSource = 'none' | 'chamber' | 'musicLibrary' | 'preview' | 'chakraTone'

let activeSource: AudioSource = 'none'

function killEverything(fadeSec: number): void {
  try { astryxPlayer.stop(fadeSec) } catch { /* noop */ }
  try { stopTransitPreview() } catch { /* noop */ }
  try { stopFallbackTone() } catch { /* noop */ }   // Fix 2 — oscillator fallback
  try { stopPureTone() } catch { /* noop */ }       // chakra Solfeggio tone
}

export const audioSession = {
  getActiveSource(): AudioSource { return activeSource },

  /**
   * Claim playback for a source. If a DIFFERENT source is already active, it is
   * hard-stopped first so the two can never overlap. Call right before starting
   * playback from a screen.
   */
  claim(source: AudioSource): void {
    if (activeSource !== 'none' && activeSource !== source) killEverything(0)
    activeSource = source
  },

  /** Hard stop — immediate, no fade. The universal panic button. */
  panicStop(): void {
    killEverything(0)
    activeSource = 'none'
  },

  /** Graceful stop with a short fade (leaving a screen, pressing Stop softly). */
  stopAll(fadeSec = 0.4): void {
    killEverything(fadeSec)
    activeSource = 'none'
  },
}
