'use client'

/**
 * ASTRYX — Music Library (Directive I.5)
 *
 * The freshness / retention layer. Three surfaces:
 *   • Browse    — the FULL bucket (manifest-driven, grows monthly), by
 *                 planet × state, every version selectable.
 *   • Favorites — saved tracks, played anytime.
 *   • Sequences — "build your own chamber": assemble a personal playlist of
 *                 tracks to experiment with the forks and play on demand.
 *
 * This is a self-made audio environment (consistent with I.2: the report
 * surfaces stay silent; audio lives in the chamber and here). It owns the
 * astryxPlayer while mounted and releases it (restoring loop) on exit.
 *
 * Env-gated by NEXT_PUBLIC_AUDIO_BASE_URL.
 */

import { useState, useEffect, useCallback } from 'react'
import type { SavedTrack, SoundFolderState, CustomSequence } from '@/types'
import { useAppStore } from '@/lib/store'
import { hexToRgba, formatTime } from '@/lib/utils'
import { PLANET_COLORS } from '@/lib/engine'
import { astryxPlayer } from '@/lib/astryxPlayer'
import { audioSession } from '@/lib/audioSession'
import {
  ensureManifestLoaded, manifestStatus, versionsFor, buildTrackUrl, totalTrackCount, variantLabel,
} from '@/lib/astryxAudioLibrary'
import { playPureTone, stopPureTone, pureToneHz, onPureToneChange, INTEGRATION_AMBIENT } from '@/lib/pureTone'

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

// Chakra Solfeggio tones (crown → root). Pure frequencies, played via Web Audio.
const CHAKRA_TONES = [
  { name: 'Crown',        sanskrit: 'Sahasrāra',    hz: 963, color: '#B447FF' },
  { name: 'Third Eye',    sanskrit: 'Ājñā',         hz: 852, color: '#5B47FF' },
  { name: 'Throat',       sanskrit: 'Viśuddha',     hz: 741, color: '#1FB6FF' },
  { name: 'Heart',        sanskrit: 'Anāhata',      hz: 639, color: '#43E66A' },
  { name: 'Solar Plexus', sanskrit: 'Maṇipūra',     hz: 528, color: '#FFD600' },
  { name: 'Sacral',       sanskrit: 'Svādhiṣṭhāna', hz: 417, color: '#FF8A1A' },
  { name: 'Root',         sanskrit: 'Mūlādhāra',    hz: 396, color: '#FF3D5C' },
]
const STATES: { key: SoundFolderState; label: string }[] = [
  { key: 'nat', label: 'Natural' },
  { key: 'exc', label: 'Excess · cooling' },
  { key: 'def', label: 'Deficiency · building' },
  { key: 'blk', label: 'Blocked · releasing' },
]

const trackKey = (t: SavedTrack) => `${t.planet}/${t.state}/${t.filename}`
const audioConfigured = !!process.env.NEXT_PUBLIC_AUDIO_BASE_URL

export default function MusicLibraryScreen({
  accentColor, onBack,
}: {
  accentColor: string
  onBack: () => void
}) {
  const favorites       = useAppStore((s) => s.favorites)
  const toggleFavorite  = useAppStore((s) => s.toggleFavorite)
  const customSequences = useAppStore((s) => s.customSequences)
  const addSequence     = useAppStore((s) => s.addSequence)
  const deleteSequence  = useAppStore((s) => s.deleteSequence)

  const [tab, setTab]               = useState<'browse' | 'favorites' | 'sequences' | 'chakra'>('browse')
  const [planet, setPlanet]         = useState('Sun')
  const [, forceTick]               = useState(0)

  // Build-your-own draft
  const [draft, setDraft]           = useState<SavedTrack[]>([])
  const [draftName, setDraftName]   = useState('')

  // Player state (mini transport)
  const [queue, setQueue]           = useState<SavedTrack[]>([])
  const [queueIdx, setQueueIdx]     = useState(0)
  const [playing, setPlaying]       = useState(false)
  const [curTime, setCurTime]       = useState(0)
  const [dur, setDur]               = useState(0)

  const nowPlaying = queue[queueIdx] ?? null

  // Manifest → full pool; release the player on exit.
  useEffect(() => {
    ensureManifestLoaded().then(() => forceTick((n) => n + 1))
    const unsub = astryxPlayer.onTimeUpdate(() => {
      setCurTime(astryxPlayer.getCurrentTime())
      setDur(astryxPlayer.getDuration())
    })
    const unsubTone = onPureToneChange(() => forceTick((n) => n + 1))
    return () => {
      unsub()
      unsubTone()
      astryxPlayer.setOnEnded(null)
      audioSession.panicStop()   // hard-stop ALL audio on leaving the library
      astryxPlayer.setLoop(true)   // restore the chamber default
    }
  }, [])

  // ── Playback ──────────────────────────────────────────────
  const playQueue = useCallback((tracks: SavedTrack[], startIdx = 0) => {
    if (!tracks.length || !audioConfigured) return
    audioSession.claim('musicLibrary')   // stops the chamber/other source first
    setQueue(tracks)
    setQueueIdx(startIdx)
    astryxPlayer.setLoop(tracks.length === 1)   // single track loops; a sequence plays through
    astryxPlayer.setMasterVolume(0.9)
    astryxPlayer.load(buildTrackUrl(tracks[startIdx].planet, tracks[startIdx].state, tracks[startIdx].filename))
    astryxPlayer.play(1.5)
    setPlaying(true)
  }, [])

  // Advance to the next track when one in a sequence ends.
  useEffect(() => {
    astryxPlayer.setOnEnded(() => {
      setQueueIdx((idx) => {
        const next = idx + 1
        if (next < queue.length) {
          const t = queue[next]
          astryxPlayer.setLoop(queue.length === 1)
          astryxPlayer.load(buildTrackUrl(t.planet, t.state, t.filename))
          astryxPlayer.play(1)
          return next
        }
        setPlaying(false)
        return idx
      })
    })
  }, [queue])

  const jumpTo = (idx: number) => {
    if (idx < 0 || idx >= queue.length) return
    const t = queue[idx]
    setQueueIdx(idx)
    astryxPlayer.setLoop(queue.length === 1)
    astryxPlayer.load(buildTrackUrl(t.planet, t.state, t.filename))
    astryxPlayer.play(1)
    setPlaying(true)
  }
  const togglePlay = () => {
    if (!nowPlaying) return
    if (playing) { astryxPlayer.pause(0.6); setPlaying(false) }
    else { astryxPlayer.resume(0.6); setPlaying(true) }
  }
  const seek = (fraction: number) => {
    const d = astryxPlayer.getDuration()
    if (d > 0) { astryxPlayer.seekTo(fraction * d); setCurTime(fraction * d) }
  }

  const addToDraft = (t: SavedTrack) => setDraft((d) => [...d, t])
  const removeFromDraft = (i: number) => setDraft((d) => d.filter((_, k) => k !== i))
  const moveDraft = (i: number, dir: -1 | 1) => setDraft((d) => {
    const j = i + dir
    if (j < 0 || j >= d.length) return d
    const copy = [...d]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    return copy
  })
  const saveDraft = () => {
    if (!draft.length) return
    const seq: CustomSequence = {
      id: crypto.randomUUID(),
      name: draftName.trim() || `My chamber (${draft.length} tracks)`,
      tracks: draft,
      createdAt: new Date().toISOString(),
    }
    addSequence(seq)
    setDraft([])
    setDraftName('')
    setTab('sequences')
  }

  const planetColor = PLANET_COLORS[planet] ?? accentColor

  return (
    <div className="min-h-screen font-rajdhani px-5" style={{ paddingTop: 96, paddingBottom: 160 }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: hexToRgba(accentColor, 0.85) }}>
              Cosmic Resonance System
            </div>
            <h1 className="font-cinzel font-semibold text-white" style={{ fontSize: 'clamp(28px,5vw,40px)' }}>
              Music Library
            </h1>
          </div>
          <button
            onClick={onBack}
            className="kowalski-button rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.2em]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
          >
            ← Back
          </button>
        </div>
        <p className="text-[13px] text-content-sm mb-5 max-w-[60ch]">
          The full library — every aspect, every version, growing monthly. Favorite what moves you,
          or build your own chamber from the tracks you choose.
          {audioConfigured && (
            <span className="text-meta"> {totalTrackCount()} tracks loaded
              {manifestStatus() === 'loaded' ? ' (live manifest).' : '.'}</span>
          )}
        </p>

        {!audioConfigured && (
          <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[13px] text-content-sm">
              The music layer is not configured yet (set <span className="font-mono-jb">NEXT_PUBLIC_AUDIO_BASE_URL</span>).
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([['browse', 'Browse'], ['favorites', `Favorites (${favorites.length})`], ['sequences', `My Chambers (${customSequences.length})`], ['chakra', 'Chakra']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.18em] transition"
              style={{
                background: tab === k ? hexToRgba(accentColor, 0.18) : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tab === k ? hexToRgba(accentColor, 0.5) : 'rgba(255,255,255,0.1)'}`,
                color: tab === k ? accentColor : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── BROWSE ── */}
        {tab === 'browse' && audioConfigured && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PLANETS.map((pl) => {
                const c = PLANET_COLORS[pl] ?? accentColor
                const on = pl === planet
                return (
                  <button
                    key={pl}
                    onClick={() => setPlanet(pl)}
                    className="px-3 py-1.5 rounded-lg text-[11px] tracking-[0.1em] transition"
                    style={{
                      background: on ? hexToRgba(c, 0.18) : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${on ? hexToRgba(c, 0.5) : 'rgba(255,255,255,0.1)'}`,
                      color: on ? c : 'rgba(255,255,255,0.55)',
                      cursor: 'pointer',
                    }}
                  >
                    {pl}
                  </button>
                )
              })}
            </div>

            <div className="space-y-3">
              {STATES.map(({ key, label }) => {
                const vers = versionsFor(planet, key)
                if (!vers.length) return null
                return (
                  <div key={key} className="rounded-xl p-4"
                       style={{ background: hexToRgba(planetColor, 0.05), border: `1px solid ${hexToRgba(planetColor, 0.18)}` }}>
                    <div className="text-[10px] uppercase tracking-[0.22em] mb-2.5" style={{ color: hexToRgba(planetColor, 0.9) }}>
                      {label} · {vers.length} version{vers.length > 1 ? 's' : ''}
                    </div>
                    <div className="space-y-1.5">
                      {vers.map((filename) => {
                        const track: SavedTrack = { planet, state: key, filename }
                        const fav = favorites.some((f) => trackKey(f) === trackKey(track))
                        const isNow = nowPlaying && trackKey(nowPlaying) === trackKey(track)
                        return (
                          <TrackRow
                            key={filename}
                            label={variantLabel(planet, key, filename)}
                            color={planetColor}
                            fav={fav}
                            isNow={!!isNow && playing}
                            onPlay={() => playQueue([track])}
                            onFav={() => toggleFavorite(track)}
                            onAdd={() => addToDraft(track)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── FAVORITES ── */}
        {tab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <Empty text="No favorites yet. Tap ♡ on any track to save it here." />
            ) : (
              <>
                <button
                  onClick={() => playQueue(favorites)}
                  className="mb-3 px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.18em]"
                  style={{ background: hexToRgba(accentColor, 0.18), border: `1px solid ${hexToRgba(accentColor, 0.5)}`, color: accentColor, cursor: 'pointer' }}
                >
                  ▶ Play all favorites
                </button>
                <div className="space-y-1.5">
                  {favorites.map((t) => {
                    const c = PLANET_COLORS[t.planet] ?? accentColor
                    const isNow = nowPlaying && trackKey(nowPlaying) === trackKey(t)
                    return (
                      <TrackRow
                        key={trackKey(t)}
                        label={variantLabel(t.planet, t.state, t.filename)}
                        color={c}
                        fav
                        isNow={!!isNow && playing}
                        onPlay={() => playQueue([t])}
                        onFav={() => toggleFavorite(t)}
                        onAdd={() => addToDraft(t)}
                      />
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CHAKRA TONES (Solfeggio) ── */}
        {tab === 'chakra' && (
          <div>
            <p className="text-[12px] text-content-sm mb-4 leading-relaxed">
              Pure Solfeggio frequencies — tap a chakra to hear its tone. One plays at a time.
            </p>
            <div className="space-y-2">
              {CHAKRA_TONES.map((ch) => {
                const on = pureToneHz() === ch.hz
                return (
                  <button
                    key={ch.name}
                    onClick={() => {
                      if (on) { stopPureTone() }
                      else { audioSession.claim('chakraTone'); playPureTone(ch.hz) }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl kowalski-button text-left"
                    style={{
                      background: on ? hexToRgba(ch.color, 0.18) : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${on ? hexToRgba(ch.color, 0.5) : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ background: ch.color, boxShadow: `0 0 10px ${ch.color}` }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] text-white/90">{ch.name}</span>
                      <span className="block text-[10px] text-white/45 tracking-wide">{ch.sanskrit}</span>
                    </span>
                    <span className="font-cinzel text-[15px] shrink-0" style={{ color: ch.color }}>{ch.hz} Hz</span>
                    <span className="text-[14px] w-6 text-center shrink-0" style={{ color: on ? ch.color : 'rgba(255,255,255,0.5)' }}>
                      {on ? '❚❚' : '▶'}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Integration ambient — 172.06 Hz, NOT a fork (Directive v2.0 · FIX D) */}
            <div className="mt-4 pt-4 border-t border-white/8">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-2">Integration ambient</div>
              {(() => {
                const on = pureToneHz() === INTEGRATION_AMBIENT.hz
                return (
                  <button
                    onClick={() => {
                      if (on) { stopPureTone() }
                      else { audioSession.claim('chakraTone'); playPureTone(INTEGRATION_AMBIENT.hz) }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl kowalski-button text-left"
                    style={{
                      background: on ? 'rgba(192,132,252,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${on ? 'rgba(192,132,252,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ background: '#C084FC', boxShadow: '0 0 10px #C084FC' }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] text-white/90">{INTEGRATION_AMBIENT.label}</span>
                      <span className="block text-[10px] text-white/45 tracking-wide">Ambient integration tone · not a fork</span>
                    </span>
                    <span className="font-cinzel text-[15px] shrink-0" style={{ color: '#C084FC' }}>{INTEGRATION_AMBIENT.hz} Hz</span>
                    <span className="text-[14px] w-6 text-center shrink-0" style={{ color: on ? '#C084FC' : 'rgba(255,255,255,0.5)' }}>
                      {on ? '❚❚' : '▶'}
                    </span>
                  </button>
                )
              })()}
            </div>

            <p className="text-[10px] text-white/35 italic mt-4">
              ⓘ The chakra layer uses Solfeggio tones. The Chamber session stays music-only.
            </p>
          </div>
        )}

        {/* ── SEQUENCES (build your own chamber) ── */}
        {tab === 'sequences' && (
          <div className="space-y-6">
            {/* Draft builder */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${hexToRgba(accentColor, 0.2)}` }}>
              <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: hexToRgba(accentColor, 0.9) }}>
                Build your own chamber
              </div>
              {draft.length === 0 ? (
                <p className="text-[12px] text-content-sm">
                  Add tracks from Browse or Favorites (the ＋ button), arrange them, and save your sequence.
                </p>
              ) : (
                <div className="space-y-1.5 mb-3">
                  {draft.map((t, i) => (
                    <div key={`${trackKey(t)}-${i}`} className="flex items-center gap-2 text-[12px] text-content">
                      <span className="text-meta w-5 text-right">{i + 1}</span>
                      <span className="flex-1 truncate">{variantLabel(t.planet, t.state, t.filename)}</span>
                      <button onClick={() => moveDraft(i, -1)} className="text-white/40 px-1" style={{ cursor: 'pointer' }} aria-label="Up">↑</button>
                      <button onClick={() => moveDraft(i, 1)} className="text-white/40 px-1" style={{ cursor: 'pointer' }} aria-label="Down">↓</button>
                      <button onClick={() => removeFromDraft(i)} className="text-red-300/70 px-1" style={{ cursor: 'pointer' }} aria-label="Remove">×</button>
                    </div>
                  ))}
                </div>
              )}
              {draft.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Name your chamber…"
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-lg text-[12px] text-white"
                    style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button onClick={() => playQueue(draft)}
                    className="px-4 py-2 rounded-lg text-[11px] uppercase tracking-[0.18em]"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                    ▶ Preview
                  </button>
                  <button onClick={saveDraft}
                    className="px-4 py-2 rounded-lg text-[11px] uppercase tracking-[0.18em]"
                    style={{ background: hexToRgba(accentColor, 0.2), border: `1px solid ${hexToRgba(accentColor, 0.5)}`, color: accentColor, cursor: 'pointer' }}>
                    ✓ Save chamber
                  </button>
                </div>
              )}
            </div>

            {/* Saved sequences */}
            {customSequences.length === 0 ? (
              <Empty text="No saved chambers yet." />
            ) : (
              <div className="space-y-2">
                {customSequences.map((seq) => (
                  <div key={seq.id} className="flex items-center gap-3 rounded-xl p-3"
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-white truncate">{seq.name}</div>
                      <div className="text-[10px] text-meta">{seq.tracks.length} tracks</div>
                    </div>
                    <button onClick={() => playQueue(seq.tracks)}
                      className="px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-[0.15em]"
                      style={{ background: hexToRgba(accentColor, 0.18), border: `1px solid ${hexToRgba(accentColor, 0.5)}`, color: accentColor, cursor: 'pointer' }}>
                      ▶ Play
                    </button>
                    <button onClick={() => deleteSequence(seq.id)}
                      className="px-2 py-1.5 rounded-lg text-[12px] text-red-300/70"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      aria-label="Delete">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mini player (fixed) ── */}
      {nowPlaying && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto rounded-2xl p-3"
               style={{ background: 'rgba(5,7,20,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/45">
                  Now playing {queue.length > 1 ? `· ${queueIdx + 1}/${queue.length}` : ''}
                </div>
                <div className="text-[12px] text-white truncate">
                  {variantLabel(nowPlaying.planet, nowPlaying.state, nowPlaying.filename)}
                </div>
              </div>
              <MiniBtn label="◄◄" disabled={queueIdx <= 0} onClick={() => jumpTo(queueIdx - 1)} accentColor={accentColor} />
              <MiniBtn label={playing ? '❚❚' : '▶'} onClick={togglePlay} accentColor={accentColor} primary />
              <MiniBtn label="►►" disabled={queueIdx >= queue.length - 1} onClick={() => jumpTo(queueIdx + 1)} accentColor={accentColor} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] text-white/45 tabular-nums w-9 text-right">{formatTime(Math.floor(curTime))}</span>
              <div className="flex-1 relative" style={{ height: 4 }}>
                <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
                <div className="absolute left-0 top-0 bottom-0 rounded-full"
                     style={{ width: `${dur > 0 ? Math.min(100, (curTime / dur) * 100) : 0}%`, background: accentColor }} />
                <input type="range" min={0} max={1000}
                  value={dur > 0 ? Math.round((curTime / dur) * 1000) : 0}
                  onChange={(e) => seek(parseInt(e.target.value) / 1000)}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: 4 }} aria-label="Seek" />
              </div>
              <span className="text-[9px] text-white/45 tabular-nums w-9">{dur > 0 ? formatTime(Math.floor(dur)) : '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── sub-components ──────────────────────────────────────────
function TrackRow({
  label, color, fav, isNow, onPlay, onFav, onAdd,
}: {
  label: string; color: string; fav: boolean; isNow: boolean
  onPlay: () => void; onFav: () => void; onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2"
         style={{ background: isNow ? hexToRgba(color, 0.12) : 'rgba(255,255,255,0.02)', border: `1px solid ${isNow ? hexToRgba(color, 0.4) : 'rgba(255,255,255,0.06)'}` }}>
      <button onClick={onPlay} className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 28, height: 28, background: hexToRgba(color, 0.18), border: `1px solid ${hexToRgba(color, 0.45)}`, color, cursor: 'pointer', fontSize: 11 }}
        aria-label="Play">{isNow ? '♫' : '▶'}</button>
      <span className="flex-1 truncate text-[12px] text-content">{label}</span>
      <button onClick={onAdd} className="text-[14px] px-1.5 text-white/45 hover:text-white/80" style={{ cursor: 'pointer' }} title="Add to a chamber sequence" aria-label="Add to sequence">＋</button>
      <button onClick={onFav} className="text-[14px] px-1" style={{ color: fav ? color : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} title="Favorite" aria-label="Favorite">{fav ? '♥' : '♡'}</button>
    </div>
  )
}

function MiniBtn({
  label, onClick, disabled = false, accentColor, primary = false,
}: { label: string; onClick: () => void; disabled?: boolean; accentColor: string; primary?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center justify-center rounded-full flex-shrink-0 transition"
      style={{
        width: primary ? 40 : 34, height: primary ? 40 : 34,
        background: disabled ? 'rgba(255,255,255,0.03)' : hexToRgba(accentColor, primary ? 0.25 : 0.12),
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : hexToRgba(accentColor, 0.45)}`,
        color: disabled ? 'rgba(255,255,255,0.25)' : accentColor,
        cursor: disabled ? 'not-allowed' : 'pointer', fontSize: primary ? 14 : 12,
      }}>
      {label}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-[13px] text-content-sm">{text}</p>
    </div>
  )
}
