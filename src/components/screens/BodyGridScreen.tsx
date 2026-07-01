'use client'

/**
 * ASTRYX — Body Grid Screen (Directive v2 Part E)
 * The user's holographic body map, surfaced DIRECTLY from the menu — their
 * own body as the map. Thin wrapper around the existing BodyMap SVG.
 *
 * FUTURE: a 360° turntable viewer slots in here once SHA provides the body
 * render frames (tracked task). Until then this is the flat front-view grid.
 */

import type { ProtocolOutput } from '@/types'
import { GlassCard, SectionLabel, PrimaryButton } from '@/components/ui'
import BodyMap from '@/components/engine/BodyMap'
import { hexToRgba } from '@/lib/utils'

export default function BodyGridScreen({
  chart, protocol, accentColor, onBack,
}: {
  chart: any | null
  protocol: ProtocolOutput | null
  accentColor: string
  onBack: () => void
}) {
  void protocol
  return (
    <div className="min-h-screen font-rajdhani">
      <div className="max-w-3xl mx-auto px-5" style={{ paddingTop: 90, paddingBottom: 80 }}>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Your Body Grid</SectionLabel>
          <button onClick={onBack} className="text-[11px] text-white/45 hover:text-white/70 tracking-widest">← BACK</button>
        </div>

        <p className="text-[13px] text-content-sm mb-5 leading-relaxed">
          Where each planet lands in your body — its system, sign, and ruling planet, read together.
          Tap a glowing region to see what it governs.
        </p>

        <GlassCard accentColor={accentColor} opacity={0.1} className="p-5 sm:p-7 animate-fade-in-up">
          {chart ? (
            <BodyMap chart={chart} accentColor={accentColor} />
          ) : (
            <div className="w-full text-center py-12 rounded-xl"
                 style={{ background: hexToRgba(accentColor, 0.04), border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-3xl mb-3" style={{ color: hexToRgba(accentColor, 0.5) }}>⬡</div>
              <div className="text-[13px] text-white/55 mb-1">Body Grid not available yet</div>
              <div className="text-[11px] text-white/35">Enter your birth location on the Intake screen to map your body.</div>
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
