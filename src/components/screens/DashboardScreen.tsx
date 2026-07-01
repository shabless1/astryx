'use client'

/**
 * ASTRYX — Dashboard  (Daily Check-In · horizontal-tabbed home)
 * ════════════════════════════════════════════════════════════════════════════
 * The single daily home. Title: "Daily Check-In". Instead of one long scrolling
 * page, EVERYTHING is its own tab in a horizontal nav (per SHA directive):
 *
 *   Check-In       — today's energy / what's present / intention → recalibrate
 *   Today's Pulse  — today's transits vs your natal planets + temperature + fork + begin
 *   Summary Report — the post-session recap + "how do you feel now" check-in + save
 *                    (after a session); otherwise today's Calibration Plan
 *   Explore Deeper — What's going on · Sky weather · Where it comes from · Minerals · Notes
 *   Chart          — the natal wheel
 *   Body Map       — planetary body regions
 *   History        — progress + reading archive
 *
 * After a Chamber session the app routes HERE with a pending snapshot, and the
 * Summary Report tab opens with the check-in + save. This is a REORGANIZATION —
 * the heavy work (engine, post-session save, deep cards) is the existing,
 * untouched components mounted per-tab. Only the open tab mounts.
 */

import { useMemo, useState, useEffect } from 'react'
import type { ProtocolOutput, AppMode, SessionRecord } from '@/types'
import { computeDailyTemperature, type Temperature } from '@/lib/dailyTemperature'
import { forkFor } from '@/lib/chamber/forkRite'
import { hexToRgba } from '@/lib/utils'
import { MICRO_DISCLAIMER, detectCrisis, CRISIS_RESOURCES_CARD } from '@/lib/compliance'
import { useAppStore } from '@/lib/store'
import { GlassCard } from '@/components/ui'
import type { DailyInput } from '@/components/screens/DailyCheckInScreen'
import ResultsScreen from '@/components/screens/ResultsScreen'
import HistoryScreen from '@/components/screens/HistoryScreen'
import PostSessionSummary from '@/components/screens/PostSessionSummary'
import ExploreDeeperCards from '@/components/screens/dashboard/ExploreDeeperCards'
import NatalChartWheel from '@/components/engine/NatalChartWheel'
import BodyMap from '@/components/engine/BodyMap'

const TEMP_COLOR: Record<Temperature, string> = {
  Cool: '#38BDF8', Warm: '#F59E0B', Hot: '#FF006E',
}
const TEMP_ORDER: Temperature[] = ['Cool', 'Warm', 'Hot']

type TabKey = 'checkin' | 'pulse' | 'summary' | 'deeper' | 'chart' | 'body' | 'history'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'checkin', label: 'Check-In' },
  { key: 'pulse',   label: "Today's Pulse" },
  { key: 'summary', label: 'Summary Report' },
  { key: 'deeper',  label: 'Explore Deeper' },
  { key: 'chart',   label: 'Chart' },
  { key: 'body',    label: 'Body Map' },
  { key: 'history', label: 'History' },
]

const INTENTIONS = [
  { key: 'calm', label: 'Calm', glyph: '◡' },
  { key: 'focus', label: 'Focus', glyph: '◉' },
  { key: 'ground', label: 'Ground', glyph: '⬡' },
  { key: 'energize', label: 'Energize', glyph: '✦' },
]

export default function DashboardScreen({
  protocol, chartData, accentColor, mode, userName,
  onBeginSession, onCalibrate, sessionLoggedToast, onClearToast,
}: {
  protocol: ProtocolOutput
  chartData: any | null
  accentColor: string
  mode: AppMode
  userName?: string
  onBeginSession: () => void
  onCalibrate: (input: DailyInput) => void
  sessionLoggedToast?: boolean
  onClearToast?: () => void
}) {
  const history          = useAppStore((s) => s.history)
  const sessionLog       = useAppStore((s) => s.sessionLog)
  const deleteSessionLog = useAppStore((s) => s.deleteSessionLog)
  const setProtocol      = useAppStore((s) => s.setProtocol)
  const setAccentColor   = useAppStore((s) => s.setAccentColor)
  const protocolDate     = useAppStore((s) => s.protocolDate)
  const pendingSession   = useAppStore((s) => s.pendingSession)
  const setPendingSession = useAppStore((s) => s.setPendingSession)

  const todayKey = new Date().toLocaleDateString('en-CA')
  const isToday  = protocolDate === todayKey
  const hasPending = !!pendingSession

  // Default tab: fresh session → Summary; calibrated today → Pulse; stale → Check-In.
  const [tab, setTab] = useState<TabKey>(hasPending ? 'summary' : isToday ? 'pulse' : 'checkin')

  useEffect(() => {
    if (!sessionLoggedToast) return
    const t = setTimeout(() => onClearToast?.(), 3500)
    return () => clearTimeout(t)
  }, [sessionLoggedToast, onClearToast])

  const today = useMemo(() => computeDailyTemperature(chartData, new Date()), [chartData])
  const fallbackPlanet =
    protocol.signalHierarchy?.primary?.planet ?? protocol.diagnostic?.dominantPlanet ?? 'Sun'
  const forkPlanet = today.headline ? today.suggestedForkPlanet : fallbackPlanet
  const fork = forkFor(forkPlanet)
  const tempColor = TEMP_COLOR[today.temperature]

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const firstName = (userName ?? '').trim().split(/\s+/)[0]

  const handleLoadSession = (record: SessionRecord) => {
    setProtocol(record.protocol)
    setAccentColor(record.accentColor)
  }

  return (
    <div className="min-h-screen font-rajdhani pb-20">
      <div className="max-w-3xl lg:max-w-5xl mx-auto px-5" style={{ paddingTop: 96 }}>

        {sessionLoggedToast && (
          <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-2.5 animate-fade-in-up"
               style={{ background: hexToRgba(accentColor, 0.12), border: `1px solid ${hexToRgba(accentColor, 0.4)}` }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
            <span className="text-[13px] text-content">Session logged to your progress.</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 animate-fade-in-up">
          <div className="text-[10px] uppercase tracking-[0.3em] text-meta mb-1">{dateLabel}</div>
          <h1 className="font-cinzel text-[24px] sm:text-[30px] leading-tight text-white">
            Daily Check-In{firstName ? <span className="text-white/45 text-[18px] sm:text-[22px]"> · {firstName}</span> : null}
          </h1>
        </div>

        {/* Horizontal tab nav */}
        <div className="-mx-5 px-5 mb-5 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {TABS.map((t) => {
              const on = tab === t.key
              const flag = t.key === 'summary' && hasPending
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="kowalski-button shrink-0 rounded-full px-4 py-2 text-[12.5px] tracking-[0.03em] whitespace-nowrap transition relative"
                  style={{
                    background: on ? hexToRgba(accentColor, 0.9) : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.12)'}`,
                    color: on ? '#020208' : 'rgba(255,255,255,0.7)',
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {t.label}
                  {flag && !on && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                          style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active tab */}
        <div className="animate-fade-in-up">
          {tab === 'checkin' && (
            <CheckInTab accentColor={accentColor} isToday={isToday} onCalibrate={onCalibrate} />
          )}

          {tab === 'pulse' && (
            <PulseTab
              protocol={protocol} accentColor={accentColor} tempColor={tempColor}
              today={today} fork={fork} onBeginSession={onBeginSession}
            />
          )}

          {tab === 'summary' && (
            hasPending ? (
              <PostSessionSummary
                snapshot={pendingSession}
                accentColor={accentColor}
                onViewProgress={() => setTab('history')}
                onRepeatChamber={onBeginSession}
                onReturnHome={() => { setPendingSession(null); setTab('pulse') }}
                onDone={() => { setPendingSession(null); setTab('pulse') }}
                embedded
              />
            ) : (
              <ResultsScreen
                protocol={protocol}
                mode={mode}
                accentColor={accentColor}
                chartData={chartData}
                onStartSession={onBeginSession}
                onPractitioner={() => {}}
                onNewIntake={() => setTab('checkin')}
                embedded="summary"
              />
            )
          )}

          {tab === 'deeper' && (
            <GlassCard accentColor={accentColor} opacity={0.08} className="p-5 sm:p-6">
              <div className="text-[10px] uppercase tracking-[0.28em] mb-1" style={{ color: hexToRgba(accentColor, 0.9) }}>
                Explore Deeper
              </div>
              <p className="text-[11px] text-white/45 mb-3">Tap any box to peek inside.</p>
              <ExploreDeeperCards protocol={protocol} accent={accentColor} bare />
            </GlassCard>
          )}

          {tab === 'chart' && (
            <GlassCard accentColor={accentColor} opacity={0.1} className="p-5 sm:p-7 flex flex-col items-center">
              {chartData ? (
                <NatalChartWheel chart={chartData} accentColor={accentColor} size={420} />
              ) : (
                <ChartFallback accentColor={accentColor} glyph="◎" label="Chart not available yet" hint="Run a calibration to generate your chart." />
              )}
            </GlassCard>
          )}

          {tab === 'body' && (
            <GlassCard accentColor={accentColor} opacity={0.1} className="p-5 sm:p-7">
              {chartData ? (
                <BodyMap chart={chartData} accentColor={accentColor} />
              ) : (
                <ChartFallback accentColor={accentColor} glyph="⬡" label="Body Map not available yet" hint="Run a calibration to map your body." />
              )}
            </GlassCard>
          )}

          {tab === 'history' && (
            <HistoryScreen
              history={history}
              sessionLog={sessionLog}
              onDeleteLog={deleteSessionLog}
              accentColor={accentColor}
              onLoadSession={handleLoadSession}
              onBack={() => setTab('pulse')}
              embedded
            />
          )}
        </div>

        <p className="text-center text-[10px] tracking-[0.18em] text-white/30 mt-6">{MICRO_DISCLAIMER}</p>
      </div>
    </div>
  )
}

// ── CHECK-IN TAB — today's energy / what's present / intention → recalibrate ──
function CheckInTab({
  accentColor, isToday, onCalibrate,
}: { accentColor: string; isToday: boolean; onCalibrate: (input: DailyInput) => void }) {
  const [energy, setEnergy] = useState(5)
  const [question, setQuestion] = useState('')
  const [intention, setIntention] = useState<string | null>(null)
  const [crisis, setCrisis] = useState(false)

  const handle = () => {
    if (detectCrisis(question).isCrisis) { setCrisis(true); return }
    onCalibrate({ energy, question: question.trim(), intention })
  }

  if (crisis) {
    return (
      <div className="rounded-[1.6rem] p-7" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(255,0,110,0.4)' }}>
        <div className="text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: '#FF006E' }}>Immediate support</div>
        <p className="text-[14px] text-content leading-relaxed whitespace-pre-line">{CRISIS_RESOURCES_CARD}</p>
        <button onClick={() => setCrisis(false)}
                className="kowalski-button w-full mt-6 rounded-2xl px-5 py-3 text-[13px]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)' }}>
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-content-sm leading-relaxed">
        {isToday
          ? 'You’ve already calibrated today. Check in again any time to re-tune to the live sky.'
          : 'A quick check-in tunes today’s calibration to the live sky. Your chart is already saved — this is just today.'}
      </p>

      {/* Energy */}
      <div className="rounded-[1.4rem] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] uppercase tracking-[0.24em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>Energy right now</div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const on = energy === n
            return (
              <button key={n} onClick={() => setEnergy(n)}
                className="flex-1 py-2.5 rounded-lg text-[12px] transition"
                style={{
                  background: on ? hexToRgba(accentColor, 0.28) : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.1)'}`,
                  color: on ? accentColor : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: on ? 600 : 400,
                }}>
                {n}
              </button>
            )
          })}
        </div>
        <div className="flex justify-between text-[9px] text-white/35 tracking-widest mt-1.5"><span>DEPLETED</span><span>CHARGED</span></div>
      </div>

      {/* What's present */}
      <div className="rounded-[1.4rem] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] uppercase tracking-[0.24em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>What&apos;s present for you today?</div>
        <textarea
          value={question} onChange={(e) => setQuestion(e.target.value)} rows={3}
          placeholder="In your own words — e.g. &ldquo;wired and anxious&rdquo;, &ldquo;foggy, can&rsquo;t focus&rdquo;, &ldquo;heavy and slow&rdquo;…"
          className="w-full px-3 py-2.5 rounded-lg text-[14px] text-white resize-none placeholder:text-white/30"
          style={{ background: 'rgba(15,15,26,0.65)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* Intention */}
      <div className="rounded-[1.4rem] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] uppercase tracking-[0.24em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
          Today&apos;s intention <span className="text-white/35 normal-case tracking-normal">· optional</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTENTIONS.map((it) => {
            const on = intention === it.key
            return (
              <button key={it.key} onClick={() => setIntention(on ? null : it.key)}
                className="px-4 py-2 rounded-full text-[12.5px] tracking-[0.04em] transition flex items-center gap-1.5"
                style={{
                  background: on ? hexToRgba(accentColor, 0.22) : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.12)'}`,
                  color: on ? accentColor : 'rgba(255,255,255,0.65)', cursor: 'pointer', fontWeight: on ? 600 : 400,
                }}>
                <span>{it.glyph}</span>{it.label}
              </button>
            )
          })}
        </div>
      </div>

      <button onClick={handle}
        className="kowalski-button w-full rounded-2xl px-5 py-4 font-medium text-[15px] tracking-[0.02em]"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.95)} 0%, ${hexToRgba(accentColor, 0.6)} 100%)`,
          color: '#020208', boxShadow: `0 0 28px -4px ${hexToRgba(accentColor, 0.7)}`,
        }}>
        {isToday ? 'Recalibrate today →' : 'Calibrate today →'}
      </button>
    </div>
  )
}

// ── TODAY'S PULSE TAB — temperature + today's transits vs natal + fork + begin ──
function PulseTab({
  protocol, accentColor, tempColor, today, fork, onBeginSession,
}: {
  protocol: ProtocolOutput
  accentColor: string
  tempColor: string
  today: ReturnType<typeof computeDailyTemperature>
  fork: ReturnType<typeof forkFor>
  onBeginSession: () => void
}) {
  const transits = protocol.diagnostic?.activeTransits ?? []
  return (
    <div className="space-y-4">
      {/* Temperature */}
      <div className="rounded-[1.4rem] p-5"
           style={{ background: `linear-gradient(135deg, ${hexToRgba(tempColor, 0.16)} 0%, rgba(255,255,255,0.02) 60%)`, border: `1px solid ${hexToRgba(tempColor, 0.3)}`, boxShadow: `0 24px 60px -36px ${hexToRgba(tempColor, 0.6)}` }}>
        <div className="text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: hexToRgba(tempColor, 0.9) }}>Today&apos;s Temperature</div>
        <div className="flex items-end gap-3 mb-4">
          <span className="font-cinzel leading-none" style={{ fontSize: 48, color: tempColor, textShadow: `0 0 28px ${hexToRgba(tempColor, 0.55)}` }}>{today.temperature}</span>
        </div>
        <div className="flex gap-1.5 mb-4">
          {TEMP_ORDER.map((t) => {
            const active = t === today.temperature
            const c = TEMP_COLOR[t]
            return (
              <div key={t} className="flex-1 text-center">
                <div className="h-1.5 rounded-full mb-1.5 transition-all" style={{ background: active ? c : 'rgba(255,255,255,0.08)', boxShadow: active ? `0 0 12px ${hexToRgba(c, 0.7)}` : 'none' }} />
                <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: active ? c : 'rgba(255,255,255,0.35)', fontWeight: active ? 600 : 400 }}>{t}</span>
              </div>
            )
          })}
        </div>
        <p className="text-[13.5px] leading-relaxed text-content">{today.temperatureBlurb}</p>
      </div>

      {/* Headline */}
      <div className="rounded-[1.2rem] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] uppercase tracking-[0.24em] mb-1.5" style={{ color: hexToRgba(accentColor, 0.85) }}>Today&apos;s Headline</div>
        <div className="font-cinzel text-[18px] text-white mb-2 leading-snug">{today.headlineTitle}</div>
        <p className="text-[13.5px] leading-relaxed text-content-sm">{today.headlineBody}</p>
      </div>

      {/* Today's transits vs natal */}
      <div className="rounded-[1.2rem] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] uppercase tracking-[0.24em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
          Today&apos;s Transits · live sky to your natal chart
        </div>
        {transits.length ? (
          <div className="space-y-3">
            {transits.slice(0, 8).map((t, i) => (
              <div key={i} className="border-b border-white/5 last:border-b-0 pb-2.5 last:pb-0">
                <div className="text-[13px] text-white/90">
                  {t.transitingPlanet} {t.aspect} {t.natalPlanet}
                  {t.lifeEvent ? <span style={{ color: hexToRgba(accentColor, 0.9) }}> · {t.lifeEvent.label}</span> : null}
                </div>
                {t.interpretation?.effect && <div className="text-[12px] text-white/55 leading-snug mt-0.5">{t.interpretation.effect}</div>}
                {t.interpretation?.intervention && <div className="text-[12px] text-white/45 italic leading-snug mt-0.5">Support: {t.interpretation.intervention}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-white/45 italic">No strong transits to your natal chart today — a steady sky. A grounding session still supports your baseline.</p>
        )}
      </div>

      {/* Suggested fork */}
      {fork && (
        <div className="rounded-[1.2rem] p-5 flex items-center gap-4"
             style={{ background: `linear-gradient(135deg, ${hexToRgba(fork.color || accentColor, 0.12)} 0%, rgba(255,255,255,0.02) 70%)`, border: `1px solid ${hexToRgba(fork.color || accentColor, 0.24)}` }}>
          <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl"
               style={{ width: 60, height: 60, background: hexToRgba(fork.color || accentColor, 0.16), border: `1px solid ${hexToRgba(fork.color || accentColor, 0.4)}` }}>
            <span className="font-cinzel text-[14px]" style={{ color: fork.color || accentColor }}>{fork.hz}</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-white/50">Hz</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.24em] mb-1" style={{ color: hexToRgba(fork.color || accentColor, 0.9) }}>Suggested Fork</div>
            <div className="text-[15px] text-white font-medium leading-snug">{fork.planet} Tone</div>
            <div className="text-[12.5px] text-content-sm mt-0.5">{fork.chakra}{fork.note ? ` · ${fork.note}` : ''}</div>
          </div>
        </div>
      )}

      <button onClick={onBeginSession}
        className="kowalski-button w-full rounded-2xl px-5 py-4 font-medium text-[15px] tracking-[0.02em]"
        style={{ background: `linear-gradient(135deg, ${hexToRgba(tempColor, 0.95)} 0%, ${hexToRgba(tempColor, 0.6)} 100%)`, color: '#020208', boxShadow: `0 0 28px -4px ${hexToRgba(tempColor, 0.7)}` }}>
        Begin today&apos;s session →
      </button>
    </div>
  )
}

function ChartFallback({
  accentColor, glyph, label, hint,
}: { accentColor: string; glyph: string; label: string; hint: string }) {
  return (
    <div className="w-full text-center py-12 rounded-xl" style={{ background: hexToRgba(accentColor, 0.04), border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-3xl mb-3" style={{ color: hexToRgba(accentColor, 0.5) }}>{glyph}</div>
      <div className="text-[13px] text-white/55 mb-1">{label}</div>
      <div className="text-[11px] text-white/35">{hint}</div>
    </div>
  )
}
