'use client'

/**
 * Astryx Sound Engine Controller — v4.0 (Directive I-FIX · FIX 1 & 2)
 *
 * THE SINGLE OWNER OF CHAMBER AUDIO. Nothing plays until the user presses Play.
 *
 *   • No autoplay. `astryxPlayer.crossFadeTo()` / `.play()` is only ever called
 *     from the user's Play gesture or from an effect that is gated behind
 *     `hasStarted && isPlaying`. SessionScreen NO LONGER touches astryxPlayer.
 *   • The session REQUESTS a track by passing `currentForkPlanet`; this controller
 *     resolves it (default per seed, honoring Customize overrides) and only
 *     cross-fades when already playing.
 *   • Controls + the song menu render UNCONDITIONALLY (not behind an init gate),
 *     in both Default and Customize.
 *
 * `NEXT_PUBLIC_AUDIO_BASE_URL` gates the layer (unset → silent, message).
 */

import { useState, useEffect, useRef } from 'react'
import type { ProtocolOutput } from '@/types'
import { hexToRgb, hexToRgba, formatTime } from '@/lib/utils'
import { astryxPlayer } from '@/lib/astryxPlayer'
import { audioSession } from '@/lib/audioSession'
import { useAppStore } from '@/lib/store'
import {
  resolveTierTrack, ensureManifestLoaded, versionsFor, buildTrackUrl, variantOrdinal, variantLabel,
  normalizePlanetKey, normalizeTrackKey,
  type AudioFolderState,
} from '@/lib/astryxAudioLibrary'
import { PLANET_COLORS } from '@/lib/engine'
import { forkFor } from '@/lib/chamber/forkRite'
import type { ChamberDNA } from '@/lib/chamber/ChamberDNAEngine'
import type { PolarityStateLike } from '@/types'

type PhaseKey = 'entry' | 'activation' | 'peak' | 'regulation' | 'integration'

// FIX 8 — Sacred Tones product page (the real physical forks), gated by the flag.
const SACRED_TONES_LIVE = process.env.NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE === 'true'
const SACRED_TONES_URL = 'https://sacredtea.net/products/planetary-tuning-forks'

const STATE_LABEL: Record<string, string> = {
  nat: 'Natural', exc: 'Excess', def: 'Deficiency', blk: 'Blocked',
}
// Friendly display names for the Earth grounding layers (R2 folders earthday/earthyear).
const PLANET_DISPLAY: Record<string, string> = { earthday: 'Earth Day', earthyear: 'Earth Year' }
const planetDisplay = (p?: string) => (p ? (PLANET_DISPLAY[p.toLowerCase()] ?? p) : '')

const PHASE_FRACTIONS: { phase: PhaseKey; until: number }[] = [
  { phase: 'entry',       until: 0.10 },
  { phase: 'activation',  until: 0.35 },
  { phase: 'peak',        until: 0.65 },
  { phase: 'regulation',  until: 0.85 },
  { phase: 'integration', until: 1.01 },
]

interface SoundEngineControllerProps {
  // v4.3 — null for the chart-independent Full Body ladder.
  protocol: ProtocolOutput | null
  accentColor: string
  sessionActive: boolean
  chamberDurationSec?: number
  chamberDNA?: ChamberDNA
  /** Directive I-FIX FIX 4 — the session's current step planet; the player follows
   *  it (resolves that planet's track). undefined → keep whatever is current. */
  currentForkPlanet?: string
  /** Fix 2 — the active fork's Hz, so the oscillator fallback can carry the
   *  calibrated frequency if the music track fails. */
  currentForkHz?: number
  /** v4.3.1 owner feedback — the Chakra session's instrument sets are EITHER/OR:
   *  in Solfeggio mode the planetary-fork conversion line must not appear
   *  (never two fork systems on screen together). */
  suppressConversionLine?: boolean
  // Default (session picks) vs Customize (user picks per aspect; persisted).
  audioMode?: 'default' | 'customize'
  onAudioModeChange?: (m: 'default' | 'customize') => void
  versionOverrides?: Record<string, string>
  onSelectVersion?: (planet: string, state: string, filename: string) => void
  onResetOverrides?: () => void
  /** Directive J — Full-Spectrum attunement: force every fork to its NAT
   *  (balanced) track, never exc/def/blk, regardless of the chart's tier states.
   *  This is the core "never amplify" safety for the all-forks sweep. */
  naturalOnly?: boolean
  /** N nice-to-have — start the player MINIMIZED (Body/Combined modes) so the
   *  dual placement orbs are visible on arrival. Music/breath modes pass false. */
  defaultCollapsed?: boolean
}

export default function SoundEngineController({
  accentColor: baseAccent,
  chamberDurationSec,
  chamberDNA,
  currentForkPlanet,
  currentForkHz,
  suppressConversionLine = false,
  audioMode = 'default',
  onAudioModeChange,
  versionOverrides,
  onSelectVersion,
  onResetOverrides,
  naturalOnly = false,
  defaultCollapsed = false,
}: SoundEngineControllerProps) {
  // ── Single source of truth for playback (this component owns it) ──
  const [hasStarted, setHasStarted] = useState(false)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [volume, setVolume]         = useState(0.9)   // music-forward default
  const [muted, setMuted]           = useState(false)
  const [curTime, setCurTime]       = useState(0)
  const [dur, setDur]               = useState(0)
  const [, forceTick]               = useState(0)
  // Minimize the player so it doesn't overshadow the body map on a phone.
  const [collapsed, setCollapsed]   = useState(defaultCollapsed)
  // FIX 1 — the chamber clock + session run only while we report "running".
  const setChamberRunning = useAppStore((s) => s.setChamberRunning)
  // FIX 8 — physical forks the user owns (the conversion line shows only for the rest).
  const ownedForks = useAppStore((s) => s.ownedForks)
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef  = useRef<number | null>(null)
  // Session song rotation: a repeated fork (same planet/state) advances to the
  // next variant so it never replays the same song; a track that errors auto-skips.
  const visitsRef = useRef<Record<string, number>>({})
  const lastKeyRef = useRef<string>('')
  const skipRef = useRef<Record<string, number>>({})
  const triedRef = useRef<Set<string>>(new Set())
  // v4.1 FIX 3 — deterministic fallback per phase key. When a phase's pool is
  // exhausted (every variant errored, or a single-variant pool errored), the
  // slot resolves to a FIXED fallback — the planet's own NAT pool first, then
  // the Earth Day ground layer — instead of going dead. Sticky per key so the
  // selection can't flip back to the broken track; cleared on phase change.
  const fallbackRef = useRef<Record<string, { planet: string; state: AudioFolderState; file: string } | undefined>>({})

  // FIX 3 — pull the manifest (via the same-origin /api/catalog proxy) so every
  // version is selectable; falls back to the seed catalog on any failure.
  useEffect(() => {
    let alive = true
    ensureManifestLoaded().then(() => { if (alive) forceTick((n) => n + 1) })
    return () => { alive = false }
  }, [])

  // Scrubber clock.
  useEffect(() => {
    const unsub = astryxPlayer.onTimeUpdate(() => {
      setCurTime(astryxPlayer.getCurrentTime())
      setDur(astryxPlayer.getDuration())
    })
    return unsub
  }, [])

  // Fix 2 — re-render on REAL audio-state changes (play/pause/canplay/error/ended)
  // so the LIVE badge + waveform reflect what is actually happening, not intent.
  useEffect(() => astryxPlayer.onStateChange(() => forceTick((n) => n + 1)), [])

  // ── Resolve the track for the session's current aspect ──
  // Folder state derives from the planet's tier in the signalHierarchy DNA.
  const seed = chamberDNA?.seed ?? 0
  const activePlanet = currentForkPlanet ?? chamberDNA?.primaryPlanet
  const polState: PolarityStateLike | undefined =
    // J — Full-Spectrum attunement forces NAT for every fork (balanced → nat),
    // never a planet's excess/deficiency/blocked corrective track.
    naturalOnly ? 'balanced'
    : !activePlanet || !chamberDNA ? 'balanced'
    : activePlanet === chamberDNA.primaryPlanet   ? chamberDNA.tierStates?.primary
    : activePlanet === chamberDNA.secondaryPlanet ? chamberDNA.tierStates?.secondary
    : activePlanet === chamberDNA.tertiaryPlanet  ? chamberDNA.tierStates?.tertiary
    : 'balanced'

  const defaultTrack = activePlanet ? resolveTierTrack(activePlanet, polState, seed) : null
  const folderState  = defaultTrack?.state ?? 'nat'
  const versions     = activePlanet ? versionsFor(activePlanet, folderState) : []
  // v4.2 Fix 1 — key strings go through the canonical normalizer ('Full Moon'→'moon').
  const overrideKey  = activePlanet ? `${normalizePlanetKey(activePlanet)}/${folderState}` : ''
  const override     = audioMode === 'customize' ? versionOverrides?.[overrideKey] : undefined

  // A NEW visit to this planet/state advances the variant, so a fork repeated in
  // the session plays the next song rather than the same one (cycles the pool).
  if (overrideKey && overrideKey !== lastKeyRef.current) {
    lastKeyRef.current = overrideKey
    visitsRef.current[overrideKey] = (visitsRef.current[overrideKey] ?? -1) + 1
    // v4.1 FIX 3 — a fresh phase gets a fresh chance: clear this key's fallback
    // and its tried-marks so one transient blip can't poison a later revisit.
    delete fallbackRef.current[overrideKey]
    for (const v of (activePlanet ? versionsFor(activePlanet, folderState) : [])) {
      triedRef.current.delete(v)
    }
  }
  // Earth layers (earthday/earthyear) always DEFAULT to the 1st track; other
  // planets keep their seed-deterministic default. Rotation still cycles from here.
  const isEarthLayer = !!activePlanet && activePlanet.toLowerCase().startsWith('earth')
  const variantBase = isEarthLayer ? 0 : (defaultTrack ? Math.max(0, versions.indexOf(defaultTrack.filename)) : 0)
  const rotShift    = (visitsRef.current[overrideKey] ?? 0) + (skipRef.current[overrideKey] ?? 0)
  const autoFile    = versions.length
    ? versions[(((variantBase + rotShift) % versions.length) + versions.length) % versions.length]
    : defaultTrack?.filename
  const selectedFile = override && versions.includes(override) ? override : autoFile
  // v4.1 FIX 3 — the EFFECTIVE selection honors a sticky per-phase fallback
  // (set by the error handler below) so an exhausted pool resolves to the
  // planet's NAT layer or the Earth ground tone — never a dead music slot.
  const fbSel = fallbackRef.current[overrideKey]
  const effPlanet = fbSel?.planet ?? activePlanet
  const effState: AudioFolderState = fbSel?.state ?? folderState
  const effFile = fbSel?.file ?? selectedFile
  const selectedUrl  = effPlanet && effFile
    ? buildTrackUrl(effPlanet, effState, effFile)
    : null
  const defaultIdx   = defaultTrack ? Math.max(0, versions.indexOf(defaultTrack.filename)) : 0
  const curVer       = selectedFile ? Math.max(0, versions.indexOf(selectedFile)) : -1
  const musicAvailable = !!selectedUrl

  // Patch — the player chrome follows the ACTIVE FORK's planet colour (changes
  // per phase), instead of staying the one dominant accent (e.g. Mars red).
  const accentColor = (activePlanet && PLANET_COLORS[activePlanet]) || baseAccent
  // The song currently cued for this aspect (shown in the player). Reflects the
  // EFFECTIVE selection so a fallback track is labeled honestly (v4.1 Fix 3).
  const songLabel = effPlanet && effFile
    ? variantOrdinal(effPlanet, effState, effFile, seed)
    : null

  // FIX 8 — conversion moment: the calibrated Hz of the active fork + whether the
  // user owns the physical fork. The line is a prescription, never a pitch.
  const ownForkHzRaw = activePlanet ? (currentForkHz ?? parseFloat(String(forkFor(activePlanet)?.hz ?? ''))) : NaN
  const ownForkHz = Number.isFinite(ownForkHzRaw) ? ownForkHzRaw : null
  const showConversionLine = !suppressConversionLine && !!activePlanet && !ownedForks.includes(activePlanet) && ownForkHz !== null

  // ── Fix 2 — REAL playback truth (never optimistic intent) ──
  const audible    = astryxPlayer.isAudiblyPlaying     // a track is actually sounding
  const live       = astryxPlayer.isLive || audible    // MP3 genuinely playing
  // Never claim "unavailable" while audio is audibly playing — a stale error flag
  // from a later 404 probe must not contradict what the user hears (SHA 2026-06-28).
  // v4.2 FIX 2 — and never claim it for a track we're not even requesting:
  // the error must be attributed to OUR currently selected URL. "Isn't
  // available" now appears only when literally nothing plays AND our own
  // track is the one that failed.
  const errored    = hasStarted && astryxPlayer.hasError && !audible &&
                     astryxPlayer.getErrorUrl() === selectedUrl
  // Patch — MUSIC-ONLY chamber: no synthesized tone fallback (SHA: only the song
  // plays). The frequency lives in the track itself.
  const realActive = live                              // sound is actually happening

  // ── Playback engine (the ONLY place audio starts) ──
  const startPhaseEnvelope = () => {
    startedAtRef.current = performance.now()
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current)
    const total = Math.max(30, chamberDurationSec ?? 900)
    phaseTimerRef.current = setInterval(() => {
      if (startedAtRef.current === null) return
      const frac = ((performance.now() - startedAtRef.current) / 1000) / total
      const ph = PHASE_FRACTIONS.find((p) => frac <= p.until)?.phase ?? 'integration'
      astryxPlayer.setPhase(ph)
    }, 2000)
  }
  const clearPhaseEnvelope = () => {
    if (phaseTimerRef.current) { clearInterval(phaseTimerRef.current); phaseTimerRef.current = null }
    startedAtRef.current = null
  }

  // The session advanced (or the user picked a version): follow it — but ONLY while
  // actually playing, so a step change can never start audio on its own.
  useEffect(() => {
    if (!hasStarted || !isPlaying || !selectedUrl) return
    if (selectedUrl === astryxPlayer.getCurrentUrl()) return
    astryxPlayer.crossFadeTo(selectedUrl, 4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUrl, hasStarted, isPlaying])

  // v4.1 FIX 3 / v4.2 FIX 2 — a track that fails to load routes around the gap:
  //   1. rotate to the next untried variant in the SAME pool (as before),
  //   2. pool exhausted / single-variant pool → DETERMINISTIC fallback:
  //      the planet's own NAT pool, else the Earth Day ground layer,
  //   3. the fallback itself failing escalates once to Earth Day.
  // Fixed mapping, no randomness — same chart + same failures → same tracks.
  // Every missed key is console.warn'd. The session never shows a dead slot.
  //
  // v4.2 — URL-ATTRIBUTED: this reacts ONLY when the player reports that OUR
  // currently selected URL is the one that failed. The v4.1 version reacted to
  // the bare hasError flag, which teardown events flipped on every crossfade —
  // one spurious error cascaded entire phases (Saturn→Mars→Neptune→Venus) down
  // to Earth Day even though every file was live. Never react to a stale flag.
  useEffect(() => {
    if (!hasStarted || !isPlaying || !errored || !activePlanet) return
    if (!selectedUrl || astryxPlayer.getErrorUrl() !== selectedUrl) return

    const fb = fallbackRef.current[overrideKey]
    if (fb) {
      // The fallback itself errored — escalate to the Earth ground layer once.
      if (fb.planet !== 'earthday') {
        console.warn(`[chamber-audio] fallback ${fb.planet}/${fb.state}/${fb.file} failed — grounding to earthday`)
        const earth = versionsFor('earthday', 'nat')[0]
        if (earth) {
          fallbackRef.current[overrideKey] = { planet: 'earthday', state: 'nat', file: earth }
          forceTick((x) => x + 1)
        }
      }
      return
    }

    if (!selectedFile) return
    triedRef.current.add(selectedFile)

    // Step 1 — rotate within the pool while untried variants remain.
    if (versions.length >= 2 && versions.some((v) => !triedRef.current.has(v))) {
      skipRef.current[overrideKey] = (skipRef.current[overrideKey] ?? 0) + 1
      forceTick((x) => x + 1)
      return
    }

    // Step 2 — pool exhausted: deterministic fallback chain.
    const natPool = folderState !== 'nat' ? versionsFor(activePlanet, 'nat') : []
    const natPick = natPool.find((v) => !triedRef.current.has(v))
    const pick = natPick
      ? { planet: activePlanet, state: 'nat' as AudioFolderState, file: natPick }
      : (() => {
          const earth = versionsFor('earthday', 'nat')[0]
          return earth ? { planet: 'earthday', state: 'nat' as AudioFolderState, file: earth } : undefined
        })()
    if (pick) {
      console.warn(`[chamber-audio] missed key ${normalizeTrackKey(activePlanet, folderState, selectedFile)} — deterministic fallback → ${normalizeTrackKey(pick.planet, pick.state, pick.file)}`)
      fallbackRef.current[overrideKey] = pick
      forceTick((x) => x + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errored, selectedFile, selectedUrl, hasStarted, isPlaying, overrideKey])

  // Cleanup on unmount (leaving the chamber) — hard-stop ALL audio + freeze clock.
  useEffect(() => {
    return () => { audioSession.panicStop(); setChamberRunning(false); clearPhaseEnvelope() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePlay = () => {
    if (!selectedUrl) return
    audioSession.claim('chamber')   // stops any other source first
    astryxPlayer.setMasterVolume(muted ? 0 : volume)
    // Called inside the click handler → trusted gesture → autoplay allowed.
    astryxPlayer.crossFadeTo(selectedUrl, 2)
    setHasStarted(true)
    setIsPlaying(true)
    setChamberRunning(true)         // FIX 1 — start the session clock + session
    startPhaseEnvelope()
  }
  const handlePause = () => { astryxPlayer.pause(0.6); setIsPlaying(false); setChamberRunning(false) }
  const handleResume = () => {
    if (!selectedUrl) return
    audioSession.claim('chamber')
    if (selectedUrl !== astryxPlayer.getCurrentUrl()) astryxPlayer.crossFadeTo(selectedUrl, 1)
    else astryxPlayer.resume(0.6)
    setIsPlaying(true)
    setChamberRunning(true)
  }
  const handleStop = () => {
    audioSession.panicStop()
    setIsPlaying(false)
    setHasStarted(false)
    setChamberRunning(false)
    clearPhaseEnvelope()
    setCurTime(0)
  }
  const handleTogglePlay = () => {
    if (!hasStarted) handlePlay()
    else if (isPlaying) handlePause()
    else handleResume()
  }

  const handleVolumeChange = (v: number) => {
    const vol = v / 100
    setVolume(vol)
    astryxPlayer.setMasterVolume(muted ? 0 : vol)
  }
  const handleMute = () => {
    const next = !muted
    setMuted(next)
    astryxPlayer.setMasterVolume(next ? 0 : volume)
  }
  const handleReplay = () => { astryxPlayer.restart(); setCurTime(0) }
  const handleSeek = (fraction: number) => {
    const d = astryxPlayer.getDuration()
    if (d > 0) { astryxPlayer.seekTo(fraction * d); setCurTime(fraction * d) }
  }

  // Choosing a song: persist it + ensure Customize so the session honors it. The
  // follow-effect cross-fades if we're playing; pre-play it just pre-selects.
  const selectVersion = (idx: number) => {
    if (!activePlanet || idx < 0 || idx >= versions.length) return
    if (audioMode !== 'customize') onAudioModeChange?.('customize')
    onSelectVersion?.(activePlanet, folderState, versions[idx])
    forceTick((x) => x + 1)
  }
  const cycle = (dir: 1 | -1) => {
    if (versions.length < 2) return
    const n = versions.length
    selectVersion((((curVer + dir) % n) + n) % n)
  }

  return (
    <div
      className="font-rajdhani"
      style={{
        background: 'rgba(5,7,20,0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '14px 18px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-white/60 mb-0.5">CHAMBER MUSIC</div>
          <div className="text-[13px] text-white/87">
            {/* v4.2 FIX 2 — honest banner: a rerouted slot names what IS playing;
                "isn't available" only when literally nothing plays. */}
            {!musicAvailable ? 'Music layer unavailable'
              : errored ? 'This track isn’t available yet — try another song.'
              : !hasStarted ? 'Press play when you’re ready to begin.'
              : fbSel && live && effPlanet && effFile
                ? `Rerouted — now playing ${variantLabel(effPlanet, effState, effFile)}.`
              : 'The frequency is in the music — each fork’s key, carried.'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Play / Pause — always present once music is available */}
          {musicAvailable && (
            <button
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex items-center justify-center rounded-full transition-all duration-200"
              style={{
                width: 46, height: 46,
                background: isPlaying ? hexToRgba(accentColor, 0.24) : hexToRgba(accentColor, 0.14),
                border: `1px solid ${isPlaying ? accentColor : hexToRgba(accentColor, 0.5)}`,
                color: isPlaying ? accentColor : 'rgba(255,255,255,0.9)',
                fontSize: 16, cursor: 'pointer',
              }}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
          )}
          {/* Minimize / expand — frees the screen for the body map */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand player' : 'Minimize player'}
            title={collapsed ? 'Expand player' : 'Minimize player'}
            className="flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              width: 32, height: 32,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer',
            }}
          >
            {collapsed ? '▴' : '▾'}
          </button>
        </div>
      </div>

      {/* Everything below the header collapses when minimized. */}
      {!collapsed && (
      <>
      {/* Pulse bars — live frequency visual. Driven by play INTENT so it moves the
          moment the user presses Play (even while audio truth is still resolving),
          never frozen during buffering/fallback. */}
      <PulseBars active={isPlaying || realActive} accentColor={accentColor} />

      {/* Now-playing aspect line */}
      {musicAvailable && activePlanet && (
        <div
          className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg"
          style={{
            background: realActive ? `rgba(${hexToRgb(accentColor)},0.08)` : 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div
            className="flex-shrink-0 rounded-full"
            style={{
              width: 6, height: 6,
              background: realActive ? accentColor : 'rgba(255,255,255,0.2)',
              boxShadow: realActive ? `0 0 6px ${accentColor}` : 'none',
              animation: realActive ? 'pulseGlow 2s ease-in-out infinite' : 'none',
            }}
          />
          <div className="min-w-0 truncate">
            <div className="text-[9px] tracking-[0.2em] text-white/55 uppercase truncate">
              {planetDisplay(activePlanet)} · {STATE_LABEL[folderState] ?? folderState}
            </div>
            {songLabel && (
              <div className="text-[11px] text-white/90 truncate" style={{ color: hexToRgba(accentColor, 0.95) }}>
                ♫ {songLabel}
              </div>
            )}
          </div>
          <div className="ml-auto text-[8px] tracking-[0.15em] flex-shrink-0"
               style={{ color: 'rgba(255,255,255,0.3)' }}>
            {/* Honest state: LIVE when the MP3 plays; UNAVAILABLE if it can't load
                (no tone fallback — music only); BUFFERING while loading. */}
            {live ? 'LIVE' : errored ? 'UNAVAILABLE' : (hasStarted && isPlaying) ? 'BUFFERING' : hasStarted ? 'PAUSED' : 'READY'}
          </div>
        </div>
      )}

      {/* FIX 8 — conversion moment (subtle, sacred): only for a fork the user
          doesn't own. Prescription, never pitch. */}
      {showConversionLine && (
        <p className="text-[11px] italic leading-relaxed mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
          This is the simulated tone. The real{' '}
          {SACRED_TONES_LIVE ? (
            <a href={SACRED_TONES_URL} target="_blank" rel="noopener noreferrer"
               style={{ color: accentColor, textDecoration: 'none' }}>
              {activePlanet} fork
            </a>
          ) : (
            <span style={{ color: hexToRgba(accentColor, 0.95) }}>{activePlanet} fork</span>
          )}{' '}
          resonates at {ownForkHz!.toFixed(2)} Hz in your hand.
        </p>
      )}

      {/* Env-gate message */}
      {!musicAvailable && (
        <p className="text-[11px] text-white/45 italic mt-1">
          Set NEXT_PUBLIC_AUDIO_BASE_URL to enable the chamber music.
        </p>
      )}

      {/* Transport + chooser — ALWAYS rendered when music is available (FIX 2) */}
      {musicAvailable && (
        <div className="mt-3">
          {/* Scrubber */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/45 tabular-nums w-9 text-right">{formatTime(Math.floor(curTime))}</span>
            <div className="flex-1 relative" style={{ height: 4 }}>
              <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <div className="absolute left-0 top-0 bottom-0 rounded-full"
                   style={{ width: `${dur > 0 ? Math.min(100, (curTime / dur) * 100) : 0}%`, background: accentColor }} />
              <input
                type="range" min={0} max={1000}
                value={dur > 0 ? Math.round((curTime / dur) * 1000) : 0}
                onChange={(e) => handleSeek(parseInt(e.target.value) / 1000)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ height: 4 }} aria-label="Seek"
              />
            </div>
            <span className="text-[9px] text-white/45 tabular-nums w-9">{dur > 0 ? formatTime(Math.floor(dur)) : '—'}</span>
          </div>

          {/* Transport buttons */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <TransportBtn label="◄◄" title="Previous song" disabled={versions.length < 2} onClick={() => cycle(-1)} accentColor={accentColor} />
            <TransportBtn label="↺"  title="Replay from start" disabled={!hasStarted} onClick={handleReplay} accentColor={accentColor} />
            <TransportBtn label="■"  title="Stop" disabled={!hasStarted} onClick={handleStop} accentColor={accentColor} />
            <TransportBtn label="►►" title="Next song" disabled={versions.length < 2} onClick={() => cycle(1)} accentColor={accentColor} />
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="text-[13px] transition-colors"
              style={{ color: muted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <div className="flex-1 relative" style={{ height: 3 }}>
              <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
              <div className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-200"
                   style={{ width: `${(muted ? 0 : volume) * 100}%`, background: accentColor }} />
              <input
                type="range" min={0} max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ height: 3 }} aria-label="Volume"
              />
            </div>
            <span className="text-[10px] text-white/45 w-7 text-right">{muted ? '0' : Math.round(volume * 100)}</span>
          </div>

          {/* Default | Customize */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 mr-1">Songs</span>
            {(['default', 'customize'] as const).map((m) => {
              const on = audioMode === m
              return (
                <button
                  key={m}
                  onClick={() => onAudioModeChange?.(m)}
                  className="px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] transition-all duration-200"
                  style={{
                    background: on ? hexToRgba(accentColor, 0.2) : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${on ? hexToRgba(accentColor, 0.55) : 'rgba(255,255,255,0.12)'}`,
                    color: on ? accentColor : 'rgba(255,255,255,0.55)', cursor: 'pointer',
                  }}
                >
                  {m === 'default' ? 'Default' : 'Customize'}
                </button>
              )
            })}
          </div>

          {/* Song menu — Patch 2.1: only when the user has opted into Customize.
              First-run defaults to the standard player (one obvious play path);
              the variant grid appears only after tapping "Customize". */}
          {audioMode === 'customize' && activePlanet && versions.length > 1 && (
            <div className="mt-2.5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/45 mb-1.5 text-center">
                {planetDisplay(activePlanet)} · {STATE_LABEL[folderState] ?? folderState} — {versions.length} songs
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {versions.map((stem, i) => {
                  const isCur = i === curVer
                  const isDefault = i === defaultIdx
                  return (
                    <button
                      key={stem}
                      onClick={() => selectVersion(i)}
                      title={`Variant ${i + 1}${isDefault ? ' · Default' : ''}`}
                      className="px-2.5 py-1 rounded-full text-[10px] tracking-[0.1em] transition-all duration-200"
                      style={{
                        background: isCur ? hexToRgba(accentColor, 0.22) : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isCur ? hexToRgba(accentColor, 0.6) : 'rgba(255,255,255,0.12)'}`,
                        color: isCur ? accentColor : 'rgba(255,255,255,0.6)', cursor: 'pointer',
                      }}
                    >
                      {isCur ? '♫ ' : ''}{i + 1}{isDefault ? ' ●' : ''}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="text-[8px] tracking-[0.15em] uppercase text-white/35">
                  ● default · ♫ playing · kept across sessions
                </span>
                {versionOverrides && Object.keys(versionOverrides).length > 0 && onResetOverrides && (
                  <button
                    onClick={onResetOverrides}
                    className="text-[8px] tracking-[0.15em] uppercase"
                    style={{ color: hexToRgba(accentColor, 0.85), background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ↺ reset all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  )
}

// ─── TRANSPORT BUTTON ───────────────────────────────────────────────
function TransportBtn({
  label, title, onClick, disabled = false, accentColor,
}: {
  label: string; title: string; onClick: () => void; disabled?: boolean; accentColor: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="flex items-center justify-center rounded-full transition-all duration-200"
      style={{
        width: 34, height: 34,
        background: disabled ? 'rgba(255,255,255,0.03)' : hexToRgba(accentColor, 0.12),
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : hexToRgba(accentColor, 0.4)}`,
        color: disabled ? 'rgba(255,255,255,0.25)' : accentColor,
        fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}

// ─── PULSE BARS — deterministic breathing visual ──────
function PulseBars({ active, accentColor }: { active: boolean; accentColor: string }) {
  const [bars, setBars] = useState<number[]>(() => Array(20).fill(0.08))
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      setBars(Array(20).fill(0.08))
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const tick = () => {
      const t = performance.now() / 1000
      // Livelier, spectrum-like motion: each bar has its own faster frequencies
      // so the graph visibly dances like an equalizer rather than a slow wave.
      const next = Array.from({ length: 20 }, (_, i) => {
        const f1 = 2.4 + (i % 5) * 0.8
        const f2 = 5.3 + (i % 4) * 1.4
        // gentle low-end emphasis so it reads as a frequency spectrum
        const tilt = 1 - (i / 20) * 0.35
        return (
          0.12
          + 0.44 * (0.5 + 0.5 * Math.sin(t * f1 + i * 0.9)) * tilt
          + 0.30 * (0.5 + 0.5 * Math.sin(t * f2 + i * 2.1))
        )
      })
      setBars(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [active])

  return (
    <div className="flex items-end justify-between gap-[3px]" style={{ height: 40 }}>
      {bars.map((amp, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${Math.max(10, Math.min(1, amp) * 100)}%`,
            background: active
              ? `linear-gradient(180deg, ${accentColor} 0%, ${hexToRgba(accentColor, 0.4)} 100%)`
              : 'rgba(255,255,255,0.08)',
            transitionDuration: '70ms',
            transitionTimingFunction: 'ease-out',
            opacity: active ? Math.max(0.45, amp + 0.25) : 0.3,
          }}
        />
      ))}
    </div>
  )
}
