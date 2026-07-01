# ASTRYX — Directive H: The Session Protocol (the Chamber, rebuilt)
### Claude Code handoff · 2026-06-09 · the rite itself — the product everyone pays for
**This is the most important directive in the build.** The engine and the reading are right; the **chamber is the weakest part** and it's what a subscriber experiences every day and what a practitioner sells. SHA's verdict from live use: *the session doesn't make sense — same song loops, the tone drowns the music, a major life event won't open, and "running hot" is said about planets that don't run hot.* Fix the experience, then make the chamber a real **service**.

> **Order:** H.0 fixes first (they're felt immediately), then H.1 the protocol rebuild, then H.2 tiering/service. Gated. `tsc` 0 → build ✓ → `rm -rf .next` → `vercel --prod --yes` → append to `FIXES_COMPLETE_v3.md`.

**The vision this serves:** the Chamber is a **planetary-fork tuning rite** — the app carries the field (music + the current fork's tone + breath + visual) while the user/practitioner strikes the real forks. It sequences **all 10 forks, dwelling longest on the corrective main 3**, and **everyone gets the chamber effect** (individual self-guided; practitioner runs it as a billable service).

---

## H.0 — EXPERIENCE FIXES (do first)

**1. Music over tone — invert the mix.** Today `sunoPlayer.ts` is documented to keep the **synthesis foreground** (`SUNO_LEVEL = 0.80`, music master 0.7) while `soundEngine` master = 0.55 — so the pure tone drowns the music. **Flip it:** the **Suno music is the foreground (loudest layer)**; the Tone.js synthesis (the corrective Hz) is the **grounding underlayer**, felt not blasting. Raise the Suno effective level and/or lower the synthesis master so music clearly leads. Update the now-wrong comment. (This is a mix-balance change to master levels — not a retune of the Suno wiring; Rule 8 intact.)

**2. The sound must move with the session — kill the loop.** The 10 *steps* (user clicks "next") and the 5-phase *audio* (time-driven) are decoupled, so advancing a step doesn't change the sound. **Bind the audio to progression:** when the session advances to a fork, its **tone** (that planet's Hz) rises underneath, and the **music** cross-fades along the tier journey (`crossFadeTo` already exists — it just isn't driven by step/phase advance). Nothing repeats because the rite is actually moving.

**3. Planet-true language + matching corrective verb.** "Running hot / running low" is a *fire* metaphor wrongly applied to all ten planets — and you can't "cool" a planet that was never hot. Give each planet **state-appropriate language** and a corrective verb that matches the regulator's **element**:
   - Fire (Mars/Sun) excess → *running hot / inflamed* → **cool, calm**
   - Air (Mercury/Uranus) excess → *running fast / scattered / wired* → **settle, slow, ground**
   - Earth (Saturn/Venus⊕) excess → *heavy / rigid / walled-in* → **soften, release, lighten**
   - Water (Moon/Neptune) excess → *flooded / foggy / dissolved* → **clarify, contain, ground**
   - Deficiency = *under-resourced / depleted* → **build, warm, strengthen**; Blocked = *stuck / frozen* → **mobilize, free**.
   Drive the felt-language and the verb from `PLANET_ELEMENT` + state — **never default to hot/cool**. (Reuse the Part-F element map you already built.)

**4. Recognize the landmarks — Saturn Return especially.** A transiting **Saturn conjunct natal Saturn** (~age 29–30 / 58–59) is a once-in-~29-years reckoning — the app must **detect and elevate it**, not bury it as a generic transit. Add a `lifeEvent` flag in the transit/cosmic-weather builder for: **Saturn Return**, Saturn→natal Sun/Moon, **Jupiter Return** (~12y), **Nodal Return** (~18.6y), Chiron Return (~50y). Surface a distinct, weighted card ("⚠ Saturn Return — a structural reckoning that comes roughly once every 29 years"). **And fix the dead card:** the **whole card** must open its protocol modal (not only a small "View Protocol" link) — verify the click handler fires on every card, including the first.

**Verify H.0:** in the chamber, music is clearly louder than the tone; advancing changes the sound; a Mercury-excess reading says "scattered/wired → settle," never "hot → cool"; a chart in Saturn-Return age shows an elevated Saturn-Return card that opens on click.

---

## H.1 — THE SESSION PROTOCOL (rebuild `SessionScreen` + audio wiring)
**The session is a planetary-fork tuning rite. Sequence all 10 forks, weighted to the corrective main 3, carried by the app's field, resolving home on the primary.**

1. **All 10 forks, not "dominant + grounding trio."** Replace `sessionForks` (currently dominant planets + a grounding trio) with the **full 10 planetary forks**, ordered as a corrective arc:
   - **Open** — a grounding fork (settle in).
   - **Supporting 7** — brief passes (short holds).
   - **Main 3** — the `signalHierarchy` primary/secondary/tertiary, **held the longest** (the heart of the rite), resolving on the **primary** last.
   - No "Earth Day fork" to *hold* (Part C2): the Earth tone is **app-played**; the close pairs it with an **owned planetary fork** (the primary).
2. **Each fork step delivers:** which fork, its Hz, **application** (see constraint below), and a **hold timer** scaled to the session duration. The app **plays that fork's tone** underneath the music so the user tunes their physical fork to it. Main-3 holds are multiples of the supporting holds.
3. **Carried flow, not a click-through.** Drive the session on a **timeline** synced to the chosen duration: fork holds auto-advance with a gentle cue ("strike now… hold… release… next fork"), the **music** evolves along the tier journey, the **tone** marks each fork, the **breath pacer** runs the corrective rhythm, the **visual** (sacred geometry, corrective colors) breathes through the 5 phases, and it **resolves on the primary**. The user *follows*; they don't operate a wizard. (Keep a manual "linger / next" for those who want it — but the default is carried.)
4. **Duration scaling** (`durationPresets`): the protocol stretches/compresses fork-hold times to fit.

**Fork application keys to the SET the user owns (resolved):**
   - **Unweighted (aluminum · Individual)** → **field / ear / around-the-body / light contact.** Never instruct deep on-body pressure an unweighted fork isn't built for.
   - **Weighted (steel · Practitioner)** → **on-body point application** — the deep, penetrating contact (the steel set's whole purpose). SHA's next production run makes the **steel forks weighted**, so the on-body protocol is *real*, not hypothetical.
   - The app guides application by **set type** (weighted vs unweighted): default by tier (Individual = aluminum/unweighted, Practitioner = steel/weighted), with a simple "which set do you have?" toggle so a user with either set gets the right instructions. Current (pre-weighted) steel owners get field/light-contact guidance + a note that on-body unlocks with the weighted set.

**Verify H.1:** a session steps through all 10 forks with the main 3 held longest; each fork's tone plays as it's cued; music leads and evolves; the rite resolves on the primary; nothing loops; determinism preserved.

---

## H.2 — TIERING: the self-guided rite vs the billable service
**Everyone gets the chamber effect.** The difference is depth and length, not access.

- **Individual — 15-minute condensed rite (self-guided, carried).** The **main 3 forks** with real holds + a grounding open/close (the supporting 7 are touched lightly or summarized). Light Astryx guidance. They enter, breathe, follow, and leave in the corrective direction. No operating required.
- **Practitioner — 60-minute-plus full protocol (a service they deliver).** **All 10 forks**, generous holds, **body-point application map per fork**, **pacing controls** (pause / extend / skip / repeat a fork), **session notes**, the clinical trace (signal hierarchy, states, regulator), and a **printable/shareable protocol sheet**. Designed so a **massage therapist, Reiki practitioner, or energy healer** can run it on a client — standalone or folded into their existing service — and **bill for it**. This is the steel-set's reason to exist and a real revenue line.

**Verify H.2:** Individual chamber = 15-min, main-3, carried, complete on its own; Practitioner chamber = 60-min+, all 10, body-point map + pacing + notes + printable sheet; both feel like one continuous rite, not a slideshow.

---

## GLOBAL RULES
Determinism (no `Math.random` in sequence/audio/timing). Compliance + crisis gate + safety notes intact; Astryx read-only. **Mix change touches master levels only**, not the Suno selection wiring (Rule 8 spirit honored). `NEXT_PUBLIC_AUDIO_BASE_URL` gates the music. Honor `signalHierarchy` as the one source of truth for the main 3. Author from existing data (`sacredTones_nervousSystem.json` forks, `planetary-anchors.json` Hz, the Part-F element map); flag any missing mapping as a TODO. TypeScript: no new `any`.

## AFTER
`tsc` 0; `npm run build` ✓; run the H.0/H.1/H.2 verify gates (entering a real session, not just reading); `rm -rf .next` → `vercel --prod --yes`; append "Part H — Session Protocol" to `FIXES_COMPLETE_v3.md`; refresh `ASTRYX_SESSION_HANDOFF.md`. **When this lands, the chamber finally is the rite the rest of the app has been promising.**
