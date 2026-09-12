'use client'

/**
 * ASTRYX — the playable tone ladder (the front door's instrument)
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12. Sound is the one sense a browser can actually deliver, so
 * the front page delivers it rather than describing it. Every tone here is
 * generated live by a Web Audio oscillator — no files, no hosting, no cost.
 *
 * The frequencies are the ones ENGRAVED ON THE FORKS, which is why Uranus reads
 * 207.33 and Neptune 211.45 rather than the strict Cousto derivation. A person
 * holding a fork and reading this page must see one number, not two.
 *
 * The split is the house rule: the oscilloscope is LIVE so it stays on the dark
 * ground; the key beneath is an INDEX, so it is printed on stone in black type.
 * Dot colours come from the app's own PLANET_COLORS, darkened where a pale hue
 * would not hold at 8px on ivory — the hue is preserved.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

type Fork = { n: string; hz: number; c: string; om?: boolean }

const FORKS: Fork[] = [
  { n: 'Sun',        hz: 126.22, c: '#D98A15' },
  { n: 'Earth Year', hz: 136.10, c: '#8A5A07', om: true },
  { n: 'Pluto',      hz: 140.25, c: '#7B4FD6' },
  { n: 'Mercury',    hz: 141.27, c: '#6E9410' },
  { n: 'Mars',       hz: 144.72, c: '#A85A4E' },
  { n: 'Saturn',     hz: 147.85, c: '#A87A1E' },
  { n: 'Jupiter',    hz: 183.58, c: '#4B5FBC' },
  { n: 'Earth Day',  hz: 194.18, c: '#1E7A5A' },
  { n: 'Uranus',     hz: 207.33, c: '#0E9E92' },
  { n: 'Full Moon',  hz: 210.42, c: '#5E7E8E' },
  { n: 'Neptune',    hz: 211.45, c: '#7B3FC4' },
  { n: 'Venus',      hz: 221.23, c: '#2E8F6B' },
]
const LO = 126.22
const HI = 221.23

/** Imperative handle so the hero button and the placement photos can sound a tone. */
export type ToneApi = { play: (name: string) => void }

export default function ToneLadder({ onReady }: { onReady?: (api: ToneApi) => void }) {
  const [current, setCurrent] = useState<number>(-1)
  const ctxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const anRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const curRef = useRef(-1)

  const stop = useCallback(() => {
    const ctx = ctxRef.current
    const osc = oscRef.current
    const gain = gainRef.current
    if (osc && ctx && gain) {
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime)
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.16)
        osc.stop(ctx.currentTime + 0.2)
      } catch { /* the context can already be closed; nothing to unwind */ }
    }
    oscRef.current = null
    curRef.current = -1
    setCurrent(-1)
  }, [])

  const playIndex = useCallback((i: number) => {
    const f = FORKS[i]
    if (!f) return
    if (curRef.current === i) { stop(); return }
    stop()
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext
        if (!AC) return
        const ctx: AudioContext = new AC()
        const an = ctx.createAnalyser()
        an.fftSize = 2048
        an.connect(ctx.destination)
        ctxRef.current = ctx
        anRef.current = an
        dataRef.current = new Uint8Array(new ArrayBuffer(an.fftSize))
      }
      const ctx = ctxRef.current!
      if (ctx.state === 'suspended') void ctx.resume()
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.16, ctx.currentTime + 3.6)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6.2)
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f.hz, ctx.currentTime)
      osc.connect(gain)
      gain.connect(anRef.current!)
      osc.start()
      osc.stop(ctx.currentTime + 6.3)
      osc.onended = () => { if (oscRef.current === osc) stop() }
      oscRef.current = osc
      gainRef.current = gain
      curRef.current = i
      setCurrent(i)
    } catch { /* audio unavailable — the page still reads perfectly well */ }
  }, [stop])

  // Hand the parent a way in, so the hero CTA and the photographs can sound a tone.
  useEffect(() => {
    onReady?.({ play: (name: string) => {
      const i = FORKS.findIndex((f) => f.n === name)
      if (i >= 0) playIndex(i)
    } })
  }, [onReady, playIndex])

  useEffect(() => () => { try { void ctxRef.current?.close() } catch { /* already closed */ } }, [])

  // ── the oscilloscope: the real waveform leaving the speakers ──────────────
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const g = cv.getContext('2d')
    if (!g) return
    const W = cv.width, H = cv.height
    let t = 0
    let raf = 0
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const draw = () => {
      g.clearRect(0, 0, W, H)
      g.strokeStyle = 'rgba(30,27,75,.75)'
      g.lineWidth = 1
      for (let x = 0; x <= W; x += W / 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke() }
      g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke()
      const grad = g.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, '#C084FC'); grad.addColorStop(0.5, '#38BDF8'); grad.addColorStop(1, '#F59E0B')
      g.strokeStyle = grad
      g.lineWidth = 2.4
      g.shadowBlur = 18
      g.shadowColor = 'rgba(56,189,248,.75)'
      g.beginPath()
      const an = anRef.current, data = dataRef.current
      if (oscRef.current && an && data) {
        an.getByteTimeDomainData(data)
        const step = data.length / W
        for (let i = 0; i < W; i++) {
          const v = (data[Math.floor(i * step)] - 128) / 128
          const y = H / 2 + v * (H / 2 - 12)
          i ? g.lineTo(i, y) : g.moveTo(i, y)
        }
      } else {
        // At rest it breathes, so the instrument never looks switched off.
        for (let j = 0; j < W; j++) {
          const y = H / 2 + Math.sin(j / 78 + t) * 6 * Math.sin((j / W) * Math.PI)
          j ? g.lineTo(j, y) : g.moveTo(j, y)
        }
      }
      g.stroke()
      g.shadowBlur = 0
      t += reduce ? 0 : 0.016
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  const now = current >= 0 ? FORKS[current] : null

  return (
    <div className="ax-instrument">
      <div className="ax-scope">
        <canvas ref={canvasRef} width={900} height={264} />
        <div className="ax-scope-hud">
          <div className="ax-now">
            <span>{now ? now.n : 'The twelve tones'}</span>
            <b>{now ? `${now.hz.toFixed(2)} Hz` : '—'}</b>
          </div>
          <div className="ax-hint">Tap to sound</div>
        </div>
      </div>

      <div className="ax-keys">
        {FORKS.map((f, i) => (
          <button
            key={f.n}
            type="button"
            className={`ax-key${f.om ? ' om' : ''}`}
            aria-pressed={current === i}
            aria-label={`Sound the ${f.n} tone at ${f.hz.toFixed(2)} hertz`}
            onClick={() => playIndex(i)}
          >
            <span className="nm">{f.n}</span>
            <span className="track">
              <span className="tick" style={{ left: `${(((f.hz - LO) / (HI - LO)) * 100).toFixed(1)}%`, background: f.c }} />
            </span>
            <span className="hz">{f.hz.toFixed(2)}</span>
          </button>
        ))}
      </div>

      <div className="ax-keynote">
        Earth Year is the one that belongs to no planet. It is this planet&rsquo;s own year, and every
        other tone is measured against it.
      </div>
    </div>
  )
}
