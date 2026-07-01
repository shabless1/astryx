# ASTRYX — Directive M: Beta Feedback Widget
### Claude Code handoff · 2026-06-28 · in-app beta feedback → SHA's Gmail + Google Sheet
**Read with:** `CLAUDE.md`, `COMPLIANCE.md`, `lib/store.ts` (the `screen` state), `src/lib/version.ts` (app version), `components/teacher/TeacherChat.tsx` (floating-tab pattern to mirror).

> **Goal:** a branded in-app "Beta Feedback" widget so beta users can report bugs + suggest improvements, with **auto-captured context** so reports are actionable. Submissions **email to SHA's Gmail** (shabless1@gmail.com) via **Resend** (free tier, one API key — same setup pattern as the Gemini key). No Google Apps Script, no Sheet to maintain — Cowork compiles a triage digest from SHA's inbox on demand.
>
> **Gating:** `npx tsc --noEmit` → 0 · `npm run build` ✓ · verify M.4 · `rm -rf .next` → `vercel --prod --yes` · append "Part M — Beta Feedback" to `FIXES_COMPLETE_v3.md`. Determinism/compliance intact; no engine changes.

---

## FIX M.1 — The feedback widget (client)

**Where:** new `components/feedback/BetaFeedback.tsx`; mount it globally where the floating "✦ Ask Astryx" tab mounts (so it shows on every screen **except** auth, payment, analysis, subscribe-gate).

**What to build:**
- A floating **"✦ Beta Feedback"** tab/button, visually consistent with the design system (gold/cosmic), distinct from Ask Astryx (e.g. left edge or bottom-left so they don't collide). A small "BETA" pill.
- Opens a modal form:
  - **Type** (required, chips): `🐞 Bug` · `💡 Suggestion` · `😕 Confusing` · `❤️ Love it`
  - **Severity** (shown ONLY if Type = Bug): `Minor` · `Annoying` · `Blocking`
  - **Message** (required textarea): label adapts — "What happened? What were you trying to do?" for Bug, "What would make this better?" for Suggestion.
  - **Email** (optional): "Want a reply? Drop your email." 
  - Submit + Cancel. Show a warm confirmation on success ("Thank you — your signal helps shape Astryx."), graceful error with retry.
- Honor Animation Intensity Low; keyboard-accessible; mobile-friendly.

## FIX M.2 — Auto-captured context (the part that makes reports useful)

**Where:** in `BetaFeedback.tsx`, assemble a `meta` object at submit time.

**Capture (privacy-safe ONLY):**
- `screen` (current Zustand `screen` value), `appVersion` (from `version.ts`), `userAgent` / browser + OS, viewport size, `timestamp` (ISO), `path`, and a coarse session flag (e.g. `hasReading: true/false`, `chamberContainer` if mid-session).
- **NEVER capture:** birth date/time/location, full natal chart, account password, payment/XRP/wallet data, or any other user's data. If a logged-in user, include only an anon user id or first name — nothing more. The optional email is the ONLY PII, and only if the user types it.

## FIX M.3 — The server route + delivery

**Where:** new `app/api/feedback/route.ts` (server-only).

**What to build:**
- `POST` accepts `{ type, severity?, message, email?, meta }`. Validate (message required, sane lengths). Basic rate-limit / honeypot to deter spam.
- Send an email to `process.env.FEEDBACK_TO` (default `shabless1@gmail.com`) via **Resend** using `process.env.RESEND_API_KEY` (server-side; `npm install resend`). Subject: `New Astryx beta feedback: {type}`. Body: type, severity, message, the optional user email, and the full auto-context (screen, version, device, timestamp). Set `reply_to` to the user's email if they provided one, so SHA can reply in one click.
- **Graceful degradation (so the widget ships before the key lands):** if `RESEND_API_KEY` is unset, do NOT error — persist the submission (append to a local/Vercel-KV log or, at minimum, `console.log` it server-side) and return a friendly success to the user. The instant the key is added, emails flow. Mirror the audio/model-key degradation pattern.
- Do **not** run feedback through the LLM or the crisis gate (it's stored/emailed, not an interactive chat). The existing Ask-Astryx crisis resources remain available separately.

## FIX M.4 — Verify
1. Widget shows on main screens, hidden on auth/payment/analysis.
2. Submitting a Bug with severity + message → 200; a row appears in the Sheet AND an email hits shabless1@gmail.com, with the auto-context attached.
3. Suggestion (no severity) works; optional email optional.
4. Outbound payload contains **no** birth data / chart / payment fields (inspect it).
5. `tsc` 0; build ✓; Low animation stays smooth; mobile layout clean.

---

## GLOBAL RULES
- Frugal: Resend free tier (3k emails/mo). The only secret is `RESEND_API_KEY` (+ optional `FEEDBACK_TO`).
- Privacy/sovereignty: feedback emails to SHA's own inbox; the captured `meta` carries no sensitive personal data (see M.2 ban list).
- Compliance/disclaimer footer + crisis resources elsewhere unchanged. No engine changes; determinism intact. No new `any`.

## AFTER
`tsc` 0 → `npm run build` ✓ → verify M.4 → `rm -rf .next` → `vercel --prod --yes` → append "Part M — Beta Feedback Widget (native form → Resend → Gmail, privacy-safe auto-context)" to `FIXES_COMPLETE_v3.md`.

---

## SHA SETUP — one key, ~3 min (provides `RESEND_API_KEY`)
*(Build the widget + route now; it ships and captures submissions even before the key. Emails start the instant the key is in — same pattern as the Gemini key. No Sheet, no Apps Script.)*
1. Go to **resend.com** → sign in with Google (free).
2. **API Keys → Create API Key** → copy it (starts with `re_`).
3. Vercel → astryx project → Settings → Environment Variables → add `RESEND_API_KEY` (Production + Preview). Optional: `FEEDBACK_TO=shabless1@gmail.com`.
4. Redeploy. Done — feedback now emails to your inbox. (Cowork compiles a triage digest from your Gmail whenever you want — you never touch a spreadsheet.)
> Note: Resend's free tier sends from a shared `onboarding@resend.dev` sender without domain setup — fine for beta feedback to your own inbox. Verifying `myastryx.com` as a sender later is optional polish, not required.
