/**
 * Astryx Sound Engine — v2.0 (Directive FIX 0)
 *
 * Modular fail-safe multi-layer frequency system. Replaces the v1 engine
 * that silently failed in production on Safari/iOS due to async
 * Tone.Reverb.generate() killing the signal chain.
 *
 * CORE PRINCIPLES (per Directive v2.0):
 *  1. NO async generate() — Tone.FeedbackDelay replaces Tone.Reverb
 *  2. 3-attempt AudioContext resume before surfacing a clear UI error
 *  3. 8-layer architecture per PLAY D spec
 *  4. Volume ramps use rampTo() not linearRampToValueAtTime() (cleaner)
 *  5. Tone.Waveform tap on compressor output for visual sync
 *  6. Hz values ONLY from planetary-anchors.json (Cousto's cosmic octave)
 *  7. Modal scales per planet drive the melodic synth layer
 *
 * 8-LAYER ARCHITECTURE:
 *   Layer 1: DRONE       — dominant planet Hz + Earth Om sub-bass
 *   Layer 2: HARMONICS   — 2nd + 3rd overtones of primary
 *   Layer 3: MELODIC     — Tone.Synth modal scale phrases
 *   Layer 4: COUNTER     — secondary planet drone, right-biased detune
 *   Layer 5: PULSE       — LFO at aspect-derived rate
 *   Layer 6: BINAURAL    — primary Hz left + (primary Hz + 4) right (theta beat)
 *   Layer 7: TEXTURE     — pink noise via Tone.AutoFilter
 *   Layer 8: SOLFEGGIO   — aspect-mapped Hz, ultra-low (~0.03)
 *
 * Signal chain pattern (per layer):
 *   Oscillator → Gain → Panner → Tremolo → FeedbackDelay → Compressor → Master
 *
 * Exports (unchanged interface — SoundEngineController is drop-in compatible):
 *   initSoundEngine(): Promise<boolean>
 *   startSessionSound(protocol): Promise<boolean>
 *   stopSessionSound(fadeOutSecs?): void
 *   previewSound(protocol, durationSecs?): Promise<void>
 *   stopPreview(): void
 *   setMasterVolume(v): void
 *   getMasterVolume(): number
 *   getSoundEngineStatus(): { initialized, playing, previewing, volume }
 *   disposeSoundEngine(): void
 *   getWaveformData(): Float32Array | null
 */

import type { ProtocolOutput } from '@/types'
import type { HarmonicPlan } from '@/lib/chamber/HarmonicEngine'
import type { ChamberDNA } from '@/lib/chamber/ChamberDNAEngine'
// Music Phase 1 — instrumentation INLINED here so all Tone.js construction
// happens in a single module. Webpack production bundling otherwise creates
// a separate Tone reference for InstrumentationEngine.ts where the class
// constructors (PolySynth, Gain, etc.) fail to materialize. Inlining
// guarantees we use the same working Tone instance the rest of soundEngine
// already uses successfully.
import type { ChamberDNA as InstChamberDNA } from '@/lib/chamber/ChamberDNAEngine'

// ─── INLINED: ManualPoly + Instrument factories ─────────────────────

type InstrumentRole = 'pad' | 'bell' | 'bowl' | 'bass' | 'shimmer' | 'arp'

interface InstrumentVoice {
  voice: any
  out: any
  poly: boolean
  defaultDb: number
  label: string
}

class ManualPoly {
  private voices: any[]
  public readonly gainOut: any
  private next = 0

  constructor(maxVoices: number, opts: any = {}) {
    this.gainOut = new Tone.Gain(1)
    this.voices = []
    for (let i = 0; i < maxVoices; i++) {
      const v = new Tone.Synth(opts)
      v.connect(this.gainOut)
      this.voices.push(v)
    }
  }

  triggerAttackRelease(notes: string | string[], duration: number | string, time?: any, velocity?: number): void {
    const arr = Array.isArray(notes) ? notes : [notes]
    for (const note of arr) {
      const v = this.voices[this.next % this.voices.length]
      this.next++
      try { v.triggerAttackRelease(note, duration, time, velocity) } catch {}
    }
  }

  set(opts: any): void {
    for (const v of this.voices) {
      try { v.set(opts) } catch {}
    }
  }

  get volume() { return this.voices[0].volume }

  connect(node: any): this { this.gainOut.connect(node); return this }

  dispose(): void {
    for (const v of this.voices) { try { v.dispose() } catch {} }
    try { this.gainOut.dispose() } catch {}
  }
}

function brightnessFor(el: InstChamberDNA['dominantElement']): number {
  return el === 'fire' ? 1.30 : el === 'earth' ? 0.80 : el === 'air' ? 1.20 : el === 'water' ? 0.90 : 1.00
}
function decayFor(el: InstChamberDNA['dominantElement']): number {
  return el === 'fire' ? 0.85 : el === 'earth' ? 1.30 : el === 'air' ? 0.95 : el === 'water' ? 1.45 : 1.00
}

function buildInstrument(role: InstrumentRole, dna: InstChamberDNA): InstrumentVoice {
  // Phase C — when applying corrective, use the effective planet (regulator
  // planet) for voice character. So Mars Excess gets Moon's lush warm pad
  // and Karplus harp pluck instead of Mars's sharp pad and FM bell.
  const planet = (dna.applyCorrective && dna.effectivePlanet) ? dna.effectivePlanet : dna.primaryPlanet
  const decay = decayFor(dna.dominantElement)
  const brightness = brightnessFor(dna.dominantElement)

  if (role === 'pad') {
    // Healing music — only soft/round oscillators. No fatsawtooth / sawtooth /
    // pwm — those are harsh for healing. Sine / triangle / amsine / fmsine
    // give the warm, gentle pad character we want.
    let oscType: any = 'sine', attack = 1.5 * decay, releaseSec = 3.0 * decay, sustain = 0.6, label = 'warm-pad', volume = -16
    if (planet === 'Saturn' || planet === 'Pluto') { oscType = 'triangle'; attack = 3.0 * decay; releaseSec = 5.0 * decay; sustain = 0.7; label = 'dark-string-pad'; volume = -16 }
    else if (planet === 'Venus' || planet === 'Moon') { oscType = 'amsine'; attack = 2.0 * decay; releaseSec = 4.0 * decay; sustain = 0.65; label = 'lush-warm-pad'; volume = -15 }
    else if (planet === 'Jupiter' || planet === 'Sun') { oscType = 'fmsine'; attack = 1.8 * decay; releaseSec = 3.5 * decay; sustain = 0.6; label = 'expansive-pad'; volume = -16 }
    else if (planet === 'Mercury') { oscType = 'fmsine'; attack = 1.2 * decay; releaseSec = 3.0 * decay; sustain = 0.5; label = 'glass-pad'; volume = -17 }
    else if (planet === 'Mars') { oscType = 'triangle'; attack = 1.0 * decay; releaseSec = 2.5 * decay; sustain = 0.55; label = 'soft-mars-pad'; volume = -18 }
    else if (planet === 'Neptune') { oscType = 'fmsine'; attack = 4.0 * decay; releaseSec = 6.0 * decay; sustain = 0.7; label = 'shimmer-pad'; volume = -16 }
    else if (planet === 'Uranus') { oscType = 'triangle'; attack = 1.5 * decay; releaseSec = 3.0 * decay; sustain = 0.55; label = 'soft-uranus-pad'; volume = -17 }

    const voice = new ManualPoly(6, {
      oscillator: { type: oscType },
      envelope: { attack, decay: 0.6, sustain, release: releaseSec },
      volume,
    })
    return { voice, out: voice.gainOut, poly: true, defaultDb: volume, label }
  }

  if (role === 'bell' || role === 'arp') {
    if (planet === 'Mercury' || planet === 'Uranus' || dna.dominantElement === 'air') {
      const voice = new Tone.PluckSynth({ attackNoise: 0.5, dampening: 2800, resonance: 0.92, release: 1.6 * decay })
      voice.volume.value = -14
      return { voice, out: voice, poly: false, defaultDb: -14, label: 'karplus-pluck' }
    }
    if (planet === 'Venus' || planet === 'Moon') {
      const voice = new Tone.PluckSynth({ attackNoise: 0.3, dampening: 2400, resonance: 0.96, release: 2.4 * decay })
      voice.volume.value = -13
      return { voice, out: voice, poly: false, defaultDb: -13, label: 'harp-pluck' }
    }
    if (planet === 'Mars' || planet === 'Sun') {
      // Lower modulationIndex (was 12 — clangy/metallic) + softened attack for a
      // rounded bell rather than a sharp ping.
      const voice = new Tone.FMSynth({ harmonicity: 3, modulationIndex: 3.5, envelope: { attack: 0.02, decay: 1.4 * decay, sustain: 0, release: 2.0 * decay } })
      voice.volume.value = -14
      return { voice, out: voice, poly: false, defaultDb: -14, label: 'fm-bell' }
    }
    if (planet === 'Saturn' || planet === 'Pluto' || dna.dominantElement === 'earth') {
      const voice = new Tone.FMSynth({ harmonicity: 2, modulationIndex: 4, envelope: { attack: 0.01, decay: 2.5 * decay, sustain: 0, release: 3.0 * decay } })
      voice.volume.value = -13
      return { voice, out: voice, poly: false, defaultDb: -13, label: 'warm-low-bell' }
    }
    const voice = new Tone.PluckSynth({ attackNoise: 0.4, dampening: 2600, resonance: 0.94, release: 2.0 * decay })
    voice.volume.value = -14
    return { voice, out: voice, poly: false, defaultDb: -14, label: 'soft-pluck' }
  }

  if (role === 'bowl') {
    const voice = new Tone.FMSynth({ harmonicity: 3.01, modulationIndex: 8, envelope: { attack: 0.05, decay: 4.0 * decay, sustain: 0.4, release: 6.0 * decay } })
    voice.volume.value = -15
    return { voice, out: voice, poly: false, defaultDb: -15, label: 'singing-bowl' }
  }

  if (role === 'bass') {
    if (planet === 'Saturn' || planet === 'Pluto' || dna.dominantElement === 'earth') {
      const voice = new Tone.MonoSynth({ oscillator: { type: 'sine' }, envelope: { attack: 1.5, decay: 0.8, sustain: 0.9, release: 4.0 } })
      voice.volume.value = -8
      return { voice, out: voice, poly: false, defaultDb: -8, label: 'sub-drone-bass' }
    }
    if (planet === 'Mars') {
      // Triangle (was sawtooth — buzzy/harsh) with a low-pass filter for a
      // round pulse bass that grounds without abrasion.
      const voice = new Tone.MonoSynth({
        oscillator: { type: 'triangle' },
        filter: { type: 'lowpass', frequency: 600, Q: 1 },
        filterEnvelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.2, baseFrequency: 200, octaves: 2 },
        envelope: { attack: 0.08, decay: 0.4, sustain: 0.5, release: 1.8 },
      })
      voice.volume.value = -11
      return { voice, out: voice, poly: false, defaultDb: -11, label: 'pulse-bass' }
    }
    const voice = new Tone.MonoSynth({ oscillator: { type: 'sine' }, envelope: { attack: 1.0, decay: 0.5, sustain: 0.85, release: 2.5 } })
    voice.volume.value = -10
    return { voice, out: voice, poly: false, defaultDb: -10, label: 'soft-bass' }
  }

  // shimmer
  const voice = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.5, decay: 0.2, sustain: 0, release: 3.5 } })
  const hp = new Tone.Filter({ type: 'highpass', frequency: 2200 * brightness, Q: 0.8 })
  voice.connect(hp)
  voice.volume.value = -16
  return { voice, out: hp, poly: false, defaultDb: -16, label: 'pink-shimmer' }
}
// ──────────────────────────────────────────────────────────────────
// STATIC top-level import — per Cowork directive FIX 0.
// This file is only ever imported by 'use client' components
// (SoundEngineController, SoundPreviewButton), so Next.js places it
// in the client bundle automatically. Static import resolves at
// build time and bypasses the webpack 5 ESM interop bug where
// dynamic import('tone') returns a module namespace with 0 keys.
// Use `Tone` DIRECTLY throughout this file — do NOT route through
// any `state.Tone` field. No dynamic import paths exist anywhere
// in this file by design.
// ──────────────────────────────────────────────────────────────────
import * as _ToneStatic from 'tone'
// In Next.js 14 production, static import of Tone returns {}.
// Tone.js registers itself on window. We use a let so preloadSoundEngine()
// can reassign to window.Tone — all downstream new Tone.X() calls then work.
// eslint-disable-next-line prefer-const
let Tone = _ToneStatic as typeof _ToneStatic

// ─── TYPES ────────────────────────────────────────────────────

// Stable per-layer key for phase automation. Multiple oscillators can
// share a key (e.g. drone + earthOm both = 'drone').
type LayerKey =
  | 'drone' | 'harmonics' | 'melodic' | 'counter'
  | 'pulse' | 'binaural' | 'texture' | 'solfeggio'

interface EngineLayer {
  key?: LayerKey   // PR #3 — phase scheduler reads this
  osc?: any        // Tone.Oscillator | Tone.Synth | Tone.Noise
  gain?: any       // Tone.Gain
  baseGainDb?: number  // captured at build time so phase mix multipliers can scale it
  panner?: any
  tremolo?: any
  lfo?: any
  filter?: any
  delay?: any
  scheduler?: any
}

interface EngineState {
  initialized: boolean
  playing:     boolean
  previewing:  boolean
  masterVolume: number
  layers:      EngineLayer[]
  compressor:  any
  masterGain:  any
  masterNodes: any[]            // busFilter / reverb / limiter etc — disposed per session
  waveform:    any              // Tone.Waveform — visual sync tap
  initError:   string | null    // last init failure reason for UI surfacing
}

const state: EngineState = {
  initialized: false,
  playing:     false,
  previewing:  false,
  // Music overhaul — overall level lowered so the master limiter is barely
  // touched (was 0.7, which slammed the limiter and read as "loud/distorted").
  // H.0.1 — lowered again (0.55 → 0.30): the Astryx audio MUSIC is the chamber's
  // foreground; this synthesis layer is the grounding underlayer — the
  // corrective Hz felt beneath the music, never drowning it.
  masterVolume: 0.30,
  layers:      [],
  compressor:  null,
  masterGain:  null,
  masterNodes: [],
  waveform:    null,
  initError:   null,
}

// ─── PRELOAD (call on component mount — before any gesture) ──────
/**
 * No-op pre-warm. Tone.js is statically imported at the top of this
 * file, so it's already resolved by the time any client component
 * mounts. This export remains for API compatibility with existing
 * callers that invoke it in useEffect on mount.
 *
 * Per Cowork directive FIX 0: there is NO dynamic import path in
 * this file. The module namespace object from a top-level static
 * import is guaranteed to have `Tone.start`, `Tone.Oscillator`, etc.
 * regardless of webpack production interop quirks.
 */
export async function preloadSoundEngine(): Promise<void> {
  // Production check: static import returns {} in Next.js 14 production.
  // window.Tone is always populated (Tone.js registers globally as side-effect).
  if (typeof Tone?.start !== 'function') {
    const wTone = typeof window !== 'undefined' ? (window as any).Tone : null
    if (typeof wTone?.start === 'function') {
      Tone = wTone as typeof _ToneStatic
      console.log('[SoundEngine] Tone.js ready (window.Tone)')
    } else {
      state.initError = 'Audio module unavailable. Please refresh.'
      console.error('[SoundEngine] Tone.js not found anywhere')
    }
  } else {
    console.log('[SoundEngine] Tone.js ready (static import)')
  }
}

// ─── ASPECT → SOUND BEHAVIOR ──────────────────────────────────

interface SoundBehavior {
  pulseRate:    number    // LFO Hz for tremolo
  pulseDepth:   number    // 0–1 modulation depth
  panSwing:     number    // 0–1 L/R panning swing
  panRate:      number    // Hz for panning LFO
  attackTime:   number    // seconds — fade-in for graceful start (no clicks)
  releaseTime:  number    // seconds
  delayFeedback: number   // 0–1 (replaces reverbMix)
  delayTime:    number    // seconds — base delay time
  detuneHz:     number    // binaural offset
  ambientLevel: number    // texture noise level (Layer 7)
}

const ASPECT_BEHAVIOR: Record<string, SoundBehavior> = {
  conjunction: { pulseRate: 0.08, pulseDepth: 0.15, panSwing: 0.10, panRate: 0.05, attackTime: 4.0, releaseTime: 6, delayFeedback: 0.55, delayTime: 0.50, detuneHz: 2.0, ambientLevel: 0.04 },
  square:      { pulseRate: 0.60, pulseDepth: 0.55, panSwing: 0.30, panRate: 0.40, attackTime: 1.5, releaseTime: 3, delayFeedback: 0.40, delayTime: 0.25, detuneHz: 6.0, ambientLevel: 0.06 },
  opposition:  { pulseRate: 0.20, pulseDepth: 0.40, panSwing: 0.80, panRate: 0.15, attackTime: 2.0, releaseTime: 4, delayFeedback: 0.50, delayTime: 0.40, detuneHz: 4.0, ambientLevel: 0.05 },
  trine:       { pulseRate: 0.12, pulseDepth: 0.18, panSwing: 0.15, panRate: 0.08, attackTime: 5.0, releaseTime: 8, delayFeedback: 0.60, delayTime: 0.66, detuneHz: 1.5, ambientLevel: 0.035 },
  sextile:     { pulseRate: 0.25, pulseDepth: 0.22, panSwing: 0.20, panRate: 0.12, attackTime: 3.0, releaseTime: 5, delayFeedback: 0.55, delayTime: 0.55, detuneHz: 2.5, ambientLevel: 0.04 },
  quincunx:    { pulseRate: 0.18, pulseDepth: 0.30, panSwing: 0.25, panRate: 0.10, attackTime: 2.5, releaseTime: 4, delayFeedback: 0.45, delayTime: 0.33, detuneHz: 3.5, ambientLevel: 0.05 },
}

const DEFAULT_BEHAVIOR = ASPECT_BEHAVIOR.trine

const ASPECT_SOLFEGGIO: Record<string, number> = {
  conjunction: 528, square: 396, opposition: 639,
  trine: 432, sextile: 741, quincunx: 417,
}

// ─── PR #3 — FIVE-PHASE SESSION SCHEDULER ─────────────────────
// PHASE_PLAN defines, per phase, the relative gain multiplier on each
// layer, the master pulse rate multiplier, the shared delay wet target,
// and the solfeggio role (which maps to a target Hz). All transitions
// use rampTo() (no clicks). Tone.Transport drives the timeline, so it
// survives suspend/resume and stays sample-accurate.

type PhaseKey = 'entry' | 'activation' | 'peak' | 'regulation' | 'integration'

interface PhaseSpec {
  key: PhaseKey
  startSec: number
  durSec: number
  layers: Record<LayerKey, number>   // 0..1 multiplier on baseGainDb
  pulseMul: number                    // multiplier on aspect base pulse rate
  delayWet: number                    // shared FeedbackDelay wet target
  binauralHz: number                  // delta added to right-ear oscillator
  filterCenterHz: number              // texture AutoFilter baseFrequency
  solfeggioHz: number                 // role-mapped Hz for solfeggio layer
}

// Solfeggio role → Hz mapping (handoff doc §Sound Engine Rebuild)
//   174 grounding · 417 corrective · 528 coherence · 396 release · 936 depth
const SOLFEGGIO_ROLE_HZ = {
  grounding:  174,
  corrective: 417,
  coherence:  528,
  release:    396,
  depth:      936,
}

const PHASE_PLAN: PhaseSpec[] = [
  {
    // Deploy 2 fix — chamber must feel musical from second 1.
    // Previous entry: harmonics 0.0 + melodic 0.0 → almost a minute of pure
    // drone before user heard music. Now harmonics 0.5, melodic 0.3 — gentle
    // but present chord bed and motif establish the chamber immediately.
    key: 'entry', startSec: 0, durSec: 120,
    layers: { drone: 1.0, harmonics: 0.5, melodic: 0.3, counter: 0.3, pulse: 0.6, binaural: 0.0, texture: 0.4, solfeggio: 0.0 },
    pulseMul: 0.5, delayWet: 0.16, binauralHz: 0, filterCenterHz: 200, solfeggioHz: SOLFEGGIO_ROLE_HZ.grounding,
  },
  {
    key: 'activation', startSec: 120, durSec: 180,
    layers: { drone: 1.0, harmonics: 0.6, melodic: 0.4, counter: 0.8, pulse: 1.0, binaural: 0.4, texture: 0.8, solfeggio: 0.5 },
    pulseMul: 1.0, delayWet: 0.14, binauralHz: 1.6, filterCenterHz: 350, solfeggioHz: SOLFEGGIO_ROLE_HZ.corrective,
  },
  {
    key: 'peak', startSec: 300, durSec: 240,
    layers: { drone: 1.0, harmonics: 1.0, melodic: 1.0, counter: 1.0, pulse: 1.0, binaural: 1.0, texture: 1.0, solfeggio: 1.0 },
    pulseMul: 1.4, delayWet: 0.18, binauralHz: 4.0, filterCenterHz: 600, solfeggioHz: SOLFEGGIO_ROLE_HZ.coherence,
  },
  {
    key: 'regulation', startSec: 540, durSec: 180,
    layers: { drone: 0.9, harmonics: 0.4, melodic: 0.6, counter: 0.4, pulse: 0.5, binaural: 0.3, texture: 0.6, solfeggio: 0.6 },
    pulseMul: 0.6, delayWet: 0.20, binauralHz: 1.2, filterCenterHz: 200, solfeggioHz: SOLFEGGIO_ROLE_HZ.release,
  },
  {
    key: 'integration', startSec: 720, durSec: 180,
    // Soft resolution, not silence — the closing IV→I chords + a faint motif
    // fade out gently over the drone (was harmonics 0 / melodic 0 = pure drone).
    layers: { drone: 0.6, harmonics: 0.4, melodic: 0.2, counter: 0.0, pulse: 0.2, binaural: 0.0, texture: 0.2, solfeggio: 0.3 },
    pulseMul: 0.3, delayWet: 0.22, binauralHz: 0, filterCenterHz: 200, solfeggioHz: SOLFEGGIO_ROLE_HZ.depth,
  },
]

// Phase-controlled module-level state. The melodic scheduler gates on
// currentPhaseLayers.melodic > 0 so phrases stop during entry/integration.
let currentPhaseKey: PhaseKey = 'entry'
let currentPhaseLayers: Record<LayerKey, number> = PHASE_PLAN[0].layers
let onPhaseChangeCallback: ((phase: PhaseKey) => void) | null = null

// Refs to the singleton nodes that phase automation reaches into.
// Populated by buildSignalChain, nulled by disposeLayers.
const phaseNodes: {
  pulseLFO: any | null
  sharedDelay: any | null
  textureAutoFilter: any | null
  binauralR: any | null
  solfeggio: any | null
} = { pulseLFO: null, sharedDelay: null, textureAutoFilter: null, binauralR: null, solfeggio: null }

// Aspect-derived base pulse rate (set at chain build time, scaled per phase).
let baseAspectPulseRate = 0.12

// ─── PLANET MODAL SCALES (Layer 3 — Tone.Synth phrases) ───────
// Per Directive v2.0: each planet drives a distinct modal scale.
// Notes are written in standard pitch notation (octave 4 baseline).
// The synth plays a 4-note phrase from the scale, repeated with subtle
// variation, at a slow tempo (~30 BPM) so it acts as ambient texture.

interface PlanetMode {
  root: string                // pitch class + octave
  scale: string[]             // 8 notes (octave + tonic)
  phraseInterval: number      // seconds between phrases
}

const PLANET_MODES: Record<string, PlanetMode> = {
  Sun:     { root: 'B4',  scale: ['B4',  'C#5', 'D#5', 'F5',  'F#5', 'G#5', 'A#5', 'B5'],  phraseInterval: 3.0 }, // Lydian
  Moon:    { root: 'G#4', scale: ['G#4', 'A4',  'B4',  'C#5', 'D#5', 'E5',  'F#5', 'G#5'], phraseInterval: 4.0 }, // Phrygian
  Mercury: { root: 'C#4', scale: ['C#4', 'D#4', 'E4',  'F#4', 'G#4', 'A#4', 'B4',  'C#5'], phraseInterval: 2.5 }, // Dorian
  Venus:   { root: 'A4',  scale: ['A4',  'B4',  'C#5', 'D5',  'E5',  'F#5', 'G5',  'A5'],  phraseInterval: 3.5 }, // Mixolydian
  Mars:    { root: 'D4',  scale: ['D4',  'E4',  'F4',  'G4',  'A4',  'A#4', 'C5',  'D5'],  phraseInterval: 2.2 }, // Aeolian
  Jupiter: { root: 'F#4', scale: ['F#4', 'G#4', 'A#4', 'B4',  'C#5', 'D#5', 'F5',  'F#5'], phraseInterval: 3.2 }, // Ionian
  Saturn:  { root: 'D4',  scale: ['D4',  'D#4', 'F4',  'G4',  'G#4', 'A#4', 'C5',  'D5'],  phraseInterval: 5.0 }, // Locrian
  Uranus:  { root: 'G#4', scale: ['G#4', 'A4',  'C5',  'C#5', 'D#5', 'E5',  'F#5', 'G#5'], phraseInterval: 2.0 }, // Phrygian Dominant
  Neptune: { root: 'G#4', scale: ['G#4', 'A#4', 'C5',  'D5',  'D#5', 'F5',  'F#5', 'G#5'], phraseInterval: 4.5 }, // Lydian b7
  Pluto:   { root: 'C#4', scale: ['C#4', 'D4',  'E4',  'F4',  'F#4', 'G#4', 'A4',  'B4'],  phraseInterval: 4.0 }, // Diminished
}

const DEFAULT_MODE = PLANET_MODES.Saturn

// ─── INIT ─────────────────────────────────────────────────────

/**
 * Initialize Tone.js — must be called from a user gesture (click/tap).
 * Per Directive: Tone.start() + ctx.resume() with retry settling for Safari.
 * Surfaces a clear error reason via state.initError that the UI can display.
 *
 * Uses the statically-imported `Tone` directly. No dynamic resolution.
 */
export async function initSoundEngine(): Promise<boolean> {
  if (state.initialized) return true

  state.initError = null

  // Guard against the broken-module case (would only fire if webpack truly
  // could not statically bind Tone). In practice this should never trigger.
  if (typeof Tone?.start !== 'function') {
    state.initError = 'Audio module unavailable. Please refresh the page.'
    console.error(
      '[SoundEngine] Tone.start missing on static module. Keys:',
      Object.keys(Tone as any),
    )
    return false
  }

  try {
    // Call Tone.start() FIRST — before any other awaits — so the browser
    // registers it as originating from the user gesture.
    try {
      await Tone.start()
    } catch (startErr) {
      console.warn('[SoundEngine] Tone.start() error:', startErr)
    }

    // Explicit ctx.resume() for Safari / iOS WebKit which needs this separately
    const ctx = Tone.getContext().rawContext as AudioContext
    if (ctx.state !== 'running') {
      try { await ctx.resume() } catch {}
    }

    // One final check — give Safari 150ms to settle
    if (ctx.state !== 'running') {
      await new Promise((r) => setTimeout(r, 150))
    }

    if (ctx.state !== 'running') {
      state.initError = 'Browser blocked audio. Tap the activate button below.'
      console.error('[SoundEngine] AudioContext state:', ctx.state)
      return false
    }

    state.initialized = true
    return true
  } catch (err: any) {
    state.initError = `Init failed: ${err?.message || 'unknown'}`
    console.error('[SoundEngine] Init failed:', err)
    return false
  }
}

/** Returns the last init error (for UI display). */
export function getInitError(): string | null {
  return state.initError
}

// ─── CLEANUP ─────────────────────────────────────────────────

function disposeLayers() {
  for (const layer of state.layers) {
    try {
      if (layer.scheduler) {
        clearInterval(layer.scheduler)
      }
      layer.lfo?.stop()
      layer.lfo?.dispose()
      layer.tremolo?.stop()
      layer.tremolo?.dispose()
      layer.osc?.stop?.()
      layer.osc?.dispose()
      layer.filter?.dispose()
      layer.delay?.dispose()
      layer.gain?.dispose()
      layer.panner?.dispose()
    } catch {}
  }
  state.layers = []

  try {
    state.compressor?.dispose()
    state.masterGain?.dispose()
    for (const n of state.masterNodes) { try { n?.dispose() } catch {} }
  } catch {}

  state.compressor = null
  state.masterGain = null
  state.masterNodes = []

  // PR #3 — clear phase scheduler node refs so phase callbacks no-op
  phaseNodes.pulseLFO = null
  phaseNodes.sharedDelay = null
  phaseNodes.textureAutoFilter = null
  phaseNodes.binauralR = null
  phaseNodes.solfeggio = null
}

// ─── BUILD SIGNAL CHAIN — 8 LAYERS ────────────────────────────

async function buildSignalChain(
  protocol: ProtocolOutput,
  mode: 'session' | 'preview',
  harmonicPlan?: HarmonicPlan,
  chamberDNA?: ChamberDNA,
): Promise<SoundBehavior> {
  // Uses statically-imported `Tone` from top of file. No state.Tone field.
  const sound = protocol.plan.sound
  const aspect = protocol.dominant_pattern.aspect
  const behavior = ASPECT_BEHAVIOR[aspect] ?? DEFAULT_BEHAVIOR

  const planet1 = protocol.dominant_pattern.planets[0] ?? 'Saturn'
  const planet2 = protocol.dominant_pattern.planets[1] ?? planet1

  const freq1 = sound.primary_anchors[0] ?? 144.72
  const freq2 = sound.primary_anchors[1] ?? 147.85
  const earthOm = 136.10                                  // always present (Layer 1 sub-bass)
  const solHz   = ASPECT_SOLFEGGIO[aspect] ?? 528

  // Volume baselines — preview is quieter.
  // Music overhaul mix philosophy: the CHORD BED + MELODY are the foreground
  // (this is music, not a tone test). The raw sine layers — drone, counter,
  // binaural — drop to subtle beds so they support the harmony instead of
  // beating against it and reading as "three stacked test tones."
  const baseVol = mode === 'preview' ? -18 : -16
  const subVol  = baseVol - 10   // Earth Om sub — felt, not heard
  const harmVol = baseVol - 18   // legacy overtone fallback only
  const melVol  = baseVol - 10
  const counterVol = baseVol - 12   // was -2 — pure sine, kept as a faint wash
  const binVol  = baseVol - 16      // was -6 — subtle entrainment, no longer a lead tone
  const texVol  = baseVol - 18
  const solVol  = baseVol - 26

  // ── Master chain (music overhaul) ─────────────────────────────────
  //   masterGain → busLowpass → glueComp → limiter → destination   (DRY)
  //                                    └─→ reverb → reverbReturn ──┘   (WET send)
  //
  // Why this shape:
  //   • busLowpass rolls off the 3–8 kHz "bite" that made tones feel harsh.
  //   • glueComp is GENTLE (2.5:1, slow) — cohesion, not the old pumping 6:1.
  //   • A real convolution Reverb (lush, ambient tail) replaces the metallic
  //     JCReverb. It needs async generate(); we await it. If generation ever
  //     fails (the historical Safari/iOS risk), the DRY path still plays and
  //     we fall back to a low-passed JCReverb send — never silence.
  //   • Limiter sits at -1.5 and is barely touched now that levels are lower.
  const busLowpass = new Tone.Filter({ type: 'lowpass', frequency: 7200, Q: 0.4 })
  state.compressor = new Tone.Compressor({
    threshold: -16, ratio: 2.5, attack: 0.08, release: 0.25,
  })
  const masterLimiter = new Tone.Limiter(-1.5)

  busLowpass.connect(state.compressor)
  state.compressor.connect(masterLimiter)   // DRY path — always audible
  masterLimiter.toDestination()
  state.masterNodes.push(busLowpass, masterLimiter)

  // Lush reverb send (graceful fallback so audio never drops to silence)
  try {
    const reverb = new Tone.Reverb({ decay: behavior.attackTime > 3.5 ? 8 : 6, preDelay: 0.02, wet: 1 })
    await reverb.generate()
    const reverbReturn = new Tone.Gain(Tone.dbToGain(-4))
    state.compressor.connect(reverb)
    reverb.connect(reverbReturn)
    reverbReturn.connect(masterLimiter)
    state.masterNodes.push(reverb, reverbReturn)
  } catch (revErr) {
    console.warn('[SoundEngine] Reverb.generate failed — JCReverb fallback:', revErr)
    const jc = new Tone.JCReverb({ roomSize: 0.55, wet: 1 })
    const jcLp = new Tone.Filter({ type: 'lowpass', frequency: 3800, Q: 0.3 })
    const jcReturn = new Tone.Gain(Tone.dbToGain(-7))
    state.compressor.connect(jc)
    jc.connect(jcLp); jcLp.connect(jcReturn); jcReturn.connect(masterLimiter)
    state.masterNodes.push(jc, jcLp, jcReturn)
  }

  // Waveform tap on compressor output (one-shot — persists across plays)
  if (!state.waveform) {
    state.waveform = new Tone.Waveform(512)
    state.compressor.connect(state.waveform)
  }

  // Master gain controls overall volume → into the bus low-pass
  state.masterGain = new Tone.Gain(state.masterVolume).connect(busLowpass)

  // Per-layer ambience bus: a short, low-feedback delay for depth WITHOUT the
  // old echo wash. Feedback was 0.4–0.6 (muddy buildup → harsh); clamped to
  // ≤0.25 with a gentler wet so the reverb carries the space, not the delay.
  const sharedDelay = new Tone.FeedbackDelay({
    delayTime: behavior.delayTime,
    feedback:  Math.min(behavior.delayFeedback, 0.25),
    wet:       0.16,
  }).connect(state.masterGain)

  // PR #3 — capture refs for phase automation
  phaseNodes.sharedDelay = sharedDelay
  baseAspectPulseRate = behavior.pulseRate

  // ════════════════════════════════════════════════════════════
  // LAYER 1 — DRONE (dominant planet Hz + Earth Om sub-bass)
  // ════════════════════════════════════════════════════════════
  {
    const panner = new Tone.Panner(-0.15).connect(sharedDelay)
    // Gentle, smooth breathing — NOT a throb. Depth clamped low and always a
    // sine shape (the old 'square' tremolo on hard aspects chopped the drone).
    const tremolo = new Tone.Tremolo({
      frequency: Math.min(behavior.pulseRate, 0.18),
      depth:     Math.min(behavior.pulseDepth, 0.12),
      type:      'sine',
    }).connect(panner).start()
    // Drone is the Cousto-frequency FOUNDATION — present, but a bed beneath the
    // music (was at full baseVol, competing with the chords as a lead tone).
    const droneVol = baseVol - 4
    const gain = new Tone.Gain(Tone.dbToGain(droneVol)).connect(tremolo)

    // Dominant planet sine
    const osc = new Tone.Oscillator({ frequency: freq1, type: 'sine' }).connect(gain)
    state.layers.push({ key: 'drone', baseGainDb: droneVol, osc, gain, panner, tremolo, delay: sharedDelay })

    // Earth Om sub-bass — separate oscillator at lower volume, same chain
    const subPanner = new Tone.Panner(0).connect(sharedDelay)
    const subGain   = new Tone.Gain(Tone.dbToGain(subVol)).connect(subPanner)
    const subOsc    = new Tone.Oscillator({ frequency: earthOm, type: 'sine' }).connect(subGain)
    state.layers.push({ key: 'drone', baseGainDb: subVol, osc: subOsc, gain: subGain, panner: subPanner })
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 2 — HARMONICS
  //   With harmonicPlan: PolySynth chord bed playing real chords
  //                      from ChordEngine, retriggered per beat interval.
  //   Without:           legacy 2nd + 3rd overtone oscillators.
  // ════════════════════════════════════════════════════════════
  if (harmonicPlan) {
    // Music Phase 1 — gentle instrument patches per planet.
    // Lowered chord bus gain by 8 dB vs prior so the drone has space and
    // nothing clips. Soft chorus for subtle warmth.
    // Music overhaul — the chord bed is the FOREGROUND of the composition.
    // It now sits ABOVE the drone (which dropped to a subtle bed), so the user
    // hears harmony first. Lush slow chorus widens it without harshness.
    const chordVol = baseVol + 2
    const panner = new Tone.Panner(0.05).connect(sharedDelay)
    const padChorus = new Tone.Chorus({ frequency: 0.25, delayTime: 8, depth: 0.35, wet: 0.3 }).start()
    const gain   = new Tone.Gain(Tone.dbToGain(chordVol)).connect(padChorus)
    padChorus.connect(panner)

    let poly: any
    let polyDb = -2

    if (chamberDNA) {
      // Real instrument pad per planet
      const padVoice = buildInstrument('pad', chamberDNA)
      poly = padVoice.voice
      polyDb = padVoice.defaultDb
      padVoice.out.connect(gain)
    } else {
      // Legacy fallback — ManualPoly (Tone.PolySynth is broken in webpack prod)
      const mp = new ManualPoly(6, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 1.2, decay: 0.5, sustain: 0.7, release: 2.5 },
        volume: -2,
      })
      poly = mp
      mp.gainOut.connect(gain)
    }

    // Chord retrigger interval — beats per chord pulse, driven by aspect.
    // Quincunx odd-count, square tight, trine spacious.
    const beatSec = harmonicPlan.melody.beatSec
    const intervalSec = beatSec * harmonicPlan.aspect.chordIntervalBeats

    let chordIdx = 0
    const chordScheduler = setInterval(() => {
      // Deploy 2 fix — chord bed plays in both session AND preview
      if (!state.playing && !state.previewing) return
      const phaseChords = harmonicPlan.chords.phases[currentPhaseKey] ?? []
      if (phaseChords.length === 0) return
      const chord = phaseChords[chordIdx % phaseChords.length]
      // Gate by phase harmonics multiplier (already in currentPhaseLayers)
      if ((currentPhaseLayers.harmonics ?? 0) <= 0.01) return
      try {
        const velocity = 0.45 * chord.density * harmonicPlan.effectiveDensityMul
        poly.triggerAttackRelease(chord.notes, chord.sustainBeats * beatSec * 0.85, undefined, velocity)
        chordIdx++
      } catch {}
    }, intervalSec * 1000)

    // Preview: trigger the first chord immediately so it lands in the
    // listener's ear within the 15-sec window
    if (mode === 'preview') {
      try {
        const phaseChords = harmonicPlan.chords.phases.peak
        if (phaseChords && phaseChords.length > 0) {
          const c = phaseChords[0]
          setTimeout(() => {
            try { poly.triggerAttackRelease(c.notes, c.sustainBeats * beatSec, undefined, 0.45) } catch {}
          }, 400)
        }
      } catch {}
    }

    void polyDb
    state.layers.push({
      key: 'harmonics', baseGainDb: chordVol,
      osc: poly, gain, panner, scheduler: chordScheduler,
    })
  } else {
    // Legacy overtone version (preview mode or no harmonicPlan)
    const panner = new Tone.Panner(0.1).connect(sharedDelay)
    const gain   = new Tone.Gain(Tone.dbToGain(harmVol)).connect(panner)

    const harm2 = new Tone.Oscillator({ frequency: freq1 * 2, type: 'sine' }).connect(gain)
    const harm3 = new Tone.Oscillator({ frequency: freq1 * 3, type: 'sine' }).connect(gain)
    state.layers.push({ key: 'harmonics', baseGainDb: harmVol, osc: harm2, gain, panner })
    state.layers.push({ key: 'harmonics', osc: harm3 })
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 3 — MELODIC
  //   With harmonicPlan: deterministic motif from MelodyGenerator,
  //                      sign-modulated envelope, gated by phase.
  //   Without:           legacy PLANET_MODES sliding-window phrases.
  //   Plays in BOTH preview and session per Deploy 2 fix.
  //   Volume bumped from melVol(-24dB) to baseVol-3(-17dB) so motif
  //   sits ~3dB beneath drone (audible top voice).
  // ════════════════════════════════════════════════════════════
  {
    // Melody sits just under the chord bed as the top voice (was -3 below the
    // drone; now -1 so the motif is clearly the melodic lead).
    const melodyVol = baseVol - 1
    const panner = new Tone.Panner(-0.05).connect(sharedDelay)
    const gain   = new Tone.Gain(Tone.dbToGain(melodyVol)).connect(panner)

    if (harmonicPlan) {
      // Music Phase 1 — bell/pluck instrument per planet via InstrumentationEngine
      // (PluckSynth harp for Venus/Moon, FMSynth bell for Mars/Sun, Karplus for
      // Mercury/Air, warm-low for Saturn/Earth). Falls back to triangle Synth
      // if no chamberDNA.
      const motif = harmonicPlan.melody
      let synth: any
      if (chamberDNA) {
        const bellVoice = buildInstrument('bell', chamberDNA)
        synth = bellVoice.voice
        bellVoice.out.connect(gain)
      } else {
        const attack  = 0.6 * harmonicPlan.effectiveAttackMul
        const release = 1.4 * harmonicPlan.effectiveBlurMul
        synth = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack, decay: 0.35, sustain: 0.4, release },
        })
        synth.connect(gain)
      }

      // Schedule motif notes via Tone.Transport so they align with the
      // chamber clock. Loops at motifPeriodSec.
      let motifIdx = 0
      const beatSec = motif.beatSec
      const periodMs = harmonicPlan.motifPeriodSec * 1000

      const playMotif = () => {
        try {
          let offset = 0
          for (const n of motif.notes) {
            if (n.note) {
              const dur = n.duration * beatSec * 0.92
              synth.triggerAttackRelease(n.note, dur, `+${offset}`, n.velocity)
            }
            offset += n.duration * beatSec
          }
        } catch {}
      }

      const scheduler = setInterval(() => {
        // Deploy 2 fix — motif plays in both session AND preview
        if (!state.playing && !state.previewing) return
        if ((currentPhaseLayers.melodic ?? 0) <= 0.01) {
          motifIdx = 0
          return
        }
        playMotif()
        motifIdx++
      }, periodMs)

      // Preview: trigger motif immediately so listener hears it within 15s
      if (mode === 'preview') {
        setTimeout(playMotif, 600)
      }

      state.layers.push({ key: 'melodic', baseGainDb: melodyVol, osc: synth, gain, panner, scheduler })
    } else {
      // Legacy fallback (preview mode / no plan)
      const mode_ = PLANET_MODES[planet1] ?? DEFAULT_MODE
      const synth  = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.8, decay: 0.4, sustain: 0.3, release: 2.0 },
      }).connect(gain)

      let phraseIdx = 0
      const scheduler = setInterval(() => {
        if (!state.playing && !state.previewing) return
        if ((currentPhaseLayers.melodic ?? 0) <= 0.01) return
        try {
          const startIdx = (phraseIdx * 2) % (mode_.scale.length - 3)
          const phrase = mode_.scale.slice(startIdx, startIdx + 4)
          const noteDur = mode_.phraseInterval / 6
          phrase.forEach((note, i) => {
            synth.triggerAttackRelease(note, noteDur * 0.9, `+${i * noteDur}`)
          })
          phraseIdx++
        } catch {}
      }, mode_.phraseInterval * 1000)

      state.layers.push({ key: 'melodic', baseGainDb: melodyVol, osc: synth, gain, panner, scheduler })
    }
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 4 — COUNTER (secondary planet, right-biased)
  // ════════════════════════════════════════════════════════════
  {
    const panner = new Tone.Panner(0.3).connect(sharedDelay)
    const gain   = new Tone.Gain(Tone.dbToGain(counterVol)).connect(panner)
    const osc    = new Tone.Oscillator({
      frequency: freq2 + behavior.detuneHz,
      type: 'sine',
    }).connect(gain)

    // Panning LFO — Deploy 2 prefers aspect-derived swing/rate when plan present
    const panSwing = harmonicPlan?.aspect.panSwing ?? behavior.panSwing
    const panRate  = harmonicPlan?.aspect.panRateHz ?? behavior.panRate
    const panLFO = new Tone.LFO({
      frequency: panRate,
      min: -panSwing,
      max:  panSwing,
    }).connect(panner.pan)

    state.layers.push({ key: 'counter', baseGainDb: counterVol, osc, gain, panner, lfo: panLFO })
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 5 — PULSE (LFO modulating master amplitude per aspect rate)
  //   — implemented as a tremolo applied to the master gain via direct LFO
  // ════════════════════════════════════════════════════════════
  {
    // Master "breath" — kept extremely subtle (was 0.85→1.0, an audible wobble
    // on the entire mix). Now a near-imperceptible 0.97→1.0 swell so the
    // chamber feels alive without the whole soundscape pumping.
    const pulseLFO = new Tone.LFO({
      frequency: behavior.pulseRate * 0.5,    // slower than per-layer tremolo
      min: state.masterVolume * 0.97,
      max: state.masterVolume,
      type: 'sine',
    }).connect(state.masterGain.gain)
    state.layers.push({ key: 'pulse', lfo: pulseLFO })
    phaseNodes.pulseLFO = pulseLFO   // PR #3 — phase scheduler ramps this
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 6 — BINAURAL (primary Hz left, primary Hz + 4 Hz right = theta beat)
  // ════════════════════════════════════════════════════════════
  {
    // Left ear: pure primary Hz
    const pannerL = new Tone.Panner(-0.95).connect(sharedDelay)
    const gainL   = new Tone.Gain(Tone.dbToGain(binVol)).connect(pannerL)
    const oscL    = new Tone.Oscillator({ frequency: freq1, type: 'sine' }).connect(gainL)
    state.layers.push({ key: 'binaural', baseGainDb: binVol, osc: oscL, gain: gainL, panner: pannerL })

    // Right ear: primary Hz + 4 Hz (theta brainwave entrainment)
    const pannerR = new Tone.Panner(0.95).connect(sharedDelay)
    const gainR   = new Tone.Gain(Tone.dbToGain(binVol)).connect(pannerR)
    const oscR    = new Tone.Oscillator({ frequency: freq1 + 4, type: 'sine' }).connect(gainR)
    state.layers.push({ key: 'binaural', baseGainDb: binVol, osc: oscR, gain: gainR, panner: pannerR })
    phaseNodes.binauralR = oscR   // PR #3 — phase scheduler ramps right-ear Hz
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 7 — TEXTURE (pink noise via Tone.AutoFilter)
  // ════════════════════════════════════════════════════════════
  if (mode === 'session') {
    const gain   = new Tone.Gain(Tone.dbToGain(texVol)).connect(sharedDelay)
    const autoFilter = new Tone.AutoFilter({
      frequency: 0.05,
      baseFrequency: 200,
      octaves: 2.5,
      type: 'sine',
    }).connect(gain).start()
    const noise = new Tone.Noise('pink').connect(autoFilter)

    state.layers.push({ key: 'texture', baseGainDb: texVol, osc: noise, gain, filter: autoFilter })
    phaseNodes.textureAutoFilter = autoFilter   // PR #3 — phase scheduler ramps filter center
  }

  // ════════════════════════════════════════════════════════════
  // LAYER 8 — SOLFEGGIO overlay (ultra-low, aspect-mapped)
  // ════════════════════════════════════════════════════════════
  {
    const gain = new Tone.Gain(Tone.dbToGain(solVol)).connect(sharedDelay)
    const osc  = new Tone.Oscillator({ frequency: solHz, type: 'sine' }).connect(gain)

    const solLFO = new Tone.LFO({ frequency: 0.06, min: 0.4, max: 1 }).connect(gain.gain)
    state.layers.push({ key: 'solfeggio', baseGainDb: solVol, osc, gain, lfo: solLFO })
    phaseNodes.solfeggio = osc   // PR #3 — phase scheduler ramps Hz by role
  }

  return behavior
}

// ─── START SESSION ────────────────────────────────────────────

export interface StartSessionSoundOptions {
  /** Total chamber duration in seconds. Phase plan scales to fit.
   *  Default 900s (15min) preserves prior behavior. */
  totalDurationSec?: number
  /** Deploy 2 — harmonic plan from ChamberDNA/HarmonicEngine. */
  harmonicPlan?: HarmonicPlan
  /** Music Phase 1 — ChamberDNA for per-planet instrumentation patches.
   *  When provided, replaces generic triangle synth with InstrumentationEngine
   *  patches (PluckSynth harp, FMSynth bells, AMSynth pads, MonoSynth bass)
   *  + JCReverb + Chorus + element-driven character. */
  chamberDNA?: ChamberDNA
}

export async function startSessionSound(
  protocol: ProtocolOutput,
  opts: StartSessionSoundOptions = {},
): Promise<boolean> {
  if (!state.initialized || state.playing) return false

  // Re-check context (browser may have suspended it)
  try {
    const ctx = Tone.getContext().rawContext as AudioContext
    if (ctx.state === 'suspended') await ctx.resume()
    if (ctx.state !== 'running') {
      state.initError = 'AudioContext not running — please tap activate'
      return false
    }
  } catch (ctxErr) {
    console.error('[SoundEngine] Context check failed:', ctxErr)
    return false
  }

  disposeLayers()

  let behavior: SoundBehavior
  try {
    behavior = await buildSignalChain(protocol, 'session', opts.harmonicPlan, opts.chamberDNA)
  } catch (chainErr) {
    console.error('[SoundEngine] buildSignalChain failed:', chainErr)
    disposeLayers()
    return false
  }

  const now = Tone.now()
  const attack = behavior.attackTime

  // Volume ramp-in (per directive: rampTo not setValueAtTime — cleaner fades)
  for (const layer of state.layers) {
    try {
      // Start the sound source if it has a start method
      if (layer.osc && typeof layer.osc.start === 'function') {
        layer.osc.start(now)
      }
      if (layer.lfo && typeof layer.lfo.start === 'function') {
        layer.lfo.start(now)
      }

      // Ramp gain from silence to target over attackTime
      if (layer.gain) {
        const targetGain = layer.gain.gain.value
        layer.gain.gain.setValueAtTime(0, now)
        layer.gain.gain.rampTo(targetGain > 0 ? targetGain : 0.1, attack, now)
      }
    } catch (layerErr) {
      console.warn('[SoundEngine] Layer start error:', layerErr)
    }
  }

  state.playing = true

  // ────────────────────────────────────────────────────────────
  // PR #3 — schedule the 5-phase Tone.Transport plan
  // ────────────────────────────────────────────────────────────
  try {
    // Set initial phase context so the melodic scheduler gate works
    currentPhaseKey = 'entry'
    currentPhaseLayers = PHASE_PLAN[0].layers

    Tone.Transport.stop()
    Tone.Transport.cancel(0)
    Tone.Transport.position = 0

    // Chamber Deploy 1 — phase plan scales to caller-provided total duration.
    // Default 900s preserves prior behavior. The reference PHASE_PLAN is built
    // for 900s; we compute a scale factor and remap each phase start/duration.
    const targetTotalSec = Math.max(15, opts.totalDurationSec ?? 900)
    const referenceTotalSec = PHASE_PLAN.reduce((s, p) => s + p.durSec, 0)
    const scale = targetTotalSec / referenceTotalSec

    for (const phase of PHASE_PLAN) {
      const startSec = phase.startSec * scale
      Tone.Transport.scheduleOnce((time) => {
        applyPhase(phase, time)
      }, startSec)
    }
    Tone.Transport.start()
  } catch (transportErr) {
    console.warn('[SoundEngine] Tone.Transport schedule failed:', transportErr)
    // Session still plays without phase automation — degrade gracefully
  }

  return true
}

// ─── PR #3 — APPLY PHASE ──────────────────────────────────────
// Crossfades all layer gains to phase.layers[key] * baseGainDb,
// ramps the master pulse LFO frequency, shared delay wet, texture
// filter center, binaural right-ear Hz, and solfeggio Hz to the
// phase targets. 8s on gains, 4-6s on parameter automation —
// no clicks, no jumps. The chain is built once; phases only fade it.

function applyPhase(phase: PhaseSpec, time: number) {
  currentPhaseKey = phase.key
  currentPhaseLayers = phase.layers

  try {
    if (onPhaseChangeCallback) {
      // Defer callback fire to JS event loop so React state updates batch
      setTimeout(() => onPhaseChangeCallback?.(phase.key), 0)
    }
  } catch {}

  // ── Layer gain crossfades (8s) ──
  for (const layer of state.layers) {
    if (!layer.key || !layer.gain || layer.baseGainDb == null) continue
    const mul = phase.layers[layer.key] ?? 1.0
    // Treat 0 multiplier as full silence (avoid Tone.dbToGain on -∞)
    const targetGain = mul <= 0.005
      ? 0.0001
      : Tone.dbToGain(layer.baseGainDb) * mul
    try {
      layer.gain.gain.cancelScheduledValues(time)
      layer.gain.gain.rampTo(targetGain, 8, time)
    } catch {}
  }

  // ── Master pulse LFO frequency (4s) ──
  if (phaseNodes.pulseLFO) {
    try {
      const targetHz = baseAspectPulseRate * 0.5 * phase.pulseMul
      phaseNodes.pulseLFO.frequency.rampTo(targetHz, 4, time)
    } catch {}
  }

  // ── Shared FeedbackDelay wet (6s) ──
  if (phaseNodes.sharedDelay) {
    try { phaseNodes.sharedDelay.wet.rampTo(phase.delayWet, 6, time) } catch {}
  }

  // ── Texture AutoFilter center frequency (8s) ──
  if (phaseNodes.textureAutoFilter) {
    try { phaseNodes.textureAutoFilter.baseFrequency.rampTo(phase.filterCenterHz, 8, time) } catch {}
  }

  // ── Binaural right-ear frequency (6s) ──
  if (phaseNodes.binauralR) {
    try {
      // Right ear = left ear (freq1) + binauralHz delta
      // Original chain holds the freq1 baseline on layers[i].osc — we reach into binauralR.
      const leftHz = (phaseNodes.binauralR.frequency.value as number) - 4 // legacy baseline +4
      const newHz = leftHz + phase.binauralHz
      phaseNodes.binauralR.frequency.rampTo(newHz, 6, time)
    } catch {}
  }

  // ── Solfeggio role Hz (4s) ──
  if (phaseNodes.solfeggio) {
    try { phaseNodes.solfeggio.frequency.rampTo(phase.solfeggioHz, 4, time) } catch {}
  }
}

// ─── PR #3 — PHASE API ────────────────────────────────────────

export function getCurrentPhase(): PhaseKey {
  return currentPhaseKey
}

export function setOnPhaseChange(cb: ((phase: PhaseKey) => void) | null): void {
  onPhaseChangeCallback = cb
}

/**
 * Fast-forward Tone.Transport to a named phase. Used by SessionScreen
 * step transitions to keep audio narrative aligned with practitioner pacing
 * (e.g. user taps Next into fork sequence → jump to 'peak').
 */
export function setSoundPhase(key: PhaseKey): void {
  const phase = PHASE_PLAN.find((p) => p.key === key)
  if (!phase) return
  try {
    Tone.Transport.position = phase.startSec
    applyPhase(phase, Tone.now())
  } catch (e) {
    console.warn('[SoundEngine] setSoundPhase failed:', e)
  }
}

/**
 * Re-sync Transport to wall-clock seconds after drift (tab backgrounded etc).
 * Re-applies whichever phase covers that timestamp at full ramp duration.
 */
export function syncToTime(elapsedSec: number): void {
  try {
    Tone.Transport.seconds = elapsedSec
    // Find which phase this falls into
    let active = PHASE_PLAN[0]
    for (const p of PHASE_PLAN) {
      if (elapsedSec >= p.startSec) active = p
    }
    applyPhase(active, Tone.now())
  } catch (e) {
    console.warn('[SoundEngine] syncToTime failed:', e)
  }
}

// ─── STOP SESSION ─────────────────────────────────────────────

export function stopSessionSound(fadeOutSecs = 3): void {
  if (!state.playing) return

  // PR #3 — halt the 5-phase scheduler so no late phase callbacks fire
  try {
    Tone.Transport.cancel(0)
    Tone.Transport.stop()
  } catch {}

  for (const layer of state.layers) {
    if (layer.gain) {
      try { layer.gain.gain.rampTo(0, fadeOutSecs) } catch {}
    }
  }

  setTimeout(() => {
    disposeLayers()
    state.playing = false
  }, (fadeOutSecs + 0.5) * 1000)
}

// ─── PREVIEW SOUND ────────────────────────────────────────────

export async function previewSound(
  protocol: ProtocolOutput,
  previewDuration = 5,
  harmonicPlan?: HarmonicPlan,
  chamberDNA?: ChamberDNA,
): Promise<void> {
  if (!state.initialized || state.previewing) return

  disposeLayers()
  state.previewing = true

  // Deploy 2 fix — preview must showcase the FULL musical chamber, not just
  // drone + counter. Pre-load the phase layer mix to Peak so chord bed and
  // motif play at full strength immediately. (The 15-sec preview can't wait
  // for natural phase progression to reach Peak.)
  currentPhaseKey = 'peak'
  currentPhaseLayers = PHASE_PLAN[2].layers

  try {
    await buildSignalChain(protocol, 'preview', harmonicPlan, chamberDNA)
  } catch (err) {
    console.error('[SoundEngine] Preview chain failed:', err)
    disposeLayers()
    state.previewing = false
    return
  }

  const now = Tone.now()

  for (const layer of state.layers) {
    try {
      if (layer.osc && typeof layer.osc.start === 'function') layer.osc.start(now)
      if (layer.lfo && typeof layer.lfo.start === 'function') layer.lfo.start(now)
      if (layer.gain) {
        const targetGain = layer.gain.gain.value || 0.3
        layer.gain.gain.setValueAtTime(0, now)
        layer.gain.gain.rampTo(targetGain, 1, now)
        // Pre-schedule fade-out
        layer.gain.gain.rampTo(0, 0.5, now + previewDuration - 0.5)
      }
    } catch {}
  }

  setTimeout(() => {
    disposeLayers()
    state.previewing = false
  }, previewDuration * 1000)
}

export function stopPreview(): void {
  if (!state.previewing) return
  disposeLayers()
  state.previewing = false
}

// ─── VOLUME ───────────────────────────────────────────────────

// H.0.1 — the synthesis sits UNDER the music. The UI volume slider feeds both
// layers the same 0..1 value; this fraction keeps the synth the underlayer at
// every slider position (music = vol × 1.0 in astryxPlayer, synth = vol × 0.45).
const SYNTH_UNDERLAYER_LEVEL = 0.45

export function setMasterVolume(vol: number): void {
  state.masterVolume = Math.max(0, Math.min(1, vol)) * SYNTH_UNDERLAYER_LEVEL
  if (state.masterGain) {
    state.masterGain.gain.rampTo(state.masterVolume, 0.2)
  }
}

export function getMasterVolume(): number {
  return state.masterVolume
}

// ─── STATUS ───────────────────────────────────────────────────

export function getSoundEngineStatus(): {
  initialized: boolean
  playing: boolean
  previewing: boolean
  volume: number
} {
  return {
    initialized: state.initialized,
    playing:     state.playing,
    previewing:  state.previewing,
    volume:      state.masterVolume,
  }
}

// ─── WAVEFORM (visual sync) ───────────────────────────────────

export function getWaveformData(): Float32Array | null {
  if (!state.waveform || !state.playing) return null
  try {
    return state.waveform.getValue() as Float32Array
  } catch {
    return null
  }
}

// ─── DISPOSE ────────────────────────────────────

// ─── DISPOSE ─────────────────────────────────────────────────

export function disposeSoundEngine(): void {
  try { stopSessionSound(0.1) } catch {}
  try { stopPreview() } catch {}
  disposeLayers()
  try { state.waveform?.dispose() } catch {}
  state.waveform     = null
  state.initialized  = false
  state.playing      = false
  state.previewing   = false
}
