# ASTRYX — Suno Music Session Handoff
### Pick up here to continue building the track library

---

## WHAT THIS IS

Astryx plays two audio layers simultaneously:
1. **Tone.js** — Cousto Hz planetary frequencies (always on)
2. **Suno MP3s** — real instrument recordings matched to planet + polarity state

We need 10 planets × 4 states × 4+ variants = **172+ tracks** in R2.

---

## WHERE THE SPECS LIVE

All Suno prompts (STYLE + AVOID fields) are in these files in the `SUNO_LIBRARY/` folder:

| File | Planet | Hz | BPM | Key/Mode |
|------|--------|----|-----|----------|
| `SUN_tracks.md` | ☉ Sun | 126.22 | 63 | B Lydian |
| `MOON_tracks.md` | ☽ Moon | 210.42 | 53 | G# Phrygian |
| `MERCURY_tracks.md` | ☿ Mercury | 141.27 | 71 | C# Dorian |
| `VENUS_tracks.md` | ♀ Venus | 221.23 | 55 | A Mixolydian |
| `MARS_tracks.md` | ♂ Mars | 144.72 | 72 | D Aeolian |
| `JUPITER_tracks.md` | ♃ Jupiter | 183.58 | 61 | F# Major |
| `SATURN_tracks.md` | ♄ Saturn | 147.85 | 49 | D Dark Minor |
| `URANUS_tracks.md` | ♅ Uranus | 207.36 | 52 | G# Phrygian Dom |
| `NEPTUNE_tracks.md` | ♆ Neptune | 211.44 | 53 | G# Lydian |
| `PLUTO_tracks.md` | ♇ Pluto | 140.25 | 47 | C# Diminished |

Also read: `GLOBAL_INSTRUMENT_GUIDE.md` — the full world instrument palette and which instruments belong to which planets.

---

## THE 4 STATES — HOW THEY WORK

| Code | Name | What it means | Sound character |
|------|------|--------------|-----------------|
| `nat` | Natural | Balanced — amplify the planet | Sounds LIKE the planet |
| `exc` | Excess | Overactive — use corrective planet | Sounds like the CORRECTIVE planet |
| `def` | Deficiency | Underactive — use corrective planet | Sounds like the CORRECTIVE planet |
| `blk` | Blocked | Stuck — use corrective planet | Sounds like the CORRECTIVE planet |

**CRITICAL:** Excess/Def/Blk tracks must sound NOTHING like the primary planet. They use a different planet's Hz, BPM, key, and instruments.

**MARS EXCESS = zero percussion, always.** Moon character only. 53 BPM, G# Phrygian, cooling instruments. This is a user in anger/inflammation state — the music must cool them.

---

## CORRECTIVE PLANET TABLE

| Planet | EXC → | DEF → | BLK → |
|--------|-------|-------|-------|
| Sun | Moon | Mars | Jupiter/Venus |
| Moon | Saturn+Mercury | Sun | Venus |
| Mercury | Saturn | Moon | Sun |
| Venus | Mars | Moon | Jupiter |
| Mars ⚠️ | **Moon** | Sun | Venus |
| Jupiter | Saturn | Venus | Sun |
| Saturn | Venus+Jupiter | Mars | Moon |
| Uranus | Saturn | Sun | Mercury |
| Neptune | Mercury+Saturn | Venus | Mars |
| Pluto | Venus | Jupiter | Saturn |

---

## R2 STORAGE

**Bucket:** `astryx-audio`  
**Public URL:** `https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev`  
**Folder structure:** `{PLANET}/{STATE}/{PLANET}_{STATE}_{NN}.mp3`  
**Example:** `https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev/MARS/EXC/MARS_EXC_02.mp3`

**Naming convention (non-negotiable):** `{PLANET}_{STATE}_{NN}` all caps.  
Example: `MARS_EXC_02`, `MOON_NAT_04`, `SATURN_BLK_01`

---

## SUNO SETTINGS (every track)

- **Lyrics field:** `[Instrumental]`
- **Toggle:** Select "Instrumental" if available
- **Duration target:** 3:30–4:00 (use Extend if needed)
- **Generate:** 2–3 variations, keep the best
- **STYLE** and **AVOID** fields are in each planet's `_tracks.md` file

---

## WHAT TO DO IN THIS SESSION

Open each planet's `_tracks.md` file and generate tracks using the prompts inside. Each file has ready-to-paste STYLE + AVOID fields for every state.

**Priority order:**
1. Any planet/state combos with fewer than 3 variants — add more
2. Expand NAT tracks for all planets (target: 5 NAT variants per planet for variety)
3. After generating, upload to R2 at the path above with correct naming

**To check what's already in R2**, look at `src/lib/sunoLibrary.ts` in the codebase — the `CATALOG` object shows every track that's been registered.

---

## BPM MATH REFERENCE

```
Cousto Hz ÷ 2 = BPM  (Sun, Moon, Mercury, Venus, Mars)
Cousto Hz ÷ 4 = BPM  (Jupiter, Saturn, Uranus, Neptune, Pluto)

Moon: 210.42 ÷ 4 = 53 BPM
Mars: 144.72 ÷ 2 = 72 BPM
Saturn: 147.85 ÷ 4 = 49 BPM
```

Tempo IS the frequency octaved down. Never use arbitrary BPMs.

---

*ASTRYX Suno Handoff | June 2026*
