'use client'

import { useState } from 'react'
import type { SessionRecord, ProgressEntry } from '@/types'
import { GlassCard, PrimaryButton, SectionLabel } from '@/components/ui'
import { hexToRgba, formatTime } from '@/lib/utils'

interface HistoryScreenProps {
  history: SessionRecord[]
  sessionLog?: ProgressEntry[]
  onDeleteLog?: (id: string) => void
  accentColor: string
  onLoadSession: (record: SessionRecord) => void
  onBack: () => void
  // Phase 1 consolidation — mounted inside the Dashboard History panel: strip
  // page chrome (min-h-screen, top padding, header, back button). Card grids +
  // energy trend are untouched.
  embedded?: boolean
}

export default function HistoryScreen({
  history,
  sessionLog = [],
  onDeleteLog,
  accentColor,
  onLoadSession,
  onBack,
  embedded,
}: HistoryScreenProps) {
  return (
    <div className={embedded ? 'font-rajdhani' : 'min-h-screen font-rajdhani'}>
      {/* v5 FIX 1 — wide trend on top; cards reflow into a desktop grid below. */}
      <div
        className={embedded ? '' : 'max-w-2xl lg:max-w-6xl mx-auto px-5'}
        style={embedded ? undefined : { paddingTop: 100, paddingBottom: 60 }}
      >
        {!embedded && (
          <div className="mb-8 animate-fade-in-up">
            <SectionLabel>Session Archive</SectionLabel>
            <h1 className="font-cinzel text-3xl text-white">Your Progress</h1>
          </div>
        )}

        {/* ── Chamber Session Progress (post-session loop) ── */}
        {sessionLog.length > 0 && (
          <div className="mb-10">
            {/* v2 FIX 6 — energy trend over time (the felt "track your recalibration") */}
            <EnergyTrend entries={sessionLog} accentColor={accentColor} />
            <div className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
              Chamber Sessions · {sessionLog.length}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
              {sessionLog
                .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)  /* Fix 12 — no dupes */
                .map((entry) => (
                  <ProgressCard
                    key={entry.id}
                    entry={entry}
                    accentColor={accentColor}
                    onDelete={onDeleteLog ? () => onDeleteLog(entry.id) : undefined}
                  />
                ))}
            </div>
          </div>
        )}

        {/* ── Reading history ── */}
        <div className="text-[11px] uppercase tracking-[0.25em] mb-3 text-white/50">
          Readings · {history.length}
        </div>
        {history.length === 0 ? (
          <GlassCard className="p-10 text-center animate-fade-in">
            <div className="text-4xl mb-4 opacity-30">◎</div>
            <div className="font-cinzel text-lg text-white/50 mb-2">No readings yet</div>
            <p className="text-[13px] text-white/30">
              Complete your first analysis to see your reading history here.
            </p>
            <div className="mt-6">
              <PrimaryButton label="Begin First Session" onClick={onBack} accent={accentColor} />
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
            {history.map((record, i) => (
              <button
                key={record.id}
                onClick={() => onLoadSession(record)}
                className="w-full text-left animate-fade-in-up"
                style={{ animationDelay: `${i * 0.07}s`, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <GlassCard
                  className="flex items-center gap-4 p-5 transition-all duration-200 hover:border-white/20"
                >
                  {/* Accent stripe */}
                  <div
                    className="flex-shrink-0 rounded-sm"
                    style={{ width: 4, height: 52, background: record.accentColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-[0.25em] text-white/35 mb-1">{record.date}</div>
                    <div className="font-cinzel text-[15px] text-white mb-1 truncate">{record.pattern}</div>
                    <div className="text-[12px] tracking-[0.1em] text-white/50">{record.summary}</div>
                  </div>
                  <div className="text-lg text-white/25 flex-shrink-0">›</div>
                </GlassCard>
              </button>
            ))}
          </div>
        )}

        {!embedded && (
          <div className="mt-8">
            <PrimaryButton label="← Back" onClick={onBack} accent={accentColor} outlined />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Progress card — one saved Chamber session (Fix 12 retention loop) ──
// Rich card: date + time, signal·carrier, container, intention, energy, fork
// sequence, before→after. Tap the header to expand the saved protocol read-only.
const CONTAINER_LABEL: Record<string, string> = {
  '15_PERSONAL':     '15-Min Personal',
  '30_DEEP':         '30-Min Deep Chamber',
  '60_PRACTITIONER': '60-Min Practitioner',
}

function ProgressCard({
  entry, accentColor, onDelete,
}: { entry: ProgressEntry; accentColor: string; onDelete?: () => void }) {
  const [open, setOpen] = useState(false)
  // Fix 3 — date + time derived at RENDER, in the user's LOCAL zone, from the
  // ISO timestamp. Same-day sessions therefore show distinct times.
  const d = new Date(entry.dateTime)
  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const before = [...entry.preSessionState.symptoms, ...entry.preSessionState.emotional]
  const after = entry.postSessionState.feeling ?? []
  const containerLabel = entry.selectedSessionContainer ? CONTAINER_LABEL[entry.selectedSessionContainer] : null
  const intention = entry.intention ?? []
  const cont = entry.continuationProtocol

  return (
    <GlassCard className="p-5 animate-fade-in-up">
      {/* Header — tap to expand the saved protocol read-only */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.22em] text-white/35 mb-1">{dateLabel} · {timeLabel}</div>
            <div className="font-cinzel text-[16px] text-white">
              {entry.signalState} <span className="text-white/55 text-[13px]">· {entry.planetaryCarrier}</span>
            </div>
            {containerLabel && (
              <div className="text-[10px] tracking-[0.12em] text-white/45 mt-0.5">{containerLabel}</div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-white/45">{formatTime(entry.sessionDuration)}</span>
            <span className="text-[12px] text-white/30">{open ? '▴' : '▾'}</span>
            {onDelete && (
              <span
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="text-[11px] text-white/30 hover:text-white/70 transition"
                style={{ cursor: 'pointer' }}
                aria-label="Delete session"
              >✕</span>
            )}
          </div>
        </div>
      </button>

      {intention.length > 0 && (
        <div className="text-[11px] text-white/55 mb-1.5">
          <span className="uppercase tracking-[0.18em] text-white/40">Intention</span> · {intention.join(', ')}
        </div>
      )}
      {entry.forkSequence?.length > 0 && (
        <div className="text-[11px] text-white/55 mb-3">
          <span className="uppercase tracking-[0.18em] text-white/40">Forks</span> · {entry.forkSequence.join(' → ')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1.5">Before</div>
          <div className="flex flex-wrap gap-1">
            {before.length ? before.map((b, i) => (
              <Chip key={`${b}-${i}`} label={b} />
            )) : <span className="text-[11px] text-white/30 italic">—</span>}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.2em] mb-1.5" style={{ color: hexToRgba(accentColor, 0.8) }}>After</div>
          <div className="flex flex-wrap gap-1">
            {after.length ? after.map((a) => (
              <Chip key={a} label={a} accent={accentColor} />
            )) : <span className="text-[11px] text-white/30 italic">—</span>}
          </div>
        </div>
      </div>

      {typeof entry.energyRating === 'number' && (
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <span className="uppercase tracking-[0.18em] text-white/40">Energy</span>
          {/* v2 FIX 1 — true BEFORE→AFTER delta when a baseline was captured */}
          {typeof entry.energyBefore === 'number' ? (
            <span style={{ color: accentColor }}>
              {entry.energyBefore} → {entry.energyRating}
              {entry.energyRating !== entry.energyBefore
                ? ` ${entry.energyRating > entry.energyBefore ? '▲' : '▼'}${Math.abs(entry.energyRating - entry.energyBefore)}`
                : ''}
            </span>
          ) : (
            <span style={{ color: accentColor }}>{entry.energyRating}/10 after</span>
          )}
        </div>
      )}

      {/* Expanded read-only detail (the "reopen saved protocol" view) */}
      {open && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
          {entry.correctiveDirection && <DetailRow label="Calibration" value={entry.correctiveDirection} />}
          {entry.bodyPlacements?.length > 0 && <DetailRow label="Body placements" value={entry.bodyPlacements.join(', ')} />}
          {entry.sacredTeaSupport && <DetailRow label="Sacred Tea" value={entry.sacredTeaSupport} />}
          {cont?.focus && <DetailRow label="Focus" value={cont.focus} />}
          {cont?.forkFollowUp && <DetailRow label="Fork follow-up" value={cont.forkFollowUp} />}
          {cont?.whatToAvoid && <DetailRow label="Avoid today" value={cont.whatToAvoid} />}
          {entry.notes && <DetailRow label="Notes" value={entry.notes} />}
        </div>
      )}

      {!open && entry.notes && (
        <div className="mt-3 pt-3 border-t border-white/8 text-[12px] text-white/55 italic leading-snug truncate">
          “{entry.notes}”
        </div>
      )}
      {!open && !entry.notes && cont?.responseNote && (
        <div className="mt-3 pt-3 border-t border-white/8 text-[12px] text-white/65 italic leading-snug">
          {cont.responseNote}
        </div>
      )}
    </GlassCard>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/40 w-[110px] shrink-0 pt-0.5">{label}</div>
      <div className="text-[12px] text-white/80 leading-snug flex-1">{value}</div>
    </div>
  )
}

// ─── v2 FIX 6 — Energy trend sparkline + descriptive (never diagnostic) insight ──
// Plots post-session energy across saved sessions (oldest → newest). Degrades
// gracefully: 0 sessions = nothing; 1 session = single point + "baseline set".
function EnergyTrend({ entries, accentColor }: { entries: ProgressEntry[]; accentColor: string }) {
  // sessionLog is stored newest-first; reverse to oldest→newest for the x-axis.
  const points = entries
    .filter((e) => typeof e.energyRating === 'number')
    .slice()
    .reverse()
    .map((e) => ({ v: e.energyRating as number, date: new Date(e.dateTime) }))
  if (points.length === 0) return null

  const W = 320, H = 64, pad = 8
  const n = points.length
  const x = (i: number) => (n <= 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1))
  const y = (v: number) => H - pad - ((Math.max(1, Math.min(10, v)) - 1) / 9) * (H - 2 * pad)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')

  let insight: string
  if (n === 1) {
    insight = 'Your baseline is set — your trend builds from here.'
  } else {
    const diff = points[n - 1].v - points[0].v
    insight = diff >= 2
      ? `Your energy has trended upward across your last ${n} sessions.`
      : diff <= -2
        ? `Your energy has dipped across your last ${n} sessions — gentle, grounding sessions may help.`
        : `Your energy has held steady across your last ${n} sessions.`
  }

  return (
    <div className="mb-8 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${hexToRgba(accentColor, 0.25)}` }}>
      <div className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
        Energy Trend
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <line x1={pad} y1={y(5)} x2={W - pad} y2={y(5)} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        {n > 1 && <path d={path} fill="none" stroke={accentColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.v)} r={3} fill={accentColor} />
        ))}
      </svg>
      <div className="flex justify-between text-[9px] text-white/35 mt-1">
        <span>{points[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{points[n - 1].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
      <p className="text-[12px] text-white/70 italic mt-3 leading-snug">{insight}</p>
    </div>
  )
}

function Chip({ label, accent }: { label: string; accent?: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px]"
      style={accent
        ? { background: hexToRgba(accent, 0.18), border: `1px solid ${hexToRgba(accent, 0.4)}`, color: accent }
        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}
    >
      {label}
    </span>
  )
}
