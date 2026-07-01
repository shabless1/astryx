> ⚠ **SUPERSEDED — do not run this file.** Merged into **`ASTRYX_DIRECTIVE_PQ_ASTRYX_UPGRADE.md`** (run that instead). Kept for reference only.

# ASTRYX — Directive Q: Expand Astryx's Scope & Knowledge
### Claude Code handoff · 2026-06-28 · let her reach beyond the canon (without losing the anchor)
**Read with:** `ASTRYX_DIRECTIVE_L_ASTRYX_INTELLIGENCE.md` (the knowledge tiers we're rebalancing + L.8 web stub), `ASTRYX_DIRECTIVE_P_LIVE_TRANSITS.md`, `lib/teacher/grounding.ts` (`SYSTEM_INSTRUCTION` + tier rules), `lib/astryx/persona.ts`, `lib/astryx/modelAdapter.ts`, `lib/astryx/webSources.ts` (L.8 stub), `data/signs.json` + `data/medicalAstrology.json`, `COMPLIANCE.md`.

> **The problem (SHA, live):** asked "does Mercury rule the shoulders?" Astryx said **no** — wrong; Gemini/Mercury rules the **shoulders, arms, hands, fingers**. Asked "which fork for my shoulders?" she rambled about Mars and "use the opposite fork" instead of shoulders → Gemini → **Mercury fork**.
>
> **Root cause:** Directive L fenced her too hard — "canon is the ONLY authority, model knowledge is secondary, never contradict canon." When the canon is silent or narrow, she now **denies well-established astrology**. SHA wants her to **operate beyond the libraries** — full mundane/medical/frequency astrology — because knowledge advances and the canon can't be exhaustive.
>
> **The fix:** rebalance the knowledge hierarchy (canon = anchor, not cage), give her an explicit body-part→fork reasoning chain, optionally enrich the body-rulership data, add the curated web tier, and run a capable model. **Model stays OpenAI** (SHA's choice). Citations stay **on-request only** (do NOT reinstate the per-answer source scroll — already removed).
>
> **Gating:** `tsc` 0 · `npm run build` ✓ · verify Q.7 · `rm -rf .next` → `vercel --prod --yes` · append "Part Q — Expanded Scope" to `FIXES_COMPLETE_v3.md`. Compliance intact; LLM still never recomputes the deterministic reading.

---

## FIX Q.1 — Rebalance the knowledge hierarchy (the core change)

**Where:** `SYSTEM_INSTRUCTION` / tier rules in `grounding.ts` + `persona.ts`.

**Replace the "canon is the only authority" framing with this balance:**
- **Astryx is a fully knowledgeable astrologer.** She uses her complete, established astrological and medical-astrology knowledge **freely** — mundane, natal, medical, frequency. She does **not** deny a well-known correspondence (e.g. Mercury/Gemini → shoulders, arms, hands, fingers) simply because the canon didn't list it. **Build on the canon; never be caged by it.**
- **The canon remains AUTHORITATIVE for Astryx's proprietary specifics** — the Cousto fork Hz, the Lotus Spectrum, the exact 5-sense protocol logic, the cell-salt/botanical/crystal mappings she ships. For *these*, the canon wins.
- **When the canon is silent or thinner than established astrology, use established knowledge** and say so plainly ("classically, Mercury also governs the shoulders and arms…"). When the canon and a fringe/contested claim conflict, prefer the canon. Never present speculation as fact.
- Keep the determinism rule (she explains, never recomputes the protocol) and **all compliance gates** (probabilistic framing, no diagnosis, no prediction-as-fact, defer health decisions to the licensed practitioner). Wider knowledge, same safety.

**Verify:** "does Mercury rule the shoulders?" → **yes**, with the Gemini/Mercury body rulership, confidently.

## FIX Q.2 — Body-part → fork reasoning chain (fix the bad fork answers)

**Where:** the route's answer guidance / `SYSTEM_INSTRUCTION`.

Give Astryx an explicit chain for "which fork for [body part / region / symptom]?":
1. body part → its **ruling sign(s)** (medical astrology),
2. sign → its **ruling planet**,
3. planet → **that planet's fork** (Cousto Hz from canon),
4. if that planet is **overstimulated** in the user's chart → lead with its **counterweight/regulator** (never-amplify), else the planet itself.

Example she should now get right: *shoulders → Gemini → Mercury → the Mercury fork* (with the counterweight only if Mercury is excess/blocked for that user). No more "my Mars is placed, use the opposite."

**Verify:** "which fork for my shoulders?" → Mercury fork, with the shoulders→Gemini→Mercury reasoning.

## FIX Q.3 — Enrich the body-rulership data (targeted, secondary)

**Where:** `data/signs.json` / `data/medicalAstrology.json` body-region fields.

Audit the sign→body-region and planet→body-region maps for **completeness** so both the engine and canon-grounded answers are accurate — e.g. **Gemini = shoulders, arms, hands, fingers, lungs, nervous system**; verify the other 11 against standard medical astrology. (Q.1 covers gaps via model knowledge, but the underlying data should still be correct since the engine uses it for placement/scoring.)

**Verify:** the body maps list shoulders/arms/hands under Gemini; spot-check a few others.

## FIX Q.4 — Credible online sources (curated web tier)

**Where:** activate `lib/astryx/webSources.ts` (the L.8 stub) + flag.

- Turn on a **curated web retrieval tool**, locked to SHA's **allowlist** (confirmed 2026-06-28): **medical/physiology** (PubMed, NIH, .gov/.edu), a **live ephemeris / sky-data source**, and **established astrology/herbal references**. Gate with `ASTRYX_WEB_ENABLED=true`.
- Use it for **currency + citable depth** (new research, current mundane-astrology context) — **on top of** her un-fenced knowledge, not as the primary source.
- Whatever the web returns is **fenced + compliant** (probabilistic, no diagnosis) and subject to the same output guard. **Allowlist only** — never the open web (its astrology content is unreliable and would degrade her).

**Verify:** with the flag on, a question that benefits from current sources pulls from an allowlisted domain; with it off, she still answers from knowledge + canon.

## FIX Q.5 — Run a capable model (the "go deep" lever)

**Where:** `lib/astryx/modelAdapter.ts` (OpenAI provider).

Point the OpenAI provider at a **GPT-4-class model** (current strong general model), not the cheapest `mini`, so Astryx has the depth SHA wants. Keep it in one config constant. **Note for SHA (not a code task):** the app bills OpenAI **API** tokens via the API key — this is separate from the $20 ChatGPT **Plus** subscription (Plus does not grant API access). A capable model is still only pennies per conversation.

**Verify:** a deep, multi-part astrology question gets a substantive, accurate answer.

## FIX Q.6 — Citations on request, not auto

**Where:** the route / answer formatting.

Do **NOT** reinstate the per-answer source scroll (already removed). Astryx may attribute briefly in-line when natural, and **offers references only when the user asks** ("want my sources?"). Keep answers clean.

**Verify:** answers have no trailing reference list by default; asking "what are your sources?" yields them.

## FIX Q.7 — Acceptance test (SHA's exact cases)
1. **"Does Mercury rule the shoulders?"** → Yes — Gemini/Mercury governs shoulders, arms, hands, fingers (confident, not a denial).
2. **"Which fork for my shoulders?"** → Mercury fork, via shoulders→Gemini→Mercury (counterweight only if Mercury is overstimulated for that user).
3. **A deep / beyond-canon astrology question** → substantive answer using established knowledge, not "that's not in my library."
4. **No auto-citation scroll**; references appear only when asked.
5. **Compliance** intact: probabilistic, no diagnosis/prediction-as-fact, practitioner deferral; canon still authoritative for the proprietary Hz/Lotus/protocol specifics.

---

## GLOBAL RULES
- Canon = anchor for proprietary specifics; model's full knowledge is welcome everywhere else. Never deny well-established astrology for lack of a canon entry; never present speculation as fact.
- Model stays **OpenAI/GPT** (capable tier). Web = **allowlist only**, fenced, compliant. Sovereignty/data-minimization (L.7) still applies to anything sent out.
- Determinism for the engine is absolute; Astryx explains, never recomputes. No new `any`.

## AFTER
`tsc` 0 → `npm run build` ✓ → verify Q.7 (lead with "does Mercury rule the shoulders?") → `rm -rf .next` → `vercel --prod --yes` → append "Part Q — Expanded Scope (canon as anchor not cage; body-part→fork reasoning; body-rulership data; curated web tier; capable model; citations on-request)" to `FIXES_COMPLETE_v3.md`.
