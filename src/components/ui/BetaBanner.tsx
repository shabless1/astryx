/**
 * ASTRYX — Beta banner (LEGAL SHIELD v1 · FIX 2).
 *
 * A dismissible notice that Astryx is in beta and everything shown is
 * observational reference, not medical advice. Dismissal is remembered per
 * CONSENT_VERSION — when that bumps (e.g. counsel updates the terms), the
 * banner returns once so returning users re-see the notice.
 *
 * Copy lives in src/legal (the single counsel-edit file).
 */
'use client'

import { useEffect, useState } from 'react'
import { hexToRgba } from '@/lib/utils'
import { BETA_BANNER, CONSENT_VERSION } from '@/legal'

const dismissKey = `astryx_beta_banner_dismissed_${CONSENT_VERSION}`

export default function BetaBanner({ accentColor }: { accentColor: string }) {
  // Start hidden to avoid an SSR/hydration flash; reveal after reading storage.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(dismissKey) !== '1') setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    try {
      localStorage.setItem(dismissKey, '1')
    } catch {
      /* private mode — banner simply reappears next load */
    }
    setVisible(false)
  }

  return (
    <div
      className="mb-4 px-4 py-2.5 rounded-2xl flex items-start gap-3 animate-fade-in-up"
      style={{
        background: hexToRgba(accentColor, 0.1),
        border: `1px solid ${hexToRgba(accentColor, 0.32)}`,
      }}
    >
      <span
        aria-hidden
        className="mt-[3px] inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
      />
      <span className="text-[12px] text-content leading-snug flex-1">{BETA_BANNER}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-white/40 hover:text-white/70 text-[13px] leading-none transition-colors"
      >
        ✕
      </button>
    </div>
  )
}
