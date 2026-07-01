# ASTRYX — HOTFIX: Gemini Auth for the New `AQ.` Key Format
### Claude Code · 2026-06-28 · surgical patch — unblocks the live Astryx brain
**Scope:** ONE change — the Gemini path in `lib/astryx/modelAdapter.ts`. Do not touch the canon, retrieval, route, persona, OpenAI/self-host paths, or the adapter interface. This is the only thing standing between the built Astryx brain and a working answer.

---

## THE PROBLEM (verified 2026-06-28)
Google migrated Gemini API keys from the old **Standard** format (`AIzaSy…`, 39 chars) to the new **Auth key** format (`AQ.Ab8…`). AI Studio now issues `AQ.` keys by default, and many accounts (including SHA's) can **only** generate `AQ.` keys. Standard `AIzaSy` keys are being **rejected entirely by ~September 2026** — do not build on them.

The current adapter authenticates the **legacy** way — an `x-goog-api-key` header (or `?key=`) against the `generativelanguage.googleapis.com` REST endpoint. **`AQ.` keys return 401 on that path.** That is the entire failure. SHA's key is valid; the auth method is stale.

## THE FIX
Replace the legacy Gemini REST/auth in the `gemini` branch of the adapter with the **official current Google Gen AI SDK**, which handles the new `AQ.` Auth-key format correctly.

1. **Add the SDK:** `npm install @google/genai` (the unified SDK that supersedes the deprecated `@google/generative-ai`).
2. **Rewrite ONLY the `gemini` provider** inside `modelAdapter.ts`, keeping the `AstryxModel` interface (`complete()` + `embed()`) byte-for-byte identical so nothing downstream changes:
   ```ts
   import { GoogleGenAI } from '@google/genai'
   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

   // complete():
   const res = await ai.models.generateContent({
     model: 'gemini-2.5-flash-lite',
     contents: `${system}\n\n${context}\n\nUser: ${message}`,
     config: { temperature: temperature ?? 0.4 },
   })
   return res.text

   // embed():  (used by the canon build + retrieval)
   const e = await ai.models.embedContent({
     model: 'text-embedding-004',
     contents: texts,
   })
   return e.embeddings.map(v => v.values)
   ```
   (Confirm exact method/field names against the installed `@google/genai` version — the SDK is the correct vehicle; the shape may differ slightly by version. The key point: **let the SDK carry the auth** — do NOT hand-set `x-goog-api-key` or append `?key=` for `AQ.` keys.)
3. **Server-only.** Keep the `import 'server-only'` guard; the key never reaches the client.
4. **Leave OpenAI + self-host branches untouched.**

## VERIFY (must pass before redeploy)
1. With SHA's real **`AQ.`** key in `GEMINI_API_KEY`, a chat question returns a **200 + a real in-voice answer** (not 401).
2. `embed()` works — confirm the canon retrieval still returns cited chunks (re-run `npm run build:canon` if embeddings regen is needed; if the embedding model/dims change, rebuild the canon vectors).
3. `npx tsc --noEmit` → 0; `npm run build` ✓.
4. Crisis gate, banned-phrase guard, disclaimer, and the local `answerAstryx` fallback all still fire.

## AFTER
`rm -rf .next` → `vercel --prod --yes` (and redeploy **preview**). Append a one-line note to `FIXES_COMPLETE_v3.md`: "Gemini adapter moved to `@google/genai` for the new `AQ.` Auth-key format; legacy `x-goog-api-key`/`generativelanguage` REST retired."

## KEY HANDLING (for SHA — not Code)
The `AQ.` key goes in **Vercel → astryx project → Settings → Environment Variables → `GEMINI_API_KEY`**, ticked for **Production + Preview**. Set it there directly — never paste a key into a chat transcript. Free tier is plenty to feel her depth.
