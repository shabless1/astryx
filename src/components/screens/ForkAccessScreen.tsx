'use client'

/**
 * ForkAccessScreen (Directive v4.0 · Fix 2/8) — the beta access door.
 *
 * Beta access comes with the Sacred Tones fork set. Unentitled users land
 * here from the Upgrade button (Fix 8) and from access gates. Entitled
 * users never see this screen.
 *
 * Copy reviewed against COMPLIANCE.md — reference-tool register, no
 * outcome or clinical claims.
 */

import { hexToRgba } from '@/lib/utils'
import { MICRO_DISCLAIMER } from '@/lib/compliance'

const FORK_SHOP_URL =
  process.env.NEXT_PUBLIC_FORK_SHOP_URL || 'https://sacredtea.net'

export default function ForkAccessScreen({
  accentColor,
  sessionEmail,
  onSignIn,
  onBack,
}: {
  accentColor: string
  sessionEmail: string | null
  onSignIn: () => void
  onBack: () => void
}) {
  return (
    <div className="min-h-screen font-rajdhani flex items-center justify-center px-5 py-16">
      <div
        className="max-w-md w-full rounded-[2rem] p-8 text-center"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(94,224,255,0.06) 0%, rgba(2,2,8,0.94) 60%)',
          border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
          boxShadow: `0 28px 60px -30px ${hexToRgba(accentColor, 0.5)}`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
          Beta access
        </div>
        <h1 className="font-cinzel text-2xl text-white mb-3">Astryx + Sacred Tones</h1>
        <p className="text-[13.5px] text-content-sm leading-relaxed mb-6">
          Astryx beta access comes with the Sacred Tones fork set — the physical
          planetary forks the app calibrates your sessions around.
        </p>

        <div className="flex flex-col gap-2.5 mb-6">
          <a
            href={FORK_SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="kowalski-button rounded-2xl px-5 py-3 font-medium text-[14px]"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.9)} 0%, ${hexToRgba(accentColor, 0.55)} 100%)`,
              color: '#020208',
            }}
          >
            Get the Sacred Tones fork set →
          </a>
        </div>

        <p className="text-[12.5px] text-white/70 leading-relaxed mb-3">
          Bought the forks? Sign in with the same email you used at checkout —
          your access unlocks automatically.
        </p>
        {sessionEmail && (
          <p className="text-[11.5px] text-white/45 leading-relaxed mb-4">
            You&apos;re signed in as <span className="text-white/70">{sessionEmail}</span>.
            If your fork order used a different email, sign in with that one.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onSignIn}
            className="kowalski-button rounded-2xl px-5 py-3 text-[13px]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
          >
            {sessionEmail ? 'Sign in with a different email' : 'Sign in'}
          </button>
          <button
            onClick={onBack}
            className="kowalski-button rounded-2xl px-5 py-3 text-[13px]"
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)' }}
          >
            ← Back
          </button>
        </div>

        <p className="mt-6 text-[10px] text-white/40">{MICRO_DISCLAIMER}</p>
      </div>
    </div>
  )
}
