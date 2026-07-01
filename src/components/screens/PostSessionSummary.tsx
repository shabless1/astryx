'use client'

/**
 * ASTRYX — Post-Session Summary + Outtake Flow (Phase 1 · Chamber session loop)
 *
 * The "After" half of the Before → During → After → Next loop. When a Chamber
 * session completes, the Chamber hands a SessionSummarySnapshot forward and the
 * app routes HERE (never backward to Results). The user:
 *
 *   1. SESSION SUMMARY        — a clean recap of what just happened
 *   2. POST-SESSION CHECK-IN  — how do you feel now (mood / energy / body / mind)
 *   3. CONTINUATION PROTOCOL  — what to carry forward, generated from the session
 *   4. SAVE / PROGRESS        — save to Progress History; compare before ↔ after
 *
 * SCOPE (Phase 1 only): Sacred Tea matching + color therapy continuation are
 * LATER phases. Tea here is a PLACEHOLDER drawn from the existing taste protocol.
 * Practitioner mode adds notes + vagal tone and writes a ClientSession.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import type {
  SessionSummarySnapshot, PostSessionAnswers, ContinuationProtocol, ProgressEntry,
} from '@/types'
import { useAppStore } from '@/lib/store'
import { GlassCard, SectionLabel } from '@/components/ui'
import { hexToRgba, formatTime } from '@/lib/utils'
import { MICRO_DISCLAIMER } from '@/lib/compliance'
import { matchSacredTeaForPostSession, type SacredTeaResult } from '@/lib/tea/SacredTeaMatchingEngine'
import TeacherChat from '@/components/teacher/TeacherChat'
import ExploreDeeperCards from '@/components/screens/dashboard/ExploreDeeperCards'

// Shop links gate on SHA's own products only (sacredtea.net), per the shop flag.
const SHOP_LIVE = process.env.NEXT_PUBLIC_SHOP_LIVE === 'true'
const SHOP_URL = 'https://sacredtea.net'

// ─── CHECK-IN OPTION SETS (per directive Section 2) ──────────
const FEELING_OPTIONS = [
  'Calmer', 'Clearer', 'Grounded', 'Lighter', 'Emotional',
  'Energized', 'Sleepy', 'Heavy', 'Still activated', 'No noticeable change',
]
const BODY_OPTIONS = [
  'Settled', 'Restless', 'Warm', 'Cool', 'Tingling',
  'Heavy', 'Relaxed', 'Tense', 'Open', 'Unchanged',
]
const MENTAL_OPTIONS = [
  'Clearer', 'Quieter', 'Still racing', 'Focused', 'Foggy',
  'Reflective', 'Emotional', 'Neutral',
]
const PLACEMENT_ACCURACY: PostSessionAnswers['placementAccuracy'][] = ['Yes', 'Somewhat', 'No', 'Not sure']
const CHAMBER_SUPPORT: PostSessionAnswers['chamberSupport'][] = ['Yes', 'Somewhat', 'No', 'Too intense', 'Too soft']
const VAGAL_LABELS = ['Dysregulated', 'Activated', 'Neutral', 'Regulated', 'Deep Coherence']

const POSITIVE_FEELINGS = ['Calmer', 'Clearer', 'Grounded', 'Lighter', 'Relaxed']

// Fix 14 — the "nothing shifted" option in each set is mutually exclusive with
// the substantive options: you can't be both "No noticeable change" AND "Calmer".
const EXCLUSIVE_OPTION: Record<'feeling' | 'bodyState' | 'mentalState', string> = {
  feeling:     'No noticeable change',
  bodyState:   'Unchanged',
  mentalState: 'Neutral',
}

// ─── CONTINUATION GENERATOR (directive Section 3) ────────────
// Builds the continuation protocol from the session snapshot + the user's
// answers. The answer-driven branches use the directive's exact guidance lines.
function buildContinuation(
  snap: SessionSummarySnapshot,
  ans: PostSessionAnswers,
): ContinuationProtocol {
  const primary = snap.planetaryCarrier
  const feeling = ans.feeling ?? []

  // Answer-driven note — plain, kind, simple (an 8-year-old could read it).
  let responseNote: string | undefined
  if (ans.chamberSupport === 'Too intense') {
    responseNote = 'That felt like a lot. Next time, make it shorter and hold the fork a little farther away.'
  } else if (ans.chamberSupport === 'Too soft') {
    responseNote = 'Next time, let the sound play all the way and hold the fork a little closer.'
  } else if (feeling.includes('Still activated')) {
    responseNote = 'Still a little buzzy? Later, just play the calming fork again — not the whole thing.'
  } else if (feeling.includes('Sleepy')) {
    responseNote = 'Feeling sleepy is okay. Drink some water, rest, and skip another session for now.'
  } else if (feeling.some((f) => ['Clearer', 'Calmer', 'Grounded'].includes(f))) {
    responseNote = 'That felt good — let’s remember this one.'
  }

  // Fork follow-up — simple "do this next" language.
  let forkFollowUp = `Tomorrow, play your ${primary} sound on its own, then finish calm and grounded.`
  if (ans.chamberSupport === 'Too intense') {
    forkFollowUp = `Next time, hold the ${primary} fork farther away and keep it short.`
  } else if (ans.chamberSupport === 'Too soft') {
    forkFollowUp = `Next time, hold the ${primary} fork a little closer and let it play all the way.`
  } else if (feeling.includes('Still activated')) {
    forkFollowUp = 'Later, just play the calming fork again — not the whole session.'
  }

  // What to skip today.
  let whatToAvoid = 'Take it easy today. Let the calm settle on its own.'
  if (feeling.includes('Sleepy')) {
    whatToAvoid = 'Don’t do another session right now, and skip coffee or energy drinks. Rest and drink water.'
  } else if (ans.chamberSupport === 'Too intense') {
    whatToAvoid = 'Keep things light today. If you add anything, keep it short and gentle.'
  }

  return {
    focus: snap.chamberFocus,
    forkFollowUp,
    teaPlaceholder: snap.tasteTea
      ? `Sip ${snap.tasteTea} slowly today. There’s a ready-made one below.`
      : 'Have your calming tea today, slow and easy. There’s a ready-made one below.',
    breath: snap.breathProtocol,
    color: snap.colorProtocol,
    bodyAreaToObserve: snap.primaryBodyPlacement,
    whatToAvoid,
    nextCheckIn: 'Check back tomorrow (or before your next session) and notice how you feel.',
    responseNote,
  }
}

// ─── DOWNLOAD CONTINUATION CARD ──────────────────────────────
function downloadContinuationCard(
  snap: SessionSummarySnapshot,
  cont: ContinuationProtocol,
  clientName?: string | null,
): void {
  if (typeof window === 'undefined') return
  const rows: [string, string][] = [
    ['Focus', cont.focus],
    ['Fork follow-up', cont.forkFollowUp],
    ['Tea', cont.teaPlaceholder],
    ['Breath', cont.breath],
    ['Color', cont.color ?? '—'],
    ['Body area to observe', cont.bodyAreaToObserve],
    ['What to avoid today', cont.whatToAvoid],
    ['Next check-in', cont.nextCheckIn],
  ]
  if (cont.responseNote) rows.push(['Note', cont.responseNote])
  const body = rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')
  const html = `<!doctype html><html><head><title>Astryx — Continuation Card</title>
  <style>body{font-family:Georgia,serif;margin:36px;color:#111;max-width:640px}
  h1{font-size:18px;letter-spacing:2px}h2{font-size:13px;color:#555;font-weight:normal;margin-top:-6px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:18px}
  th,td{border:1px solid #bbb;padding:8px 10px;text-align:left;vertical-align:top}
  th{background:#f2f2f2;width:170px}p{font-size:11px;color:#555;margin-top:18px}</style></head><body>
  <h1>ASTRYX — CONTINUATION CARD${clientName ? ` · ${clientName}` : ''}</h1>
  <h2>${snap.planetaryCarrier} · ${snap.signalState}</h2>
  <table>${body}</table>
  <p>ⓘ Reference tool · Not medical advice. The licensed practitioner is responsible for clinical interpretation and safety.</p>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html); w.document.close(); w.focus(); w.print()
}

// ─── PROPS ───────────────────────────────────────────────────
interface PostSessionSummaryProps {
  snapshot: SessionSummarySnapshot | null
  accentColor: string
  onViewProgress: () => void
  onRepeatChamber: () => void
  onReturnHome: () => void
  onDone: () => void   // clears the pending session + leaves the flow
  /** Embedded inside the Dashboard's Summary Report tab — strips page chrome,
   *  the big header, and the Explore Deeper cards (those are their own tab). */
  embedded?: boolean
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function PostSessionSummary({
  snapshot, accentColor, onViewProgress, onRepeatChamber, onReturnHome, onDone, embedded = false,
}: PostSessionSummaryProps) {
  const addSessionLog    = useAppStore((s) => s.addSessionLog)
  const addClientSession = useAppStore((s) => s.addClientSession)
  const getActiveClient  = useAppStore((s) => s.getActiveClient)
  const dailyElement     = useAppStore((s) => s.dailyElement)   // FIX 5 — element action

  const [answers, setAnswers] = useState<PostSessionAnswers>({
    feeling: [], bodyState: [], mentalState: [],
  })
  const [saved, setSaved] = useState<ProgressEntry | null>(null)
  const savedRef = useRef(false)   // Fix 3 — synchronous guard against double-save
  const [askOpen, setAskOpen] = useState(false)   // FIX 7 — Ask Astryx (learn-more) tab

  // Graceful guard — if the snapshot was lost (e.g. a refresh), don't dead-end.
  if (!snapshot) {
    if (embedded) {
      return (
        <div className="text-center py-10">
          <div className="text-3xl mb-3 opacity-30">◎</div>
          <p className="text-[13px] text-white/55">No session to summarize yet. Begin today&apos;s session and it will appear here.</p>
        </div>
      )
    }
    return (
      <div className="min-h-screen font-rajdhani flex items-center justify-center px-5">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4 opacity-30">◎</div>
          <h1 className="font-cinzel text-xl text-white mb-2">No active session</h1>
          <p className="text-[13px] text-white/55 mb-6">
            This session has already been wrapped up, or the page was refreshed.
            Your saved sessions are in your Progress.
          </p>
          <div className="flex flex-col gap-2.5">
            <ActionButton label="View My Progress" onClick={onViewProgress} accent={accentColor} filled />
            <ActionButton label="Return Home" onClick={onReturnHome} accent={accentColor} />
          </div>
        </GlassCard>
      </div>
    )
  }

  const accent = snapshot.accentColor || accentColor
  const client = snapshot.isPractitioner ? getActiveClient() : null
  const continuation = buildContinuation(snapshot, answers)

  // FIX 7 — the STONE to carry today, read from the session's protocol snapshot
  // (the engine's already-selected featured crystal for the primary signature).
  const rx0 = snapshot.protocolSnapshot?.prescriptions?.[0]
  const stone = rx0?.crystal?.featuredCrystal
  const stonePlacement = rx0?.crystal?.featuredCrystalData?.bodyPlacement
  const stoneSafety = (rx0?.safetyNotes ?? []).filter(Boolean)

  // Phase 2 — Sacred Tea Support layer. Reacts live to the outtake answers so
  // the prepared match adjusts as the user checks in (e.g. "Too intense" holds
  // Phoenix back). Optional convenience layer; the remedy logic above is intact.
  const teaMatch = useMemo<SacredTeaResult>(
    () => matchSacredTeaForPostSession(snapshot, answers),
    [snapshot, answers],
  )

  const toggle = (key: 'feeling' | 'bodyState' | 'mentalState', value: string) =>
    setAnswers((a) => {
      const cur = a[key]
      const sentinel = EXCLUSIVE_OPTION[key]
      if (cur.includes(value)) return { ...a, [key]: cur.filter((v) => v !== value) }
      // Fix 14 — selecting the "nothing shifted" sentinel clears the substantive
      // options; selecting any substantive option clears the sentinel.
      if (value === sentinel) return { ...a, [key]: [value] }
      return { ...a, [key]: [...cur.filter((v) => v !== sentinel), value] }
    })

  const handleSave = () => {
    if (saved || savedRef.current) return        // Fix 3 — no duplicate History cards
    savedRef.current = true
    // Fix 3 — the date/time is computed HERE, from the user's local clock at the
    // instant of saving, and stored as a single ISO timestamp (the source of
    // truth). Display labels are derived in local time at render — never stored,
    // never the stale app-load date.
    const dateTime = new Date().toISOString()
    const entry: ProgressEntry = {
      id: crypto.randomUUID(),
      dateTime,
      userMode: snapshot.isPractitioner ? 'practitioner' : 'user',
      planetaryCarrier:    snapshot.planetaryCarrier,
      signalState:         snapshot.signalState,
      correctiveDirection: snapshot.correctiveDirection,
      selectedSessionContainer: snapshot.selectedSessionContainer,
      intention:           snapshot.intention,
      sacredTeaSupport:    teaMatch.preparedMatch?.recommendedBlend,
      forkSequence:        snapshot.forkSequence,
      bodyPlacements:      snapshot.bodyPlacements,
      sessionDuration:     snapshot.sessionDurationSec,
      preSessionState:     { symptoms: snapshot.preSessionSymptoms, emotional: snapshot.preSessionEmotional },
      postSessionState:    answers,
      energyBefore:        snapshot.energyBefore,
      energyRating:        answers.energyLevel,
      bodyState:           answers.bodyState,
      mentalState:         answers.mentalState,
      chamberSupportRating: answers.chamberSupport,
      forkPlacementRating:  answers.placementAccuracy,
      notes:               answers.notes,
      continuationProtocol: continuation,
    }
    addSessionLog(entry)

    // Practitioner: also write a ClientSession to the active client's history.
    if (snapshot.isPractitioner && snapshot.activeClientId) {
      addClientSession({
        id: crypto.randomUUID(),
        clientId: snapshot.activeClientId,
        date: dateTime,
        forksUsed: snapshot.forkPlanetsUsed,
        crystalsUsed: snapshot.crystalsUsed,
        vagalToneRating: answers.vagalToneRating,
        notes: [answers.practitionerNotes, answers.notes].filter(Boolean).join('\n\n'),
        protocolSnapshot: snapshot.protocolSnapshot,
      })
    }
    setSaved(entry)
  }

  return (
    <div className={embedded ? 'font-rajdhani' : 'min-h-screen font-rajdhani'}>
      <div
        className={embedded ? 'max-w-2xl mx-auto' : 'max-w-2xl mx-auto px-5'}
        style={embedded ? { paddingBottom: 12 } : { paddingTop: 96, paddingBottom: 72 }}
      >

        {/* Header (full-page only — the Dashboard tab supplies its own title) */}
        {!embedded && (
          <div className="mb-7 animate-fade-in-up text-center">
            <SectionLabel>Session Complete</SectionLabel>
            <h1 className="font-cinzel text-3xl text-white mt-1">
              {saved ? 'Saved to your progress' : 'Recalibration Summary'}
            </h1>
            {client && (
              <div className="text-[12px] tracking-[0.2em] text-white/50 mt-2 uppercase">Client · {client.name}</div>
            )}
          </div>
        )}
        {embedded && saved && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-[12.5px] text-content"
               style={{ background: hexToRgba(accent, 0.12), border: `1px solid ${hexToRgba(accent, 0.35)}` }}>
            Saved to your progress.
          </div>
        )}

        {/* ── SECTION 1 — SESSION SUMMARY ── */}
        <GlassCard className="p-6 mb-5 animate-fade-in-up">
          <div className="text-[10px] uppercase tracking-[0.28em] mb-4" style={{ color: hexToRgba(accent, 0.9) }}>
            Today&apos;s Resonance
          </div>
          <div className="space-y-3">
            <SummaryRow label="Signal" accent={accent}>
              <span className="font-cinzel text-[22px]" style={{ color: accent }}>{snapshot.signalState}</span>
              <span className="text-[13px] text-white/60 ml-2">· {snapshot.planetaryCarrier}</span>
            </SummaryRow>
            <SummaryRow label="Calibration Response" accent={accent}>
              <span className="text-[14px] text-white/85 leading-snug">{snapshot.correctiveDirection}</span>
            </SummaryRow>
            <SummaryRow label="Fork Sequence" accent={accent}>
              <span className="text-[14px] text-white/85">{snapshot.forkSequence.join(' → ')}</span>
            </SummaryRow>
            <SummaryRow label="Session Duration" accent={accent}>
              <span className="text-[14px] text-white/85">{formatTime(snapshot.sessionDurationSec)}</span>
            </SummaryRow>
            <SummaryRow label="Primary Body Placement" accent={accent}>
              <span className="text-[14px] text-white/85">{snapshot.primaryBodyPlacement}</span>
            </SummaryRow>
            <SummaryRow label="Chamber Focus" accent={accent}>
              <span className="text-[13px] text-white/70 italic leading-relaxed">{snapshot.chamberFocus}</span>
            </SummaryRow>
            {/* Fix 4/7 — the reasoning trace from the ONE protocol: proves the
                user's narrative + intention shaped this exact session. */}
            {snapshot.protocolSnapshot?.reasoningTrace?.whyThisSequence && (
              <SummaryRow label="Why This Session" accent={accent}>
                <span className="text-[13px] text-white/80 leading-relaxed">
                  {snapshot.protocolSnapshot.reasoningTrace.whyThisSequence}
                </span>
              </SummaryRow>
            )}
          </div>
        </GlassCard>

        {!saved ? (
          <>
            {/* ── SECTION 2 — POST-SESSION CHECK-IN ── */}
            <GlassCard className="p-6 mb-5 animate-fade-in-up">
              <div className="text-[10px] uppercase tracking-[0.28em] mb-4" style={{ color: hexToRgba(accent, 0.9) }}>
                Check-In
              </div>

              <ChipQuestion
                question="How do you feel now?"
                hint="Select any that fit"
                options={FEELING_OPTIONS}
                selected={answers.feeling}
                onToggle={(v) => toggle('feeling', v)}
                accent={accent}
              />

              <div className="mt-6">
                <QLabel>Energy level after session</QLabel>
                <Scale10
                  value={answers.energyLevel}
                  onChange={(n) => setAnswers((a) => ({ ...a, energyLevel: n }))}
                  accent={accent}
                />
              </div>

              <div className="mt-6">
                <ChipQuestion
                  question="Body state"
                  options={BODY_OPTIONS}
                  selected={answers.bodyState}
                  onToggle={(v) => toggle('bodyState', v)}
                  accent={accent}
                />
              </div>

              <div className="mt-6">
                <ChipQuestion
                  question="Mental state"
                  options={MENTAL_OPTIONS}
                  selected={answers.mentalState}
                  onToggle={(v) => toggle('mentalState', v)}
                  accent={accent}
                />
              </div>

              <div className="mt-6">
                <QLabel>Did the fork placement feel accurate?</QLabel>
                <SingleSelect
                  options={PLACEMENT_ACCURACY as string[]}
                  selected={answers.placementAccuracy}
                  onSelect={(v) => setAnswers((a) => ({ ...a, placementAccuracy: v as PostSessionAnswers['placementAccuracy'] }))}
                  accent={accent}
                />
                <input
                  type="text"
                  value={answers.feltMostWhere ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, feltMostWhere: e.target.value }))}
                  placeholder="Where did you feel the tone most? (optional)"
                  className="w-full mt-3 px-3 py-2.5 rounded-lg text-[13px] text-white placeholder:text-white/30"
                  style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div className="mt-6">
                <QLabel>Did the Chamber feel supportive?</QLabel>
                <SingleSelect
                  options={CHAMBER_SUPPORT as string[]}
                  selected={answers.chamberSupport}
                  onSelect={(v) => setAnswers((a) => ({ ...a, chamberSupport: v as PostSessionAnswers['chamberSupport'] }))}
                  accent={accent}
                />
              </div>

              <div className="mt-6">
                <QLabel>Notes</QLabel>
                <textarea
                  value={answers.notes ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, notes: e.target.value }))}
                  rows={3}
                  placeholder="What did you notice during or after the session?"
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] text-white resize-none placeholder:text-white/30"
                  style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Practitioner-only extras */}
              {snapshot.isPractitioner && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: hexToRgba(accent, 0.7) }}>
                    Practitioner
                  </div>
                  <QLabel>Vagal tone reading</QLabel>
                  <div className="flex gap-1.5 mb-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswers((a) => ({ ...a, vagalToneRating: n }))}
                        className="flex-1 py-2 rounded transition"
                        style={{
                          background: answers.vagalToneRating === n ? hexToRgba(accent, 0.25) : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${answers.vagalToneRating === n ? accent : 'rgba(255,255,255,0.1)'}`,
                          color: answers.vagalToneRating === n ? accent : 'rgba(255,255,255,0.55)', cursor: 'pointer',
                        }}
                      >
                        <div className="font-cinzel text-[14px]">{n}</div>
                        <div className="text-[8px] mt-0.5">{VAGAL_LABELS[n - 1]}</div>
                      </button>
                    ))}
                  </div>
                  <QLabel>Practitioner notes</QLabel>
                  <textarea
                    value={answers.practitionerNotes ?? ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, practitionerNotes: e.target.value }))}
                    rows={3}
                    placeholder="Clinical observations, what shifted, next steps for this client."
                    className="w-full px-3 py-2.5 rounded-lg text-[13px] text-white resize-none placeholder:text-white/30"
                    style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              )}
            </GlassCard>

            {/* ── SECTION 3 — CONTINUATION PROTOCOL ── */}
            <ContinuationCard cont={continuation} accent={accent} elementAction={dailyElement?.note} />
            <StoneCard stone={stone} placement={stonePlacement} safety={stoneSafety} accent={accent} />

            {/* ── Sacred Tea Support (Phase 2 — optional prepared match + DIY) ── */}
            <SacredTeaCard result={teaMatch} accent={accent} isPractitioner={snapshot.isPractitioner} />

            {/* ── SECTION 4 — SAVE ── */}
            <div className="flex flex-col gap-2.5 mt-6">
              <ActionButton label="Save Session" onClick={handleSave} accent={accent} filled />
              <div className="grid grid-cols-2 gap-2.5">
                <ActionButton label="Repeat Chamber" onClick={onRepeatChamber} accent={accent} />
                <ActionButton label="Return Home" onClick={onReturnHome} accent={accent} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── AFTER SAVE — before/after comparison + continuation + next actions ── */}
            <BeforeAfterCard snapshot={snapshot} entry={saved} accent={accent} />
            <ContinuationCard cont={saved.continuationProtocol} accent={accent} elementAction={dailyElement?.note} />
            <StoneCard stone={stone} placement={stonePlacement} safety={stoneSafety} accent={accent} />
            <SacredTeaCard result={teaMatch} accent={accent} isPractitioner={snapshot.isPractitioner} />
            <div className="flex flex-col gap-2.5 mt-6">
              <div className="grid grid-cols-2 gap-2.5">
                <ActionButton label="View My Progress" onClick={() => { onDone(); onViewProgress() }} accent={accent} filled />
                <ActionButton label="Repeat Chamber" onClick={onRepeatChamber} accent={accent} />
              </div>
              <ActionButton
                label="Download Continuation Card"
                onClick={() => downloadContinuationCard(snapshot, saved.continuationProtocol, client?.name)}
                accent={accent}
              />
              <ActionButton label="Return Home" onClick={onReturnHome} accent={accent} />
            </div>
          </>
        )}

        {/* FIX 7 — Ask Astryx (learn-more) tab on the summary */}
        <button
          onClick={() => setAskOpen(true)}
          className="kowalski-button w-full rounded-2xl px-5 py-3 mb-5 text-[13.5px] tracking-[0.02em]"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${hexToRgba(accent, 0.4)}`, color: 'rgba(255,255,255,0.88)' }}
        >
          Ask Astryx · learn more
        </button>

        {/* Full reference report — collapsible cards. In the Dashboard, this lives
            in its own "Explore Deeper" tab, so it's omitted when embedded. */}
        {!embedded && <ExploreDeeperCards protocol={snapshot.protocolSnapshot} accent={accent} />}

        <div className="text-[9px] text-white/35 text-center tracking-widest italic mt-8">
          {MICRO_DISCLAIMER}
        </div>
      </div>

      {/* Astryx — depth / continuity / learn-more (brain rebuilt sovereign in FIX 6) */}
      <TeacherChat open={askOpen} onClose={() => setAskOpen(false)} accentColor={accent} seed={null} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SummaryRow({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.25em] mb-0.5" style={{ color: hexToRgba(accent, 0.7) }}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

function QLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[13px] text-white/85 mb-2.5 font-medium">{children}</div>
}

function ChipQuestion({
  question, hint, options, selected, onToggle, accent,
}: {
  question: string; hint?: string; options: string[]; selected: string[]
  onToggle: (v: string) => void; accent: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="text-[13px] text-white/85 font-medium">{question}</span>
        {hint && <span className="text-[10px] text-white/35 tracking-wide">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="px-3 py-1.5 rounded-full text-[12px] transition"
              style={{
                background: on ? hexToRgba(accent, 0.22) : 'rgba(255,255,255,0.05)',
                border: `1px solid ${on ? accent : 'rgba(255,255,255,0.12)'}`,
                color: on ? accent : 'rgba(255,255,255,0.6)', cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SingleSelect({
  options, selected, onSelect, accent,
}: { options: string[]; selected?: string; onSelect: (v: string) => void; accent: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = selected === opt
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className="px-3.5 py-1.5 rounded-full text-[12px] transition"
            style={{
              background: on ? hexToRgba(accent, 0.22) : 'rgba(255,255,255,0.05)',
              border: `1px solid ${on ? accent : 'rgba(255,255,255,0.12)'}`,
              color: on ? accent : 'rgba(255,255,255,0.6)', cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function Scale10({ value, onChange, accent }: { value?: number; onChange: (n: number) => void; accent: string }) {
  return (
    <div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const on = value === n
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="flex-1 py-2 rounded text-[12px] transition"
              style={{
                background: on ? hexToRgba(accent, 0.28) : 'rgba(255,255,255,0.05)',
                border: `1px solid ${on ? accent : 'rgba(255,255,255,0.1)'}`,
                color: on ? accent : 'rgba(255,255,255,0.5)', cursor: 'pointer',
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
  )
}

// ─── Sacred Tea Support (Phase 2) ────────────────────────────
// Best Prepared Match (Sacred Tea, first) + Create-Your-Own Herbal Direction
// (general DIY, second). Optional support layer — never forced, never medical.
function SacredTeaCard({
  result, accent, isPractitioner,
}: { result: SacredTeaResult; accent: string; isPractitioner: boolean }) {
  const { preparedMatch: pm, diyHerbalDirection: diy } = result

  const matchTone: Record<string, string> = {
    'Exact Match': accent,
    'Strong Match': accent,
    'Partial Match': 'rgba(255,255,255,0.6)',
    'No Current Match': 'rgba(255,255,255,0.5)',
  }
  const badgeColor = matchTone[pm.matchLevel] ?? accent

  return (
    <GlassCard className="p-6 mb-5 animate-fade-in-up">
      <div className="text-[10px] uppercase tracking-[0.28em] mb-4" style={{ color: hexToRgba(accent, 0.9) }}>
        Sacred Tea Support
      </div>

      {/* Best Prepared Match — Sacred Tea, first */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="text-[9px] uppercase tracking-[0.22em] text-white/45">Best Prepared Match</div>
        <span className="px-2 py-0.5 rounded-full text-[9px] tracking-[0.15em] uppercase"
              style={{ background: hexToRgba(badgeColor === accent ? accent : '#94A3B8', 0.18), color: badgeColor, border: `1px solid ${hexToRgba(badgeColor === accent ? accent : '#94A3B8', 0.4)}` }}>
          {pm.matchLevel}
        </span>
      </div>
      <div className="font-cinzel text-[19px] mb-2.5" style={{ color: accent }}>{pm.recommendedBlend}</div>

      <Labeled label="Why" accent={accent}>{pm.why}</Labeled>
      <Labeled label="How to Use" accent={accent}>{pm.usageTiming}</Labeled>

      {/* FIX 7 — shoppable, SHA's own products only, gated by the shop flag. */}
      {SHOP_LIVE && (
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="kowalski-button inline-flex items-center gap-1.5 mt-1 rounded-full px-4 py-2 text-[12px] tracking-[0.04em]"
          style={{ background: hexToRgba(accent, 0.16), border: `1px solid ${hexToRgba(accent, 0.45)}`, color: accent }}
        >
          Shop this tea at sacredtea.net →
        </a>
      )}

      {/* Create-Your-Own Herbal Direction — general DIY, second */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-[9px] uppercase tracking-[0.22em] text-white/45 mb-1.5">Create-Your-Own Herbal Direction</div>
        <p className="text-[13px] text-white/85 leading-snug">
          If you prefer to prepare your own, look for herbs traditionally associated with this{' '}
          <span className="text-white/70 italic">{diy.planetaryHerbCategory}</span> — such as{' '}
          <span className="text-white/90">{diy.suggestedHerbs.join(', ')}</span>.
        </p>
        <p className="text-[12px] text-white/55 leading-snug mt-1.5">
          {cap(diy.tasteProfile)} · {diy.preparationStyle}.
        </p>
        <p className="text-[11px] text-white/45 italic leading-relaxed mt-1.5">{diy.cautionNote}</p>
      </div>

      {/* Practitioner/Admin only — internal future-blend gap (never shown to users) */}
      {isPractitioner && result.futureBlendGap && (
        <div className="mt-3 pt-3 border-t border-white/8">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Admin · blend gap: </span>
          <span className="text-[11px] text-white/60">{result.futureBlendGap}</span>
        </div>
      )}

      <p className="text-[10px] text-white/40 italic mt-4">{result.safetyNote}</p>
    </GlassCard>
  )
}

function Labeled({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="text-[9px] uppercase tracking-[0.22em] mb-0.5" style={{ color: hexToRgba(accent, 0.7) }}>{label}</div>
      <div className="text-[13px] text-white/85 leading-snug">{children}</div>
    </div>
  )
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// FIX 7 — Stone to carry today (with safety; Malachite always red-flagged).
function StoneCard({
  stone, placement, safety, accent,
}: { stone?: string; placement?: string; safety?: string[]; accent: string }) {
  if (!stone) return null
  const isMalachite = stone.toLowerCase() === 'malachite'
  return (
    <GlassCard className="p-6 mb-5 animate-fade-in-up">
      <div className="text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: hexToRgba(accent, 0.9) }}>
        Stone to carry today
      </div>
      <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
        <span className="font-cinzel text-[18px]" style={{ color: accent }}>{stone}</span>
        {isMalachite && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white">⚠ POLISHED/SEALED ONLY</span>
        )}
      </div>
      {placement && <p className="text-[13px] text-white/80 leading-snug mb-2">Carry it at your {placement}.</p>}
      {safety && safety.length > 0 && (
        <div className="space-y-1">
          {safety.map((n, i) => (
            <p key={i} className={`text-[11px] leading-relaxed ${n.startsWith('⚠') ? 'text-red-300 font-semibold' : 'text-white/45 italic'}`}>{n}</p>
          ))}
        </div>
      )}
      {isMalachite && (
        <p className="text-[11px] text-red-300 font-semibold leading-relaxed mt-1.5">
          ⚠ Malachite: polished &amp; sealed only — never raw, never as an elixir. Wash hands after handling.
        </p>
      )}
      <p className="text-[10px] text-white/35 italic mt-2">A traditional crystal association for reflection — not medical advice.</p>
    </GlassCard>
  )
}

function ContinuationCard({ cont, accent, elementAction }: { cont: ContinuationProtocol; accent: string; elementAction?: string }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'What this was for', value: cont.focus },
    { label: 'Do this next', value: cont.forkFollowUp },
    // FIX 5 — today's element action (the daily-ritual carry-forward).
    ...(elementAction ? [{ label: 'Today’s sky', value: elementAction }] : []),
    { label: 'Tea', value: cont.teaPlaceholder },
    { label: 'Breathe like this', value: cont.breath },
    { label: 'Notice this spot', value: cont.bodyAreaToObserve },
    { label: 'Skip this today', value: cont.whatToAvoid },
    { label: 'Check back', value: cont.nextCheckIn },
  ]
  return (
    <GlassCard className="p-6 mb-5 animate-fade-in-up">
      <div className="text-[10px] uppercase tracking-[0.28em] mb-4" style={{ color: hexToRgba(accent, 0.9) }}>
        What To Carry Forward
      </div>
      {cont.responseNote && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: hexToRgba(accent, 0.1), border: `1px solid ${hexToRgba(accent, 0.3)}` }}>
          <span className="text-[13px] text-white/90 leading-snug">{cont.responseNote}</span>
        </div>
      )}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55 w-[120px] shrink-0 pt-0.5">{r.label}</div>
            <div className="text-[13px] text-white/90 leading-snug flex-1">{r.value}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function BeforeAfterCard({
  snapshot, entry, accent,
}: { snapshot: SessionSummarySnapshot; entry: ProgressEntry; accent: string }) {
  const before = [...snapshot.preSessionSymptoms, ...snapshot.preSessionEmotional]
  const after = entry.postSessionState.feeling
  return (
    <GlassCard className="p-6 mb-5 animate-fade-in-up">
      <div className="text-[10px] uppercase tracking-[0.28em] mb-4" style={{ color: hexToRgba(accent, 0.9) }}>
        Before → After
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-2">Before</div>
          {before.length ? (
            <div className="flex flex-wrap gap-1.5">
              {before.map((b, i) => (
                <span key={`${b}-${i}`} className="px-2.5 py-1 rounded-full text-[11px] text-white/70"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {b}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[12px] text-white/35 italic">Not recorded at intake</span>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: hexToRgba(accent, 0.8) }}>After</div>
          {after.length ? (
            <div className="flex flex-wrap gap-1.5">
              {after.map((a) => {
                const positive = POSITIVE_FEELINGS.includes(a)
                return (
                  <span key={a} className="px-2.5 py-1 rounded-full text-[11px]"
                        style={{
                          background: hexToRgba(accent, positive ? 0.22 : 0.1),
                          border: `1px solid ${hexToRgba(accent, positive ? 0.5 : 0.25)}`,
                          color: positive ? accent : 'rgba(255,255,255,0.75)',
                        }}>
                    {a}
                  </span>
                )
              })}
            </div>
          ) : (
            <span className="text-[12px] text-white/35 italic">No selection</span>
          )}
        </div>
      </div>
      {typeof entry.energyRating === 'number' && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">Energy after</span>
          <span className="font-cinzel text-[20px]" style={{ color: accent }}>{entry.energyRating}<span className="text-[12px] text-white/40">/10</span></span>
        </div>
      )}
    </GlassCard>
  )
}

function ActionButton({
  label, onClick, accent, filled = false,
}: { label: string; onClick: () => void; accent: string; filled?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="kowalski-button w-full rounded-2xl px-5 py-3 font-medium text-[14px] tracking-[0.04em] transition"
      style={filled
        ? { background: `linear-gradient(135deg, ${hexToRgba(accent, 0.95)} 0%, ${hexToRgba(accent, 0.6)} 100%)`, color: '#020208', cursor: 'pointer', border: 'none' }
        : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${hexToRgba(accent, 0.35)}`, color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}
    >
      {label}
    </button>
  )
}
