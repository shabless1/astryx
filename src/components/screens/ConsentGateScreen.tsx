/**
 * ASTRYX — Consent & Assumption-of-Risk gate (LEGAL SHIELD v1 · FIX 1)
 * ════════════════════════════════════════════════════════════════════════
 * Two modes:
 *   • 'gate'   — blocking. Shown on the first authenticated session BEFORE
 *                intake or any reading is reachable. No skip, no pre-checked
 *                box, no "remind me later". Server also enforces (the UI hiding
 *                is not the security boundary).
 *   • 'review' — read-only. Reached any time from the "Terms & Consent" footer
 *                link. Just the text + a way back.
 *
 * All copy comes from src/legal — the single counsel-edit file.
 */
'use client'

import { useState } from 'react'
import { hexToRgba } from '@/lib/utils'
import {
  CONSENT_INTRO,
  CONSENT_CLAUSES,
  CONSENT_CHECKBOX_LABEL,
  CONSENT_ACCEPT_CTA,
  CONSENT_LINK_LABEL,
  MICRO_DISCLAIMER,
} from '@/legal'

interface ConsentGateScreenProps {
  accentColor: string
  mode?: 'gate' | 'review'
  /** Called after the acceptance is recorded server-side and the session refreshed. */
  onAccepted?: () => void
  /** Review mode only — return to where the user came from. */
  onBack?: () => void
}

export default function ConsentGateScreen({
  accentColor,
  mode = 'gate',
  onAccepted,
  onBack,
}: ConsentGateScreenProps) {
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReview = mode === 'review'

  async function handleAccept() {
    if (!checked || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/consent', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Could not record your agreement. Please try again.')
      }
      onAccepted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen font-rajdhani flex items-center justify-center px-5 py-10">
      <div
        className="max-w-xl w-full rounded-[2rem] p-7 sm:p-8 animate-fade-in-up"
        style={{
          background: 'rgba(15,15,26,0.96)',
          border: `1px solid ${hexToRgba(accentColor, 0.32)}`,
          boxShadow: `0 28px 80px -30px ${hexToRgba(accentColor, 0.55)}`,
        }}
      >
        <div
          className="text-[10px] uppercase tracking-[0.3em] mb-3"
          style={{ color: hexToRgba(accentColor, 0.85) }}
        >
          {CONSENT_LINK_LABEL}
        </div>

        <h1 className="font-cinzel text-[24px] sm:text-[28px] text-white mb-4 leading-tight">
          Before you begin
        </h1>

        <p className="text-[13.5px] text-content-sm leading-relaxed mb-5">
          {CONSENT_INTRO}
        </p>

        <ul className="flex flex-col gap-2.5 mb-6">
          {CONSENT_CLAUSES.map((clause, i) => (
            <li key={i} className="flex gap-2.5 text-[12.5px] text-white/70 leading-relaxed">
              <span aria-hidden className="mt-[2px] shrink-0" style={{ color: hexToRgba(accentColor, 0.9) }}>
                •
              </span>
              <span>{clause}</span>
            </li>
          ))}
        </ul>

        {!isReview && (
          <>
            <label className="flex items-start gap-3 mb-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-[3px] h-4 w-4 shrink-0 accent-current"
                style={{ accentColor }}
              />
              <span className="text-[13px] text-white/85 leading-relaxed">
                {CONSENT_CHECKBOX_LABEL}
              </span>
            </label>

            {error && (
              <p className="text-[12px] mb-3 leading-relaxed" style={{ color: '#FF6B6B' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleAccept}
              disabled={!checked || submitting}
              className="kowalski-button w-full rounded-full px-5 py-3 text-[13px] font-medium transition-opacity"
              style={{
                background: checked ? hexToRgba(accentColor, 0.92) : hexToRgba(accentColor, 0.25),
                color: checked ? '#020208' : 'rgba(255,255,255,0.5)',
                cursor: checked && !submitting ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Recording…' : CONSENT_ACCEPT_CTA}
            </button>
          </>
        )}

        {isReview && onBack && (
          <button
            onClick={onBack}
            className="kowalski-button w-full rounded-full px-5 py-3 text-[13px] font-medium"
            style={{ background: hexToRgba(accentColor, 0.9), color: '#020208' }}
          >
            Back
          </button>
        )}

        <p className="text-[11px] text-white/40 leading-relaxed mt-5 text-center">
          {MICRO_DISCLAIMER}
        </p>
      </div>
    </div>
  )
}
