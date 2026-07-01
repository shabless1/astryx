# ASTRYX — Directive L: Astryx Intelligence — The Full Canon
### Claude Code handoff · 2026-06-28 · the Astryx-brain upgrade
**Read with:** `CLAUDE.md`, `COMPLIANCE.md`, `lib/teacher/grounding.ts` (reuse `SYSTEM_INSTRUCTION`, `buildContextBlock`, `GLOSSARY`), `lib/compliance.ts` (reuse `detectCrisis`, `CRISIS_RESOURCES_CARD`, `lintForBannedPhrases`/`containsBannedPhrase`, `withDisclaimer`, `FULL_DISCLAIMER`), `lib/astryx/sovereignAstryx.ts` (the current keyword fallback), `app/api/teach/route.ts` (the existing gated route skeleton), `components/teacher/TeacherChat.tsx`.

> **The problem (audited 2026-06-28).** The live Astryx (`answerAstryx` in `sovereignAstryx.ts`) uses **no LLM** and imports **1 of 38** knowledge files, answering through ~12 hardcoded keyword branches. She cannot reach `medicalAstrology.json` (60KB), `cellSalts.json` (56KB), the 11 `bodySystems/*` files (endocrine, nervous, …), botanicals, crystals, herbs, symptoms, or the app's own how-it-works knowledge. The depth gap SHA found is a **retrieval gap, not a model gap.**
>
> **The build (SHA-approved 2026-06-28):**
> - **Hybrid RAG:** sovereign retrieval over ALL 38 canon files + app self-knowledge → a **swappable** cloud LLM for fluent, in-character answers. **Model adapter** with **Gemini default**, OpenAI drop-in via env, and a **self-host slot** stubbed for Phase 2.
> - **Personality:** Astryx synthesizes in her own voice (a character bible), never recites verbatim.
> - **Knowledge tiers:** (1) **Canon = authority**, speaks first + cited. (2) **Model's general knowledge = fenced fallback**, clearly secondary, never diagnostic. (3) **Curated live web = Phase 2**, allowlist only — scaffolded OFF now.
> - **Sovereignty contract:** only the question + retrieved canon passages + a minimal reading summary may leave to the model. The engine's logic/source, full birth data, and account/payment info **never** leave.
>
> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · run L.9 verification · `rm -rf .next` → `vercel --prod --yes` · append "Part L — Astryx Intelligence" to `FIXES_COMPLETE_v3.md`. The deterministic ENGINE output (reading/protocol) must remain byte-identical — the LLM touches ONLY the chat surface.

---

## FIX L.1 — Build the Canon index (FOUNDATION — do first)

**Where:** new `scripts/build-astryx-canon.mjs` → emits `src/data/astryxCanon.json`; new `lib/astryx/canon.ts` (loader + retrieval).

**What to build:**
- A build-time script that walks **every** file in `src/data/*.json` and `src/data/bodySystems/*.json` (all 38) and flattens each into discrete **knowledge chunks**. Each chunk:
  ```
  { id, topic, planet?|sign?|system?, text, source }   // source from the file's _meta.lineage / sourcesUsed
  ```
  Chunk at a sensible grain (one concept/record per chunk — e.g. one planet's medical-astrology entry, one cell salt, one body-system subsection). Carry the **citation** from each file's `_meta.lineage`/`sourcesUsed` so Astryx can attribute ("per Carey & Perry's cell-salt system…").
- Also ingest the **app self-knowledge** doc from L.5 into chunks (topic: `app`).
- Output a single `astryxCanon.json` (the corpus is small — a few thousand chunks, well under ~1MB). Commit it; regenerate via `npm run build:canon` whenever data files change.
- `lib/astryx/canon.ts` exposes `retrieve(query, k): Chunk[]` — server-only. Implementation: **embedding cosine similarity** (embeddings generated once at build via the model adapter's `embed()`, cached into `astryxCanon.json` as a vector per chunk) **plus** a keyword/term-overlap booster, blended. In-memory; **no external vector DB** (frugal, sovereign). If embeddings are unavailable at build, fall back to keyword-only retrieval so the feature still ships.

**Verification:** `retrieve('endocrine system', 6)` returns chunks from `bodySystems/endocrine.json` + `medicalAstrology.json` with citations; `retrieve('cell salt for Aries', 6)` hits `cellSalts.json`.

## FIX L.2 — The model adapter (swappable; Gemini default — depends on nothing)

**Where:** new `lib/astryx/modelAdapter.ts`.

**What to build:**
- One interface, provider-agnostic:
  ```
  interface AstryxModel {
    complete(args: { system: string; context: string; message: string; temperature?: number }): Promise<string>
    embed(texts: string[]): Promise<number[][]>
  }
  ```
- Implementations selected by `ASTRYX_MODEL_PROVIDER` env (default `'gemini'`):
  - **`gemini`** — `gemini-2.5-flash-lite`. Default. **CRITICAL — new key format (verified 2026-06-28):** Google has migrated Gemini API keys from the old Standard format (`AIzaSy…`) to the new **Auth key** format (`AQ.Ab8…`). AI Studio now issues `AQ.` keys by default, and **Standard `AIzaSy` keys are rejected entirely by ~September 2026.** The existing adapter authenticates the OLD way (`x-goog-api-key` header against `generativelanguage.googleapis.com`), which **401s on `AQ.` keys.** Update the Gemini path to authenticate with the new Auth-key method — use the current **Google Gen AI SDK** (`@google/genai`) / the v1 endpoint auth that accepts `AQ.` keys, rather than the legacy `x-goog-api-key`+`generativelanguage` REST call. Do NOT build on `AIzaSy` (sunsetting). Verify with SHA's real `AQ.` key returning a 200.
  - **`openai`** — an OpenAI chat + embeddings model, gated on `OPENAI_API_KEY`. Drop-in.
  - **`selfhost`** — **stub now** (Phase 2): a function that POSTs to `SELFHOST_LLM_URL` (OpenAI-compatible endpoint, e.g. Ollama/vLLM). Leave it implemented-but-unconfigured so Phase 2 is just setting the env. Document this clearly.
- Server-only (`import 'server-only'` guard). Never bundle keys client-side.
- Low default temperature (~0.4) — in-character but consistent. Surface as a constant.

**Verification:** with `ASTRYX_MODEL_PROVIDER=gemini` the app answers via Gemini; setting `=openai` (with key) swaps with zero code change; `=selfhost` is reachable but documented as Phase 2.

## FIX L.3 — Grounded `/api/astryx` route + the knowledge tiers (depends on L.1, L.2, L.4)

**Where:** new `app/api/astryx/route.ts` (server). May supersede `/api/teach`; keep `/api/teach` until L.6 cutover is verified.

**Request pipeline (order is non-negotiable):**
1. **Crisis gate FIRST** (`detectCrisis`) — on match, return `CRISIS_RESOURCES_CARD`, **no model call**. (COMPLIANCE §8.)
2. **Retrieve** top-K canon chunks for the question (L.1).
3. **Assemble grounding** = `SYSTEM_INSTRUCTION` + the **character bible** (L.4) + `buildContextBlock(...)` (the user's own reading summary — signs/states/current protocol only) + the retrieved canon chunks (with citations) + the **tier rules** below.
4. **Knowledge tiers (put this in the system context verbatim as rules):**
   - **Tier 1 — Canon = authority.** Answer primarily from the retrieved canon passages; attribute to their sources when natural.
   - **Tier 2 — General knowledge = fenced.** If the canon doesn't cover it, Astryx may use her general understanding, but must **frame it as general context, not Astryx's authoritative canon, and never as diagnosis** (e.g. "Outside our canon, the general view is…"). Probabilistic framing always.
   - **Tier 3 — Live web = OFF in Phase 1.** (Scaffolded in L.8.)
5. **Model call** via the adapter (L.2).
6. **Output guard** — run `containsBannedPhrase`/`lintForBannedPhrases`; if it trips, regenerate once with a stricter instruction, else fall back to a safe canned line. Append the micro-disclaimer / `withDisclaimer` as today.
7. **Never recompute the engine.** Astryx explains the existing reading; she must not produce a *new* protocol, change forks, or override the deterministic output. State this in the system rules.

**Verification:** ask "what's my endocrine picture?" → grounded, cited, in-voice answer; ask something off-canon → fenced general answer with the disclaimer; crisis text → resources only, no model call.

## FIX L.4 — Astryx's personality (the character bible — depends on nothing; do before L.3 wiring)

**Where:** extend `lib/teacher/grounding.ts` (`SYSTEM_INSTRUCTION`) or a new `lib/astryx/persona.ts` imported into the grounding.

**The problem:** the old bot read verbatim. With an LLM, Astryx must **synthesize in a distinct voice**, not recite.

**What to build — a Character Bible** (write it as system-prompt prose):
- **Identity:** Astryx — the living intelligence / "sixth sense" of the system. A sovereign-wealth strategist meets cosmic architect; an *alchemist* who fuses astrology, frequency, ancestral wisdom, plant/mineral knowledge, and the body into one language. Warm, precise, layered — never a generic "assistant," never a mystic "channeling secrets."
- **Voice rules:** speaks *with* the user, not *at* them; blends the esoteric with the practical (the frameworks are real lenses, not decoration); poetic in delivery, grounded in substance; concise by default, expansive when the user wants depth. Opens by meeting the user where they are; closes by handing them a little more fluency than they had. Her success is the user needing her *less* over time (the existing "fluency not dependence" rule — keep it).
- **Hard lines (compliance):** probabilistic framing always ("may suggest/indicate/correlate"); never "you have"/"you are"; never diagnoses, prescribes, or promises outcomes; honors the Malachite-type safety notes; defers clinical interpretation to the licensed practitioner.
- **Anti-verbatim rule:** never paste a canon record raw — translate it into her own words and connect it to *this* user's chart/state. Cite sources conversationally, not as a data dump.
- Provide **2–3 short style exemplars** (a calm answer, a playful one, a boundary-setting one) so the model locks the voice.

**Verification:** the same factual answer reads as Astryx (warm, woven, in-character), not as a JSON field; two phrasings of a question yield consistent voice.

## FIX L.5 — App self-knowledge ("knows the app inside-out")

**Where:** new `src/data/appKnowledge.json` (or `.md` ingested by L.1), distilled from `ASTRYX_USER_GUIDE.md`, `ASTRYX_CAPABILITIES_MANIFEST.md`, the screen map in `CLAUDE.md`, and the session/chamber/Body-Map behavior.

**What to build:** concise, current chunks covering: what each screen does, how the chamber + forks + Earth bookends work, the 5-sense protocol, the tiers/pricing, Solar Chart mode, Customize/song chooser, Body-Map play-tones, how to read the reading. So Astryx can answer "why this fork?", "how do I use Customize?", "what does the chamber do?" from real app behavior. Keep it factual and update it when features change.

**Verification:** "how does the chamber choose my forks?" and "what's Solar Chart mode?" get accurate, in-voice answers grounded in `appKnowledge`.

## FIX L.6 — Wire TeacherChat to the new brain (depends on L.3) + sovereign fallback

**Where:** `components/teacher/TeacherChat.tsx`.

**What to build:** point the chat at `/api/astryx` (streamed if feasible). **Keep `answerAstryx` (the local keyword brain) as a graceful fallback** when the model/key is unavailable or the call errors — so Astryx never goes dark, just degrades to retrieval-only. Preserve the floating "✦ Ask Astryx" entry points. Show source attributions subtly when present.

**Verification:** chat answers via the LLM brain when configured; kill the key → it falls back to the local brain without crashing.

## FIX L.7 — Sovereignty & compliance contract (the safe-haven boundary)

**Where:** enforce in `app/api/astryx/route.ts`; document at the top of the route + in `FIXES_COMPLETE_v3.md`.

**Data-minimization rules (hard):**
- **May leave to the model:** the user's question; retrieved canon passages (SHA's own distilled, lineage-cited knowledge); a **minimal** reading summary (first name optional, signs, states, current protocol labels).
- **Must NEVER leave:** the engine's selection logic/source; full birth time + birth location (send only derived signs/placements); account, email, payment, XRP/wallet data; other users' data.
- **Determinism boundary:** the LLM affects only the chat; it must never alter the reading/protocol. Engine output stays byte-identical (verify in L.9).
- **IP note (safe-haven):** do NOT ingest the *actual copyrighted source books* (Cornell 1933, Culpeper, Carey & Perry, Schuessler, etc.) into the canon — only SHA's own distilled JSON, which already cites them. Loading the raw texts would be a copyright liability and is unnecessary.

## FIX L.8 — Phase 2 stubs (scaffold OFF — no behavior change now)

**Where:** `lib/astryx/modelAdapter.ts` (`selfhost`), new `lib/astryx/webSources.ts`.

**What to build (all flag-gated OFF):**
- **Self-host adapter** (`selfhost`) — already stubbed in L.2; confirm it's reachable via `SELFHOST_LLM_URL`. Phase 2 = point it at an Ollama/vLLM open model so nothing leaves the stack.
- **Curated web tool** (`webSources.ts`) — a retrieval helper locked to a **SHA-approved allowlist**, gated by `ASTRYX_WEB_ENABLED=false`. Allowlist for Phase 2 (SHA-confirmed 2026-06-28): **medical/physiology (PubMed, NIH, .gov/.edu)**, a **live ephemeris / sky-data API**, and a short list of **established astrology/herbal references**. (sacredtea.net may be added later.) Wire the plumbing, leave it OFF, document how to enable. Whatever the web returns is **Tier 3** — cited, fenced, never diagnostic, subject to the same compliance guard.

**Verification:** with flags off, behavior is identical to Phase 1; enabling `selfhost` or `ASTRYX_WEB_ENABLED` activates the new path without code changes.

## FIX L.9 — Verification harness

**Assert:**
1. **Depth:** endocrine question, a specific herb, a cell salt, a body system, and an app-usage question all return grounded, cited, in-voice answers (previously impossible).
2. **Personality:** answers read as Astryx, not raw canon; no verbatim record dumps.
3. **Compliance:** probabilistic framing everywhere; banned-phrase guard catches violations; crisis text → resources, no model call; disclaimer present.
4. **Sovereignty:** inspect the outbound model payload — it contains only the permitted fields (no engine source, no full birth data, no account/payment).
5. **Model swap:** `ASTRYX_MODEL_PROVIDER=gemini` and `=openai` both answer; `=selfhost` reachable (Phase 2).
6. **Engine unchanged:** generate a reading before/after — the deterministic protocol output is byte-identical.
7. **Fallback:** unset the key → local `answerAstryx` serves without crashing.

---

## GLOBAL RULES
- Determinism for the ENGINE is absolute; the LLM lives only on the chat surface and never recomputes a reading.
- Compliance gates (crisis, banned-phrase, disclaimer, probabilistic framing) wrap every model answer. Server-only model + keys; nothing client-side.
- Canon = SHA's distilled JSON only (never the raw copyrighted books). Tier-2 general knowledge is fenced; Tier-3 web is OFF until Phase 2.
- Frugal: in-memory retrieval, no vector DB; Gemini default (free tier), OpenAI optional, self-host the endgame. No new paid dependency required to ship Phase 1.
- No new `any`. The model adapter is the only place a provider is named.

## AFTER ALL FIXES
1. `npx tsc --noEmit` → 0. 2. `npm run build:canon` then `npm run build` ✓. 3. Run L.9. 4. `rm -rf .next` → `vercel --prod --yes`. 5. Append **"Part L — Astryx Intelligence (full-canon RAG, swappable model, persona, sovereignty contract)"** to `FIXES_COMPLETE_v3.md`: the canon chunk count, retrieval method, the provider default, the character bible summary, and the data-minimization boundary shipped.

## OPEN ITEMS FOR SHA (do not block)
- After it ships, A/B Gemini vs OpenAI on real questions and pick by voice/accuracy (the adapter makes this a one-env-var test).
- When ready for Phase 2 sovereignty: stand up a self-hosted open model (Ollama/vLLM), point `SELFHOST_LLM_URL` at it, set `ASTRYX_MODEL_PROVIDER=selfhost` — then nothing leaves the stack. Optionally fine-tune it on the canon + your voice so the persona is baked into the weights.
