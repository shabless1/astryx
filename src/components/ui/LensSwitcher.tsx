'use client'

/**
 * ASTRYX — Practitioner Lens Switcher
 *
 * Build Directive Fix 4 · Horizontal scrollable tab row with 8 tabs.
 * Active tab highlighted with accentColor. State managed via Zustand
 * (persisted), so lens choice survives navigation and page refresh.
 *
 * DECISION: Component is presentation-only — it reads the lens from
 * Zustand and writes back via the setter. Callers don't pass props for
 * the lens itself, only the accentColor. This keeps the switcher
 * drop-in placeable on any screen that wants to expose lens selection.
 */

import type { PractitionerLens } from '@/types'
import { useAppStore } from '@/lib/store'
import { hexToRgba } from '@/lib/utils'

interface LensOption {
  value: PractitionerLens
  icon:  string
  label: string
  shortLabel: string
}

// 8 lenses per ASTRYX_COMPLETE_GUIDE.md. Icons from the guide.
const LENS_OPTIONS: LensOption[] = [
  { value: 'individual',           icon: '🌑', label: 'Individual User',       shortLabel: 'Individual' },
  { value: 'medical_astrologer',   icon: '🔭', label: 'Medical Astrologer',    shortLabel: 'Med Astro' },
  { value: 'reiki',                icon: '✋', label: 'Reiki Practitioner',    shortLabel: 'Reiki' },
  { value: 'bodyworker',           icon: '💪', label: 'Bodyworker',            shortLabel: 'Bodywork' },
  { value: 'naturopath_herbalist', icon: '🌿', label: 'Naturopath / Herbalist', shortLabel: 'Naturopath' },
  { value: 'ayurvedic',            icon: '🕉',  label: 'Ayurvedic Practitioner', shortLabel: 'Ayurvedic' },
  { value: 'acupuncturist_tcm',    icon: '🪡', label: 'Acupuncturist / TCM',   shortLabel: 'TCM' },
  { value: 'pastoral_spiritual',   icon: '🕯',  label: 'Pastoral / Spiritual', shortLabel: 'Pastoral' },
]

interface LensSwitcherProps {
  accentColor: string
}

export default function LensSwitcher({ accentColor }: LensSwitcherProps) {
  const lens    = useAppStore((s) => s.practitionerLens)
  const setLens = useAppStore((s) => s.setPractitionerLens)

  return (
    <div className="mb-4">
      <div className="text-[10px] tracking-[0.25em] text-white/40 mb-2 uppercase">
        Practitioner Lens — choose your modality
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
        {LENS_OPTIONS.map((opt) => {
          const isActive = opt.value === lens
          return (
            <button
              key={opt.value}
              onClick={() => setLens(opt.value)}
              title={opt.label}
              className="flex-shrink-0 px-3 py-2 rounded-lg text-[11px] tracking-widest transition whitespace-nowrap"
              style={{
                background: isActive ? hexToRgba(accentColor, 0.18) : 'rgba(255,255,255,0.04)',
                border:     `1px solid ${isActive ? hexToRgba(accentColor, 0.5) : 'rgba(255,255,255,0.1)'}`,
                color:      isActive ? accentColor : 'rgba(255,255,255,0.55)',
              }}
            >
              <span className="mr-1.5">{opt.icon}</span>
              <span className="uppercase">{opt.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
