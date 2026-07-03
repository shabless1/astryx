import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppScreen,
  AppMode,
  IntakeData,
  ProtocolOutput,
  SessionRecord,
  ClientRecord,
  ClientSession,
  PractitionerLens,
  SavedTrack,
  CustomSequence,
  SessionSummarySnapshot,
  ProgressEntry,
} from '@/types'

// v4.1 FIX 2 — the chamber's current-phase pointer (one state, three displays:
// the "Now" label, the n/N counter, and the phase title all derive from it).
export interface ChamberPhasePointer {
  index: number      // 0-based step index in the fork sequence
  id: string         // PhaseRole (e.g. 'primary') — stable across rebuilds
  label: string      // display title, e.g. "Primary Signal · Saturn"
  startSec: number   // the step's start second in the sequence timeline
  count: number      // total steps in the sequence
}

export interface InterruptedSession {
  screen: AppScreen
  sessionTime: number
  startedAt: string
  // v4.1 — full phase pointer (present when the chamber wrote one)
  phaseIndex?: number
  phaseId?: string
  phaseLabel?: string
  phaseStartSec?: number
  phaseCount?: number
  // v4.3 — which session mode was interrupted; Resume restores the same mode
  // (a Full Body ladder resumes as a Full Body ladder, at the same rung).
  mode?: SessionMode
}

// v4.3 / v4.3.1 — the three first-class session modes.
export type SessionMode = 'calibrated' | 'full_body' | 'chakra'
// v4.3.1 — the Chakra Recalibration's instrument set.
export type ChakraInstrument = 'solfeggio' | 'planetary'

interface AppState {
  // Navigation
  screen: AppScreen
  setScreen: (screen: AppScreen) => void
  // Patch 0.2 — a back stack so every post-Intake screen can return to the
  // previous one WITHOUT re-running Intake or regenerating the protocol.
  screenHistory: AppScreen[]
  goBack: () => void

  // Mode
  mode: AppMode
  setMode: (mode: AppMode) => void

  // Intake
  intakeData: IntakeData
  setIntakeData: (data: Partial<IntakeData>) => void
  selectedSymptoms: string[]
  setSelectedSymptoms: (symptoms: string[]) => void
  toggleSymptom: (symptom: string) => void

  // Birth coordinates (from geocoding)
  birthCoords: { lat: number; lon: number; tzOffset?: number } | null
  setBirthCoords: (coords: { lat: number; lon: number; tzOffset?: number } | null) => void

  // Birth time unknown flag (triggers Solar Chart mode)
  birthTimeUnknown: boolean
  setBirthTimeUnknown: (unknown: boolean) => void

  // Full chart data (stored for chart wheel + body map)
  chartData: any | null
  setChartData: (chart: any) => void

  // Protocol
  protocol: ProtocolOutput | null
  setProtocol: (protocol: ProtocolOutput) => void
  accentColor: string
  setAccentColor: (color: string) => void
  // Daily Recalibration (Directive v1.0 FIX 1) — the active protocol's compute
  // date (YYYY-MM-DD, local). When this !== today, the app recomputes via the
  // daily door instead of replaying yesterday's reading.
  protocolDate: string | null
  setProtocolDate: (date: string | null) => void
  // Today's front-loaded daily input (energy "before" 1–10). Question + intention
  // are passed straight into the engine recompute; energy is kept for before→after.
  dailyEnergy: number | null
  setDailyEnergy: (n: number | null) => void
  // FIX 5 — today's element/ritual read (computed at calibrate; surfaced on the
  // Reading card + the Continuation Protocol; fresh each day with protocolDate).
  dailyElement: import('./dailyElement').DailyElement | null
  setDailyElement: (e: import('./dailyElement').DailyElement | null) => void

  // Session
  sessionTime: number
  setSessionTime: (time: number) => void
  sessionActive: boolean
  setSessionActive: (active: boolean) => void
  // Directive v4.0 FIX 3 — when the chamber session began (ISO). Set on session
  // start; read by the rehydrate override to build the interrupted-session
  // pointer (24h resume window).
  sessionStartedAt: string | null
  setSessionStartedAt: (iso: string | null) => void
  // Directive v4.0 FIX 3 / v4.1 FIX 2 — an interrupted mid-flow session
  // preserved at rehydrate instead of being restored into. Carries the FULL
  // phase pointer (index/id/label/startSec/count) so Resume reopens the exact
  // phase — never the sequence start. Dashboard offers Resume/discard.
  interruptedSession: InterruptedSession | null
  setInterruptedSession: (s: InterruptedSession | null) => void
  // v4.1 FIX 2 — the chamber's live phase pointer, written by SessionScreen on
  // every phase change and PERSISTED. This is the single source of truth the
  // rehydrate override reads to build the resume pointer (raw sessionTime alone
  // can't recover the phase — skip/linger/pause history is local state).
  chamberPhase: ChamberPhasePointer | null
  setChamberPhase: (p: ChamberPhasePointer | null) => void

  // ─── v4.3 — Session mode (Calibrated vs Full Body Recalibration) ─────
  // sessionMode = what the CURRENT/next session runs as (persisted so a
  // mid-session reload knows which builder to use). rememberedSessionMode =
  // the Settings preference: 'ask' shows the picker; a mode skips it.
  sessionMode: SessionMode
  setSessionMode: (m: SessionMode) => void
  rememberedSessionMode: 'ask' | SessionMode
  setRememberedSessionMode: (m: 'ask' | SessionMode) => void
  // v4.3.1 — the Chakra session's instrument set (persisted; preselected from
  // fork ownership, changeable in the picker).
  chakraInstrument: ChakraInstrument
  setChakraInstrument: (i: ChakraInstrument) => void
  // FIX 1 — the chamber session/timer are ONE unit. The clock + session progression
  // run ONLY while chamberRunning (set by the chamber Play/Pause). Ephemeral.
  chamberRunning: boolean
  setChamberRunning: (running: boolean) => void

  // Chamber Deploy 1 — selected chamber duration preset key
  // Persisted so user's preferred duration survives reloads
  chamberDurationKey: import('./chamber/durationPresets').ChamberDurationKey
  setChamberDurationKey: (key: import('./chamber/durationPresets').ChamberDurationKey) => void

  // v2 FIX I — container-fit behaviour when a chart generates more station-work
  // than the chosen container holds. DEFAULT 'priorityCap' (depth over breadth:
  // full holds on top forks, drop lowest overflow). SHA override available.
  containerFitMode: import('./chamber/stationTiming').ContainerFitMode
  setContainerFitMode: (m: import('./chamber/stationTiming').ContainerFitMode) => void

  // Directive H.1 — which physical fork set the user owns. Drives application
  // guidance: unweighted aluminum = field/around-the-body; weighted steel =
  // on-body point application. null = derive default from tier.
  forkSetType: 'unweighted' | 'weighted' | null
  setForkSetType: (t: 'unweighted' | 'weighted') => void

  // FIX 8 — which physical Sacred Tone forks (by planet) the user owns. The
  // Chamber's "this is the simulated tone · the real fork resonates at X Hz"
  // conversion line shows ONLY for forks NOT in this set. Default empty (owns none).
  ownedForks: string[]
  toggleOwnedFork: (planet: string) => void

  // Phase 3B — Chamber mandala renderer preference. 'auto' picks the best
  // available (WebGL → SVG); 'webgl' / 'svg' force a tier so the user can
  // compare them live. Persisted.
  mandalaRenderer: 'auto' | 'webgl' | 'svg'
  setMandalaRenderer: (r: 'auto' | 'webgl' | 'svg') => void

  // History
  history: SessionRecord[]
  addToHistory: (record: SessionRecord) => void

  // ─── Post-Session loop (Phase 1 — Chamber session completion) ──
  // pendingSession is the ephemeral "During" snapshot the Chamber hands to
  // the post-session page (cleared once saved). sessionLog is the persisted
  // Progress History — the After → Next record the user tracks over time.
  pendingSession: SessionSummarySnapshot | null
  setPendingSession: (s: SessionSummarySnapshot | null) => void
  sessionLog: ProgressEntry[]
  addSessionLog: (entry: ProgressEntry) => void
  deleteSessionLog: (id: string) => void

  // ─── First-run orientation (Phase 8) — collapse the intro for return users ──
  orientationSeen: boolean
  setOrientationSeen: (v: boolean) => void

  // ─── Subscription / trial clock (Directive v1.0 FIX 9) ────────
  // Deliberate opt-in: 30-day no-card trial from first onboarding, then a
  // subscribe-to-return gate. `subscriptionStatus` flips to 'active' on a
  // confirmed Shopify subscription (server-authoritative at launch).
  trialStartedAt: string | null
  setTrialStartedAt: (iso: string | null) => void
  subscriptionStatus: 'trial' | 'active' | 'expired'
  setSubscriptionStatus: (s: 'trial' | 'active' | 'expired') => void

  // ─── Onboarding-once gate (Directive v1.0 FIX 3) ──────────────
  // True once the first calibration completes. The heavy ten-system scan
  // (Intake) only ever shows while this is false; afterward home is the daily
  // door / dashboard, never the scan. Cleared by a deliberate "start over".
  onboarded: boolean
  setOnboarded: (v: boolean) => void

  // ─── The Teacher (sixth sense) — progressive teaching memory ──
  // Concept keys the user has already been taught. Persisted so the
  // Teacher introduces one NEW concept per visit (blueprint §7).
  taughtConcepts: string[]
  addTaughtConcept: (key: string) => void

  // ─── Client Roster (Build Directive Fix 2) ────────────────
  clients: ClientRecord[]
  addClient: (client: ClientRecord) => void
  updateClient: (id: string, updates: Partial<ClientRecord>) => void
  deleteClient: (id: string) => void
  activeClientId: string | null
  setActiveClient: (id: string | null) => void
  getActiveClient: () => ClientRecord | null

  clientSessions: ClientSession[]
  addClientSession: (session: ClientSession) => void
  deleteClientSession: (id: string) => void
  getSessionsForClient: (clientId: string) => ClientSession[]

  // ─── Practitioner Lens (Build Directive Fix 4) ────────────
  practitionerLens: PractitionerLens
  setPractitionerLens: (lens: PractitionerLens) => void

  // ─── Music Library (Directive I.5) ────────────────────────
  // Favorites + user-built "chamber" sequences. Persisted per account
  // (localStorage for anon). The freshness / retention layer.
  favorites: SavedTrack[]
  toggleFavorite: (track: SavedTrack) => void
  isFavorite: (track: SavedTrack) => boolean
  customSequences: CustomSequence[]
  addSequence: (seq: CustomSequence) => void
  updateSequence: (id: string, updates: Partial<CustomSequence>) => void
  deleteSequence: (id: string) => void

  // ─── Chamber song choice (Directive I.3.1/I.4 — PERSISTED) ───
  // The user owns their session: Default = the session picks each aspect's song;
  // Customize = the user's per-aspect picks. Both persist across sessions so a
  // returning user keeps the chamber they shaped. Override key = `{planet}/{state}`
  // (lowercase planet, folder state nat/exc/def/blk).
  chamberAudioMode: 'default' | 'customize'
  setChamberAudioMode: (m: 'default' | 'customize') => void
  songOverrides: Record<string, string>
  setSongOverride: (planet: string, state: string, filename: string) => void
  clearSongOverrides: () => void

  // Settings
  settings: {
    animationIntensity: 'low' | 'medium' | 'high'
    soundPreview: 'off' | 'tone' | 'full'
    visualIntensity: 'low' | 'medium' | 'high'
    breathGuide: 'active' | 'passive' | 'off'
    sessionDuration: number
  }
  updateSettings: (settings: Partial<AppState['settings']>) => void

  // Reset
  resetIntake: () => void
}

const DEFAULT_INTAKE: IntakeData = {
  name: '',
  birthDate: '',
  birthTime: '',
  birthLocation: '',
  symptoms: [],
  emotionalState: [],
  intention: [],
  mode: 'user',
  resourcedPlanets: [],
  bodyMapType: 'female',
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'landing',
      screenHistory: [],
      // Record the screen we're leaving (except the transient analysis loader)
      // so goBack() can return to it. Capped; ignores no-op navigations.
      setScreen: (screen) => set((state) => {
        if (screen === state.screen) return {}
        const recordable = state.screen !== 'analysis'
        return {
          screen,
          screenHistory: recordable
            ? [...state.screenHistory, state.screen].slice(-25)
            : state.screenHistory,
        }
      }),
      goBack: () => set((state) => {
        const hist = [...state.screenHistory]
        let prev = hist.pop()
        // Never land back on the transient analysis loader.
        while (prev === 'analysis' && hist.length) prev = hist.pop()
        if (!prev) return {}
        return { screen: prev, screenHistory: hist }
      }),

      mode: 'user',
      setMode: (mode) => set({ mode }),

      intakeData: DEFAULT_INTAKE,
      setIntakeData: (data) =>
        set((state) => ({ intakeData: { ...state.intakeData, ...data } })),
      selectedSymptoms: [],
      setSelectedSymptoms: (symptoms) => set({ selectedSymptoms: symptoms }),
      toggleSymptom: (symptom) =>
        set((state) => ({
          selectedSymptoms: state.selectedSymptoms.includes(symptom)
            ? state.selectedSymptoms.filter((s) => s !== symptom)
            : [...state.selectedSymptoms, symptom],
        })),

      protocol: null,
      setProtocol: (protocol) => set({ protocol }),
      accentColor: '#8B5CF6',
      setAccentColor: (color) => set({ accentColor: color }),
      protocolDate: null,
      setProtocolDate: (date) => set({ protocolDate: date }),
      dailyEnergy: null,
      setDailyEnergy: (n) => set({ dailyEnergy: n }),
      dailyElement: null,
      setDailyElement: (e) => set({ dailyElement: e }),

      birthCoords: null,
      setBirthCoords: (coords) => set({ birthCoords: coords }),

      birthTimeUnknown: false,
      setBirthTimeUnknown: (unknown) => set({ birthTimeUnknown: unknown }),

      chartData: null,
      setChartData: (chart) => set({ chartData: chart }),

      sessionTime: 0,
      setSessionTime: (time) => set({ sessionTime: time }),
      sessionActive: false,
      setSessionActive: (active) => set({ sessionActive: active }),
      sessionStartedAt: null,
      setSessionStartedAt: (iso) => set({ sessionStartedAt: iso }),
      interruptedSession: null,
      setInterruptedSession: (s) => set({ interruptedSession: s }),
      chamberPhase: null,
      setChamberPhase: (p) => set({ chamberPhase: p }),

      sessionMode: 'calibrated',
      setSessionMode: (m) => set({ sessionMode: m }),
      rememberedSessionMode: 'ask',
      setRememberedSessionMode: (m) => set({ rememberedSessionMode: m }),
      chakraInstrument: 'planetary',
      setChakraInstrument: (i) => set({ chakraInstrument: i }),
      chamberRunning: false,
      setChamberRunning: (running) => set({ chamberRunning: running }),

      // Default to the 15-Minute Personal Recalibration container (Fix 5)
      chamberDurationKey: '15_PERSONAL',
      setChamberDurationKey: (key) => set({ chamberDurationKey: key }),

      containerFitMode: 'priorityCap',
      setContainerFitMode: (m) => set({ containerFitMode: m }),

      // Directive H.1 — fork set ownership (null = derive from tier)
      forkSetType: null,
      setForkSetType: (t) => set({ forkSetType: t }),

      ownedForks: [],
      toggleOwnedFork: (planet) => set((s) => ({
        ownedForks: s.ownedForks.includes(planet)
          ? s.ownedForks.filter((p) => p !== planet)
          : [...s.ownedForks, planet],
      })),

      // Phase 3B — mandala renderer preference
      mandalaRenderer: 'auto',
      setMandalaRenderer: (r) => set({ mandalaRenderer: r }),

      history: [],
      addToHistory: (record) =>
        set((state) => ({ history: [record, ...state.history].slice(0, 50) })),

      // ── Post-Session loop ──
      pendingSession: null,
      setPendingSession: (s) => set({ pendingSession: s }),
      sessionLog: [],
      addSessionLog: (entry) =>
        set((state) => ({ sessionLog: [entry, ...state.sessionLog].slice(0, 100) })),
      deleteSessionLog: (id) =>
        set((state) => ({ sessionLog: state.sessionLog.filter((e) => e.id !== id) })),

      // ── First-run orientation ──
      orientationSeen: false,
      setOrientationSeen: (v) => set({ orientationSeen: v }),

      onboarded: false,
      setOnboarded: (v) => set({ onboarded: v }),

      trialStartedAt: null,
      setTrialStartedAt: (iso) => set({ trialStartedAt: iso }),
      subscriptionStatus: 'trial',
      setSubscriptionStatus: (s) => set({ subscriptionStatus: s }),

      // ── The Teacher — taught-concepts memory ──
      taughtConcepts: [],
      addTaughtConcept: (key) =>
        set((state) =>
          state.taughtConcepts.includes(key)
            ? state
            : { taughtConcepts: [...state.taughtConcepts, key] },
        ),

      // ── Client Roster ──
      clients: [],
      addClient: (client) =>
        set((state) => ({ clients: [client, ...state.clients] })),
      updateClient: (id, updates) =>
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteClient: (id) =>
        set((state) => ({
          clients:        state.clients.filter((c) => c.id !== id),
          clientSessions: state.clientSessions.filter((s) => s.clientId !== id),
          activeClientId: state.activeClientId === id ? null : state.activeClientId,
        })),
      activeClientId: null,
      setActiveClient: (id) => set({ activeClientId: id }),
      getActiveClient: () => {
        const { clients, activeClientId } = get()
        return clients.find((c) => c.id === activeClientId) ?? null
      },

      clientSessions: [],
      addClientSession: (session) =>
        set((state) => {
          // Also update the client's lastSessionAt timestamp
          const updatedClients = state.clients.map((c) =>
            c.id === session.clientId ? { ...c, lastSessionAt: session.date } : c
          )
          return {
            clientSessions: [session, ...state.clientSessions],
            clients:        updatedClients,
          }
        }),
      deleteClientSession: (id) =>
        set((state) => ({ clientSessions: state.clientSessions.filter((s) => s.id !== id) })),
      getSessionsForClient: (clientId) =>
        get().clientSessions
          .filter((s) => s.clientId === clientId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

      // ── Practitioner Lens ──
      practitionerLens: 'individual',
      setPractitionerLens: (lens) => set({ practitionerLens: lens }),

      // ── Music Library (Directive I.5) ──
      favorites: [],
      toggleFavorite: (track) =>
        set((state) => {
          const key = (t: SavedTrack) => `${t.planet}/${t.state}/${t.filename}`
          const exists = state.favorites.some((f) => key(f) === key(track))
          return {
            favorites: exists
              ? state.favorites.filter((f) => key(f) !== key(track))
              : [track, ...state.favorites],
          }
        }),
      isFavorite: (track) => {
        const key = (t: SavedTrack) => `${t.planet}/${t.state}/${t.filename}`
        return get().favorites.some((f) => key(f) === key(track))
      },
      customSequences: [],
      addSequence: (seq) =>
        set((state) => ({ customSequences: [seq, ...state.customSequences] })),
      updateSequence: (id, updates) =>
        set((state) => ({
          customSequences: state.customSequences.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteSequence: (id) =>
        set((state) => ({ customSequences: state.customSequences.filter((s) => s.id !== id) })),

      // ── Chamber song choice (persisted across sessions) ──
      chamberAudioMode: 'default',
      setChamberAudioMode: (m) => set({ chamberAudioMode: m }),
      songOverrides: {},
      setSongOverride: (planet, state, filename) =>
        set((s) => ({
          songOverrides: { ...s.songOverrides, [`${planet.toLowerCase()}/${state}`]: filename },
        })),
      clearSongOverrides: () => set({ songOverrides: {} }),

      settings: {
        animationIntensity: 'high',
        soundPreview: 'full',
        visualIntensity: 'high',
        breathGuide: 'active',
        sessionDuration: 10,
      },
      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),

      resetIntake: () =>
        set({
          intakeData:       DEFAULT_INTAKE,
          selectedSymptoms: [],
          protocol:         null,
          protocolDate:     null,
          accentColor:      '#8B5CF6',
          screen:           'intake',
          chartData:        null,
          birthTimeUnknown: false,
          birthCoords:      null,
          // FIX 3 — a deliberate start-over returns the user to onboarding.
          onboarded:        false,
        }),
    }),
    {
      name: 'astryx-storage',
      // DECISION (Build Directive Fix 2): Expanded persist whitelist to include
      // client roster + sessions + practitioner lens. Also added birth data
      // (intakeData, birthCoords, birthTimeUnknown) — these were missing from
      // the previous whitelist which forced users to re-enter birth data on
      // every visit (a usability issue Sha flagged). Phase 4 (Final QA): the
      // active protocol + chartData are now ALSO persisted so a refresh keeps
      // the reading alive (cloud/account sync remains future work).
      partialize: (state) => ({
        mode:             state.mode,
        // v5 FIX 2 — persist the active view so a reload (incl. iOS overscroll
        // reload) returns the user where they were, never Home. 'analysis' is a
        // transient loader → coerce to a safe destination so reload never hangs.
        // Phase 1 consolidation — reload lands a returning individual on the
        // Dashboard (practitioner on Results). Transient/deprecated screens are
        // coerced to safe destinations so reload never hangs or renders blank:
        //   analysis (transient loader) → Dashboard/Results, or Intake if no reading
        //   home (old daily hub) + today-signal (old bridge) → Dashboard, else Intake
        //   dashboard with no reading → Intake
        screen:           (() => {
                            const s = state.screen
                            const home = state.protocol
                              ? (state.mode === 'practitioner' ? 'results' : 'dashboard')
                              : 'intake'
                            if (s === 'analysis' || s === 'home' || s === 'today-signal') return home
                            if (s === 'dashboard' && !state.protocol) return 'intake'
                            return s
                          })(),
        // Persist elapsed session time so a mid-Chamber reload resumes the phase
        // (audio still requires a fresh Play gesture per browser autoplay policy).
        sessionTime:      state.sessionTime,
        // FIX 3 (v4.0) — session start stamp + interrupted-session pointer
        sessionStartedAt: state.sessionStartedAt,
        interruptedSession: state.interruptedSession,
        // FIX 2 (v4.1) — live chamber phase pointer (source of the resume pointer)
        chamberPhase: state.chamberPhase,
        // v4.3 — session mode + Settings preference
        sessionMode: state.sessionMode,
        rememberedSessionMode: state.rememberedSessionMode,
        chakraInstrument: state.chakraInstrument,
        history:          state.history,
        // Progress History — the post-session loop's persisted record.
        // (pendingSession is intentionally NOT persisted; it's transient.)
        sessionLog:       state.sessionLog,
        settings:         state.settings,
        // The Teacher's progressive-teaching memory
        taughtConcepts:   state.taughtConcepts,
        // First-run orientation seen flag (Phase 8)
        orientationSeen:  state.orientationSeen,
        // Onboarding-once gate (FIX 3)
        onboarded:        state.onboarded,
        // Subscription / trial clock (FIX 9) — survives across the wall.
        trialStartedAt:     state.trialStartedAt,
        subscriptionStatus: state.subscriptionStatus,
        // H.1 — fork set ownership + preferred duration
        forkSetType:      state.forkSetType,
        ownedForks:       state.ownedForks,
        chamberDurationKey: state.chamberDurationKey,
        containerFitMode: state.containerFitMode,
        // Phase 3B — mandala renderer preference
        mandalaRenderer:  state.mandalaRenderer,
        // Birth data persistence — fixes the "always asks again" bug
        intakeData:       state.intakeData,
        birthCoords:      state.birthCoords,
        birthTimeUnknown: state.birthTimeUnknown,
        // Phase 4 (Final QA) — persist the ACTIVE reading so a page refresh
        // returns the user to the same reading (Results/Chart/Body Grid/Chamber)
        // without re-running the engine. localStorage; account sync is future work.
        protocol:         state.protocol,
        protocolDate:     state.protocolDate,
        dailyEnergy:      state.dailyEnergy,
        dailyElement:     state.dailyElement,
        chartData:        state.chartData,
        accentColor:      state.accentColor,
        selectedSymptoms: state.selectedSymptoms,
        // Client roster
        clients:          state.clients,
        clientSessions:   state.clientSessions,
        activeClientId:   state.activeClientId,
        // Practitioner lens
        practitionerLens: state.practitionerLens,
        // Music Library — favorites + custom sequences (Directive I.5)
        favorites:        state.favorites,
        customSequences:  state.customSequences,
        // Chamber song choice — persisted so the user keeps their session shape
        chamberAudioMode: state.chamberAudioMode,
        songOverrides:    state.songOverrides,
      }),
      // ── Directive v4.0 FIX 3 — rehydrate override ─────────────────────
      // Never restore INTO a mid-flow screen (the "lands mid-chamber" bug).
      // A stale chamber session becomes a resume pointer the Dashboard offers
      // back ("Resume / Start fresh"); everything else routes home.
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<AppState>) }
        const MID_FLOW: AppScreen[] = [
          'session', 'post-session', 'analysis', 'daily-checkin',
          'today-signal', 'auth', 'payment', 'subscribe-gate', 'fork-access',
          'session-mode',
        ]
        if (MID_FLOW.includes(merged.screen)) {
          // Preserve an actually-started chamber session as a resume pointer
          // (entered-but-never-played sessions are discarded silently).
          // v4.1 FIX 2 — carry the FULL phase pointer: raw sessionTime cannot
          // recover the phase when the user skipped/lingered/paused (that
          // history was local component state). Resume reopens the exact phase.
          const phase = merged.chamberPhase
          if (merged.screen === 'session' && (merged.sessionTime > 0 || (phase?.index ?? 0) > 0)) {
            merged.interruptedSession = {
              screen: 'session',
              sessionTime: merged.sessionTime,
              startedAt: merged.sessionStartedAt ?? new Date().toISOString(),
              ...(phase ? {
                phaseIndex:    phase.index,
                phaseId:       phase.id,
                phaseLabel:    phase.label,
                phaseStartSec: phase.startSec,
                phaseCount:    phase.count,
              } : {}),
              // v4.3 — a Full Body ladder resumes as a Full Body ladder.
              mode: merged.sessionMode ?? 'calibrated',
            }
          }
          // The live pointer belongs to the interrupted run — never leak it
          // into the next session.
          merged.chamberPhase = null
          merged.screen = merged.protocol
            ? (merged.mode === 'practitioner' ? 'results' : 'dashboard')
            : (merged.intakeData?.birthDate ? 'intake' : 'landing')
        }
        // Older-than-24h pointers are discarded silently (directive §Fix 3.2).
        if (merged.interruptedSession) {
          const age = Date.now() - new Date(merged.interruptedSession.startedAt).getTime()
          if (!(age >= 0 && age < 24 * 60 * 60 * 1000)) merged.interruptedSession = null
        }
        return merged
      },
    }
  )
)
