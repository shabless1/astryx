# Practitioner Portal — Build Plan v1
### Astryx · House of MahMah Tea LLC · scoped 2026-09-10 from a full code audit

> **Status:** plan for owner review. Nothing here is built yet except the two truth fixes shipped 2026-09-10 (the mode toggle bug and the false "saved encrypted" claim).
> **Spec source:** CLAUDE.md "Three Access Tiers" (Practitioner $39.95/mo · Verified $59/mo) + the Practitioner Mode Spec v1.

---

## 1. Where it stands

| Feature (spec) | Status | Reality |
|---|---|---|
| Practitioner screen (planet grid, forks, chart, body map, SOAP) | **BUILT** | Real chart data; Sacred Tones cards per fork. The "container" dials on this screen are local state and change nothing downstream. |
| Client roster (add / list / delete / history) | **BUILT, local only** | Full CRUD, per-client history, consent checkbox. Lives in browser localStorage. Cache clear or a second device = roster gone. |
| Run a session on THIS client's chart | **BUILT** | Loads the client's birth data, forces practitioner mode, re-runs the engine. |
| Sacred Tones Session Mode (fork → body point for this client) | **BUILT** | Per-fork plexus / application point / ANS effect / practitioner note; client name in the chamber; pause / extend / skip; printable protocol sheet. |
| Session notes (practitioner) | **BUILT** | Vagal 1–5 + free-text notes written into the local ClientSession. |
| Vagal Tone Tracker | **PARTIAL** | Captured and shown per session. No trend, no delta, no chart. |
| Lens switcher (8 modalities) | **PARTIAL** | 8 tabs. **1 of 8** lenses has content (Reiki). Six show a placeholder. |
| PDF export | **PARTIAL** | Rich report (pattern, SOAP, five senses, sacred layer, malachite warning). **No Field section, no Clairs.** Practitioner name is hardcoded "Astryx System". **No name + modality on the footer** (the helper exists in compliance.ts and is never called). |
| Clinical terminology unlocked by tier | **PARTIAL** | Branches on a client-supplied string (`intake.mode`), not on any paid tier. |
| Classical references cited inline | **MISSING** | Copy says "classical sources associate…" but no citation data exists anywhere. |
| Professional attestation (signed, audit-trailed) | **STUB** | The attestation text and version constants exist in compliance.ts. No form, no API, no table, zero call sites. |
| Verified tier (badge, credential auto-fill, referral letters, SOAP, billing exports) | **MISSING** | Nothing built. Verified attestation text exists, unused. |
| Practitioner API access | **MISSING** | No keys, no practitioner-scoped route. (Roadmap 2.3, after the Worker port.) |
| $39.95 / $59 pricing | **STUB** | `TIER_PRICING` constant exists, imported by nothing. Live billing is one product: $9.99/mo or $99/yr, one boolean `entitled`. |
| Practitioner entry from Intake | **DISABLED** | Padlocked "coming soon" button. |
| Settings mode toggle | **UNGATED** | Anyone can flip to practitioner mode from Settings. No auth, no tier, no attestation check. |

**The one-sentence blocker:** there is no practitioner tier anywhere in the money path, so the portal is currently free to any $9.99 subscriber who opens Settings, and it stores its clients in a place that evaporates.

---

## 2. Access today, step by step

1. `mode` is a plain client string (`'user' | 'practitioner'`) persisted in the browser.
2. Intake's practitioner button is hard-locked. Settings' toggle is wide open.
3. The Practitioner and Client Roster screens render with no check at all.
4. Server-side, `/api/protocol` returns the deeper practitioner sacred layer to **any signed-in user** whose request says `mode: 'practitioner'`.
5. `isPremium` on the JWT is the dormant XRP flag. Nobody has it. The live Shopify flow writes `Entitlement` rows that resolve to one boolean.

There is no paying-tier gate. `Entitlement.plan` encodes duration (monthly/yearly/lifetime), not tier.

---

## 3. The plan

### P0 — The Gate (money + truth) · 1 session · unblocks charging
1. **Tier in the data model.** `Entitlement.tier` = `individual | practitioner | verified` (default individual; migration keeps RLS on).
2. **Practitioner products in Shopify.** Practitioner monthly ($39.95) and yearly. I draft them through the Shopify connector; SHA activates. The webhook classifies by **product / SKU**, not by the current $50 price floor.
3. **`resolveAccess()` returns the tier**, not a boolean. The JWT carries it. `sacredTierFor()` reads the server tier, never the request body.
4. **Gates.** Settings toggle, Practitioner screen, Client Roster, and the Intake practitioner button all require `tier ∈ {practitioner, verified}`. Individuals see the practitioner door as an upgrade card that links the Shopify product (payments stay Shopify-only).
5. **Individual attestation** stays as it is (consent gate). **Professional attestation** moves to P1 because it needs a table.

### P1 — A home for the circle · 1–2 sessions · unblocks trust
1. **Prisma models** (RLS on, same as every table): `PractitionerProfile` (displayName, modality, credentialText, verifiedAt, tier), `PractitionerAttestation` (append-only, mirrors `ConsentAcceptance`: version, text hash, acceptedAt, ip, modalityClaimed), `Client` (birth data, coords, modality, notes, consentAttestedAt), `ClientSession` (date, forksUsed, crystalsUsed, vagalToneRating, notes, protocolSnapshot, link to ChamberSession).
2. **Encryption at rest** for client birth data and notes (app-level, key in Vercel env, never in git). Recommended. This is third-party health-adjacent data.
3. **API** with ownership on every call: `/api/clients`, `/api/clients/[id]`, `/api/clients/[id]/sessions`, `/api/practitioner/profile`, `/api/practitioner/attest`.
4. **Attestation gate**, blocking, like the consent gate: no client can be added until the professional attestation is signed. New version = new row, never an update.
5. **Migration of the local roster.** On first practitioner load, existing localStorage clients/sessions POST to the account, then clear. Nobody loses a client.

### P2 — The deliverables · 2 sessions · proof of value
1. **The PDF.** Practitioner name + modality on every footer (wire the existing `formatPdfFooter`), name from the profile, a **Field** section, and the **Clairs** on each channel. Masthead already renamed "Calibration Protocol · Practitioner Edition".
2. **Vagal Tone Tracker.** Per-client trend line and delta across sessions on the roster and in the PDF.
3. **Citations.** Add a `source` field to every claim the practitioner surface prints, then render it inline ("classically, Saturn is associated with…, Cornell 1918"). Needs SHA's source list (see decisions).
4. **The container dials** on the Practitioner screen actually drive the chamber.

### P3 — The lenses · content-driven · one lens per session
Six of eight modality lenses are placeholders. Each needs the owner's content: what a practitioner of that modality does with the pattern. Build order proposed by which modalities SHA's practitioners actually use.

### P4 — Verified tier · 1–2 sessions + an owner process
Credential upload (R2, private), owner review in an admin view, `verifiedAt` stamp, verified badge on client-facing materials, credential auto-fill on the PDF, referral letter template, SOAP export, billing export (CSV). Verification is manual by SHA; the app never claims to verify a license itself.

### P5 — Practitioner API keys · after the Worker port (Roadmap 1.2 → 2.3)
A practitioner's own tools call Astryx for every client. Their key, their wallet.

---

## 4. Decisions for the owner

1. **Pricing.** Confirm Practitioner **$39.95/mo**. Set the yearly price (proposal: $399/yr). Confirm Verified **$59/mo**.
2. **Shopify products.** I draft the practitioner products through the Shopify connector; you activate them. Or you create them and give me the handles.
3. **Verification process.** Manual review by you from an admin view (recommended), or self-attested only for now.
4. **Encryption at rest** for client data: yes (recommended) or later.
5. **The eight lenses.** Which modalities matter first, and where the content comes from (your notes, the addendum docs, or written fresh with you).
6. **Citations.** The classical sources you want cited inline (the canon already leans on Cornell, Culpeper, Lilly, Charak; confirm the list).

---

## 5. Order and why

P0 → P1 → P2 → P4 → P3 → P5. Money first (P0 makes the tier real and closes the free-toggle hole), trust second (P1 gives the circle a home and signs the attestation), proof third (P2 makes the PDF the thing a practitioner hands a client), then the verified tier, then content, then the API.

**Voice.** The practitioner side keeps its clinical depth (the Legal Shield scrub was Individual-only by design) but speaks in the expanded register: the full pattern, the container, the circle. Compliance lines stay exactly where they are.
