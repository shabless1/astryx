# ASTRYX — Claude Code Directive v2.0
### Complete Audio System · Music Library · R2 Transfer · Deployment
**Date:** June 2026 | **Author:** Cowork (Architecture) → **Execute:** Claude Code

---

## READ THESE FIRST — IN THIS ORDER

1. `CLAUDE.md` — full project architecture, rules, feature flags
2. `COMPLIANCE.md` — banned phrases, output constraints (non-negotiable)
3. `src/lib/sunoLibrary.ts` — the complete track catalog and selection logic
4. `src/lib/sunoPlayer.ts` — the HTML audio manager
5. `src/components/engine/SoundEngineController.tsx` — where both audio layers connect
6. `SUNO_LIBRARY/transfer_to_r2.py` — the 210-file transfer manifest

---

## ORIGIN — WHY THE MUSIC LIBRARY EXISTS

**This is not a feature addition. This is the solution to a broken core system.**

The Astryx sound engine (Tone.js) generates precise Cousto Hz frequencies — scientifically accurate planetary tones. However Tone.js alone produces synthesized drone tones. The result was sterile: technically correct, experientially hollow. Users were not connecting with the sound. The system needed soul.

**The solution architected in this session:** A Suno Music Library — 210 real-world instrument recordings (MP3), curated and custom-generated in Suno AI, each matched to a specific planet and polarity state. These play simultaneously with Tone.js in every session. Suno carries the musical timbre and cultural resonance. Tone.js carries the exact frequency. Together they deliver what neither achieves alone.

**This is the fix. Do not attempt to replace or restructure the Tone.js engine. Do not treat the Suno layer as optional. The dual-layer architecture IS the working audio system for Astryx.**

---

## ARCHITECTURE — 5 FILES BUILT THIS SESSION

All five files are complete and TypeScript-clean. Do not rewrite them — understand them and execute the deployment steps.

### 1. `src/lib/sunoLibrary.ts` — The Catalog & Selection Engine

The master library. Contains:
- `CATALOG` — 201 track filename stems across 10 planets × 4 polarity states
- `stateFromChamberDNA()` — derives which state folder to use from the user's polarity
- `selectTrackFilename()` — deterministic seed-based track selection
- `buildTrackUrl()` — constructs the full CDN URL
- `resolveTrack()` — the main entry point, returns a `SunoTrack` or null

### 2. `src/lib/sunoPlayer.ts` — The HTML Audio Manager

A singleton class (`sunoPlayer`) that manages one `HTMLAudioElement`. Key behaviors:
- Loads a URL, sets `loop = true`, `crossOrigin = 'anonymous'`
- Fades in/out via cosine-ease RAF animation (no clicks or pops)
- `setPhase(phase)` ramps volume over 3 seconds when Tone.js phases change
- `setMasterVolume(vol)` mirrors the master volume slider

### 3. `src/components/engine/SoundEngineController.tsx` — The Integration Point

Where both audio layers are wired together. On session start:
1. `startSessionSound()` launches Tone.js synthesis
2. `resolveTrack(chamberDNA)` selects the Suno track
3. `sunoPlayer.load(url)` + `sunoPlayer.play(3)` starts Suno with 3s fade-in
4. `setOnPhaseChange(phase => sunoPlayer.setPhase(phase))` keeps volumes in sync

On session stop: both layers fade out and are disposed.

The UI shows a track indicator dot (glowing = live, dark = idle, `ERR` = failed).

### 4. `SUNO_LIBRARY/transfer_to_r2.py` — The Transfer Script

A self-contained Python script with every Drive file ID hardcoded. Downloads each MP3 from Google Drive via gdown, uploads to Cloudflare R2, skips already-uploaded files, deletes temp files. Safe to re-run.

### 5. `.env.example` — Feature Gate Documentation

`NEXT_PUBLIC_AUDIO_BASE_URL` is documented. When this variable is unset, `resolveTrack()` returns null and the Suno layer is silently disabled — Tone.js plays alone. When set to the R2.dev public URL, the full dual-layer system activates.

---

## MUSIC LIBRARY SYSTEM — COMPLETE REFERENCE

### Track Selection Chain (birth data → audio file)

```
User enters birth data
        ↓
ChamberDNAEngine produces ChamberDNA {
  seed: number          // 32-bit hash of birth date + time + city
  primaryPlanet: string // dominant planet ('sun', 'mars', 'moon', etc.)
  applyCorrective: bool // true if a corrective protocol applies
  polarity: {
    dominant_state: 'excess' | 'deficiency' | 'blocked' | 'balanced'
  }
}
        ↓
stateFromChamberDNA(dna) → SunoState
  applyCorrective=false OR balanced → 'nat'
  dominant_state='excess'           → 'exc'
  dominant_state='deficiency'       → 'def'
  dominant_state='blocked'          → 'blk'
        ↓
selectTrackFilename(planet, state, seed)
  tracks = CATALOG[planet][state]   // array of filename stems
  idx = Math.abs(seed) % tracks.length
  return tracks[idx]                // e.g. 'MARS_EXC_01b'
        ↓
buildTrackUrl(planet, state, filename)
  base = NEXT_PUBLIC_AUDIO_BASE_URL (e.g. 'https://pub-XXXX.r2.dev')
  return `${base}/${planet}/${state}/${filename}.mp3`
  // e.g. https://pub-XXXX.r2.dev/mars/exc/MARS_EXC_01b.mp3
        ↓
sunoPlayer.load(url).play(3)       // 3-second fade-in
```

**Critical rule:** `primaryPlanet` drives the Suno folder (which library to draw from). `effectivePlanet` drives the Tone.js frequency character. They can differ. Do not conflate them.

**Determinism rule:** The same birth data always produces the same seed, which always selects the same track index. This is intentional and non-negotiable — the system is a calibration instrument, not a random playlist.

### R2 Folder Structure

```
astryx-audio/              ← R2 bucket name
  sun/
    nat/  SUN_NAT_01.mp3   SUN_NAT_02.mp3  ... SUN_NAT_05b.mp3
    exc/  SUN_EXC_01.mp3   SUN_EXC_02.mp3  SUN_EXC_02b.mp3  SUN_EXC_03.mp3
    def/  SUN_DEF_01.mp3   SUN_DEF_01b.mp3  SUN_DEF_01c.mp3  SUN_DEF_02.mp3
    blk/  SUN_BLK_01.mp3   SUN_BLK_01b.mp3  SUN_BLK_02.mp3  SUN_BLK_02b.mp3
  moon/
    nat/  MOON_NAT_01.mp3 ... MOON_NAT_05b.mp3
    exc/  MOON_EXC_01.mp3  MOON_EXC_01a.mp3  MOON_EXC_01b.mp3 ... (7 files)
    def/  MOON_DEF_01.mp3  MOON_DEF_02.mp3
    blk/  MOON_BLK_01.mp3
  mercury/ venus/ mars/ jupiter/ saturn/ uranus/ neptune/ pluto/
    (same structure)
```

**File naming rules — non-negotiable:**
- Filename: ALL CAPS — `MARS_EXC_01.mp3` ✓ — `mars_exc_01.mp3` ✗
- Folder: all lowercase — `mars/exc/` ✓ — `MARS/EXC/` ✗
- Variants: lowercase suffix directly after number — `MARS_EXC_01b.mp3` ✓ — `MARS_EXC_01_B.mp3` ✗
- MOON_EXC_01 has an `a` variant (three versions): `MOON_EXC_01.mp3`, `MOON_EXC_01a.mp3`, `MOON_EXC_01b.mp3`
- All other variants use `b`, `c` suffix only

### Volume Hierarchy

```
masterVolume (0..1)        ← user's slider in SoundEngineController
    × SUNO_LEVEL (0.80)    ← Suno sits at 80% of Tone.js master
    × phaseMultiplier      ← changes with each session phase

Phase multipliers:
  entry       → 0.60   (gentle introduction)
  activation  → 0.80   (building presence)
  peak        → 1.00   (full dual-layer)
  regulation  → 0.75   (softening)
  integration → 0.50   (gentle close)

Effective Suno volume = masterVolume × 0.80 × phaseMultiplier
Example at peak with volume=0.7: 0.7 × 0.80 × 1.00 = 0.56
```

Phase transitions trigger `sunoPlayer.setPhase(phase)` which ramps volume over 3 seconds using cosine easing (no audible clicks).

### Track Counts by Planet

| Planet | nat | exc | def | blk | Total |
|--------|-----|-----|-----|-----|-------|
| Sun | 7 | 4 | 4 | 4 | 19 |
| Moon | 8 | 7 | 2 | 1 | 18 |
| Mercury | 6 | 4 | 3 | 4 | 17 |
| Venus | 9 | 4 | 1 | 4 | 18 |
| Mars | 7 | 6 | 4 | 4 | 21 |
| Jupiter | 13 | 8 | 2 | 5 | 28 |
| Saturn | 8 | 6 | 5 | 5 | 24 |
| Uranus | 6 | 5 | 3 | 4 | 18 |
| Neptune | 11 | 6 | 5 | 4 | 26 |
| Pluto | 6 | 3 | 2 | 4 | 15 |
| **Total** | **81** | **53** | **31** | **39** | **204** |

### 10 Missing Tracks (pending Suno creation — not in R2 manifest)

These tracks are commented out in the CATALOG and absent from `transfer_to_r2.py`. The app handles them gracefully — the seed selector picks from what exists.

```
MERCURY_NAT_04    VENUS_NAT_03     VENUS_DEF_02
MARS_NAT_05       JUPITER_DEF_02   MOON_BLK_02
URANUS_NAT_01     URANUS_EXC_01    PLUTO_EXC_01
PLUTO_DEF_01
```

**When SHA creates these in Suno and uploads to Drive:**
1. Add the Drive file ID + R2 path to `SUNO_LIBRARY/transfer_to_r2.py` MANIFEST list
2. Add the filename stem to the correct array in `src/lib/sunoLibrary.ts` CATALOG (remove the comment placeholder)
3. Re-run `transfer_to_r2.py` — it skips existing files and only uploads new ones
4. Redeploy to Vercel

### Feature Gate Behavior

`NEXT_PUBLIC_AUDIO_BASE_URL` controls whether the Suno layer is active:

| Variable state | Behavior |
|---------------|----------|
| Unset / empty | `resolveTrack()` returns null. Suno layer silent. Tone.js plays alone. No errors. |
| Set to R2.dev URL | Full dual-layer audio. Both Tone.js and Suno play simultaneously. |
| Set to `/audio/library` | Local dev mode — MP3s served from `public/audio/library/` folder (not for production) |

---

## CORRECTIVE FRAMEWORK — THE THERAPEUTIC LOGIC BEHIND EVERY TRACK

**Read this section if you need to understand why tracks sound the way they do, validate that the system is working correctly, or debug why a track feels wrong.**

### The Core Concept

Each track exists for a specific therapeutic purpose. This is not a mood playlist. Every track was precisely engineered to address a specific energetic condition in the user. The system has two modes:

**Amplifying (nat state):** The user is balanced or in a naturally harmonic state. The tracks amplify and deepen the primary planet's character. They sound like the planet — radiant, watery, airy, grounded, etc.

**Corrective (exc / def / blk states):** The user has an energetic imbalance. The tracks use a *different planet's character* to counteract it. Excess Sun uses Moon's cooling, receptive character. Excess Mars uses Moon's calming character. Moon deficiency uses Venus's warmth. This is why corrective tracks often sound nothing like the primary planet — they are not supposed to. They are the medicine, not the amplifier.

**If a corrective track sounds like the primary planet — it is wrong. Regenerate it.**

---

### BPM Math — Tempo Is the Frequency

Every BPM in the library is derived from the planet's Cousto Hz, not chosen aesthetically.

```
Cousto Hz ÷ 2 = BPM (for faster planets)
Cousto Hz ÷ 4 = BPM (for slower planets — outer planets, moon)
```

Examples:
```
Sun    126.22 ÷ 2 = 63.1  → 63 BPM
Moon   210.42 ÷ 4 = 52.6  → 53 BPM
Mars   144.72 ÷ 2 = 72.4  → 72 BPM
Saturn 147.85 ÷ 4 = 36.9  → rounded to 47 BPM (anchoring)
Pluto  140.25 ÷ 4 = 35.1  → 47 BPM (slowest in library)
```

When corrective tracks use a regulator planet's BPM, they are operating at that planet's derived tempo. The tempo is the therapy — it is the frequency expressed as rhythm rather than pitch.

---

### Per-Planet Hz, BPM, Mode, and Corrective Direction

This table is the master reference. If any track's character, tempo, or key contradicts this table, it was generated incorrectly.

| Planet | Hz (Cousto) | BPM | Mode | State | Corrective Dir | Corrective Hz | Corrective BPM | Corrective Mode |
|--------|------------|-----|------|-------|---------------|--------------|----------------|-----------------|
| **☉ Sun** | 126.22 | 63 | B Lydian | nat | — | — | — | — |
| | | | | exc | Moon | 210.42 | 53 | G# Phrygian |
| | | | | def | Mars | 144.72 | 72 | D Dorian/Aeolian |
| | | | | blk | Jupiter/Venus | 183.58 | 61–67 | F# Ionian / A Mixolydian |
| **☽ Moon** | 210.42 | 53 | G# Phrygian | nat | — | — | — | — |
| | | | | exc | Saturn + Mercury | 147.85 | 47 | D Locrian |
| | | | | def | Venus | 221.23 | 55 | A Mixolydian |
| | | | | blk | Venus + Neptune | 221.23 | 53 | G# Lydian b7 |
| **☿ Mercury** | 141.27 | 71 | C# Dorian | nat | — | — | — | — |
| | | | | exc | Saturn | 147.85 | 47 | D Locrian |
| | | | | def | Sun | 126.22 | 63 | B Lydian |
| | | | | blk | Jupiter | 183.58 | 61 | F# Ionian |
| **♀ Venus** | 221.23 | 55 | A Mixolydian | nat | — | — | — | — |
| | | | | exc | Mars | 144.72 | 72 | D Aeolian |
| | | | | def | Venus (amplified) | 221.23 | 55 | A Mixolydian (fuller) |
| | | | | blk | Moon | 210.42 | 53 | G# Phrygian |
| **♂ Mars** | 144.72 | 72 | D Aeolian | nat | — | — | — | — |
| | | | | **exc** | **Moon** | **210.42** | **53** | **G# Phrygian** |
| | | | | def | Sun | 126.22 | 63 | B Lydian |
| | | | | blk | Venus + Jupiter | 221.23 | 55–67 | A Mixolydian |
| **♃ Jupiter** | 183.58 | 61 | F# Ionian | nat | — | — | — | — |
| | | | | exc | Saturn | 147.85 | 49 | D minor (sparse) |
| | | | | def | Jupiter (amplified) | 183.58 | 61 | F# Ionian (fuller) |
| | | | | blk | Venus | 221.23 | 55 | A Mixolydian |
| **♄ Saturn** | 147.85 | 49 | D dark minor | nat | — | — | — | — |
| | | | | exc | Venus + Jupiter | 221.23 | 55 | A Mixolydian |
| | | | | def | Saturn (amplified) | 147.85 | 49 | D minor (structure) |
| | | | | blk | Venus + Moon | 221.23 | 55 | A Mixolydian |
| **♅ Uranus** | 207.36 | 52 | G# Phrygian Dom | nat | — | — | — | — |
| | | | | exc | Saturn | 147.85 | 47 | D minor |
| | | | | def | Uranus (amplified) | 207.36 | 58 | G# unusual |
| | | | | blk | Jupiter | 183.58 | 61 | F# major |
| **♆ Neptune** | 211.44 | 53 | G# Lydian | nat | — | — | — | — |
| | | | | exc | Mercury + Saturn | 141.27 | 57 | C# Dorian |
| | | | | def | Neptune (amplified) | 211.44 | 48 | G# Lydian (deeper) |
| | | | | blk | Venus | 221.23 | 55 | A Mixolydian |
| **♇ Pluto** | 140.25 | 47 | C# Diminished | nat | — | — | — | — |
| | | | | exc | Venus | 221.23 | 55 | A Mixolydian |
| | | | | def | Mars | 144.72 | 72 | D Aeolian |
| | | | | blk | Venus | 221.23 | 55 | A Mixolydian |

---

### ⚠️ MARS EXCESS — THE MOST CLINICALLY CRITICAL STATE IN THE LIBRARY

`MARS_EXC` tracks must be flagged and treated with the highest scrutiny of any tracks in the library.

**Why:** Users routed to MARS_EXC are presenting with excess Mars energy — anger, inflammation, heat, aggression, nervous activation, or cardiovascular stress. Playing anything activating, percussive, or energizing at this moment is clinically counterproductive. The tracks must genuinely cool, calm, and regulate.

**What MARS_EXC tracks must be:**
- G# Phrygian, 53 BPM (Moon's frequency character — the cooler, receptive, lunar opposite of Mars)
- **Zero percussion** — no drums, no frame drum, no pulse of any kind. Percussion activates Mars. This is non-negotiable.
- Cooling instruments: cello, singing bowls, soft harp, sustained strings
- Emotional character: calming, cooling, receptive, flowing, lunar — not soothing-in-a-generic-spa-way, but specifically the OPPOSITE of everything Mars natural tracks feel

**Quality gate for MARS_EXC:** If you are unsure whether a MARS_EXC track is correct, ask: "Does this sound like it could be a Mars natural track?" If yes — it failed. Regenerate it.

---

### State Character Reference — What Each State Must Sound Like

This is the critical reference for validating whether a track is correct for its state.

**`nat` (Natural):** The planet at its fullest expression. Amplifying. The sound should feel like the planet's signature character delivered with complete confidence.
- Sun nat: Radiant, solar, golden, vital. B Lydian warmth. Never dark, never cool.
- Moon nat: Floating, unresolved, watery, cyclical. Hovering in G# Phrygian — never arriving.
- Mercury nat: Quick, crystalline, airy, nimble. Glass-like arpeggios. Never slow or heavy.
- Venus nat: Lush, warm, sensual, harmonious. A Mixolydian softness. Never cold or rigid.
- Mars nat: Driving, vital, activated, courageous. D Aeolian force. Never passive or cooling.
- Jupiter nat: Expansive, abundant, wide. F# Ionian brightness. Uses global instruments (see below).
- Saturn nat: Sparse, ancient, structured, heavy. D dark minor authority. Long silences.
- Uranus nat: Electric, unexpected, angular, unusual. Harmonics that don't resolve where expected.
- Neptune nat: Oceanic, dissolving, mystical, formless. G# Lydian dream state.
- Pluto nat: Deep, primal, transformative, underworld weight. Slowest tracks in the library.

**`exc` (Excess Corrective):** The opposite of the planet's character, applied as medicine. Should sound nothing like the nat state. If a user hears it and thinks "this sounds like [planet]" — it failed.

**`def` (Deficiency Corrective):** Warming, inviting, gently activating in the direction of the missing quality. Softer than the nat state — an invitation, not a push. Should feel safe and nourishing.

**`blk` (Blocked Corrective):** Opening, dissolving, releasing. Permission-giving in character. The block is a frozen or stuck state — these tracks do not push through it, they melt it. Character is warm and gentle, like warm water on ice.

---

### Global Instrument Palette — Jupiter through Pluto

Inner planets (Sun, Moon, Mercury, Venus, Mars) primarily use Western classical instruments (piano, cello, harp, violin, flute) because their corrective functions are more immediately accessible and the familiarity of Western instruments supports the therapeutic direction.

Outer planets (Jupiter through Pluto) use the global instrument palette — one specific world tradition per track — because their energies are archetypal and transpersonal. The cultural sourcing is intentional: these instruments carry their civilizations' accumulated relationship with these cosmic forces.

| Planet | Instrument Traditions Used |
|--------|--------------------------|
| Jupiter | West African kora, Indian shehnai, Andean zampoña, Zimbabwean mbira, Mongolian morin khuur |
| Saturn | West African dunun, Chinese guqin, Armenian duduk, Japanese shakuhachi, Tibetan dungchen |
| Uranus | Balinese gamelan, West African talking drum, Japanese prepared koto, Persian santur, Zimbabwean mbira |
| Neptune | Japanese shakuhachi, Persian ney, West African kora, Australian Aboriginal didgeridoo, Native American cedar flute |
| Pluto | West African dunun, Yoruba batá drums, Tibetan dungchen, Australian Aboriginal didgeridoo, South Indian mridangam |

**For corrective tracks on outer planets**, the regulator's character is expressed through a different world tradition instrument — not the same tradition as the nat tracks. The instrument choice must match the corrective direction, not the planet's natural tradition.

Examples:
- Saturn excess corrective uses West African kora and Zimbabwean mbira (warm, flowing, Venus/Jupiter character) — not dunun or guqin (which are Saturn's natural sound)
- Pluto excess corrective uses West African kora, Middle Eastern oud, Indian sarangi (Venus warmth) — not batá drums

---

### How the Tracks Were Generated in Suno

Each track was generated using this structure:

**STYLE prompt** — describes the sound to create (instruments, key, BPM, character, `instrumental` tag mandatory)
**AVOID prompt** — describes what must not be present (vocals, rhythms, timbres that belong to the wrong state)

The `[Instrumental]` tag must always be present. Tracks with audible vocals or lyrics were rejected and regenerated.

Target duration: 3:30–4:00 per track. Tracks must sustain at full quality to the end (Suno sometimes degrades after 2:30 — tracks that degrade were regenerated).

Quality criteria applied to every track before acceptance:
- No audible vocals or lyrics at any point
- Emotional/energetic character clear within the first 15 seconds
- Works with headphones (Tone.js binaural plays underneath — tracks must not fight it)
- Could be looped without an obvious seam point
- If a corrective track — character is unambiguously opposite to the nat state character

---

## TYPESCRIPT FIXES ALREADY MADE — DO NOT RE-INTRODUCE

Two bugs were caught and fixed in the Cowork session before this directive was written:

**Bug 1 — `hexToRgb().join()` type error** (`SoundEngineController.tsx` line 260)

`hexToRgb()` in `src/lib/utils.ts` returns a `string` (e.g. `"255,128,0"`), not an array. The call `.join(',')` was applied to a string, causing `TS2339: Property 'join' does not exist on type 'string'`.

Fixed: `rgba(${hexToRgb(accentColor)?.join(',')},0.08)` → `rgba(${hexToRgb(accentColor)},0.08)`

**Bug 2 — Null byte file corruption** (`SoundEngineController.tsx` line 438)

11 null bytes (`\x00`) were appended to the file during a write operation, causing `TS1127: Invalid character` errors on every null byte. Fixed by stripping them with Python: `data.rstrip(b'\x00')`.

**Verify before any commit:**
```bash
npx tsc --noEmit && echo "TypeScript: CLEAN"
```
This must exit 0. If it does not, fix all errors before proceeding.

---

## CREDENTIALS — COLLECT FROM SHA ONCE AT SESSION START

```
R2_ACCESS_KEY_ID       ← Cloudflare R2 API token Access Key ID
R2_SECRET_ACCESS_KEY   ← Cloudflare R2 API token Secret Access Key
R2_ACCOUNT_ID          ← Cloudflare Account ID (top-right of Cloudflare Dashboard)
```

**How SHA gets R2 credentials:**
Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create Token
→ Permissions: Object Read & Write on bucket `astryx-audio`
→ Copy Access Key ID + Secret Access Key.

**R2 endpoint** (build from Account ID):
```
R2_ENDPOINT=https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
```

**Two things SHA must do manually** (require Cloudflare Dashboard access):

1. Enable R2.dev public URL:
> "Go to Cloudflare Dashboard → R2 → astryx-audio → Settings → Public Access → Enable R2.dev subdomain. Copy the URL (format: `https://pub-XXXX.r2.dev`) and give it to me."

2. Share Google Drive folder temporarily:
> "Open Google Drive → right-click MUSIC LIBRARY folder → Share → Anyone with the link can view. You can revoke after transfer completes."

---

## EXECUTION — 6 STEPS IN ORDER

### STEP 1 — Install Python Dependencies

```bash
pip install gdown boto3 --break-system-packages
python3 -c "import gdown, boto3; print('deps: OK')"
```

Expected: `deps: OK`. If not, try `pip3`.

---

### STEP 2 — Set R2 CORS Policy

Without CORS, every browser audio request to R2 is blocked with `Access-Control-Allow-Origin` missing. Must be done before any user can hear audio.

```bash
python3 << 'EOF'
import boto3, os

s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["R2_ENDPOINT"],
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
)

s3.put_bucket_cors(
    Bucket="astryx-audio",
    CORSConfiguration={
        "CORSRules": [{
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 86400,
        }]
    },
)

resp = s3.get_bucket_cors(Bucket="astryx-audio")
print("CORS confirmed:", resp["CORSRules"])
EOF
```

Verification: output shows `AllowedOrigins: ['*']`. If `NoSuchCORSConfiguration` on the get call, the put failed — check credentials and endpoint URL.

---

### STEP 3 — Transfer Drive MP3s to R2

**Dependency:** Step 1 complete, Step 2 complete, SHA's Drive folder public.

The transfer script variable names differ slightly from the env vars above. Map them:

```bash
export R2_ACCESS_KEY="$R2_ACCESS_KEY_ID"
export R2_SECRET_KEY="$R2_SECRET_ACCESS_KEY"
# R2_ENDPOINT already set

cd <project_root>
python3 SUNO_LIBRARY/transfer_to_r2.py
```

**Script behavior:**
- Downloads all 210 MP3s from Google Drive (gdown by file ID)
- Uploads immediately to `astryx-audio` at `{planet}/{state}/{FILENAME}.mp3`
- Skips files already present in R2 (idempotent — safe to re-run)
- Deletes local temp file after each successful upload
- Prints per-file progress and a final count summary

**If gdown is rate-limited** (file downloads as 0 bytes or shows "Too many requests"), add a sleep. In `SUNO_LIBRARY/transfer_to_r2.py`, inside `download_file()`, add before the final `return`:
```python
import time
time.sleep(2)
```
Then re-run. Already-uploaded files are skipped automatically.

**Verification:** Script prints either `✅ All N tracks are in astryx-audio` or a list of failures. If failures, re-run — only failed files are retried.

---

### STEP 4 — Set Vercel Environment Variable

**Dependency:** SHA has provided the R2.dev public URL from Step 2 setup above.

Variable to set in Vercel → Production environment:

```
Name:  NEXT_PUBLIC_AUDIO_BASE_URL
Value: https://pub-XXXX.r2.dev
       (SHA's actual R2.dev URL — no trailing slash)
Env:   Production  (also add to Preview if desired)
```

Use the **Vercel MCP** tools available in this Claude Code session:
1. Call `list_projects` to find the Astryx project
2. Set the environment variable via the appropriate Vercel MCP tool
3. Confirm it appears under Project → Settings → Environment Variables

If Vercel MCP is unavailable, use CLI:
```bash
vercel env add NEXT_PUBLIC_AUDIO_BASE_URL production
# Paste the R2.dev URL when prompted
```

---

### STEP 5 — Redeploy to Vercel

**Dependency:** Step 4 complete. Environment variables only activate on the next build.

Via Vercel MCP `deploy_to_vercel` tool, OR:
```bash
vercel --prod
```

**Build must pass with zero TypeScript errors.** If build fails:
1. Run `npx tsc --noEmit` locally — fix all errors before pushing
2. Confirm `NEXT_PUBLIC_AUDIO_BASE_URL` is set to Production (not Preview only)
3. Check build logs for any missing import or module resolution error in the Suno files

**Verification:** Vercel build log shows `✓ Compiled successfully`. Live URL loads without console errors.

---

### STEP 6 — Live Audio Smoke Test

**Dependency:** Step 5 complete. Run immediately after deploy.

Open the live app. Run exactly four test sessions — one per polarity state — to confirm the full selection chain works end to end:

| Test | What to enter | Expected Sound Engine panel |
|------|--------------|----------------------------|
| 1 | Any birth chart, balanced chart | State: `nat` · Dot glowing · `LIVE` label |
| 2 | Chart with excess polarity pattern | State: `exc` · Dot glowing · `LIVE` label |
| 3 | Chart with deficiency polarity | State: `def` · Dot glowing · `LIVE` label |
| 4 | Chart with blocked polarity | State: `blk` · Dot glowing · `LIVE` label |

**Pass criteria per test:**
- Suno track dot glows in accent color
- Filename label shows correct planet and state (e.g. `♫ mars exc 01b`)
- `LIVE` badge is displayed
- Audio is audible — real instrument sound layered under Tone.js drone
- Session does not crash or throw console errors

**If `ERR` appears:**
Open browser → DevTools → Network tab → find the failing `.mp3` request → check:
- URL casing: filename must be UPPERCASE (`MARS_EXC_01b.mp3`), folder lowercase (`mars/exc/`)
- File exists in R2: verify in Cloudflare Dashboard → R2 → astryx-audio → browse
- CORS headers: the response must include `Access-Control-Allow-Origin: *` — if missing, re-run Step 2

**If dot shows `LIVE` but audio is inaudible:**
- Check volume slider is above 0 and not muted
- Suno plays at 80% of master × phase multiplier — at `entry` phase this is 48% of master. Confirm master is not at minimum.

---

## ADDING NEW TRACKS WHEN SHA CREATES THEM IN SUNO

When SHA generates any of the 10 missing tracks and uploads to Google Drive:

**1. Add to transfer manifest** (`SUNO_LIBRARY/transfer_to_r2.py`):
```python
# Add one line to MANIFEST list:
("GOOGLE_DRIVE_FILE_ID", "planet/state/PLANET_STATE_NN.mp3"),
# e.g.:
("1aBcDeFgHiJkLmN", "mars/nat/MARS_NAT_05.mp3"),
```

**2. Add to CATALOG** (`src/lib/sunoLibrary.ts`):
```typescript
// Find the planet and state array, remove the comment, add the filename:
mars: {
  nat: [
    'MARS_NAT_01', 'MARS_NAT_01b',
    'MARS_NAT_02', 'MARS_NAT_02b',
    'MARS_NAT_03',
    'MARS_NAT_04', 'MARS_NAT_04b',
    'MARS_NAT_05',  // ← add here (was commented out)
  ],
```

**3. Re-run transfer script** — skips all 210 existing files, uploads only the new one.

**4. Redeploy** via Vercel MCP or `vercel --prod`.

No other changes required.

---

## GLOBAL RULES — NON-NEGOTIABLE

1. **Feature flags are sacred.** Never hard-code `sacredtea.net` shop URLs. Always check `NEXT_PUBLIC_SHOP_LIVE` and `NEXT_PUBLIC_SACRED_TONES_SHOP_LIVE` before rendering any shop link.

2. **Compliance layer.** Every user-facing assessment string passes through `lib/compliance.ts` helpers (`safePhrase()`, `withDisclaimer()`). The 7 banned phrases in `COMPLIANCE.md` never appear in any output — UI, PDF, or email.

3. **Hz frequencies** come exclusively from `planetary-anchors.json` and `sacredTones_nervousSystem.json` (Cousto cosmic octave). Never invent or alter Hz values.

4. **Malachite** gets a red warning badge everywhere it appears in the UI. Raw malachite contains toxic copper carbonate dust. Non-negotiable.

5. **TypeScript: zero errors.** Run `npx tsc --noEmit` before every commit. Exit code must be 0.

6. **No new npm packages** without checking `package.json` for existing coverage first.

7. **Solar Chart** is always labeled `☉ Solar Chart` in the chart wheel, PDF footer, and API response. Never hidden or downplayed.

8. **Do not touch Tone.js engine files** (`src/lib/soundEngine.ts`). The synthesis layer is working. The Suno library runs alongside it — not instead of it.

---

## COMPLETION

After all 6 steps pass, run final health check:

```bash
npx tsc --noEmit && echo "TypeScript: CLEAN"
```

Then create `FIXES_COMPLETE_v2.md` at the project root with:
- Date and time of completion
- Total files transferred to R2, count of skips and failures
- The exact R2.dev URL set in Vercel
- Vercel deployment URL
- Results of 4-scenario smoke test (pass/fail per scenario, track filenames observed)
- Any decisions made that differed from this directive and why

---

## WHAT THIS DELIVERS

When all 6 steps are complete, every Astryx session plays two simultaneous audio layers:

**Tone.js** — exact Cousto Hz planetary frequencies. Scientifically precise. Always present. The frequency of the planet, calculated from Hans Cousto's Law of the Octave.

**Suno MP3** — real-world instrument recordings. Culturally sourced globally (West African kora, Persian ney, Aboriginal didgeridoo, Japanese shakuhachi, Tibetan dungchen, and more). Matched to the user's dominant planet and their polarity state. The same person always hears the same track — deterministic, personal, repeatable.

The same birth data always resolves the same sound. This is the calibration instrument SHA built. The frequency is the gold. The music is the vessel it travels in.

---

*ASTRYX Audio System · Claude Code Directive v2.0 · June 2026*
*Proprietary — SHA Blyss / House of MahMah Tea ecosystem. Do not distribute externally.*
