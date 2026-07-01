# ASTRYX — Directive F & G: Elements, Environment & The Integrated Rite
### Claude Code handoff · 2026-06-09 · the final two of v2 (+ a small B.1 cleanup)
**Read with:** `ASTRYX_DIRECTIVE_B1_SIGNAL_HIERARCHY.md`, `ASTRYX_MASTER_BUILD_DIRECTIVE_v2.md` (Parts F & G), the Suno handoff, `FIXES_COMPLETE_v3.md`, `COMPLIANCE.md`, `CLAUDE.md`.

> **Order:** B.1-cleanup → F → G. Each step gated. `npx tsc --noEmit` → 0, `npm run build` ✓, `rm -rf .next` → `vercel --prod --yes`, append to `FIXES_COMPLETE_v3.md`, refresh `ASTRYX_SESSION_HANDOFF.md`.

**The laws carry:** determinism (no `Math.random`); no medical claims (probabilistic framing + disclaimer + crisis gate everywhere, Astryx read-only); **never amplify on every layer — including the environment**; one source of truth (`signalHierarchy`); IP server-side; Rule 8 (don't retune `soundEngine`); `NEXT_PUBLIC_AUDIO_BASE_URL` gates the Suno layer.

---

## B.1 CLEANUP (do first — two small threads Pressure Test #3.1 surfaced)
**1. Unify the Symptom-Routing "What To Do" block.** It still prints the *routed planet's own* fork (e.g. "126.22 Hz Sun fork, Red Lotus, citrine") while the primary prescription correctly calibrates toward the regulator (e.g. Mars 144.72 Hz). Same warming direction, contradictory Hz. Route that block's action through the **same `CorrectiveProtocol` / regulator** the primary uses, so its tone/herb/crystal match the primary. (One more surface reading the single source of truth.)

**2. Keep the tapped planet visible in the stack.** When the engine routes a tapped symptom to a different primary (user tapped a **Mars** card → primary resolved to **Sun**), the literal reported planet vanished from the SignalStack. Show the bridge: the `SignalStack` / symptom-routing must surface *"You reported a Mars signal → it traces to a Sun–Saturn root."* Keep the smart routing; just never drop the planet the user actually tapped. **Verify:** tap-Mars→primary-Sun run shows Mars→Sun explicitly.

---

## PART F — Elements, Qualities & Environment
**Concept:** every sign already encodes an **Element** (Fire/Earth/Air/Water), a **Polarity** (projective/masculine · receptive/feminine), and a **Modality** (cardinal/fixed/mutable). Fold them in as the **setting and manner** of the rite — and route them through the correction so they obey *never amplify*. The app **suggests**; the user dials immersion.

**Build:**
1. **Derive a corrective element/polarity/modality from the existing correction** (reuse the regulator — don't invent):
   - **Corrective element = the element of the primary's regulator planet** (from `signs.json`/`elements.json`). Mars-excess → regulator Moon = **Water** (cooling). Sun-deficiency → corrective Mars = **Fire** (warming). This guarantees it points toward balance.
   - **Polarity (posture) follows that element:** Fire/Air → projective (active, outward); Water/Earth → receptive (still, inward).
   - **Modality (tempo)** from the primary planet's sign modality (`modalities.json`): cardinal → *initiate*; fixed → *hold/sustain*; mutable → *flow/release*.
   - Add `element`, `polarity`, `modality` to the protocol output, keyed off `signalHierarchy.primary` + its correction. Deterministic. If a corrective-element field is missing, derive from the regulator's element — **do not fabricate**.
2. **Translate to SUGGESTIONS (an optional "Set your space" card), never commands** — framed *"if you can…"*:
   - **Element → setting:** Water → near still water / a quiet bath; Fire → sunlight, a hearth, a candle; Air → a hilltop, an open window, a breeze; Earth → a park, barefoot on the ground, under a tree.
   - **Modality → tempo:** Cardinal → *begin and set intention*; Fixed → *hold and sustain*; Mutable → *let it flow and dissolve*.
   - **Polarity → posture:** projective → *active, reaching outward*; receptive → *still, receiving inward*.
3. The environment is a **frequency-carrier** and slots into the substitution logic (Part G): tea **OR** oil **OR** simply go sit by the water — three doors, one corrective frequency.
4. Render on Results (and inside the rite) as the **"Set your space"** invitation. Tier note: Individual gets the one-line setting + posture; Practitioner can see element/polarity/modality named with their astro source.

**Verify:** Mars-excess (cooling) → suggests **water/earth**, receptive posture — **never fire**. Sun/Mars-deficiency (warming) → suggests **sun/warmth/fire**, projective posture — never cold water. Every suggestion reads as an invitation; element/polarity/modality trace to the chart **and** the corrective direction.

---

## PART G — The Integrated Rite (assembly & substitution)
**Concept:** not five features and a timer — **one ceremony** the user *prepares for* and *steps into*, built from the tools they own, set in their own space, resolving home on the primary.

**Build:**
1. **"Prepare your rite" step before Enter Chamber** (a pre-chamber screen or a section atop the chamber flow):
   - **Brew your tea** — the corrective blend (from the primary prescription) — *to have with you.*
   - **Ready your fork** — the **primary** planetary fork the rite calibrates (owned forks only, per Part C2; Earth tone is app-played).
   - **Set your space** — the Part F elemental invitation.
2. **Substitution logic, made explicit and inline** — within any sense layer, if the user lacks the tool, offer the alternative so a missing item never breaks the rite:
   - No tea? → *reach for the aromatherapy oil to connect with the same frequency.*
   - No fork? → *the app tone carries it; strike along when you can.*
   Surface the alternative right on the card.
3. **Carry it through the Chamber steps** so sound (app tone + their fork), taste (tea or oil), body (breath/posture), sight (color/geometry), **setting** (their environment), and mind (Astryx) read as **one act tuned to one corrective frequency** — and the session **opens and closes on the primary** (B.1 resolve-on-primary), so they leave in the corrective direction they came in for.
4. Keep it an **invitation, not a checklist** — the user authors how immersive it goes (a glass of water on the desk, or the riverbank).

**Verify:** the flow reads *prepare → set space → enter* as a single rite; a user without the tea is offered the oil inline; nothing asks for a tool they can't own (ties to Part C2); the chamber arc resolves on the primary; determinism + compliance intact.

---

## GLOBAL RULES (carry)
Determinism everywhere. Compliance + crisis gate on every surface, Astryx included; preserve all safety notes (Malachite, Blue Lotus/MAOI, cell-salt lactose). `signalHierarchy` remains the one source of truth — element/environment/rite all derive from `primary` + its correction. Author only from existing data (`elements.json`, `modalities.json`, `signs.json`, `remedyPolarity.json`); flag any missing mapping as a TODO, don't fabricate. TypeScript: extend types for `element/polarity/modality`; no new `any`. Rule 8; env gate.

## AFTER
`npx tsc --noEmit` → 0; `npm run build` ✓; run the B.1-cleanup, F, and G verify gates; `rm -rf .next` → `vercel --prod --yes`; append "F & G + B.1 cleanup" results to `FIXES_COMPLETE_v3.md`; refresh `ASTRYX_SESSION_HANDOFF.md`.

**With F & G landed, v2 is complete** — the body is whole: present state asks the question, the fixed chart is the key, medical astrology is the language, one ranked signal drives words + tone + music, the six senses + the elemental setting are the rite, the user owns the depth, and Astryx is the voice. Send it to the cooker.
