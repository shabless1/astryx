# ASTRYX — Master Build Directive
### Claude Code handoff | v1 | 2026-06-08 | sequenced, self-contained

**Read order:** this file → `CLAUDE_CODE_HANDOFF.md` → `ASTRYX_TRUST_FIXES_DIRECTIVE.md` → `ASTRYX_SIXTH_SENSE_BLUEPRINT.md` → `FIXES_COMPLETE_v3.md` → `COMPLIANCE.md` → `CLAUDE.md`.

**Execution rule:** build in phase order. Each phase has a verification gate — do not advance until it passes. After all phases: `npm run build` clean, then append results to `FIXES_COMPLETE_v3.md`. Never ask SHA to write code; when you hit a fork, choose the better path and document it.

**Two laws that override everything below:**
1. **The engine stays deterministic and the Teacher stays conversational — they never merge.** Same birth data + same symptoms = same calibration, forever. The Teacher reads the engine's output; it can never change a verdict, number, or remedy.
2. **No medical claims, ever.** Probabilistic framing only; honor `COMPLIANCE.md` (banned phrases, persistent disclaimer, crisis-keyword detection) on every surface — including the Teacher.

---

## PHASE 0 — Finish & verify the trust fixes (already applied)
The P0/P1 fixes are on disk. **Verify, don't re-apply.** Follow `CLAUDE_CODE_HANDOFF.md` exactly: run the grep checks, `npm run build` (restore the pre-corrupted `src/lib/sunoLibrary.ts` from git only if it blocks), then the three vectors:
- `1990-03-22 21:42 Lisbon` → ASC **Scorpio** (not Libra).
- Neptune-excess → peppermint/rosemary/ginger, alternate-nostril breath, grounding palette, **no mugwort / no Blue Lotus**; Results sound Hz **==** Chamber Hz.
- Mars-excess → cooling/calming; balanced state → unchanged.
**Gate:** build green + 3 vectors pass. Commit. Then proceed.

---

## PHASE 1 — Experience & Comprehension redesign (no engine changes)
**Goal:** turn the results screen from a cosmology dump into a daily practice a newcomer can follow — while *teaching* the astrology in context, not hiding it. Principle: **lead with the action, integrate the lore.**

1. **"Your Calibration Today" hero.** At the very top of Results, before any chart data, render the plain-language action set: the one breath, scent, taste, color/light, and sound (with ▶), plus the **Enter Chamber** button. This is the first thing every user sees. Everything analytical (chart wheel, cosmic weather, cell salts, SOAP) moves below it or into the existing "See why" tabs.
2. **Felt-state-first diagnosis.** Lead the diagnosis with the plain-language state line you already generate (e.g. "Your system is in *dissolve* mode — boundaries feel thin, focus scatters") and render the planet as a labeled tag beside it (e.g. `signal · Neptune`). Do **not** remove the astrology — keep it visible and tappable so it can be taught (see #3).
3. **Progressive teaching layer (integrate, don't bury).** Every astrological/technical term (Ascendant, the planets, aspects, transits, cell salts, Cousto Hz, chakras) renders with: (a) an inline plain-language gloss on first appearance, and (b) a "learn this" affordance that opens the Teacher (Phase 2). Track which concepts a user has been taught in their persisted state; surface **one new concept per visit**, tied to what's live in their chart that day.
4. **Orientation bookends.** One line above intake: "Tell us your birth details and how you feel — we'll build a 5-sense reset. No astrology knowledge needed." One line atop Results: "We read the pattern in your chart and your symptoms, and tuned this session to bring you back to center."
5. **One warm voice.** The intake's plain, symptom-first tone carries unbroken through Results for the Individual tier. Clinical terminology stays gated to Practitioner / behind "See why."
6. **Six senses as the backbone.** Structure Results around six cards — Sound, Scent, Taste, Body, Sight, and **Mind** (the new sixth sense / Teacher entry point). Each leads with a one-line action or prompt.
7. **Daily home / transits.** Ensure returning users land on the daily screen and that the day's transits visibly drive it — make the *change* felt day to day (what's new today vs. yesterday), since the transits are the daily-return engine.

**Gate:** a first-time user with zero astrology knowledge can, on the Results screen, immediately see what to do, and can tap any unfamiliar term to learn it. Determinism + compliance unaffected.

---

## PHASE 2 — The Sixth Sense: the Teacher (Gemini 2.5 Flash-Lite)
Build per `ASTRYX_SIXTH_SENSE_BLUEPRINT.md` (the operating contract is binding). The Teacher is a grounded conversational layer that explains the user's fixed report — it never generates calibrations.

1. **Server-side route (also the IP move).** Add `POST /api/teach` (Next.js route, server-only). All Teacher logic, prompts, and the data-library context live here — **not in the client bundle.** This doubles as trade-secret containment: the proprietary mapping/explanation context never ships to the browser.
2. **Provider/model.** Google Gemini API, model `gemini-2.5-flash-lite`. Read the key from `process.env.GEMINI_API_KEY` (add `GEMINI_API_KEY` to `.env.example` and Vercel env; never hardcode, never expose client-side).
3. **Grounding (this IS the guardrail).** Build each request's context from: the system prompt (the operating contract — four verbs, three roles, scope rails, teacher-not-guru persona, no-medical-claims), the user's generated report (JSON), the relevant data-library excerpts (`planets, signs, aspects, houses, herbs, scents, taste-map, body-protocols, colors, geometry, planetary-anchors, sign-modulation, solfeggio-overlays, cell salts, soap-templates, remedyPolarity` + Sacred Extension: `sacredTones_nervousSystem, sacredBotanicals, crystalsExpanded, lotusSpectrum, starterKits`), a term glossary, and the conversation + the user's taught-concepts history. Use Gemini **context caching** for the static parts (system prompt + libraries + glossary) to cut cost.
4. **Roles:** Teacher (explains the report), Librarian (answers from the libraries with sources), Tour Guide (how the app works, the tiers, navigation). Verbs: **define · explain · connect · teach** only. No decide/diagnose/prescribe/predict.
5. **Compliance wrapper.** Run crisis-keyword detection on every user input before calling Gemini; run `lintForBannedPhrases()` (or equivalent from the compliance lib) on the response before returning; always attach the disclaimer. If a response references a value not in the report/libraries, reject and retry — the Teacher must trace to source.
6. **Tiering (self-funding).** Individual = metered daily message allowance (configurable, e.g. 10/day); Practitioner+ = full. Enforce in the route by the user's tier/JWT.
7. **UI.** Wire the "learn this" affordances (Phase 1 #3) and the Mind card to a chat surface. Keep it clearly a teacher, not a mystic oracle.

**Gate:** ask the Teacher "why peppermint?", "what's my Ascendant?", "what does today's transit mean?", "how do I start a session?" → correct, grounded, source-traceable, no medical claims, in a warm (non-stiff) voice. Confirm the API key is server-only and no Teacher/engine logic appears in the client bundle.

---

## PHASE 3 — Remaining polish (P1/P2)
- P1-5: deterministic narrative→planet parsing (keyword lexicon), or change the copy if not building it.
- P2: Cosmic-Weather "7 active vs 5"; geocode autocomplete de-dup; duplicate "BIRTH LOCATION" label; 12-hour time input rejecting typed "PM"; preview audio → dual-layer like the chamber; remove persisted "Test Balanced" dev fixture; copy passes ("a earth"→"an earth", "Density Uranus"); `BirthLocationField` timezone label uses the birth date.

---

## PHASE 4 — Design-for, do NOT build: transit-driven daily exercise
Per Blueprint Part IV. Design the Body sense + data model now so a future **movement/exercise library** keyed to the day's dominant transit + state can drop in (deterministic selection, Teacher-coached). Leave a typed stub/interface and a `// PHASE 2` note. Build nothing functional this pass.

---

## GLOBAL RULES
- **Determinism:** no `Math.random` in chart/protocol/sound/color/exercise selection. The Teacher path is read-only against the engine output.
- **Compliance:** disclaimer + probabilistic framing + crisis detection everywhere, Teacher included. Preserve all existing safety notes (Malachite warning, Blue Lotus/cell-salt notes).
- **IP / trade secret:** keep the planet×state mapping tables + correction logic + Teacher context server-side (API routes), never the client bundle. Note in the completion doc what moved.
- **Frugality:** Gemini Flash-Lite + context caching + metered tiering. No other paid services without proof the owned stack can't do the job.
- **TypeScript:** update types for the new prescription/teacher shapes; no new `any`. **Determinism + compliance are never traded for convenience.**

## AFTER ALL PHASES
1. `npm run build` → zero TS errors.
2. Re-run the Phase 0 vectors + the Phase 1/2 gates.
3. Append "Master Build Results" to `FIXES_COMPLETE_v3.md`: phases completed, files/routes added, what moved server-side, the Gemini integration + env var, tiering limits chosen, and any decisions made at forks. Commit per phase.

*Out of scope for Claude Code (SHA + Cowork strategy track): trademark ASTRYX, the IP holding-structure/trust, marketing & launch. The server-side trade-secret containment in Phases 2/GLOBAL is the one IP item handled in-build.*
