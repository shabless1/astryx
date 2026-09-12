'use client'

import type { AppMode } from '@/types'
import { GlassCard, PrimaryButton, ModeToggle, SectionLabel } from '@/components/ui'
import { useIsPractitioner, PRACTITIONER_PRODUCT_URL, PRACTITIONER_TIER_LIVE } from '@/lib/tierGate'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { hexToRgba } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'
import { useAppStore } from '@/lib/store'
import { CHROME_PALETTES, PALETTE_ORDER, paletteById } from '@/lib/visual/chromePalettes'
import { useAstryxVoice } from '@/lib/useAstryxVoice'

type AstryxVoiceId = 'coral' | 'shimmer' | 'nova' | 'sage'
const ASTRYX_VOICES: { value: AstryxVoiceId; label: string; note: string }[] = [
  { value: 'coral',   label: 'Coral',   note: 'warm & expressive' },
  { value: 'shimmer', label: 'Shimmer', note: 'soft & gentle' },
  { value: 'nova',    label: 'Nova',    note: 'bright & clear' },
  { value: 'sage',    label: 'Sage',    note: 'calm & measured' },
]

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
    astryxVoice: 'coral' | 'shimmer' | 'nova' | 'sage'
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
  // P0 — the practitioner surface is entitlement-gated, not toggle-gated.
  const isPractitioner = useIsPractitioner()
  const { update: updateSession } = useSession()
  const [refreshing, setRefreshing] = useState(false)
  return (
    <div className="min-h-screen font-rajdhani">
      <div className="max-w-xl mx-auto px-5" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="mb-8 animate-fade-in-up">
          <SectionLabel>Your Instrument</SectionLabel>
          <h1 className="font-cinzel text-3xl text-white">Settings</h1>
        </div>

        {/* User Guide — opens the public guide page (myastryx.com/guide) in a new tab.
            Same page linked from the Sacred Tones fork-buyer email + packaging QR. */}
        <a
          href="/guide"
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-3 animate-fade-in-up"
        >
          <GlassCard className="flex items-center justify-between p-5 transition hover:brightness-125">
            <div>
              <div className="text-[11px] tracking-[0.2em] text-white/66 mb-1 uppercase">Help</div>
              <div className="text-[14px] text-white/90">User Guide</div>
              <div className="text-[12px] text-white/70 mt-0.5">Quick start &amp; the full manual — how to use every feature</div>
            </div>
            <span className="text-[18px]" style={{ color: accentColor }} aria-hidden="true">↗</span>
          </GlassCard>
        </a>

        {/* Mode — P0 gate. The toggle is a DISPLAY preference for people who
            hold the practitioner tier, not a way to acquire it. */}
        {isPractitioner ? (
          <GlassCard className="flex items-center justify-between p-5 mb-3 animate-fade-in-up">
            <div>
              <div className="text-[11px] tracking-[0.2em] text-white/66 mb-1 uppercase">Mode</div>
              <div className="text-[14px] text-white/80">
                {mode === 'practitioner' ? 'Practitioner — the full pattern' : 'User — Personal Guidance'}
              </div>
            </div>
            <ModeToggle mode={mode} setMode={setMode} accentColor={accentColor} />
          </GlassCard>
        ) : PRACTITIONER_TIER_LIVE ? (
          <GlassCard title="Practitioner" className="mb-3 animate-fade-in-up" bodyClass="p-5">
            <div className="text-[14px] text-white/90">Work on other people&rsquo;s charts</div>
            <div className="text-[12px] text-white/70 mt-0.5">
              A client roster, Sacred Tones Session Mode, the named marma points, and the practitioner export. $39.95 a month.
            </div>
            <div className="flex items-center gap-3 mt-4">
              <a
                href={PRACTITIONER_PRODUCT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] px-4 py-2 rounded-full transition hover:brightness-125"
                style={{ background: hexToRgba(accentColor, 0.18), color: accentColor, border: `1px solid ${hexToRgba(accentColor, 0.4)}` }}
              >
                Upgrade &#8599;
              </a>
              {/* Somebody who has just paid comes back to an app that still
                  thinks they are on the Individual tier, because the tier is
                  stamped on the session. This pulls it from the server on
                  demand, so they never have to guess that signing out is the
                  fix for something they already bought. */}
              <button
                type="button"
                onClick={async () => {
                  setRefreshing(true)
                  try { await updateSession() } finally { setRefreshing(false) }
                }}
                className="text-[12px] text-white/74 underline underline-offset-4 hover:text-white/80 transition disabled:opacity-40"
                disabled={refreshing}
              >
                {refreshing ? 'Checking…' : 'Already upgraded? Refresh access'}
              </button>
            </div>
          </GlassCard>
        ) : null}

        {/* Animation */}
        <SettingRow
          label="Motion"
          description="How much the cosmos moves behind you"
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
          label="Chamber Visuals"
          description="How deep the Chamber's visual field goes"
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

        {/* Astryx's spoken voice — all feminine; tap Preview to hear each. */}
        <VoiceSettingRow
          current={settings.astryxVoice ?? 'coral'}
          onChange={(v) => updateSettings({ astryxVoice: v })}
          accentColor={accentColor}
        />

        {/* The room's finish — five palettes, the user picks (SHA, 2026-09-12) */}
        <ChromePaletteRow />

        {/* v4.3 — session mode preference (skips the chamber's mode picker) */}
        <SessionModePreferenceRow accentColor={accentColor} />

        {/* Session duration */}
        <GlassCard style={{ animationDelay: '0.25s' }} title="Default Chamber Container" className="mb-3 animate-fade-in-up" bodyClass="p-5">
          <div className="text-[12px] text-white/66 mb-3">Minutes per session</div>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, 30, 45].map((d) => (
              <button
                key={d}
                onClick={() => updateSettings({ sessionDuration: d })}
                className="font-rajdhani text-[12px] transition-all duration-200"
                style={{
                  padding: '7px 16px',
                  borderRadius: 10,
                  border: `1px solid ${settings.sessionDuration === d ? accentColor : 'rgba(255,255,255,0.4)'}`,
                  background: settings.sessionDuration === d ? hexToRgba(accentColor, 0.18) : 'transparent',
                  color: settings.sessionDuration === d ? accentColor : 'rgba(255,255,255,0.72)',
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
        <GlassCard style={{ animationDelay: '0.3s' }} title="About Astryx" className="mb-6 animate-fade-in-up" bodyClass="p-5">
          <div className="text-[12px] text-white/62 leading-relaxed">
            Astryx is a deterministic multi-sensory calibration system. It uses astrological pattern intelligence as a structured wellness framework — not for prediction or fortune telling.
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="text-[10px] tracking-[0.2em] text-white/56">VERSION {APP_VERSION}</div>
            <div className="w-1 h-1 rounded-full bg-white/15" />
            <div className="text-[10px] tracking-[0.2em] text-white/56">COSMIC RESONANCE ENGINE</div>
          </div>
        </GlassCard>

        <PrimaryButton label="← Back to Intake" onClick={onBack} accent={accentColor} outlined />
      </div>
    </div>
  )
}

// FIX 8 — mark which physical Sacred Tone forks you own. Owned forks no longer
// show the "this is the simulated tone" prescription line in the Chamber.
// ── THE ROOM'S FINISH ────────────────────────────────────────────────────────
// SHA, 2026-09-12, on seeing the five: *"I love them all! this is what i am
// talking about baby!"* — so none of them was thrown away. The palette is the
// instrument's FINISH; the room within it is still resolved by the reading's
// STATE and never by the planet, so switching palettes changes what the colour
// is made of, never what it means. Tapping one re-resolves the accent from the
// reading already loaded, so the whole app moves on the tap.
function ChromePaletteRow() {
  const paletteId    = useAppStore((s) => s.chromePaletteId)
  const setPaletteId = useAppStore((s) => s.setChromePaletteId)
  const active       = paletteById(paletteId)

  return (
    <GlassCard
      style={{ animationDelay: '0.20s' }}
      title="The Room"
      badge={active.name}
      className="mb-3 animate-fade-in-up"
      bodyClass="p-5"
    >
      <div className="text-[12px] text-white/66 mb-4">
        The colour of the app follows your current signal — it cools when you are
        running hot and warms when you are running low. This is what that colour is
        made of.
      </div>

      <div className="flex flex-col gap-2">
        {PALETTE_ORDER.map((id) => {
          const p        = CHROME_PALETTES[id]
          const isActive = id === paletteId
          const rest     = p.rooms.balanced
          return (
            <button
              key={id}
              onClick={() => setPaletteId(id)}
              aria-pressed={isActive}
              className="w-full text-left rounded-xl p-3 transition-all duration-200"
              style={{
                background: isActive
                  ? `linear-gradient(150deg, ${hexToRgba(rest.hex, 0.20)}, rgba(2,2,8,0.35))`
                  : 'rgba(255,255,255,0.33)',
                border: `1px solid ${isActive ? hexToRgba(rest.hex, 0.55) : 'rgba(255,255,255,0.39)'}`,
                boxShadow: isActive
                  ? `inset 0 1px 0 rgba(255,255,255,0.5), 0 16px 34px -22px ${hexToRgba(rest.hex, 0.9)}`
                  : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                {/* the four rooms, in order: rest · cools · warms · opens */}
                <div className="flex gap-1 flex-shrink-0">
                  {(['balanced', 'elevated', 'depleted', 'blocked'] as const).map((st) => (
                    <span
                      key={st}
                      title={`${st} — ${p.rooms[st].name}`}
                      className="block rounded-full"
                      style={{
                        width: 13, height: 13,
                        background: p.rooms[st].hex,
                        border: '1px solid rgba(255,255,255,0.6)',
                        boxShadow: `0 0 10px ${hexToRgba(p.rooms[st].hex, 0.85)}`,
                      }}
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="font-cinzel text-[14px] font-bold truncate"
                    style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.80)' }}
                  >
                    {p.name}
                  </div>
                  <div className="text-[11px] text-white/70 truncate">{p.soul}</div>
                </div>
                {isActive && (
                  <span
                    className="text-[9px] uppercase tracking-[0.18em] flex-shrink-0 px-2 py-1 rounded-full"
                    style={{
                      color: rest.hex,
                      border: `1px solid ${hexToRgba(rest.hex, 0.45)}`,
                      background: hexToRgba(rest.hex, 0.10),
                    }}
                  >
                    On
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="text-[11px] text-white/62 mt-4 leading-relaxed">
        <span style={{ color: active.rooms.balanced.hex }}>Where it comes from &mdash;</span>{' '}
        {active.source}
      </div>
    </GlassCard>
  )
}

// v4.3 — Session Mode preference: Ask each time (default) shows the chamber's
// two-card picker; a fixed mode starts sessions directly in that mode.
function SessionModePreferenceRow({ accentColor }: { accentColor: string }) {
  const remembered = useAppStore((s) => s.rememberedSessionMode)
  const setRemembered = useAppStore((s) => s.setRememberedSessionMode)
  const OPTIONS = [
    { value: 'ask',        label: 'Ask each time' },
    { value: 'calibrated', label: 'Natal Calibration' },
    { value: 'full_body',  label: 'Full Body' },
    { value: 'chakra',     label: 'Chakra' },
    { value: 'marma',      label: 'Marma' },
  ] as const
  return (
    <GlassCard style={{ animationDelay: '0.22s' }} title="Session Mode" className="mb-3 animate-fade-in-up" bodyClass="p-5">
      <div className="text-[12px] text-white/66 mb-3">
        Natal Calibration — the only session tuned to your chart and today&apos;s sky;
        placements follow your own natal placements. Full Body — the complete anatomical
        ladder, all twelve forks, ground to crown and back, at their traditional placements.
        Marma — the same twelve at their named Ayurvedic points, heel to crown to sole.
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
              border: `1px solid ${remembered === o.value ? accentColor : 'rgba(255,255,255,0.4)'}`,
              background: remembered === o.value ? hexToRgba(accentColor, 0.18) : 'transparent',
              color: remembered === o.value ? accentColor : 'rgba(255,255,255,0.72)',
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
    <GlassCard style={{ animationDelay: '0.28s' }} title="Sacred Tones You Own" className="mb-3 animate-fade-in-up" bodyClass="p-5">
      <div className="text-[12px] text-white/58 mb-3">
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
                border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.4)'}`,
                background: on ? hexToRgba(accentColor, 0.18) : 'transparent',
                color: on ? accentColor : 'rgba(255,255,255,0.72)',
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
    <GlassCard style={{ animationDelay: '0.29s' }} title="Session Fit" className="mb-3 animate-fade-in-up" bodyClass="p-5">
      <div className="text-[12px] text-white/58 mb-3">When a chart needs more work than your container holds.</div>
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
                border: `1px solid ${on ? accentColor : 'rgba(255,255,255,0.4)'}`,
                background: on ? hexToRgba(accentColor, 0.18) : 'transparent',
                color: on ? accentColor : 'rgba(255,255,255,0.72)', cursor: 'pointer',
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
    <GlassCard style={{ animationDelay: `${delay}s` }} title={label} className="mb-3 animate-fade-in-up" bodyClass="p-5">
      <div className="text-[12px] text-white/58 mb-3">{description}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="font-rajdhani text-[12px] transition-all duration-200"
            style={{
              padding: '7px 18px',
              borderRadius: 10,
              border: `1px solid ${current === o.value ? accentColor : 'rgba(255,255,255,0.4)'}`,
              background: current === o.value ? hexToRgba(accentColor, 0.18) : 'transparent',
              color: current === o.value ? accentColor : 'rgba(255,255,255,0.72)',
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

function VoiceSettingRow({
  current, onChange, accentColor,
}: {
  current: AstryxVoiceId
  onChange: (v: AstryxVoiceId) => void
  accentColor: string
}) {
  const { speak, stop, speakingId } = useAstryxVoice()
  const previewing = speakingId === 'voice-preview'
  const note = ASTRYX_VOICES.find((v) => v.value === current)?.note ?? ''
  return (
    <GlassCard style={{ animationDelay: '0.22s' }} title="Astryx Voice" className="mb-3 animate-fade-in-up" bodyClass="p-5">
      <div className="text-[12px] text-white/58 mb-3">Her spoken voice — all feminine · currently {note}</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {ASTRYX_VOICES.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="font-rajdhani text-[12px] transition-all duration-200"
            style={{
              padding: '7px 18px',
              borderRadius: 10,
              border: `1px solid ${current === o.value ? accentColor : 'rgba(255,255,255,0.4)'}`,
              background: current === o.value ? hexToRgba(accentColor, 0.18) : 'transparent',
              color: current === o.value ? accentColor : 'rgba(255,255,255,0.72)',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => previewing
          ? stop()
          : speak("Hello, I'm Astryx. This is my voice. I'll walk you through your calibration, and through the field around it.", 'voice-preview')}
        className="font-rajdhani text-[11px] tracking-[0.15em] uppercase transition"
        style={{
          padding: '6px 14px', borderRadius: 9,
          border: `1px solid ${hexToRgba(accentColor, 0.4)}`,
          background: hexToRgba(accentColor, 0.1), color: accentColor, cursor: 'pointer',
        }}
      >
        {previewing ? '■ Stop' : '▸ Preview voice'}
      </button>
    </GlassCard>
  )
}
