# ASTRYX — Directive I: Intake Balance, Chamber-Only Player & The Music Library
### Claude Code handoff · 2026-06-09 · driven by SHA's live testing
**Read with:** `FIXES_COMPLETE_v3.md` (esp. H, H.3 — chamber is now music-only), `suno-audio-r2-pipeline.md` (R2 catalog), `ASTRYX_SESSION_HANDOFF.md`, `COMPLIANCE.md`.

> All five items below are SHA's findings from using the live app. Confirm against the code, then build. Gated: `npx tsc --noEmit` → 0, `npm run build` ✓, `rm -rf .next` → `vercel --prod --yes`, append to `FIXES_COMPLETE_v3.md`. Determinism + compliance intact.

---

## I.1 — Intake must capture BALANCE, not only imbalance
**Issue (confirmed):** every planet card in the Resonance Scan offers only negative/imbalance statements (excess/deficiency/blocked). There is no way for the user to indicate a planet feels **balanced or strong**. The Planet ≠ Remedy engine borrows from *resourced* planets — if balance is never captured, the recalibration is working from half the picture.
**Solution:** add a **balance/strength signal** per planet — e.g., a tappable *"This feels balanced / strong for me"* option on each planet card (mutually exclusive with that planet's imbalance statements). Feed it into scoring as a `balanced`/`resourced` state so the engine knows which planets are available to draw from. Keep the scan fast — one extra tap per planet, not a second questionnaire.
**Where:** `IntakeScreen.tsx` (resonance-scan cards), `data/symptoms.json` or the planet-statement source, `RemedyPolarityEngine.ts` (accept a resourced/balanced signal). Determinism preserved.
**Verify:** a user can mark a planet balanced; the engine treats balanced planets as resources, not deficits; marking everything balanced → no correction (existing behavior).

## I.2 — Audio belongs ONLY in the chamber (remove it from transit cards)
**Issue (confirmed):** transit-protocol cards each play music/tone, multiple overlap, and there is **no way to stop them**. Audio should not live on the report surfaces at all.
**Solution:**
- **Remove all audio playback from transit cards and report surfaces** (the per-transit "play" + the transit-preview player on transit cards). Transit cards become **informational + a fork suggestion**: *"Strike your {planet} fork on your own for ~5 minutes."* (5 min default — a transit is a passing influence; offer "up to 10 if you want to go deeper.")
- The **only audio player is in the chamber** (see I.3).
- This intentionally walks back Part C's per-transit playback — the overlap it created is the reason. Keep the transit *content* (effect/intervention/the fork suggestion); drop the *playback*.
**Where:** `TransitCard` / `TransitProtocolModal` in `ResultsScreen.tsx`; `transitAudio.ts` (retire its use on cards); the hero/prescription `SoundPreviewButton` — decide with SHA whether a short *preview* stays on Results or also moves into the chamber (default: **no audio outside the chamber**).
**Verify:** opening any number of transit cards plays nothing; each shows a "strike your {planet} fork ~5 min" suggestion; no overlapping audio anywhere on Results.

## I.3 — The chamber is entered AFTER the full report, and it owns the player
**Issue:** the user can reach the chamber without reading the report; the chamber needs real transport controls.
**Solution:**
- Gate the **Enter Chamber** CTA to the **end of the report flow** (after the Prepare-Rite card), so the user passes through the full report first. Natural-flow gate, not a hard lock that frustrates.
- The chamber houses the **music player. Full control set (build all of these — do not under-build):** **play/pause · volume (with mute) · skip → next track · ← previous track · replay/restart current · a progress scrubber (seek) with elapsed/total time.** Plus the existing per-fork auto-advance. This is the single audio environment in the app.
**Where:** `ResultsScreen.tsx` (CTA placement), `SoundEngineController.tsx` (add skip/replay transport to the existing music-only player + volume).
**Verify:** Enter Chamber sits after the report; inside, volume + skip + replay all work on the music.

## I.4 — The library must hold ALL songs, with versions, and grow monthly
**Issue (confirmed):** `CATALOG` in `sunoLibrary.ts` is a hand-picked subset; SHA's full R2 library is larger, has **multiple versions per aspect/state** (e.g. several `MARS_EXC_*`), and grows **monthly**. The user should choose which version plays, and new songs must appear without a code change.
**Solution:**
- **Drive the catalog from a bucket manifest.** Add a manifest JSON in the R2 bucket (e.g. `catalog.json` listing every `{planet}/{state}/{file}`); the app **fetches the manifest at runtime** so monthly additions appear with **no redeploy**. (Regenerate the manifest from the bucket whenever songs are added — see `suno-audio-r2-pipeline.md`.) Keep the deterministic default selection, but the pool is now the FULL set.
- **User picks the version:** in the chamber player, for the current aspect/state, expose the **available versions** and let the user choose / skip among them (deterministic default, user-overridable). `skip` cycles versions within the called-for aspect.
**Where:** `sunoLibrary.ts` (manifest fetch + version lists), `sunoPlayer.ts` / `SoundEngineController.tsx` (version pick + skip). Honor `NEXT_PUBLIC_AUDIO_BASE_URL`; bucket structure/naming unchanged.
**Verify:** the app lists the full bucket via manifest; adding a song to the manifest makes it appear without redeploy; in the chamber, the user can switch between versions of the called-for aspect.

## I.5 — Favorites + "Build your own chamber" sequence
**Issue:** no way to save songs or make a personal sequence; this is the freshness/retention layer.
**Solution:**
- A **Favorites** folder: save any track, play anytime.
- A **"Build your own chamber"** mode: the user assembles a custom **sequence/playlist** from the library to experiment with the forks and play on demand (a self-made chamber).
- Store per account (localStorage for anon). Practitioner power-use: build custom client sequences.
**Where:** `store.ts` (favorites + sequences, persisted), a new Music Library / sequence-builder screen + chamber player hooks.
**Verify:** user can favorite a track and replay it; build, save, and play a custom sequence; persists across sessions.

---

## GLOBAL RULES
Determinism (no `Math.random` in selection — version *default* deterministic; user override is allowed). Compliance + crisis gate + safety intact; Astryx read-only. `NEXT_PUBLIC_AUDIO_BASE_URL` gates the music; bucket naming/structure fixed. Honor `signalHierarchy` as the source of truth. No new `any`. **Audio lives only in the chamber.**

## AFTER
`tsc` 0; `npm run build` ✓; run the I.1–I.5 verify gates; `rm -rf .next` → `vercel --prod --yes`; append "Part I — Intake Balance, Chamber-Only Player & Music Library" to `FIXES_COMPLETE_v3.md`; refresh `ASTRYX_SESSION_HANDOFF.md`. Open question for SHA (do not assume): whether a short *preview* may stay on Results, or audio is **strictly** chamber-only.
