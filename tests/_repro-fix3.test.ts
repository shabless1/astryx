/**
 * v4.1 Fix 3 REPRO (manual) — trace every track key the chamber requests
 * for the Smoke Test chart (b. 1990-01-15 15:42, New York) through the same
 * resolution chain SoundEngineController uses, and HEAD-check each URL
 * against the live public bucket. Prints a table; fails on any 404.
 *
 * MANUAL ONLY (needs the local dev server + network):
 *   $env:ASTRYX_MANUAL_REPRO='1'; npx vitest run tests/_repro-fix3.test.ts
 * Skipped in the build pipeline.
 */

import { describe, it, expect, vi } from 'vitest'

const MANUAL = process.env.ASTRYX_MANUAL_REPRO === '1'
import { runEngine } from '@/lib/engine'
import { generateChamberDNA } from '@/lib/chamber/ChamberDNAEngine'
import { buildForkSequence } from '@/lib/chamber/forkRite'
import { getDurationPreset } from '@/lib/chamber/durationPresets'
import { resolveTierTrack, versionsFor, buildTrackUrl } from '@/lib/astryxAudioLibrary'
import type { IntakeData } from '@/types'

const BASE = 'https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev'
process.env.NEXT_PUBLIC_AUDIO_BASE_URL = BASE

const intake: IntakeData = {
  name: 'Smoke Test',
  birthDate: '1990-01-15',
  birthTime: '15:42',
  birthLocation: 'New York, NY, USA',
  symptoms: ['chronic tension'],
  emotionalState: ['heavy', 'blocked'],
  intention: ['Grounding'],
  narrative: 'Chronic tension and restriction in my body for months. Everything feels stiff, blocked, heavy — my shoulders and back are rigid and it will not release.',
  mode: 'user',
  resourcedPlanets: [],
  bodyMapType: 'female',
}
const coords = { lat: 40.7128, lon: -74.006, tzOffset: -5 }

describe.runIf(MANUAL)('fix3 repro — chamber track resolution for the Smoke Test chart', () => {
  it('every phase resolves a live URL', async () => {
    // real chart from the local dev server
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', (url: any, init?: any) =>
      realFetch(String(url).startsWith('/') ? `http://localhost:3000${url}` : url, init))

    const protocol = await runEngine(intake, coords)
    const dna = generateChamberDNA({
      protocol,
      birthData: { birthDate: intake.birthDate, birthTime: intake.birthTime, birthLatitude: coords.lat, birthLongitude: coords.lon },
      polarity: protocol.dominantPolarity,
    })
    const container = getDurationPreset('15_PERSONAL')
    const steps = buildForkSequence({
      hierarchy: protocol.signalHierarchy,
      polarity: protocol.dominantPolarity,
      polarityResults: protocol.polarityResults,
      intentionPlanet: protocol.intentionPlanet,
      architecture: container.architecture,
      durationSec: container.durationSec,
      forkCount: container.forkCount,
      tier: 'individual',
    })

    console.log('signalHierarchy primary:', protocol.signalHierarchy?.primary)
    console.log('tierStates:', dna.tierStates, 'seed:', dna.seed, 'primary:', dna.primaryPlanet)

    // replicate SessionScreen + SoundEngineController selection state
    let lastFork: string | undefined
    const visits: Record<string, number> = {}
    const skip: Record<string, number> = {}
    let lastKey = ''
    const rows: string[] = []
    const misses: string[] = []

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i]
      if (s.fork) lastFork = s.planet
      const currentForkPlanet = lastFork ?? dna.primaryPlanet
      const isLast = i === steps.length - 1
      const isClosing = s.role === 'earthClose' || s.role === 'silentIntegration' ||
        (s.role === 'integration' && isLast) || (s.role === 'breathwork' && isLast)
      const audioPlanet = i === 0 ? 'earthday' : isClosing ? 'earthyear' : currentForkPlanet

      const polState =
        audioPlanet === dna.primaryPlanet ? dna.tierStates?.primary
        : audioPlanet === dna.secondaryPlanet ? dna.tierStates?.secondary
        : audioPlanet === dna.tertiaryPlanet ? dna.tierStates?.tertiary
        : 'balanced'

      const def = resolveTierTrack(audioPlanet, polState as any, dna.seed ?? 0)
      const folderState = def?.state ?? 'nat'
      const versions = versionsFor(audioPlanet, folderState)
      const key = `${audioPlanet.toLowerCase()}/${folderState}`
      if (key !== lastKey) { lastKey = key; visits[key] = (visits[key] ?? -1) + 1 }
      const isEarth = audioPlanet.toLowerCase().startsWith('earth')
      const base = isEarth ? 0 : (def ? Math.max(0, versions.indexOf(def.filename)) : 0)
      const rot = (visits[key] ?? 0) + (skip[key] ?? 0)
      const file = versions.length
        ? versions[(((base + rot) % versions.length) + versions.length) % versions.length]
        : def?.filename
      const url = file ? buildTrackUrl(audioPlanet, folderState, file) : null

      let status = 'NO URL'
      if (url) {
        const res = await realFetch(url, { method: 'HEAD' })
        status = String(res.status)
        if (!res.ok) misses.push(`${s.role} phase ${i + 1}: ${key}/${file} → ${status}`)
      } else {
        misses.push(`${s.role} phase ${i + 1}: ${key} → NO FILE RESOLVED (versions=${versions.length}, def=${def?.filename ?? 'null'})`)
      }
      rows.push(`phase ${i + 1}/${steps.length} [${s.role}] planet=${s.planet} audio=${audioPlanet} state=${folderState} file=${file ?? '∅'} → ${status}`)
    }

    console.log(rows.join('\n'))
    if (misses.length) console.log('MISSES:\n' + misses.join('\n'))
    expect(misses).toEqual([])
  }, 120000)
})
