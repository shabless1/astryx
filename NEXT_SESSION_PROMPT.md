# Paste this to start the next session

```
Astryx — resuming the chrome calibration work.

Read these first, in order:
1. astryx_v14/CHROME_CALIBRATION_HANDOFF.md — the finding and the open decision
2. memory: astryx-chrome-is-fixed
3. astryx_v14/.claude/skills/astryx-house-style — the house style skill

THE FINDING (don't re-derive it, it's confirmed):
src/lib/visual/planetColorTherapyLibrary.ts already carries the therapeutic
intelligence. Every planet has a `base` identity palette AND a per-state
corrective palette. Mars `elevated` prescribes Blue-Green / Deep Indigo and
lists `avoid: ['intensifying red', 'fire bursts']`. Pluto `elevated` avoids
"overwhelming dark red".

The app chrome never consulted any of it — it used PLANET_COLORS[dominant],
the raw BASE hue (Mars = Crimson, Pluto = Burgundy), across every button,
border, label, card glow and the full-viewport background nebula. So on a
Mars/Pluto day the UI rendered exactly the colour its own engine forbids.
The engine is fine. The presentation layer was never wired to it.

DO THIS FIRST, before any colour change:
Fix the persistence trap. `accentColor` is in the zustand persist whitelist
(`astryx-storage`, src/lib/store.ts partialize). Zustand merges the saved blob
OVER the defaults, so a browser holding an old per-planet hue replays it on
every load, before any runtime override runs. Clearing browser cache does NOT
clear localStorage. This made three separate fixes invisible on SHA's own
device while the served bundle was clean. Remove accentColor from partialize
and migrate stored values away. Verify on SHA's device, not by grepping the
bundle.

THEN bring me the decision, don't just build it. Three options:
 (a) chrome takes the CORRECTIVE colour for the user's current state — the
     room cools a hot day. This is never-amplify applied to colour and it's
     what the product actually claims. Claude's recommendation.
 (b) a fixed therapeutic neutral, corrective palette confined to the chamber.
 (c) neutral chrome that warms/cools by STATE only, never by planet identity.

Show me a rendered visual before wiring anything.

Then write the rule into the house-style skill: no chrome element may take a
planet's `base` palette, and none may render a hue listed in that
planet-state's `avoid`.

STATE OF PLAY (live on myastryx.com, all conservative stop-the-harm changes):
- HOUSE_ACCENT = '#C9A961' in src/lib/engineClient.ts — A PLACEHOLDER, not
  approved. getAccentColor() returns it unconditionally.
- SessionScreen accentColor was fork.color → now HOUSE_ACCENT.
- CosmicBackground always resolves DEFAULT_ATMOSPHERE; the per-planet nebula
  table is disconnected (Mars was '220,60,50' @ 0.14, Pluto '150,40,40').
- #E8453C retired app-wide → #C4756A; Root chakra → #C06158.
- Bone TitleStrip shipped on 38 of 56 cards + the chamber's StepCard.
- Body Site Register shipped: 27 sites, 26 photographed, discipline gate live.
- 203 tests green.

STILL OPEN, separate from the colour work:
- The chakra crossing: Sacral/Root resolve to field-only sites correctly, but
  the marma doorway still reads as the card headline instead of a labelled
  alternate worked from behind.
- The 18 cards without a title strip (empty states, accordions, list rows) —
  deliberate, but SHA may want them restructured.

STANDING CONSTRAINTS:
Metaphysical voice, don't sterilize it. 12 forks. Cousto for planets,
Solfeggio for chakra only. Never-amplify. The metal is the source of truth
(Uranus 207.33, Neptune 211.45 — don't "correct" them). Reproductive region
and coccyx are swept, never touched — but no region is omitted. Payments are
Shopify-only. RLS on every table. No secrets in git. Commit as Sha Blyss.
Deploy with `npx vercel deploy --prod` and verify live.
SHA is the architect. Claude is the developer — never ask SHA to write code.
```
