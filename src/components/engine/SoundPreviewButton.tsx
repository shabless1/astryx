'use client'

/**
 * Sound Preview Button — v2 (Directive H.3 — MUSIC ONLY)
 * Plays the PRIMARY signal's own Astryx audio track for a short preview. No
 * synthesized tones — the planetary frequency lives in the music's key/notes.
 * Uses the isolated transit-preview player (never touches the chamber player).
 */

import { useState, useCallback, useEffect } from 'react'
import type { ProtocolOutput } from '@/types'
import { hexToRgba } from '@/lib/utils'
import {
  planTransitAudio, playTransitPreview, stopTransitPreview, seedFromString, STATE_MAP,
} from '@/lib/transitAudio'

interface SoundPreviewButtonProps {
  protocol: ProtocolOutput
  accentColor: string
}

export default function SoundPreviewButton({
  protocol,
  accentColor,
}: SoundPreviewButtonProps) {
  const [state, setState] = useState<'idle' | 'playing'>('idle')

  useEffect(() => () => { stopTransitPreview() }, [])

  const handleClick = useCallback(() => {
    if (state === 'playing') {
      stopTransitPreview()
      setState('idle')
      return
    }
    const primary = protocol.signalHierarchy?.primary
    const planet = primary?.planet ?? protocol.diagnostic?.dominantPlanet ?? 'Sun'
    const plan = planTransitAudio({
      trackPlanet: planet,
      state: STATE_MAP[primary?.state ?? 'balanced'] ?? 'nat',
      toneHz: 0,
      tonePlanet: planet,
      seed: seedFromString(`${planet}|rx-preview`),
    })
    if (!plan.hasTrack) return   // env-gated: no music, no preview
    setState('playing')
    playTransitPreview(plan, 8)
    setTimeout(() => setState('idle'), 8000)
  }, [state, protocol])

  const label = state === 'playing' ? '■ Stop preview' : '▶ Preview music'

  return (
    <button
      onClick={handleClick}
      className="font-rajdhani text-[11px] tracking-[0.15em] uppercase transition-all duration-200"
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        border: `1px solid ${state === 'playing' ? accentColor : 'rgba(255,255,255,0.12)'}`,
        background: state === 'playing' ? hexToRgba(accentColor, 0.15) : 'rgba(255,255,255,0.05)',
        color: state === 'playing' ? accentColor : 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
