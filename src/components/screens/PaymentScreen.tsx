'use client'

/**
 * ASTRYX — Upgrade / Premium  (Coming Soon)
 * ════════════════════════════════════════════════════════════════════════════
 * The XRP-only paywall is removed pre-launch (SHA 2026-06-28). Premium hasn't
 * launched; when it does, crypto will be ONE option, not the only way to upgrade.
 * This screen now shows a calm "coming soon" state. The previous XRPL payment
 * flow (createSession / polling / xrpPayment.ts) is retired here — re-introduce a
 * proper checkout (card + optional crypto) when Premium goes live.
 *
 * Props kept identical so the app's routing (page.tsx) needs no change.
 */

import { hexToRgb, hexToRgba } from '@/lib/utils'

interface PaymentScreenProps {
  accentColor: string
  userId: string
  onSuccess: () => void
  onBack: () => void
}

export default function PaymentScreen({ accentColor, onBack }: PaymentScreenProps) {
  const rgb = hexToRgb(accentColor)

  return (
    <div className="min-h-screen font-rajdhani flex items-center justify-center px-5">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div className="text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
          Premium Access
        </div>
        <h1
          className="font-cinzel text-3xl sm:text-4xl font-semibold mb-3"
          style={{
            background: `linear-gradient(135deg, #fff, rgba(${rgb},0.85))`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}
        >
          Coming Soon
        </h1>
        <p className="text-[14px] text-content-sm leading-relaxed mb-8">
          Astryx Premium isn&apos;t live yet. When it launches, you&apos;ll be able to
          upgrade your way — by card, with crypto as an option, never the only path.
          Your full calibration, daily readings, the Chamber, and Ask&nbsp;Astryx are
          all yours right now, free.
        </p>

        <div
          className="rounded-[1.75rem] p-6 mb-7 text-left"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accentColor, 0.08)} 0%, rgba(2,2,8,0.9) 60%)`,
            border: `1px solid ${hexToRgba(accentColor, 0.25)}`,
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/45 mb-3">What Premium will add</div>
          {[
            ['◎', 'Practitioner mode', 'Clinical depth, client roster, session notes'],
            ['♫', 'Full sound layers', 'Binaural, solfeggio, ambient texture'],
            ['✦', 'PDF protocol export', 'Print-ready calibration reports'],
            ['◉', 'Unlimited history', 'Your full session archive'],
          ].map(([glyph, title, sub]) => (
            <div key={title} className="flex items-start gap-3 py-2">
              <span className="mt-0.5 text-[13px]" style={{ color: accentColor }} aria-hidden>{glyph}</span>
              <div>
                <div className="text-[13.5px] text-white/90">{title}</div>
                <div className="text-[11.5px] text-white/45">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="kowalski-button rounded-full px-6 py-2.5 text-[12px] tracking-[0.18em] uppercase"
          style={{
            background: hexToRgba(accentColor, 0.14),
            border: `1px solid ${hexToRgba(accentColor, 0.45)}`,
            color: 'rgba(255,255,255,0.9)', cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
