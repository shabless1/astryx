'use client'

/**
 * ASTRYX — Explore Deeper Cards (shared)
 * ════════════════════════════════════════════════════════════════════════════
 * The five collapsible reference cards built from the protocol's diagnostic +
 * SOAP. Single source of truth, used by BOTH the post-session summary and the
 * Dashboard's "Explore Deeper" tab so the copy never drifts:
 *
 *   • What's going on      ← diagnostic.rootCause
 *   • Sky weather today    ← diagnostic.activeTransits
 *   • Where it comes from  ← diagnostic.symptomRouting
 *   • Minerals for you     ← diagnostic.cellSaltPrescription
 *   • The full notes       ← soap
 *
 * `bare` strips the outer card + header (the Dashboard tab is its own container).
 */

import { useState } from 'react'
import type { ProtocolOutput } from '@/types'
import { hexToRgba } from '@/lib/utils'
import { GlassCard } from '@/components/ui'
import { freshTransitInterpretation } from '@/lib/engineClient'

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export default function ExploreDeeperCards({
  protocol, accent, bare = false,
}: {
  protocol?: ProtocolOutput
  accent: string
  bare?: boolean
}) {
  const d = protocol?.diagnostic
  const soap = protocol?.soap
  if (!protocol || (!d && !soap)) {
    if (bare) {
      return (
        <p className="text-[12.5px] text-white/45 italic py-6 text-center">
          The deeper reference fills in once you&apos;ve run today&apos;s calibration.
        </p>
      )
    }
    return null
  }

  const sections: { key: string; title: string; body: React.ReactNode }[] = []

  if (d?.rootCause || d?.activeTransits?.length) sections.push({
    key: 'pulse', title: 'Current Pulse',
    body: (
      <div className="space-y-3">
        {d?.rootCause && (
          <div className="space-y-2">
            <div className="text-[13px] text-white/90 font-medium leading-snug">{d.rootCause.headline}</div>
            {d.rootCause.cosmicLayer && <DeepLine label="Pattern" value={d.rootCause.cosmicLayer} />}
            {d.rootCause.bodyLayer && <DeepLine label="Body" value={d.rootCause.bodyLayer} />}
            {d.rootCause.actionLayer && <DeepLine label="Support" value={d.rootCause.actionLayer} />}
          </div>
        )}
        {!!d?.activeTransits?.length && (
          <div className="pt-1">
            <div className="text-[9px] uppercase tracking-[0.2em] mb-1.5" style={{ color: hexToRgba(accent, 0.85) }}>Today&apos;s sky to your chart</div>
            <div className="space-y-2.5">
              {/* v4.2 FIX 3 — render-time copy (current data files, not baked text) */}
              {d.activeTransits.slice(0, 5).map((t, i) => {
                const interp = freshTransitInterpretation(t)
                return (
                  <div key={i} className="border-b border-white/5 last:border-b-0 pb-2 last:pb-0">
                    <div className="text-[12px] text-white/85">
                      {t.transitingPlanet} {t.aspect} {t.natalPlanet}
                      {t.lifeEvent ? <span style={{ color: hexToRgba(accent, 0.9) }}> · {t.lifeEvent.label}</span> : null}
                    </div>
                    {interp?.effect && <div className="text-[11.5px] text-white/55 leading-snug mt-0.5">{interp.effect}</div>}
                    {interp?.intervention && <div className="text-[11.5px] text-white/45 italic leading-snug mt-0.5">Support: {interp.intervention}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    ),
  })

  if (d?.symptomRouting?.length) sections.push({
    key: 'routing', title: 'Where it comes from',
    body: (
      <div className="space-y-2.5">
        {(d.symptomRouting ?? []).map((s, i) => (
          <div key={i} className="border-b border-white/5 last:border-b-0 pb-2 last:pb-0">
            <div className="text-[12px] text-white/85">{cap(s.reportedSymptom)} → {s.primaryPlanet}</div>
            {s.rootCause?.bodyLayer && <div className="text-[11.5px] text-white/55 leading-snug mt-0.5">{s.rootCause.bodyLayer}</div>}
            {s.recommendedCellSalt?.saltShort && <div className="text-[11px] text-white/45 italic mt-0.5">Mineral: {s.recommendedCellSalt.saltShort}</div>}
          </div>
        ))}
      </div>
    ),
  })

  if (d?.cellSaltPrescription) sections.push({
    key: 'mineral', title: 'Minerals for you',
    body: (() => {
      const cs = d.cellSaltPrescription
      const main = ([
        cs.primarySalt?.saltName ? { s: cs.primarySalt, tag: 'Active now' } : null,
        cs.sunSignSalt?.saltName ? { s: cs.sunSignSalt, tag: 'Your sign' } : null,
      ].filter(Boolean)) as { s: typeof cs.primarySalt; tag: string }[]
      return (
        <div className="space-y-3">
          {main.map(({ s, tag }, i) => (
            <div key={i} className="pb-2.5 border-b border-white/5 last:border-b-0">
              <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: hexToRgba(accent, 0.85) }}>{tag}</div>
              <div className="text-[13px] text-white/90 font-medium mb-1">
                {s.saltName}{s.epithet ? <span className="text-white/45 text-[11px]"> · {s.epithet}</span> : null}
              </div>
              {s.plainLanguageSignal && <DeepLine label="Good for" value={s.plainLanguageSignal} />}
              {s.foodSources && s.foodSources.length > 0 && (
                <DeepLine label="In foods" value={s.foodSources.slice(0, 5).join(' · ')} />
              )}
              <DeepLine label="Why" value={`Your ${s.sign} cell salt — the mineral foundation linked to this sign.`} />
            </div>
          ))}
          {cs.gestationDeficiencies?.length > 0 && (
            <DeepLine label="Innate (lower)" value={cs.gestationDeficiencies.map((g) => g.saltShort).join(' · ')} />
          )}
          <p className="text-[10px] text-white/35 italic">A mineral-foundation reference with food sources — not a dose or medical advice.</p>
        </div>
      )
    })(),
  })

  if (soap) sections.push({
    key: 'soap', title: 'The full notes',
    body: (
      <div className="space-y-1.5">
        {soap.subjective?.length > 0 && <DeepLine label="You said" value={soap.subjective.join(' · ')} />}
        {soap.objective?.length > 0 && <DeepLine label="We saw" value={soap.objective.join(' · ')} />}
        {soap.assessment && <DeepLine label="What it means" value={soap.assessment} />}
        {soap.plan && <DeepLine label="What to do" value={soap.plan} />}
      </div>
    ),
  })

  if (!sections.length) return null

  const list = (
    <div className="space-y-2">
      {sections.map((s) => (
        <DeepCollapsible key={s.key} title={s.title} accent={accent}>{s.body}</DeepCollapsible>
      ))}
    </div>
  )

  if (bare) {
    return (
      <div>
        {list}
        <p className="text-[10px] text-white/35 italic mt-3">ⓘ Reference tool · not medical advice.</p>
      </div>
    )
  }

  return (
    <GlassCard className="p-5 mb-5 animate-fade-in-up">
      <div className="text-[10px] uppercase tracking-[0.28em] mb-1" style={{ color: hexToRgba(accent, 0.9) }}>
        Explore Deeper
      </div>
      <p className="text-[11px] text-white/45 mb-3">Want to know more? Tap any box to peek inside.</p>
      {list}
      <p className="text-[10px] text-white/35 italic mt-3">ⓘ Reference tool · not medical advice.</p>
    </GlassCard>
  )
}

function DeepCollapsible({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: open ? hexToRgba(accent, 0.07) : 'rgba(255,255,255,0.03)', cursor: 'pointer', border: 'none' }}
      >
        <span className="text-[12px] tracking-[0.04em] text-white/85">{title}</span>
        <span className="text-[13px] text-white/45">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.015)' }}>{children}</div>}
    </div>
  )
}

function DeepLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45 w-[78px] shrink-0 pt-0.5">{label}</div>
      <div className="text-[12.5px] text-white/85 leading-snug flex-1">{value}</div>
    </div>
  )
}
