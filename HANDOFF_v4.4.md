# ASTRYX — Session Handoff (post-v4.4)
**Written:** 2026-07-20 · **For:** the next Claude Code session picking up cold
**Read order:** this file → `FIXES_COMPLETE_v4.4.md` → `CLAUDE.md` → `COMPLIANCE.md`

---

## TL;DR — where things stand

**v4.4 is DONE and LIVE in production.** Latest commit `b1b26cb` (author: Sha Blyss),
pushed to `github.com/shabless1/astryx` `main`, deployed via Vercel CLI, and both
`myastryx.com` + `www.myastryx.com` alias the new build (status Ready, HTTP 200 verified).

There is **no open work item** from v4.4. The next session starts fresh — either a new
SHA directive, or SHA's own eyes-on feedback from production.

A detached dev server was respawned on **port 3000** for cowork at end of session
(`Start-Process cmd … npm run dev`, hidden window, log at `%TEMP%\astryx-dev.log`).
If it's dead, respawn it (command in the "Dev server" section below).

---

## Who's who / hard rules (do not violate)

- **SHA is the architect; Claude is the developer.** Never ask SHA to write or modify
  code. Hit a fork → choose the better path, document it, move on. (`[[claude-is-the-developer]]`)
- **Commit identity is `Sha Blyss <shabless1@gmail.com>`** — already set in repo config.
  Verify with `git log -1 --format='%an <%ae>'` before committing.
- **Determinism is sacred.** The LLM never computes, selects, or configures a session.
  No `Math.random`/`Date.now` in engine/chamber/audio paths (ESLint-gated via
  `lint:determinism`). Golden tests must stay green.
- **Compliance voice** on every user-facing string (probabilistic framing; no
  conditions/supplements; transmute-don't-erase). `lint:copy` gates banned phrases +
  transit-copy coverage but CANNOT catch grammar — proofread new copy by reading it.
- **DB role password lives ONLY in gitignored `.env`/`.env.local` + Vercel env.** Never
  commit it. RLS stays enabled on all tables; any new table must enable RLS.
- **Never deploy around a Vercel pause.** (It was cleared this cycle; if builds fail with
  a billing/pause error, stop and tell SHA — do not work around it.)
- **Astryx voice:** energy/frequency/medical-astrology register. NO occult/ritual/
  mystical/grimoire language. (`[[astryx-voice-positioning]]`, `[[sacred-vault-voice]]`)

---

## Repo & environment

| | |
|---|---|
| **Repo root** | `C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\astryx_v14` |
| **Branch** | `main` |
| **GitHub** | `shabless1/astryx` |
| **Stack** | Next.js 14 (App Router) · TypeScript · Tailwind · zustand (persisted) · Tone.js · Prisma 6.19.3 · astronomy-engine |
| **DB** | Supabase `gbalyncthcaxbzuwlbqo`, role `astryx_prisma`, pooler `aws-1-us-east-1.pooler.supabase.com` (6543 pgbouncer / 5432 direct), RLS on w/ no policies (owner bypasses). Free tier pauses when idle. |
| **Prod** | Vercel project `astryx` → `myastryx.com`. Deploy = **CLI** `vercel --prod --yes` from repo root (NOT git-integrated auto-deploy). CLI already authed. |
| **Build script** | `prisma generate && prisma migrate deploy && npm run lint:copy && npm run lint:determinism && npm run test -- --run && next build` |

### OneDrive gotchas (bitten us repeatedly)
- Deleting/rebuilding `.next` while the dev server runs → EINVAL readlink. **Kill the dev
  server + delete `.next` before `npm run build`.** Never build while dev runs.
- `node -e` heredocs break in PowerShell (backtick escaping). Write `.cjs` files into the
  repo instead to use its `node_modules`.
- Dev-server file-watch is flaky under OneDrive: a reload can race the Fast Refresh
  rebuild and serve the stale bundle. **Reload twice** before concluding a fix failed.
  (`[[astryx-hydration-race-trap]]`)

### Dev server (detached, survives session teardown)
```
Start-Process cmd '/c cd /d "C:\Users\Sha Blyss\OneDrive\Documents\Claude\Projects\HOUSE OF MAHMAH TEA APPS\MARKETING\astryx_v14" && npm run dev > "%TEMP%\astryx-dev.log" 2>&1' -WindowStyle Hidden
```
Kill the port-3000 holder before builds or before `preview_start`:
`Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess -Force`

---

## What v4.4 shipped (so you know the current shape)

Full detail in `FIXES_COMPLETE_v4.4.md`. Summary:

1. **Dashboard Sessions launcher** — 3 always-visible tiles (Today's Calibration w/ live
   fork chip · Full Body · Chakra w/ Solfeggio/Planetary toggle) on every dashboard tab,
   above the fold. Launch directly, never through the picker. Nav tab renamed
   **CHAMBER → SESSIONS**. Resume card names its mode.
2. **Astryx-as-operator** — deterministic `deriveAstryxActions()`
   ([src/lib/astryx/actions.ts](src/lib/astryx/actions.ts)) shared by `/api/astryx`, the
   offline brain, and golden tests. Chat renders action buttons that close chat and route
   via deep-link. Canon entry added (651 chunks).
3. **v4.3.1 defect fixes** — Full Body natal-overlay leak removed; Chakra Root got its own
   strike copy; sacral/third-eye grammar fixed.

**The ONE routing vocabulary** (memorize this — tiles, deep links, resume, and Astryx all
use it): `#session/custom` · `#session/full-body` · `#session/chakra-planetary` ·
`#session/chakra-solfeggio`. Handler is `handleSessionAction()` in
[src/app/page.tsx](src/app/page.tsx).

### Bug caught & fixed mid-verification (worth remembering)
zustand v4 `persist` rehydrates **asynchronously**. Mount-time store writes in `page.tsx`
were getting clobbered by the MID_FLOW merge — a cold `#session/chakra-planetary` deep
link silently resumed an interrupted Full Body ladder. Fixed by deferring the deep-link
effect behind `useAppStore.persist.hasHydrated()` / `onFinishHydration`, and reading
`protocol` from `getState()` not the render closure. **This pattern applies to ANY future
mount-time store write** — the v4.4 deep-link shim is the reference. Saved to memory as
`[[astryx-hydration-race-trap]]`.

---

## Owner-side items still pending (NOT Claude's to do)

- **Shopify webhook setup** — see `SHOPIFY_SETUP.md`. Until SHA wires the webhook,
  fork-buyer entitlement is manual: `BETA_ALLOWLIST` / direct `Entitlement` inserts
  (idempotent by `shopifyOrderId`). Five real buyers already backfilled. (`[[astryx-v4-beta-sprint]]`)
- **SHA's eyes on production** — the v4.4 tiles are the first thing on the dashboard;
  she may come back with feedback.

## Known deferred / paused (don't restart without a concrete ask)
- **Chamber MANDALA visual** — PAUSED, 4 rejected attempts. Get a concrete reference from
  SHA before rebuilding. (`[[astryx-mandala-direction]]`)
- **Medical-astrology VISUAL layer** — body-map/session reflex orbs deferred to a SHA
  preview pass. Engine (Part S) is live. (`[[astryx-medical-astrology-engine]]`)
- **Solfeggio audio tracks** — chakra Solfeggio mode currently plays the PLANETARY songs
  ("use the planetary songs for now" — SHA). When she uploads Solfeggio tracks, wire them
  into the chakra track resolution.

---

## Standard acceptance checklist (run before ANY deploy)

```
# from repo root, with dev server KILLED and .next removed if rebuilding
npm run lint:copy            # banned phrases + transit coverage
npm run lint:determinism     # Math.random/Date.now ban
npm test -- --run            # golden suite (currently 19 pass / 1 skip)
npx tsc --noEmit             # 0 errors
npm run build                # full gate: prisma + lints + tests + next build
```
Then: browser-verify the change → `FIXES_COMPLETE_vX.md` → commit as Sha Blyss →
`git push origin main` → `vercel --prod --yes` → confirm `myastryx.com` aliases the new
deployment (`vercel alias ls | grep myastryx`) → respawn detached dev server for cowork.

Snapshot note: if you change chamber copy/bodyPoint strings, chakra/fullbody golden
snapshots need deliberate regen: `npx vitest run tests/<name>.golden.test.ts -u`.

---

## Test / verification tooling notes
- Vitest config aliases `@` → `src`. Golden tests live in `tests/`. Manual repro harness
  `tests/_repro-fix3.test.ts` runs only with `ASTRYX_MANUAL_REPRO=1` (hence the "1 skip").
- Browser verification this session used the Claude_Preview MCP (`preview_start` with
  launch config `astryx-dev`, then `preview_eval` to drive the guest flow). The guest
  flow to reach a reading: landing → "continue without an account" → fill name/date/
  time/city + pick the geocode "Use:" suggestion → Begin Resonance Scan → Continue →
  Set Your Intention → pick an intention → Generate my protocol → (waits ~20s through two
  loaders) → Dashboard.

---

## Memory pointers (the durable context lives here, not in this file)
Index: `MEMORY.md`. Most relevant to Astryx dev:
`[[astryx-deploy-path]]` · `[[astryx-security-posture]]` · `[[astryx-supabase-project]]` ·
`[[astryx-hydration-race-trap]]` · `[[astryx-v4-beta-sprint]]` · `[[astryx-intelligence-canon]]` ·
`[[astryx-medical-astrology-engine]]` · `[[astryx-legal-shield]]` · `[[claude-is-the-developer]]` ·
`[[sha-working-style]]` · `[[astryx-voice-positioning]]`.

---
*Proprietary — Astryx / Cosmic Resonance System · SHA — Creations by Sacred Music. Lives in the project repo only.*
