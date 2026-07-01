/**
 * ASTRYX Chamber — Instrumentation Engine
 *
 * Per-planet synth patch factory. Uses CONSERVATIVE Tone.js v14 API:
 *   - PolySynth with default Synth voice + custom envelope/oscillator type
 *     (NOT the (voice-class, options) pattern which fails in webpack prod)
 *   - AMSynth / FMSynth / PluckSynth / MonoSynth used DIRECTLY for monophonic
 *     voices, never wrapped in PolySynth
 *
 * Character difference comes from:
 *   - oscillator.type ('sine' / 'triangle' / 'sawtooth' / 'fatsawtooth' / 'amsine' / 'fmsine' / 'pwm')
 *   - envelope ADSR shape per planet
 *   - element modifier on filter brightness + note decay
 *   - downstream effects (chorus + reverb on master bus)
 *
 * Roles:
 *   pad     — chord bed (polyphonic)
 *   bell    — motif voice (monophonic pluck or FM)
 *   bowl    — Tibetan/crystal singing bowl (long decay)
 *   bass    — sub / drone foundation
 *   shimmer — high-frequency cosmic noise
 *   arp     — uses bell voice
 */

import * as Tone from 'tone'
import type { ChamberDNA } from './ChamberDNAEngine'

export type InstrumentRole = 'pad' | 'bell' | 'bowl' | 'bass' | 'shimmer' | 'arp'

export interface InstrumentVoice {
  voice: any                  // Tone synth — accepts triggerAttackRelease
  out: Tone.ToneAudioNode     // node to connect to downstream chain
  poly: boolean
  defaultDb: number
  label: string
}

// ─── MANUAL POLYPHONY ────────────────────────────────────────────────
// Tone.PolySynth fails in webpack production minification (TypeError:
// PolySynth is not a constructor). This helper wraps N Tone.Synth voices
// behind a single shared gain + triggerAttackRelease(chord_notes_array)
// interface — same API surface PolySynth gave us, zero PolySynth dependency.

export class ManualPoly {
  private voices: Tone.Synth[]
  /** Public so callers can connect downstream effects */
  public readonly gainOut: Tone.Gain
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

  /** Polysynth-compatible trigger — accepts string OR array of notes. */
  triggerAttackRelease(
    notes: string | string[],
    duration: number | string,
    time?: any,
    velocity?: number,
  ): void {
    const arr = Array.isArray(notes) ? notes : [notes]
    for (const note of arr) {
      const v = this.voices[this.next % this.voices.length]
      this.next++
      try { v.triggerAttackRelease(note, duration, time, velocity) } catch {}
    }
  }

  /** Polysynth.set() shim — propagates options to every voice. */
  set(opts: any): void {
    for (const v of this.voices) {
      try { v.set(opts) } catch {}
    }
  }

  get volume() {
    // Expose first voice's volume; soundEngine reads/sets layer.gain
    // separately. This is a fallback for any code that touches .volume.
    return this.voices[0].volume
  }

  connect(node: Tone.ToneAudioNode | Tone.InputNode): this {
    this.gainOut.connect(node as any)
    return this
  }

  dispose(): void {
    for (const v of this.voices) {
      try { v.dispose() } catch {}
    }
    try { this.gainOut.dispose() } catch {}
  }
}

// ─── ELEMENT MODIFIERS ──────────────────────────────────────────────

function brightnessFor(element: ChamberDNA['dominantElement']): number {
  switch (element) {
    case 'fire':  return 1.30
    case 'earth': return 0.80
    case 'air':   return 1.20
    case 'water': return 0.90
    default:      return 1.00
  }
}

function decayFor(element: ChamberDNA['dominantElement']): number {
  switch (element) {
    case 'fire':  return 0.85
    case 'earth': return 1.30
    case 'air':   return 0.95
    case 'water': return 1.45
    default:      return 1.00
  }
}

// ─── PAD VOICES (polyphonic chord bed) ──────────────────────────────
// All pads use Tone.PolySynth with DEFAULT voice (Tone.Synth).
// Character comes from oscillator type + envelope shape.

function buildPad(dna: ChamberDNA): InstrumentVoice {
  const planet = dna.primaryPlanet
  const decay = decayFor(dna.dominantElement)

  let oscType: any = 'triangle'
  let attack = 1.5 * decay
  let releaseSec = 3.0 * decay
  let sustain = 0.7
  let label = 'warm-pad'
  let volume = -6

  // Saturn / Pluto → dark drone-strings (fatsawtooth for richness, slow attack)
  if (planet === 'Saturn' || planet === 'Pluto') {
    oscType = 'fatsawtooth'
    attack = 2.5 * decay
    releaseSec = 4.0 * decay
    sustain = 0.85
    label = 'dark-string-pad'
    volume = -8
  }
  // Venus / Moon → lush warm pad (AM sine character via amsine oscillator)
  else if (planet === 'Venus' || planet === 'Moon') {
    oscType = 'amsine'
    attack = 1.8 * decay
    releaseSec = 3.5 * decay
    sustain = 0.75
    label = 'lush-warm-pad'
    volume = -6
  }
  // Jupiter / Sun → expansive bright pad (FM sine character)
  else if (planet === 'Jupiter' || planet === 'Sun') {
    oscType = 'fmsine'
    attack = 1.5 * decay
    releaseSec = 3.0 * decay
    sustain = 0.7
    label = 'expansive-pad'
    volume = -7
  }
  // Mercury → glass-like (fmsquare for harmonics)
  else if (planet === 'Mercury') {
    oscType = 'fmtriangle'
    attack = 0.8 * decay
    releaseSec = 2.5 * decay
    sustain = 0.5
    label = 'glass-pad'
    volume = -7
  }
  // Mars → sharper edged sawtooth
  else if (planet === 'Mars') {
    oscType = 'sawtooth'
    attack = 0.6 * decay
    releaseSec = 1.8 * decay
    sustain = 0.6
    label = 'sharp-pad'
    volume = -9
  }
  // Neptune → ambient shimmer pad (FM with slow attack)
  else if (planet === 'Neptune') {
    oscType = 'fmsine'
    attack = 3.5 * decay
    releaseSec = 5.0 * decay
    sustain = 0.8
    label = 'shimmer-pad'
    volume = -7
  }
  // Uranus → electric (PWM for modulation)
  else if (planet === 'Uranus') {
    oscType = 'pwm'
    attack = 1.2 * decay
    releaseSec = 2.5 * decay
    sustain = 0.55
    label = 'electric-pad'
    volume = -9
  }

  // Use ManualPoly — Tone.PolySynth is broken in webpack production.
  // 6 Tone.Synth voices behind a shared gain. Same trigger API surface.
  const voice = new ManualPoly(6, {
    oscillator: { type: oscType },
    envelope: { attack, decay: 0.6, sustain, release: releaseSec },
    volume,
  })

  return { voice: voice as any, out: voice.gainOut, poly: true, defaultDb: volume, label }
}

// ─── BELL / PLUCK VOICES (monophonic motif) ─────────────────────────
// Uses PluckSynth or FMSynth DIRECTLY (not wrapped in PolySynth).

function buildBell(dna: ChamberDNA): InstrumentVoice {
  const planet = dna.primaryPlanet
  const decay = decayFor(dna.dominantElement)

  // Mercury / Uranus / Air → Karplus-Strong pluck (harp-like crystalline)
  if (planet === 'Mercury' || planet === 'Uranus' || dna.dominantElement === 'air') {
    const voice = new Tone.PluckSynth({
      attackNoise: 0.5,
      dampening:   2800,
      resonance:   0.92,
      release:     1.6 * decay,
    })
    voice.volume.value = -6
    return { voice, out: voice, poly: false, defaultDb: -6, label: 'karplus-pluck' }
  }

  // Venus / Moon → softer harp-like pluck
  if (planet === 'Venus' || planet === 'Moon') {
    const voice = new Tone.PluckSynth({
      attackNoise: 0.3,
      dampening:   2400,
      resonance:   0.96,
      release:     2.4 * decay,
    })
    voice.volume.value = -5
    return { voice, out: voice, poly: false, defaultDb: -5, label: 'harp-pluck' }
  }

  // Mars / Sun → bright FMSynth bell
  if (planet === 'Mars' || planet === 'Sun') {
    const voice = new Tone.FMSynth({
      harmonicity: 5,
      modulationIndex: 12,
      envelope: { attack: 0.005, decay: 1.2 * decay, sustain: 0, release: 1.5 * decay },
    })
    voice.volume.value = -6
    return { voice, out: voice, poly: false, defaultDb: -6, label: 'fm-bell' }
  }

  // Saturn / Pluto / Earth → warm low bell (Tibetan-bowl character)
  if (planet === 'Saturn' || planet === 'Pluto' || dna.dominantElement === 'earth') {
    const voice = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 4,
      envelope: { attack: 0.01, decay: 2.5 * decay, sustain: 0, release: 3.0 * decay },
    })
    voice.volume.value = -5
    return { voice, out: voice, poly: false, defaultDb: -5, label: 'warm-low-bell' }
  }

  // Default — soft pluck
  const voice = new Tone.PluckSynth({
    attackNoise: 0.4,
    dampening:   2600,
    resonance:   0.94,
    release:     2.0 * decay,
  })
  voice.volume.value = -6
  return { voice, out: voice, poly: false, defaultDb: -6, label: 'soft-pluck' }
}

// ─── BOWL (Tibetan / crystal singing bowl) ──────────────────────────

function buildBowl(dna: ChamberDNA): InstrumentVoice {
  const decay = decayFor(dna.dominantElement)
  const voice = new Tone.FMSynth({
    harmonicity: 3.01,     // slight detune for metallic shimmer
    modulationIndex: 8,
    envelope: { attack: 0.05, decay: 4.0 * decay, sustain: 0.4, release: 6.0 * decay },
  })
  voice.volume.value = -7
  return { voice, out: voice, poly: false, defaultDb: -7, label: 'singing-bowl' }
}

// ─── BASS (sub / drone foundation) ──────────────────────────────────

function buildBass(dna: ChamberDNA): InstrumentVoice {
  const planet = dna.primaryPlanet

  // Saturn / Pluto / Earth → deep sub-sine
  if (planet === 'Saturn' || planet === 'Pluto' || dna.dominantElement === 'earth') {
    const voice = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 1.5, decay: 0.8, sustain: 0.9, release: 4.0 },
    })
    voice.volume.value = -8
    return { voice, out: voice, poly: false, defaultDb: -8, label: 'sub-drone-bass' }
  }

  // Mars → pulse bass (sawtooth, tighter)
  if (planet === 'Mars') {
    const voice = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.4, sustain: 0.5, release: 1.5 },
    })
    voice.volume.value = -10
    return { voice, out: voice, poly: false, defaultDb: -10, label: 'pulse-bass' }
  }

  // Default — soft sine bass
  const voice = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 1.0, decay: 0.5, sustain: 0.85, release: 2.5 },
  })
  voice.volume.value = -10
  return { voice, out: voice, poly: false, defaultDb: -10, label: 'soft-bass' }
}

// ─── SHIMMER (pink-noise cosmic texture) ────────────────────────────

function buildShimmer(dna: ChamberDNA): InstrumentVoice {
  const brightness = brightnessFor(dna.dominantElement)
  const voice = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.5, decay: 0.2, sustain: 0, release: 3.5 },
  })
  const hp = new Tone.Filter({ type: 'highpass', frequency: 2200 * brightness, Q: 0.8 })
  voice.connect(hp)
  voice.volume.value = -16
  return { voice, out: hp, poly: false, defaultDb: -16, label: 'pink-shimmer' }
}

// ─── PUBLIC FACTORY ─────────────────────────────────────────────────

export function buildInstrument(role: InstrumentRole, dna: ChamberDNA): InstrumentVoice {
  switch (role) {
    case 'pad':     return buildPad(dna)
    case 'bell':    return buildBell(dna)
    case 'bowl':    return buildBowl(dna)
    case 'bass':    return buildBass(dna)
    case 'shimmer': return buildShimmer(dna)
    case 'arp':     return buildBell(dna)
    default:        return buildPad(dna)
  }
}
