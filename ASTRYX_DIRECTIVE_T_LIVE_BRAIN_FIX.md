# ASTRYX — Directive T: Bring the Live Brain Back (kill the menu-bot fallback)
### 2026-06-28 · Astryx is answering real questions with a canned MENU because the cloud model is unreachable and the app silently degrades to the local keyword bot
**Read with:** `app/api/astryx/route.ts` (returns `{fallback:true, reason}` when the model is unreachable), `lib/astryx/modelAdapter.ts` (`getAstryxModel` reads `ASTRYX_MODEL_PROVIDER`, default `gemini`; `modelConfigured`), `components/teacher/TeacherChat.tsx` (`runLocal()` → `answerAstryx` on `data.fallback || !data.reply`), `lib/astryx/sovereignAstryx.ts` (the local menu text).

> **Root cause (diagnosed live):** a real question ("what planet is affecting me most today?") returned the **menu** — "…Ask me anything close to it: 'why Neptune?', 'where do I place the Neptune fork?'…". That text is the **local `sovereignAstryx`** brain, which `TeacherChat` calls ONLY when `/api/astryx` returns `fallback:true`. The route returns `fallback` when **`!modelConfigured()`** (`reason:'model-unconfigured'`) or the model call throws twice (`reason:'model-error'`). So **the model is unreachable in prod** — an env/quota problem, not a code bug — and the app degrades to a keyword bot whose default reply is a question-menu. This is why prior code fixes never helped: the request never reaches GPT.
>
> **SHA is fixing the env herself** (keys never in chat): `ASTRYX_MODEL_PROVIDER=openai` + valid `OPENAI_API_KEY` (with billing/quota) + optional `OPENAI_MODEL=gpt-4o`, then redeploy. This directive makes the failure **visible** and makes the fallback **never a menu**, so a future outage degrades gracefully instead of embarrassingly.
>
> **Gating:** `tsc` 0 · build ✓ · verify §T-ACCEPT · redeploy. Determinism/compliance/scope firewalls intact; no credibility labels; premium (no discounts).

## T.1 — Make the model-unreachable failure LOUD, not silent (diagnosability)
**Where:** `/api/astryx/route.ts` + `TeacherChat.tsx`.
- The route already returns `reason` ('model-unconfigured' | 'model-error'). **Log it server-side clearly** (`console.error('[astryx] FALLBACK', reason)`), and **return it to the client**.
- In `TeacherChat`, when `data.fallback` fires, record the `reason` (dev console + a lightweight client log). Add a **subtle admin/dev indicator** (only when `NODE_ENV!=='production'` OR a `?debug` flag) that shows "Astryx brain: LOCAL FALLBACK (reason)" so SHA/Code can SEE when the cloud brain is down instead of guessing. Never shown to normal users.
- **Add a tiny health check** the dashboard (or an `/api/astryx/health`) can hit: returns `{ configured: modelConfigured(), provider }` so "is the real brain live?" is answerable at a glance.

## T.2 — The local fallback must NEVER answer with a question-menu
**Where:** `lib/astryx/sovereignAstryx.ts` (the default/catch-all branch) + any welcome template.
- **Split greeting from answer.** The question-menu ("ask me things like…") is ONLY acceptable as the **first, unprompted greeting** when the chat opens with no user message. It must **never** be returned as the response to an actual user question.
- **When the user asks something, the local brain ANSWERS from the reading it already has** — it holds the dominant planet, the signal hierarchy, prescriptions, today's note. E.g. "what planet is affecting me most today?" → *"Right now Neptune is the loudest signal in your field — it's the diffusing, dissolving current, so today leans dreamy/foggy. Your calibration meets it with [regulator]."* Use the real data; do not deflect to a menu.
- **If the local brain genuinely can't answer** a specific question (needs the deep model), it says so **honestly and briefly** — *"That one needs my deeper read and it's offline for a moment — try again shortly, or ask me about your signal, forks, or today's sky."* ONE warm line, never a canned list, never pretending.
- Keep the compliance deferral ("a symptom or health decision belongs with your licensed practitioner") but attach it only where relevant — not as a wall on every reply.

## T.3 — Confirm the provider wiring matches SHA's choice
**Where:** `modelAdapter.ts`.
- `getAstryxModel()` defaults to **gemini** when `ASTRYX_MODEL_PROVIDER` is unset. Since SHA runs **OpenAI**, confirm prod sets `ASTRYX_MODEL_PROVIDER=openai`. If it's unset in prod, the app silently tries Gemini (likely no key) → fallback. **Do not hard-code a provider**; keep it env-driven. Optionally: if `ASTRYX_MODEL_PROVIDER` is unset but `OPENAI_API_KEY` exists and `GEMINI_API_KEY` doesn't, prefer openai (a smart default that prevents this exact misconfig). Log the resolved provider once at boot.

## §T-ACCEPT
1. With the model reachable (env correct + redeploy): "what planet is affecting me most today?" → a **real, conversational GPT answer** grounded in the reading — **not** a menu.
2. With the model deliberately unreachable (unset key in a preview): the chat shows a **single honest line** (or answers from the reading), **never the question-menu**; the dev indicator shows "LOCAL FALLBACK (reason)".
3. `/api/astryx/health` (or equivalent) reports `configured:true, provider:'openai'` in prod.
4. Greeting-menu still appears as the **opening** message only, never as an answer.
5. `tsc` 0 · build ✓ · compliance/scope/no-credibility-label firewalls intact.

## AFTER
`tsc` 0 → build ✓ → verify §T-ACCEPT → redeploy → append "Part T — Live Brain Fix (surface fallback reason + health check; local fallback answers from the reading & never menus; provider-wiring confirm)" to `FIXES_COMPLETE_v3.md`.

### SHA action (env — you, not Code; keys never in chat):
Vercel → Settings → Environment Variables → set `ASTRYX_MODEL_PROVIDER=openai`, `OPENAI_API_KEY=<valid, funded key>`, optional `OPENAI_MODEL=gpt-4o` → **Redeploy**. Then re-ask "what planet is affecting me most today?" — you should get a real answer, not a menu.
