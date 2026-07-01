# Body Maps — Pass 2 asset drop

The Chamber body map (Pass 1 logic) loads from this folder. Drop the four
unified maps here, rendered in the **male-posterior gold-standard style**
(luminous blue holographic anatomy, subtle skeleton, clean dark background,
centered full body, same camera distance / framing / lighting / glow):

```
male-anterior.png
male-posterior.png
female-anterior.png
female-posterior.png
```

Recommended: portrait, ~1024×1536 (2:3), transparent or pure-black background.

Until these exist, the Chamber falls back automatically to the current images
(`body-male-clean.png` / `body-female-clean.png` for front, `body-posterior.png`
for back) — so nothing breaks; the new files simply upgrade the look on next load.

`neutral` ("Prefer not to say") currently routes to the female maps.
