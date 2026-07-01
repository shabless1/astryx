# ASTRYX — Session Handoff (for the next Claude Code)
**Date:** 2026-06-08 · **Live app:** https://n-pi-jet.vercel.app · **Project:** `astryx_v14/`

Read this FIRST, then: `ASTRYX_MASTER_BUILD_DIRECTIVE.md` → `ASTRYX_SIXTH_SENSE_BLUEPRINT.md` → `FIXES_COMPLETE_v3.md` → `COMPLIANCE.md` → `CLAUDE.md`. Your `MEMORY.md` index auto-loads each session; the three Astryx-relevant memory files are `symptom-vocabulary-bridge.md`, `suno-audio-r2-pipeline.md`, and `teacher-sixth-sense.md` (read the last before touching the Teacher).

---

## TWO LAWS (override everything)
1. **Engine stays deterministic; the Teacher (Phase 2) never merges with it.** Same birth data + same symptoms = same output, forever. No `Math.random` in chart/protocol/sound/color selection. The Teacher only *reads* engine output.
2. **No medical claims, ever.** Probabilistic framing only; honor `COMPLIANCE.md` (banned phrases, persistent disclaimer, crisis-keyword detection) on every surface.

---

## ENVIRONMENT FACTS / GOTCHAS (learned this session — save yourself the pain)
- **No git repo.** Deploys go straight from the folder via `vercel --prod --yes` (authenticated as `shabless1`). You CANNOT `git commit`/`git checkout`. Document results in `FIXES_COMPLETE_v3.md` instead.
- **Windows PowerShell. Python is NOT installed** (the `python` command is a Microsoft Store stub that errors). Use **Node** for any scripting. SHA cannot run `.py` scripts.
- **OneDrive path with spaces.** After `npm run build`, you must `rm -rf .next` before `npm run dev` or dev crashes (`EINVAL readlink` on `.next`). Always `rm -rf .next` between build and dev.
- **Deploy:** `vercel --prod --yes`. **Set env var:** `printf '%s' "VALUE" | vercel env add NAME production`.
- **Preview MCP cannot start a server here.** `preview_start` fails ("filename, directory name, or volume label syntax is incorrect") from this spaced OneDrive path, with both `npm.cmd` and `npm` as the executable. **Workaround:** start the dev server with the **Bash tool** (`npm run dev` backgrounded, `... > /tmp/astryx-dev.log 2>&1 &`), wait for "Ready", then `curl` routes. This is how the Teacher was verified — reliable.
- **Browser automation is FLAKY.** The live site's heavy background animation freezes the CDP channel (`Runtime.evaluate timed out`). Localhost dev mostly works but also froze near session end. **For engine / route verification, prefer curling a route** (or a temp API route that calls `runEngine` with a fetch shim) — far more reliable than driving the UI:
  ```ts
  // src/app/api/vtest/route.ts (TEMP — delete after)
  const origFetch = global.fetch
  ;(global as any).fetch = (u:any,o:any)=> origFetch(typeof u==='string'&&u.startsWith('/')?`http://localhost:3000${u}`:u,o)
  const protocol = await runEngine(body.intake, body.coords); global.fetch = origFetch
  ```
  Then `curl -X POST localhost:3000/api/vtest -d '{"intake":{...},"coords":{...}}'` and inspect JSON. Delete the route when done.
- **TypeScript gate:** `npx tsc --noEmit` must exit 0 before any deploy. `sunoLibrary.ts` is CLEAN in this repo (its catalog was regenerated today) — ignore any old "corruption" warnings; they were about a stale Cowork copy.

---

## WHAT IS LIVE & DEPLOYED (https://n-pi-jet.vercel.app)
**Directive I — Intake Balance, Chamber-Only Player & Music Library (2026-06-15, `astryx-69fhg9hzp`):**
- **I.1** Resonance-Scan planet cards now capture a **balanced/strong** signal (`resourcedPlanets`), mutually exclusive with imbalance taps. The polarity engine forces resourced planets to `balanced` (resource, never deficit) and **prefers them as the regulator** ("borrow from strength") — deterministic; verified Venus-resourced reorders Mars's regulator to `[Venus,Moon]`.
- **I.2** ALL audio removed from Results (transit/hero/prescription previews gone). Transit cards = info + a "strike your {planet} fork ~5 min" suggestion. **Audio lives only in the chamber** (SHA's call: strictly chamber-only).
- **I.3** Enter Chamber gated to the END of the report (hero/modal CTAs scroll to `#chamber-entry`). `SoundEngineController` now has full transport: play/pause · volume/mute · ◄◄/►► version cycling · ↺ replay · seek scrubber (elapsed/total). `sunoPlayer` gained seek/time/loop/ended/url APIs.
- **I.4** Catalog is **manifest-driven**: app fetches `{AUDIO_BASE}/catalog.json` at runtime and merges over the seed → monthly additions need NO redeploy. Generator: `scripts/generate-catalog-manifest.mjs`. ⚠️ **SHA must upload `catalog.json` to the R2 bucket** for it to activate (seed catalog is the pool until then).
- **I.5** New **Music** nav tab → `MusicLibraryScreen`: Browse (full bucket, every version), Favorites, and **Build-your-own-chamber** sequences. `favorites` + `customSequences` persisted.
- ⚠️ **By ear/eye (SHA):** transport on real tracks, version-switching, Music Library playback, no-audio-on-Results. Engine (I.1) + build verified here.

**Master Build Directive v2 (2026-06-08 → 06-09):**
- **Part A (P0)** — symptom-driven polarity state. The user's symptom `state_signal` is now the SOLE authority for the polarity state; chart structure only adjusts confidence / breaks symptom-ties. **The universal "running hot" bug is dead.** (`RemedyPolarityEngine.ts`.)
- **Part B (P0)** — corrective Cosmic Diagnostic. The first card's action line is rewritten from the same `CorrectiveProtocol` as the prescription/chamber when a correction applies — Neptune-excess no longer shows Blue Lotus or the 211.44 Neptune fork. (`engine.ts` `correctiveDiagnosisAction`.)
- **Part C (P1)** — audio honesty. Each transit plays ITS OWN planet+state track (or that planet's tone, labelled tone-only) via isolated `lib/transitAudio.ts` + a "▶ Play this transit" control in the transit modal — never the dominant. Fork instructions now map only to the 10 owned planetary forks; Earth/Platonic tones are app-played + fork-paired (`APP_PLAYED_TONES` in `utils.ts`; fixes in `SessionScreen` close step + `PractitionerScreen`). **Rule 8 honored — `soundEngine.ts` untouched.**
- **Part D (P1)** — the guide is now **Astryx** (named living intelligence), not "the Teacher". Identity line + all user-facing copy renamed; contract/compliance unchanged; code paths/filenames kept.
- **Part E (P2)** — medical-astrology IA spine. Nav reorganized + tier-gated: **Chart** + **Body Grid** surfaced for users (new `ChartScreen`/`BodyGridScreen`); **Body Systems** + **Clients** gated to Practitioner (`isPremium`, with `TierGate` fallback); body-system header reads `SYSTEM · SIGN · PLANET`. (`NavBar.tsx`, `page.tsx`, `BodySystemPreviewScreen.tsx`.)
- **B.1 (coherence fix, Pressure Test #3)** — ONE `signalHierarchy {primary, secondary, tertiary}` built in `runEngine`; every text surface AND the chamber + Suno audio read it. **The Mars/Sun subject flip is dead**; the diagnostic body is state-aware (no excess archetype on a deficiency). Suno journey cross-fades primary→root→aggravator→**back to primary** (resolve-on-primary). `signalHierarchy` on `ProtocolOutput`; `ChamberDNA` carries 3 tiers; `SignalStack` tier-gated display.
- **F & G + B.1 cleanup (v2 complete)** — Symptom-routing actions unified onto the primary's regulator; `reportedPlanet` bridge ("you reported Mars → traces to Sun root"). **Part F:** `EnvironmentLayer` (corrective element from the regulator → setting/posture/tempo; never amplify by construction). **Part G:** `PrepareRite` card (brew tea / ready primary fork / set your space + inline substitution; invitation not checklist). (`engine.ts`, `ResultsScreen.tsx`, `grounding.ts`, `types/index.ts`.)
- **Part H — THE SESSION PROTOCOL (the Chamber, rebuilt)** — the rite itself. **H.0:** mix inverted (Suno music = foreground via `SUNO_LEVEL 1.0`; synthesis = underlayer via `SYNTH_UNDERLAYER_LEVEL 0.45` on the slider + master 0.30); sound moves with the rite (new isolated `lib/forkTone.ts` — each fork's Hz rises under the music; Suno tier journey + Tone phases share the same duration); **planet-true language** (`feltStateLanguage` — Mercury-excess "running fast → settle", never "hot → cool"); **life-event landmarks** (`detectLifeEvent`: Saturn/Jupiter Returns + Saturn→Sun/Moon, +100 weight, amber banner; whole transit card opens its protocol; Nodal/Chiron TODO — not in chart engine). **H.1:** `lib/chamber/forkRite.ts` — deterministic timeline: grounding open → supporting passes → MAIN 3 (signalHierarchy, primary LAST, 3× holds) → close on app-played Earth Om + primary fork; carried auto-advance with strike cues, linger/resume; application keys to the owned set (`forkSetType` in store: unweighted aluminum = field, weighted steel = on-body). **H.2:** Individual = condensed rite ('Rite' 15-min preset, now DEFAULT) with a supporting sweep; Practitioner = full 10-fork service ('Service' 60-min preset) + pacing (pause/+60s/skip) + printable protocol sheet. (`SessionScreen.tsx` rebuilt.)
- **H.3 — MUSIC-ONLY CHAMBER (SHA's call, supersedes the H.0.1 mix + fork-tone work):** ALL synthesized tones removed — the planetary frequency is already in the music's keys/notes and the tones clashed. `SoundEngineController` v3.0 never starts Tone.js (soundEngine.ts intact, unused by the chamber); the rite cross-fades each fork step to THAT planet's Suno track (`sunoPlayer.crossFadeTo`; state track for main 3, NAT otherwise); all previews play Suno tracks; `forkTone.ts` deleted; visual breathes on a deterministic pulse. **Volumes music-forward** (PHASE_VOLUME 0.85–1.0, default 0.9 — SHA flagged "music very low"; don't lower). **DO NOT re-add a tone layer to the chamber.**
- ⏳ **Follow-ups:** Nodal/Chiron Returns need the chart engine to expose nodes/Chiron. The deferred Tone counter-Hz swap is now MOOT (no synthesis in the chamber). **SHA to confirm by ear:** music level + per-fork track shifts in a live session.
- 🖼️ **Flagged (needs SHA assets):** a **360° rotatable Body Grid** — needs a turntable image sequence (24–36 frames) or a Three.js Phase-3 upgrade. Tracked as a spawned task; current Body Grid is the flat front-view SVG.

**Earlier this cycle (2026-06-08):**
- **Phase 0 trust fixes** — historical-timezone Ascendant correctness, regulator-in-prescription, ONEIROGENS gate, single sound-frequency source.
- **Phase 1 hero** — "Your Calibration Today" action-first hero + felt-state headline at the top of Results; honest "TOP 5 OF {n}" transit count.
- **Phase 2 — Astryx (the sixth sense)** — `POST /api/teach` (`gemini-2.5-flash-lite`), `TeacherChat` bottom sheet, "learn this" hero tag + "Sixth sense · Mind" card. Server-only / IP-contained, compliance-gated, engine untouched.

**From prior sessions (still live, all verified):**
- **Polarity intelligence — Planet ≠ Remedy across all 10 planets.** Symptom-vocabulary bridge (`normalizeSymptoms`/`INTAKE_TAG_TO_SLUGS` in `engine.ts`), symptom-driven dominant-planet detection (`ephemeris.ts`: `symptomBonus` + `leadPlanet` swap + rebalanced `PLANET_WEIGHTS` 7/8), the symptom gate in `RemedyPolarityEngine.ts` (no symptoms → state forced `balanced` → no correction; `symptomDriven` flag), and `dominantPolarity = polarityResults[0]` in `runEngine`. **Do not regress these.**
- **Music engine de-harshed** (`soundEngine.ts` — lush reverb, gentle comp, headroom, mix rebalanced). **Rule 8: don't touch `soundEngine.ts` for the Suno layer.**
- **Dual-layer audio LIVE.** Suno MP3s on **Cloudflare R2** public URL `https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev`, 172 tracks at `{planet}/{state}/{STEM}.mp3`. `CATALOG` in `sunoLibrary.ts` mirrors the bucket EXACTLY (regenerate from bucket if tracks change — see `suno-audio-r2-pipeline.md`). `sunoPlayer.ts` has `crossOrigin` removed (so no R2 CORS needed). `NEXT_PUBLIC_AUDIO_BASE_URL` is set in Vercel Production.
- **Session visual + Transit modal are polarity-aware** (corrective palette / corrective transit protocol).
- **R2 note:** bucket `astryx-audio`, account `27af31945ab36c999d34092b65edf60c`. SHA **deleted the R2 API token** (security). To modify R2 objects again, SHA must mint a NEW token (Object Read & Write). The public URL works WITHOUT any token.

---

## PHASE 0 (trust fixes) — ✅ DEPLOYED 2026-06-08
SHA approved the deploy. `npx tsc --noEmit` exit 0 → `vercel --prod --yes` → **READY** (`dpl_4ci71viqVw2SNEEkJuZkSBDTKPqy`) → live at https://n-pi-jet.vercel.app. The historical-timezone live-correctness fix, regulator-in-prescription, ONEIROGENS gate, and single sound-frequency source are all LIVE. Detail in `FIXES_COMPLETE_v3.md` → "Master Build Results". The 3 vectors (A Lisbon ASC Scorpio 7.3°, B Neptune-excess cooling, C Mars-excess cooling) passed pre-deploy. **Do not regress.**

---

## MASTER BUILD DIRECTIVE — CURRENT POSITION
Full directive saved at `ASTRYX_MASTER_BUILD_DIRECTIVE.md`. Status:
- **Phase 0:** ✅ done & DEPLOYED (above).
- **Phase 1 (Results UX redesign, no engine changes):** 🟡 **STARTED & PARTLY DEPLOYED.** Items 1 + 2 are built, type-clean, and live (`dpl_DeoMCFhmKYvM3F7pMTSzXBENgbdg`). See `FIXES_COMPLETE_v3.md` → "Phase 1 (part 1)". The `CalibrationToday` hero lives just above `ChamberCTA` in `ResultsScreen.tsx`, rendered as "section 0" at the top of the main return.
  1. ✅ **DONE** — **"Your Calibration Today"** hero: plain-language Sound/Breath/Scent/Taste/Light action set (from `prescriptions[0].fiveSenses` w/ `plan.*` fallback) + "Enter Chamber →" + "▶ Preview sound".
  2. ✅ **DONE** — Felt-state-first headline from `protocol.dominantPolarity.dominant_state` (`FELT_STATE_LINES`), planet as a tappable `signal · {planet}` tag.
  3. 🟡 **PARTIAL** — Progressive teaching layer. The store half is DONE (`taughtConcepts: string[]` + `addTaughtConcept` in `store.ts`, persisted; one new concept surfaced per visit via the Teacher's `pickSuggestedConcept`). The hero's `signal · {planet}` tag is a working "learn this" hook. **REMAINING:** put an inline gloss + "learn this" affordance on **every** technical term (diagnosis card, transit cards, prescription cards), not just the hero tag.
  4. ⏳ **TODO** — Orientation bookends (one line atop intake, one atop Results).
  5. ⏳ **TODO** — One warm voice for Individual tier; clinical stays gated to Practitioner / "See why".
  6. 🟡 **PARTIAL** — Six-sense backbone (Sound, Scent, Taste, Body, Sight, **Mind**). The **Mind** entry is live (the "Sixth sense · Mind" card under the hero CTAs opens the Teacher). REMAINING: make the six-sense framing explicit across the Results body, not only in the hero.
  7. ⏳ **TODO** — Daily home / transits: returning users land on the daily screen; make day-to-day transit *change* felt. _(The P2 "7 active vs 5" sub-item is already fixed — Cosmic Weather now shows `TOP 5 OF {n}`.)_
  - **Gate:** a zero-astrology newcomer can see what to do immediately + tap any term to learn it. Determinism + compliance unaffected.
- **Phase 2 (The Teacher — sixth sense):** ✅ **v1 BUILT & DEPLOYED 2026-06-08** (`astryx-1qqza3qo7`). Built per `ASTRYX_SIXTH_SENSE_BLUEPRINT.md` (binding). **Engine untouched — the Teacher only reads engine output.** Full detail in `FIXES_COMPLETE_v3.md` → "Phase 2: THE TEACHER"; invariants in memory `teacher-sixth-sense.md`.
  - **As built:** server-only `POST /api/teach` (`src/app/api/teach/route.ts`) using `gemini-2.5-flash-lite` via REST. Grounding (`src/lib/teacher/grounding.ts`) = operating-contract system prompt (4 verbs define/explain/connect/teach; 3 roles Teacher/Librarian/Tour-Guide; scope rails; persona) + the user's report JSON (pinned facts) + curated `GLOSSARY` shelf + taught-concepts + one suggested concept for today. Caller (`src/lib/teacher/teach.ts`) runs the compliance wrapper: crisis-keyword gate (no model call), output banned-phrase lint via `teacherLint` (allows the NOUN "prescription", bans the VERB "prescribe") → regenerate-once-stricter → safe-fallback; micro-disclaimer attached. Tiering: Individual metered 10/day (in-memory by user-id/IP), Practitioner+ unmetered. Client `TeacherChat.tsx` bottom sheet; Results hero "learn this" tag + "Sixth sense · Mind" card open it. **IP-containment:** all grounding/correction logic stays in the two server libs (imported ONLY by the route; `window` guard; verified absent from client chunks).
  - **All 4 compliance vectors pass live:** in-scope (grounded), crisis (resources, no model call), out-of-scope (declines warmly), medical-bait (refuses cure/diagnosis, redirects to practitioner).
  - **REMAINING Teacher work:** wire "learn this" onto every term/transit card (shared with Phase-1 item 3); deep library retrieval over the full JSON shelf + Gemini context caching (currently curated GLOSSARY only); DB-backed metering (in-memory resets on cold start); verified-tier distinction (no session field yet).
- **Phase 3 (polish):** P1-5 deterministic narrative→planet parsing (keyword lexicon) or honest copy; P2 list: Cosmic-Weather "7 vs 5", geocode autocomplete de-dup, duplicate "BIRTH LOCATION" label, 12h time-input rejecting typed "PM", **preview audio → dual-layer like the chamber** (preview currently Tone.js only; chamber has Suno too), remove the persisted **"Test Balanced" dev fixture** from the store, copy passes ("a earth"→"an earth", "Density Uranus"), `BirthLocationField` timezone label uses the birth date.
- **Phase 4 (design-for, DO NOT build):** typed stub/interface + `// PHASE 2` note for a transit-driven daily exercise/movement library keyed to the day's transit + state (deterministic, Teacher-coached). Build nothing functional.

---

## IMMEDIATE NEXT STEPS for the next session
**🎉 v2 IS COMPLETE & DEPLOYED** — Parts **A, B, C, D, E, B.1, F, G** all live (2026-06-08 → 06-09). Awaiting the final pressure-test cook.
**B.1 INVARIANT (do not break):** `protocol.signalHierarchy.primary` is the ONE subject of the reading. Every surface (hero, diagnostic, chamber, prescription, environment, Astryx) + audio layer reads it. **No code path may recompute its own "dominant"** — read `signalHierarchy.primary.planet`, never `dominant_pattern.planets[0]`.

**Remaining (post-v2, when SHA's ready / pressure test surfaces things):**
1. **Optional B.1 follow-up** — Tone.js secondary-COUNTER Hz = `signalHierarchy.secondary` (deferred to avoid retuning the live de-harshed mix mid-cycle; the drone already carries the correction). Touches `soundEngine.ts` — do carefully (Rule 8).
2. **Carry-forward** (Phase-1 remainder): "learn this" on every term (not just hero); orientation bookends; one-warm-voice; daily-home landing. Plus Phase-3 polish list. Plus the **360° Body Grid** (needs SHA turntable frames) + element-level lineage-threading from Part E.

**Verification reminder:** for engine/polarity changes, the temp `/api/vtest` route + fetch-shim pattern (driving `runEngine` server-side, then `curl`) is the reliable path — see how Parts A/B were verified in `FIXES_COMPLETE_v3.md`. Delete the temp route before deploy.

**Older context (still true; no engine changes there unless a v2 part requires it; protect the polarity/audio/Astryx work):**
1. **Finish Phase 1 item 3 (the big one):** extend "learn this" from the hero tag to **every technical term** — diagnosis card, each transit card, each prescription card. Each gets an inline gloss + a tap that opens `TeacherChat` seeded with a term-specific question (the wiring pattern already exists: `askTeacher(seed)` in `ResultsScreen.tsx`). The store half (`taughtConcepts` + `addTaughtConcept`, persisted) is already done.
2. **Phase 1 items 4, 5, 7:** orientation bookends (atop intake + Results); one-warm-voice pass (clinical gated to Practitioner); daily-home / returning-user landing with day-to-day transit change made felt.
3. **Teacher v2 (optional, when ready):** deep library retrieval over the full JSON shelf + Gemini context caching; DB-backed metering; verified-tier distinction. None blocking.
4. **Verification:** the Preview MCP harness CANNOT spawn a dev server from this spaced OneDrive path (`npm.cmd`/`npm` both fail). For server/route logic, run `npm run dev` via the **Bash tool** in the background and `curl` the route (how the Teacher was verified this session — reliable). For UI, rely on `npx tsc --noEmit` + `npm run build`; SHA eyeballs visuals on the live URL.
5. Keep `npx tsc --noEmit` green; `rm -rf .next` before each deploy; `vercel --prod --yes` per phase gate; append to "Master Build Results" in `FIXES_COMPLETE_v3.md`; update this handoff.

## Key files
- Engine (deterministic — do not break): `src/lib/engine.ts`, `ephemeris.ts`, `RemedyPolarityEngine.ts`, `timezone.ts`, `chart/route.ts`.
- Audio: `soundEngine.ts` (Tone.js — don't touch for Suno), `sunoLibrary.ts` (catalog), `sunoPlayer.ts`, `SoundEngineController.tsx`.
- The Teacher (Phase 2): `src/app/api/teach/route.ts`, `src/lib/teacher/grounding.ts`, `src/lib/teacher/teach.ts` (all server-only), `src/components/teacher/TeacherChat.tsx` (client).
- UI (Phase 1): `src/components/screens/ResultsScreen.tsx` (~1640 lines; `CalibrationToday` hero + `ChamberCTA` are defined together ~line 900–1170, hero rendered as "section 0" ~line 130; `askTeacher`/`teacherOpen` state ~line 114), `IntakeScreen.tsx`, `src/lib/store.ts` (`taughtConcepts`).
- Docs: `ASTRYX_APP_SPEC.md`, `ASTRYX_USER_GUIDE.md`, `ASTRYX_TEST_GUIDE.md`, `FIXES_COMPLETE_v3.md`, `ASTRYX_SIXTH_SENSE_BLUEPRINT.md`, `COMPLIANCE.md`, `CLAUDE.md`.
