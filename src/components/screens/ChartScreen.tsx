'use client'

/**
 * ASTRYX — Chart Screen (Directive v2 Part E)
 * The user's natal chart, surfaced DIRECTLY from the menu — their own map,
 * never hunted for. Thin wrapper around the existing NatalChartWheel.
 */

import type { ProtocolOutput } from '@/types'
import { GlassCard, SectionLabel, PrimaryButton } from '@/components/ui'
import NatalChartWheel from '@/components/engine/NatalChartWheel'
import { hexToRgba } from '@/lib/utils'

export default function ChartScreen({
  chart, protocol, accentColor, onBack,
}: {
  chart: any | null
  protocol: ProtocolOutput | null
  accentColor: string
  onBack: () => void
}) {
  const dominant = protocol?.diagnostic?.dominantPlanet ?? protocol?.dominant_pattern?.planets?.[0]
  return (
    <div className="min-h-screen font-rajdhani">
      <div className="max-w-3xl mx-auto px-5" style={{ paddingTop: 90, paddingBottom: 80 }}>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Your Natal Chart</SectionLabel>
          <button onClick={onBack} className="text-[11px] text-white/45 hover:text-white/70 tracking-widest">← BACK</button>
        </div>

        <p className="text-[13px] text-content-sm mb-5 leading-relaxed">
          This is the fixed key the whole calibration reads from — the lens, not the verdict.
          {dominant ? <> Today it reads <strong style={{ color: accentColor }}>{dominant}</strong> as the dominant signature.</> : null}
        </p>

        <GlassCard accentColor={accentColor} opacity={0.1} className="p-5 sm:p-7 flex flex-col items-center animate-fade-in-up">
          {chart ? (
            <NatalChartWheel chart={chart} accentColor={accentColor} size={460} />
          ) : (
            <div className="w-full text-center py-12 rounded-xl"
                 style={{ background: hexToRgba(accentColor, 0.04), border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-3xl mb-3" style={{ color: hexToRgba(accentColor, 0.5) }}>◎</div>
              <div className="text-[13px] text-white/55 mb-1">Chart not available yet</div>
              <div className="text-[11px] text-white/35">Enter your birth details on the Intake screen to generate your chart.</div>
            </div>
          )}
        </GlassCard>

        <div className="mt-8">
          <PrimaryButton label="↩ Back" onClick={onBack} accent="rgba(255,255,255,0.1)" outlined />
        </div>
      </div>
    </div>
  )
}
