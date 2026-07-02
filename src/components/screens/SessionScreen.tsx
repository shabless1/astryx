'use client'

/**
 * ASTRYX Session Screen — v2.0 (Directive FIX 2)
 *
 * The crown user experience. A 10-step guided multi-sensory protocol
 * unique to each client's chart + active transits + reported symptoms.
 *
 * 10 STEPS (per Directive PLAY D §D1):
 *   1. PREPARE SPACE       — direction by element, lighting, scent
 *   2. PREPARE TEA         — herbal blend from protocol, steep + intention
 *   3. CRYSTAL ACTIVATION  — crystal + tuning fork activation + placement
 *   4–8. TUNING FORK SEQ   — dominant planet forks + grounding trio
 *   9. BREATH + GEOMETRY   — element-based breath + sacred geometry visualization
 *   10. CLOSE + GROUND     — Earth Day fork + symptom check-in + session save
 *
 * MODES:
 *   • Individual user: visual canvas + sound + 10 steps + micro-disclaimer
 *   • Practitioner + activeClientId: same + fork-detail clinical depth +
 *     Post-Session SOAP modal that writes a ClientSession to the store
 *
 * ELEMENT-BASED BREATH (Step 9):
 *   Earth (Sat/Tau/Vir/Cap) → 4-count box breath
 *   Fire  (Sun/Mar/Ari/Leo/Sag) → Breath of fire (rapid nasal)
 *   Water (Moo/Can/Sco/Pis) → 4-7-8 extended exhale
 *   Air   (Mer/Gem/Lib/Aqu) → Alternate nostril (guided text)
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import type {
  ProtocolOutput, SacredFork, CrystalExpanded, SacredBotanical,
  SessionSummarySnapshot,
} from '@/types'
import { signalWord } from '@/lib/signalCopy'
import VisualEngineCanvas from '@/components/engine/VisualEngineCanvas'
import SoundEngineController from '@/components/engine/SoundEngineController'
import ChamberBodyMap from '@/components/engine/ChamberBodyMap'
import { reflexPointsFor, type ReflexPoint } from '@/lib/ReflexEngine'
import ChamberVisualModeToggle, { type ChamberVisualMode } from '@/components/engine/ChamberVisualModeToggle'
import ColorTherapyView from '@/components/engine/ColorTherapyView'
import MandalaChamberView from '@/components/engine/MandalaChamberView'
import ChamberVisualBoundary from '@/components/engine/ChamberVisualBoundary'
import { generateColorTherapy } from '@/lib/visual/ColorTherapyEngine'
import { generateKaleidoscopeMandala } from '@/lib/visual/KaleidoscopeMandalaEngine'
import { getPhaseForProgress } from '@/lib/protocol/sessionPhaseMap'
import type { BodyMapType } from '@/lib/bodyMapPlacement'
import { resolveForkPlacement, type ForkPlacement } from '@/lib/BodyPlacementEngine'
import { hexToRgb, hexToRgba } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { getDurationPreset } from '@/lib/chamber/durationPresets'
import { generateChamberDNA } from '@/lib/chamber/ChamberDNAEngine'
import { buildForkSequence, buildFullSpectrumSequence, sequenceStepAt, forkSequenceDisplay, type SequenceStep } from '@/lib/chamber/forkRite'
import sacredTonesData from '@/data/sacredTones_nervousSystem.json'
import scentsData from '@/data/scents.json'
import { MICRO_DISCLAIMER, lintForBannedPhrases } from '@/lib/compliance'

// ─── ELEMENT CLASSIFICATION ──────────────────────────────────

const SIGN_ELEMENT: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
}

const ELEMENT_BREATH: Record<string, {
  name: string
  cycle: { label: string; secs: number }[]
  guidance: string
}> = {
  Earth: {
    name: '4-Count Box Breath',
    cycle: [
      { label: 'Inhale', secs: 4 },
      { label: 'Hold',   secs: 4 },
      { label: 'Exhale', secs: 4 },
      { label: 'Hold',   secs: 4 },
    ],
    guidance: 'Equal sides of a square. Steady. Grounded. Hold the structure.',
  },
  Fire: {
    name: 'Breath of Fire',
    cycle: [
      { label: 'Pulse Out', secs: 1 },
      { label: 'Pulse In',  secs: 1 },
    ],
    guidance: 'Rapid, rhythmic nasal breath. Pump from the belly. Build heat. (Skip if pregnant or hypertensive — practitioner judgment.)',
  },
  Water: {
    name: '4-7-8 Extended Exhale',
    cycle: [
      { label: 'Inhale', secs: 4 },
      { label: 'Hold',   secs: 7 },
      { label: 'Exhale', secs: 8 },
    ],
    guidance: 'Inhale 4, hold 7, exhale 8. The long exhale activates parasympathetic.',
  },
  Air: {
    name: 'Alternate Nostril',
    cycle: [
      { label: 'L Inhale',  secs: 4 },
      { label: 'Hold',      secs: 4 },
      { label: 'R Exhale',  secs: 6 },
      { label: 'R Inhale',  secs: 4 },
      { label: 'Hold',      secs: 4 },
      { label: 'L Exhale',  secs: 6 },
    ],
    guidance: 'Close right nostril, inhale left. Hold. Close left, exhale right. Reverse. Balance both hemispheres.',
  },
}

const ELEMENT_DIRECTION: Record<string, string> = {
  Fire: 'South — face the sun',
  Water: 'West — face setting',
  Air: 'East — face rising',
  Earth: 'North — face stillness',
}

const PLANET_TO_FORK: Record<string, string> = {
  Sun: 'Sun', Moon: 'Full Moon', Mercury: 'Mercury', Venus: 'Venus',
  Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
  Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
}
const GROUNDING_FORK_NAMES = ['Earth Day', 'Earth Year', 'Platonic Year']

function holdDurationFor(vagusStrength: string): string {
  const s = (vagusStrength || '').toLowerCase()
  if (s.includes('primary') || s.includes('direct')) return '45–60 seconds'
  if (s.includes('high'))                            return '30–45 seconds'
  if (s.includes('medium'))                          return '20–30 seconds'
  return '15–20 seconds'
}

function vagusBadgeColor(vagusStrength: string): { bg: string; fg: string; label: string } {
  const s = (vagusStrength || '').toLowerCase()
  if (s.includes('direct') && s.includes('primary')) return { bg: 'rgba(245,158,11,0.22)', fg: '#F59E0B', label: 'DIRECT-PRIMARY' }
  if (s.includes('primary'))                         return { bg: 'rgba(245,158,11,0.18)', fg: '#F59E0B', label: 'PRIMARY' }
  if (s.includes('high'))                            return { bg: 'rgba(217,119,6,0.18)',  fg: '#D97706', label: 'HIGH' }
  if (s.includes('medium'))                          return { bg: 'rgba(148,163,184,0.18)', fg: '#94A3B8', label: 'MEDIUM' }
  return { bg: 'rgba(100,116,139,0.15)', fg: '#64748B', label: vagusStrength?.toUpperCase() || 'LOW' }
}

// ─── PROPS ───────────────────────────────────────────────────

interface SessionScreenProps {
  protocol: ProtocolOutput
  accentColor: string
  sessionTime: number
  breathGuide: 'active' | 'passive' | 'off'
  /** Abandon — user bails before completing. Returns to the prior surface. */
  onExit: () => void
  /** Completion — the session finished. Hands the "During" snapshot forward to
   *  the post-session page (never backward to results). */
  onComplete: (snapshot: SessionSummarySnapshot) => void
  /** Open the global Ask Astryx companion (the chamber has no NavBar, so the
   *  launcher lives in this screen's own top bar). */
  onAskAstryx?: () => void
}

// 10-step types
type StepKey = 'space' | 'tea' | 'crystal' | 'forks' | 'breath' | 'close'

interface Step {
  num: number
  key: StepKey
  title: string
  subtitle: string
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function SessionScreen({
  protocol, accentColor, sessionTime, breathGuide, onExit, onComplete, onAskAstryx,
}: SessionScreenProps) {
  const rgb = hexToRgb(accentColor)

  const mode             = useAppStore((s) => s.mode)
  const activeClientId   = useAppStore((s) => s.activeClientId)
  const getActiveClient  = useAppStore((s) => s.getActiveClient)
  const chamberDurationKey = useAppStore((s) => s.chamberDurationKey)
  const intakeData         = useAppStore((s) => s.intakeData)
  const birthCoords        = useAppStore((s) => s.birthCoords)
  const chartData          = useAppStore((s) => s.chartData)

  // Fix 5 — resolve the selected SESSION CONTAINER (15 / 30 / 60) + its fixed
  // phase architecture. durationSec comes from the container.
  const chamberContainer   = getDurationPreset(chamberDurationKey)
  const chamberDurationSec = chamberContainer.durationSec

  // Chamber Deploy 2 — build DNA + HarmonicPlan once per session
  const chamberDNA = useMemo(
    () => generateChamberDNA({
      protocol,
      birthData: {
        birthDate: intakeData.birthDate,
        birthTime: intakeData.birthTime || undefined,
        birthLatitude: birthCoords?.lat,
        birthLongitude: birthCoords?.lon,
      },
      polarity: protocol.dominantPolarity,
    }),
    [protocol, intakeData.birthDate, intakeData.birthTime, birthCoords?.lat, birthCoords?.lon],
  )
  const isPractitionerSession = mode === 'practitioner' && !!activeClientId
  const activeClient = isPractitionerSession ? getActiveClient() : null

  // ── The subject planet = the ONE source of truth (B.1 invariant) ──
  const dominantPlanet = protocol.signalHierarchy?.primary.planet
    ?? protocol.dominant_pattern.planets[0] ?? 'Saturn'
  const dominantSign   = protocol.dominant_pattern.signs[0] ?? 'Capricorn'
  const element        = SIGN_ELEMENT[dominantSign] ?? 'Earth'
  // Fix 9 — breath follows the CORRECTIVE direction, never re-activates an
  // already-activated signal. Breath of Fire (activating) is reserved for
  // genuinely under-active / depleted states that need rousing; any elevated /
  // amplified / overactivated signal gets the calming 4-7-8 instead. This is the
  // "no Breath of Fire on an anxious/overstimulated chamber" rule.
  const primaryStateRaw = protocol.signalHierarchy?.primary.state
    ?? protocol.dominantPolarity?.dominant_state ?? 'balanced'
  const correctiveVerbs = (protocol.dominantPolarity?.protocol?.corrective_direction ?? [])
    .join(' ').toLowerCase()
  const needsActivating = primaryStateRaw === 'deficiency'
    || /\b(warm|activate|stimulate|uplift|nourish|build|energi|rouse)\b/.test(correctiveVerbs)
  let   breathPattern  = ELEMENT_BREATH[element]
  if (breathPattern.name === 'Breath of Fire' && !needsActivating) {
    breathPattern = ELEMENT_BREATH.Water   // calming 4-7-8 long exhale
  }
  const direction      = ELEMENT_DIRECTION[element]

  // ── Directive H.1 — THE FORK SEQUENCE ────────────────────────────
  // The session is a planetary-fork tuning sequence: grounding OPEN → supporting
  // passes → the MAIN 3 (signalHierarchy) held longest → CLOSE on the primary
  // with the app-played Earth tone. Timeline-driven and CARRIED — the user
  // follows; they don't operate a wizard. Deterministic.
  const allForks = sacredTonesData as SacredFork[]
  const earthDayFork = allForks.find((f) => f.planet === 'Earth Day')

  const forkSetTypeStored = useAppStore((s) => s.forkSetType)
  const setForkSetType    = useAppStore((s) => s.setForkSetType)

  // Mandala renderer preference — still passed to the mandala views (renderer
  // selection is automatic). The user-facing Auto/3D/SVG pill was removed.
  const mandalaRenderer    = useAppStore((s) => s.mandalaRenderer)
  // H.1 — application guidance keys to the SET the user owns. Default by tier.
  const forkSetType: 'unweighted' | 'weighted' =
    forkSetTypeStored ?? (mode === 'practitioner' ? 'weighted' : 'unweighted')

  // Directive J.3 — branch the builder on container type. FULL_SPECTRUM runs the
  // fixed 10-fork feet-up attunement (no hierarchy, NAT tracks); the corrective
  // containers run the composition engine (distinct forks per phase, J.6/J.7).
  const isFullSpectrum = chamberContainer.fullSpectrum === true
  const sequenceSteps: SequenceStep[] = useMemo(
    () => isFullSpectrum
      ? buildFullSpectrumSequence({ durationSec: chamberDurationSec })
      : buildForkSequence({
          hierarchy:        protocol.signalHierarchy,
          polarity:         protocol.dominantPolarity,
          polarityResults:  protocol.polarityResults,     // per-candidate never-amplify + resourced
          intentionPlanet:  protocol.intentionPlanet,     // J.5 — guaranteed intention fork
          architecture:     chamberContainer.architecture,
          durationSec:      chamberDurationSec,
          forkCount:        chamberContainer.forkCount,
          tier:             mode === 'practitioner' ? 'practitioner' : 'individual',
        }),
    [isFullSpectrum, protocol.signalHierarchy, protocol.dominantPolarity, protocol.polarityResults, protocol.intentionPlanet, chamberContainer, mode, chamberDurationSec],
  )

  // Botanical + crystal from sacred layer (close step references)
  const botanical = protocol.sacredLayer?.botanical as SacredBotanical | undefined
  const crystal   = protocol.sacredLayer?.crystal as CrystalExpanded | undefined
  // A1.3 — LOCAL + REFLEX + planet-anatomy points for the fork body map (from the
  // Reflex engine). Empty when the reading carries no body-zone signals.
  const reflexPoints: ReflexPoint[] = useMemo(
    () => reflexPointsFor(protocol.reflexPlacements ?? []),
    [protocol.reflexPlacements],
  )
  void botanical

  // ── Carried flow: the timeline drives the step; the user can linger ──
  // effectiveTime = sessionTime − pausedTotal + skew (skip jumps forward,
  // extend rewinds within the step). Pause freezes the session (H.2 pacing).
  const [paused, setPaused] = useState(false)
  const [skewSec, setSkewSec] = useState(0)
  const [pinned, setPinned] = useState<number | null>(null)
  const pausedTotalRef = useRef(0)
  const prevTimeRef = useRef(sessionTime)
  useEffect(() => {
    const delta = sessionTime - prevTimeRef.current
    prevTimeRef.current = sessionTime
    if (paused && delta > 0) pausedTotalRef.current += delta
  }, [sessionTime, paused])
  const effectiveTime = Math.max(0, sessionTime - pausedTotalRef.current + skewSec)

  const timelineIdx = sequenceStepAt(sequenceSteps, effectiveTime)
  const stepIdx = pinned ?? timelineIdx
  const current = sequenceSteps[stepIdx]
  const isLast = stepIdx === sequenceSteps.length - 1
  // Fix 5 — the closing phases use the grounding/silence close card; all other
  // phases (ground, primary, secondary, tertiary, bodyPlacement, primaryReturn)
  // use the fork/Earth step card.
  const isClosingStep = !!current &&
    (current.role === 'earthClose' || current.role === 'silentIntegration' ||
     (current.role === 'integration' && isLast) ||
     // J.3 — the Full-Spectrum CLOSING breath is the last step → plays Earth Year.
     (current.role === 'breathwork' && isLast))
  // J.3 — breathwork phases (Full-Spectrum bookends) render the breath guide, not
  // a fork card, and carry no fork-placement dot.
  const isBreathwork = !!current && current.role === 'breathwork'
  // SHA tweak — grounding steps (Earth Day open / Earth Year close / any Earth Om
  // · silence · breath beat) carry NO fork, so they show ONLY breathing &
  // grounding: those steps render the grounding/breath card (no body map), so no
  // fork placement can leak onto them.

  // ── Directive I.3.1/I.4 — DEFAULT vs CUSTOMIZE song choice (PERSISTED) ──
  // Default: the session picks the deterministic song per aspect.
  // Customize: the user picks per planet+state; the choice lives in the store
  // (keyed `{planet}/{folderState}`) so it survives across sessions.
  // I-FIX FIX 1/2: SessionScreen NO LONGER drives the player. It just tells the
  // controller (the single audio owner) which fork is active; the controller
  // resolves + plays ONLY after the user presses Play.
  const audioMode      = useAppStore((s) => s.chamberAudioMode)
  const setAudioMode   = useAppStore((s) => s.setChamberAudioMode)
  const songOverrides  = useAppStore((s) => s.songOverrides)
  const setSongOverride   = useAppStore((s) => s.setSongOverride)
  const clearSongOverrides = useAppStore((s) => s.clearSongOverrides)
  const handleSelectVersion = (pl: string, st: string, filename: string) =>
    setSongOverride(pl, st, filename)

  // I-FIX FIX 4 — the player follows the fork. Non-sweep steps set the active
  // planet; a sweep keeps the previous fork's music flowing (no single planet).
  const lastForkPlanetRef = useRef<string | undefined>(undefined)
  // Music follows the FORK: only real-fork phases set the active planet. Earth Om
  // + Silence phases keep the previous planet's music flowing (no track of their own).
  if (current && current.fork) lastForkPlanetRef.current = current.planet
  const currentForkPlanet = lastForkPlanetRef.current ?? chamberDNA.primaryPlanet

  // Earth grounding bookends (SHA lock-in): the FIRST chamber phase always plays
  // an Earth Day song; the closing phase always plays an Earth Year song. This is
  // AUDIO ONLY — the on-screen visual planet/mandala is unchanged.
  const audioForkPlanet =
    stepIdx === 0 ? 'earthday'
    : isClosingStep ? 'earthyear'
    : currentForkPlanet

  // Body Placement Intelligence — ranked placement (symptom → sign → planet →
  // chakra → state) for a fork planet, from the chart + polarity. Not planet-alone.
  const resolvePlacement = (planet: string): ForkPlacement => {
    const pos = (chartData?.planets ?? []).find((p: any) => p.planet === planet)
    const pol = (protocol.polarityResults ?? []).find((r) => r.planet === planet)
    return resolveForkPlacement({
      planet,
      sign: pos?.sign,
      natalSign: pos?.sign,   // K.1 — the planet's natal sign drives the natal orb
      house: pos?.house,
      engineState: pol?.dominant_state,
      reportedSymptoms: intakeData.symptoms,
      correctiveDirection: pol?.protocol?.corrective_direction,
      bodyMapType: intakeData.bodyMapType ?? 'female',
    })
  }

  // Hold countdown + strike cue (within the active timeline step)
  const inStep   = Math.max(0, effectiveTime - (current?.startSec ?? 0))
  const remainSec = Math.max(0, (current?.startSec ?? 0) + (current?.holdSec ?? 0) - effectiveTime)
  // v3D — 0..1 progress through the active phase; drives the cymatic mandala's
  // energized→rest settle so the visual completes as the phase completes.
  const phaseProgress = current?.holdSec ? Math.min(1, inStep / current.holdSec) : 0
  const cue = pinned !== null ? 'Lingering — resume when ready'
    : paused ? 'Paused'
    : current?.planet === 'Silence' ? 'Rest in the silence'
    : current?.planet === 'Earth' ? 'Ground with the Earth tone'
    : inStep < 5 ? 'Strike now'
    : remainSec < 6 ? 'Release… next phase'
    : 'Hold'

  // Pacing controls (H.2 — practitioner)
  const handleSkip = () => { setPinned(null); setSkewSec((s) => s + remainSec) }
  const handleExtend = () => setSkewSec((s) => s - Math.min(60, inStep))

  // ── Phase 3 — Chamber visual views (Body | Color | Mandala | Combined) ──
  // visualMode is LOCAL state only. Switching it never touches sessionTime,
  // chamberRunning, the session timeline, or the SoundEngineController (those are
  // rendered/owned outside this toggle), so audio + timer + phase never reset.
  const [visualMode, setVisualMode] = useState<ChamberVisualMode>('body')

  // The bottom controls stack (toggle + music player + nav + slider) has a
  // variable height — practitioner mode adds a pacing row, the music player
  // expands/collapses, and the phase slider is conditional. We measure it and
  // reserve exactly that much below the body step card so the breath
  // instructions never sit under the visual-mode toggle. (Fix: SHA 2026-06-28
  // — toggle was overlapping the breath text in the Chamber.)
  const bottomBarRef = useRef<HTMLDivElement | null>(null)
  const [bottomBarH, setBottomBarH] = useState(210)
  useEffect(() => {
    const el = bottomBarRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setBottomBarH(el.offsetHeight))
    ro.observe(el)
    setBottomBarH(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  // The visual subject follows the ACTIVE fork's planet (the same planet the
  // music is on), with that planet's polarity state + chart-ranked placement.
  const visualPlanet = currentForkPlanet
  const visualPolarity = (protocol.polarityResults ?? []).find((r) => r.planet === visualPlanet)
  const visualStateRaw =
    visualPolarity?.dominant_state ??
    protocol.signalHierarchy?.primary.state ??
    protocol.dominantPolarity?.dominant_state ??
    'balanced'
  const visualSignalWord = signalWord(visualPlanet, visualStateRaw)
  const visualPlacement = resolvePlacement(visualPlanet)
  const visualChakra = visualPlacement.chakraOverlay?.[0]
  const visualCorrective = visualPolarity?.protocol?.corrective_direction ?? []
  const activeForkLabel = `${visualPlanet === 'Full Moon' ? 'Moon' : visualPlanet} Fork`

  // ── v4.1 FIX 2 — ONE source of truth for "where am I": the active step. ──
  // The "Now" header, the n/N counter, and the phase title all derive from
  // `current` (stepIdx). The old header used the audio fallback planet, which
  // showed e.g. "Mercury Fork" during Opening Ground (no fork on that step).
  const nowLabel = !current ? activeForkLabel
    : current.fork ? `${current.planet === 'Full Moon' ? 'Moon' : current.planet} Fork`
    : current.planet === 'Earth' ? 'Earth Tone'
    : current.planet === 'Silence' ? 'Silence'
    : current.phaseLabel

  // Persist the live phase pointer — this is what the rehydrate override turns
  // into the Dashboard's Resume card, so Resume reopens THIS exact phase.
  const setChamberPhase = useAppStore((s) => s.setChamberPhase)
  useEffect(() => {
    if (!current) return
    setChamberPhase({
      index:    stepIdx,
      id:       current.role,
      label:    stepTitle(current),
      startSec: current.startSec,
      count:    sequenceSteps.length,
    })
  }, [stepIdx, current, sequenceSteps.length, setChamberPhase])
  // Chamber phase (entry→integration) recomputes from the timer — cheap; the
  // engines below are memoised on phase id, not raw seconds, so they recompute
  // only when the phase or active planet actually changes.
  const chamberPhaseId = getPhaseForProgress(sessionTime, chamberDurationSec).phase.id

  const colorTherapy = useMemo(
    () => generateColorTherapy({
      planet: visualPlanet,
      signalState: visualSignalWord,
      signalStateRaw: visualStateRaw,
      correctiveDirection: visualCorrective,
      activeFork: activeForkLabel,
      chamberPhase: chamberPhaseId,
      element,
      chakraOverlay: visualChakra,
      bodyPlacement: visualPlacement.primaryLabel,
      breathPattern,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visualPlanet, visualStateRaw, visualSignalWord, chamberPhaseId, element, visualChakra, visualPlacement.primaryLabel],
  )
  const mandala = useMemo(
    () => generateKaleidoscopeMandala({
      planet: visualPlanet,
      signalState: visualSignalWord,
      signalStateRaw: visualStateRaw,
      correctiveDirection: visualCorrective,
      activeFork: activeForkLabel,
      chamberPhase: chamberPhaseId,
      chakraOverlay: visualChakra,
      breathPattern,
      visualMode,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visualPlanet, visualStateRaw, visualSignalWord, chamberPhaseId, visualChakra, visualMode],
  )

  // ── Complete the session → build the "During" snapshot and hand it forward ──
  // Phase 1 (Chamber loop): completion no longer routes backward to Results.
  // It assembles a SessionSummarySnapshot from the chart + sequence + protocol and
  // calls onComplete(), which routes to the post-session check-in. All "After"
  // data (questionnaire, continuation, client-session save) now lives there.
  const handleComplete = () => {
    const dominantState =
      protocol.signalHierarchy?.primary.state ??
      protocol.dominantPolarity?.dominant_state ??
      'balanced'
    const signalStateWord = signalWord(dominantPlanet, dominantState)

    const correctiveDir = protocol.dominantPolarity?.protocol?.corrective_direction ?? []
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const correctiveDirection = dominantState !== 'balanced' && correctiveDir.length
      ? correctiveDir.slice(0, 3).map(cap).join('. ') + '.'
      : 'Draw on this steady signal to support the rest of your field.'

    // Fork planets used, in sequence order (deduped) + the Earth close tone.
    const forkPlanetsUsed = Array.from(new Set(
      sequenceSteps.filter((s) => s.fork).map((s) => s.fork!.planet),
    ))
    if (earthDayFork && !forkPlanetsUsed.includes(earthDayFork.planet)) {
      forkPlanetsUsed.push(earthDayFork.planet)
    }

    // Body placements touched — one ranked label per fork planet.
    const bodyPlacements = Array.from(new Set(
      forkPlanetsUsed.map((p) => resolvePlacement(p).primaryLabel).filter(Boolean),
    ))
    const primaryPlacement = resolvePlacement(dominantPlanet)

    const rx = protocol.prescriptions?.[0]
    const colorProtocol =
      rx?.fiveSenses.sight.colors?.[0] ??
      protocol.plan?.sight?.colors?.[0] ??
      protocol.plan?.sight?.primary_colors?.[0] ??
      accentColor

    const chamberFocus = dominantState !== 'balanced'
      ? `A ${element} session easing ${dominantPlanet} from ${signalStateWord.toLowerCase()} toward balance.`
      : `A ${element} session drawing on a steady ${dominantPlanet} signal.`

    const snapshot: SessionSummarySnapshot = {
      planetaryCarrier:    dominantPlanet,
      signalState:         signalStateWord,
      signalStateRaw:      dominantState,
      correctiveDirection,
      selectedSessionContainer: chamberDurationKey,
      intention:           intakeData.intention ?? [],
      // v4 FIX 2 — canonical sequence label (same helper the Results label uses).
      forkSequence:        forkSequenceDisplay(sequenceSteps),
      bodyPlacements,
      primaryBodyPlacement: primaryPlacement.primaryLabel,
      sessionDurationSec:  sessionTime,
      chamberFocus,
      element,
      chakraOverlay:       primaryPlacement.chakraOverlay?.[0],
      tasteTea:            rx?.fiveSenses.taste.tea ?? botanical?.sacredBotanical,
      tasteIngredients:    rx?.fiveSenses.taste.ingredients ?? protocol.plan?.taste?.ingredients ?? [],
      breathProtocol:      breathPattern.name,
      colorProtocol,
      preSessionSymptoms:  intakeData.symptoms ?? [],
      preSessionEmotional: intakeData.emotionalState ?? [],
      energyBefore:        intakeData.energyBefore,
      isPractitioner:      mode === 'practitioner',
      activeClientId:      isPractitionerSession ? activeClientId : null,
      forkPlanetsUsed,
      crystalsUsed:        crystal?.featuredCrystal ? [crystal.featuredCrystal] : [],
      accentColor,
      protocolSnapshot:    protocol,
    }
    onComplete(snapshot)
  }

  // ── Render ──
  return (
    <div className="fixed inset-0 z-50" style={{ background: '#020208' }}>

      {/* ── Chamber visual environment (Phase 3) — Body | Color | Mandala | Combined.
          The active view is the background; the top bar, progress, and bottom
          controls sit above it. Switching modes only changes THIS layer. ── */}
      {/* Patch 0.1 — a render fault in any single phase's visual must not
          white-screen the session. Keyed by the active planet so a faulted
          phase falls back to a calm field and the NEXT phase recovers. */}
      <ChamberVisualBoundary key={visualPlanet} planet={visualPlanet} accentColor={accentColor}>
      {visualMode === 'body' && (
        <>
          <div className="absolute inset-0">
            <VisualEngineCanvas
              protocol={protocol}
              accentColor={accentColor}
              sessionTime={sessionTime}
              totalDuration={chamberDurationSec}
              colorOverride={chamberDNA.applyCorrective ? {
                primary:   chamberDNA.colorDNA.primary,
                secondary: chamberDNA.colorDNA.secondary,
                regulator: chamberDNA.colorDNA.regulator,
              } : null}
            />
          </div>
          {/* Dim overlay for step-card readability (body mode only) */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(2,2,8,0.65) 100%)' }} />
        </>
      )}
      {visualMode === 'color' && (
        <ColorTherapyView
          color={colorTherapy}
          activeForkLabel={activeForkLabel}
          planet={visualPlanet}
          signalState={visualSignalWord}
          sessionTime={sessionTime}
          accentColor={accentColor}
        />
      )}
      {visualMode === 'mandala' && (
        <MandalaChamberView
          mandala={mandala}
          activeForkLabel={activeForkLabel}
          planet={visualPlanet}
          signalState={visualSignalWord}
          sessionTime={sessionTime}
          accentColor={accentColor}
          rendererOverride={mandalaRenderer}
          phaseProgress={phaseProgress}
        />
      )}
      </ChamberVisualBoundary>

      {/* J.3 — Breathwork bookend overlay (Full-Spectrum). Shows the breath guide
          in EVERY visual mode; no fork-placement dot (suppressed in the combined
          view above). Earth Day (open) / Earth Year (close) play underneath. */}
      {isBreathwork && current && (
        <div
          className="absolute inset-x-0 top-[150px] z-10 overflow-y-auto px-5"
          style={{ bottom: bottomBarH + 12 }}
        >
          <div className="max-w-md mx-auto" style={{ animation: 'slideInUp 350ms cubic-bezier(0.34, 1.56, 0.64, 1)' }} key={stepIdx}>
            <BreathworkCard
              title={isLast ? 'Breathe — sealing the session' : 'Breathe — settling the field'}
              subtitle={current.phaseLabel}
              pattern={breathPattern}
              accentColor={accentColor}
            />
          </div>
        </div>
      )}

      {/* Top bar — phase label + step indicator + exit.
          v5 — NO flex-wrap (wrapping piled the panels down onto the progress
          markers + breath line + body map on mobile). Single short row at every
          width; the step-indicator panel is desktop-only (redundant on mobile —
          the same info is in the bottom bar), so the bar stays clear of the
          fixed progress/card offsets below. */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-5 flex items-start justify-between gap-2 pointer-events-none">
        {/* Fix 6 — NO visible timer in either Individual or Practitioner. The
            user follows guided phases, not a clock. Internal timing still drives
            audio/breath/phase progression; it is simply never shown. */}
        <div className="pointer-events-auto min-w-0" style={topPanelStyle}>
          <div className="text-[10px] tracking-[0.3em] text-white/55 mb-0.5">RESONANCE CHAMBER</div>
          <div className="font-cinzel text-[15px] truncate" style={{ color: accentColor, lineHeight: 1.1 }}>
            {sessionTime > 0 ? `Now · ${nowLabel}` : 'Ready — press play'}
          </div>
        </div>

        {/* CENTER — view switcher + Ask Astryx, grouped. The toggle is the
            Body/Color/Mandala/Combined switcher; Ask Astryx sits immediately to
            its RIGHT (SHA 2026-06-28). As the middle child of this justify-between
            row, the pair sits centered in the empty band between the side panels. */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ChamberVisualModeToggle value={visualMode} onChange={setVisualMode} accentColor={accentColor} />
          {onAskAstryx && (
            <button
              onClick={onAskAstryx}
              aria-label="Ask Astryx"
              className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-full flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.92)} 0%, ${hexToRgba(accentColor, 0.55)} 100%)`,
                color: '#020208',
                boxShadow: `0 0 20px -6px ${hexToRgba(accentColor, 0.65)}`,
                cursor: 'pointer',
              }}
            >
              <span className="text-[13px] leading-none">✦</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold hidden sm:inline">Ask Astryx</span>
            </button>
          )}
        </div>

        {/* Right cluster — desktop step indicator + Exit. */}
        <div className="flex items-start gap-2 flex-shrink-0">
          {/* Step indicator — only on wide screens (≥lg), where there is room
              beside the centered toggle; redundant on smaller screens (the same
              info is in the bottom bar). */}
          <div className="hidden lg:block pointer-events-auto" style={{ ...topPanelStyle, border: `1px solid rgba(${rgb},0.3)` }}>
            <div className="text-[9px] tracking-[0.3em] text-white/55 uppercase">
              {isPractitionerSession && activeClient ? `Client · ${activeClient.name}` : 'Chamber Session'}
            </div>
            <div className="text-[11px] tracking-[0.15em] text-white/87 mt-0.5">
              {stepIdx + 1} / {sequenceSteps.length} · {stepTitle(current)}
            </div>
          </div>

          <button
            onClick={onExit}
            className="pointer-events-auto flex-shrink-0 font-rajdhani text-[11px] tracking-[0.2em] uppercase transition-colors hover:text-white"
            style={{ ...topPanelStyle, color: 'rgba(255,255,255,0.65)', cursor: 'pointer' }}
          >
            <span className="sm:hidden">Exit</span>
            <span className="hidden sm:inline">Exit Session</span>
          </button>
        </div>
      </div>

      {/* Session progress — PHASE-driven (fork markers), never a time clock.
          The fill reflects how far through the fork sequence the session is
          (phase position), not elapsed seconds (Fix 6). */}
      <div className="absolute top-[88px] left-5 right-5 z-10 pointer-events-none">
        <div className="h-[2px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, ((stepIdx + 1) / Math.max(1, sequenceSteps.length)) * 100)}%`,
              background: `linear-gradient(90deg, ${accentColor} 0%, ${hexToRgba(accentColor, 0.5)} 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1 px-1">
          {sequenceSteps.map((s, i) => (
            <div
              key={i}
              className="text-[8px] tracking-widest uppercase font-rajdhani transition-colors"
              style={{
                color: i <= stepIdx ? accentColor : 'rgba(255,255,255,0.25)',
                fontWeight: (s.role === 'signalFork' || s.role === 'primaryReturn') ? 700 : 400,
              }}
              title={`${s.phaseLabel} · ${s.planet}`}
            >
              {s.planet === 'Earth' ? 'Ea' : s.planet === 'Silence' ? '··' : s.planet === 'Full Moon' ? 'Mo' : s.planet.slice(0, 2)}
            </div>
          ))}
        </div>
      </div>


      {/* Center — step card (Body view only; the Color/Mandala/Combined views
          carry their own minimal overlay so the immersive field stays clear). */}
      {visualMode === 'body' && (
        <div
          className="absolute inset-x-0 top-[140px] z-10 overflow-y-auto px-5"
          style={{ bottom: bottomBarH + 12 }}
        >
          <div className="max-w-2xl mx-auto" style={{ animation: 'slideInUp 350ms cubic-bezier(0.34, 1.56, 0.64, 1)' }} key={stepIdx}>
            {!isBreathwork && !isClosingStep && (
              <SequenceStepCard
                step={current}
                cue={cue}
                forkSetType={forkSetType}
                onSetForkSetType={setForkSetType}
                isPractitionerMode={isPractitionerSession || mode === 'practitioner'}
                breathName={breathPattern.name}
                breathGuidance={breathPattern.guidance}
                accentColor={current.fork?.color ?? accentColor}
                bodyMapType={intakeData.bodyMapType ?? 'female'}
                placement={resolvePlacement(current.planet)}
                reflexPoints={reflexPoints}
                onAskAstryx={onAskAstryx ? () => onAskAstryx() : undefined}
              />
            )}
            {!isBreathwork && isClosingStep && (
              <StepClose
                phaseLabel={current.phaseLabel}
                silent={current.role === 'silentIntegration'}
                dominantPlanet={dominantPlanet}
                accentColor={accentColor}
              />
            )}
          </div>
        </div>
      )}

      {/* Bottom controls — visual toggle + sound engine + step navigation */}
      <div ref={bottomBarRef} className="absolute bottom-0 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto space-y-2">
          {/* Visual mode toggle moved ABOVE the frame (top of chamber) per SHA
              2026-06-28 — it was overlapping the body-map frame down here. The
              toggle now lives in its own top-anchored bar (see above the step
              card). The bottom bar carries music + navigation only. */}

          {/* H.3 — MUSIC-ONLY chamber audio. The session cross-fades the track per
              fork step; this controller owns activation, volume, and the
              5-phase volume envelope. */}
          <SoundEngineController
            protocol={protocol}
            accentColor={accentColor}
            sessionActive={true}
            chamberDurationSec={chamberDurationSec}
            chamberDNA={chamberDNA}
            currentForkPlanet={audioForkPlanet}
            currentForkHz={current?.hz}
            audioMode={audioMode}
            onAudioModeChange={setAudioMode}
            versionOverrides={songOverrides}
            onSelectVersion={handleSelectVersion}
            onResetOverrides={clearSongOverrides}
            naturalOnly={isFullSpectrum}
            defaultCollapsed={visualMode === 'body'}
          />

          {/* Carried-flow controls — the timeline leads; linger/next for those
              who want it; practitioner adds pacing (H.2). */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPinned(Math.max(0, stepIdx - 1))}
              disabled={stepIdx === 0}
              className="px-3 py-2 rounded-lg font-rajdhani text-[11px] tracking-[0.2em] uppercase transition disabled:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.65)', cursor: stepIdx === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ←
            </button>

            <div className="flex-1 text-center">
              <div className="text-[10px] text-white/55 tracking-widest">
                {stepTitle(current).toUpperCase()} · {cue.toUpperCase()}
              </div>
              {pinned !== null ? (
                <button
                  onClick={() => setPinned(null)}
                  className="mt-0.5 text-[10px] tracking-[0.18em] uppercase"
                  style={{ color: accentColor, cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  ▸ Resume the flow
                </button>
              ) : (
                <div className="text-[10px] text-white/35 tracking-widest mt-0.5">
                  Phase {stepIdx + 1} of {sequenceSteps.length}
                </div>
              )}
            </div>

            {isLast ? (
              <button
                onClick={handleComplete}
                className="px-5 py-2 rounded-lg font-rajdhani text-[11px] tracking-[0.2em] uppercase"
                style={{ background: accentColor, color: '#020208', cursor: 'pointer', fontWeight: 600 }}
              >
                Complete Session ✓
              </button>
            ) : (
              <button
                onClick={() => setPinned(Math.min(sequenceSteps.length - 1, stepIdx + 1))}
                className="px-3 py-2 rounded-lg font-rajdhani text-[11px] tracking-[0.2em] uppercase"
                style={{ background: hexToRgba(accentColor, 0.18), border: `1px solid ${hexToRgba(accentColor, 0.5)}`, color: accentColor, cursor: 'pointer' }}
              >
                →
              </button>
            )}
          </div>

          {/* Patch 4.4 — a slider to glide through the phases as well as step.
              Sliding pins a phase (the ▸ Resume the flow control above un-pins). */}
          {sequenceSteps.length > 1 && (
            <div className="px-1 pt-1">
              <input
                type="range"
                min={0}
                max={sequenceSteps.length - 1}
                value={stepIdx}
                onChange={(e) => setPinned(parseInt(e.target.value, 10))}
                aria-label="Slide through session phases"
                className="w-full cursor-pointer"
                style={{ accentColor }}
              />
            </div>
          )}

          {/* H.2 — practitioner pacing + printable protocol sheet */}
          {(isPractitionerSession || mode === 'practitioner') && (
            <div className="flex gap-2 items-center justify-center">
              <PaceButton label={paused ? '▶ Resume' : '❚❚ Pause'} onClick={() => setPaused((p) => !p)} />
              <PaceButton label="Extend Phase" onClick={handleExtend} />
              <PaceButton label="Skip fork →" onClick={handleSkip} />
              <PaceButton label="🖨 Protocol sheet" onClick={() => printProtocolSheet(sequenceSteps, forkSetType, activeClient?.name)} />
            </div>
          )}

          <div className="text-[9px] text-white/35 text-center tracking-widest italic">
            {MICRO_DISCLAIMER}
          </div>
        </div>
      </div>
    </div>
  )
}

const topPanelStyle: React.CSSProperties = {
  background: 'rgba(5,7,20,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '10px 18px',
}

// ═══════════════════════════════════════════════════════════════
// THE FORK SEQUENCE — step components (Directive H.1)
// ═══════════════════════════════════════════════════════════════

function stepTitle(step: SequenceStep | undefined): string {
  if (!step) return ''
  if (step.planet === 'Earth')   return `${step.phaseLabel} · Earth tone`
  if (step.planet === 'Silence') return step.phaseLabel
  const p = step.planet === 'Full Moon' ? 'Moon' : step.planet
  return `${step.phaseLabel} · ${p}`
}

// Fix 5 — badges for the fixed container phase architecture.
const ROLE_BADGE: Record<string, string> = {
  ground:            'OPENING GROUND · SETTLE IN',
  primary:           'PRIMARY SIGNAL · THE HEART OF THE SESSION',
  secondary:         'SECONDARY SUPPORT · CORRECTIVE',
  tertiary:          'TERTIARY INTEGRATION',
  bodyPlacement:     'BODY PLACEMENT · FORK WORK',
  primaryReturn:     'PRIMARY RETURN',
  integration:       'INTEGRATION CLOSE',
  earthClose:        'EARTH CLOSE · GROUND',
  silentIntegration: 'SILENT INTEGRATION',
}

/** H.1 — application guidance keys to the SET the user owns. */
function applicationFor(
  setType: 'unweighted' | 'weighted',
  fork: SacredFork | null,
): { line: string; note?: string } {
  const point = fork?.boneApplicationPoint?.split('.')[0] ?? 'the body midline'
  if (setType === 'weighted') {
    return { line: `On-body: strike, then place the stem at ${point} with steady, comfortable contact.` }
  }
  return {
    line: `Field: strike and hold the fork 4–6 inches from the body — by the ear, or sweeping over ${point}. Light contact only; this set is not built for deep pressure.`,
    note: 'On-body point application unlocks with the weighted steel set.',
  }
}

function SequenceStepCard({
  step, cue, forkSetType, onSetForkSetType, isPractitionerMode,
  breathName, breathGuidance, accentColor, bodyMapType, placement,
  reflexPoints, onAskAstryx,
}: {
  step: SequenceStep
  cue: string
  forkSetType: 'unweighted' | 'weighted'
  onSetForkSetType: (t: 'unweighted' | 'weighted') => void
  isPractitionerMode: boolean
  breathName: string
  breathGuidance: string
  accentColor: string
  bodyMapType: BodyMapType
  placement: ForkPlacement
  reflexPoints?: ReflexPoint[]
  onAskAstryx?: (seed: string) => void
}) {
  const fork = step.fork
  const app = applicationFor(forkSetType, fork)
  const mins = Math.floor(step.holdSec / 60)
  const secs = step.holdSec % 60
  const holdLabel = mins > 0 ? `${mins}m${secs ? ` ${secs}s` : ''}` : `${secs}s`
  const isEarth = step.planet === 'Earth'
  const cardTitle = isEarth ? 'Earth Om · Grounding'
    : fork ? `${step.planet === 'Full Moon' ? 'Moon' : step.planet} Fork`
    : step.phaseLabel

  return (
    <StepCard badge={ROLE_BADGE[step.role] ?? 'FORK'} title={cardTitle} accentColor={accentColor}>
      {/* Every phase declares what it is doing (Fix 5 — fixed architecture). */}
      <p className="text-[11px] text-white/45 italic mb-3">{step.phaseLabel} — {step.purpose}.</p>

      {fork ? (
        <>
          {/* Body Map LEADS the fork step — WHERE to hold + the active zone. */}
          <div className="mb-4">
            <ChamberBodyMap placement={placement} bodyMapType={bodyMapType} accentColor={accentColor} reflexPoints={reflexPoints} onAskAstryx={onAskAstryx} />
            <div className="mt-2 px-3 py-2 rounded-xl"
                 style={{ background: hexToRgba(accentColor, 0.1), border: `1px solid ${hexToRgba(accentColor, 0.3)}` }}>
              <div className="text-[9px] uppercase tracking-[0.22em] mb-0.5" style={{ color: hexToRgba(accentColor, 0.9) }}>
                Placement · {placement.primaryLabel}
              </div>
              <div className="text-[13px] text-white/90 leading-snug">{placement.how}</div>
              <div className="text-[11.5px] text-white/55 italic leading-relaxed mt-1.5">{placement.why}</div>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-4 flex-wrap">
            <span className="font-cinzel text-[22px]" style={{ color: accentColor }}>{fork.hz} Hz</span>
            <span className="text-[12px] text-white/65">{fork.note} · {fork.chakra}</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest"
                  style={{ background: hexToRgba(accentColor, 0.18), color: accentColor }}>
              HOLD {holdLabel}
            </span>
          </div>

          <p className="text-[13px] text-white/85 leading-relaxed mb-2">
            The music has shifted to this fork&apos;s planet — its frequency lives in the
            key and notes you&apos;re hearing. Strike, and let your fork ring with it.
            <span className="block mt-1 text-[12px] text-white/55 italic">{cue}</span>
          </p>
          <FieldRow label="APPLICATION" value={app.line} accentColor={accentColor} />
          {app.note && (<p className="text-[11px] text-white/45 italic mt-1">{app.note}</p>)}
          <p className="text-[11px] text-white/45 italic mt-3">
            ♫ Music support — the Chamber is carrying the {step.planet} signal while you apply the fork.
          </p>

          {/* Which set do you have? (guidance keys to the owned set) */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Your set:</span>
            {(['unweighted', 'weighted'] as const).map((t) => (
              <button key={t}
                onClick={() => onSetForkSetType(t)}
                className="px-2.5 py-1 rounded-full text-[10px] tracking-[0.15em] uppercase"
                style={{
                  background: forkSetType === t ? hexToRgba(accentColor, 0.2) : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${forkSetType === t ? hexToRgba(accentColor, 0.5) : 'rgba(255,255,255,0.12)'}`,
                  color: forkSetType === t ? accentColor : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}>
                {t === 'unweighted' ? 'Aluminum · field' : 'Steel · weighted'}
              </button>
            ))}
          </div>

          {isPractitionerMode && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] tracking-widest text-white/55 hover:text-white/87">
                CLINICAL DETAIL
              </summary>
              <div className="mt-2 space-y-1.5">
                <FieldRow label="NERVE ACTIVATION" value={fork.nervePlexus} accentColor={accentColor} />
                <FieldRow label="ANS EFFECT" value={fork.ANSEffect} accentColor={accentColor} />
                <p className="text-[12px] text-white/65 italic leading-relaxed">{fork.clinicalNote}</p>
              </div>
            </details>
          )}
        </>
      ) : (
        /* Opening Ground — app-played Earth Om (136.10 Hz), nothing to strike. */
        <>
          <div className="flex items-baseline gap-3 mb-4 flex-wrap">
            <span className="font-cinzel text-[22px]" style={{ color: accentColor }}>136.10 Hz</span>
            <span className="text-[12px] text-white/65">Earth Om · grounding</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest"
                  style={{ background: hexToRgba(accentColor, 0.18), color: accentColor }}>
              HOLD {holdLabel}
            </span>
          </div>
          <p className="text-[13px] text-white/85 leading-relaxed mb-2">
            The Earth tone plays from the chamber. Let it settle the field — soften the
            jaw and shoulders, feel the weight of the body. Nothing to strike here.
            <span className="block mt-1 text-[12px] text-white/55 italic">{cue}</span>
          </p>
        </>
      )}

      {/* Breath runs through the whole session — the corrective rhythm */}
      <div className="mt-4 pt-3 border-t border-white/8">
        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: hexToRgba(accentColor, 0.8) }}>
          Breath · {breathName}
        </span>
        <p className="text-[11px] text-white/55 leading-relaxed mt-0.5">{breathGuidance}</p>
      </div>
    </StepCard>
  )
}

function PaceButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg font-rajdhani text-[10px] tracking-[0.18em] uppercase"
      style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
        color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

/** H.2 — printable/shareable protocol sheet (practitioner service artifact). */
function printProtocolSheet(
  steps: SequenceStep[],
  setType: 'unweighted' | 'weighted',
  clientName?: string | null,
): void {
  if (typeof window === 'undefined') return
  const rows = steps.map((s) => {
    const hz = s.planet === 'Earth' ? '136.10 (Earth Om)' : s.planet === 'Silence' ? 'silence' : s.fork ? String(s.fork.hz) : '—'
    const app = !s.fork ? 'Carried by the chamber tone' : applicationFor(setType, s.fork).line
    const mins = Math.floor(s.holdSec / 60), secs = s.holdSec % 60
    return `<tr><td>${s.idx + 1}</td><td>${stepTitle(s)}</td><td>${hz}</td><td>${mins}m ${secs}s</td><td>${app}</td></tr>`
  }).join('')
  const html = `<!doctype html><html><head><title>Astryx — Session Protocol Sheet</title>
  <style>body{font-family:Georgia,serif;margin:32px;color:#111}h1{font-size:20px;letter-spacing:2px}
  table{width:100%;border-collapse:collapse;font-size:12px}td,th{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#eee;letter-spacing:1px}p{font-size:11px;color:#444}</style></head><body>
  <h1>ASTRYX — PLANETARY FORK SESSION${clientName ? ` · ${clientName}` : ''}</h1>
  <p>Set: ${setType === 'weighted' ? 'Weighted steel (on-body application)' : 'Unweighted aluminum (field application)'}</p>
  <table><tr><th>#</th><th>Step</th><th>Hz</th><th>Hold</th><th>Application</th></tr>${rows}</table>
  <p>ⓘ Reference tool · Not medical advice. The practitioner is responsible for clinical interpretation and client safety.</p>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
}

// ═══════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StepCard({
  badge, title, accentColor, children,
}: { badge: string; title: string; accentColor: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-7"
      style={{
        background: 'rgba(5,7,20,0.72)', backdropFilter: 'blur(20px)',
        border: `1px solid ${hexToRgba(accentColor, 0.25)}`,
        boxShadow: `0 0 32px -10px ${hexToRgba(accentColor, 0.3)}`,
      }}
    >
      <div className="text-[10px] tracking-[0.3em] mb-1.5" style={{ color: accentColor }}>{badge}</div>
      <h2 className="font-cinzel text-[24px] text-white mb-4">{title}</h2>
      {children}
    </div>
  )
}

function StepSpace({
  direction, element, accentColor, dominantPlanet, scent,
}: {
  direction: string; element: string; accentColor: string; dominantPlanet: string; scent?: string
}) {
  return (
    <StepCard badge="STEP 1 · PREPARE SPACE" title="Set the field" accentColor={accentColor}>
      <p className="text-[14px] text-white/87 leading-relaxed mb-4">
        Settle into a quiet space. Dim the room. Allow yourself this time.
      </p>
      <div className="space-y-3">
        <FieldRow label="DIRECTION" value={direction} accentColor={accentColor} />
        <FieldRow label="ELEMENT FOCUS" value={element} accentColor={accentColor} />
        <FieldRow label="DOMINANT PLANET" value={dominantPlanet} accentColor={accentColor} />
        {scent && <FieldRow label="SCENT" value={`${scent} — diffuser or candle`} accentColor={accentColor} />}
        <FieldRow label="LIGHTING" value="Warm filter or single candle in the planet's color tone" accentColor={accentColor} />
      </div>
      <p className="text-[12px] text-white/65 italic mt-4">
        When the space is set, tap Next.
      </p>
    </StepCard>
  )
}

function StepTea({
  botanical, ingredients, accentColor,
}: {
  botanical?: SacredBotanical; ingredients: string[]; accentColor: string
}) {
  const teaProfile = botanical?.teaProfile ?? 'Steep 5–7 min at 195°F. Hold the cup. Breathe its aroma before sipping.'
  const flagged = lintForBannedPhrases(teaProfile)

  return (
    <StepCard badge="STEP 2 · PREPARE TEA" title={botanical?.sacredBotanical ?? 'Herbal Infusion'} accentColor={accentColor}>
      {botanical?.latinName && (
        <p className="text-[12px] italic text-white/55 mb-3">{botanical.latinName}</p>
      )}
      {ingredients && ingredients.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] tracking-widest text-white/55 mb-1.5">BLEND</div>
          <div className="flex flex-wrap gap-1.5">
            {ingredients.slice(0, 6).map((ing) => (
              <span key={ing} className="px-2 py-1 rounded text-[11px] text-white/87"
                style={{ background: hexToRgba(accentColor, 0.12), border: `1px solid ${hexToRgba(accentColor, 0.3)}` }}>
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}
      <FieldRow label="PREPARATION" value={teaProfile} accentColor={accentColor} />
      <div className="p-3 rounded-lg mt-3" style={{ background: hexToRgba(accentColor, 0.06), border: `1px solid ${hexToRgba(accentColor, 0.2)}` }}>
        <div className="text-[10px] tracking-widest mb-1" style={{ color: accentColor }}>INTENTION</div>
        <p className="text-[13px] text-white/87 italic">
          Hold the cup. State your intention for this session before drinking.
        </p>
      </div>
      {botanical?.safetyNote && (
        <p className="text-[10px] text-white/55 italic mt-3">{botanical.safetyNote}</p>
      )}
      {flagged.length > 0 && (
        <p className="text-[9px] text-red-300/65 italic mt-2">⚠ Content flagged for review: {flagged.join(', ')}</p>
      )}
    </StepCard>
  )
}

function StepCrystal({
  crystal, dominantPlanet, accentColor,
}: { crystal?: CrystalExpanded; dominantPlanet: string; accentColor: string }) {
  const isMalachite = crystal?.featuredCrystal === 'Malachite'

  if (!crystal) {
    return (
      <StepCard badge="STEP 3 · CRYSTAL ACTIVATION" title="Crystal Placement" accentColor={accentColor}>
        <p className="text-[13px] text-white/65 italic">No featured crystal for this protocol. Skip to next step.</p>
      </StepCard>
    )
  }
  const cd = crystal.featuredCrystalData

  return (
    <StepCard badge="STEP 3 · CRYSTAL ACTIVATION" title={crystal.featuredCrystal} accentColor={accentColor}>
      {isMalachite && (
        <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'rgba(232,69,60,0.15)', border: '1px solid rgba(232,69,60,0.4)' }}>
          <span className="text-[10px] font-bold tracking-widest text-red-200">
            ⚠ MALACHITE — POLISHED & SEALED ONLY · NEVER RAW · NEVER FOR ELIXIRS
          </span>
        </div>
      )}
      <p className="text-[13px] text-white/87 leading-relaxed mb-3">
        Strike the {dominantPlanet} tuning fork and hover it 3" above the crystal for 30 seconds. This activates the crystal&apos;s resonant field.
      </p>
      {cd && (
        <>
          <FieldRow label="PLACEMENT" value={cd.bodyPlacement} accentColor={accentColor} />
          {cd.placementNote && <FieldRow label="NOTE" value={cd.placementNote} accentColor={accentColor} />}
          {cd.safetyNote && <p className="text-[10px] text-white/55 italic mt-2">{cd.safetyNote}</p>}
        </>
      )}
    </StepCard>
  )
}

function StepFork({
  fork, index, total, isApplied, onMarkApplied, isPractitionerMode,
}: {
  fork: SacredFork; index: number; total: number
  isApplied: boolean; onMarkApplied: () => void
  isPractitionerMode: boolean
}) {
  const accentColor = fork.color
  const vagusBadge = vagusBadgeColor(fork.vagusStrength)
  const hold = holdDurationFor(fork.vagusStrength)

  return (
    <StepCard
      badge={`STEP ${4 + index} · FORK ${index + 1} OF ${total}`}
      title={`${fork.planet} Fork`}
      accentColor={accentColor}
    >
      <div className="flex items-baseline gap-3 mb-4 flex-wrap">
        <span className="font-cinzel text-[20px]" style={{ color: accentColor }}>
          {fork.hz} Hz
        </span>
        <span className="text-[12px] text-white/65">{fork.note} · {fork.chakra}</span>
        <span
          className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest"
          style={{ background: vagusBadge.bg, color: vagusBadge.fg }}
        >
          {vagusBadge.label}
        </span>
      </div>

      <FieldRow label="WHERE TO APPLY" value={fork.boneApplicationPoint} accentColor={accentColor} highlight />
      <FieldRow label="HOLD DURATION" value={hold + '. Observe breath response.'} accentColor={accentColor} highlight />

      {isPractitionerMode && (
        <>
          <FieldRow label="NERVE ACTIVATION" value={fork.nervePlexus} accentColor={accentColor} />
          <FieldRow label="ANS EFFECT" value={fork.ANSEffect} accentColor={accentColor} />
          <details className="mt-3">
            <summary className="cursor-pointer text-[10px] tracking-widest text-white/55 hover:text-white/87">
              CLINICAL GUIDANCE
            </summary>
            <p className="text-[12px] text-white/65 italic mt-1.5 leading-relaxed">{fork.clinicalNote}</p>
          </details>
        </>
      )}

      <button
        onClick={onMarkApplied}
        disabled={isApplied}
        className="w-full mt-5 py-2.5 rounded-lg font-rajdhani text-[12px] tracking-[0.2em] uppercase transition"
        style={{
          background: isApplied ? 'rgba(76,175,137,0.2)' : accentColor,
          color: isApplied ? '#86EFAC' : '#020208',
          border: isApplied ? '1px solid rgba(76,175,137,0.4)' : 'none',
          cursor: isApplied ? 'default' : 'pointer',
          fontWeight: 600,
        }}
      >
        {isApplied ? '✓ Applied' : '✓ Mark Fork Applied'}
      </button>
    </StepCard>
  )
}

function StepBreath({
  pattern, element, dominantPlanet, accentColor, protocol,
}: {
  pattern: typeof ELEMENT_BREATH[string]
  element: string
  dominantPlanet: string
  accentColor: string
  protocol: ProtocolOutput
}) {
  const [phaseIdx, setPhaseIdx]   = useState(0)
  const [countdown, setCountdown] = useState(pattern.cycle[0].secs)
  const [running, setRunning]     = useState(true)

  useEffect(() => {
    if (!running) return
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setPhaseIdx((p) => (p + 1) % pattern.cycle.length)
          return pattern.cycle[(phaseIdx + 1) % pattern.cycle.length].secs
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [running, phaseIdx, pattern])

  const phase = pattern.cycle[phaseIdx]
  const geometryName = protocol.plan.sight.geometry

  return (
    <StepCard badge="STEP 9 · BREATH + GEOMETRY" title={pattern.name} accentColor={accentColor}>
      <p className="text-[12px] text-white/65 italic mb-4">
        {element} element · {dominantPlanet} resonance · {geometryName}
      </p>
      <p className="text-[13px] text-white/87 leading-relaxed mb-5">{pattern.guidance}</p>

      {/* Visual pacer */}
      <div className="flex flex-col items-center mb-4">
        <div
          className="rounded-full mb-3 transition-all duration-1000"
          style={{
            width: 90, height: 90,
            background: hexToRgba(accentColor, 0.15),
            border: `2px solid ${accentColor}`,
            transform: phase.label.toLowerCase().includes('inhale') ? 'scale(1.18)'
                     : phase.label.toLowerCase().includes('exhale') ? 'scale(0.85)' : 'scale(1.05)',
            boxShadow: `0 0 40px ${hexToRgba(accentColor, 0.5)}`,
          }}
        />
        <div className="text-[10px] tracking-[0.3em] text-white/55 mb-1">{phase.label.toUpperCase()}</div>
        <div className="font-cinzel text-[48px]" style={{ color: accentColor, lineHeight: 1 }}>
          {countdown}
        </div>
      </div>

      <button
        onClick={() => setRunning((r) => !r)}
        className="w-full py-2 rounded-lg font-rajdhani text-[11px] tracking-[0.2em] uppercase transition"
        style={{
          background: hexToRgba(accentColor, 0.12), border: `1px solid ${hexToRgba(accentColor, 0.35)}`,
          color: accentColor, cursor: 'pointer',
        }}
      >
        {running ? 'Pause' : 'Resume'}
      </button>
    </StepCard>
  )
}

/**
 * J.3 — Breathwork bookend card (Full-Spectrum opening/closing breath). Reuses
 * the StepBreath pacer mechanics with calm bookend copy. No fork, no placement.
 */
function BreathworkCard({
  title, subtitle, pattern, accentColor,
}: {
  title: string
  subtitle: string
  pattern: typeof ELEMENT_BREATH[string]
  accentColor: string
}) {
  const [phaseIdx, setPhaseIdx]   = useState(0)
  const [countdown, setCountdown] = useState(pattern.cycle[0].secs)
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setPhaseIdx((p) => (p + 1) % pattern.cycle.length)
          return pattern.cycle[(phaseIdx + 1) % pattern.cycle.length].secs
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [phaseIdx, pattern])

  const phase = pattern.cycle[phaseIdx]
  return (
    <StepCard badge="BREATH" title={title} accentColor={accentColor}>
      <p className="text-[12px] text-white/60 italic mb-4">{subtitle} · {pattern.name}</p>
      <div className="flex flex-col items-center mb-3">
        <div
          className="rounded-full mb-3 transition-all duration-1000"
          style={{
            width: 96, height: 96,
            background: hexToRgba(accentColor, 0.15),
            border: `2px solid ${accentColor}`,
            transform: phase.label.toLowerCase().includes('inhale') ? 'scale(1.18)'
                     : phase.label.toLowerCase().includes('exhale') ? 'scale(0.85)' : 'scale(1.05)',
            boxShadow: `0 0 40px ${hexToRgba(accentColor, 0.5)}`,
          }}
        />
        <div className="text-[10px] tracking-[0.3em] text-white/55 mb-1">{phase.label.toUpperCase()}</div>
        <div className="font-cinzel text-[44px]" style={{ color: accentColor, lineHeight: 1 }}>{countdown}</div>
      </div>
      <p className="text-[12px] text-white/70 leading-relaxed text-center">{pattern.guidance}</p>
    </StepCard>
  )
}

/**
 * The grounding RETURN moment — the in-chamber close (Earth Close / Integration
 * Close / Silent Integration). The check-in questionnaire lives on the
 * post-session page; this is purely the return to ordinary awareness. Tapping
 * Complete Session carries the user forward to the post-session check-in.
 */
function StepClose({
  phaseLabel, silent, dominantPlanet, accentColor,
}: {
  phaseLabel: string
  silent: boolean
  dominantPlanet: string
  accentColor: string
}) {
  return (
    <StepCard badge={silent ? 'SILENT INTEGRATION' : 'CLOSE · GROUND'} title={silent ? 'Silent integration' : phaseLabel} accentColor={accentColor}>
      {silent ? (
        <p className="text-[13px] text-white/85 leading-relaxed mb-3">
          The sound has lifted. Rest in the quiet and let the session assimilate —
          nothing to do, nowhere to be. Stay as long as the silence holds you.
        </p>
      ) : (
        <div className="mb-5 p-3 rounded-lg" style={{ background: hexToRgba(accentColor, 0.08), border: `1px solid ${hexToRgba(accentColor, 0.25)}` }}>
          <div className="text-[10px] tracking-widest mb-1" style={{ color: accentColor }}>EARTH GROUNDING</div>
          <p className="text-[13px] text-white/87 leading-relaxed">
            The Earth tone carries you home. If you have your <span className="font-cinzel" style={{ color: accentColor }}>{dominantPlanet} fork</span>, strike it gently alongside to bridge back.
          </p>
          <p className="text-[11px] text-white/65 italic mt-1">
            This is the bridge back to ordinary awareness. Let it settle for a breath or two.
          </p>
        </div>
      )}

      <p className="text-[13px] text-white/80 leading-relaxed mb-2">
        Take a few unhurried breaths. Notice what has shifted — in the body, the
        mind, the emotional field. There is no rush to leave.
      </p>

      <p className="text-[11px] text-white/65 italic text-center mt-4">
        When ready, tap <span style={{ color: accentColor }}>Complete Session ✓</span> below —
        you&apos;ll be guided to a short check-in.
      </p>
    </StepCard>
  )
}

// ─── FIELD ROW ──────────────────────────────────────────────

function FieldRow({
  label, value, accentColor, highlight = false,
}: { label: string; value: string; accentColor: string; highlight?: boolean }) {
  return (
    <div className="mb-2.5">
      <div className="text-[9px] tracking-[0.25em] text-white/55 mb-0.5">{label}</div>
      <div
        className={`text-[13px] leading-snug ${highlight ? 'text-white' : 'text-white/87'}`}
        style={highlight ? { color: accentColor } : {}}
      >
        {value}
      </div>
    </div>
  )
}
