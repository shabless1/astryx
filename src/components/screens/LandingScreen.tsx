'use client'

/**
 * ASTRYX — Landing page (the front door at myastryx.com)
 * ════════════════════════════════════════════════════════════════════════════
 * The first thing a visitor sees: the ASTRYX hero + the positioning slogan +
 * a short orientation, with Sign Up / Sign In at the bottom. Replaces the old
 * intake intro (which is now trimmed to a simple ASTRYX header). (SHA 2026-06-29)
 */

import { hexToRgba } from '@/lib/utils'

interface LandingScreenProps {
  accentColor: string
  onSignUp: () => void
  onSignIn: () => void
}

export default function LandingScreen({ accentColor, onSignUp, onSignIn }: LandingScreenProps) {
  const rgba = (c: string, a: number) => (c?.startsWith('#') ? hexToRgba(c, a) : c)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-rajdhani px-5 py-16 text-center">
      <div className="w-full max-w-2xl animate-fade-in-up">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full"
             style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${rgba(accentColor, 0.32)}` }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-cosmic-pulse"
                style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium" style={{ color: rgba(accentColor, 0.95) }}>
            Cosmic Resonance System
          </span>
        </div>

        {/* Wordmark */}
        <h1
          className="font-cinzel font-bold tracking-[-0.03em] leading-none mb-5"
          style={{
            fontSize: 'clamp(54px, 11vw, 92px)',
            color: '#ffffff',
            textShadow: `0 0 60px ${rgba(accentColor, 0.45)}, 0 0 120px ${rgba(accentColor, 0.2)}`,
          }}
        >
          ASTRYX
        </h1>

        {/* The slogan (SHA 2026-06-29) */}
        <p
          className="font-cinzel mx-auto mb-4"
          style={{
            fontSize: 'clamp(18px, 3vw, 26px)',
            lineHeight: 1.3,
            color: 'rgba(255,255,255,0.95)',
            textWrap: 'balance',
          }}
        >
          It&apos;s not about predictions, it&apos;s about recalibration.
        </p>

        {/* Short orientation */}
        <p className="text-content-sm leading-relaxed mx-auto mb-8 max-w-[52ch] text-[14px]">
          Enter your birth details and a quick resonance scan to receive a personalized
          <span className="text-content"> 6-Sense Calibration Plan</span> and a guided
          <span className="text-content"> Chamber session</span>. You don&apos;t need to know
          astrology to begin — Astryx translates your chart into sound, breath, color, and remedy guidance.
        </p>

        {/* Sign Up / Sign In */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-sm mx-auto">
          <button
            onClick={onSignUp}
            className="kowalski-button flex-1 rounded-full px-6 py-3 text-[13px] tracking-[0.18em] uppercase font-semibold"
            style={{
              background: `linear-gradient(135deg, ${rgba(accentColor, 0.95)} 0%, ${rgba(accentColor, 0.6)} 100%)`,
              color: '#020208',
              boxShadow: `0 0 26px -6px ${rgba(accentColor, 0.7)}`,
            }}
          >
            Sign Up
          </button>
          <button
            onClick={onSignIn}
            className="kowalski-button flex-1 rounded-full px-6 py-3 text-[13px] tracking-[0.18em] uppercase"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${rgba(accentColor, 0.45)}`,
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            Sign In
          </button>
        </div>

        {/* Beta access note — the app is account-gated (fork-buyer beta). The
            old "continue without an account" guest path was removed 2026-07-20
            (SHA): access now requires signing up. */}
        <p className="mt-6 text-[11px] text-white/40 tracking-wide max-w-[46ch] mx-auto leading-relaxed">
          Astryx is in private beta. Sign up with the email from your Sacred Tones
          fork order to unlock full access.
        </p>

        <p className="mt-8 text-[10px] text-white/30 tracking-wide">ⓘ Reference tool · Not medical advice</p>
      </div>
    </div>
  )
}
