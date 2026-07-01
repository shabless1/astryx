'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { GlassCard, PrimaryButton, FormField, SectionLabel } from '@/components/ui'
import { hexToRgb, hexToRgba } from '@/lib/utils'

interface AuthScreenProps {
  accentColor: string
  onSuccess: () => void
  onSkip: () => void
  initialMode?: 'signin' | 'signup'
}

export default function AuthScreen({ accentColor, onSuccess, onSkip, initialMode = 'signin' }: AuthScreenProps) {
  const [mode, setMode]       = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const rgb = hexToRgb(accentColor)

  const handleCredentials = async () => {
    if (!email || !password) { setError('Email and password are required'); return }
    setLoading(true)
    setError(null)

    const res = await signIn('credentials', {
      email,
      password,
      action: mode,
      redirect: false,
    })

    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      onSuccess()
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-rajdhani px-5">
      <div className="w-full max-w-[420px] animate-fade-in-up">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/images/astryx%20logo%20b.png" alt="Astryx" className="h-20 w-auto mx-auto mb-4 rounded-xl" />
          <h1
            className="font-cinzel text-3xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, #fff, rgba(${rgb},0.85))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-[13px] text-white/45 tracking-[0.1em]">
            {mode === 'signin' ? 'Sign in to access your sessions' : 'Start your cosmic journey'}
          </p>
        </div>

        <GlassCard className="p-6">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null) }}
                className="flex-1 py-2 rounded-[10px] text-[11px] tracking-[0.18em] uppercase font-rajdhani transition-all duration-300"
                style={{
                  background: mode === m ? accentColor : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl mb-4 font-rajdhani text-[13px] tracking-[0.1em] transition-all duration-200 hover:bg-white/8"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] text-white/30">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email/password */}
          <div className="flex flex-col gap-3 mb-4">
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
              accentColor={accentColor}
            />
            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
              accentColor={accentColor}
            />
          </div>

          {error && (
            <div
              className="text-[12px] mb-3 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(232,69,60,0.12)', color: '#E8453C', border: '1px solid rgba(232,69,60,0.25)' }}
            >
              {error}
            </div>
          )}

          <PrimaryButton
            label={loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            onClick={handleCredentials}
            accent={accentColor}
            disabled={loading}
            glow
            fullWidth
          />
        </GlassCard>

        {/* Skip option */}
        <div className="text-center mt-5">
          <button
            onClick={onSkip}
            className="text-[12px] text-white/30 hover:text-white/55 transition-colors font-rajdhani tracking-[0.1em]"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Continue without account — sessions won't be saved
          </button>
        </div>
      </div>
    </div>
  )
}
