> ⚠ **SUPERSEDED — do not run this file.** Absorbed into **`ASTRYX_DIRECTIVE_S_MEDICAL_ASTROLOGY_ENGINE.md`** (run that instead — it adds the Hill-grounded engine layer R was missing, plus the full experience flow). Kept for reference only.

# ASTRYX — Directive R: Fork Mastery, Somatic Intake & Compliant Comfort
### Claude Code handoff · 2026-06-28 · the "how to use the forks" layer + grounded intake + a compliant Comfort path
**Read with:** `COMPLIANCE.md` (banned phrases, `safePhrase`, `withDisclaimer`, `safetyGate`, `lintForBannedPhrases`, `detectCrisis`, `MICRO_DISCLAIMER`), `ASTRYX_DIRECTIVE_PQ_ASTRYX_UPGRADE.md` (Astryx scope + live sky), `lib/teacher/grounding.ts`, `lib/astryx/persona.ts`, `components/screens/IntakeScreen.tsx`, `components/engine/BodyMap.tsx` + `ChamberBodyMap.tsx`, `components/screens/SessionScreen.tsx`, `lib/dailyTemperature.ts`, `data/` (38 JSON files).

> **Source material:** SHA's two reference books — *Human Tuning* (John Beaulieu) and *Pain Relief with Sound Healing* (LaSol & Lightwalker). We distill the **technique, placement, session-arc, and mechanism** into SHA's own cited JSON (NOT verbatim — copyright). We **firewall every disease/diagnostic claim** (see §F). The nitric-oxide science (Beaulieu + the *Med Sci Monitor* paper, Salamon/Stefano) becomes Astryx's credible, hedged depth.
>
> **Four goals:** (1) make the intake feel **grounded, not pseudo** — somatic + autonomic framing on top of feelings; (2) teach users **how to actually use the forks** (technique); (3) add a **compliant "Comfort & Ease" path** for people seeking pain help, with a named-condition handler + red-flag gate; (4) keep Astryx **compliant without sounding like a lawyer** — structure carries the law, her voice stays human.
>
> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify §G · `rm -rf .next` → `vercel --prod --yes` · append "Part R — Fork Mastery & Compliant Comfort" to `FIXES_COMPLETE_v3.md`. Determinism + compliance gates intact; the LLM never recomputes the deterministic reading.

---

# PART A — GROUND THE INTAKE (somatic + autonomic, so it stops feeling pseudo)

**Where:** `IntakeScreen.tsx` (Resonance Scan + Balance descriptors) + the scoring inputs.

**The problem:** intake is purely emotional → feels floaty/unfalsifiable. **The fix:** add a **somatic/observational layer** on top of feelings (self-reported body states are legal observations, never diagnoses) and frame it through the **autonomic nervous system** (real physiology, hedged).

- **A.1 — Add a body-state dimension to the scan.** Alongside the emotional states, let the user note **where they're holding it and how the body feels**: tension location (shoulders / neck / chest / gut / lower back / none), energy (wired ↔ flat), and a felt **temperature/charge** (cool-calm ↔ hot-activated). Keep it experiential — *"where are you carrying it?"*, *"wound-up or wound-down?"* — never "what's wrong with you." This is Beaulieu's Sounding-Journal lens (where it sits, its temperature, its charge).
- **A.2 — Autonomic framing (the credibility anchor).** Map the wired↔flat axis to the **nervous-system tone** language already implied by `dailyTemperature.ts` (Cool/Warm/Hot). Surface it as: *"Your signal reads activated/settled today"* — a real-physiology frame (sympathetic ↔ parasympathetic), stated as a felt state, never a diagnosis.
- **A.3 — Name the rigor, out loud.** Add one quiet line of credibility framing where the scan begins, e.g. *"Calibration, not prediction — your reading is computed from your actual chart and fixed frequencies; the same inputs always return the same result."* This is the antidote to "pseudo": precision + repeatability.
- **A.4 — Feed the body-state into the engine** so placement/fork suggestions can reference *where* the user holds tension (ties to Part C). No change to the deterministic signal logic — this is an *additional* input lane, not a rewrite. Determinism preserved.

**Verify:** intake now asks where the user holds tension + wired/flat, frames it as nervous-system tone, shows the "calibration not prediction" line; same inputs still yield the same reading.

---

# PART B — "HOW TO USE YOUR FORKS" (the technique canon)

**Create `data/forkTechniqueLibrary.json`** (distilled from both books, SHA's own wording + cited lineage). Surface it in: the **Chamber** (a "How to use this fork" expandable on each fork step) and **Astryx** (she can teach technique on request). Content:

- **B.1 — Activation:** strike the flat side gently on a **soft surface** (silicone puck / palm / knee) — *never* metal, glass, or stone (dulls the tone, mars the fork). A light flick from the wrist; "louder is not better."
- **B.2 — Listening forks (unweighted):** knee-tap → bring 3–6 inches from the ear → listen → switch ears on the next tap → after it fades, sit ~15 seconds with the after-tone.
- **B.3 — Body forks (weighted / Otto-style):** press the **stem** to the point, firm contact, hold until the vibration fades; **twice per spot maximum** ("too much over-stimulates" — this is the nitric-oxide "less is more" point, framed as a comfort guideline).
- **B.4 — The session arc:** **Reception** (settle, breathe) → **Sound** (technique above) → **Stillness** (the "still point" pause) → **Seal** (a closing pass to finish). This validates the chamber's existing breathwork-open / Earth-close bookends — label them as Reception and Seal.
- **B.5 — Self-practice:** with repetition you can hum/recall the tone without the fork — supports "fluency, not dependence."
- **Care:** wipe with a soft dry cloth; keep clean hands; store padded (mirrors the Thank-You/care card).

**Verify:** each chamber fork step has a "How to use this fork" section; Astryx answers "how do I strike/hold this fork?" from the canon.

---

# PART C — FORK PLACEMENT POINTS (body map, comfort-framed)

**Create `data/forkPlacementPoints.json`** — the traditional placement points distilled from the books, framed as **comfort/relaxation/grounding**, never treatment. Wire into `BodyMap.tsx` / `ChamberBodyMap.tsx` (Directive K dual-orbs) and Astryx's "where do I use it?" answers.

- **C.1 — Whole-body comfort points:** sternum (settling/heart-ease), sacrum/low spine (grounding, autonomic settle), third-eye/brow (calming the head), along the spine (grounding resonance), hips/ASIS (release in the pelvis), feet (grounding). Each labeled with the **felt purpose** (calm, ground, settle), not a condition.
- **C.2 — Region language for "where":** when a user asks where to use a fork, Astryx answers with the **body region + traditional comfort purpose + the technique** (Part B) — e.g., "many hold tension across the shoulders; the fork is traditionally applied there for comfort, stem to the muscle, twice at most."
- **C.3 — Honors the Scorpio/pelvic lift + dual-orb** rules from Directive K — no placement on genitals; comfort points only.

**Verify:** Astryx and the body map suggest placement by region with comfort framing; never "place here to treat [condition]."

---

# PART D — THE SCIENCE LAYER (Astryx depth, hedged)

**Create `data/soundScienceCanon.json`** — the credible, citable mechanism, in compliant phrasing. Astryx draws on it for "does this actually do anything?" / "why a fork?"

- **D.1 — Nitric oxide:** "Research suggests fork vibration **may** stimulate nitric oxide, a molecule the body uses to **relax blood-vessel walls and support nervous-system balance**." State the molecule's real role; attach the fork link as *research-suggests*; **never** promise a blood-pressure or disease outcome. Cite Beaulieu's lab work + Salamon/Stefano, *Med Sci Monitor* 2003.
- **D.2 — The Perfect Fifth ↔ balance:** the Otto-128 is the "difference tone" of the C–G Perfect Fifth (384−256=128); the interval long called "perfect balance" maps to the molecule that regulates the body's balance. (Astryx's signature "ancient intuition meets modern science" beat.)
- **D.3 — Autonomic still point:** the sympathetic/parasympathetic "balance point" — framed experientially (settling, easing), research-anchored, no diagnosis.
- **Firewall:** the LaSol "nitrous oxide" mechanism is **wrong and a claim** — do NOT use it; use Beaulieu's nitric oxide only.

**Verify:** "why would a fork do anything?" → Astryx gives the NO + Perfect-Fifth answer, hedged, cited, no disease promise.

---

# PART E — THE "COMFORT & EASE" PATH + named-condition handler + red-flag gate

**The principle:** you don't sell pain relief — you offer **comfort and ease**. Same fork, same placement, compliant promise.

- **E.1 — Comfort & Ease pathway/intention.** Add a comfort lane (intention chip or body-focus): the user notes where they're holding tension → Astryx/engine surfaces the traditional fork + placement (Part C) + technique (Part B) + breathwork, all framed as **relaxation self-care**. Individual tier = general comfort only; never condition-specific.
- **E.2 — Named-condition handler (the key build).** When the user's text contains a **condition word** (sciatica, arthritis, migraine, fibromyalgia, etc. — keep a small list), Astryx auto-runs the **Decouple → Pivot → Route** pattern:
  1. **Decouple:** warmly decline the medical question, hand it to a licensed practitioner.
  2. **Pivot to the body region** via a `conditionBodyMap` lookup (e.g. sciatica → lower back/hips/back of leg) and offer the **comfort practice for that region** — never tied to the named condition.
  3. **Route:** flag that persistent/severe/radiating discomfort deserves a professional, and point to the Practitioner tier.
  - **Net-impression rule:** the reframe must be *genuine* — she actually declines the condition and routes to care; "comfort for the area" is real, not a wink. Reference exemplar (tune to her voice):
    > *"I hear you. I can't speak to sciatica or any medical condition — that's for a licensed practitioner who can assess you. What I can share: many people carry tension through the lower back, hips, and back of the leg, and traditionally the fork is held there for comfort and relaxation — stem to the muscle until the vibration fades, twice at most. Because discomfort that travels down the leg is worth a professional's eye, I'd start there. For hands-on work tuned to you, a verified practitioner can guide it."*
- **E.3 — Pain red-flag gate.** If reported discomfort is severe / sudden / persistent / radiating, or paired with danger signs (chest pain, numbness, injury), Astryx does **NOT** offer a fork "protocol" — she surfaces a calm "this is comfort/relaxation, not treatment; please have that looked at by a licensed professional" message. Same architecture as `detectCrisis` — add a `detectPainRedFlag` sibling.
- **E.4 — Practitioner-gated clinical layer.** The deeper region-by-region placement detail unlocks for the **Practitioner tier** (licensed, carries clinical responsibility) — reuse the existing tier gate. Pain is your strongest upgrade driver; lean into it (no discounting — premium).

**Verify:** "I have sciatica, can forks help, where?" → the decouple-pivot-route answer (comfort for lower back/hips/leg + see-a-pro + practitioner), never a sciatica treatment claim; severe/radiating input trips the red-flag message.

---

# PART F — COMPLIANCE FIREWALL (drop list + human voice)

- **F.1 — Hard-drop, never reword (disease/diagnostic claims from LaSol):** kills viruses/bacteria, cancer, AIDS/HIV, "destroys cells," repairs/rebuilds DNA, diabetes, cholesterol, hypertension/blood-pressure, arthritis, "corrects subluxation," "heals/repairs nerves/tissue/muscle," **diagnosing** anything (stress fracture, tinnitus). These never enter any JSON or any Astryx output. Add the disease/condition terms to `lintForBannedPhrases`/`safetyGate` so they're caught at output.
- **F.2 — Reframe lane (safe, hedged):** comfort, relaxation, grounding, calm, centering, focus, energy/vitality, ease, sleep, sense of well-being — wrapped in "traditionally / many people find / may support / research suggests."
- **F.3 — Compliant but NOT lawyerly.** Structure carries the law so her voice stays human:
  - The **persistent micro-disclaimer footer** (`MICRO_DISCLAIMER`) + the **output guard** (`lintForBannedPhrases`) do the legal work silently.
  - Astryx **speaks like a person** — "for that, someone hands-on can really help you" (a warm route), not a recited disclaimer. No reciting regulations, no "I am not able to provide medical advice per FDA…" robot-speak. One quiet line at the bottom; human warmth on top.

**Verify:** no banned term appears in any new JSON or any Astryx answer; Astryx routes to practitioners warmly, never recites legalese; the micro-disclaimer is present on comfort/pain screens.

---

# PART G — WHAT ASTRYX CAN NOW DO (capability summary) + acceptance test

After this directive, Astryx can: teach **fork technique** (strike/hold/ears/timing/seal); recommend **placement by body region** (comfort-framed); explain the **nitric-oxide / Perfect-Fifth** mechanism (hedged, cited); run the **Comfort & Ease** path; handle a **named condition** with decouple-pivot-route; trip the **pain red-flag gate**; and (with Directive P+Q) read **today's sky** and answer **mundane/medical/frequency** astrology — all in a human voice with the law carried by structure.

**§G — ACCEPTANCE TEST**
1. **"How do I use this fork?"** → technique answer (strike on soft surface, ears/switch, stem-to-point twice max, reception→sound→stillness→seal).
2. **"Where do I place it for tension in my shoulders?"** → shoulders region + comfort framing + technique; no condition language.
3. **"I have sciatica — can these help? where?"** → decouple-pivot-route (comfort for lower back/hips/leg + see-a-pro + practitioner). No sciatica treatment claim.
4. **Severe/radiating/sudden pain input** → red-flag message, no protocol offered.
5. **"Does a fork actually do anything?"** → nitric-oxide + Perfect-Fifth, hedged + cited, no disease promise.
6. **Intake** shows the somatic (where you hold it / wired-flat) dimension + autonomic framing + "calibration not prediction"; same inputs → same reading (determinism).
7. **No banned term** in any JSON or any output; micro-disclaimer present; Astryx never sounds like a lawyer.

## GLOBAL RULES
Distill, never ingest verbatim (copyright). Disease/diagnostic claims hard-dropped (F.1). Wellness/comfort reframed + hedged. Determinism absolute; Astryx explains, never recomputes. Frugal/sovereign (no new paid deps). No new `any`. Premium — no discounting anywhere.

## AFTER
`tsc` 0 → `npm run build` ✓ → verify §G (lead with the sciatica case + "how do I use this fork?") → `rm -rf .next` → `vercel --prod --yes` → append "Part R — Fork Mastery, Somatic Intake & Compliant Comfort (technique + placement + science canon; grounded somatic intake; Comfort & Ease path; named-condition decouple-pivot-route; pain red-flag gate; human-voice compliance)" to `FIXES_COMPLETE_v3.md`.
