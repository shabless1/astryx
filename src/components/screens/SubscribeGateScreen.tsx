'use client'

/**
 * ASTRYX — Subscribe-to-Return Gate  (Directive v1.0 · FIX 9)
 * ════════════════════════════════════════════════════════════════════════════
 * Shown when the 30-day trial has expired. The app is locked behind this; the
 * door is locked, never the room — natal chart, history, and before→after trends
 * are all preserved and restored the moment the user subscribes.
 *
 * Billing = Shopify. "Subscribe" opens the Shopify subscription checkout
 * (SUBSCRIBE_URL). After completing it, "I've subscribed" re-verifies and unlocks.
 * Deliberate opt-in: the card is entered at the gate, by the user's own action.
 */

import { useState } from 'react'
import { hexToRgba } from '@/lib/utils'
import { MICRO_DISCLAIMER, } from '@/lib/compliance'
import { SUB_PRICE, SUBSCRIBE_URL } from '@/lib/subscription'

export default function SubscribeGateScreen({
  accentColor, onRestore,
}: {
  accentColor: string
  /** Re-verify subscription (Shopify at launch). Returns true if now active. */
  onRestore: () => Promise<boolean> | boolean
}) {
  const [checking, setChecking] = useState(false)
  const [noneFound, setNoneFound] = useState(false)

  const subscribe = () => {
    if (typeof window !== 'undefined') window.open(SUBSCRIBE_URL, '_blank', 'noopener')
  }
  const restore = async () => {
    setChecking(true); setNoneFound(false)
    const ok = await onRestore()
    setChecking(false)
    if (!ok) setNoneFound(true)
  }

  return (
    <div className="min-h-screen font-rajdhani flex items-center justify-center px-5">
      <div
        className="max-w-md w-full rounded-[2rem] p-8 text-center animate-fade-in-up"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(94,224,255,0.06) 0%, rgba(2,2,8,0.95) 60%)',
          border: `1px solid ${hexToRgba(accentColor, 0.32)}`,
          boxShadow: `0 28px 80px -30px ${hexToRgba(accentColor, 0.55)}`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
          Your 30 days are complete
        </div>
        <h1 className="font-cinzel text-[26px] sm:text-[30px] text-white mb-3 leading-tight">
          Keep your daily calibration going
        </h1>
        <p className="text-[13.5px] text-content-sm leading-relaxed mb-2">
          Your free experience has completed. Subscribe to return to your daily recalibration —
          forks tuned to the live sky, every day.
        </p>
        <p className="text-[12px] text-white/45 leading-relaxed mb-6">
          Your chart, history, and progress are safe — subscribing restores you exactly where you left off.
        </p>

        <div className="font-cinzel text-[34px] mb-1" style={{ color: accentColor }}>{SUB_PRICE}</div>
        <div className="text-[11px] text-white/40 mb-6 tracking-[0.04em]">
          Billed monthly · cancel anytime · auto-renews until cancelled
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={subscribe}
            className="kowalski-button w-full rounded-2xl px-5 py-4 font-medium text-[15px]"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.95)} 0%, ${hexToRgba(accentColor, 0.6)} 100%)`,
              color: '#020208',
              boxShadow: `0 0 28px -4px ${hexToRgba(accentColor, 0.7)}`,
            }}
          >
            Subscribe to return →
          </button>
          <button
            onClick={restore}
            disabled={checking}
            className="kowalski-button w-full rounded-2xl px-5 py-3 text-[13px] disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.82)' }}
          >
            {checking ? 'Checking…' : 'I’ve subscribed — restore my access'}
          </button>
        </div>

        {noneFound && (
          <p className="text-[11.5px] mt-3 leading-relaxed" style={{ color: '#FCA5A5' }}>
            No active subscription found yet. If you just subscribed, give it a moment and try again.
          </p>
        )}

        <p className="text-[10px] tracking-[0.18em] text-white/30 mt-7">{MICRO_DISCLAIMER}</p>
      </div>
    </div>
  )
}
