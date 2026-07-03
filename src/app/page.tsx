'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAppStore } from '@/lib/store'
import { runEngine, getAccentColor, geocodeLocation } from '@/lib/engine'
import { computeDailyElement } from '@/lib/dailyElement'
import { computeSubscription, verifySubscription } from '@/lib/subscription'
import { signalWord } from '@/lib/signalCopy'
import { generateId, hexToRgba } from '@/lib/utils'
import { audioSession } from '@/lib/audioSession'

// Layout
import CosmicBackground from '@/components/layout/CosmicBackground'
import NavBar from '@/components/layout/NavBar'

// Screens
import LandingScreen from '@/components/screens/LandingScreen'
import AuthScreen from '@/components/screens/AuthScreen'
import PaymentScreen from '@/components/screens/PaymentScreen'
import IntakeScreen from '@/components/screens/IntakeScreen'
import AnalysisScreen from '@/components/screens/AnalysisScreen'
import DailyCheckInScreen, { type DailyInput } from '@/components/screens/DailyCheckInScreen'
import DashboardScreen from '@/components/screens/DashboardScreen'
import TodaySignalScreen from '@/components/screens/TodaySignalScreen'
import ResultsScreen from '@/components/screens/ResultsScreen'
import SessionScreen from '@/components/screens/SessionScreen'
import PractitionerScreen from '@/components/screens/PractitionerScreen'
import HistoryScreen from '@/components/screens/HistoryScreen'
import SettingsScreen from '@/components/screens/SettingsScreen'
import BodySystemPreviewScreen from '@/components/screens/BodySystemPreviewScreen'
import ChartScreen from '@/components/screens/ChartScreen'
import BodyGridScreen from '@/components/screens/BodyGridScreen'
import ClientRosterScreen from '@/components/screens/ClientRosterScreen'
import HomeScreen from '@/components/screens/HomeScreen'
import SubscribeGateScreen from '@/components/screens/SubscribeGateScreen'
import ForkAccessScreen from '@/components/screens/ForkAccessScreen'
import SessionModePicker from '@/components/screens/SessionModePicker'
import type { SessionMode } from '@/lib/store'
import MusicLibraryScreen from '@/components/screens/MusicLibraryScreen'
import PostSessionSummary from '@/components/screens/PostSessionSummary'
import TeacherChat from '@/components/teacher/TeacherChat'
import type { AppScreen, ClientRecord, SessionSummarySnapshot } from '@/types'

export default function AstryxApp() {
  const { data: session } = useSession()

  const {
    screen, setScreen,
    screenHistory, goBack,
    mode, setMode,
    intakeData, setIntakeData,
    selectedSymptoms, toggleSymptom,
    protocol, setProtocol,
    accentColor, setAccentColor,
    sessionTime, setSessionTime,
    sessionActive, setSessionActive,
    chamberRunning, setChamberRunning,
    history, addToHistory,
    settings, updateSettings,
    resetIntake,
    birthCoords, setBirthCoords,
    birthTimeUnknown, setBirthTimeUnknown,
    chartData, setChartData,
    pendingSession, setPendingSession,
    sessionLog,
  } = useAppStore()
  const deleteSessionLog = useAppStore((s) => s.deleteSessionLog)
  const setChamberDurationKey = useAppStore((s) => s.setChamberDurationKey)
  const setProtocolDate = useAppStore((s) => s.setProtocolDate)
  const setDailyEnergy = useAppStore((s) => s.setDailyEnergy)
  const setDailyElement = useAppStore((s) => s.setDailyElement)
  const onboarded = useAppStore((s) => s.onboarded)
  const setOnboarded = useAppStore((s) => s.setOnboarded)
  const trialStartedAt = useAppStore((s) => s.trialStartedAt)
  const setTrialStartedAt = useAppStore((s) => s.setTrialStartedAt)
  const subscriptionStatus = useAppStore((s) => s.subscriptionStatus)
  const setSubscriptionStatus = useAppStore((s) => s.setSubscriptionStatus)

  // Directive v4.0 Fix 2 — fork buyers (and allowlisted beta emails) have full
  // beta access: entitlement acts as an active subscription. Stamped into the
  // JWT at sign-in by the Shopify webhook → Entitlement pipeline.
  const entitled = session?.user?.entitled === true

  // FIX 9 — trial/subscription clock (deliberate opt-in; Shopify billing).
  const sub = computeSubscription(trialStartedAt, entitled ? 'active' : subscriptionStatus)
  const [alertDismissed, setAlertDismissed] = useState(false)
  // Global Ask Astryx — a floating companion the user can open anywhere.
  const [astryxOpen, setAstryxOpen] = useState(false)

  // Re-verify a Shopify subscription (seam). Test-unlock via env for QA.
  const handleRestoreSubscription = async (): Promise<boolean> => {
    const ok = (await verifySubscription(session?.user?.id ?? session?.user?.email ?? undefined))
      || process.env.NEXT_PUBLIC_SUBSCRIBE_TEST_UNLOCK === 'true'
    if (ok) { setSubscriptionStatus('active'); goHome() }   // reactivate → restored into the saved journey
    return ok
  }

  // Local YYYY-MM-DD key for "today" (Directive v1.0 FIX 1 — daily recompute gate).
  const todayKey = () => new Date().toLocaleDateString('en-CA')

  // FIX 3 — the ONE home router. An onboarded individual never lands back on the
  // heavy ten-system scan: fresh day → daily door, same day → dashboard.
  // Practitioners keep their portal. Pre-onboarding → the scan (Intake).
  const goHome = () => {
    if (mode === 'practitioner') { setScreen('practitioner'); return }
    if (!onboarded && !protocol) { setScreen('intake'); return }
    // The Dashboard is the daily home; it opens on its Check-In tab when the day
    // is stale (protocolDate !== today) and on Today's Pulse once calibrated.
    setScreen('dashboard')
  }

  // Phase 1 — "Session logged" confirmation shown once on the Dashboard after a
  // completed session routes home. Transient (auto-dismissed by the Dashboard).
  const [sessionLoggedToast, setSessionLoggedToast] = useState(false)

  // Landing → which tab the Auth screen opens on (Sign Up vs Sign In).
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin')

  // ── Daily Dashboard one-tap session ────────────────────────────
  // "Begin today's session" → a 15-min personal container keyed to the user's
  // current protocol, then straight into the Chamber. (Keying the session to the
  // specific transit rather than the stored reading is a v2 — see spec §4.)
  const handleBeginDailySession = () => {
    setChamberDurationKey('15_PERSONAL')
    requestSession()   // v4.3 — mode picker (or the remembered preference)
  }

  // ── FIX 1 — the daily door: recompute FRESH from stored natal + today ────────
  // Folds today's check-in (question → engine narrative, intention chip, energy
  // "before") onto the permanent natal, clears yesterday's symptom chips, then
  // runs the SAME engine pipeline (handleAnalyze) which recomputes against today's
  // live transits and re-stamps protocolDate. No replay of yesterday's reading.
  const handleDailyCalibrate = (input: DailyInput) => {
    setIntakeData({
      narrative: input.question,
      intention: input.intention ? [input.intention] : [],
      energyBefore: input.energy,
    })
    setSelectedSymptoms([])
    setDailyEnergy(input.energy)
    setMode('user')
    // Recalibrating from the Dashboard's Check-In tab → return to the Dashboard
    // (which opens on Today's Pulse once the fresh result lands).
    setTimeout(() => handleAnalyze('dashboard'), 0)
  }

  // ── Lean-nav router (Phase 1) ──────────────────────────────────
  // The 4-item nav maps to screens, but two need interception:
  //   • Chamber tab → start a fresh session (or Intake if there's no reading).
  //   • Dashboard tab → Intake when there's no reading yet (acts as home).
  const handleNav = (target: AppScreen) => {
    if (target === 'session') {
      // v4.3 — the Chamber tab opens the mode picker; Full Body runs without a
      // reading, so guests are no longer bounced straight to Intake.
      requestSession()
      return
    }
    if (target === 'dashboard') {
      if (!protocol) { setScreen('intake'); return }                 // onboarding
      // New day → the Dashboard itself opens on its Check-In tab (recompute).
    }
    setScreen(target)
  }

  // ── Client Roster integration (Build Directive Fix 2) ───────────
  // setActiveClient flags which client we're running the engine for.
  // handleRunSessionForClient loads the client's birth data into the live
  // intake state, sets practitioner mode, and routes to analysis. The engine
  // then runs on THEIR chart (not the practitioner's) — verifying that
  // ResultsScreen renders the client's name confirms Fix 2 complete.
  const setActiveClient = useAppStore((s) => s.setActiveClient)
  const handleRunSessionForClient = (client: ClientRecord) => {
    setActiveClient(client.id)
    setMode('practitioner')
    setIntakeData({
      name:          client.name,
      birthDate:     client.birthDate,
      birthTime:     client.birthTime === 'unknown' ? '' : client.birthTime,
      birthLocation: client.birthLocation,
    })
    setBirthCoords(client.birthCoords ?? null)
    setBirthTimeUnknown(client.birthTime === 'unknown')
    // Trigger analysis with the client's data
    setTimeout(() => handleAnalyze(), 0)
  }

  // ── Quick symptom check-in (Build Directive Fix 5) ──────────────
  // HomeScreen chip handler. Pre-populates the symptom and re-runs the
  // engine without re-collecting birth data (already stored). Routes
  // back to Results with the symptom-routed diagnostic surface.
  const setSelectedSymptoms = useAppStore((s) => s.setSelectedSymptoms)
  const handleQuickSymptom = (symptom: string) => {
    setSelectedSymptoms([symptom])
    setTimeout(() => handleAnalyze(), 0)
  }

  // ── Returning-user landing logic (Build Directive Fix 5) ────────
  // First-time / reset users land on Intake. Returning Individual users
  // (protocol exists, mode=user) land on Home. Returning Practitioners
  // land on Practitioner. Implemented as a useEffect that runs once on
  // mount and adjusts the screen state ONLY if the user is currently on
  // 'intake' (the default) AND has a stored protocol — otherwise we
  // respect whatever screen the user explicitly navigated to.
  useEffect(() => {
    // Phase 1 consolidation — the Dashboard is home for a returning user.
    // Returning individuals with a reading land on the Dashboard; practitioners
    // route to their portal. A persisted Dashboard with no reading (or the
    // deprecated 'today-signal') falls back to Intake so nothing renders blank.
    if ((screen === 'intake' || screen === 'landing') && protocol) {
      // FIX 1 — returning individual: fresh day → daily door (recompute), same
      // day → today's dashboard. Practitioners keep their portal. A returning
      // user with a reading skips the landing/intake straight to home.
      if (mode === 'practitioner') setScreen('practitioner')
      else setScreen('dashboard')
    } else if (screen === 'today-signal') {
      setScreen(protocol ? 'dashboard' : 'intake')
    } else if (screen === 'dashboard' && !protocol) {
      setScreen('intake')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])   // run once on mount

  // Google / OAuth returns via a FULL-PAGE redirect to '/', so the AuthScreen's
  // onSuccess never fires for that flow — the user comes back authenticated but
  // still parked on the 'auth' screen, which read as a "loop back to sign-in".
  // When an authenticated session resolves while we're on auth, advance home.
  // (Fixes the Google sign-in loop — 2026-06-28.)
  useEffect(() => {
    if (session?.user && (screen === 'auth' || screen === 'landing')) goHome()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, screen])

  // Directive v4.0 Fix 1 — server-side rehydration. A signed-in user on a fresh
  // device (or after a cleared localStorage) pulls their latest persisted
  // reading and rebuilds the local store. localStorage wins when both exist —
  // we only fetch when the local store has NO protocol.
  const hydratedFromServer = useRef(false)
  useEffect(() => {
    if (!session?.user || protocol || hydratedFromServer.current) return
    hydratedFromServer.current = true
    ;(async () => {
      try {
        const res = await fetch('/api/readings/latest')
        if (!res.ok) return
        const { reading } = await res.json()
        if (!reading?.protocol) return
        const intake = (reading.intake ?? {}) as Partial<typeof intakeData> & { birthCoords?: any }
        setIntakeData({
          name:          intake.name ?? '',
          birthDate:     intake.birthDate ?? '',
          birthTime:     intake.birthTime ?? '',
          birthLocation: intake.birthLocation ?? '',
        })
        if (intake.birthCoords) setBirthCoords(intake.birthCoords)
        if (reading.chartData) setChartData(reading.chartData)
        setProtocol(reading.protocol)
        setAccentColor(reading.accentColor || getAccentColor(reading.protocol))
        // Stamp the reading's compute date (local) so the daily door governs:
        // a reading from a prior day routes through the Check-In recompute.
        setProtocolDate(new Date(reading.createdAt).toLocaleDateString('en-CA'))
        setOnboarded(true)
        // Land the restored user on their home, not the empty intake they were
        // parked on while the store had no protocol.
        const cur = useAppStore.getState().screen
        if (cur === 'intake' || cur === 'landing' || cur === 'auth') setScreen('dashboard')
        console.log('[readings] rehydrated latest reading from account')
      } catch (e) {
        console.warn('[readings] rehydrate failed (localStorage/guest flow unaffected):', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, protocol])

  // FIX 9 — trial expired (and no active subscription) → lock the app behind the
  // subscribe gate. The door locks; natal/history/trends are preserved. When a
  // subscription becomes active, release back to the saved journey.
  useEffect(() => {
    if (sub.locked && screen !== 'subscribe-gate' && screen !== 'auth') {
      setScreen('subscribe-gate')
    } else if (!sub.locked && screen === 'subscribe-gate') {
      goHome()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.locked, screen])

  // ── v4.0 FIX 3 — deep-link shim (hash → screen; screen → hash) ──────────
  // A cheap forward-compatible URL layer until the full App Router migration:
  // #dashboard / #chamber / #chat are linkable from notifications and emails.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    if (hash === 'dashboard' && protocol) setScreen('dashboard')
    else if (hash === 'chamber') { if (protocol) handleStartSession(); else setScreen('intake') }
    else if (hash === 'chat') setAstryxOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])   // mount only
  useEffect(() => {
    const HASH_FOR_SCREEN: Partial<Record<AppScreen, string>> = {
      dashboard: 'dashboard',
      session:   'chamber',
    }
    const h = HASH_FOR_SCREEN[screen]
    const base = window.location.pathname + window.location.search
    window.history.replaceState(null, '', h ? `${base}#${h}` : base)
  }, [screen])

  // ── Audio overlap fix — single global controller ──────────────
  // panicStop on EVERY screen change (the app's "route change") so no screen
  // can leave orphaned audio. Entering Chamber/Library is harmless (nothing
  // plays until the user presses Play). Leaving any screen kills its audio.
  useEffect(() => {
    audioSession.panicStop()
  }, [screen])
  // Stop audio if the page is hidden/unloaded (refresh, tab close, navigate away).
  useEffect(() => {
    const h = () => audioSession.panicStop()
    window.addEventListener('pagehide', h)
    return () => window.removeEventListener('pagehide', h)
  }, [])

  const sessionRef = useRef<NodeJS.Timeout | null>(null)

  // Session timer — FIX 1: counts ONLY while the chamber is actually running
  // (user pressed Play). Entering the chamber leaves it paused at 0; Pause
  // freezes it; Exit/Stop ends it.
  useEffect(() => {
    if (screen === 'session' && chamberRunning) {
      sessionRef.current = setInterval(() => {
        setSessionTime(sessionTime + 1)
      }, 1000)
    } else {
      if (sessionRef.current) clearInterval(sessionRef.current)
    }
    return () => { if (sessionRef.current) clearInterval(sessionRef.current) }
  }, [screen, chamberRunning, sessionTime])

  // Handle analyze. `postTarget` overrides where the user lands once the fresh
  // result is ready (the Dashboard check-in passes 'dashboard'); onboarding +
  // quick-symptom keep the default one-card reading.
  const handleAnalyze = async (postTarget?: AppScreen) => {
    setScreen('analysis')
    // Verbose tracing — every step logs what it's doing so we can diagnose
    // the silent loop-back. Errors are surfaced to alert() rather than just
    // console.error so SHA can see them without opening DevTools.
    console.log('[analyze] starting with intake:', { ...intakeData, symptoms: selectedSymptoms, mode })
    try {
      const intake = { ...intakeData, symptoms: selectedSymptoms, mode }
      // FIX 5 — capture the fresh chart locally (store update is async) so the
      // daily element module can read it right after the engine returns.
      let freshChart: any = chartData

      // If birth time unknown and we have a location → build Solar Chart server-side
      // Otherwise use normal natal chart calculation
      let resolvedCoords = birthCoords ?? undefined

      // ── Fix 1A: auto-resolve unconfirmed location ──
      // If the user typed a birthplace but never clicked a dropdown row, we
      // still have raw text but no coords. Rather than silently dropping into
      // the fallback "approximation" path, fire one geocode lookup and use
      // the first match. This eliminates the most common cause of wrong charts.
      if (!resolvedCoords && intake.birthLocation && intake.birthLocation.trim().length > 2) {
        console.log('[analyze] no coords — auto-resolving location:', intake.birthLocation)
        try {
          const geoResults = await geocodeLocation(intake.birthLocation)
          if (geoResults.length > 0) {
            const first = geoResults[0] as any
            const tz = first.timezone
            resolvedCoords = {
              lat: first.lat,
              lon: first.lon,
              tzOffset: tz?.offsetHours ?? 0,
            }
            setBirthCoords(resolvedCoords)
            console.log('[analyze] auto-resolved to:', first.name, resolvedCoords)
          } else {
            console.warn('[analyze] auto-resolve found no matches for:', intake.birthLocation)
          }
        } catch (geoErr) {
          console.warn('[analyze] auto-resolve failed:', geoErr)
        }
      }

      if (resolvedCoords && intake.birthDate) {
        const timeToUse = birthTimeUnknown ? '12:00' : (intake.birthTime || '12:00')
        console.log('[analyze] calling /api/chart with', { resolvedCoords, birthDate: intake.birthDate, birthTime: timeToUse, solarChart: birthTimeUnknown })

        // Use resolvedCoords — which is either the explicitly-selected
        // coords (user clicked dropdown) or the auto-resolved coords
        // (Fix 1A). Either way, we have lat/lon/tzOffset to send.
        const res = await fetch('/api/chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate:   intake.birthDate,
            birthTime:   timeToUse,
            latitude:    resolvedCoords.lat,
            longitude:   resolvedCoords.lon,
            tzOffset:    resolvedCoords.tzOffset ?? 0,
            symptoms:    intake.symptoms,
            solarChart:  birthTimeUnknown,
          }),
        })
        const data = await res.json()
        console.log('[analyze] /api/chart returned:', data)
        if (data.success) { setChartData(data.chart); freshChart = data.chart }
      } else {
        console.warn('[analyze] no resolved coords or birthDate — engine will use fallback', { resolvedCoords, birthDate: intake.birthDate })
      }

      console.log('[analyze] calling runEngine…')
      const result = await runEngine(intake, resolvedCoords)
      console.log('[analyze] runEngine returned:', result)

      if (!result) {
        throw new Error('Engine returned no protocol — check console for upstream errors.')
      }

      const accent = getAccentColor(result)
      setProtocol(result)
      setAccentColor(accent)
      // FIX 1 — stamp the compute date so the app recomputes on a NEW day instead
      // of replaying this reading. (Same day → today's fresh result is reused.)
      setProtocolDate(todayKey())
      // FIX 3 — first successful calibration completes onboarding; the heavy scan
      // never shows again (home becomes the daily door / dashboard).
      setOnboarded(true)
      // FIX 9 — the 30-day no-card trial clock starts at first onboarding.
      if (!trialStartedAt) setTrialStartedAt(new Date().toISOString())
      // FIX 5 — compute today's element/ritual from the fresh chart + the engine's
      // counterweight (regulator) fork; surfaced on the Reading card + Continuation.
      const elementFork = result.dominantPolarity?.protocol?.regulator_planets?.find(Boolean) ?? 'Earth'
      // N.3 — pass the PERSONAL signal so the daily SKY element reconciles with
      // the reading (never contradicts a diffuse/low signal with "you may run hot").
      const dailyPrimarySig = result.signalHierarchy?.primary
      setDailyElement(computeDailyElement(freshChart, new Date(), elementFork,
        dailyPrimarySig ? { planet: dailyPrimarySig.planet, state: dailyPrimarySig.state } : undefined))
      // Phase 4 (Final QA) — save the generated reading to History immediately,
      // so History is never empty after a reading and the user can return to it.
      // v2 FIX 2 — the reading card label must read from the SAME canonical
      // dominant-signal source (signalHierarchy + dominantPolarity) as the
      // session card / Results, NOT the raw transit-pair title (which showed an
      // unrelated planet pair like "Neptune — Uranus Conjunction").
      const primarySig = result.signalHierarchy?.primary
      const carrier    = primarySig?.planet ?? result.dominant_pattern.planets[0]
      const sigWord    = signalWord(carrier, primarySig?.state)
      const corrective = result.dominantPolarity?.protocol?.corrective_direction ?? []
      const capWord    = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
      const readingSummary =
        primarySig && primarySig.state !== 'balanced' && corrective.length
          ? corrective.slice(0, 2).map(capWord).join(' · ')
          : 'Steady — drawing on this signal'
      addToHistory({
        id: generateId(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        pattern: `${sigWord} · ${carrier}`,
        summary: readingSummary,
        accentColor: accent,
        protocol: result,
      })
      // Directive v4.0 Fix 1 — persist the reading server-side for signed-in
      // users (fire-and-forget; guests keep localStorage-only persistence).
      if (session?.user) {
        fetch('/api/readings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intake:      { ...intake, birthCoords: resolvedCoords ?? null },
            protocol:    result,
            chartData:   freshChart ?? null,
            accentColor: accent,
          }),
        }).catch((e) => console.warn('[readings] persist failed (localStorage still has it):', e))
      }
      // FIX 4 — individuals land on the ONE-CARD Reading (today-signal): signal ·
      // carrier · why · fork sequence · element note · [Enter Chamber][Ask Astryx].
      // Depth lives behind "Go deeper" (Dashboard). Practitioners keep full Results.
      const postAnalysisScreen = postTarget ?? (mode === 'practitioner' ? 'results' : 'today-signal')
      setTimeout(() => setScreen(postAnalysisScreen), 3500)
    } catch (err: any) {
      console.error('[analyze] FAILED:', err)
      // Show the error on screen so the user knows WHY they're being bounced.
      // alert() is loud and ugly but it's the simplest visible signal while
      // we debug. We'll swap for a styled error toast once the cause is known.
      window.alert(
        `Astryx couldn't complete the analysis:\n\n${err?.message || String(err)}\n\nThe browser console (F12) has the full trace.`
      )
      setTimeout(() => setScreen('intake'), 800)
    }
  }

  const setSessionStartedAt = useAppStore((s) => s.setSessionStartedAt)
  const interruptedSession = useAppStore((s) => s.interruptedSession)
  const setInterruptedSession = useAppStore((s) => s.setInterruptedSession)
  const setChamberPhase = useAppStore((s) => s.setChamberPhase)
  // v4.3 — session mode (Calibrated vs Full Body Recalibration)
  const sessionMode = useAppStore((s) => s.sessionMode)
  const setSessionMode = useAppStore((s) => s.setSessionMode)
  const rememberedSessionMode = useAppStore((s) => s.rememberedSessionMode)
  const setRememberedSessionMode = useAppStore((s) => s.setRememberedSessionMode)

  // v4.3 — where a session begins: the remembered preference skips the picker.
  const requestSession = () => {
    if (rememberedSessionMode !== 'ask') { beginSession(rememberedSessionMode); return }
    setScreen('session-mode')
  }

  // v4.3 — begin a session in a specific mode. Full Body is chart-independent
  // (guest-runnable); Calibrated needs a reading and falls back to the scan.
  const beginSession = (m: SessionMode) => {
    setSessionMode(m)
    if (m === 'full_body') {
      setChamberDurationKey('FULL_BODY')
      handleStartSession()
      return
    }
    // Calibrated — never run the corrective flow on the FULL_BODY container.
    if (useAppStore.getState().chamberDurationKey === 'FULL_BODY') {
      setChamberDurationKey('15_PERSONAL')
    }
    if (!protocol) { setScreen('intake'); return }
    handleStartSession()
  }

  const handleStartSession = () => {
    setSessionTime(0)
    setSessionActive(true)
    setChamberRunning(false)   // FIX 1 — idle on entry; the clock waits for Play
    // v4.0 FIX 3 / v4.1 FIX 2 — stamp the start; a fresh session supersedes any
    // stale pointer AND stale phase state ("Start fresh" begins at phase 1).
    setSessionStartedAt(new Date().toISOString())
    setInterruptedSession(null)
    setChamberPhase(null)
    setScreen('session')
  }

  // v4.0 FIX 3 / v4.1 FIX 2 — resume an interrupted chamber session at the
  // exact phase it was left on. The phase pointer wins over raw sessionTime:
  // setting the clock to the phase's startSec re-lands the deterministic
  // timeline on that phase, regardless of lost skip/linger/pause local state.
  const handleResumeSession = () => {
    const snap = interruptedSession
    setInterruptedSession(null)
    if (!snap) return
    // v4.3 — restore the interrupted MODE: a Full Body ladder resumes as one
    // (guest-runnable, no protocol needed); Calibrated still needs the reading.
    if (snap.mode === 'full_body') {
      setSessionMode('full_body')
      setChamberDurationKey('FULL_BODY')
    } else {
      if (!protocol) return
      setSessionMode('calibrated')
      if (useAppStore.getState().chamberDurationKey === 'FULL_BODY') setChamberDurationKey('15_PERSONAL')
    }
    setSessionTime(snap.phaseStartSec ?? snap.sessionTime)
    setSessionActive(true)
    setChamberRunning(false)   // audio needs a fresh Play gesture (autoplay policy)
    setScreen('session')
  }

  const handleExitSession = () => {
    setSessionActive(false)
    setChamberRunning(false)
    setChamberPhase(null)   // v4.1 FIX 2 — a deliberate exit ends the run; no stale pointer
    // History is written at generation time (Phase 4) — no duplicate entry here.
    // Phase 1 consolidation — individuals return to the Dashboard; practitioners
    // keep returning to the full standalone Results report.
    setScreen(mode === 'practitioner' ? 'results' : 'dashboard')
  }

  // ── Complete the Chamber session → forward to the post-session check-in ──
  // Phase 1 (Chamber loop): completion routes FORWARD, never backward. The
  // Chamber hands us a "During" snapshot; we stash it and open the post-session
  // page where the user does the check-in, gets a continuation protocol, and
  // saves the whole thing to their Progress History.
  const handleCompleteSession = (snapshot: SessionSummarySnapshot) => {
    setSessionActive(false)
    setChamberRunning(false)
    setChamberPhase(null)   // v4.1 FIX 2 — completed runs leave no resume state
    // v4.3 — record the completed run server-side for signed-in users
    // (fire-and-forget; guests keep local-only history).
    if (session?.user) {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: sessionMode === 'full_body' ? 'full_body' : 'reading',
          completedPhases: snapshot.forkSequence?.length ?? 0,
          startedAt: useAppStore.getState().sessionStartedAt ?? new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }),
      }).catch((e) => console.warn('[sessions] record failed:', e))
    }
    // The session lands on the Dashboard; its Summary Report tab opens with this
    // snapshot for the post-session check-in + save (practitioners keep Results).
    setPendingSession(snapshot)
    setScreen(mode === 'practitioner' ? 'post-session' : 'dashboard')
  }

  const handlePractitionerClick = () => {
    // Premium gate — Fix 8: the access door is the fork set, not the retired
    // "Coming Soon" payment screen. (PaymentScreen + XRP route stay dormant.)
    if (!session?.user?.isPremium) {
      if (!session) {
        setScreen('auth')
      } else {
        setScreen('fork-access')
      }
      return
    }
    setScreen('practitioner')
  }

  const isSessionScreen = screen === 'session'
  const hideNav = isSessionScreen || screen === 'analysis' || screen === 'auth' || screen === 'payment' || screen === 'subscribe-gate' || screen === 'landing' || screen === 'fork-access' || screen === 'session-mode'

  return (
    <div
      className="relative min-h-screen"
      style={{ overflow: isSessionScreen ? 'hidden' : 'auto' }}
    >
      <CosmicBackground
        screen={screen}
        accentColor={accentColor}
        dominantPlanet={protocol?.dominant_pattern?.planets?.[0]}
      />

      {!hideNav && (
        <NavBar
          onNav={handleNav}
          current={screen}
          accentColor={accentColor}
          mode={mode}
          user={session?.user ?? null}
          hasProtocol={!!protocol}
          entitled={entitled}
          onAuthClick={() => setScreen('auth')}
          onUpgradeClick={() => setScreen('fork-access')}
          onAskAstryx={() => setAstryxOpen(true)}
          onBack={goBack}
          canGoBack={screenHistory.length > 0}
          onLogoClick={() => handleNav('dashboard')}
        />
      )}

      {/* FIX 9 — trial-ending reminder (day 27 = 3 left, day 29 = 1 left). */}
      {sub.alert && !sub.locked && !alertDismissed && !hideNav && (
        <div className="fixed left-0 right-0 z-40 px-4" style={{ top: 64 }}>
          <div
            className="max-w-2xl mx-auto rounded-xl px-4 py-2.5 flex items-center gap-3"
            style={{ background: 'rgba(15,15,26,0.95)', border: `1px solid ${hexToRgba(accentColor, 0.45)}`, boxShadow: `0 12px 36px -18px ${hexToRgba(accentColor, 0.6)}` }}
          >
            <span className="text-[12.5px] text-content leading-snug flex-1">
              {sub.alert === '1day'
                ? 'Tomorrow your access pauses. Subscribe to keep your forks tuned to the daily sky.'
                : `Your 30-day Astryx experience ends in ${sub.daysLeft} day${sub.daysLeft === 1 ? '' : 's'}. Keep your daily calibration going.`}
            </span>
            <button
              onClick={() => setScreen('subscribe-gate')}
              className="kowalski-button shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium"
              style={{ background: hexToRgba(accentColor, 0.9), color: '#020208' }}
            >
              Subscribe
            </button>
            <button onClick={() => setAlertDismissed(true)} aria-label="Dismiss" className="shrink-0 text-white/40 text-[13px]">✕</button>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen">

        {/* ── Subscribe gate (FIX 9 — trial expired; data preserved behind it) ── */}
        {screen === 'subscribe-gate' && (
          <SubscribeGateScreen accentColor={accentColor} onRestore={handleRestoreSubscription} />
        )}

        {/* ── Fork access (Directive v4.0 Fix 2/8 — beta access = fork set) ── */}
        {screen === 'fork-access' && (
          <ForkAccessScreen
            accentColor={accentColor}
            sessionEmail={session?.user?.email ?? null}
            onSignIn={() => { setAuthInitialMode('signin'); setScreen('auth') }}
            onBack={() => (screenHistory.length ? goBack() : goHome())}
          />
        )}

        {/* ── Auth ── */}
        {/* ── Landing (the front door at myastryx.com) ── */}
        {screen === 'landing' && (
          <LandingScreen
            accentColor={accentColor}
            onSignUp={() => { setAuthInitialMode('signup'); setScreen('auth') }}
            onSignIn={() => { setAuthInitialMode('signin'); setScreen('auth') }}
            onExplore={() => setScreen('intake')}
          />
        )}

        {screen === 'auth' && (
          <AuthScreen
            accentColor={accentColor}
            initialMode={authInitialMode}
            onSuccess={goHome}
            onSkip={goHome}
          />
        )}

        {/* ── Payment ── */}
        {screen === 'payment' && (
          <PaymentScreen
            accentColor={accentColor}
            userId={session?.user?.id || session?.user?.email || 'guest'}
            onSuccess={() => setScreen('practitioner')}
            onBack={goHome}
          />
        )}

        {/* ── Intake ── */}
        {screen === 'intake' && (
          <IntakeScreen
            formData={intakeData}
            setFormData={setIntakeData}
            selectedSymptoms={selectedSymptoms}
            onToggleSymptom={toggleSymptom}
            mode={mode}
            setMode={setMode}
            onAnalyze={handleAnalyze}
            accentColor={accentColor}
            onCoordsChange={setBirthCoords}
            birthTimeUnknown={birthTimeUnknown}
            onBirthTimeUnknown={setBirthTimeUnknown}
          />
        )}

        {/* ── Analysis ── */}
        {screen === 'analysis' && <AnalysisScreen accentColor={accentColor} />}

        {/* ── Daily Check-In (FIX 1 — the light daily door: recompute fresh) ── */}
        {screen === 'daily-checkin' && (
          <DailyCheckInScreen
            accentColor={accentColor}
            userName={intakeData.name}
            onCalibrate={handleDailyCalibrate}
          />
        )}

        {/* ── Dashboard (Phase 1 — the consolidated home: 6 collapsible panels) ── */}
        {screen === 'dashboard' && protocol && (
          <DashboardScreen
            protocol={protocol}
            chartData={chartData}
            accentColor={accentColor}
            mode={mode}
            userName={intakeData.name}
            onBeginSession={handleBeginDailySession}
            onCalibrate={handleDailyCalibrate}
            sessionLoggedToast={sessionLoggedToast}
            onClearToast={() => setSessionLoggedToast(false)}
            onResumeSession={handleResumeSession}
            onRunFullBody={() => beginSession('full_body')}
          />
        )}

        {/* ── Today's Signal (Phase 1 — light bridge: Intake → Signal → Chamber) ── */}
        {screen === 'today-signal' && protocol && (
          <TodaySignalScreen
            protocol={protocol}
            mode={mode}
            accentColor={accentColor}
            onEnterChamber={handleStartSession}
          />
        )}

        {/* ── Results ── */}
        {screen === 'results' && protocol && (
          <ResultsScreen
            protocol={protocol}
            mode={mode}
            accentColor={accentColor}
            chartData={chartData}
            onStartSession={requestSession}
            onPractitioner={handlePractitionerClick}
            onNewIntake={resetIntake}
          />
        )}

        {/* ── Session mode picker (v4.3 — Calibrated vs Full Body) ── */}
        {screen === 'session-mode' && (
          <SessionModePicker
            accentColor={accentColor}
            hasReading={!!protocol}
            interrupted={interruptedSession}
            onResume={handleResumeSession}
            onPick={(m, remember) => {
              if (remember) setRememberedSessionMode(m)
              beginSession(m)
            }}
            onBack={() => (screenHistory.length ? goBack() : goHome())}
          />
        )}

        {/* ── Session ── */}
        {/* v4.3 — Full Body is chart-independent: renderable without a reading. */}
        {screen === 'session' && (protocol || sessionMode === 'full_body') && (
          <SessionScreen
            protocol={protocol}
            accentColor={accentColor}
            sessionTime={sessionTime}
            breathGuide={settings.breathGuide}
            onExit={handleExitSession}
            onComplete={handleCompleteSession}
            onAskAstryx={() => setAstryxOpen(true)}
          />
        )}

        {/* ── Post-Session (the "After" — check-in + continuation + save) ──
            Phase 1: closes the loop back to the Dashboard (not a dead-end) with a
            "Session logged" confirmation. The session was written to History at
            save time inside PostSessionSummary. ── */}
        {screen === 'post-session' && (
          <PostSessionSummary
            snapshot={pendingSession}
            accentColor={accentColor}
            onViewProgress={() => setScreen('history')}
            onRepeatChamber={handleStartSession}
            onReturnHome={() => {
              if (mode === 'practitioner') { setScreen('practitioner'); return }
              setSessionLoggedToast(true)
              setScreen('dashboard')
            }}
            onDone={() => {
              setPendingSession(null)
              if (mode === 'practitioner') { setScreen('practitioner'); return }
              setSessionLoggedToast(true)
              setScreen('dashboard')
            }}
          />
        )}

        {/* ── Practitioner ── */}
        {screen === 'practitioner' && protocol && (
          <PractitionerScreen
            protocol={protocol}
            accentColor={accentColor}
            intake={{ ...intakeData, symptoms: selectedSymptoms, mode }}
            chartData={chartData}
            onBack={() => setScreen('results')}
            onStartSession={handleStartSession}
            onUpgrade={() => setScreen('fork-access')}
            onClientRoster={() => setScreen('client-roster')}
          />
        )}

        {/* ── History ── */}
        {screen === 'history' && (
          <HistoryScreen
            history={history}
            sessionLog={sessionLog}
            onDeleteLog={deleteSessionLog}
            accentColor={accentColor}
            onLoadSession={(record) => {
              setProtocol(record.protocol)
              setAccentColor(record.accentColor)
              setScreen('results')
            }}
            onBack={goHome}
          />
        )}

        {/* ── Settings ── */}
        {screen === 'settings' && (
          <SettingsScreen
            accentColor={accentColor}
            mode={mode}
            setMode={setMode}
            settings={settings}
            updateSettings={updateSettings}
            onBack={goHome}
          />
        )}

        {/* ── Chart (Part E — the user's own map, surfaced directly) ── */}
        {screen === 'chart' && (
          <ChartScreen
            chart={chartData || null}
            protocol={protocol}
            accentColor={accentColor}
            onBack={goHome}
          />
        )}

        {/* ── Body Grid (Part E — holographic body map, surfaced directly) ── */}
        {screen === 'body-grid' && (
          <BodyGridScreen
            chart={chartData || null}
            protocol={protocol}
            accentColor={accentColor}
            onBack={goHome}
          />
        )}

        {/* ── Body Systems (Part E — Practitioner-tier only) ── */}
        {screen === 'body-system' && (
          session?.user?.isPremium ? (
            <BodySystemPreviewScreen
              accentColor={accentColor}
              onBack={goHome}
            />
          ) : (
            <TierGate
              accentColor={accentColor}
              title="Body Systems"
              blurb="The system-by-system medical-astrology breakdown is a Practitioner-tier surface. Your Chart and Body Grid are always available to you."
              onUpgrade={() => setScreen('fork-access')}
              onBack={goHome}
            />
          )
        )}

        {/* ── Client Roster (Practitioner Mode — Build Directive Fix 2) ── */}
        {screen === 'client-roster' && (
          <ClientRosterScreen
            accentColor={accentColor}
            onBack={goHome}
            onRunSession={handleRunSessionForClient}
          />
        )}

        {/* ── Music Library (Directive I.5 — favorites + build-your-own chamber) ── */}
        {screen === 'library' && (
          <MusicLibraryScreen
            accentColor={accentColor}
            onBack={goHome}
          />
        )}

        {/* ── Home Screen (Daily Hub — Build Directive Fix 5) ── */}
        {screen === 'home' && protocol && (
          <HomeScreen
            protocol={protocol}
            userName={intakeData.name}
            accentColor={accentColor}
            onSettings={() => setScreen('settings')}
            onStartSession={handleStartSession}
            onQuickSymptom={handleQuickSymptom}
            onNewReading={resetIntake}
          />
        )}

      </div>

      {/* ── Ask Astryx — the launcher is a permanent fixture of every screen's
          TOP bar (NavBar center on standard screens; the chamber's own top bar on
          the Session screen). No floating button. This just hosts the chat panel,
          opened from those top-bar launchers. (SHA 2026-06-28.) ── */}
      {!['auth', 'payment', 'analysis', 'subscribe-gate', 'fork-access'].includes(screen) && (
        <TeacherChat open={astryxOpen} onClose={() => setAstryxOpen(false)} accentColor={accentColor} seed={null} />
      )}
    </div>
  )
}

// ── Part E — Practitioner-tier gate (shown if a non-premium user reaches a
// premium-only surface directly, e.g. via a stale link). The nav already hides
// these items for non-premium users.
function TierGate({
  accentColor, title, blurb, onUpgrade, onBack,
}: {
  accentColor: string; title: string; blurb: string; onUpgrade: () => void; onBack: () => void
}) {
  return (
    <div className="min-h-screen font-rajdhani flex items-center justify-center px-5">
      <div
        className="max-w-md w-full rounded-[2rem] p-8 text-center"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(94,224,255,0.06) 0%, rgba(2,2,8,0.94) 60%)',
          border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
          boxShadow: `0 28px 60px -30px ${hexToRgba(accentColor, 0.5)}`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: hexToRgba(accentColor, 0.85) }}>
          Practitioner tier
        </div>
        <h1 className="font-cinzel text-2xl text-white mb-3">{title}</h1>
        <p className="text-[13.5px] text-content-sm leading-relaxed mb-6">{blurb}</p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onUpgrade}
            className="kowalski-button rounded-2xl px-5 py-3 font-medium text-[14px]"
            style={{ background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.9)} 0%, ${hexToRgba(accentColor, 0.55)} 100%)`, color: '#020208' }}
          >
            Unlock Practitioner →
          </button>
          <button
            onClick={onBack}
            className="kowalski-button rounded-2xl px-5 py-3 text-[13px]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
