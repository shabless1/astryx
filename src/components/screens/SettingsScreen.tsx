'use client'

import type { AppMode } from '@/types'
import { GlassCard, PrimaryButton, ModeToggle, SectionLabel } from '@/components/ui'
import { hexToRgba } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'
import { useAppStore } from '@/lib/store'

const FORK_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

interface SettingsScreenProps {
  accentColor: string
  mode: AppMode
  setMode: (mode: AppMode) => void
  settings: {
    animationIntensity: 'low' | 'medium' | 'high'
    soundPreview: 'off' | 'tone' | 'full'
    visualIntensity: 'low' | 'medium' | 'high'
    breathGuide: 'active' | 'passive' | 'off'
    sessionDuration: number
  }
  updateSettings: (s: Partial<SettingsScreenProps['settings']>) => void
  onBack: () => void
}

export default function SettingsScreen({
  accentColor,
  mode,
  setMode,
  settings,
  updateSettings,
  onBack,
}: SettingsScreenProps) {
  return (
    <div className="min-h-screen font-rajdhani">
      <div className="max-w-xl mx-auto px-5" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="mb-8 animate-fade-in-up">
          <SectionLabel>System Preferences</SectionLabel>
          <h1 className="font-cinzel text-3xl text-white">Settings</h1>
        </div>

        {/* Mode */}
        <GlassCard className="flex items-center justify-between p-5 mb-3 animate-fade-in-up">
          <div>
            <div className="text-[11px] tracking-[0.2em] text-white/40 mb-1 uppercase">Operating Mode</div>
            <div className="text-[14px] text-white/80">
              {mode === 'practitioner' ? 'Practitioner — Full Pattern View' : 'User — Personal Guidance'}
            </div>
          </div>
          <ModeToggle mode={mode} setMode={setMode} accentColor={accentColor} />
        </GlassCard>

        {/* Animation */}
        <SettingRow
          label="Animation Intensity"
          description="Controls visual motion complexity across all screens"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          current={settings.animationIntensity}
          onChange={(v) => updateSettings({ animationIntensity: v as any })}
          accentColor={accentColor}
          delay={0.05}
        />

        {/* Sound — Phase 14: audio lives ONLY in the Chamber + Music tab.
            This sets the default chamber mix; nothing plays on the report. */}
        <SettingRow
          label="Chamber Audio"
          description="Audio plays only inside the Chamber and Music Library — never on the report. This sets your default chamber mix."
          options={[
            { value: 'off', label: 'Muted' },
            { value: 'tone', label: 'Music' },
            { value: 'full', label: 'Music + Texture' },
          ]}
          current={settings.soundPreview}
          onChange={(v) => updateSettings({ soundPreview: v as any })}
          accentColor={accentColor}
          delay={0.1}
        />

        {/* Visual intensity */}
        <SettingRow
          label="Visual Intensity"
          description="Session mode visual engine depth and complexity"
          options={[
            { value: 'low', label: 'Minimal' },
            { value: 'medium', label: 'Standard' },
            { value: 'high', label: 'Immersive' },
          ]}
          current={settings.visualIntensity}
          onChange={(v) => updateSettings({ visualIntensity: v as any })}
          accentColor={accentColor}
          delay={0.15}
        />

        {/* Breath guide */}
        <SettingRow
          label="Breath Guide"
          description="4-7-8 breathing overlay during session mode"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'passive', label: 'Passive' },
            { value: 'off', label: 'Off' },
          ]}
          current={settings.breathGuide}
          onChange={(v) => updateSettings({ breathGuide: v as any })}
          accentColor={accentColor}
          delay={0.2}
        />

        {/* v4.3 — session mode preference (skips the chamber's mode picker) */}
        <SessionModePreferenceRow accentColor={accentColor} />

        {/* Session duration */}
        <GlassCard className="p-5 mb-3 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="text-[11px] tracking-[0.2em] text-white/40 mb-1 uppercase">Default Session Duration</div>
          <div className="text-[12px] text-white/40 mb-3">Minutes per calibration session</div>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, 30, 45].map((d) => (
              <button
                key={d}
                onClick={() => updateSettings({ sessionDuration: d })}
                className="font-rajdhani text-[12px] transition-all duration-200"
                style={{
                  padding: '7px 16px',
                  borderRadius: 10,
                  border: `1px solid ${settings.sessionDuration === d ? accentColor : 'rgba(255,255,255,0.1)'}`,
                  background: settings.sessionDuration === d ? hexToRgba(accentColor, 0.18) : 'transparent',
                  color: settings.sessionDuration === d ? accentColor : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
              >
                {d} min
              </button>
            ))}
          </div>
        </GlassCard>

        {/* FIX 8 — Sacred Tones you own (hides the "simulated tone" note per fork) */}
        <OwnedForksCard accentColor={accentColor} />

        {/* v2 FIX I — how a heavily-aspected chart fits the chosen container */}
        <ContainerFitCard accentColor={accentColor} />

        {/* App info */}
        <GlassCard className="p-5 mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-[11px] tracking-[0.2em] text-white/40 mb-3 uppercase">About Astryx</div>
          <div className="text-[12px] text-white/35 leading-relaxed">
            Astryx is a deterministic multi-sensory calibration system. It uses astrological pattern intelligence as a structured wellness framework — not for prediction or fortune telling.
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="text-[10px] tracking-[0.2em] text-white/20">VERSION {APP_VERSION}</div>
            <div className="w-1 h-1 rounded-full bg-white/15" />
            <div className="text-[10px] tracking-[0.2em] text-white/20">COSMIC RESONANCE ENGINE</div>
          </div>
        </GlassCard>

        <PrimaryButton label="← Back to Intake" onClick={onBack} accent={accentColor} outlined />
      </div>
    </div>
  )
}

// FIX 8 — mark which physical Sacred Tone forks you own. Owned forks no longer
// show the "this is the simulated tone" prescription line in the Chamber.
// v4.3 — Session Mode preference: Ask each time (default) shows the chamber's
// two-card picker; a fixed mode starts sessions directly in that mode.
function SessionModePreferenceRow({ accentColor }: { accentColor: string }) {
  const remembered = useAppStore((s) => s.rememberedSessionMode)
  const setRemembered = useAppStore((s) => s.setRememberedSessionMode)
  const OPTIONS = [
    { value: 'ask',        label: 'Ask each time' },
    { value: 'calibrated', label: 'Calibrated' },
    { value: 'full_body',  label: 'Full Body' },
  ] as const
  return (
    <GlassCard className="p-5 mb-3 animate-fade-in-up" style={{ animationDelay: '0.22s' }}>
      <div className="text-[11px] tracking-[0.2em] text-white/40 mb-1 uppercase">Session Mode</div>
      <div className="text-[12px] text-white/40 mb-3">
        Calibrated — tuned to your chart and today&apos;s sky. Full Body — the complete
        anatomical ladder, all twelve forks, ground to crown and back.
      </div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setRemembered(o.value)}
            className="font-rajdhani text-[12px] transition-all duration-200"
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              border: `1px solid ${remembered === o.value ? accentColor : 'rgba(255,255,255,0.1)'}`,
              background: remembered === o.value ? hexToRgba(accentColor, 0.18) : 'transparent',
              color: remembered === o.value ? accentColor : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}

function OwnedForksCard({ accentColor }: { accentColor: string }) {
  const ownedForks = useAppStore((s) => s.ownedForks)
  const toggleOwnedFork = useAppStore((s) => s.toggleOwnedFork)
  return (
    <GlassCard className="p-5 mb-3 animate-fade-in-up" style={{ animationDelay: '0.28s' }}>
      <div className="text-[11px] tracking-[0.2em] text-white/40 mb-0.5 uppercase">Sacred Tones You Own</div>
      <div className="text-[12px] text-white/30 mb-3">
        Tap the forks you physically own. The Chamber stops showing the &ldquo;simulated tone&rdquo; note for those.
      </div>
      <div className="flex flex-wrap gap-2">
        {FORK_PLANETS.map((p) => {
          const on = ownedForks.includes(p)
          return (
            <button
              key={p}
              onClick={() => toggleOwnedFork(p)}
              className="font-rajdhani text-[12px] transition-all duration-200"
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.1)'}`,
                background: on ? hexToRgba(accentColor, 0.18) : 'transparent',
                color: on ? accentColor : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              {on ? '✓ ' : ''}{p}
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}

// v2 FIX I — container-fit override. priorityCap (default): full holds on the
// forks that matter, drop the lowest overflow. proportionalCompress: scale all.
function ContainerFitCard({ accentColor }: { accentColor: string }) {
  const containerFitMode = useAppStore((s) => s.containerFitMode)
  const setContainerFitMode = useAppStore((s) => s.setContainerFitMode)
  const opts: { value: 'priorityCap' | 'proportionalCompress'; label: string; hint: string }[] = [
    { value: 'priorityCap', label: 'Depth (default)', hint: 'Full holds on the forks that matter most; drop the lowest overflow.' },
    { value: 'proportionalCompress', label: 'Breadth', hint: 'Keep every fork but shorten each hold to fit the container.' },
  ]
  return (
    <GlassCard className="p-5 mb-3 animate-fade-in-up" style={{ animationDelay: '0.29s' }}>
      <div className="text-[11px] tracking-[0.2em] text-white/40 mb-0.5 uppercase">Session Fit</div>
      <div className="text-[12px] text-white/30 mb-3">When a chart needs more work than your container holds.</div>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const on = containerFitMode === o.value
          return (
            <button
              key={o.value}
              onClick={() => setContainerFitMode(o.value)}
              title={o.hint}
              className="font-rajdhani text-[12px] transition-all duration-200"
              style={{
                padding: '7px 16px', borderRadius: 10,
                border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.1)'}`,
                background: on ? hexToRgba(accentColor, 0.18) : 'transparent',
                color: on ? accentColor : 'rgba(255,255,255,0.5)', cursor: 'pointer',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}

function SettingRow({
  label,
  description,
  options,
  current,
  onChange,
  accentColor,
  delay,
}: {
  label: string
  description: string
  options: { value: string; label: string }[]
  current: string
  onChange: (v: string) => void
  accentColor: string
  delay: number
}) {
  return (
    <GlassCard className="p-5 mb-3 animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
      <div className="text-[11px] tracking-[0.2em] text-white/40 mb-0.5 uppercase">{label}</div>
      <div className="text-[12px] text-white/30 mb-3">{description}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="font-rajdhani text-[12px] transition-all duration-200"
            style={{
              padding: '7px 18px',
              borderRadius: 10,
              border: `1px solid ${current === o.value ? accentColor : 'rgba(255,255,255,0.1)'}`,
              background: current === o.value ? hexToRgba(accentColor, 0.18) : 'transparent',
              color: current === o.value ? accentColor : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}
