# THE ROOM CALIBRATES — RESOLVED
### SHA's ruling landed 2026-09-12 · superseded the open directive of the same date

---

## SHA's ruling

> *"I choose C, but depleted days should NEVER be hot red, blood red, crimsoned red."*

**Model C is live.** Chrome answers the carrier's **state** and never the planet's
identity. "Never red" is enforced as a code invariant, not a convention.

---

## What shipped

### 1. The persistence trap — closed first, as directed

`accentColor` sat in the zustand persist whitelist. zustand merges the saved blob
*over* the defaults, so a browser holding an old per-planet hue replayed it on every
load, before any runtime override ran. Clearing the browser cache does not clear
localStorage — which is why three clean fixes were invisible on SHA's own device.

- `accentColor` removed from `partialize`. Chrome resolves at runtime, every load.
- persist `version: 2` + `migrate` strips a stored `accentColor` off the root **and**
  off every saved history record and session-log entry.
- `merge` strips it on **every** load, not just the one migration, so no future write
  path or hand-edited localStorage can pin the room again.
- The store seeded chrome with violet `#8B5CF6`; it now seeds the house colour.
- Three screens replayed a stored hue back into chrome — loading a history record
  (Dashboard), the post-session summary, and the History accent stripe. All fixed.

**Verified live on a poisoned browser**, not by a bundle grep: `astryx-storage` was
seeded with `accentColor: '#C5283D'` (Mars Crimson) plus poisoned history and
session-log rows at `version: 1`, then myastryx.com was loaded. Result: version 2,
all three stored hues absent.

### 2. The four rooms

`src/lib/visual/chromeAccent.ts`. One neutral family, temperature-shifted in the
direction the therapy moves. The planet's identity never reaches chrome, so a Mars
day and a Neptune day in the same state give the same room.

| State | Chrome | Name | The room |
|---|---|---|---|
| `elevated` | `#8FA9A6` | Cooled Stone | running hot → the room cools |
| `depleted` | `#CFA65C` | Warm Amber | running low → the room warms |
| `blocked` | `#B3A891` | Dry Stone | compressed → the room loosens |
| `balanced` | `#C9A961` | House Gold | coherent → the room at rest |

### 3. "Never red" as an invariant

`RED_BAND` = hue < 28° or > 335° at saturation > 0.30. `assertChromeSafe` **throws**
on any value inside it and runs over the table at module load, so a bad chrome colour
fails where it is introduced instead of shipping quietly. Depleted sits at hue 38° —
the far side of the band edge, not near it.

### 4. Wiring

- `getAccentColor` no longer touches `PLANET_COLORS`; it resolves the room.
- `CosmicBackground` paints the largest chrome surface in the app. The nebula now
  takes its tint from the resolved room and its strength/placement from that room's
  temperature. The per-planet table stays disconnected and must never be reindexed
  by `dominantPlanet`.
- The chamber step card took a fixed gold after it stopped taking `fork.color`; it now
  follows the room, so a hot day cools the chamber frame too.
- Loading a history record resolves the room from *that reading's* state.

### 5. The law, in the house-style skill

`astryx-house-style` §3c THE CHROME LAW:

1. No chrome element may take a planet's `base` palette. Base is identity.
2. No chrome element may render a hue listed in that planet-state's `avoid`.

Plus the red-band trap, the envelope guard, and the rule that chrome is never
persisted and must be verified on a poisoned localStorage.

---

## What the investigation turned up, that model A would have hit

The corrective palette **only cools on `elevated`** (and mostly on `blocked`). On
`depleted` it deliberately *warms* — correct therapy inside a mandala, and the original
complaint all over again at full-viewport scale. Six of the forty planet-states resolve
to a red-band hue on the naive "chrome takes the corrective colour" read:

Mars depleted (`#E0673A`) · Mars blocked (`#CF5B5B`) · Mars balanced (`#D24238`) ·
Pluto depleted (`#5E1B30`) · Venus depleted (`#E6B7A0`) · Venus blocked (`#E58FA6`)

Model C sidesteps this entirely, but the finding is why the red-band guard exists as a
throwing assertion rather than a comment.

---

## Tests

`tests/chromePersistence.test.ts` (8) — asserts the persist config itself, because a
unit test against a fresh store instance proves nothing about a returning browser.

`tests/chromeAccent.test.ts` (19) — the red-band detector against the six hues that
caused this; all 40 planet-states resolving safe; no planet base palette reachable from
chrome; `getAccentColor` never reading `PLANET_COLORS`; the nebula never reindexed by
`dominantPlanet`; `#E8453C` absent from `src`.

**230 passing.**

---

## Open, and honest about it

- **The four rooms are proven by the 40-state test sweep and the rendered proposal
  (`chrome-proposal.html`), not yet by a live signed-in screen.** The app gates a
  reading behind account creation, which Claude does not do. SHA's own sign-in is the
  remaining eyeball.
- **`#C9A961` is still a placeholder.** It carried over as the `balanced` room. SHA has
  not approved it as the brand colour, and the other three were derived to sit with it —
  if it moves, they move.
- **One deep rose sits inside the red hue wedge on a live surface:** `#B23A63`, the
  duration text on the Marma session card (`landing.css`). It is sanctioned by house
  style §1 ("five session cards, five hues"; "duration is the only coloured text on a
  session card") and it is a five-character label on a blush stone card, not a room.
  Flagged rather than changed, because the card hues are SHA's own accepted decision.
- A live whole-page red-band audit of myastryx.com found **no chrome violations**. The
  hero chakra dots render at 16% effective opacity (a faint glow, correctly not a flood)
  and the tone-ladder ticks carry planet hues, which are signal.

## Still open, separate from the colour work

- **The chakra crossing.** Sacral/Root resolve to field-only sites correctly, but the
  marma doorway still reads as the card headline instead of a labelled alternate worked
  from behind.
- **The 18 cards without a title strip** (empty states, accordions, list rows) —
  deliberate per §3b, but SHA may want them restructured.

---

## Standing constraints

Metaphysical voice. 12 forks, Cousto for planets / Solfeggio for chakra. Never-amplify.
The metal is the source of truth (Uranus 207.33, Neptune 211.45). Reproductive region and
coccyx are swept, never touched — no region omitted. Payments Shopify-only. RLS on every
table. No secrets in git. Commit as Sha Blyss. Deploy `npx vercel deploy --prod` and
verify live. **Claude is the developer — never ask SHA to write code.**
