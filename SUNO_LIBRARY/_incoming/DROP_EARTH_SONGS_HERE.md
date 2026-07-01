# 🎵 DROP EARTH SONGS HERE

Drop your Suno MP3 downloads into this folder (`SUNO_LIBRARY/_incoming/`).
Name them anything for now — even Suno's default names are fine.

In the chat, tell me which file maps to which track. Example:
- "the chill one" → EARTHDAY_NAT_01 (Sunrise Soul)
- "the warmer one" → EARTHDAY_NAT_02 (Grateful Ground)

## What I'll do once they're here
1. Verify each file plays and is a valid MP3
2. Rename to the locked convention → `EARTHDAY_NAT_01.mp3`, `EARTHYEAR_NAT_01.mp3`, etc.
3. Register them in `src/lib/astryxAudioLibrary.ts` (the CATALOG)
4. Hand you the exact R2 upload paths + a sync script if you want one

## The naming map (so you can pre-label if you like)

### Earth Day — 🜨 194.18 Hz · G (the soul tone)
| Track | Filename | R2 path |
|-------|----------|---------|
| Sunrise Soul | `EARTHDAY_NAT_01.mp3` | `EARTHDAY/NAT/EARTHDAY_NAT_01.mp3` |
| Grateful Ground | `EARTHDAY_NAT_02.mp3` | `EARTHDAY/NAT/EARTHDAY_NAT_02.mp3` |
| Body Electric | `EARTHDAY_NAT_03.mp3` | `EARTHDAY/NAT/EARTHDAY_NAT_03.mp3` |
| Amber Hour | `EARTHDAY_NAT_04.mp3` | `EARTHDAY/NAT/EARTHDAY_NAT_04.mp3` |
| Daily Rotation | `EARTHDAY_NAT_05.mp3` | `EARTHDAY/NAT/EARTHDAY_NAT_05.mp3` |

### Earth Year — 🜨 136.10 Hz · C# (the OM / grounding tone)
| Track | Filename | R2 path |
|-------|----------|---------|
| Om of the World | `EARTHYEAR_NAT_01.mp3` | `EARTHYEAR/NAT/EARTHYEAR_NAT_01.mp3` |
| Turquoise Field | `EARTHYEAR_NAT_02.mp3` | `EARTHYEAR/NAT/EARTHYEAR_NAT_02.mp3` |
| Heartbeat of Gaia | `EARTHYEAR_NAT_03.mp3` | `EARTHYEAR/NAT/EARTHYEAR_NAT_03.mp3` |
| Standing Stone | `EARTHYEAR_NAT_04.mp3` | `EARTHYEAR/NAT/EARTHYEAR_NAT_04.mp3` |
| Year's Breath | `EARTHYEAR_NAT_05.mp3` | `EARTHYEAR/NAT/EARTHYEAR_NAT_05.mp3` |

*Bucket: `astryx-audio` · all caps · {PLANET}/{STATE}/{PLANET}_{STATE}_{NN}.mp3*
