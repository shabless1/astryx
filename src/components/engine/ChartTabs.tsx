'use client'

import { useState } from 'react'
import type { ProtocolOutput } from '@/types'
import type { NatalChart } from '@/lib/ephemeris'
import NatalChartWheel from '@/components/engine/NatalChartWheel'
import BodyMap from '@/components/engine/BodyMap'
import { hexToRgba } from '@/lib/utils'

interface ChartTabsProps {
  protocol: ProtocolOutput
  chart: (NatalChart & { isSolarChart?: boolean }) | null
  accentColor: string
  soapContent: React.ReactNode
}

const TABS = [
  { key: 'soap',  label: 'Assessment',    icon: '◎' },
  { key: 'chart', label: 'Natal Chart',   icon: '◉' },
  { key: 'body',  label: 'Body Map',      icon: '⬡' },
] as const

type TabKey = typeof TABS[number]['key']

export default function ChartTabs({
  protocol,
  chart,
  accentColor,
  soapContent,
}: ChartTabsProps) {
  const [active, setActive] = useState<TabKey>('soap')

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-4"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[11px] tracking-[0.12em] uppercase font-rajdhani transition-all duration-200"
            style={{
              background: active === tab.key ? accentColor : 'transparent',
              color:      active === tab.key ? '#ffffff'   : 'rgba(255,255,255,0.4)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: active === tab.key ? 600 : 400,
            }}
          >
            <span style={{ fontSize: 13 }}>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {active === 'soap' && (
        <div className="animate-fade-in">
          {soapContent}
        </div>
      )}

      {active === 'chart' && (
        <div className="animate-fade-in flex flex-col items-center">
          {chart ? (
            <NatalChartWheel
              chart={chart}
              accentColor={accentColor}
              size={460}
            />
          ) : (
            <NoBirthTimeChart
              accentColor={accentColor}
              protocol={protocol}
            />
          )}
        </div>
      )}

      {active === 'body' && (
        <div className="animate-fade-in">
          {chart ? (
            <BodyMap chart={chart} accentColor={accentColor} />
          ) : (
            <NoBirthTimeChart
              accentColor={accentColor}
              protocol={protocol}
              message="Birth location required for body map"
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Fallback when chart not yet calculated ─────────────────────
function NoBirthTimeChart({
  accentColor,
  protocol,
  message,
}: {
  accentColor: string
  protocol: ProtocolOutput
  message?: string
}) {
  return (
    <div
      className="w-full text-center py-12 rounded-xl font-rajdhani"
      style={{
        background: hexToRgba(accentColor, 0.04),
        border: `1px solid rgba(255,255,255,0.08)`,
      }}
    >
      <div className="text-3xl mb-3" style={{ color: hexToRgba(accentColor, 0.5) }}>◎</div>
      <div className="text-[13px] text-white/50 mb-1">
        {message || 'Chart data not available'}
      </div>
      <div className="text-[11px] text-white/30">
        Enter birth location on the Intake screen to enable the chart and body map.
      </div>
    </div>
  )
}
