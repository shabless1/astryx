# ASTRYX — Compliance & Language Constitution
### v1.0 | The non-negotiable legal posture and language policy for every word the app emits.

> **READ THIS BEFORE WRITING ANY OUTPUT-FACING TEXT.**
> Every JSON entry, every UI string, every PDF export, every email, every screen
> that a user or practitioner will see — must comply with this document.
> Non-compliance is a defect. There are no exceptions.

---

## 1. Mission Posture (The Why)

Astryx is a **reference instrument**, not a diagnostician.
We provide **observational correlations** drawn from classical sources.
The user — or their licensed practitioner — provides **interpretation, diagnosis, and decision**.

We are the telescope; the user is the observer. We are the textbook; the doctor is the doctor.

This posture is the legal foundation of the product. It is what allows us to operate
in the regulated-adjacent wellness space without practicing medicine. If we cross
the line into diagnosis, prescription, or guaranteed outcomes, we expose ourselves
and our users to material legal and personal harm.

**Tote the line. Never cross it.**

---

## 2. The Seven Banned Phrasings — NEVER USE

These phrases (and their conjugations) are **forbidden** in any output-facing string.

| # | Banned | Why |
|---|--------|-----|
| 1 | "you have" / "you are suffering from" / "you suffer from" | Asserts diagnosis. |
| 2 | "this causes" / "this is causing" / "the cause is" | Asserts causation we cannot prove. |
| 3 | "diagnose" / "diagnosis" (when applied to the user, not as part of a quoted source title) | Practicing medicine. |
| 4 | "treat" / "treatment" / "cure" / "cures" / "healing of [specific condition]" | Practicing medicine + outcome claim. |
| 5 | "prescribe" / "prescription" (medical sense — OK in the sense of "cell-salt prescription" only when accompanied by full disclaimer in same view) | Practicing medicine. |
| 6 | "guarantee" / "guaranteed" / "will resolve" / "will cure" / "permanently" | Outcome claim. |
| 7 | "safe for everyone" / "no side effects" / "completely natural" (when applied to a substance) | Safety claim we cannot make. |

A linter check in `lib/compliance.ts` flags any of these in output strings during dev.

---

## 3. The Twelve Approved Phrasings — ALWAYS USE THESE INSTEAD

These are the safe, accurate framings. Use them. Combine them. Vary them.

1. **"may suggest"** — *"This configuration may suggest…"*
2. **"may indicate"** — *"The Saturn-Moon pattern may indicate…"*
3. **"may correlate with"** — *"This signature may correlate with patterns of…"*
4. **"is classically associated with"** — *"Saturn in the 6th is classically associated with chronic conditions per Cornell (1933)"*
5. **"the chart indicates"** — *"The chart indicates an active Mars-Pluto configuration…"*
6. **"this combination has historically been linked to"** — *"This combination has historically been linked to…"*
7. **"classical sources associate this with"** — *"Classical medical-astrological sources associate this with…"*
8. **"consider exploring with your practitioner"** — *"Consider exploring this with your healthcare provider."*
9. **"reference / for reference"** — *"This is provided for reference."*
10. **"observational pattern"** — *"This is an observational pattern, not a diagnosis."*
11. **"may benefit from"** — *"Individuals with this signature may benefit from exploring…"*
12. **"general wellness alignment"** — *"For general wellness alignment, classical traditions recommend…"*

**Tone rules:**
- Soft, not hedged into uselessness. *"May suggest"* — not *"might possibly perhaps suggest in some cases"*.
- Confident about the **observation**, careful about the **conclusion**.
- The chart configuration is REAL. The interpretation is OFFERED. The decision is THEIRS.

---

## 4. The Universal Disclaimer Block (Exact Text)

This block appears on **every output screen** (Results, Session, Practitioner view), on **every PDF export**, and at the end of **every email** the app sends.

```
This information is provided for educational and observational reference only.
Astryx does not diagnose, treat, cure, or prescribe. The astrological correlations
presented are drawn from classical sources and are intended as a complement to —
not a replacement for — care provided by a licensed healthcare professional.

Consult your physician or qualified practitioner for any persistent symptom,
health decision, or concern. Do not stop or alter prescribed medication based
on this information. In an emergency, call your local emergency services.

By using Astryx, you acknowledge and accept these terms.
```

**Style:**
- Always rendered in `text-white/60` or equivalent neutral-low-emphasis style
- Always inside a bordered box or distinct visual container
- Never collapsed/hidden by default on action screens
- Always exported in PDFs (footer of every page)

---

## 5. The Persistent Micro-Disclaimer (Exact Text + Placement)

A small persistent line in the **footer of every single screen** in the app (including loading screens, intake, settings — every screen). Cannot be dismissed.

```
ⓘ Reference tool · Not medical advice
```

**Style spec:**
- Position: footer, centered, ~12px from bottom edge
- Font: 10px, `text-white/40`, font-rajdhani
- Always visible regardless of scroll position (sticky footer)
- Tappable — opens the Full Disclaimer modal on tap
- On mobile: same placement, may shrink to 9px

This ensures every screenshot a user shares carries the disclaimer.

---

## 6. The Three Tiers — Language Policy

### 🌑 Individual ($9.95/mo)

- **Language tier:** Plain-language only. No clinical jargon. No specific pathology names.
- **What they see:** "Your nervous system may feel scattered." "This pattern may suggest your stress threshold is lower than usual right now."
- **What they DO NOT see:** "Mercury-Uranus square indicates risk of generalized anxiety disorder." (clinical claim → banned for this tier)
- **Always-on referral framing:** Every prescription card includes a soft footer like *"For persistent concerns, consider exploring this with your healthcare provider."*
- **Symptom intake limited:** symptom checkboxes (general states: tired, scattered, heavy, restless, inflamed, blocked) — NOT specific medical conditions.
- **Disclaimer:** Universal block + persistent micro.

### 🌒 Practitioner — Self-Attested ($39.95/mo)

- **Language tier:** Clinical terminology unlocked. Classical references cited inline.
- **What they see:** "Saturn in the 6th, classically associated per Cornell (1933) with chronic conditions affecting the bone, joint, and integumentary systems. Your client's natal Saturn at 12° Capricorn squares natal Sun — observational pattern; clinical correlation rests with you."
- **Attestation required at signup** — see §7.
- **Client roster** — they can input clients and run charts on their behalf, with attestation that the client has consented.
- **PDF export** — their name + claimed modality on footer, BUT no credential/license number rendered until verified (next tier).
- **Disclaimer:** Universal block + practitioner-specific addendum: *"The information presented is observational reference. Clinical interpretation, diagnosis, and any recommended interventions are the sole responsibility of the practitioner accessing this output."*

### 🌕 Verified Practitioner ($59/mo)

- **License/credential uploaded and verified** (manual or via third-party verification service in Phase 2).
- **Verified badge** rendered on all client-facing materials (PDF exports, share links, session summaries).
- **Premium clinical features unlock:**
  - PDF templates with their credential auto-filled (e.g., "Sha Blyss, LMT #12345 · Reiki Master · Certified Medical Astrologer")
  - Client referral letters (template wording to refer client to MD, DO, ND, etc.)
  - Insurance-grade SOAP notes (formatted to standards their licensing board recognizes)
  - Multi-client billing exports
- **Verification capture:** license number, issuing body, expiration date, scanned image of license. All stored encrypted.
- **Reverification:** annually OR when expiration date passes.
- **Disclaimer:** Same as Practitioner. Verified status is a credibility marker, not an indemnification.

---

## 7. Attestation Form Texts (Exact, Per Tier)

### Individual Signup Attestation

```
By creating an account, I acknowledge:

  □ I am 18 years of age or older
  □ I understand Astryx provides observational reference only and is not
    medical, psychological, or therapeutic advice
  □ I will consult a licensed healthcare provider for any persistent
    symptom, health decision, or concern
  □ I will not stop or alter prescribed medication based on Astryx output
  □ I agree to the Terms of Service and Privacy Policy

[ Continue ]
```

Capture: user_id, all checkboxes checked (boolean), timestamp UTC, IP, user-agent, exact text shown.

### Practitioner Signup Attestation

```
Astryx Practitioner Access — Professional Attestation

I attest that I am a licensed, certified, or ordained practitioner in good
standing in the following modality:

  [ Dropdown: select modality ]
    · Medical Astrologer
    · Reiki Practitioner (Level II or higher)
    · Reiki Master
    · Licensed Massage Therapist (LMT)
    · Neuromuscular Therapist
    · Sports Massage Therapist
    · Naturopathic Doctor (ND)
    · Doctor of Chiropractic (DC)
    · Doctor of Osteopathy (DO)
    · Acupuncturist / Licensed Acupuncturist (L.Ac.)
    · Ayurvedic Practitioner
    · Herbalist / Clinical Herbalist
    · Pastoral Counselor / Spiritual Director
    · Holistic Health Coach
    · Other (specify): __________________

License / Credential Number (optional, recommended): __________________
Issuing Body / School / Lineage: __________________

I attest under penalty of perjury that:

  □ I am a licensed, certified, or ordained practitioner in the modality
    selected above, in good standing
  □ I understand that Astryx provides observational reference drawn from
    classical sources and does NOT constitute diagnosis, prescription, or
    treatment
  □ I will not present Astryx outputs to my clients as diagnosis, prescription,
    or guaranteed outcome
  □ I accept full professional responsibility for any clinical interpretation,
    recommendation, or intervention I make using Astryx as a reference tool
  □ I will obtain informed consent from my clients before using their birth
    data in Astryx
  □ I will comply with all applicable laws, regulations, and scope-of-practice
    requirements in my jurisdiction
  □ I understand Astryx reserves the right to suspend or terminate my account
    if my attestation is found to be false
  □ I agree to the Practitioner Terms of Service and the Astryx Compliance
    Framework

[ Submit Attestation ]
```

Capture: user_id, modality selected, license number (if provided), issuing body, all checkboxes, timestamp UTC, IP, user-agent, exact text of attestation shown (versioned — store WHICH version of this text they saw), signed acceptance hash.

### Verified Practitioner Upgrade Attestation

```
Verified Practitioner Upgrade — License Verification

To upgrade to Verified Practitioner status, please upload:

  · A clear, current photograph or scan of your professional license,
    certification, or ordination
  · For Reiki/energy modalities without state licensing: certificate
    from your training organization + lineage attestation
  · For medical astrologers: training certificate or attestation from
    recognized program (NCGR, ISAR, AAR, etc.)

By submitting these documents I attest:

  □ The documents I am uploading are authentic, current, and belong to me
  □ The credential is in good standing and has not been suspended or revoked
  □ I will notify Astryx within 30 days of any change to my credential status
  □ I authorize Astryx (or a designated verification service) to verify these
    documents with the issuing body
  □ I understand that false attestation may result in account termination
    and may constitute fraud

[ Upload Documents ]
[ Submit for Verification ]
```

Capture: all of the above + file hashes of uploaded documents + verification status (pending, verified, rejected, expired) + verifier (system or human reviewer) + verification timestamp + reverification due date.

---

## 8. PDF Export Compliance

Every PDF generated by Astryx contains:

**Header:**
- Astryx logo
- Document title
- Date of generation
- Practitioner name + tier (e.g., "Sha Blyss · Verified Practitioner · Reiki Master") OR "Individual Reference" for non-practitioner exports

**Footer (every page):**
```
Astryx · Observational reference only · Not medical advice
Generated [date] · This document does not constitute diagnosis,
prescription, or treatment. Consult a licensed healthcare provider
for any health concern. astryx.app · v[version]
```

**Final page — full disclaimer block** (the Universal Disclaimer from §4) rendered in full.

---

## 9. Liability Escalation — Crisis Keywords

If the user's intake or chat input contains any of the following crisis-related keywords, the app must:

1. **Pause normal flow**
2. **Display the Crisis Resources card** (not the diagnostic)
3. **Log the trigger** for review

**Crisis keyword categories:**

- **Self-harm/suicide:** suicide, kill myself, end it all, want to die, self-harm, cutting, suicidal
- **Active medical emergency:** can't breathe, chest pain, stroke symptoms, severe bleeding, overdose
- **Acute mental health crisis:** psychosis, hallucinating, hearing voices telling me, breaking down, can't cope
- **Domestic violence:** he's hurting me, she's hurting me, abuse, scared of partner

**Crisis Resources card content (exact text):**

```
We hear you. What you're experiencing deserves immediate human support.

Astryx is a reference tool — not a replacement for crisis care.

Please reach out now:

🇺🇸 988 Suicide & Crisis Lifeline — call or text 988
🇺🇸 Crisis Text Line — text HOME to 741741
🇺🇸 Domestic Violence Hotline — 1-800-799-7233
🌍 International: findahelpline.com
🚨 Medical emergency: call your local emergency services

Astryx is here when you're ready to return to reflection and reference.
```

This is **non-negotiable** — every public-facing intake or input field passes through a crisis keyword check before processing.

---

## 10. Practitioner Credential Storage — Audit Trail Spec

For every Practitioner and Verified Practitioner, store **permanently** (even if account is closed):

| Field | Type | Notes |
|---|---|---|
| user_id | UUID | Foreign key to user record |
| tier | enum | individual / practitioner / verified |
| modality_claimed | string | Self-selected from dropdown |
| modality_other_text | string | If "Other" selected |
| credential_number | string | Optional self-reported (Practitioner tier) |
| credential_number_verified | string | Verified-only (Verified tier) |
| issuing_body | string | Self-reported or verified |
| credential_expiration | date | Verified-only |
| credential_file_hash | string | SHA-256 of uploaded license image (Verified) |
| credential_file_storage_path | string | Encrypted storage path (Verified) |
| attestation_text_version | string | Which version of attestation text they signed |
| attestation_text_snapshot | text | Exact text shown to them at signup |
| attestation_checkboxes | jsonb | Map of which boxes they checked |
| attestation_timestamp_utc | timestamptz | When they submitted |
| attestation_ip | inet | IP at submission |
| attestation_user_agent | text | Browser/device at submission |
| signed_acceptance_hash | string | SHA-256 of (user_id + text + timestamp + IP) |
| verification_status | enum | pending / verified / rejected / expired (Verified tier) |
| verified_by | string | "auto-system" or reviewer ID |
| verified_at | timestamptz | When verification completed |
| reverification_due | date | One year from verification by default |

**Retention:** Keep these records for **7 years after account closure** OR the statute of limitations for professional malpractice in the user's jurisdiction — whichever is longer.

**Access:** Only Astryx legal/compliance team can access. Encrypted at rest. Auditable access log.

This is your legal armor. *"They told us they were a licensed professional. Here is the exact text they signed, when they signed it, and what IP they signed from."*

---

## 11. Source Citation Discipline

Every clinical claim or pathology correlation rendered to a Practitioner or Verified Practitioner must include the classical source from which it was drawn.

**Format examples:**
- "Per Cornell (1933, Encyclopedia of Medical Astrology, p. 71): Saturn afflicting Gemini may correspond to chronic respiratory restriction."
- "Per Carey & Perry (1932, The Zodiac and the Twelve Salts of Salvation): Aries natives consume Kali Phos more rapidly than other cell salts."
- "Per Minerva (2023, Iniţiere în astrologia medicală): The Renal Axis (Aries-Libra) governs adrenal and kidney polarity."
- "Per Charak (2005, Essentials of Medical Astrology, 4th ed.): The 6th house and its lord govern disease in Vedic medical astrology."

This is **good practice** AND **legal protection** — when the app says *"classical sources associate this with…"*, we MEAN it, and we can show our work.

For the Individual tier, citations are summarized or removed in favor of plain language — but the underlying claim must still trace back to a cited source in the data files.

---

## 12. Update Workflow — When This Doc Changes

Compliance is living. Laws change. Sources are added. Modalities evolve.

**Process:**
1. Any change to this document gets a new `v` number (semantic — 1.0 → 1.1 for additions, 2.0 for breaking policy changes)
2. The exact text of the disclaimers and attestations is **versioned in the database** — any user who signs an old version is grandfathered under that version's text until re-attestation is required
3. New version → bump version in COMPLIANCE.md header → update `lib/compliance.ts` `COMPLIANCE_VERSION` constant → review all rendered text in the app for consistency → commit with `[compliance]` prefix in commit message
4. Breaking changes (e.g., new banned phrase) require sweep of all data files and UI strings for retrofit

---

## 13. Hard Lines — The Things We Will NEVER Do

These are the bright lines. We don't compromise. We don't take payment to bend these.

1. **We will never claim to diagnose, treat, cure, or prescribe.**
2. **We will never guarantee an outcome.**
3. **We will never market to children under 18 or process their data without verified parental consent.**
4. **We will never make a claim about a substance's safety we cannot scientifically defend.**
5. **We will never withhold the disclaimer on any output-facing surface.**
6. **We will never tell a user in crisis "you'll be fine" — we direct them to professional crisis resources.**
7. **We will never sell or share user birth data, chart data, or symptom data with third parties for advertising or non-essential purposes.**
8. **We will never present Vedic Maraka (death-timing) outputs to Individual users. Verified Practitioners only, with additional warnings.**
9. **We will never market Astryx as a replacement for any licensed professional.**
10. **We will never override a Crisis Keyword trigger to "complete the diagnostic anyway."**

---

## 14. The Practitioner's Side of the Bargain

When a Practitioner uses Astryx with a client, they accept that:

- **The app is their reference, not their voice.** They translate the observational data into clinically appropriate language for their client.
- **They obtain informed consent** before entering a client's birth data.
- **They keep their own clinical records** in their own practice management system. Astryx supplements; it does not replace.
- **They do not represent Astryx outputs as their own clinical work product** without independent professional review.
- **They report inaccuracies or concerning outputs** back to Astryx via the in-app feedback channel.

This bargain is restated in the Practitioner Terms of Service and on every PDF export.

---

*End of COMPLIANCE.md v1.0 — Astryx · Medical Reference & Calibration System*
*Companion: lib/compliance.ts — programmatic enforcement of this document*
