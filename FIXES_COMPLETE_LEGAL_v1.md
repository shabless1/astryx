# FIXES_COMPLETE — LEGAL SHIELD v1

**Directive:** ASTRYX — Claude Code Build Directive · LEGAL SHIELD v1
**Date:** 2026-07-05 · **Branch:** main · **Repo:** astryx_v14
**Status:** Mechanism complete + verified. Legal wording is DRAFT pending attorney finalization (see "Attorney gate").

---

## Verification (all green)

| Check | Result |
|-------|--------|
| `npm run lint:copy` | ✓ zero banned-phrase findings, full transit coverage |
| `npx tsc --noEmit` | ✓ 0 errors (no `any` on the consent/entitlement path) |
| `npx vitest run` (golden + compliance) | ✓ 21 passed / 1 skipped |
| Golden determinism | ✓ engine computation unchanged; the ONLY snapshot diff is the intended FIX-3 copy edit (`clinically documented` → `traditionally associated`, ×2 lines) — no structural/numeric drift |
| `npm run build:local` (`lint:copy` + `next build`) | ✓ builds; `/api/consent` route present |

---

## Attorney gate (READ FIRST)

The companion doc `ASTRYX_LEGAL_CLEANUP_DIRECTIVE_v1.md` (the drafted, attorney-pending
strings) was **not present** in the project. Per the directive's GATE/HANDOFF ("ship the
mechanism now; final language is a one-file edit"), the consent copy is **DRAFT**, assembled
from Astryx's already-approved compliance language + explicit `[DRAFT]` assumption-of-risk
clauses.

**All legal strings live in one file: `src/legal/copy.ts`.** When counsel returns final wording:
1. Edit `src/legal/copy.ts` (disclaimers, AI disclosure, beta banner, consent clauses).
2. Bump `CONSENT_VERSION` — returning users are re-prompted; old acceptances are retained (audit trail), never overwritten.

Until real language + the live server record/gate are confirmed in production, **do not market
the beta as "consent-protected"** (directive dependency note).

---

## FIX 1 — First-use consent & assumption-of-risk gate

- **Storage schema** — new Prisma model `ConsentAcceptance` (`prisma/schema.prisma`) + migration
  `prisma/migrations/20260705000000_consent_acceptance/`:
  ```
  ConsentAcceptance { id, userId(FK→User, cascade), consentVersion,
                      acceptedAt(default now), ipAtAcceptance?, consentTextHash? }
  @@index([userId, consentVersion])   // RLS enabled (mirrors enable_rls migration)
  ```
  A `CONSENT_VERSION` bump writes a **new** row; old rows are retained (audit trail).
  `consentTextHash` = sha256 of `CONSENT_FULL_TEXT` — proves *what* was agreed to.
- **Consent version:** `CONSENT_VERSION = '2026-07-05.v0-draft'` (in `src/legal/copy.ts`).
- **Server library** — `src/lib/consent.ts`: `hasAcceptedCurrentConsent()`, `recordConsent()`,
  `sessionHasConsent()`, `latestConsent()`, `consentTextHash()`. Fails **closed**.
- **JWT stamp** — `src/lib/auth.ts` stamps `token.consented` at sign-in and re-checks on the
  NextAuth `update` trigger, so the gate flips within the same session after acceptance
  (mirrors the `entitled` pattern; no per-request DB read for consented users).
- **API** — `src/app/api/consent/route.ts`: `GET` (version + accepted + clause text),
  `POST` (records acceptance, server-captured IP + text hash; requires a session).
- **Server enforcement (the security boundary)** — `sessionHasConsent(session)` gates the
  reading-releasing routes: `/api/protocol` (the engine) and `/api/astryx` (chat). An
  authenticated user without current consent gets **403 `consent_required`** even if the UI is
  bypassed or "accepted" state is forged. *Scope:* consent applies to **authenticated** users
  ("first authenticated session"); anonymous free use is not gated by the record (there is no
  account to attach it to) — anonymous users still see all disclaimers.
- **Client gate** — `src/components/screens/ConsentGateScreen.tsx` + a blocking early-return in
  `src/app/page.tsx`: an authenticated, un-consented user sees ONLY the gate (no skip, no
  pre-checked box, no "remind me later") until they check the single affirmative box and accept.
  On accept → `session.update()` refreshes the JWT → gate drops.
- **Reachable anytime** — global footer "Terms & Consent" link (`page.tsx`) → the gate in
  read-only `review` mode.

## FIX 2 — Persistent disclaimers + AI disclosure + beta banner

- **Micro-disclaimer** — canonical text in `src/legal/copy.ts` (`MICRO_DISCLAIMER`), re-exported
  by `compliance.ts` so all existing importers keep working. Now also rendered in a **global
  footer** on every non-fullscreen screen (`page.tsx`), on top of the existing per-output usages.
- **AI disclosure** — `AI_DISCLOSURE_LABEL` rendered as a **persistent strip** under the chat
  header in `TeacherChat.tsx`, visible in every state (live model **and** offline sovereign
  brain) before the user reads any output.
- **Beta banner** — `src/components/ui/BetaBanner.tsx` on the dashboard (`DashboardScreen.tsx`),
  dismissible and remembered **per `CONSENT_VERSION`** (reappears once when the version bumps).

## FIX 3 — Claims scrub (extended lint + runtime guard + human proof)

- **Extended banned list** — added over-claim verbs to `BANNED_PHRASES` (compliance.ts), so they
  fail the build EVERYWHERE (single source; `lint:copy` auto-extracts them):
  `clinically proven`, `scientifically proven`, `medically proven`, `proven to (cure|heal|…)`,
  `guaranteed to (cure|heal|…)`, `miracle (cure|remedy)`, `FDA-approved`.
- **Runtime guard** — new `lintClinicalClaims()` + `CLINICAL_CONDITION_TERMS` /
  `SUPPLEMENT_DOSE_TERMS` lexicon (compliance.ts). Folded into `safetyGate()` for the individual
  tier, and applied in the `/api/astryx` output guard: for the **individual (free) tier** the
  chat's regenerate-then-fallback guard now also catches disease-naming + explicit dosing that
  could be surfaced from the canon's practitioner clinical layer.
- **Human proof pass** — the free/Individual **engine output** was audited and is clean of
  mg-dosing and disease-naming (the mg-dosing the sweep flagged was all in
  practitioner-gated `bodySystems/*.json`, out of scope). Two over-claims that DID reach the free
  surface were rewritten in `src/data/sacredBotanicals.json`:
  - `"clinically proven to reduce cortisol…"` → `"classically associated with reduced cortisol…"`
  - `"Blood pressure regulation (clinically documented)"` → `"(traditionally associated)"`
    *(this string is emitted into the individual protocol output → golden snapshot updated; the
    only diff is this copy change.)*
- **Scope decision (SHA):** the attested, isPremium-gated Practitioner clinical layer
  (`bodySystems` disease names + clinical dosing) is **intentionally preserved** — the scrub
  targets the free/Individual surface only. Documented in `scripts/lint-data-copy.mjs`.

## FIX 4 — User-facing terminology softening (display strings only)

- **Display-label layer** — `src/lib/displayLabels.ts` (`DISPLAY`). Internal type names
  (`UnifiedPrescription`, `SOAPOutput`, `DiagnosticOutput`, `SymptomRouting`), data keys
  (`protocol.diagnostic`, `symptomRouting`, `cellSaltPrescription`) and functions are
  **unchanged** — only rendered text is softened, so the engine + golden suite are untouched.
- **Free-surface renames applied:**
  - `AnalysisScreen`: "Cross-referencing symptom matrix…" → "Cross-referencing your signals…"
  - `ResultsScreen`: "Symptom Routing" → `DISPLAY.signalRouting` ("Signal Routing");
    "Reference Assessment (SOAP)" → `DISPLAY.sessionSummary` ("Session Summary")
  - `HomeScreen`: "…returns a focused diagnostic." → "…returns a focused session summary."
  - `page.tsx` TierGate blurb: "medical-astrology breakdown" → "body-based wellness breakdown"
- **Out of scope (decision #2):** practitioner-tier labels (`BodySystemPreviewScreen`
  "Prescriptions", `PractitionerLensContent` "diagnostic", "Medical Astrologer" modality) are
  isPremium-gated and left intact.

---

## New / changed files

**New:** `src/legal/copy.ts`, `src/legal/index.ts`, `src/lib/consent.ts`,
`src/lib/displayLabels.ts`, `src/app/api/consent/route.ts`,
`src/components/screens/ConsentGateScreen.tsx`, `src/components/ui/BetaBanner.tsx`,
`prisma/migrations/20260705000000_consent_acceptance/migration.sql`.

**Changed:** `prisma/schema.prisma`, `src/lib/auth.ts`, `src/lib/compliance.ts`,
`src/app/api/protocol/route.ts`, `src/app/api/astryx/route.ts`, `src/app/page.tsx`,
`src/types/index.ts`, `src/components/teacher/TeacherChat.tsx`,
`src/components/screens/DashboardScreen.tsx`, `src/components/screens/ResultsScreen.tsx`,
`src/components/screens/AnalysisScreen.tsx`, `src/components/screens/HomeScreen.tsx`,
`src/data/sacredBotanicals.json`, `scripts/lint-data-copy.mjs`,
`tests/__snapshots__/engine.golden.test.ts.snap` (intended copy diff only).

## Deploy note

`prisma migrate deploy` (part of `npm run build`) will apply the `ConsentAcceptance` migration
to the live Supabase DB. `build:local` skips the DB step. The consent gate is not "live/enforced"
end-to-end until that migration is applied in production.

## Open decisions carried (SHA, 2026-07-05)

1. Legal copy → **draft now, one-file swap when counsel returns** (`src/legal/copy.ts`).
2. Scrub scope → **free/Individual surface only**; preserve the attested Practitioner clinical layer.
3. App remedies → **keep remedies, strip clinical dosing / disease-outcome framing** from the free surface.
