# ASTRYX — Directive B.1: Signal Hierarchy & Tiered Audio
### Claude Code handoff · 2026-06-09 · the coherence fix + the three-planet model
**Read with:** `ASTRYX_PRESSURE_TEST_3.md` (the bug), the **Suno Music Library handoff** (the audio canon), `FIXES_COMPLETE_v3.md` (what's live), `COMPLIANCE.md`, `CLAUDE.md`.

> **Order:** do this BEFORE Parts F & G. Each step has a verify gate. `npx tsc --noEmit` → 0, `rm -rf .next` → `vercel --prod --yes`, append results to `FIXES_COMPLETE_v3.md`, refresh `ASTRYX_SESSION_HANDOFF.md`.

---

## THE PROBLEM (Pressure Test #3)
For a fresh Mars-deficiency run, the **subject planet flips between surfaces**: hero + prescription say **Mars**; Cosmic Diagnostic body + Chamber say **Sun** ("SUN DEFICIENCY DETECTED… shift toward Mars character"). The corrective *direction* is consistent (no safety issue) — but the *subject* contradicts itself, and the diagnostic *description* still reads Mars's **excess** archetype ("overheating, rage") to a **depleted** user. Root cause: multiple code paths each compute their own "dominant" and never reconcile.

## THE FIX, IN ONE SENTENCE
Build **one `signalHierarchy {primary, secondary, tertiary}`** in `runEngine`, ranked symptom-weight-first (per Part A), and make **every surface AND every audio layer read from it** — no surface ever computes its own dominant again.

---

## STEP 1 — Build the single source of truth (`signalHierarchy`)
In `runEngine` (after `polarityResults` is resolved), assemble:
```ts
interface SignalTier { planet: string; state: PolarityState; confidence?: ConfidenceBand; role: 'surface'|'root'|'aggravator' }
interface SignalHierarchy {
  primary:   SignalTier            // the symptom-driven dominant (Part A) — what the user feels
  secondary?: SignalTier           // the chart "root" the symptom routes to (existing symptom-routing result)
  tertiary?:  SignalTier           // the current aggravator (top weighted transit / cosmic weather)
}
```
- **Ranking is symptom-weight-first** (Part A's law): `primary` = the planet with the strongest symptom `state_signal` (= today's `dominantPolarity`). Ties break by `chartBias`. Deterministic — no `Math.random`.
- **`secondary`** = the deeper pattern the symptom-routing already finds (e.g. the Sun-Saturn root for "depleted drive"). It is **context/root**, not a competing protocol.
- **`tertiary`** = the highest-weight current transit (already computed for Cosmic Weather).
- Attach `signalHierarchy` to the protocol output. **Every consumer below reads from it. No consumer recomputes "dominant."**

**Verify:** one object, primary = the Part-A dominant, deterministic.

## STEP 2 — Make every TEXT surface read the hierarchy (kills the flip)
- **Hero** — already leads with `primary`. Keep.
- **Cosmic Diagnostic** — headline, **description**, AND action all key to `primary` (planet + state). The **description must be polarity-aware**: a *deficiency* description for a deficiency, NOT the raw excess archetype. (Today the description is the static `medicalAstrology` line — gate it by state, or build it from the same corrective source as the action.) If you surface the root, label it explicitly: *"Beneath it: a {secondary.planet}–… root."* — never as a second "dominant."
- **Chamber** — its "X {STATE} DETECTED" headline + DNA must use `signalHierarchy.primary`, not a recomputed dominant. The chamber and hero must name the **same** planet + state.
- **Prescription** — already corrective (verified live: peppermint for Neptune-excess, ginger for Mars-deficiency). Confirm it reads `primary`; do not regress.
- **Astryx** — pass `signalHierarchy` in the report so it can teach primary → root → aggravator. (Astryx already renders faithfully; just feed it the stack.)

**Verify (Imani Reed · Mars deficiency):** hero, diagnostic headline+description+action, and chamber ALL say **Mars · deficiency · warming**; the Sun-Saturn root appears only as a labeled "root," never contradicting. No "overheating/rage" text on a depleted reading.

## STEP 3 — Extend ChamberDNA for the three tiers
Per the Suno handoff §6:
```ts
interface ChamberDNA {
  seed: number
  primaryPlanet: string;   secondaryPlanet?: string;   tertiaryPlanet?: string   // from signalHierarchy
  applyCorrective: boolean
  polarity: { dominant_state: PolarityState; secondary_state?: PolarityState; tertiary_state?: PolarityState }
}
```
- Fill from `signalHierarchy` (so DNA and text can NEVER diverge).
- **Each tier's state is independent** (primary Mars/exc, secondary Saturn/nat, tertiary Mercury/def). A balanced secondary plays its **NAT** track even while primary is corrected.

## STEP 4 — Wire the hierarchy into AUDIO (two complementary bodies)

**4a · Tone.js (simultaneous = the field).** Feed the existing 8-layer engine from the hierarchy:
- **Layer 1 DRONE** = `primary` planet's **corrective** Hz (the regulator Hz when correcting — keep the existing live-compute).
- **Layer 4 COUNTER** = `secondary` planet's Hz — subordinate drone, low & consonant (the "root hum beneath"). Keep its phase gains low (≤ drone) so it never muddies the de-harshed mix.
- Pulse / Binaural / Solfeggio = primary's character. **Rule 8: do not retune `soundEngine`** — only choose which planet feeds each existing layer.

**4b · Suno (sequential = the journey).** The recorded layer walks the tiers across phases — **but resolves home on the primary** (the guardrail; see below). Per Suno handoff §5–6:
- Selection stays `selectTrackFilename(planet, state, seed)`. **The correction is BAKED INTO THE TRACK** — `MARS_EXC` already sounds like Moon (cooling). **Do NOT double-correct** (never select the corrective planet's NAT track; select the planet's own state track). Deterministic: `Math.abs(seed) % len`.
- Pre-resolve all three tracks in `SoundEngineController` at session start; extend `sunoPlayer` with `crossFadeTo(url, ms)` (3–5 s). `transitAudio.ts` and `soundEngine` untouched.
- **Phase map — RESOLVE-ON-PRIMARY (refinement over the doc's linear plan):**
  - Entry + Activation → **Primary** track (leads; longest, sets the correction)
  - Peak → **Secondary** track (the root revealed)
  - Regulation → **Tertiary** track (a touch — the aggravator named)
  - Integration → **return to Primary** track (lands the user in the corrective direction they came in for)
  - *Rationale:* the doc ended on tertiary, which could leave a user revved up when their primary need was to cool down. Bookending on primary guarantees the session resolves where the symptom asked. If a simpler path is needed, use the §6 playlist split but still **close on primary**.

**Non-negotiables (Suno handoff §7 — verbatim):** Hz from `planetary-anchors.json` only; corrective-planet table canonical; **Mars-excess = zero percussion** (it's baked into the tracks — never override); deterministic selection preserved; `NEXT_PUBLIC_AUDIO_BASE_URL` gates the whole Suno layer (Tone.js still runs without it); track naming `{PLANET}_{STATE}_{NN}` and folder structure fixed.

**Verify (temp `/api/vtest`-style, then delete):**
- Mars-deficiency: DRONE = Mars corrective Hz; COUNTER = secondary planet; Suno plays `MARS_DEF_*` at entry → secondary at peak → tertiary in regulation → **`MARS_DEF_*` again at integration**.
- Mars-excess: opens AND closes on `MARS_EXC_*` (cooling); never ends on an activating tertiary. Zero percussion throughout.
- Determinism: same birth data → identical track choices every run.

## STEP 5 — Tier-gating (light; keep the newcomer clean)
- **Individual:** hero leads `primary` clean + a one-line root hint ("beneath it, a {secondary} root — ask Astryx"). Don't dump the full stack.
- **Practitioner:** show the full ranked `primary / secondary / tertiary` differential + the audio-journey labels. Depth they pay for.

## RECONCILE — do NOT redo
- The Suno doc's **§9 gap** ("prescription cards pull NAT regardless of state") is **already fixed** (v2 Part A/B; verified live). **Verify it's piped from `primary`; do not re-implement.**
- Keep all Part A–E work intact (symptom-driven state, corrective diagnostic, transit audio, Astryx, IA). No regressions.

## GLOBAL RULES
Determinism (no `Math.random` anywhere in chart/protocol/audio selection). Compliance + crisis gates intact; Astryx read-only. IP server-side. TypeScript: extend types for `signalHierarchy` + ChamberDNA tiers; no new `any`. One source of truth — if any surface or layer still computes its own "dominant," it's not done.

## AFTER
`npx tsc --noEmit` → 0; `npm run build` ✓; run the Step-2 and Step-4 verify gates; `rm -rf .next` → `vercel --prod --yes`; append "B.1 — Signal Hierarchy & Tiered Audio" results to `FIXES_COMPLETE_v3.md`; refresh `ASTRYX_SESSION_HANDOFF.md`. **Then proceed to Part F (elements/environment) and Part G (integrated rite).**
