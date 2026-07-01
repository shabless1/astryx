# ASTRYX — Capabilities Manifest
### The CURRENT source of truth for what already EXISTS (code-derived, 2026-06-21)

**Read this before proposing anything.** The older `.docx` manuals are OUTDATED. If a capability is listed here, **it is already built — do not suggest building it.** Suggest *enhancements or fixes*, not rebuilds. Everything below is real code in `astryx_v14/src/`.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Zustand (persisted) · astronomy-engine (NASA ephemeris) · NextAuth · XRPL · Web Audio + HTMLAudio · Cloudflare R2 (audio) · Vercel (staging: n-pi-jet.vercel.app). Deterministic: same birth data → same output, no `Math.random` in the engine.

---

## 1 · CORE INTELLIGENCE ENGINES — `src/lib/`
The brain. These already turn birth data + intake into a full multi-sensory protocol.

| File | What it already does |
|---|---|
| `engine.ts` | **The master protocol generator** (`runEngine`): intake → `/api/chart` → tri-source planet scoring → signal hierarchy → full 5-sense protocol + diagnostic + cell salts + Sacred Tea. Emits one `ProtocolOutput`. Also `PLANET_COLORS`, `feltStateLanguage`, `getAccentColor`, `geocodeLocation`. |
| `ephemeris.ts` | Natal chart via astronomy-engine; **WHOLE SIGN houses**; `calculateTransits(natalChart, date)` — date-parameterized transits to natal, sorted by weight. |
| `solarChart.ts` | Solar Chart mode (birth time unknown — Sun on Ascendant). |
| `RemedyPolarityEngine.ts` | Corrective-direction engine: excess/deficiency/blocked → regulator planets + corrective verbs (intention-biased). |
| `NarrativeSignalParser.ts` | Folds the user's free-text intake into the symptom signal. |
| `signalCopy.ts` | Resonance vocabulary + "Why" matrix (10 planets × 4 states), compliance-safe. |
| `cellSaltKeynotes.ts` | Symptom → cell-salt facet routing (domain-overlap match). |
| `BodyPlacementEngine.ts` | Ranked fork **body placement** (symptom→sign→planet→chakra→state); chakra + anchor libraries. |
| `bodyMapPlacement.ts` | Body-map image asset resolution; `neutral`→female. |
| `dailyTemperature.ts`, `dailyElement.ts` | **Daily transit "temperature" / element** read (NEW — the daily-dashboard intelligence). |
| `store.ts` | Zustand global state (persisted `astryx-storage`): screen routing, intake, protocol, chart, history, favorites, client roster, settings. |
| `compliance.ts` | `safePhrase`/`withDisclaimer`/`safetyGate`/`lintForBannedPhrases`, `MICRO_DISCLAIMER`, practitioner attestation. |
| `utils.ts`, `timezone.ts`, `signalCopy.ts`, `version.ts` | Helpers (hex/color, tz-lookup, formatTime, app version). |

## 2 · CHAMBER / SESSION ENGINES — `src/lib/chamber/`
| File | What it already does |
|---|---|
| `forkRite.ts` | **The fork sequence builder** — `buildForkSequence` + `forkSequenceDisplay`. Single source for the Chamber/Summary/Results fork list. |
| `durationPresets.ts` | The **3 fixed session containers** (15-Personal / 30-Deep / 60-Practitioner) + their phase architectures (planets placed dynamically). |
| `ChamberDNAEngine.ts` | Deterministic per-session "Chamber DNA" (color + tier states) from chart + polarity. |
| `chamberSeed.ts`, `ChamberConductor.ts` | Session seeding + orchestration. |
| `HarmonicEngine`, `MelodyGenerator`, `ChordEngine`, `ScaleEngine`, `InstrumentationEngine`, `AspectBehaviorEngine`, `SignModulationEngine` | **Tone.js generative-music engines — built but DORMANT.** The live Chamber plays **Suno MP3 tracks**, not generated Tone.js. Do not assume these are the active audio path (verify before touching). |

## 3 · VISUAL ENGINES — `src/lib/visual/` + `src/components/engine/`
The Chamber's living visuals. All built.

- **Kaleidoscope mandala:** `SacredGeometryEngine.ts` + `KaleidoscopeMandalaEngine.ts` + `MandalaEngine.ts` + presets/modifiers (`mandalaPlanetPresets`, `mandalaSignalStateModifiers`, `planetMandalaLibrary`, `planetSacredGeometryMap`, `sacredGeometryBaseLibrary`, `platonicSolidLibrary`, `solid3DLibrary`, `mandalaGeometry`). Renderer ladder = **Art PNG → WebGL → SVG** (`mandalaPerformanceFallback.ts`). Venus = "Rose of Venus" palette.
- **Render components:** `SacredGeometryMandalaView`, `KaleidoscopeMandalaCanvas`, `WebGLMandala`, `LayeredSvgMandala`, `ImageMandala`, `OrbitalResonancePattern`, `PlatonicSolidOverlay`, `MandalaChamberView`, `CombinedChamberView`.
- **Color therapy:** `ColorTherapyEngine.ts` + `planetColorTherapyLibrary.ts` (corrective color fields per planet/state) + `ColorTherapyView`.
- **Chart + body:** `NatalChartWheel` (whole sign, curved sign names), `BodyMap` (chakra meridian + planet glyphs, chakra Solfeggio tones), `ChamberBodyMap`, `VisualEngineCanvas`, `ChartTabs`, `ChamberVisualBoundary` (crash guard), `ChamberVisualModeToggle`.

## 4 · AUDIO — `src/lib/`
| File | What it already does |
|---|---|
| `astryxPlayer.ts` | The HTMLAudio **Suno music player** (singleton, 5-phase volume envelope, real LIVE/error state). |
| `astryxAudioLibrary.ts` | **170+ track catalog** (10 planets × 4 states + variants), R2 URL builder, manifest merge via `/api/catalog`, variant labels. |
| `audioSession.ts` | The **single audio owner** (`claim`/`panicStop`) — nothing overlaps. |
| `pureTone.ts` | **Chakra Solfeggio tone player** (Web Audio sine) — playable on Body Map + Music Library "Chakra" tab. |
| `fallbackTone.ts` | Oscillator fallback — **removed from the chamber** (music-only); still on disk. |
| `soundEngine.ts` | Tone.js 6-layer synth — **dormant** (not started anywhere). |
| `transitAudio.ts` | Transit-preview oscillator — unused on report surfaces. |

## 5 · SACRED TEA — `src/lib/tea/`
`SacredTeaMatchingEngine.ts` (matches a prepared blend to the session) + `sacredTeaPlanetRules` + `sacredTeaBodySystemModifiers` + `sacredTeaPostSessionModifiers` + `sacredTeaBlendProfiles` + `diyPlanetaryHerbDirections`. **Full tea-matching system already built.**

## 6 · TEACHER / AI BOT — `src/lib/teacher/` + `src/app/api/teach`
`teach.ts` + `grounding.ts` + `/api/teach/route.ts` + `components/teacher/TeacherChat.tsx`. **A Gemini-backed "Astryx" conversational guide already exists** (server-only, IP-contained, engine-deterministic boundary). This is the foundation for the chatbot — extend it; don't build a new bot from scratch.

## 7 · DATA LIBRARIES (the knowledge base) — `src/data/`
- **Core astro:** `planets`, `signs`, `houses`, `aspects`, `elements`, `modalities`, `geometry`, `colors`.
- **Frequencies:** `planetary-anchors` (Cousto Hz), `sign-modulation`, `solfeggio-overlays` (incl. chakra Solfeggio set).
- **Sensory protocol data:** `scents`, `herbs`, `taste-map`, `body-protocols`, `soap-templates`.
- **Medical astrology:** `medicalAstrology.json` (the connective tissue — anatomy + transit interpretation), `symptoms.json`, `planet-intake-map.json`.
- **Cell salts:** `cellSalts.json` (12 Schüssler salts, food sources, sign mapping — **no dosages shown in UI**), `remedyPolarity.json`.
- **Body systems:** `bodySystems/` — 11 files (cardiovascular, nervous, endocrine, digestive, respiratory, muscular, skeletal, integumentary, lymphatic-immune, urinary, reproductive).
- **Sacred extension layer:** `sacredTones_nervousSystem` (13 forks — Hz, nerve plexus, vagal, chakra), `sacredBotanicals` (9), `crystalsExpanded` (9), `lotusSpectrum` (4 — proprietary IP), `starterKits` (4 shop products), `sample-protocol`.

## 8 · SCREENS / FEATURES BUILT — `src/components/screens/`
Auth · Intake · Analysis · **Today's Signal** (light bridge) · Results (full reference report) · **Session/Chamber** · **Post-Session Summary** (with collapsible deep-report cards: Diagnosis, Cosmic Weather, Symptom Routing, Mineral Foundation, SOAP) · History (energy-trend sparkline) · Settings · Chart · Body Grid · Body System Preview · **Music Library** (Browse/Favorites/Sequences/**Chakra tones**) · **Dashboard + Daily Check-In** (NEW, daily-temperature) · Payment. **Home now routes to the Intake form** (old `HomeScreen` daily-hub deprecated). Practitioner: PractitionerScreen · ClientRoster · PractitionerExport (jsPDF) · PractitionerLensContent · LensSwitcher.

## 9 · BACKEND / API — `src/app/api/`
`/api/chart` (natal + solar + transits) · `/api/geocode` (OpenStreetMap + tz) · `/api/intake/interpret` (free-text → planets) · `/api/teach` (Gemini bot) · `/api/catalog` (audio manifest proxy) · `/api/payment/xrp` (XRPL verify) · `/api/auth/[...nextauth]`.

## 10 · INFRA / INTEGRATIONS
- **Auth:** NextAuth (email/password + Google). A dedicated **Supabase project `gbalyncthcaxbzuwlbqo`** exists but is **PARKED** for a future email/password + RBAC + access-code migration (not wired yet — don't re-create it).
- **Payments:** XRPL — 5 XRP one-time unlock (`xrpPayment.ts`).
- **Hosting:** Vercel; audio on Cloudflare R2 (`pub-001f9f7c6afb42968add391c9e525ad8.r2.dev`, env `NEXT_PUBLIC_AUDIO_BASE_URL`).

## 11 · PROTOCOLS / SYSTEMS already implemented (the "how")
Whole Sign houses · 5-sense protocol (Sound/Scent/Taste/Body/Sight) · SOAP assessment · tri-source planet scoring (natal + transit + symptom) · signal hierarchy (primary/secondary/tertiary) · remedy polarity / corrective direction · the fork rite (3 containers, fixed phase architecture) · **Cousto** planetary frequencies (forks/audio) · **Solfeggio** chakra tones (separate layer) · cell-salt mineral foundation (Schüssler + Carey/Bonacci gestation rule, no dosages) · Sacred Tea matching · daily transit temperature.

---

### How to use this doc when planning
1. **Check here first.** If it's listed, it exists — propose *improving* it, not *building* it.
2. The intelligence is deep and already wired (`engine.ts` is the hub). New features are almost always **surfacing existing engine output** in a new UI, not new backend logic.
3. The AI bot (`/api/teach` + TeacherChat) already exists — route "let the bot do the heavy lifting" ideas through it.
4. When unsure whether something is built, ask for a code check rather than assuming it's missing.
