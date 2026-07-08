'use client'

/**
 * useAstryxVoice — the Astryx brand voice, client side (Directive v4.0 · Fix 6).
 *
 * speak(text, id?) fetches /api/speak and plays through ONE shared
 * HTMLAudioElement — never two voices at once; calling speak() again stops the
 * current one. On any non-200 (preview deployments have no OpenAI key; guests
 * aren't entitled) it falls back to window.speechSynthesis so the speaker
 * button never dead-ends.
 *
 * NEVER auto-play this inside a Resonance Chamber session — the chamber's
 * tone/music stack owns that audio space. This hook is strictly
 * user-gesture-triggered (speaker buttons).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'

// ONE audio element for the whole app (module scope — the brand voice is a
// single throat). Both playback paths route through stopCurrent().
let sharedAudio: HTMLAudioElement | null = null
let currentStop: (() => void) | null = null

// Astryx is feminine — pick a female system voice for the speechSynthesis
// fallback (guests / preview / no OpenAI key) instead of the OS default, which
// is often a male robotic voice. Prefers known female voices; English first.
function pickFemaleVoice(): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis?.getVoices?.() ?? []
    if (!voices.length) return null
    const female = /female|samantha|zira|victoria|karen|moira|tessa|fiona|serena|allison|susan|catherine|nova|aria|jenny|libby|sonia|natasha/i
    const male = /male|david|mark|daniel|alex|fred|george|james|guy|ryan/i
    const en = voices.filter((v) => /^en/i.test(v.lang))
    const pool = en.length ? en : voices
    return (
      pool.find((v) => female.test(v.name)) ||
      pool.find((v) => !male.test(v.name)) ||
      pool[0] ||
      null
    )
  } catch {
    return null
  }
}

function stopCurrent() {
  if (currentStop) {
    const s = currentStop
    currentStop = null
    s()
  }
}

export function useAstryxVoice() {
  // speakingId lets a list of messages show which one is being read.
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const stop = useCallback(() => {
    stopCurrent()
    if (mounted.current) setSpeakingId(null)
  }, [])

  const speak = useCallback(async (text: string, id: string = 'default') => {
    const clean = (text ?? '').trim()
    if (!clean) return
    // Toggling the same message stops it.
    stopCurrent()
    setSpeakingId(id)
    const done = () => { if (mounted.current) setSpeakingId((cur) => (cur === id ? null : cur)) }

    // The user's chosen feminine voice (Settings). Read at call time so a fresh
    // pick takes effect immediately (e.g. the Settings preview button).
    const voice = useAppStore.getState().settings?.astryxVoice ?? 'coral'

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean.slice(0, 4096), voice }),
      })
      if (!res.ok) throw new Error(`speak ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (!sharedAudio) sharedAudio = new Audio()
      const audio = sharedAudio
      audio.src = url
      currentStop = () => {
        audio.pause()
        audio.removeAttribute('src')
        URL.revokeObjectURL(url)
        done()
      }
      audio.onended = () => { URL.revokeObjectURL(url); currentStop = null; done() }
      audio.onerror = () => { URL.revokeObjectURL(url); currentStop = null; done() }
      await audio.play()
    } catch {
      // Fallback — browser speech synthesis (never dead-end the button).
      try {
        const synth = window.speechSynthesis
        if (!synth) { done(); return }
        synth.cancel()
        const utter = new SpeechSynthesisUtterance(clean.slice(0, 4096))
        utter.rate = 0.95
        // Astryx is feminine — override the OS default (often a male robot).
        const fem = pickFemaleVoice()
        if (fem) { utter.voice = fem; utter.lang = fem.lang }
        utter.pitch = 1.05
        utter.onend = () => { currentStop = null; done() }
        utter.onerror = () => { currentStop = null; done() }
        currentStop = () => { synth.cancel(); done() }
        synth.speak(utter)
      } catch {
        done()
      }
    }
  }, [])

  return { speak, stop, speakingId }
}
