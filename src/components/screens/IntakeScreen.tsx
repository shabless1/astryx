'use client'

import { useState, useRef, useCallback } from 'react'
import type { IntakeData, AppMode } from '@/types'
import BirthLocationField from '@/components/ui/BirthLocationField'
import planetIntakeMapData from '@/data/planet-intake-map.json'
import { useAppStore } from '@/lib/store'
import { ZONE_CHIPS } from '@/lib/bodyZoneResolver'

// ── Types ──────────────────────────────────────────────────────
interface IntakeScreenProps {
  formData: IntakeData
  setFormData: (data: Partial<IntakeData>) => void
  selectedSymptoms: string[]
  onToggleSymptom: (s: string) => void
  mode: AppMode
  setMode: (mode: AppMode) => void
  onAnalyze: () => void
  accentColor: string
  onCoordsChange: (coords: { lat: number; lon: number; tzOffset?: number } | null) => void
  birthTimeUnknown: boolean
  onBirthTimeUnknown: (v: boolean) => void
}

// ── Planet data ────────────────────────────────────────────────
const PLANETS = planetIntakeMapData.planets

// Directive I-FIX FIX 6 — when a planet is marked balanced/strong, surface what
// that resource feels like (so the user and the engine register HOW it's strong,
// not just a checkbox). Affirmative, plain, non-clinical.
const BALANCE_DESCRIPTORS: Record<string, string[]> = {
  Sun:     ['Steady vitality', 'Clear sense of self', 'Confident direction'],
  Moon:    ['Emotionally settled', 'Restorative sleep', 'Feel safe & held'],
  Mercury: ['Clear, focused mind', 'Easy communication', 'Calm nervous system'],
  Venus:   ['Connected in love', 'At ease with worth', 'A sense of harmony'],
  Mars:    ['Strong, steady drive', 'Healthy assertiveness', 'Energy to act'],
  Jupiter: ['Optimism & faith', 'A sense of abundance', 'Room to grow'],
  Saturn:  ['Grounded structure', 'Healthy boundaries', 'Steady discipline'],
  Uranus:  ['Settled yet adaptable', 'Free but stable', 'Calm, clear edge'],
  Neptune: ['Clear intuition', 'Spiritually grounded', 'Restful imagination'],
  Pluto:   ['Empowered & whole', 'At peace with change', 'Healthy sense of power'],
}

// ── Intention chips ────────────────────────────────────────────
const INTENTION_CHIPS = [
  'Clarity', 'Peace', 'Energy', 'Healing', 'Strength',
  'Emotional balance', 'Abundance', 'Transformation',
  'Spiritual connection', 'Grounding', 'Love', 'Focus',
]

// Launch lock (SHA 2026-06-28): the Practitioner portal is gated off until it's
// complete. The mode toggle shows Practitioner with a padlock, non-clickable.
// Flip to false to re-open the practitioner side.
const PRACTITIONER_LOCKED = true

// ── Step labels ────────────────────────────────────────────────
const STEPS = [
  { label: 'Personal', icon: '◎' },
  { label: 'Resonance', icon: '◈' },
  { label: 'Narrative', icon: '✦' },
  { label: 'Intention', icon: '◆' },
]

// ── Hex → rgba ────────────────────────────────────────────────
function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─────────────────────────────────────────────────────────────
export default function IntakeScreen({
  formData,
  setFormData,
  selectedSymptoms,
  onToggleSymptom,
  mode,
  setMode,
  onAnalyze,
  accentColor,
  onCoordsChange,
  birthTimeUnknown,
  onBirthTimeUnknown,
}: IntakeScreenProps) {
  const [step, setStep]                           = useState(0)
  const [intentionChips, setIntentionChips]       = useState<string[]>([])
  const [interpreting, setInterpreting]           = useState(false)
  const [interpretedPlanets, setInterpretedPlanets] = useState<string[]>([])
  const [interpretReasoning, setInterpretReasoning] = useState('')
  const [narrativeError, setNarrativeError]       = useState('')

  // Track which planet question keys are selected
  const [questionSelections, setQuestionSelections] = useState<string[]>([])
  // Directive I.1 — planets the user marks balanced/strong (a resource the
  // engine can draw from). Mutually exclusive per-planet with imbalance taps.
  const [balancedPlanets, setBalancedPlanets] = useState<string[]>(formData.resourcedPlanets ?? [])

  const narrativeRef = useRef<HTMLTextAreaElement>(null)
  // v2 FIX 10 — which answered planet cards the user has re-expanded for editing.
  // View state ONLY; never affects what is recorded or scored.
  const [reExpanded, setReExpanded] = useState<Record<string, boolean>>({})

  // ── Planet question toggle ──────────────────────────────────
  // Selecting an imbalance statement for a planet clears any "balanced" mark on
  // that planet (mutual exclusivity), then toggles the symptom as before.
  const handleToggleQuestion = useCallback((questionKey: string, symptomTag: string, planetName: string) => {
    const willSelect = !questionSelections.includes(questionKey)
    if (willSelect && balancedPlanets.includes(planetName)) {
      const next = balancedPlanets.filter(p => p !== planetName)
      setBalancedPlanets(next)
      setFormData({ resourcedPlanets: next })
    }
    setQuestionSelections(prev =>
      prev.includes(questionKey) ? prev.filter(k => k !== questionKey) : [...prev, questionKey],
    )
    onToggleSymptom(symptomTag)
  }, [onToggleSymptom, questionSelections, balancedPlanets, setFormData])

  // ── "This feels balanced / strong" toggle (Directive I.1) ───
  // Turning it ON clears that planet's imbalance selections (and their symptom
  // tags); turning it OFF just unmarks it. Synced to formData.resourcedPlanets.
  const handleMarkBalanced = useCallback((planet: typeof PLANETS[number]) => {
    const isOn = balancedPlanets.includes(planet.planet)
    if (isOn) {
      const next = balancedPlanets.filter(p => p !== planet.planet)
      setBalancedPlanets(next)
      setFormData({ resourcedPlanets: next })
      return
    }
    // Clear this planet's imbalance taps before marking it a resource.
    const planetKeys = planet.questions.map(q => q.key)
    planet.questions.forEach(q => {
      if (questionSelections.includes(q.key)) onToggleSymptom(q.symptomTag)
    })
    setQuestionSelections(prev => prev.filter(k => !planetKeys.includes(k)))
    const next = [...balancedPlanets, planet.planet]
    setBalancedPlanets(next)
    setFormData({ resourcedPlanets: next })
  }, [balancedPlanets, questionSelections, onToggleSymptom, setFormData])

  // ── Intention chip toggle ───────────────────────────────────
  const handleToggleIntentionChip = (chip: string) => {
    setIntentionChips(prev => {
      const next = prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
      // Sync to formData.intention array
      setFormData({ intention: next })
      return next
    })
  }

  // ── Call interpret API then trigger engine ──────────────────
  const handleAnalyze = async () => {
    setInterpreting(true)
    setNarrativeError('')

    try {
      const narrative = formData.narrative || ''
      const intentionText = formData.intentionText || ''

      // Fire interpret endpoint (non-blocking — engine still runs on natal chart)
      if (narrative.trim().length > 0) {
        const res = await fetch('/api/intake/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            narrative,
            intentionText,
            symptoms: selectedSymptoms,
            questionSelections,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setInterpretedPlanets(data.dominantPlanets || [])
          setInterpretReasoning(data.reasoning || '')
          // Store narrative scores back to intake data for engine weighting
          setFormData({ narrativeScores: data.planetScores })
        }
      }
    } catch (err) {
      console.warn('[IntakeScreen] interpret call failed (non-fatal):', err)
    } finally {
      setInterpreting(false)
      onAnalyze()
    }
  }

  // ── Step validation ─────────────────────────────────────────
  const canProceedStep0 =
    formData.name.trim().length > 0 &&
    formData.birthDate.trim().length > 0 &&
    formData.birthLocation.trim().length > 0

  const canAnalyze = canProceedStep0

  // ── How many planets have active questions ──────────────────
  const activePlanetCount = PLANETS.filter(p =>
    p.questions.some(q => questionSelections.includes(q.key))
  ).length

  // v2 FIX 10b — systems scanned = answered (any symptom) OR marked balanced/strong.
  const scannedPlanetCount = PLANETS.filter(p =>
    p.questions.some(q => questionSelections.includes(q.key)) || balancedPlanets.includes(p.planet)
  ).length

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-24 sm:pt-32 pb-16 font-rajdhani">

      {/* Simple ASTRYX header. The full hero + welcome intro now live on the
          Landing page (SHA 2026-06-29); this screen is the birth-blueprint form. */}
      <div className="text-center mb-10 animate-fade-in-up">
        <h1
          className="font-cinzel font-bold tracking-[-0.02em] leading-none"
          style={{
            fontSize: 'clamp(34px, 6vw, 52px)',
            color: '#ffffff',
            textShadow: `0 0 40px ${rgba(accentColor, 0.4)}`,
          }}
        >
          ASTRYX
        </h1>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-10 sm:mb-14">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step ? setStep(i) : undefined}
              className="flex flex-col items-center gap-1 transition-all duration-300"
              style={{ cursor: i < step ? 'pointer' : 'default' }}
            >
              <div
                className="flex items-center justify-center rounded-full text-[11px] transition-all duration-300"
                style={{
                  width: 32, height: 32,
                  background: i === step ? rgba(accentColor, 0.2) : i < step ? rgba(accentColor, 0.1) : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${i <= step ? rgba(accentColor, 0.6) : 'rgba(255,255,255,0.12)'}`,
                  color: i <= step ? accentColor : 'rgba(255,255,255,0.3)',
                }}
              >
                {i < step ? '✓' : s.icon}
              </div>
              <span
                className="text-[9px] tracking-[0.15em] uppercase"
                style={{ color: i === step ? accentColor : 'rgba(255,255,255,0.3)' }}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className="w-8 h-px mx-2 mb-4"
                style={{ background: i < step ? rgba(accentColor, 0.4) : 'rgba(255,255,255,0.1)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Personal ── */}
      {step === 0 && (
        <StepCard title="Your Birth Blueprint" subtitle="This data generates your unique natal chart — the foundation of your calibration protocol.">
          <div className="space-y-4">
            {/* Mode toggle. The Practitioner portal is LOCKED for launch (SHA
                2026-06-28) — shown but non-clickable with a padlock until the
                practitioner side is complete. Flip PRACTITIONER_LOCKED to false
                to re-enable. */}
            <div className="flex gap-2 mb-2">
              {(['user', 'practitioner'] as AppMode[]).map(m => {
                const locked = m === 'practitioner' && PRACTITIONER_LOCKED
                const active = mode === m && !locked
                return (
                  <button
                    key={m}
                    onClick={() => { if (!locked) setMode(m) }}
                    disabled={locked}
                    aria-disabled={locked}
                    title={locked ? 'Practitioner portal — coming soon' : undefined}
                    className="flex-1 py-2 rounded-lg text-[11px] tracking-[0.2em] uppercase transition-all duration-200 inline-flex items-center justify-center gap-1.5"
                    style={{
                      background: active ? rgba(accentColor, 0.15) : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? rgba(accentColor, 0.5) : 'rgba(255,255,255,0.1)'}`,
                      color: locked ? 'rgba(255,255,255,0.28)' : (active ? accentColor : 'rgba(255,255,255,0.4)'),
                      cursor: locked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {m === 'user'
                      ? '◎ Individual'
                      : <><span aria-hidden>🔒</span> Practitioner</>}
                  </button>
                )
              })}
            </div>

            <IntakeField label="Full Name">
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-transparent text-white/90 placeholder-white/25 text-[14px] outline-none"
              />
            </IntakeField>

            <div className="grid grid-cols-2 gap-3">
              <IntakeField label="Date of Birth">
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData({ birthDate: e.target.value })}
                  className="w-full bg-transparent text-white/90 text-[14px] outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </IntakeField>

              <IntakeField label={birthTimeUnknown ? 'Birth Time — Unknown' : 'Birth Time'}>
                {birthTimeUnknown ? (
                  <button
                    onClick={() => onBirthTimeUnknown(false)}
                    className="text-[12px] text-left transition-colors"
                    style={{ color: accentColor, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Enter time ›
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={formData.birthTime}
                      onChange={e => setFormData({ birthTime: e.target.value })}
                      className="flex-1 bg-transparent text-white/90 text-[14px] outline-none"
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      onClick={() => onBirthTimeUnknown(true)}
                      className="text-[10px] text-white/30 hover:text-white/60 transition-colors whitespace-nowrap"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      I don't know
                    </button>
                  </div>
                )}
              </IntakeField>
            </div>

            {birthTimeUnknown && (
              <div
                className="px-3 py-2 rounded-lg text-[11px] text-white/50"
                style={{ background: rgba(accentColor, 0.06), border: `1px solid ${rgba(accentColor, 0.2)}` }}
              >
                ☉ Solar Chart mode — Sun placed on the Ascendant. Planetary sign-based insights
                remain useful, but houses, Ascendant, Midheaven, and timing-sensitive details may be
                less precise without a birth time.
              </div>
            )}

            <IntakeField label="Birth Location">
              <BirthLocationField
                value={formData.birthLocation}
                onChange={loc => setFormData({ birthLocation: loc })}
                onCoordsChange={onCoordsChange}
                accentColor={accentColor}
              />
            </IntakeField>

            {/* Body Map directive — routes the Chamber's body map family. */}
            <div>
              <div className="text-[10px] tracking-[0.2em] text-white/30 uppercase mb-1.5">
                Body Map Selection
              </div>
              <div className="flex gap-2">
                {([['female', 'Female'], ['male', 'Male'], ['neutral', 'Prefer not to say']] as const).map(([val, label]) => {
                  const active = (formData.bodyMapType ?? 'female') === val
                  return (
                    <button
                      key={val}
                      onClick={() => setFormData({ bodyMapType: val })}
                      className="flex-1 py-2 rounded-lg text-[11px] tracking-[0.12em] transition-all duration-200"
                      style={{
                        background: active ? rgba(accentColor, 0.15) : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? rgba(accentColor, 0.5) : 'rgba(255,255,255,0.1)'}`,
                        color: active ? accentColor : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-white/30 mt-1.5 leading-snug">
                Sets the body map the Chamber shows when guiding fork placement.
              </p>
            </div>
          </div>

          <StepNav
            onNext={() => setStep(1)}
            canNext={canProceedStep0}
            accentColor={accentColor}
            nextLabel="Begin Resonance Scan →"
          />
        </StepCard>
      )}

      {/* ── STEP 1: Planet Domain Questions ── */}
      {step === 1 && (
        <StepCard
          title="Full-Spectrum Resonance Scan"
          subtitle={`Primary → secondary → tertiary across all ten systems. Tap every statement that feels true right now — the more complete the scan, the more precise your calibration.${activePlanetCount > 0 ? ` ${activePlanetCount} activated.` : ''}`}
          wide
        >
          {/* v2 FIX 1 — pre-session energy baseline → enables BEFORE→AFTER + trend chart */}
          <div className="mb-5 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[12px] text-white/80 mb-2 font-medium">
              How is your energy right now? <span className="text-white/35">— sets your before/after baseline</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                const on = formData.energyBefore === n
                return (
                  <button
                    key={n}
                    onClick={() => setFormData({ energyBefore: n })}
                    className="flex-1 rounded text-[12px] transition-all duration-200"
                    style={{
                      minHeight: 40,
                      background: on ? rgba(accentColor, 0.28) : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.1)'}`,
                      color: on ? accentColor : 'rgba(255,255,255,0.5)', cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between text-[9px] text-white/35 tracking-widest mt-1">
              <span>DEPLETED</span><span>CHARGED</span>
            </div>
          </div>

          {/* Directive S — the light somatic moment. One flowing question, a few
              taps. Feeds the body-zone resolver (WHERE) + autonomic axis (state). */}
          <div className="mb-5 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[12px] text-white/80 mb-2 font-medium">
              Where are you holding it today? <span className="text-white/35">— optional</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ZONE_CHIPS.map(z => {
                const sel = (formData.bodyZones ?? []).includes(z.key)
                return (
                  <button
                    key={z.key}
                    onClick={() => {
                      const cur = formData.bodyZones ?? []
                      let next: string[]
                      if (z.key === 'none') next = sel ? [] : ['none']
                      else next = sel ? cur.filter(k => k !== z.key) : [...cur.filter(k => k !== 'none'), z.key]
                      setFormData({ bodyZones: next })
                    }}
                    className="rounded-full text-[12px] px-3 py-1.5 transition-all duration-200"
                    style={{
                      background: sel ? rgba(accentColor, 0.22) : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${sel ? accentColor : 'rgba(255,255,255,0.12)'}`,
                      color: sel ? accentColor : 'rgba(255,255,255,0.6)', cursor: 'pointer',
                    }}
                  >
                    {z.label}
                  </button>
                )
              })}
            </div>
            <div className="text-[12px] text-white/80 mb-2 font-medium">Wired or weary?</div>
            <div className="flex gap-1.5">
              {([['wired', 'Wired'], ['weary', 'Weary']] as const).map(([val, label]) => {
                const on = formData.autonomic === val
                return (
                  <button
                    key={val}
                    onClick={() => setFormData({ autonomic: on ? null : val })}
                    className="flex-1 rounded-lg text-[12px] py-2 transition-all duration-200"
                    style={{
                      background: on ? rgba(accentColor, 0.22) : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.12)'}`,
                      color: on ? accentColor : 'rgba(255,255,255,0.55)', cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLANETS.map(planet => {
              const activePlanetQuestions = planet.questions.filter(q =>
                questionSelections.includes(q.key)
              )
              const isActive = activePlanetQuestions.length > 0
              const isBalanced = balancedPlanets.includes(planet.planet)
              const accentOn = isActive || isBalanced
              // v2 FIX 10a — answered cards collapse to a summary chip so the page
              // shrinks as the user progresses. Tapping re-expands for editing.
              // View state ONLY — all selections stay recorded + scored.
              const collapsed = accentOn && !reExpanded[planet.planet]
              if (collapsed) {
                const stateLabel = isBalanced ? 'balanced & strong' : `${activePlanetQuestions.length} active`
                return (
                  <button
                    key={planet.planet}
                    onClick={() => setReExpanded(s => ({ ...s, [planet.planet]: true }))}
                    className="text-left rounded-xl transition-all duration-300 flex items-center gap-2"
                    style={{
                      background: rgba(planet.color, 0.1),
                      border: `1px solid ${rgba(planet.color, 0.35)}`,
                      padding: '12px 14px', cursor: 'pointer', minHeight: 44,
                    }}
                  >
                    <span className="font-cinzel text-lg leading-none" style={{ color: planet.color }}>{planet.glyph}</span>
                    <span className="font-cinzel font-semibold text-[13px]" style={{ color: planet.color }}>{planet.planet}</span>
                    <span className="text-[11px] text-white/55">· {stateLabel}</span>
                    <span className="ml-auto text-[10px] text-white/35">tap to edit ✎</span>
                  </button>
                )
              }

              return (
                <div
                  key={planet.planet}
                  className="rounded-xl transition-all duration-300"
                  style={{
                    background: accentOn ? rgba(planet.color, 0.08) : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${accentOn ? rgba(planet.color, 0.35) : 'rgba(255,255,255,0.07)'}`,
                    padding: '14px 16px',
                  }}
                >
                  {/* Planet header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="font-cinzel text-lg leading-none"
                      style={{ color: planet.color }}
                    >
                      {planet.glyph}
                    </span>
                    <div>
                      <div
                        className="font-cinzel font-semibold text-[13px] leading-none"
                        style={{ color: isActive ? planet.color : 'rgba(255,255,255,0.7)' }}
                      >
                        {planet.planet}
                      </div>
                      <div className="text-[9px] tracking-[0.15em] text-white/30 uppercase mt-0.5">
                        {planet.domain}
                      </div>
                    </div>
                    {accentOn ? (
                      <button
                        onClick={() => setReExpanded(s => ({ ...s, [planet.planet]: false }))}
                        className="ml-auto text-[10px]"
                        style={{ color: rgba(planet.color, 0.85), background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        ▴ collapse
                      </button>
                    ) : (
                      <div className="ml-auto text-[9px] text-white/20 hidden sm:block">
                        {planet.hz} Hz
                      </div>
                    )}
                  </div>

                  {/* Questions */}
                  <div className="space-y-2">
                    {planet.questions.map(q => {
                      const selected = questionSelections.includes(q.key)
                      return (
                        <button
                          key={q.key}
                          onClick={() => handleToggleQuestion(q.key, q.symptomTag, planet.planet)}
                          className="w-full text-left flex items-start gap-2 transition-all duration-200 rounded-lg"
                          style={{
                            background: selected ? rgba(planet.color, 0.12) : 'transparent',
                            border: `1px solid ${selected ? rgba(planet.color, 0.4) : 'rgba(255,255,255,0.06)'}`,
                            padding: '8px 10px',
                          }}
                        >
                          <span
                            className="flex-shrink-0 mt-0.5 rounded-sm text-[10px] flex items-center justify-center"
                            style={{
                              width: 14, height: 14,
                              background: selected ? planet.color : 'rgba(255,255,255,0.1)',
                              color: selected ? '#000' : 'rgba(255,255,255,0.3)',
                            }}
                          >
                            {selected ? '✓' : ''}
                          </span>
                          <span
                            className="text-[12px] leading-snug"
                            style={{ color: selected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}
                          >
                            {q.text}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Directive I.1 — balance/strength signal. One extra tap;
                      mutually exclusive with this planet's imbalance taps. */}
                  <button
                    onClick={() => handleMarkBalanced(planet)}
                    className="w-full mt-2 flex items-center gap-2 rounded-lg transition-all duration-200"
                    style={{
                      background: isBalanced ? rgba(planet.color, 0.14) : 'rgba(255,255,255,0.02)',
                      border: `1px dashed ${isBalanced ? rgba(planet.color, 0.5) : 'rgba(255,255,255,0.12)'}`,
                      padding: '7px 10px',
                    }}
                  >
                    <span
                      className="flex-shrink-0 rounded-full text-[10px] flex items-center justify-center"
                      style={{
                        width: 14, height: 14,
                        background: isBalanced ? planet.color : 'rgba(255,255,255,0.08)',
                        color: isBalanced ? '#000' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {isBalanced ? '✓' : '＋'}
                    </span>
                    <span
                      className="text-[11px] leading-snug"
                      style={{ color: isBalanced ? planet.color : 'rgba(255,255,255,0.45)' }}
                    >
                      This feels balanced &amp; strong for me
                    </span>
                  </button>

                  {/* FIX 6 — what this resource feels like, when marked strong */}
                  {isBalanced && (
                    <div className="mt-2 pl-1">
                      <div className="text-[8px] tracking-[0.2em] uppercase mb-1" style={{ color: rgba(planet.color, 0.7) }}>
                        A resource you can draw from
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(BALANCE_DESCRIPTORS[planet.planet] ?? []).map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 rounded-full text-[10px]"
                            style={{ background: rgba(planet.color, 0.1), border: `1px solid ${rgba(planet.color, 0.3)}`, color: 'rgba(255,255,255,0.8)' }}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Body area */}
                  <div className="mt-2 text-[9px] text-white/20 tracking-wide">
                    {planet.bodyArea}
                  </div>
                </div>
              )
            })}
          </div>

          {/* v2 FIX 10b — persistent "n of 10 scanned" + sticky Continue (never below the fold) */}
          <div className="sticky bottom-3 z-20 mt-6">
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
              style={{ background: 'rgba(5,7,20,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${rgba(accentColor, 0.3)}` }}
            >
              <button
                onClick={() => setStep(0)}
                className="text-[12px] text-white/55 hover:text-white/80 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, padding: '0 10px' }}
              >
                ← Back
              </button>
              <div className="flex-1 text-center text-[11px] tracking-[0.15em] uppercase text-white/60">
                {scannedPlanetCount} of 10 systems scanned
              </div>
              <button
                onClick={() => setStep(2)}
                className="rounded-xl px-5 font-medium text-[12px]"
                style={{ background: `linear-gradient(135deg, ${rgba(accentColor, 0.9)} 0%, ${rgba(accentColor, 0.55)} 100%)`, color: '#020208', cursor: 'pointer', minHeight: 44 }}
              >
                {activePlanetCount > 0 ? `Continue — ${activePlanetCount} →` : 'Continue →'}
              </button>
            </div>
          </div>
        </StepCard>
      )}

      {/* ── STEP 2: Narrative ── */}
      {step === 2 && (
        <StepCard
          title="In Your Own Words"
          subtitle="Describe what's going on with you right now. Your words help shape today's calibration — Astryx looks for themes like mental acceleration, emotional heaviness, grounding need, or vitality depletion."
        >
          <div className="space-y-4">
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <textarea
                ref={narrativeRef}
                value={formData.narrative || ''}
                onChange={e => {
                  setFormData({ narrative: e.target.value })
                  if (narrativeError) setNarrativeError('')
                }}
                placeholder="What's happening in your body, mind, and life right now? What brought you here today? You can describe physical sensations, emotional patterns, recurring themes, challenges, or anything that feels relevant — there's no wrong way to describe it. The more honest and specific, the more precise your calibration will be."
                rows={7}
                className="w-full bg-transparent text-white/85 placeholder-white/20 text-[13px] leading-relaxed outline-none resize-none p-4"
                style={{ fontFamily: 'inherit' }}
              />
              <div
                className="flex justify-between items-center px-4 py-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-[10px] text-white/20">
                  {(formData.narrative || '').length < 30 && (formData.narrative || '').length > 0
                    ? 'A bit more detail will give the system more to work with'
                    : (formData.narrative || '').length >= 30
                    ? '✦ Narrative captured'
                    : 'Optional — but the more you share, the more precise your protocol'}
                </span>
                <span className="text-[10px] text-white/20">
                  {(formData.narrative || '').split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            {narrativeError && (
              <p className="text-[11px] text-red-400/70">{narrativeError}</p>
            )}

            {/* Show active planets from step 1 as resonance preview */}
            {questionSelections.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: rgba(accentColor, 0.05), border: `1px solid ${rgba(accentColor, 0.15)}` }}
              >
                <div className="text-[9px] tracking-[0.25em] text-white/30 uppercase mb-2">
                  Planets activated from resonance scan
                </div>
                <div className="flex flex-wrap gap-2">
                  {PLANETS.filter(p => p.questions.some(q => questionSelections.includes(q.key))).map(p => (
                    <span
                      key={p.planet}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px]"
                      style={{
                        background: rgba(p.color, 0.12),
                        border: `1px solid ${rgba(p.color, 0.35)}`,
                        color: p.color,
                      }}
                    >
                      <span className="font-cinzel">{p.glyph}</span>
                      {p.planet}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <StepNav
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            canNext
            accentColor={accentColor}
            nextLabel="Set Your Intention →"
          />
        </StepCard>
      )}

      {/* ── STEP 3: Intention ── */}
      {step === 3 && (
        <StepCard
          title="Set Your Intention"
          subtitle="What do you want to call in through this calibration? This anchors the protocol to your desired frequency."
        >
          <div className="space-y-4">
            {/* Open intention text */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <textarea
                value={formData.intentionText || ''}
                onChange={e => setFormData({ intentionText: e.target.value })}
                placeholder="Write your intention in your own words... (e.g., 'I want to release the tension I've been carrying and reconnect with my sense of calm and clarity')"
                rows={3}
                className="w-full bg-transparent text-white/85 placeholder-white/20 text-[13px] leading-relaxed outline-none resize-none p-4"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            {/* Quick chips */}
            <div>
              <div className="text-[10px] tracking-[0.2em] text-white/30 uppercase mb-2">
                Or select what resonates
              </div>
              <div className="flex flex-wrap gap-2">
                {INTENTION_CHIPS.map(chip => {
                  const active = intentionChips.includes(chip)
                  return (
                    <button
                      key={chip}
                      onClick={() => handleToggleIntentionChip(chip)}
                      className="px-3 py-1.5 rounded-full text-[12px] transition-all duration-200"
                      style={{
                        background: active ? rgba(accentColor, 0.18) : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${active ? rgba(accentColor, 0.5) : 'rgba(255,255,255,0.1)'}`,
                        color: active ? accentColor : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {chip}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Summary of what's been captured */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-[9px] tracking-[0.25em] text-white/25 uppercase mb-3">
                Calibration Summary
              </div>
              <SummaryRow
                label="Chart"
                value={`${formData.name} · ${formData.birthDate}${birthTimeUnknown ? ' · ☉ Solar' : formData.birthTime ? ` · ${formData.birthTime}` : ''} · ${formData.birthLocation}`}
                color={accentColor}
              />
              {activePlanetCount > 0 && (
                <SummaryRow
                  label="Activated planets"
                  value={PLANETS.filter(p => p.questions.some(q => questionSelections.includes(q.key))).map(p => `${p.glyph} ${p.planet}`).join('  ')}
                  color={accentColor}
                />
              )}
              {balancedPlanets.length > 0 && (
                <SummaryRow
                  label="Strong / resourced"
                  value={PLANETS.filter(p => balancedPlanets.includes(p.planet)).map(p => `${p.glyph} ${p.planet}`).join('  ')}
                  color={accentColor}
                />
              )}
              {(formData.narrative || '').trim().length > 0 && (
                <SummaryRow
                  label="Narrative"
                  value={`${(formData.narrative || '').split(/\s+/).filter(Boolean).length} words captured`}
                  color={accentColor}
                />
              )}
              {(formData.intentionText || intentionChips.length > 0) && (
                <SummaryRow
                  label="Intention"
                  value={[formData.intentionText, ...intentionChips].filter(Boolean).join(' · ').slice(0, 80) + ((formData.intentionText || '').length > 80 ? '…' : '')}
                  color={accentColor}
                />
              )}
            </div>
          </div>

          {/* Generate Protocol — premium Magnetic Button-in-Button */}
          <div className="mt-8">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || interpreting}
              className="group w-full flex items-center justify-between pl-7 pr-2 py-2.5 rounded-full kowalski-button"
              style={{
                background: canAnalyze && !interpreting
                  ? `linear-gradient(135deg, ${rgba(accentColor, 0.30)} 0%, ${rgba(accentColor, 0.14)} 100%)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${canAnalyze && !interpreting ? rgba(accentColor, 0.55) : 'rgba(255,255,255,0.10)'}`,
                color: canAnalyze && !interpreting ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)',
                cursor: canAnalyze && !interpreting ? 'pointer' : 'not-allowed',
                boxShadow: canAnalyze && !interpreting ? `0 22px 44px -18px ${rgba(accentColor, 0.55)}` : 'none',
                transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
              }}
            >
              {interpreting ? (
                <span className="flex items-center gap-3 mx-auto py-1">
                  <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span className="font-cinzel font-semibold text-[14px] tracking-[0.18em] uppercase text-content">
                    Reading your frequency
                  </span>
                </span>
              ) : (
                <>
                  <span
                    className="font-cinzel font-semibold tracking-[0.18em] uppercase"
                    style={{ fontSize: 'clamp(14px, 1.6vw, 16px)' }}
                  >
                    Generate my protocol
                  </span>
                  <span
                    className="btn-magnetic-icon w-12 h-12 rounded-full flex items-center justify-center text-[18px]"
                    style={{
                      background: canAnalyze ? rgba(accentColor, 0.32) : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${canAnalyze ? rgba(accentColor, 0.55) : 'rgba(255,255,255,0.10)'}`,
                      color: 'rgba(255,255,255,0.95)',
                    }}
                  >
                    ✦
                  </span>
                </>
              )}
            </button>

            {!canAnalyze && (
              <p className="text-center text-[12px] text-content-sm mt-3">
                Complete your birth details in Step 1 to continue
              </p>
            )}
          </div>

          {/* Back link — quiet tertiary */}
          <div className="mt-5 text-center">
            <button
              onClick={() => setStep(2)}
              className="text-[11px] uppercase tracking-[0.3em] text-label hover:text-content transition-colors"
              style={{ transitionDuration: '300ms' }}
            >
              ← Back
            </button>
          </div>
        </StepCard>
      )}

      {/* Footer micro-disclaimer */}
      <p className="text-center text-[11px] text-meta mt-10 max-w-md tracking-wider">
        ⓘ Reference tool · Not medical advice · Astryx may suggest patterns, not diagnose conditions
      </p>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function StepCard({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} animate-fade-in-up`}>
      {/* Double-Bezel shell */}
      <div className="bezel-shell">
        <div className="bezel-core relative p-6 sm:p-9">
          {/* Aurora wash */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(circle at 95% 0%, rgba(94,224,255,0.15) 0%, transparent 55%)',
            }}
          />
          <div className="relative">
            <div className="mb-7">
              <h2
                className="font-cinzel font-semibold tracking-tight leading-[1.1] mb-3"
                style={{
                  fontSize: 'clamp(26px, 4vw, 36px)',
                  color: 'rgba(255,255,255,0.95)',
                  textWrap: 'balance' as any,
                }}
              >
                {title}
              </h2>
              <p
                className="text-content max-w-[60ch]"
                style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', lineHeight: 1.6 }}
              >
                {subtitle}
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function IntakeField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] text-white/30 uppercase mb-1.5">{label}</div>
      <div
        className="px-3 py-2.5 rounded-lg"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function StepNav({
  onBack,
  onNext,
  canNext,
  accentColor,
  nextLabel = 'Continue',
}: {
  onBack?: () => void
  onNext: () => void
  canNext: boolean
  accentColor: string
  nextLabel?: string
}) {
  const r = parseInt(accentColor.slice(1, 3), 16)
  const g = parseInt(accentColor.slice(3, 5), 16)
  const b = parseInt(accentColor.slice(5, 7), 16)
  const ac = (a: number) => `rgba(${r},${g},${b},${a})`

  // strip trailing arrow/punctuation from passed label
  const cleanLabel = nextLabel.replace(/[→›→]\s*$/, '').trim()

  return (
    <div className={`flex gap-3 mt-8 ${onBack ? 'justify-between' : 'justify-end'}`}>
      {onBack && (
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full kowalski-button"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.65)',
            cursor: 'pointer',
            transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
          }}
        >
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[14px]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            ←
          </span>
          <span className="text-[11px] uppercase tracking-[0.25em]">Back</span>
        </button>
      )}
      <button
        onClick={canNext ? onNext : undefined}
        disabled={!canNext}
        className="group flex-1 flex items-center justify-between pl-6 pr-2 py-2 rounded-full kowalski-button"
        style={{
          background: canNext
            ? `linear-gradient(135deg, ${ac(0.22)} 0%, ${ac(0.10)} 100%)`
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${canNext ? ac(0.5) : 'rgba(255,255,255,0.10)'}`,
          color: canNext ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)',
          cursor: canNext ? 'pointer' : 'not-allowed',
          boxShadow: canNext ? `0 16px 36px -16px ${ac(0.5)}` : 'none',
          transition: 'all 500ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <span className="font-cinzel font-semibold text-[13px] sm:text-[14px] tracking-[0.18em] uppercase">
          {cleanLabel}
        </span>
        <span
          className="btn-magnetic-icon w-10 h-10 rounded-full flex items-center justify-center text-[16px]"
          style={{
            background: canNext ? ac(0.32) : 'rgba(255,255,255,0.06)',
            border: `1px solid ${canNext ? ac(0.55) : 'rgba(255,255,255,0.10)'}`,
            color: canNext ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)',
          }}
        >
          →
        </span>
      </button>
    </div>
  )
}

function SummaryRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex gap-2 text-[11px]">
      <span className="text-white/30 flex-shrink-0 w-28">{label}</span>
      <span className="text-white/60 truncate">{value}</span>
    </div>
  )
}
