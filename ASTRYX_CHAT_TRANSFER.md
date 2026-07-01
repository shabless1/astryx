# ASTRYX — Chat Transfer Directive
### Hand-off from the previous Claude Code chat · 2026-06-09 (chat got long; continuing fresh)

You are picking up an in-flight build. **Read this file first, then `ASTRYX_SESSION_HANDOFF.md` (canonical state), then `FIXES_COMPLETE_v3.md` (every change, newest-first).** Don't re-derive what's already done — it's all documented and deployed.

---

## WHERE WE ARE (one breath)
ASTRYX is a deterministic medical-astrology recalibration app (Next.js 14 / TS / Zustand / NextAuth / Tone.js had been the synth layer / Suno music on Cloudflare R2 / Gemini for the "Astryx" guide). **Live: https://n-pi-jet.vercel.app.** The v1.4 base + a long arc of directives are **built and deployed**. We are between builds, awaiting SHA's pressure-test of the rebuilt Chamber.

## WHAT IS DONE & LIVE (do not rebuild; do not regress)
- **v2 Parts A–G + Directive B.1** — all deployed. Headlines:
  - **A** symptom-driven polarity state (killed universal "running hot"). **B** corrective Cosmic Diagnostic. **C** audio honesty (transit cards play their own planet; 10 owned forks only, Earth/Platonic = app-played). **D** the guide is **Astryx** (named), server-only `/api/teach` (Gemini), IP-contained, compliance-gated. **E** medical-astrology nav spine (Chart + Body Grid for users; Body Systems + Clients = Practitioner). **F** corrective elements/environment ("Set your space"). **G** "Prepare your rite" + substitution.
  - **B.1** — the ONE source of truth: `protocol.signalHierarchy {primary, secondary, tertiary}` built once in `runEngine`. **Every surface + audio layer reads it; nothing recomputes its own "dominant."** Killed the Mars/Sun subject flip.
- **Part H — the Chamber rebuilt** (`astryx-fn5gz2t9u`): planet-true felt language (`feltStateLanguage` — Mercury-excess = "running fast → settle", never "hot/cool"); life-event landmarks (`detectLifeEvent` — Saturn/Jupiter Return etc., elevated card; whole transit card opens its protocol); the **fork rite** (`lib/chamber/forkRite.ts` — grounding open → supporting passes → MAIN 3 held longest, primary LAST → close on the primary; carried/auto-advancing timeline); application keys to the owned set (unweighted aluminum = field / weighted steel = on-body, `forkSetType` in store); tiering — Individual 15-min "Rite" (default) vs Practitioner 60-min "Service" + pacing + printable protocol sheet.
- **H.3 — MUSIC-ONLY CHAMBER (latest deploy, `astryx-fdczgklpz`)** — SHA's call: the synthesized tone layer clashed with the music and is REMOVED. The planetary frequency already lives in the music's keys/notes. The fork rite now cross-fades the **Suno track** per step (`sunoPlayer.crossFadeTo`); all previews play Suno tracks; `forkTone.ts` deleted; `SoundEngineController` is music-only (Tone.js never starts in the chamber; `soundEngine.ts` intact but unused there). **Volumes raised music-forward** (PHASE_VOLUME 0.85–1.0, default 0.9). **Memory `suno-audio-r2-pipeline.md` says: do NOT re-add a tone layer to the chamber, and don't lower these volumes without SHA's say-so.**

## THE LAWS (carry on every change)
1. **Determinism** — no `Math.random` in chart/protocol/audio/timing/element selection. Same birth data + symptoms = same output.
2. **No medical claims** — probabilistic framing, `COMPLIANCE.md` (banned phrases, persistent disclaimer, crisis gate) on every surface incl. Astryx (read-only).
3. **`signalHierarchy.primary` is the subject of the reading** — read it, never `dominant_pattern.planets[0]`.
4. **Never amplify** — correction governs sound/scent/taste/body/sight/environment.
5. **Music-only chamber** (H.3) — no synthesized tones in the session.

## IMMEDIATE NEXT STEP
**SHA is pressure-testing the Chamber (Part H + H.3) by ear and in live use.** When she returns, she'll paste the cooker's findings or a new directive. Your job: triage what she brings, fix what's real, protect what works. There is **no queued build right now** — wait for her input. Do NOT preemptively start new features.

## OPEN FOLLOW-UPS (not started; only if SHA asks)
- **Nodal Return / Chiron Return** life-events — need the chart engine to expose lunar nodes + Chiron (TODO noted in `engine.ts` `detectLifeEvent`).
- **360° Body Grid viewer** — needs a turntable image sequence (24–36 frames) from SHA, or a Three.js Phase-3 upgrade. (Spawned task chip exists.)
- **Phase-1 carry-forward**: "learn this" on EVERY term (not just the hero tag); orientation bookends; one-warm-voice pass; daily-home returning-user landing.
- **Phase-3 polish list** (in the handoff): geocode de-dup, 12h PM input, copy passes, etc.

## ENVIRONMENT / WORKFLOW GOTCHAS (save yourself the pain)
- **No git repo.** Deploy straight from the folder: `vercel --prod --yes` (authed as `shabless1`). Document results in `FIXES_COMPLETE_v3.md` — there is no commit history.
- **Windows + OneDrive path with spaces.** `rm -rf .next` often fails ("Directory not empty"/EINVAL) — use `powershell.exe -NoProfile -Command "Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue"` before each build/deploy. Python is NOT installed; use Node for scripts.
- **Preview MCP can't spawn a dev server** from this path. For verification, run `npm run dev` via the **Bash tool** (backgrounded, `> /tmp/astryx-dev.log 2>&1 &`), wait for "Ready", and **`curl` a temp `/api/vtest` route** that calls `runEngine` with a fetch shim (`(global as any).fetch = (u,o)=>origFetch(u.startsWith('/')?'http://localhost:3000'+u:u,o)`). This is how A–H were verified — far more reliable than driving the UI. **Always delete the temp route before deploying.**
- **Gate every deploy:** `npx tsc --noEmit` → 0, then `npm run build` → ✓ 9/9 pages, then deploy. `tsconfig` has `strict: true` (no `noUnusedLocals`, so unused type imports won't fail).
- **R2 audio:** public URL `https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev` (no token needed at runtime; `NEXT_PUBLIC_AUDIO_BASE_URL` set in Vercel). Catalog in `sunoLibrary.ts` must mirror the bucket exactly.
- **Gemini key** is in Vercel Production (encrypted, validated). Never store the secret in any repo file.

## MEMORY (auto-loads each session — trust but verify against current code)
`symptom-vocabulary-bridge.md` (incl. the B.1 single-source-of-truth invariant), `suno-audio-r2-pipeline.md` (incl. the H.3 music-only rule), `teacher-sixth-sense.md` (the Astryx guide invariants).

## VOICE / WORKING STYLE SHA LIKES
Decisive (make the call, document it, move on — never ask her to code); verify before claiming; warm and plain in user-facing copy; protect determinism + compliance reflexively; flag honestly when something can only be confirmed by ear/eye in a live session (audio levels, visuals) since the harness can't.

---
*Start by reading `ASTRYX_SESSION_HANDOFF.md`, confirm the live state, then wait for SHA's pressure-test results. The chamber is finally the rite — we're listening for what the cooker says.*
