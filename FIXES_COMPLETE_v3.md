# FIXES_COMPLETE_v3 — Trust Fixes (timezone + Planet≠Remedy wiring)

---
## ═══ MASTER BUILD DIRECTIVE v2 — RESULTS (newest first) ═══

### AUDIO OVERLAP / STOP BUG — FIXED (launch-blocker) — DEPLOYED 2026-06-15 (`astryx-c1iwg9zg2`)
**Symptom:** music stacked — each fork step / track change / screen layered a new song on top with no way to stop. tsc 0; build ✓ 9/9.

- **Root cause:** `sunoPlayer.crossFadeTo` used ONE shared `fadeRafId` that every ramp reused (`setPhase` fires the phase ramp every 2s in the chamber). Each new fade/ramp **cancelled** the rAF that was scheduled to dispose the previous element, so the old `<audio>` was **never disposed and kept playing**; `stop()` only stopped the latest element. Result: unbounded pileup, unstoppable.
- **Fix 1 — overlap-proof player (`sunoPlayer.ts` rewrite):** tracks EVERY `<audio>` in a `Set` + every rAF id. `crossFadeTo` ramps old elements down and **hard-disposes them via a guaranteed per-element `setTimeout` backstop** (independent of any rAF cancellation). `stop()` cancels all rAFs and **disposes every tracked element** (not just the current). `load()` disposes all others. Single track at a time, structurally.
- **Fix 2 — single global controller (`lib/audioSession.ts`):** `AudioSessionManager` with `claim(source)` / `panicStop()` / `stopAll()` and one source-of-truth `activeSource` ('none'|'chamber'|'musicLibrary'|'preview'). `claim()` hard-stops a different active source before starting. Every audio surface routes through it.
- **Fix 3 — panicStop wired to every exit point:** `page.tsx` calls `audioSession.panicStop()` on **every screen change** (the app's "route change") + on `pagehide` (refresh/close). `SoundEngineController` `claim('chamber')` on Play/Resume, `panicStop()` on Stop + on unmount. `MusicLibraryScreen` `claim('musicLibrary')` on play, `panicStop()` on unmount.
- **Note:** the chamber is music-only (H.3) — Tone.js (`soundEngine.ts`) is never started live, so `panicStop` covers `sunoPlayer` + dormant `transitAudio`. (Hook documented in `audioSession.ts` if Tone is ever revived.)
- **Meets all 10 acceptance criteria:** new track stops previous · skip doesn't layer · exit/screen-change/refresh stop all · library ≠ chamber overlap · Stop fully stops · no ghost resume · nothing plays without Play. ⚠️ Needs an **ear check** on a device (audio can't be verified headlessly).


### FINAL QA REPAIR PASS (Phases 1–15) — DEPLOYED 2026-06-15
Trust/stability/polish pass. tsc 0; build ✓ 9/9. No new features; no Chamber expansion.

- **P1 Astrology accuracy (HIGH) — VALIDATED, no code change.** Ran a temp `/api/vtest` suite over 10 charts (1955–2026). **Sun signs 10/10 correct; Saturn signs match ingress history; transiting Saturn = Aries (Jun 2026).** The flagged 1957 "Saturn Return" does NOT reproduce: natal Saturn Sagittarius vs transiting Aries = 125.6° → no flag. `detectLifeEvent` only labels a real ≤2° Saturn-conjunct-Saturn. Full report: `ASTRYX_CHART_VALIDATION.md`.
- **P2 Results blank gaps (HIGH) — investigated; flagged.** No fixed/large heights or empty wrappers in `ResultsScreen`; `fade-in-up` uses `forwards` (not the cause). Could not reproduce headlessly; documented suspects (expanded See Why → ChartTabs) for human repro in `ASTRYX_QA_CHECKLIST.md`. No blind structural edit (would risk the approved layout).
- **P3 Raw internal codes (HIGH) — FIXED at source.** `engine.ts`: `breathLabel()` extended with all `body-protocols.json` tokens + a humanize fallback, and now applied on the natural/balanced path (was corrective-only) — kills the `alternate_nostril_breath` leak. New `humanize()` applied to body movement/posture/touch/orientation. Herbs/scents/visual already humanized.
- **P4 Persistence (HIGH) — FIXED.** `store.ts` persists `protocol`/`chartData`/`accentColor`/`selectedSymptoms` → refresh keeps the active reading. `page.tsx` writes the reading to History at generation time (and the duplicate session-exit write was removed). History is non-empty after a reading.
- **P5 Body Grid taps (MED) — FIXED.** Clicks were already wired (glyphs + chakra nodes); the detail panel rendered below the tall body image so a mobile tap looked dead. `BodyMap.tsx` now scrolls the panel into view on open. Full device tap-verify in the QA checklist.
- **P6 Music track labels (MED) — FIXED.** `sunoLibrary.variantLabel()` → "Sun · Natural · Variant II". Music Library browse/favorites/sequences/mini-player + chamber chooser tooltip no longer show `SUN_NAT_01` codes. Choice stays locked within the called-for calibration category; default deterministic.
- **P7 Version sync (MED) — FIXED.** New `src/lib/version.ts` (`1.4.0`); Settings About + `package.json` use it; manual says v1.4. One source of truth.
- **P8 First-run orientation (MED) — ADDED.** Intake shows a "Welcome to Astryx — calibration, not prediction" card (you don't need astrology/forks/tools) with "Got it"/"Skip intro"; returning users get a collapsed "How it works" toggle (`orientationSeen` persisted).
- **P9 Language safety (HIGH) — DONE (core).** "Cosmic Diagnostic" → **Your Calibration Insight**; "Your Prescriptions" → **Your 5-Sense Calibration Plan**; "Prepare your rite" → **Prepare your Chamber**; session top bar "The Rite" → **Chamber Session**; manual updated. (Ceremonial/flavor uses of "rite" in non-medical copy kept intentionally; HIGH-risk diagnosis/prescription headers all replaced.)
- **P10 Solar Chart clarity (HIGH) — DONE.** Intake note + a Results amber caveat banner: sign-based insights stay useful, but houses/ASC/MC/timing are less precise without a birth time. Manual updated.
- **P11 Astryx AI guide doc (MED) — DONE.** Manual "Meet Astryx, your in-app guide" — engine generates the protocol; the guide only explains it; no invented remedies / medical claims.
- **P12 + P15 Audio/Mobile + full test paths — DOC.** `ASTRYX_QA_CHECKLIST.md` (audio QA, mobile QA, Individual/Practitioner/Accuracy/Device paths) for human testers.
- **P13 Desktop polish (MED) — moderate.** Results container `lg:max-w-4xl` + `lg:px-8` — more desktop width, mobile-first flow intact. Fuller 2-col deferred (post-QA, as the directive allows).
- **P14 Settings copy (LOW) — DONE.** "Sound Preview" → **Chamber Audio**, copy now says audio plays only in Chamber + Music tab (no report-preview contradiction).
- **New docs:** `ASTRYX_CHART_VALIDATION.md`, `ASTRYX_QA_CHECKLIST.md`, `ASTRYX_USER_MANUAL.md` (updated).


### Part I-FIX — Chamber player & manifest repair — DEPLOYED 2026-06-15 (`astryx-lbvonz0a7`)
Driven by the external pressure-test of `astryx-o9k3k81ah`. tsc 0; build ✓ 9/9; aliased to https://n-pi-jet.vercel.app.

- **FIX 1+2 (🔴 root cause) — one audio owner, no autoplay.** The bug was two uncoordinated drivers: `SessionScreen` cross-faded on mount (real users' Enter-Chamber click made the browser allow it → music auto-played), while the controller's controls hid behind an init gate that never fired (→ no stop, no menu). **Rewrote `SoundEngineController` (v4.0) as the SINGLE audio owner.** Nothing plays until the user presses Play (`hasStarted`/`isPlaying` state; the only `crossFadeTo`/`.play()` is inside the Play gesture or an effect gated `hasStarted && isPlaying`). Controls + song menu render **unconditionally** (Play/Pause · Stop · Volume+Mute · seek scrubber w/ elapsed-total · ◄◄/►► · ↺ Replay) in both Default and Customize. **`SessionScreen` no longer touches `sunoPlayer`** — it passes `currentForkPlanet`; the controller resolves + plays. (Grep-verified: no `sunoPlayer`/`crossFadeTo` in `SessionScreen.tsx`.)
- **FIX 4 (🟡) — music follows the fork.** The controller resolves the track + the "PLANET · STATE — N songs" label from `currentForkPlanet` (the rite's current step; a sweep keeps the prior fork). Label + audio now update per step, matching the on-screen copy. Never-amplify preserved (state from `signalHierarchy` tierStates; correction baked in the track).
- **FIX 5 (🟡) — song menu is an explicit list.** When an aspect has >1 song, a numbered list renders (● default · ♫ playing); tap to pick. Picking persists to `songOverrides` and flips to Customize so the rite keeps the choice. ◄◄/►► remain as quick cycle.
- **FIX 3 (🔴) — manifest via same-origin proxy.** New `src/app/api/catalog/route.ts` server-fetches `${AUDIO_BASE_URL ?? NEXT_PUBLIC_AUDIO_BASE_URL}/catalog.json` (server fetch isn't CORS-bound) with `s-maxage=300, stale-while-revalidate`. `ensureManifestLoaded()` now fetches `/api/catalog` (was the bucket directly → CORS throw). mp3 playback still streams from the public bucket. **Verified end-to-end:** proxy returns clean `{error:'upstream 404', tracks:[]}` → app keeps the seed catalog, no throw. ⚠️ **Reality check:** `catalog.json` does **NOT** exist in the bucket yet (HTTP 404). The audit's "opaque no-cors probe proves it exists" was a false signal — an opaque response is unreadable, so 404 and 200 look identical; it only proved the fetch didn't network-error. The proxy is correct and ready; **I.4 "grows monthly" activates only once SHA uploads a real `catalog.json`** (generate via `scripts/generate-catalog-manifest.mjs`). The version chooser already works NOW off the 172-track seed (which has the multiples, e.g. Saturn/exc=6, Sun/blk=4).
- **FIX 6 (🟢) — balanced path detail.** Marking a planet balanced now reveals "A resource you can draw from" + 3 affirmative descriptors (`BALANCE_DESCRIPTORS` in `IntakeScreen.tsx`), not just a checkbox.
- **Persistence kept:** `chamberAudioMode` + `songOverrides` still persist across sessions; ↺ reset-all retained.
- ⚠️ **By ear (SHA / blind test):** enter chamber → silence until Play; all controls present + working; song menu lists + persists; label follows the fork; Mars-excess zero-percussion/cooling.



### Part I — Intake Balance, Chamber-Only Player & Music Library — DEPLOYED 2026-06-15 (`astryx-69fhg9hzp`, dpl_BAhHf4QADFy4iGu8c1jUP3voRRgM)
SHA's five findings from live testing. `tsc` 0; `npm run build` ✓ 9/9; aliased to https://n-pi-jet.vercel.app. Determinism + compliance intact. **Open question resolved by SHA: audio is STRICTLY chamber-only** (no preview on Results).

**I.1 — Intake captures BALANCE, not only imbalance.** Each Resonance-Scan planet card now has a **"This feels balanced & strong for me"** toggle (dashed, one extra tap), **mutually exclusive** with that planet's imbalance statements (selecting balance clears the planet's taps + their symptom tags; tapping an imbalance un-marks balance). Captured as `IntakeData.resourcedPlanets` (persisted) → passed to `determinePolarity`.
  - `RemedyPolarityEngine`: new `resourcedPlanets` input + `resourced` flag on `PolarityResult`. A resourced planet is **forced `balanced`** (a resource, never a deficit; chart can't flip it), and its presence **reorders the regulator candidate list** so a correction *borrows from the resourced planet first* — only within the authored `regulator_planets`, never inventing one. Deterministic.
  - **Verified (temp `/api/vtest`, then deleted):** Mars-excess + **Venus resourced** → Mars excess, regulator reorders `[Moon,Venus]`→**`[Venus,Moon]`** (drawing from the strong planet). Mars-excess + **Mars resourced** → Mars **forced balanced** (`resourced:true`), correction moves off it. No resourced → baseline `[Moon,Venus]` unchanged (no regression). Mark everything balanced → no symptom signal → balanced → no correction (existing behavior). ✅
  - Files: `IntakeScreen.tsx`, `store.ts` (default + already-persisted intake), `types/index.ts`, `RemedyPolarityEngine.ts`, `engine.ts`.

**I.2 — Audio belongs ONLY in the chamber.** Removed ALL playback from Results: the transit-modal "▶ Play this transit", the hero "▶ Preview sound", the ChamberCTA "Hear Preview · 15s", and the per-prescription `SoundPreviewButton`. `ResultsScreen` no longer imports `transitAudio`/`SoundPreviewButton`. Transit cards are now **informational + a fork suggestion**: *"Strike your {planet} fork on your own for ~5 minutes (up to 10 to go deeper)"* — on the expanded card AND in the modal Sound panel (corrective-aware: suggests the regulator fork under an active correction). This intentionally walks back Part C's per-transit playback (the overlap-with-no-stop bug). `transitAudio.ts` + `SoundPreviewButton.tsx` remain on disk but are no longer used on any report surface.

**I.3.1 — Default vs Customize song choice (follow-up, DEPLOYED 2026-06-15 `astryx-5cvvgjwd9`).** Each planet+state has multiple songs (e.g. Saturn/exc=6, Sun/blk=4) but only the deterministic `seed % pool` one plays by default. The chamber player now has a **Default | Customize** toggle: *Default* = the rite picks (unchanged); *Customize* = an explicit chooser shows every song for the currently-playing aspect (● marks the default, ♫ the playing one), tap to switch. ◄◄/►► version cycling appears only in Customize; in Default a hint shows "{n} songs … tap Customize to choose". `SoundEngineController` gained `audioMode`/`onAudioModeChange`/`onSelectVersion`/`onResetOverrides` props; the rite's per-step cross-fade honors overrides via `buildTrackUrl`.
  - **PERSISTED ACROSS SESSIONS (SHA's call — "the user is in control of their session"):** the mode + per-aspect picks now live in the Zustand store (`chamberAudioMode`, `songOverrides` keyed `{planet}/{folderState}`) and are in the persist whitelist, so a returning user keeps the chamber they shaped. A **↺ reset all** link (in Customize, when overrides exist) clears back to the deterministic defaults. (`store.ts`, `SessionScreen.tsx` reads/writes the store; deployed `astryx-o9k3k81ah`.)

**I.3 — Chamber entered AFTER the report; it owns the player.** Natural-flow gate: the hero CTA is now **"Read your reading ↓"** (nudges into the report) and the transit modal CTA is **"To your chamber ↓"** (closes + smooth-scrolls to the gated entry) — the single **Enter Chamber** lives only in `ChamberCTA` (`id="chamber-entry"`), after *Prepare your rite*. `SoundEngineController` gained a **full transport**: play/pause + volume + mute (existing) **plus** ◄◄ previous-version · ↺ replay-from-start · ►► next-version · a **seek scrubber with elapsed/total** (subscribes to the player clock). `sunoPlayer` gained `seekTo/getCurrentTime/getDuration/restart/setLoop/onTimeUpdate/setOnEnded/getCurrentUrl`. Skip/prev cycle **versions of the called-for aspect** (parsed from the current track URL).

**I.4 — Library holds ALL songs, with versions, grows monthly.** `sunoLibrary` now keeps the static `CATALOG` as a **seed/fallback** and, at runtime (client), fetches **`{NEXT_PUBLIC_AUDIO_BASE_URL}/catalog.json`** (`ensureManifestLoaded`) and merges it over the seed — **monthly additions appear with no redeploy**. Accepts flat `tracks:[ "{planet}/{state}/{file}.mp3" ]` and/or nested `catalog:{planet:{state:[stem]}}`. New `versionsFor(planet,state)` / `parseTrackUrl`. Deterministic default selection unchanged (seed % pool) — the pool is just the full set now. **Generator shipped:** `scripts/generate-catalog-manifest.mjs` (Node; turns a bucket listing into `catalog.json`). ⚠️ **Action for SHA:** upload `catalog.json` to the R2 bucket root for the no-redeploy behavior to activate — until then the seed catalog is the (current) pool. (SHA deleted the R2 API token; mint a read-only one or export the file list from the Cloudflare dashboard — see `suno-audio-r2-pipeline.md`.)

**I.5 — Favorites + Build-your-own-chamber.** New **Music** nav tab → `MusicLibraryScreen` (env-gated). Three surfaces: **Browse** (full bucket by planet × state, every version, play/♡/＋), **Favorites** (saved tracks, "play all", persisted), **My Chambers** (assemble a sequence — add/reorder/remove, name, save, play; plays through advancing on `ended`). Store: `favorites` + `customSequences` (+ actions) persisted (localStorage for anon; Practitioner can build client sequences). A fixed **mini-player** (prev/play-pause/next + scrubber) drives `sunoPlayer`; the screen releases the player + restores loop on exit. Files: `MusicLibraryScreen.tsx`, `store.ts`, `types/index.ts` (`SavedTrack`/`CustomSequence`/`SoundFolderState`/`'library'`), `NavBar.tsx`, `page.tsx`.

⚠️ **By eye / by ear (SHA — only confirmable in live use):** the chamber transport (skip/prev/replay/scrubber) operating on the real Suno tracks; version-switching within an aspect; Music Library browse/favorite/sequence playback; that no audio plays anywhere on Results and nothing overlaps. Engine (I.1) + build are verified here; the audio UX needs your ears on the live URL.


### v2 Part A + Part B (P0) — DEPLOYED 2026-06-08 (`astryx-333ypk04p`)
**Part A — symptom-driven polarity state (kills the universal "running hot").** In `RemedyPolarityEngine.ts`, the per-planet scoring was rewritten so the **user's symptom `state_signal` is the sole authority for the polarity STATE**. Chart-structure modifiers (transit pressure, hard aspect, sign modality, house) now accumulate into a separate `chartBias` that may only (a) lift the *confidence* of the state the symptoms already chose, or (b) break a tie *between symptom-supported states* — they can never set or flip the state. No symptoms → `balanced` (no correction). Determinism preserved (no `Math.random`). Output shape unchanged (`scores` now = symptomContribution + chartBias for practitioner introspection; `confidence` = symptom weight + capped same-state chart agreement).
- **Acid test (temp `/api/vtest` route driving `runEngine`, same birth data 1990-03-22 Lisbon, then deleted):** Mars-deficiency symptoms → **Mars · deficiency · strong**; Mars-excess → **Mars · excess**; Neptune-excess → **Neptune · excess**; no symptoms → **balanced, symptomDriven=false**. Changing symptoms changes the state. ✅

**Part B — corrective Cosmic Diagnostic (closes the last amplify leak).** `buildDiagnostic` runs before polarity is known, so its `rootCause.actionLayer` / `plainLanguage.howToRestore` were the raw, polarity-unaware `medicalAstrology.howToRestore`. Added `correctiveDiagnosisAction(polarity)` (next to `shouldApplyPolarity`) that builds the action line from the **same `CorrectiveProtocol`** the prescription/chamber use — regulator-named, corrective herbs (same oneirogen gate), scents, breath, regulator Hz. In `runEngine`, after `dominantPolarity` is resolved, when `shouldApplyPolarity` holds, both fields are overwritten. `ResultsScreen.tsx:198` renders the corrected line.
- **Verify:** Neptune-excess diagnostic now reads *"borrowing Mercury's qualities: clarify, structure, ground. Sip a peppermint-led blend (peppermint, rosemary, ginger)… Play the Mercury tone at 141.27 Hz."* — **no Blue Lotus, no 211.44 Neptune fork.** Mars-excess → Moon/cooling/210.42 Hz; balanced → raw restore text untouched. Probabilistic framing ("may be reading as"), no banned phrases. ✅
- **Gate:** `npx tsc --noEmit` exit 0; `npm run build` ✓ 9/9 pages. Engine determinism + Teacher/audio work unaffected.

### H.3 — MUSIC-ONLY CHAMBER (tones removed) + volume raised — DEPLOYED 2026-06-09 (`astryx-fdczgklpz`)
**SHA's call before testing H:** the synthesized tone layer CLASHED with the music — the planetary frequency is already in the music itself (tracks composed in keys/notes keyed to planetary energy). And the music was too quiet. So:
- **All synthesized tones removed from the chamber.** `SoundEngineController` rewritten music-only (v3.0): no Tone.js start, owns activation gesture / play-stop / volume / a local time-fraction **5-phase volume envelope** (the Tone phase scheduler no longer runs); decorative deterministic pulse bars replace the waveform tap. `soundEngine.ts` itself untouched (Rule 8) — just no longer started by the chamber; Tone never dynamically loads.
- **The rite drives the MUSIC now, not a tone:** each fork step cross-fades (`sunoPlayer.crossFadeTo`, 4s) to THAT planet's Suno track — its own state track for the main 3 (from `ChamberDNA.tierStates`), NAT for open/supporting; sweep keeps the current music. The close = the primary's music + strike the primary fork ("the closing music carries you home"). `forkTone.ts` deleted.
- **Previews are music too:** hero + ChamberCTA + prescription `SoundPreviewButton` now play the primary's own Suno track (15s/8s) via the isolated transit-preview player. No Tone preview anywhere.
- **Volume raised (music-forward):** phase envelope floor 0.60→**0.85** (entry), integration 0.50→**0.85**, regulation 0.75→0.92; default chamber volume 0.7→**0.9**; preview level 0.7→**0.9**. Effective music level ≈0.77–0.90.
- **Visual kept alive:** `VisualEngineCanvas` audio-energy falls back to a gentle deterministic breathing pulse (the Tone waveform tap is silent now).
- Copy updated (rite card: "the frequency lives in the key and notes you're hearing"; close + protocol sheet). `tsc` 0; build ✓ 9/9.
- ⚠️ **By ear (SHA):** confirm the music level and the per-fork track shifts in a live session.

### Part H — THE SESSION PROTOCOL (the Chamber, rebuilt) — DEPLOYED 2026-06-09 (`astryx-fn5gz2t9u`)
**The rite itself — the product everyone pays for.** SHA's live-use verdict drove four experience fixes, then a full rebuild of `SessionScreen` into a carried, timeline-driven planetary-fork tuning rite.

**H.0 — experience fixes:**
1. **Mix inverted — music leads.** `sunoPlayer.ts` `SUNO_LEVEL` 0.80 → **1.0** (music = foreground); `soundEngine.ts` master 0.55 → **0.30** initial + `setMasterVolume` now scales the UI slider by `SYNTH_UNDERLAYER_LEVEL = 0.45`, so the synthesis stays the grounding underlayer at EVERY slider position. Master levels only — no Suno-wiring retune (Rule 8). Stale "synthesis remains the root" comment corrected.
2. **The sound moves with the rite.** New isolated `src/lib/forkTone.ts` (single Web Audio oscillator, ~0.07 gain, glide+swell): as the rite reaches each fork, THAT planet's Hz rises under the music so the user tunes their physical strike to it. The Suno tier journey (B.1 `crossFadeTo`) + the 5-phase Tone plan are time-scaled to the same `chamberDurationSec` as the fork timeline — nothing loops, the whole field evolves with the session.
3. **Planet-true language.** New `feltStateLanguage(planet, state)` in `engine.ts` (exported), built on the Part-F `PLANET_ELEMENT` map: Fire-excess "running hot → cool, calm"; **Air-excess "running fast — scattered, wired → settle, slow, ground"**; Earth-excess "running heavy — rigid, walled-in → soften, release, lighten"; Water-excess "running high — flooded, foggy → clarify, contain, ground"; deficiency "running low → build, warm, strengthen"; blocked "stuck → mobilize, free". Wired into the diagnostic headline+body (`alignDiagnosticToPrimary`), the corrective action lead (`correctiveDiagnosisAction`), and the hero felt-state line (`feltLinesFor` in ResultsScreen). The old global "running hot" maps are deleted.
4. **Landmarks recognized.** `detectLifeEvent` in `engine.ts` + `ActiveTransit.lifeEvent` type: **Saturn Return**, Saturn→Sun, Saturn→Moon, **Jupiter Return** — +100 weight (outranks generic transits; `buildDiagnostic` re-sorts after shaping), and a distinct amber banner card in `TransitCard`. *(Nodal/Chiron Return: TODO — nodes/Chiron not in the chart engine yet.)* **Dead card fixed:** the WHOLE transit card now opens its protocol modal (`onOpenProtocol` on the card; the expand chevron is a separate stopPropagation control) — fires on every card including the first.

**H.1 — the fork rite (`src/lib/chamber/forkRite.ts` + `SessionScreen` rebuild):**
- `buildForkRite({hierarchy, tier, durationSec})` → deterministic weighted timeline: grounding **OPEN** (first of Saturn/Venus/Moon/Sun not in the main 3) → **SUPPORTING** passes (canonical order) → **MAIN 3** = signalHierarchy tertiary → root → **primary LAST** (held 3× a supporting pass) → **CLOSE** = app-played Earth Om 136.10 Hz paired with the user's PRIMARY fork (Part C2 honored — no Earth fork to hold). Hold times scale to the chosen duration; last step absorbs rounding.
- **Carried flow:** the step derives from `effectiveTime` (sessionTime − pausedTotal + skew) — fork holds auto-advance with strike cues ("Strike now… Hold… Release — next fork") and a countdown; manual ← → pins a step ("Lingering"), **▸ Resume the flow** returns to the timeline. Each step swells its fork tone via `forkTone.ts`. The old click-through 10-step wizard (space/tea/crystal steps — now covered by Part G's "Prepare your rite") is replaced; the close step keeps the symptom check-in / vagal / notes / save flow. `SessionScreen.dominantPlanet` now reads `signalHierarchy.primary` (B.1 invariant — was the raw chart lead).
- **Application keys to the owned SET:** persisted `forkSetType` in the store (default by tier: Individual=unweighted aluminum, Practitioner=weighted steel) + an in-session "Your set" toggle. Unweighted → **field/ear/around-the-body, light contact only** (+ "on-body unlocks with the weighted steel set" note); weighted → **on-body stem placement** at the fork's bone application point.

**H.2 — tiering:**
- **Individual:** condensed rite — open + ONE supporting **sweep** ("the music carries them; strike any you own as they call") + main 3 real holds + close. New **'Rite' 15-min preset is the default** (`durationPresets`: added `rite` 900s user / `service` 3600s practitioner). Complete on its own, carried, no operating required.
- **Practitioner:** full protocol — all 10 forks individually, generous holds (main = 3× supporting), per-fork clinical detail (nerve plexus/ANS/clinical note), **pacing controls** (Pause / +60s hold / Skip fork), session notes (existing close-step SOAP), and a **🖨 printable protocol sheet** (fork · Hz · hold · application table, set-aware, client-named, with the practitioner-responsibility disclaimer) — the billable-service artifact.

**Verified (temp `/api/vtest`, then deleted):** Mercury-excess → *"running fast (excess) … settle, slow, and ground"* — never hot/cool ✅. Individual rite (900s): open Saturn → sweep → Neptune(aggravator) → Moon(root) → **Mercury(primary)** → close 136.10+Mercury ✅. Practitioner (3600s): 11 steps, all 10 forks, mains 675s vs supporting 225s, resolves on primary ✅. Mars-deficiency rite closes on Mars ✅. **Jupiter Return detected + elevated to headline (weight 175)** on a 1967 chart — the Saturn-Return branch is the same code path ✅. Deterministic. `tsc` 0; build ✓ 9/9.
- ⚠️ **Live-listen note for SHA:** the mix inversion + fork-tone swell are level changes I can verify only structurally from here — confirm by ear in a real session that the music clearly leads and each fork's tone rises as the rite advances.

### F & G + B.1 cleanup — THE FINALE (v2 complete) — DEPLOYED 2026-06-09 (`astryx-q35b4skpv`)
**B.1 cleanup (Pressure Test #3.1):**
- **Symptom-Routing "What To Do" unified.** Each `diagnostic.symptomRouting[].rootCause.actionLayer` is now overwritten (in `runEngine`, when a correction applies) with the SAME `correctiveDiagnosisAction(dominantPolarity)` the primary uses — so a routed block can no longer print the routed planet's own fork (Sun 126.22 Hz) against the primary's regulator (Mars 144.72 Hz). One more surface on the single source of truth.
- **Tapped planet stays visible.** `buildSignalHierarchy` now computes `reportedPlanet` (the planet the user's symptoms most implicate, by weight) and sets it ONLY when it differs from the resolved primary. `SignalStack` renders the bridge: *"You reported a Mars signal → it traces to a Sun–Saturn root."* Smart routing kept; the tapped planet never silently vanishes.

**Part F — Elements, Polarity & Environment (`engine.ts` `buildEnvironment` → `EnvironmentLayer` on `ProtocolOutput`):**
- Derives the CORRECTIVE element from the regulator (not invented): `PLANET_ELEMENT` (traditional rulership — Moon=Water, Mars=Fire, …) → the regulator's element. **Points toward balance by construction:** Mars-excess → Moon = **Water** (cool); Mars/Sun-deficiency → **Fire** (warm); Neptune-excess → Mercury = **Air**. Posture follows the element (Fire/Air → projective, Water/Earth → receptive); tempo from the primary's natal sign modality (`SIGN_MODALITY` from signs.json). Deterministic; authored from existing data.
- **Verified:** Mars-excess → Water/receptive ("near still water"), never fire; Mars-deficiency → Fire/projective ("sunlight/hearth"), never cold; Neptune-excess → Air/projective. ✅

**Part G — The Integrated Rite (`PrepareRite` card on Results, before the Chamber CTA):**
- "Prepare your rite — IF YOU CAN": **Brew** the corrective tea (+ inline substitution: "No tea? Reach for {oil} oil — same frequency"); **Tone** — ready the PRIMARY planetary fork (+ "No fork? the app tone carries it — strike along"); **Space** — the Part-F elemental invitation (setting + posture + tempo; Practitioner sees `element·polarity·modality·corrective`). Invitation framing, never a checklist. The chamber still opens + closes on the primary (B.1 resolve-on-primary). `environment` also fed to Astryx grounding.
- **Gate:** `tsc` 0; build ✓ 9/9. Determinism + compliance + safety notes intact; Rule 8 + env gate honored.

**→ v2 IS COMPLETE.** Present state asks the question · the fixed chart is the key · medical astrology is the language · one ranked signal (`signalHierarchy`) drives words + tone + music · the six senses + the elemental setting are the rite · the user owns the depth · Astryx is the voice.

### B.1 — Signal Hierarchy & Tiered Audio — DEPLOYED 2026-06-09 (`astryx-d4gi33sab`)
**The coherence fix from Pressure Test #3.** Root cause: three different code paths each computed their own "dominant" (prescription used `dominantPattern.planets[0]`, the chamber callout used `dominantPolarity`, `buildDiagnostic` used `pattern.planets[0]`) — on a Mars/Sun symptom-weight tie they diverged (hero=Mars, diagnostic+chamber=Sun) and the diagnostic body read Mars's *excess* archetype to a *depleted* user.

- **Step 1 — one source of truth.** New `SignalHierarchy {primary, secondary, tertiary}` (types/index.ts) built ONCE in `runEngine` via `buildSignalHierarchy()`. `primary` = symptom-driven dominant (Part A); on a symptom-weight TIE it prefers the chart lead so the subject lands deterministically on ONE planet (this killed the flip). `secondary` = the symptom-routing root (different planet, context). `tertiary` = top active transit. Attached to `ProtocolOutput.signalHierarchy`. The tie-aware primary becomes the canonical `dominantPolarity`.
- **Step 2 — every surface reads it.** Prescription (a) now keys to `primary.planet` (was the raw chart lead). `alignDiagnosticToPrimary()` re-keys the Cosmic Diagnostic headline + **state-aware body** (built from the planet's domain + its CURRENT state — a deficiency reading says "may be under-resourced / running low", never the excess "overheating/rage" archetype) + dominantPlanet, and labels the root explicitly ("Beneath it, a {secondary} root"). Action stays corrective (Part B). Astryx grounding now receives `signalHierarchy`.
- **Step 3 — ChamberDNA carries 3 tiers.** `generateChamberDNA` reads `protocol.signalHierarchy` for `primaryPlanet/secondaryPlanet/tertiaryPlanet` + independent `tierStates` (was `pattern.planets[0]` — the chamber's "Sun" bug). The chamber + hero now name the SAME planet+state.
- **Step 4 — tiered audio.** Drone already = primary corrective Hz (`effectivePlanet`). **Suno journey:** new `resolveTierTrack()` (sunoLibrary) + `sunoPlayer.crossFadeTo()` (true 2-element overlap); `SoundEngineController` pre-resolves the three tier tracks and cross-fades per phase with **resolve-on-primary** (entry/activation → primary; peak → secondary/root; regulation → tertiary/aggravator; integration → **back to primary**). Correction baked into the track (own-state track, never the regulator's NAT — no double-correct); deterministic; env-gated; `soundEngine.ts`/`transitAudio.ts` untouched (Rule 8). _(The Tone.js secondary-COUNTER Hz swap was deferred to avoid retuning the live de-harshed mix mid-cycle — the drone carries the correction; documented as a low-risk follow-up.)_
- **Step 5 — tier-gated display.** New `SignalStack` in the diagnosis card: Individual sees the primary chip + a one-line "{secondary} root — ask Astryx ↗" hint; Practitioner sees the full SURFACE / ROOT / AGGRAVATOR differential with states.
- **§9 reconcile:** confirmed already fixed (prescriptions pull from `primary`, not NAT) — not re-implemented. A–E intact.
- **Verified (temp `/api/vtest`, then deleted):** Mars-deficiency → hero/prescription/diagnostic/dominantPolarity/chamber-DNA/chamber-DETECTED **all "Mars·deficiency"** (all-agree); body = "may be under-resourced or running low" (no excess archetype). Mars-excess / Neptune-excess / balanced all-agree. Journey: Mars-def → `MARS_DEF`→`MOON_NAT`→`NEPTUNE_NAT`→`MARS_DEF`; Mars-exc opens+closes on `MARS_EXC`; deterministic on repeat. `tsc` 0; build ✓ 9/9.

### v2 Part E (P2) — medical-astrology IA spine — DEPLOYED 2026-06-09 (`astryx-733ypqh4q`)
**Navigation reorganized around the spine; tier-gated.** `NavBar.tsx` `NAV_ITEMS` gained per-item `premiumOnly` / `needsProtocol` flags + a `visibleItems` filter (new `hasProtocol` prop, gates on `user.isPremium`):
  - Added **Chart** (◉) and **Body Grid** (⬡) as user-facing items — the user's own map, surfaced directly (appear once a reading exists). New thin screens `ChartScreen.tsx` (wraps `NatalChartWheel`) + `BodyGridScreen.tsx` (wraps `BodyMap`); rendered in `page.tsx` (`chart` / `body-grid` AppScreens added to `types/index.ts`).
  - **Body Systems** (⊞) + **Clients** are now **Practitioner-tier only** (hidden from the nav for non-premium; `body-system` screen guarded in `page.tsx` with a new `TierGate` fallback for direct access).
  - **`SYSTEM · SIGN · PLANET` chain** added to the body-system header (`BodySystemPreviewScreen.tsx`, e.g. `CARDIOVASCULAR · LEO · SUN` from `astrologicalRulership.primarySign/primaryPlanet`). Re-labelled the old "SCHEMA PREVIEW / architect review" strings to the live Practitioner Body Systems surface + the standard micro-disclaimer.
- **Verify:** Individual menu (with a reading) = Home · Intake · Results · **Chart · Body Grid** · History · Settings — **no Body Systems / Clients**; Practitioner additionally sees Body Systems (with `SYSTEM · SIGN · PLANET` headers) + Clients. `tsc` 0; build ✓ 9/9.
- **Continued (overlaps Phase-1 carry-forward):** threading the planet/sign lineage onto EVERY herb/tone/color/crystal element with an inline "ask Astryx" — the body-system header chain + Chart/Body-Grid surfacing land the spine; element-level "learn this" everywhere is the remaining sweep.
- **Note (SHA request):** a **360° rotatable Body Grid** was requested — flagged as a separate task; needs a turntable image sequence (24–36 frames) from SHA, or a Three.js Phase-3 upgrade. Current Body Grid is the flat front-view SVG.

### v2 Part C (P1) — audio honesty — DEPLOYED 2026-06-09 (`astryx-3zgyqyynb`)
**C1 — each transit plays ITS OWN audio, never the dominant.** New isolated module `src/lib/transitAudio.ts` (`planTransitAudio`, `playTransitPreview`, `stopTransitPreview`, `seedFromString`, `STATE_MAP`) — own `HTMLAudioElement` for tracks + a single Web Audio oscillator for the tone-only fallback. It does NOT touch `sunoPlayer` (chamber's sole controller) or `soundEngine` (Rule 8). `TransitProtocolModal` (ResultsScreen) now has a **"▶ Play this transit"** control in the Sound section. Resolution: under an active correction → the corrective planet's state track (`mars/exc` etc.) with the regulator Hz as tone fallback (cooling, never amplifying); otherwise the transiting planet at `nat`. If the catalog/CDN has no track → that planet's **tone only**, clearly labelled (`Tone only · {planet} {hz} Hz`) — never the dominant. Deterministic variant via `seedFromString(birthDate|transit signature)`.
- **Verified (temp `/api/vtestaudio`, then deleted):** Jupiter-trine-Moon → `jupiter/nat`; Saturn-square-Neptune → `saturn/nat`; Mars-excess → `mars/exc` (tone fallback Moon 210.42); Neptune-excess → `neptune/exc` (tone Mercury 141.27); unknown planet → tone-only, no dominant substitution. ✅

**C2 — fork set = the 10 planetary forks only; Earth/Platonic tones are app-played.** Added `APP_PLAYED_TONES` (`Earth Day`, `Earth Year`, `Platonic Year`) + `isOwnedPlanetaryFork()` to `lib/utils.ts`. Fixed every "apply a fork you don't own" instruction:
  - `SessionScreen` closing step (was *"Strike the Earth Day fork. Apply at sacrum/heel"*) → *"The Earth tone ({hz} Hz) plays from the app — there is no Earth fork to hold. Strike your {dominantPlanet} fork along with it."* (passed `dominantPlanet` into `StepClose`).
  - `PractitionerScreen` fork loop → app-tones now render as "{name} Tone · app-played" with a "Delivery: App-played background tone — pair with the planetary forks" line instead of a bone Application Point; intro copy reframed (no "ground with Earth Day").
  - Transit modal practitioner Sound line → "Earth Om regulator (app-played background) … strike the planetary fork along with it."
- **Verify:** no instruction asks the user to strike/apply a non-owned fork; Earth/Platonic tones are clearly app-played and paired with a planetary fork. Planetary fork-sequence steps (owned) unchanged.
- **Gate:** `tsc` 0; `npm run build` ✓ 9/9. Chamber audio path + determinism untouched.

### v2 Part D (P1) — DEPLOYED 2026-06-08 (`astryx-lptl83rpq`)
**Teacher → Astryx (the named guide).** All user-facing "Teacher" copy renamed to **Astryx**; the `SYSTEM_INSTRUCTION` identity line is now *"You are Astryx — the living intelligence of this system, its sixth sense… you speak as Astryx herself… never as a generic assistant or teacher."* The operating contract, four verbs, three roles, scope rails, and compliance spine are unchanged. Code identifiers + filenames (`/api/teach`, `teacher/*`, `TeacherChat`, `askTeacher`) intentionally kept to avoid churn. Changed: `grounding.ts` (identity + 2 glossary lines), `TeacherChat.tsx` (header "Astryx", busy/error copy, "I'm Astryx" intro), `ResultsScreen.tsx` ("Ask Astryx" Mind card).
- **Verify (live):** "Who are you?" → *"I am Astryx, the living intelligence of this system…"* `flagged:false`. Compliance vectors unaffected. `tsc` 0, build ✓ 9/9.

**Remaining v2:** Part C (audio honesty — transit-own-tone + 10-fork set; **needs an audio-architecture change** — the transit modal currently has no per-transit playback and "Start Calibration" launches the dominant chamber), Part E (IA spine — nav/tier gating), Part F (elements/environment — new protocol fields + UI), Part G (integrated rite — prepare/substitution flow). Carry-forward Phase-1 items still open. Order note: D was landed before C (both P1, independent) because C is a larger isolated change; A→B→D shipped, C/E/F/G are the focused follow-ups.

---

**Applied by:** Cowork session, 2026-06-08. Source-verified against this repo + Swiss Ephemeris.
**Status:** Code changes COMPLETE and intact on disk. `npm run build` NOT yet run in-session (the Cowork build sandbox's mount went stale during heavy I/O — see "Build note" at the end). Run `npm run build` in a normal local terminal to confirm; expected clean.

---

## What changed (3 files, 7 edits)

### 1) `src/lib/timezone.ts` — historical timezone (P0-1)
**Bug:** `getTimezoneFromCoords()` resolved the UTC offset at `new Date()` (today), and `birthTimeToUTC()` applied that present-day offset to the birth instant. A 1990 Lisbon birth therefore got UTC+1 (today's summer offset) instead of the correct historical UTC+0 → Ascendant computed as Libra instead of the correct Scorpio.
**Changes:**
- `getTimezoneFromCoords(lat, lon)` → `getTimezoneFromCoords(lat, lon, atDate?: Date)`. The offset + label now resolve at `atDate` (defaults to now for the live UI label). `Intl`/ICU carries historical DST, so passing the birth date yields the correct historical offset.
- `birthTimeToUTC()` now computes a `refDate` at local noon of the birth day and passes it to `getTimezoneFromCoords`, so the offset is the one in effect *at birth*.
**Verified:** replicated `getUTCOffsetHours` → 1990-03-22 Lisbon = **UTC+0** (was +1), 2026 Lisbon = +1, 1990 New York = −5.

### 2) `src/app/api/chart/route.ts` — resolve offset server-side at birth date (P0-1, primary fix)
**Why:** the live path doesn't call `birthTimeToUTC`. The client (`BirthLocationField.tsx`) captures `tzOffset` when the city is picked using **today's** offset, stores it, and the chart route used `body.tzOffset` directly. So the offset had to be corrected where the chart is actually computed.
**Changes:**
- Added `import { getTimezoneFromCoords } from '@/lib/timezone'`.
- Before `calculateNatalChart`, for non-solar charts with valid lat/lon, re-resolve the offset at the birth date: `refDate = Date.UTC(year, month-1, day, 12)`, `tzInfo = await getTimezoneFromCoords(lat, lon, refDate)`, and use `tzInfo.offsetHours` (falls back to the client `body.tzOffset` only if the coord→zone lookup fails / returns UTC).
**Verified (Swiss Ephemeris):** with tzOffset=0, `1990-03-22 21:42 Lisbon` → ASC **Scorpio 7°** (correct). With tzOffset=+1 → Libra 25° (the old wrong output). All 5 transits independently checked accurate to <0.2°, unaffected.
**Follow-up (optional, not done):** `BirthLocationField.tsx` still shows a "Timezone detected" label using the present offset — cosmetic; the chart is now correct regardless. Could pass the birth date there too for label accuracy.

### 3) `src/lib/engine.ts` — wire the regulator into the prescription (P0-2) + single frequency source (P1-3)
**Bug:** `composeUnifiedPrescription()` keyed all five senses + botanical + crystal + fork + sound Hz on the **dominant planet**, ignoring the `CorrectiveProtocol` that `RemedyPolarityEngine` already produces. So a Neptune-excess user got mugwort + Blue Lotus + 211.44 Hz (Neptune) — amplifying the pattern, violating "never amplify." (The `buildXProtocol` family already corrected; only this unified card did not.)
**Changes (function `composeUnifiedPrescription`, ~line 303):**
- New signature param `polarity?: PolarityResult`.
- Correction context: `correcting = shouldApplyPolarity(polarity)`, `cp = polarity.protocol`, `regulator = cp.regulator_planets[0]`, `sacredKey = regulator ?? planet`.
- Botanical, crystal, fork, and **sound anchor/Hz** re-key to `sacredKey`/regulator when correcting (so Results card + Chamber play the SAME frequency, labeled by the played planet — fixes the "141.27 Hz labeled Neptune" mismatch).
- Taste herbs ← `cp.herbs`; scent oils ← `cp.scents`; body breath ← `breathLabel(cp.breath)`; sight colors ← `cp.color_palette` — all from `remedyPolarity.json` (already authored: Neptune-excess = peppermint/rosemary/ginger/gotu kola, alternate-nostril, grounding palette).
- **Safety gate:** `isOneirogen()` blocklist (mugwort, blue lotus, wormwood, salvia, kava, valerian) — for an `excess` state these can never be returned as botanical or herb, even if a mapping surfaces one.
- Headline/summary and integration note reflect the correction (regulator named, `Avoid:` line added). Malachite warning + all existing safety notes preserved.
- Call site (`addPrescription`, ~line 1643): looks up `polarityResults.find(pr => pr.planet === planet)` and passes it in, so each card corrects in lockstep with the chamber. Chart-only (non-symptom) states stay balanced → no correction → original behavior.
**P1-4 (regulator naming) auto-resolved:** `Neptune.excess.regulator_planets = ["Mercury","Saturn"]` — surfaces now read `[0]` = Mercury consistently.

**Verified:** `composeUnifiedPrescription` parses with 0 syntax errors in isolation; `remedyPolarity.json` confirmed to contain the corrective sets used.

---

## NOT done this pass (backlog)
- P1-5 narrative parsing (still decorative) — left as-is.
- P2: Cosmic-Weather "7 active vs 5", geocode autocomplete de-dup, duplicate "BIRTH LOCATION" label, 12h time input PM, preview-vs-chamber audio parity, persisted "Test Balanced" fixture, copy passes ("a earth"→"an earth", "Density Uranus"), `BirthLocationField` label date.

## Verification checklist to run locally
1. `npm run build` → expect zero TS errors. (The repo also contains `src/lib/sunoLibrary.ts` which shows encoding/"invalid character" issues under raw `tsc` — pre-existing, unrelated to these edits; confirm it doesn't block your build as before.)
2. Vector A: `1990-03-22 21:42 Lisbon`, no symptoms → ASC **Scorpio** (was Libra).
3. Vector B: Neptune-excess (tap "confused, foggy, unmoored") → prescription shows peppermint/rosemary/ginger, alternate-nostril breath, grounding colors, **no mugwort / no Blue Lotus**; Results sound Hz == Chamber Hz.
4. Vector C: Mars-excess → cooling/calming (Moon/Venus) herbs, 4-7-8 breath. Balanced state → unchanged (keys off dominant planet).

## Build note (why the in-session build didn't complete)
This was done in Cowork against the OneDrive-synced folder. During `npm run build`, the heavy I/O over the OneDrive mount caused the Linux build sandbox to cache **stale, truncated** copies of some files (e.g. it saw `engine.ts` cut at line 1613 and `route.ts` at 236). The **actual files on disk are complete and correct** — confirmed via direct host reads (full `runEngine` tail, full route GET handler, all edits present). The stale mount made the in-sandbox `tsc`/build report false syntax errors. Re-run the build from a normal local terminal (or after the folder finishes syncing) for a clean confirmation; nothing in the source needs changing.

---

## Build & Verify Results — Claude Code (local), 2026-06-08

**Run by Claude Code on the real local files (not a synced sandbox).**

### Fix presence + coexistence
All 3 fixes confirmed present on disk via grep (no re-apply needed). Verified they **coexist** with the same day's earlier polarity/symptom/audio work in `engine.ts`, `ephemeris.ts`, `route.ts` (i.e. the Cowork edits did NOT clobber prior work): `normalizeSymptoms`/`INTAKE_TAG_TO_SLUGS`, `dominantPolarity = polarityResults[0]`, ephemeris symptom-boost + leadPlanet swap + rebalanced `PLANET_WEIGHTS` (7/8), `RemedyPolarityEngine` symptomDriven gate, the regenerated 172-track Suno `CATALOG`, `sunoPlayer` crossOrigin removal, and `VisualEngineCanvas` colorOverride — all intact.

### Build
- `npx tsc --noEmit` → **exit 0 (clean)**.
- `npm run build` → **✓ Compiled successfully**, 8/8 pages, zero TypeScript errors.
- `src/lib/sunoLibrary.ts`: **clean in this repo** — its CATALOG was regenerated earlier today and type-checks fine. The "encoding/invalid-character" issue noted above was a property of the Cowork stale/synced copy, not these files. **No repair needed; no `git checkout` performed** (and there is no git repo here — see below).

### Verification vectors (actual results — all PASS)
- **A (timezone):** `POST /api/chart` `1990-03-22 21:42` Lisbon (38.7223, -9.1393), no `tzOffset` → server resolved **tzOffset 0** (historical UTC+0), Ascendant **Scorpio 7.3°**, MC Leo. ✅ (was Libra under the bug.)
- **B (Neptune excess):** symptoms `["spiritual fog"]` → dominant planet **Neptune**, polarity **Neptune excess · strong · symptomDriven=true**, regulator Mercury. Unified prescription: taste **peppermint / rosemary / ginger / gotu kola**; breath **alternate nostril**; sound **Mercury fork @ 141.27 Hz** (= chamber); botanical **Lavender** (Mercury's), **NOT mugwort/Blue Lotus**; sight cyan/charcoal/earth grounding palette. ✅
- **C (Mars excess):** symptoms `["anger inflammation"]` → dominant **Mars**, **Mars excess · symptomDriven=true**; taste **peppermint / chamomile / lemon balm / rose**; breath **4-7-8**; sound **Moon @ 210.42 Hz** (regulator). ✅
- **C (balanced):** no symptoms → polarity **balanced · symptomDriven=false**, **no correction**; prescription keys off the dominant planet (Jupiter — natural herbs dandelion/nettle, Jupiter 183.58 Hz, natural breath). ✅

### Notes / deviations
- **No git repo exists** in this project (deploys are done directly from the folder via `vercel`). The brief's "commit with a clear message" / `git checkout` steps are therefore N/A; this report is the record instead.
- **Not deployed.** Per the brief (verify → build → report → STAND BY), no deploy was performed. These fixes are verified-and-ready; the historical-timezone fix in particular is a live-correctness improvement (Ascendant/houses), so a deploy decision is flagged for SHA/Cowork.

**Status: ✅ All 3 trust fixes verified, build clean, vectors A/B/C pass. Standing by for the next directive.**

---

## Master Build Results

### 2026-06-08 — Phase 0 trust fixes DEPLOYED TO PRODUCTION
SHA approved the deploy (live Ascendant-correctness bug). Gate + deploy:
- `npx tsc --noEmit` → **exit 0 (clean)**.
- `vercel --prod --yes` → **READY**. Deployment `dpl_4ci71viqVw2SNEEkJuZkSBDTKPqy`, aliased to **https://n-pi-jet.vercel.app**.
- The historical-timezone fix is now live: all users' Ascendant/houses are computed with the UTC offset **at birth date**, not today's offset. Regulator-in-prescription, ONEIROGENS safety gate, and single sound-frequency source also live.
- Coexists with the polarity/symptom/audio work (no regression).

**Next:** Phase 1 (Results UX redesign — "Your Calibration Today" hero, felt-state-first diagnosis, progressive teaching layer). Phase 2 (Teacher) still blocked on `GEMINI_API_KEY`.

### 2026-06-08 — Phase 1 (part 1): "Your Calibration Today" hero DEPLOYED
First Phase-1 increment. **No engine changes** — purely presentational; reads engine output with graceful fallbacks. Determinism + compliance unaffected.
- **New `CalibrationToday` hero** at the very top of `ResultsScreen.tsx` (section 0, before the Diagnosis card), defined just above `ChamberCTA`. Action-first: shows the five plain-language things to do today — **Sound** (experiential label via existing `userSoundLabel`, Hz only in practitioner mode), **Breath**, **Scent**, **Taste**, **Light** (a color swatch to rest eyes on). Pulls from `protocol.prescriptions[0].fiveSenses` (polarity-corrective) with fallback to `protocol.plan.*`.
- **Felt-state-first headline** (item 2): leads with a plain, probabilistic line from `protocol.dominantPolarity.dominant_state` (`FELT_STATE_LINES`: excess→"running hot", deficiency→"running low", blocked→"held or stuck"); planet shown as a `signal · {planet}` tag, not a fortune. Neutral copy when polarity is weak/balanced. No banned phrases; no medical claims.
- **CTAs:** "Enter Chamber →" (`onStartSession`) + "▶ Preview sound" (reuses `generateChamberDNA`+`buildHarmonicPlan`+`previewSound`, 15s, deterministic).
- **Bonus (Phase-3 P2):** reconciled the Cosmic-Weather "7 vs 5" count — header now reads `TOP 5 OF {n}` when more than 5 transits exist (honest copy), else `{n} ACTIVE`.
- **Gate:** `npx tsc --noEmit` exit 0; `npm run build` ✓ 8/8 pages. Deploy `dpl_DeoMCFhmKYvM3F7pMTSzXBENgbdg` → **READY** → https://n-pi-jet.vercel.app.
- **Verification note:** browser/CDP visual check was NOT possible this session — the Preview MCP harness cannot spawn a process from the spaced OneDrive path (`npm.cmd`/`npm` both fail with "filename, directory name, or volume label syntax is incorrect"), on top of the known live-site CDP freeze. Relied on tsc + full production build (type-check + static generation pass) for a presentational change. **SHA/next session should eyeball the hero on the live URL.**

**Phase 1 remaining:** progressive teaching layer + "learn this" affordance (needs Phase-2 Teacher), orientation bookends, one-warm-voice pass, six-sense backbone (Mind card), daily-home/returning-user landing. Phase 2 still blocked on `GEMINI_API_KEY`.

### 2026-06-08 — Phase 2: THE TEACHER (sixth sense) DEPLOYED — v1
`GEMINI_API_KEY` received from SHA, added to Vercel Production (encrypted), validated (HTTP 200; `gemini-2.5-flash-lite` available). Built the Teacher per `ASTRYX_SIXTH_SENSE_BLUEPRINT.md` (binding operating contract). **Engine untouched — the Teacher only reads engine output; the two paths never merge.**

**Server (IP-contained — imported ONLY by the route, never client-bundled; `window` guard + verified absent from client chunks):**
- `src/lib/teacher/grounding.ts` — the operating contract as `SYSTEM_INSTRUCTION` (prime directive, the 4 verbs Define/Explain/Connect/Teach, the 3 roles Teacher/Librarian/Tour-Guide, scope rails, compliance spine, progressive teaching, persona). Curated `GLOSSARY` reference shelf (15 core concepts). `pickSuggestedConcept(report, taught)` — deterministic next-concept picker preferring what's live in today's chart. `buildContextBlock()` pins the trimmed report + shelf + taught-list + today's concept.
- `src/lib/teacher/teach.ts` — `callTeacher()`: grounded `gemini-2.5-flash-lite` REST call (temp 0.4, 700 max tokens, systemInstruction + pinned context + capped history). **Output compliance:** `teacherLint()` (base banned-phrase linter, but allows the NOUN "prescription(s)" — core app vocabulary — while keeping the VERB "prescribe" and all clinical phrases banned) → regenerate-once-stricter → safe-fallback. No new npm dependency (REST `fetch`, mirrors the existing `/api/intake/interpret` pattern).
- `src/app/api/teach/route.ts` — POST: validate → **crisis gate** (`detectCrisis` → `CRISIS_RESOURCES_CARD`, no model call) → tier from session (`isPremium`→practitioner else individual) → **daily metering** (Individual/anon 10/day, in-memory by user-id/IP; Practitioner unmetered) → `callTeacher` → micro-disclaimer + `suggestedConcept` + `remaining`. `runtime='nodejs'`.

**Client:**
- `src/components/teacher/TeacherChat.tsx` — bottom-sheet chat; posts current `protocol` + `taughtConcepts` + capped history; renders replies, suggestion chips, crisis styling, `remaining` count, persistent micro-disclaimer; advances the curriculum (`addTaughtConcept`) one concept per conversation.
- `src/lib/store.ts` — `taughtConcepts: string[]` + `addTaughtConcept`, added to the persist whitelist (the Teacher's progressive-teaching memory).
- `ResultsScreen.tsx` — lifted `teacherOpen`/`teacherSeed`; the hero's `signal · {planet}` tag is now a **"learn this"** button that opens the Teacher seeded ("What does {planet} mean in my chart…"); added the **Sixth sense · Mind** entry card under the hero CTAs; `<TeacherChat>` rendered at screen root.

**Verification (curl — handoff-recommended; dev + live):**
- In-scope (Ascendant): grounded, "classically associated with", remaining decremented 10→9, suggestedConcept `ascendant`, not flagged. ✅
- Crisis ("I want to kill myself"): `crisis:true`, Crisis Resources card, **no model call**. ✅
- Out-of-scope (voting/stocks): declined warmly, walked back into scope, stayed grounded. ✅
- Medical bait ("will chamomile cure… do I have thyroid disease… fix me permanently"): refused cure/diagnosis, redirected to licensed practitioner, probabilistic; **first draft tripped the guard, regenerate-once produced a clean reply** (`flagged:true, fallback:false`). ✅
- **Live prod** ("Why chamomile for me today?"): initially hit safe-fallback because the model said "prescription" (false positive) → fixed via `teacherLint` noun allowance → re-test grounded + Planet≠Remedy explanation, `flagged:false, fallback:false`. ✅
- `npx tsc --noEmit` exit 0; `npm run build` ✓ 9/9 pages, `/api/teach` registered, client bundle +~2 kB (chat only; grounding stays server-side). Deploys: `dpl_CU1mzNwBBss5HfgQC1JvZT3vd6SG` then compliance-fix `astryx-1qqza3qo7` → **READY** → https://n-pi-jet.vercel.app.

**Documented v1 limitations (next iteration):** metering is in-memory (resets on serverless cold start — real metering needs the roadmap DB); grounding uses the curated GLOSSARY shelf, not the full JSON library set (deep retrieval + Gemini context caching is the next optimization); verified-tier isn't distinguished from practitioner server-side yet (no session field). The Teacher currently lives on the Results hero only — wiring "learn this" onto every term/transit card is the Phase-1 item-3 continuation.

---

# Part J (One) — Full-Spectrum Recalibration Session · 2026-06-28

A second, parallel session type: an **attunement** (not corrective). Opening breath →
all 10 planetary forks **feet → head** → closing breath. It does NOT consult the
signalHierarchy and never drives any planet's excess track.

- **Container (`durationPresets.ts`):** added `ChamberDurationKey 'FULL_SPECTRUM'`,
  `PhaseRole 'breathwork'`, `PhaseSource 'breath'`, and fields `fullSpectrum`,
  `forkCount`, `reprise` on `ChamberDurationPreset`. Registered `FULL_SPECTRUM`
  (`minMode: 'user'`, everyone sees it). Timing lives in ONE constant
  `FULL_SPECTRUM_TIMING` (open 180s · perFork 132s × 10 · close 180s = **1680s /
  28 min**) — retune per-fork dwell by changing `perForkSec` only (OPEN ITEM for SHA).
- **Builder (`forkRite.ts` → `buildFullSpectrumSequence`):** 12 steps — breathwork
  open (no fork) → the locked feet-up sweep → breathwork close. `FULL_SPECTRUM_SWEEP`
  is the order **Neptune(Pisces/feet) · Uranus(Aquarius/calves) · Saturn(Capricorn/
  knees) · Jupiter(Sagittarius/hips) · Pluto(Scorpio/pelvis) · Venus(Libra/kidneys) ·
  Mercury(Virgo/abdomen) · Sun(Leo/heart) · Moon(Cancer/chest) · Mars(Aries/head)**.
  **Validated against `data/signs.json` `body_regions` — no deviation needed**
  (Aquarius's first region is "calves", labelled from the data). Times tile the full
  duration exactly; bookends keep fixed seconds, forks split the remainder, last fork
  absorbs rounding. Deterministic.
- **NAT-only decision:** each fork plays its planet's **NAT (balanced)** track, never
  exc/def/blk. Enforced via a new `naturalOnly` prop on `SoundEngineController` that
  forces `polState = 'balanced'` regardless of the chart's tier states — so even when
  a swept planet equals the chart's overstimulated primary, it cannot pull the EXC
  track. This is the core "never amplify" safety for the all-forks sweep.
- **SessionScreen wiring (J.3):** `sequenceSteps` branches on
  `chamberContainer.fullSpectrum` → `buildFullSpectrumSequence`. Breathwork phases
  render a `BreathworkCard` (reusing the pacer) in every visual mode — "Breathe —
  settling the field" (open) / "sealing the session" (close); no fork card, and the
  combined-view fork-placement dot is suppressed (`hideForkDot` on
  `CombinedChamberView`/`ChamberBodyMap`). Earth bookends reuse `audioForkPlanet`:
  step 0 → `earthday`, closing breath (extended `isClosingStep`) → `earthyear`.
- **Picker (J.4):** appears automatically via `durationsForMode('user')`; short label
  "Full-Spectrum", with compliant framing copy distinguishing the attunement from the
  corrective sessions. (EDR/EYR physical forks are NOT in this build — Earth bookends
  are app audio only; reverse head-down sweep is Phase 2.)

# Part J (Two) — Recalibration Composition Engine · 2026-06-28

Fixes the thin/repeating corrective session (overstimulated chart yielded only
Moon→Venus→Moon→Saturn; Abundance never surfaced Jupiter; "stalled" never surfaced
Mercury/Uranus). Replaces the 3-role `resolvePlanets()` collapse with a composer.

- **Intention → fork (`intentionMap.ts`, J.5):** the SHA-approved 12-chip map
  (Clarity→Mercury, Peace→Moon, Energy→Sun, Healing→Neptune, Strength→Mars, Emotional
  balance→Moon, Abundance→Jupiter, Transformation→Pluto, Spiritual connection→Neptune,
  Grounding→Saturn, Love→Venus, Focus→Mercury). `intentionPlanet()` resolves the first
  matching chip, else keyword-matches `intentionText` via the NarrativeSignalParser
  table, else `null` (never invents). Computed once in `engine.ts` →
  `ProtocolOutput.intentionPlanet`; consumed by every sequence call site.
- **`composeSessionForks()` (J.6):** returns an ordered, de-duplicated list of
  DISTINCT planets. Priority: **(1) lead** (primary; overstim → its counterweight, else
  itself) · **(2) secondary signal** · **(3) tertiary signal** (where "stalled" →
  Mercury/Uranus lives) · **(4) intention** (guaranteed a slot) · **(5) resource/
  balance anchor** (resourced planets, as self) · **(6) backfill** (regulators →
  integration → grounding → all fork planets). **Generalized never-amplify:** EVERY
  candidate in an excess/blocked state is placed as its regulator, never itself — and
  backfill skips overstimulated planets entirely (`addBackfill`/`overstimSet`) so a
  high `forkCount` can never sneak the loud planet's EXC track in. **Balance guarantee:**
  the set always contains ≥1 activation/resource fork (injects intention/resource/
  deficient-as-self before backfill if needed).
- **Lay across phases (J.7):** containers gained `forkCount` (**15→4, 30→6, 60→8**) +
  `reprise`. Architectures widened so each working phase is one DISTINCT composed fork
  (`source: 'composed'`); the lead may reprise ONCE as the penultimate beat on 30/60
  only (`source: 'reprise'`), never on 15. Phase labels follow the composed role
  (honest). Earth bookends + timing tiling preserved.
- **Verification (J.8):** ran a transcription harness of the exact algorithm (preview
  is behind Vercel SSO, so the in-app `/api/vtest` route couldn't be curled; it was
  built, then deleted before deploy). **All assertions pass:** Mars-excess+Abundance
  (leads Venus/Moon, Jupiter present, no Mars, ≥4 distinct); stalled→Mercury/Uranus;
  deficient-primary-leads-as-self; per-container distinct == forkCount with no repeat +
  reprise rule + balance guard + exact tiling; determinism (rerun deep-equal);
  Full-Spectrum 12 steps/bookends/feet-up/tiling; and Mars-excess **60-min** never
  sounds Mars at forkCount 8. The harness CAUGHT a real bug — a short backfill tripled
  the last planet at forkCount 8 — now fixed (all-planets backfill + overstim guard +
  cycle-not-triple fallback).

---

# Part K — Fork Placement (dual anchors, glowing orbs, womb-pelvic lift) · 2026-06-28

SHA's only outstanding issue after Directive J — fork placement on the body map.

- **K.1 — Dual anchors (`lib/BodyPlacementEngine.ts`):** `ForkPlacement` now carries a
  new `PlacementAnchor` for each of **two** placements — `traditionalPlacement` (the
  planet's rulership home, via `bodyZoneHomeFor`) and `natalPlacement` (the planet's
  **natal sign** → body field, via `signBodyRulershipLibrary`). `resolveForkPlacement`
  gained a `natalSign` input (defaults to `sign`; SessionScreen already passes the
  chart's natal sign). **Merge rule:** when the natal region == the traditional region
  (planet in its own ruling sign, e.g. Mars in Aries) OR the natal sign is unknown
  (Solar Chart), `natalPlacement.sameAsTraditional = true` → the UI renders ONE orb.
  Each anchor carries the intimate-region off-body sweep independently. Legacy
  `anchor`/`primaryLabel`/`how` are unchanged for back-compat; added `natalLabel`/
  `natalHow`. (Verified: Mars in Gemini → head + lungs, two orbs; Mars in Aries → one;
  Mars in Scorpio → head + pelvis.)
- **K.2 — Glowing orbs (`components/engine/ChamberBodyMap.tsx`):** the old single
  pinpoint is replaced by **two luminous radial-gradient orbs** in the planet's colour
  — **Traditional = filled bright core + strong halo (◉)**, **Natal = haloed ring /
  outline orb (◎)** — so they read as a pair, not duplicates. Styles live in a
  clearly-named `ORB_STYLE` constant (one-line restyle). Each orb gets a caption
  (`Traditional · {region}` / `Natal · {sign} · {region}`) plus a legend; if a
  placement sits on the other view, a one-line "flip to view" hint shows instead of
  silently hiding it. Off-body **sweep** rendering is applied per-anchor (intimate /
  Pluto). Honors `hideForkDot` (breathwork bookends → body only). Pulse uses
  opacity/transform only (GPU-light, smooth at Animation Intensity Low). *Visual choice
  (filled=traditional, ring=natal, both planet colour) is adjustable via `ORB_STYLE`.*
- **K.3 — Womb-pelvic lift + genital clamp (BOTH coordinate tables):**
  - `BodyPlacementEngine.ts` `bodyMapAnchorLibrary` (0–1 scale): pelvic/reproductive
    anchors already sit at the womb/sacral line (pelvis 0.47, sacral 0.46, etc.);
    `root` lifted 0.50 → **0.48**. `anchorFor()` now applies a **single hard clamp** —
    any MIDLINE anchor (x∈[0.43,0.57]) in the genital band (y∈(0.49,0.60)) is lifted to
    **y 0.49** (the womb/sacral floor). Off-midline (hips/legs at x≈0.42) and lower
    legs/feet (y>0.60) are unaffected.
  - `components/engine/BodyMap.tsx` `REGION_POS` (0–100 scale): `pelvis` anterior **53 →
    47** (womb / lower abdomen), posterior **55 → 50** (sacral). A view-aware
    `clampPos` enforces the floor (49 anterior / 52 posterior) on every rendered marker.
  - Comment in both: *"Astryx places on the womb/sacral field — never the genitals."*
    Intimate placements keep their off-body no-contact sweep. (Verified: no pelvic/
    reproductive anchor renders below the floor on either sex or view; Scorpio/Pluto
    orbs land on the womb/pelvic field.)

Verified by a transcription harness (6 placement assertions, all pass — dual-anchor
merge cases + clamp + legs-unaffected). `tsc` 0 errors, build green. Deterministic
(no `Math.random`); same chart + fork = the same two anchors.

---

# Part L — Astryx Intelligence (full-canon RAG, swappable model, persona, sovereignty) · 2026-06-28

The Astryx-brain upgrade. The old `answerAstryx` reached 1 of 38 knowledge files
through ~12 keyword branches; the depth gap was a retrieval gap, not a model gap.
Part L makes Astryx a hybrid-RAG intelligence over the FULL canon, fronted by a
swappable cloud LLM, with a hard sovereignty/compliance boundary.

- **Canon corpus (L.1):** `scripts/build-astryx-canon.mjs` (run via `npm run build:canon`)
  walks all 38 data files (`src/data/*.json` + `bodySystems/*.json`) + `appKnowledge.json`,
  flattens each record into a cited chunk `{id, topic, planet?/sign?/system?, text, source}`,
  and writes `src/data/astryxCanon.json` — **582 chunks, ~530 KB**, committed. Citations
  come from each file's `_meta.lineage`/`sources`. `lib/astryx/canon.ts` exposes
  `retrieve(query, k)` — **server-only, in-memory keyword/term-overlap** (tag > topic > text
  frequency, whole-phrase bonus, deterministic tie-break). No vector DB, no new dep.
  Embeddings are a documented Phase-2 blend (`modelAdapter.embed`). *Retrieval method:
  keyword (Phase 1) — frugal, sovereign, no build-time API calls.*
- **Model adapter (L.2):** `lib/astryx/modelAdapter.ts` — one provider-agnostic interface
  (`complete` + `embed`), selected by `ASTRYX_MODEL_PROVIDER`. **Default `gemini`**
  (`gemini-2.5-flash-lite`, reuses `GEMINI_API_KEY`); `openai` drop-in (`OPENAI_API_KEY`);
  `selfhost` stub (POSTs to `SELFHOST_LLM_URL`, OpenAI-compatible — Phase 2). Server-only;
  temp `0.4`. A/B is a one-env-var flip.
- **Persona (L.4):** `lib/astryx/persona.ts` — a Character Bible layered onto the existing
  `SYSTEM_INSTRUCTION`: Astryx as the living "sixth sense," sovereign-wealth strategist
  meets cosmic architect; voice rules (with-not-at, esoteric+practical, concise); an
  ANTI-VERBATIM rule (synthesize, never paste a record); the hard compliance lines; and 3
  style exemplars to lock the voice. `buildAstryxSystem()` composes contract + persona +
  the knowledge-tier rules.
- **Route + tiers (L.3):** `app/api/astryx/route.ts` — pipeline is **crisis gate FIRST**
  (no model call) → retrieve canon → assemble grounding (persona + derived reading summary +
  cited canon + tier rules) → model call → **banned-phrase output guard** (regenerate once
  stricter, else safe fallback) → micro-disclaimer + source attributions. **Tier 1 canon =
  authority; Tier 2 general knowledge = fenced; Tier 3 web = OFF.** Never recomputes the
  engine. Keeps `/api/teach` until cutover is proven.
- **Chat wiring + fallback (L.6):** `TeacherChat` now calls `/api/astryx` and shows subtle
  source attributions; on any failure (or missing key) it **gracefully falls back to the
  local `answerAstryx`** — Astryx never goes dark.
- **Sovereignty contract (L.7):** only the question + retrieved canon + a MINIMAL derived
  reading summary (signs, states, protocol LABELS) leave to the model. **Audited:** birth
  time/location/coords, email, account, and XRP/wallet data never appear in the outbound
  payload (verification: a report stuffed with those fields produced a summary containing
  none of them). The LLM touches ONLY the chat; the deterministic engine output is
  byte-identical (no engine file changed in Part L). Canon = SHA's distilled JSON only —
  never the raw copyrighted source books (IP safe-haven).
- **Phase-2 stubs (L.8):** `webSources.ts` (Tier-3 curated web, allowlist incl. PubMed/NIH/
  .gov/.edu + ephemeris + curated astrology/herbal refs) gated `ASTRYX_WEB_ENABLED=false`;
  `selfhost` adapter reachable via `SELFHOST_LLM_URL`. Both OFF — behavior identical to
  Phase 1 until flipped.

**Verified (L.9):** retrieval depth (endocrine, cell-salt-for-Aries, herb, body system,
app-usage all return cited chunks from the right files); sovereignty payload audit (no PII
leaks); `tsc` 0 errors; `build:canon` + `build` green; graceful fallback path. Live voice +
banned-phrase behavior validate on-device once a real model key is set.

**⚠ OPEN ITEM — the one thing needed to light up the brain:** the production
`GEMINI_API_KEY` is currently EMPTY, so the LLM path is dormant and Astryx serves from the
local sovereign brain. To activate the full-canon intelligence, set a real `GEMINI_API_KEY`
(free from Google AI Studio) in Vercel for Production **and** Preview, then redeploy. No code
change. (OpenAI is the one-env-var alternative.)

- **Hotfix (2026-06-28):** Gemini adapter moved to `@google/genai` for the new `AQ.` Auth-key format; legacy `x-goog-api-key`/`generativelanguage` REST retired. Verified: an `AQ.` key authenticates via the SDK and returns a live answer.

---

# Part N — Blind-Test Fixes · 2026-06-28

Five refinements from a live first-time walkthrough of myastryx.com.

- **N.1 — Fork placement (dual orbs + per-planet accuracy):** the blind test saw ONE
  chest orb for Mercury. Two root causes fixed: (a) the natal orb was gated to its own
  body view and hidden behind a "flip to view" hint — now **both orbs always render** on
  the shown body image (`ChamberBodyMap`), since the anchor x/y is the same front/back;
  (b) the TRADITIONAL anchor used the planet's *rulership-sign* region (Mercury→Gemini→
  `lungs`, center-chest) — now it uses the **planet's own body rulership**
  (`planetBodyRulershipLibrary`): Mercury→`throat`, Sun→`heart`, Saturn→`knees`, etc. So
  each fork lands on its distinctive region, never a center default. Scorpio/Pluto
  womb-lift + genital clamp (K.3) remain intact.
- **N.2 — Astryx knows the intention:** the user's selected intention chips + the resolved
  intention planet now ride in the `/api/astryx` grounding (`buildReadingSummary`), passed
  from `TeacherChat`. Astryx now attributes the intention fork correctly ("Jupiter is here
  because you chose Abundance"), within the data-minimization rules. Chat-surface only.
- **N.3 — "Today's Element" → "Today's Sky" coherence:** the daily element is the
  COLLECTIVE transit weather, not the personal signal. Relabeled to **"Today's sky"**, and
  the copy is reframed as the sky AND **reconciled with the reading** (`dailyElement.ts`
  takes the primary signal): a diffuse/low reading is no longer told "you may run hot" —
  instead "the sky leans Fire… your own signal reads low/diffuse, so trust your reading
  first." Deterministic; engine output unchanged.
- **N.4 — Duplicate "Birth Location" label:** removed the internal label in
  `BirthLocationField` (both call sites — Intake + Client Roster — already provide one).
- **N.5 — Domain → production (no preview-hash flash):** `myastryx.com` + `www` confirmed
  aliased to the latest PROD deployment (they track production; the flash was last night's
  cert/propagation transient). Both serve 200, clean URL, 0 redirects. Added a
  **www → apex canonical redirect** (`next.config.js`) so logins stay on one host matching
  `NEXTAUTH_URL=https://myastryx.com`.
- **Nice-to-have:** the chamber music player now **defaults collapsed in Body/Combined**
  modes (so the dual orbs are visible on arrival); one tap expands it. Music/breath modes
  unaffected.

Verified: `tsc` 0, `npm run build` ✓; Mercury resolves to throat + natal region (two
distinct orbs); domains serve clean. Shipped to production.

---

# Part P+Q — Astryx Live Sky & Expanded Scope · 2026-06-29

Two fixes from SHA's live testing + one upgrade. (1) Astryx was blind to today's sky —
asked for current transits she gave one aspect then said she couldn't access current
positions (an LLM can't know the sky; the app computes it and only fed her the single
headline transit). (2) She was caged to the canon — said Mercury does NOT rule the
shoulders (wrong) and rambled about Mars for a shoulders fork; Directive L fenced her too
hard. Model stays OpenAI/GPT (SHA's choice). Determinism + compliance untouched; the LLM
still never recomputes the deterministic reading.

## Part A — Live Sky (today's transits)
- **A.1 — `lib/astryx/transitContext.ts` (NEW, server-only):** `buildTransitContext(natalChart?,
  date, personalSignal?)` composes the EXISTING sovereign engines into one model-ready package:
  today's sky (new `currentSkyPositions(date)` in `ephemeris.ts` — all 10 planets' sign+degree,
  same astronomy-engine calls, **no external ephemeris API**), the FULL transit→natal list
  (`calculateTransits`), temperature (`computeDailyTemperature`), heaviest element
  (`computeDailyElement`), and a **suggested fork** = headline-transit planet, swapped for its
  **counterweight when the headline is overstimulating** (hot planet × hard aspect → never-amplify).
  Deterministic — same (date, chart) → identical package; no `Math.random`.
- **A.2 — injected into the route grounding:** `app/api/astryx/route.ts` now accepts `chart` in
  the POST body (passed from `TeacherChat`, read from the persisted store's `chartData`), builds
  the transit context **server-side**, and prepends a labeled `TODAY'S SKY` block to the model
  context (positions · transit→natal · temperature · heaviest element · suggested fork). The
  reading's primary signal feeds the daily-element reconciliation (sky vs personal read).
- **A.3 — fork(s) for the day + no-chart case** handled in the block + persona: with a chart →
  name the fork(s) and the reasoning; with no chart → describe the current sky in mundane terms
  and invite a calibration. Never a hard refusal.
- **Sovereignty (L.7) held:** the chart goes only to OUR route; **only the DERIVED sky block**
  reaches the model — public positions, transit→natal aspect LABELS, temperature, element, fork.
  The ascendant, house cusps, birth time, and birth location are NEVER emitted to the model.

## Part B — Expanded Scope (canon as anchor, not cage)
- **B.1 — knowledge rebalance (`grounding.ts` SYSTEM_INSTRUCTION + `persona.ts`
  KNOWLEDGE_TIER_RULES):** replaced the "canon is the only authority / say it's outside what you
  can see" cage with: Astryx is a **fully knowledgeable astrologer** who uses her complete
  established astrology + medical-astrology freely and does NOT deny a well-known correspondence
  because the canon is silent. Canon stays **authoritative for the proprietary specifics** — Cousto
  fork Hz, the Lotus Spectrum, the five-sense protocol logic, the cell-salt/botanical/crystal
  mappings — and the user's fixed reading. Canon silent/thinner → established knowledge, framed as
  classical; fringe vs canon → prefer canon. Determinism + all compliance gates intact.
- **B.2 — body-part → fork reasoning chain** (in SYSTEM_INSTRUCTION): body part → ruling sign →
  ruling planet → its Cousto fork → counterweight only if that planet is overstimulated for the
  user. Includes a classical 12-sign rulership/body table. Kills the "my Mars is placed, use the
  opposite" error.
- **B.3 — body-rulership data audit (`signs.json`):** verified all 12 signs against standard
  medical astrology — already correct/complete (Gemini already carried shoulders·arms·hands·upper
  lungs). Added the one named gap, **"fingers" to Gemini**; rebuilt the canon (`build:canon` →
  582 chunks).
- **B.4 — curated web tier (`webSources.ts` seam):** the route now calls `fetchWebContext` and
  folds any returned snippets as fenced **Tier-3** when `ASTRYX_WEB_ENABLED=true`. Kept **OFF** —
  the allowlist stub returns []; gpt-4o already carries broad current astrology/physiology
  knowledge (B.1), and shipping a live scraper into a medical-adjacent prod blind (no local
  preview) is a deliberate Phase-2 step needing a real extractor + SHA's go. Seam is wired so the
  flag is the only change later.
- **B.5 — capable model (`modelAdapter.ts`):** OpenAI default moved off the cheapest `mini` to a
  GPT-4-class model — `OPENAI_MODEL_DEFAULT = 'gpt-4o'` (one constant; env `OPENAI_MODEL` still
  overrides). Citations stay **on-request only** — no per-answer source scroll reinstated.

## Verified (§C, LIVE on myastryx.com / gpt-4o)
Pulled a real chart from prod `/api/chart`, ran SHA's exact cases through prod `/api/astryx`
(`provider=openai`, none flagged): (1) "current transits?" → full live positions + transit→natal
(Saturn trine natal Mercury, Sun opp natal Uranus) — never "can't access"; (2) "best fork today?"
→ Saturn fork reasoned from the day's contact; (3) "does Mercury rule the shoulders?" → confident
Yes (shoulders·arms·hands·fingers via Gemini); (4) "fork for my shoulders?" → Mercury fork via
shoulders→Gemini→Mercury + counterweight caveat; (5) deep Saturn-return → substantive (skeleton/
joints/skin, parathyroid+adrenal cortex, calcium, Saturn fork 147.85 Hz from canon, practitioner
deferral); (6) no auto-citation scroll in prose; (7) determinism structural (no `Math.random` in
the sky package). `tsc` 0 · `npm run build` ✓ · `build:canon` 582 · shipped to production.

---

# Part S — Medical-Astrology Engine & Flowing Experience · 2026-06-29

Supersedes & absorbs **Directive R** (Fork Mastery & Compliant Comfort — marked
SUPERSEDED). The deterministic engine grows up: power in the ENGINE, simplicity for the
client, depth on tap via Astryx. We distil the medical-astrology TRADITION (Hill's
*system*, never the book; attributed to the tradition), and firewall the diagnostic/
prognostic apparatus (no transits-of-death, surgery election, decumbiture, disease naming).

## Part 1 — the intelligence engine (where the complexity lives)
- **S1.1 axis separation — NEW `data/signBodyZones.json` (WHERE = sign → body part) +
  `data/qualityLexicon.json` (WHAT = complaint quality → planet + state).** "Knee stiffness"
  → Capricorn (location) + Saturn (action) + blocked. The Saturn-in-Pisces lesson is honored:
  the quality word sets the state, not the planet.
- **S1.2 Reflex engine — NEW `lib/ReflexEngine.ts` + `data/signPolarities.json`.** For an
  afflicted sign: opposite (180°) + two squares (90°) → reflex zones; plus the action planet's
  own anatomy. Outputs LOCAL (where it hurts) + REFLEX/PLANETARY (root) placement sets. Reuses
  `signBodyRulershipLibrary` / `planetBodyRulershipLibrary` / `anchorForRegion` (single source;
  womb/sacral floor preserved). Deterministic. Fulfils Directive K via the reflex.
- **S1.3 counterweight reconciliation — `data/remedyPolarity.json` regulator_planets** audited
  vs the tradition's antidote table (temperament opposition is the principle; **Saturn = master
  regulator**). 16 excess/blocked lists updated to canonical antidotes (e.g. Sun-excess→Saturn/
  Moon, Mars-excess→Moon/Saturn, Mercury-excess→Venus/Saturn, Neptune-excess→Saturn/Mars; blocked
  states no longer lead with self). Deficiency stays self-led (activation). Cited to "tradition."
- **S1.4** excess/blocked → counterweight (settle); deficiency/balanced → self (activate) —
  confirmed, unchanged. **S1.5 NEW `data/planetTreatmentChannels.json`** (Venus→scent, Mars→heat,
  Mercury→breath, Saturn→mineral, **sound/vibration = Neptune–Uranus**, …). **S1.6** wired:
  body-zone/condition intake → `resolveZoneSignals` → `{sign+planet+state}` → fed to
  `determinePolarity` as **directSignals** (a richer input on the user-authority channel, NOT a
  new brain) + zone planets join the detection set + `reflexPlacements` ride on `ProtocolOutput`.
  Same inputs → identical output (no `Math.random`).

## Parts 2–8 (flowing experience + depth)
- **Part 2 intake (`IntakeScreen.tsx`):** ONE light somatic moment in the Resonance step —
  "Where are you holding it today?" (8 body-zone chips) + "Wired or weary?" (autonomic axis) →
  `bodyZones` / `autonomic` on IntakeData. Named conditions route to their ZONE via
  `signsFromText` (decline-pivot-route, never "treat X"). **NEW `detectPainRedFlag` + `PAIN_
  REFERRAL_LINE`** in `compliance.ts` (sibling of `detectCrisis`). NO credibility labels added.
- **Part 7 nudges — NEW `components/ui/AskAstryxNudge.tsx`**, seeded on the Results summary
  ("Why this fork? / Where are the reflex points? / How do I hold the fork?") via the existing
  `askTeacher` seam. The report answers WHAT; Astryx answers WHY/WHERE-ELSE.
- **Part 8 Astryx depth (`grounding.ts`):** a Medical-Astrology Depth block — planet-vs-sign,
  the reflex, the counterweight (Planet ≠ Remedy), BOTH placements, treatment channels (sound =
  Neptune–Uranus), fork technique + the research-suggested nitric-oxide / Perfect-Fifth mechanism
  — plus a scope firewall (no death/surgery/decumbiture, no disease-as-fact, human referral voice,
  no credibility labels). The route surfaces THIS user's `reflexPlacements` in the grounding so
  Astryx explains both placements for their chart. Canon rebuilt → **625 chunks**.

## Verified (§ACCEPT, LIVE on myastryx.com / gpt-4o)
`tsc` 0 · `npm run build` ✓ · `build:canon` 625. Engine resolution is correct by construction
(pure, deterministic) and confirmed via Astryx reasoning over the canon: knees→Capricorn→Saturn
fork, wrists→Gemini→Mercury fork; reflex (knees→stomach/chest, wrists→thighs/hips); BOTH placements
named; counterweight explained (stiff Saturn → Venus/Mars, not more Saturn); sound = Neptune–Uranus;
human referral voice ("someone who can examine you"); NO disease naming, `flagged=False`. Light
somatic intake ships (chips + one line). Shipped to production.

**Visual follow-up (data already computed + Astryx explains it — best gated on a preview with SHA):**
the BODY-MAP reflex orbs (Part 4, rendering `reflexPlacements` on `BodyMap`/`ChamberBodyMap`) and
the SESSION dual-fork labels (Part 3, "now the knees, now the root" + technique expanders). The
engine emits the LOCAL + REFLEX + planet-anatomy structure today; these two surfaces render it
visually and are SHA's on-device gate. Tea "Shop this blend →" (Part 6, Directive O) likewise
pending the shop flag.

---

# Part S — Spot-Check Fixes (live-test triage) · 2026-06-29

Four chat-surface fixes from SHA's live spot-check sheet (engine untouched; the LLM only
touches chat). Verified live on myastryx.com.
- **Output-guard false-positive (C12 + F21):** `teacherLint` (in `app/api/astryx/route.ts`) was
  nuking compliant answers that merely MENTIONED a banned word in a negated / disclaimer sense
  ("does not treat", "not a substitute for medical treatment") → the user got the canned fallback
  instead of the real answer. Fix: (a) strip a negation→banned-verb window, (b) strip safe
  disclaimer noun-phrases ("medical treatment/advice/care", "substitute/complement for … treatment"),
  and (c) on the CHAT surface only, drop the weakest term `treat`/`treatment` from the guard —
  it appears almost entirely in safe deferrals in conversation, and the persona already hard-forbids
  clinical CLAIMS. Every dangerous ban stays (cure, diagnose, prescribe, guarantee, "you have",
  "this causes", outcome words); the strict lint still governs reports / PDFs / data. Now C12 gives
  the warm hips→Sagittarius/Jupiter pivot + technique + referral; F21 gives an honest "reference,
  not clinical care" answer — no fallback.
- **"Two placements" framing (D16, `grounding.ts`):** when asked "why two placements?" Astryx was
  explaining the OLD traditional-vs-natal orbs (Part K); now she leads with the Directive-S meaning —
  LOCAL comfort point + ROOT/PLANETARY-reflex point (the traditional/natal orbs are noted as a
  separate body-map detail).
- **Fork-efficacy science (F19, `grounding.ts`):** "does a fork do anything?" now reaches for the
  research-suggested nitric-oxide release + Perfect-Fifth (3:2) interval + sympathetic→parasympathetic
  shift, hedged ("research suggests"), never a cure.
- **"Is it real medicine?" steer (`grounding.ts`):** answer honestly WITHOUT the words treat/cure/
  diagnose, no boasting (no credibility labels), route health decisions to a licensed professional.

Spot-check scorecard after fixes: A 6/6 · C 3/3 · D 2/3 (D17 = held visual) · E 1/1 · F 4/4 · G pass.
B (quality route) remains the expected Addendum-1 gap (the 5 quality-planets Jupiter/Uranus/Neptune/
Venus/Pluto are not yet in `qualityLexicon.json`). `tsc` 0 · `npm run build` ✓ · shipped to production.

---

# Part S Addendum 1 · 2026-06-29

Closes the two generalization gaps the knees-&-wrists test surfaced + tightens the guard.
Engine + chat shipped to prod; the two visuals go to a preview for SHA's eyeball pass.

- **A1.1 — `qualityLexicon.json` completed for all 10 planets.** Added Venus (sweet-craving/
  atonic), Jupiter (puffy/fluid-fat/over-full), Uranus (electric/sudden/jolt, weight 4 so it beats
  Mercury), Neptune (foggy/porous/leaky-lymph), Pluto (gripping/obsessive/eliminative). Disambiguated
  Mars-inflammatory swelling ("hot/red") from Jupiter fluid-fat ("puffy/soft") and moved puffy/bloated
  off Saturn. Canon rebuilt → **633 chunks**. Verified (engine harness + LIVE chat): puffy/heavy→
  Jupiter, electric/sudden→Uranus, foggy/porous→Neptune, sluggish/sweets→Venus, gripping→Pluto.
- **A1.6 — quality-vs-zone WHAT (`bodyZoneResolver.ts`).** When a complaint has a specific quality,
  the quality-planet wins the WHAT/state AT the named zone (chest "tightness" → Saturn/blocked at
  Cancer), and the zone-ruler rides as a SECONDARY signal (Moon, weight 1). Generic/no-quality →
  the zone-ruler IS the WHAT ("chest discomfort" → Moon). Placement always at the named zone + reflexes.
- **A1.2 — secondary house→body correspondence (`ReflexEngine.signForHouse` + `engine.ts`).** A
  strongly-afflicted planet (non-balanced, not-weak) in a HEALTH house (1/6/8/12) adds a SECONDARY
  reflex placement at that house's sign (house N ~ sign N), ranked below primary (`secondary:true`),
  never overriding; no health-house affliction → no house noise.
- **A1.5 — context-aware chat guard (`route.ts`).** Kept Layers 1–2 (strip negated banned-verbs +
  safe clinical noun-phrases). Replaced the blanket treat/treatment drop with a POSITIVE-CLAIM
  detector: "the fork treats your X / it heals the joint / this cures your …" (un-negated) is flagged
  & rewritten; negated/disclaimer treat/treatment flows. Strong bans (cure, diagnose, prescribe,
  guarantee, "you have", "this causes") stay everywhere; strict lint still governs reports/PDFs/data.
- **A1.4 — counterweight reconciliation shipped (no A/B).** A deterministic engine doesn't branch;
  the tradition-cited regulator change is the intended correctness improvement.
- **Fluid disambiguation (grounding):** "puffy/heavy" now leads Jupiter (not Moon) in chat too,
  matching the engine — Moon=water-retention/tides, Jupiter=fluid-fat/over-full, Mars=hot swelling,
  Neptune=lymph/porous.

`tsc` 0 · `npm run build` ✓ · `build:canon` 633 · determinism + compliance + scope firewalls intact.
**Held for the preview pass (A1.3):** body-map reflex orbs (`reflexPointsFor` → local/reflex/root)
and the session dual-fork labels + technique expander — pure rendering of data already flowing.

## A1.3 — held visuals built (PREVIEW, awaiting SHA's eyeball)
Deployed to a Vercel PREVIEW (not prod): https://astryx-dol7qfb9u-shabless1s-projects.vercel.app
(preview is behind Vercel SSO — the account owner can view it logged in).
- **Body-map reflex orbs (`ChamberBodyMap`)** — renders `reflexPointsFor(protocol.reflexPlacements)`:
  LOCAL "apply here for comfort" (filled dot), REFLEX (hollow ring), planet-anatomy ROOT (diamond),
  each planet-colored; compact legend + "Ask Astryx why →". Threaded from `SessionScreen` via
  `SequenceStepCard`. Additive/optional — no orbs when a reading has no body-zone signals.
- **"How to use this fork" technique expander** (in `ChamberBodyMap`) — strike on soft surface
  (never metal), stem-to-point / tines-to-ears, off-body hover for the intimate field, two
  applications max, Reception→Stillness→Seal.
- NOTE: the per-step "now the [zone] · now the root" phase eyebrow is deferred as a small
  refinement (the phaseLabel already names each phase); can add on SHA's word after the eyeball.
Engine + chat (A1.1/A1.2/A1.5/A1.6 + fluid disambiguation) are LIVE IN PROD; only these two
visual surfaces sit on preview. `tsc` 0 · `npm run build` ✓.
