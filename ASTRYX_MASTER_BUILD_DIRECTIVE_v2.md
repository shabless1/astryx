# ASTRYX — Master Build Directive v2 (The Integrated Rite)
### Claude Code handoff · 2026-06-08 · supersedes the open phases of v1, folds them in

> **Read order:** this file → `ASTRYX_SESSION_HANDOFF.md` (env gotchas) → `ASTRYX_SIXTH_SENSE_BLUEPRINT.md` → `ASTRYX_PRESSURE_TEST_2.md` → `COMPLIANCE.md` → `CLAUDE.md`. Memory: `teacher-sixth-sense.md`, `symptom-vocabulary-bridge.md`, `suno-audio-r2-pipeline.md`.

---

## NORTH STAR — what Astryx actually is (build toward this, not just the tickets)
**Astryx is an integrated medical-astrology recalibration ritual.** The loop:
1. The user's **present state** (intake symptoms) asks the question — *what is out of balance right now, and which way does it need to move?*
2. The **natal chart** is the fixed key that interprets that state — it never changes; it's the lens.
3. **Medical astrology** is the language every answer is written in — system → sign → planet, always visible, never hunted for.
4. The reading resolves to a **corrective direction** (Planet ≠ Remedy — never amplify), expressed across **six senses + the elemental setting**.
5. The user **assembles the rite from the tools they own** — their 10 planetary forks, their teas, their oils — and their **own environment** (water, fire, hilltop, park). The app *suggests*; the user *authors* the immersion.
6. **Astryx** — the named intelligence, not a "teacher" feature — teaches them to read themselves, toward fluency.

Every task below is one sentence of that paragraph that the current build breaks.

## THREE LAWS (override everything)
1. **Engine deterministic; Astryx (the guide) only reads engine output — never merges.** Same birth data + same symptoms = same calibration.
2. **No medical claims, ever.** Probabilistic framing; honor `COMPLIANCE.md` on every surface incl. Astryx.
3. **Never amplify — on every layer.** The correction governs sound, scent, taste, body, sight, **and the elemental/environment suggestion**. You cool a fire-excess by water, never by a firepit.

## ORDER OF OPERATIONS
Build A→G in order; each part has a verify gate. `npx tsc --noEmit` green + `rm -rf .next` before each `vercel --prod --yes`. Append results to `FIXES_COMPLETE_v3.md`; update `ASTRYX_SESSION_HANDOFF.md`. No engine regressions — protect the polarity/audio/Astryx work already live.

---

## PART A — FOUNDATION: the diagnosis must be driven by the user's symptoms (P0, do first)
**Concept:** The intake is the diagnostic instrument. The reading must reflect *what the user reports feeling today* — the chart is context, not the verdict. Today it ignores them.
**Bug (confirmed by SHA testing):** no matter the symptoms selected, the state resolves to **excess ("running hot")**. The chart structure is outvoting the user — in `RemedyPolarityEngine.ts` the state-scoring modifiers (hard aspects → excess/blocked bias, cardinal → excess bias, fixed/6-8-12 house → blocked) can swamp the symptom-derived `state_signal`, so it defaults hot.
**Build:**
- Make the **user's symptom `state_signal` (from `symptoms.json`) the PRIMARY determinant of the polarity state.** Chart-structure modifiers may only adjust *confidence*, or act as a tie-breaker when symptom signal is weak/absent — they must NOT flip the state away from what the symptoms say.
- If the selected symptoms clearly indicate **deficiency** (e.g. "physical energy/libido/motivation is depleted") the state must read **deficiency** ("running low/cold"), not excess. Likewise blocked → "stuck/held."
- Verify the felt-state headline (`FELT_STATE_LINES`) has a line for every state, and that `dominantPolarity.dominant_state` is what the symptoms imply.
**Where:** `src/lib/RemedyPolarityEngine.ts` (state scoring + modifier weights), `src/lib/engine.ts` (`dominantPolarity`), `ResultsScreen.tsx` (felt-state line). Cross-check `data/symptoms.json` `state_signal` tags are correct per statement.
**Verify (acid test):** Mars-deficiency symptom ("depleted/low drive") → diagnosis reads **deficiency / warming**, NOT "running hot." Mars-excess ("anger/inflammation") → excess / cooling. Neptune-excess ("foggy/unmoored") → excess. A user who changes their symptoms gets a changed state. **No more universal "running hot."**

## PART B — close the last "amplify" leak: the Cosmic Diagnostic (P0)
**Concept:** Law 3 must hold on the first card the user reads.
**Bug (Pressure Test #2):** the COSMIC DIAGNOSTIC still prints the raw, polarity-unaware `howToRestore` — "Egyptian Blue Lotus tea… 211.44 Hz Neptune fork" — for a Neptune-excess user (an oneirogen + the amplifying frequency), contradicting the corrected hero/prescription/chamber.
**Build:** in the diagnostic builder (`engine.ts` ~641 & ~737, where `actionLayer = medAstro.plainLanguageBridge.howToRestore`), when `dominantPolarity.symptomDriven && state !== 'balanced'`, replace `actionLayer`/`howToRestore` with corrective text built from the **same `CorrectiveProtocol`** the prescription uses (regulator-named, corrective herbs/scents/breath/colors, regulator Hz) and apply the **same `isOneirogen` gate**. `ResultsScreen.tsx:198` then renders the corrected line.
**Verify:** Neptune-excess COSMIC DIAGNOSTIC shows cooling/peppermint/141.27-Mercury language, **no Blue Lotus, no 211.44 Neptune fork**; consistent with the hero.

## PART C — audio honesty: transit-card sound + the real fork set (P1)
**C1 — each transit card plays ITS OWN tone + track, not the dominant.**
**Bug (SHA testing):** pressing play on a transit card plays the global dominant tone/song; some cards play only a tone, no track.
**Build:** the transit card's play action must resolve audio from **that transit's planet(s)** (transiting/natal), not `dominantPattern`. Pull the matching Suno track from `sunoLibrary.ts` `CATALOG` for that planet+state; if no track exists, play that transit's **tone** correctly (still its planet's Hz), and label it tone-only — never substitute the dominant.
**Where:** the transit modal / "VIEW PROTOCOL" + card play handler in `ResultsScreen.tsx`, `sunoPlayer.ts`, `SoundEngineController.tsx`, `calculateTransits` output. **Rule 8: do not retune `soundEngine.ts` for the Suno layer.**
**Verify:** "Saturn square Neptune" plays Saturn/Neptune-appropriate audio (its track if present, else its tone), distinct from the dominant; no card silently plays the dominant song.

**C2 — the fork set is the 10 planets only; Earth tone is app-played, fork-paired.**
**Concept:** the physical product is 10 planetary forks. There is no Earth fork in a user's hands, so the app must never tell them to "apply the Earth fork."
**Build:** audit every fork instruction (`sacredTones_nervousSystem.json`, `planetaryAnchors`, the prescription/chamber sound steps). Any "apply fork" instruction must map to one of the **10 planetary forks**. The **Earth Om / Earth-year tone (136.1 / 194.18 Hz) becomes an app-played background tone only** — and where it appears (esp. on transits) the guidance is: *"the Earth tone plays from the app; strike your [planet] fork along with it."* Remove standalone "Earth fork" calls. If a step can't pair to an owned fork, it's app-tone-only.
**Verify:** no instruction asks the user to apply a fork they don't own; Earth tone always pairs with a named planetary fork or is clearly app-played background.

## PART D — Astryx, the named guide (not "the Teacher") (P1)
**Concept:** Astryx is the personified intelligence of the system. "Teacher" is the *role*, not the name. The user asks **Astryx**, by name.
**Build:** rename all user-facing strings "Teacher" → **"Astryx"**; the entry points read **"Ask Astryx"** (the Mind card, the chat header, the "learn this" hooks). In `teacher/grounding.ts` `SYSTEM_INSTRUCTION`, change the identity line from "You are the Teacher" to **"You are Astryx — the living intelligence of this system,"** keeping the entire operating contract, four verbs, scope rails, and compliance spine intact (teaching is her role). Code paths/filenames (`/api/teach`, `teacher/*`) may stay to avoid churn; only identity + UI copy change.
**Verify:** UI shows "Ask Astryx"; the persona answers as Astryx; contract/compliance unchanged (re-run the 6 Astryx vectors — grounded, out-of-scope, medical-bait, guru, hallucination, crisis).

## PART E — information architecture: the medical-astrology spine, made navigable (P2)
**Concept:** everything connects to medical astrology and the user should never hunt for it.
**Build:**
- **Menu (user-facing):** surface the user's **Chart** and the **Body Grid** (the holographic body map) directly. These are the user's map of themselves.
- **Body Systems** (the granular system-by-system breakdown) → **Practitioner-tier only.**
- Every body-system entry reads as its medical-astrology chain: **`CARDIOVASCULAR SYSTEM · LEO · SUN`**, then the detail. System → sign → ruling planet, always together.
- Thread the spine everywhere: tapping any herb, tone, color, crystal, or system shows its planet/sign lineage (and opens Astryx to explain it).
**Where:** `NavBar.tsx` / menu, `BodyMap.tsx`, `ChartTabs.tsx`, the body-systems data (`data/bodySystems/*`), tier gating via session `isPremium`.
**Verify:** Individual menu = Chart + Body Grid (no raw Body Systems); Practitioner sees Body Systems with `SYSTEM · SIGN · PLANET` headers; every clinical element exposes its astrology chain.

## PART F — Elements, Qualities & Environment (P2) — the layer that makes the chamber the world
**Concept:** every sign already encodes an **Element** (Fire/Earth/Air/Water), a **Polarity** (masculine/projective · feminine/receptive), and a **Modality** (cardinal/fixed/mutable). Fold them in as the **setting and manner** of the rite — and let them obey Law 3 (corrective, never amplifying). The app suggests; the user dials immersion (a glass of water → a mountaintop).
**Build:**
- Add **element · polarity · modality** to the protocol output, derived from the chart and routed through the correction (use the **corrective/regulator element**, not the raw dominant — cooling a fire-excess suggests **water/earth**, never fire). Source associations from `data/elements.json` + `data/modalities.json`; if a corrective-element field is missing, derive it from the regulator planet's element — author from existing associations, do not fabricate.
- Translate into **suggestions, not commands:**
  - **Element → setting:** Water → near still water / a quiet bath; Fire → hearth, candle, sunlight; Air → a hilltop, open window, breeze; Earth → a park, barefoot on ground, under a tree.
  - **Modality → tempo:** Cardinal → *initiate*, set intention; Fixed → *hold/sustain*; Mutable → *let it flow / dissolve*.
  - **Polarity → posture of attention:** masculine/projective → active, outward; feminine/receptive → still, inward.
- Present as an **optional "Set your space" invitation** in the rite (see Part G), explicitly framed: *"if you can…"* — the user owns how far they take it. Environment is a frequency-carrier and slots into the substitution logic (tea OR oil OR simply go sit by the water).
**Verify:** a fire-excess calibration suggests a cooling (water/earth) setting, never fire; suggestions read as invitations; element/modality/polarity all trace to the chart and shift with the correction.

## PART G — the session as one integrated rite: assembly & substitution (P2)
**Concept:** not five features and a timer — one ceremony the user *prepares for* and *steps into*, built from what they own.
**Build:**
- Before "Enter Chamber," add a **"Prepare your rite"** step: if the calibration calls for a tea, prompt the user to **brew it to have with them**; show the fork(s) to have ready; offer the **"Set your space"** elemental invitation (Part F).
- **Substitution logic, made explicit:** within a layer, the user uses what they have — *no tea? reach for the aromatherapy oil to connect with the frequency.* Surface the alternative inline so a missing tool never breaks the rite.
- Carry this through the Chamber steps so sound (app tone + their fork), taste (their tea or oil), body (breath/posture), sight (color/geometry), setting (their environment), and mind (Astryx) read as **one act tuned to one corrective frequency**, not a checklist.
**Verify:** the flow guides preparation → space → session as a single rite; a user without the tea is offered the oil; nothing in the session asks for a tool the user can't own (ties to C2).

---

## CARRY-FORWARD (still open from v1 / Pressure Test #2 — fold in, don't drop)
- **Phase 1 remainder:** "learn this" on *every* term (diagnosis/transit/prescription cards, opening Astryx seeded), not just the hero tag; orientation bookends (atop intake + Results); one-warm-voice for Individual (clinical gated to Practitioner); daily-home returning-user landing with day-to-day transit *change* made felt.
- **Polish (P3):** cosmetic TZ label uses birth date; duplicate "BIRTH LOCATION" label; geocode autocomplete de-dup; remove persisted intake fixture (survives storage clear); preview audio → dual-layer like the chamber; 12h time-input PM; copy passes.
- **Astryx v2 (optional):** deep retrieval over the full JSON shelf + Gemini context caching; DB-backed metering; verified-tier distinction.
- **Phase 4 (design-for, don't build):** typed stub for transit-driven daily exercise/movement library.

## GLOBAL RULES
Determinism (no `Math.random` in chart/protocol/sound/color/element selection; Astryx read-only). Compliance + crisis detection everywhere. IP containment: all mapping/correction/grounding stays server-side, never the client bundle. Frugality: Gemini Flash-Lite + caching + metered tiers; use the owned stack. TypeScript: no new `any`; update types for the new state/element/environment fields. Author only from existing data; flag any needed new data as a TODO rather than fabricating.

## AFTER EACH PART & AT THE END
`npx tsc --noEmit` → 0; `npm run build` → clean; run that part's verify gate; `rm -rf .next` → `vercel --prod --yes`; append "v2 — Part X Results" to `FIXES_COMPLETE_v3.md`; refresh `ASTRYX_SESSION_HANDOFF.md`.

*Out of scope for Claude Code (SHA + Cowork strategy track): trademark ASTRYX, the IP holding-structure/trust, marketing. Server-side containment remains the one in-build IP item.*
