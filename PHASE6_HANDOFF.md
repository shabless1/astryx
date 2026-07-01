# ASTRYX — Phase 6 Handoff

**Read this first.** It captures everything built in the previous chat session (Phases 1 → 3C + a language cleanup + tester guides) so the next session can continue cold. The product is live, builds clean, and is deployed.

---

## 0. Fast Facts

| | |
|---|---|
| **Canonical codebase** | `…/MARKETING/astryx_v14/` (Next.js 14 · TypeScript · Tailwind · Zustand) |
| **Live URL** | https://n-pi-jet.vercel.app (Vercel project name: `n`, aliased) |
| **Deploy** | From `astryx_v14/`: `vercel --prod --yes` (CLI is installed + linked). Auto-aliases to n-pi-jet.vercel.app. **No git in this folder** — deploy straight from the directory. |
| **Verify before deploy** | `npx tsc --noEmit` (expect 0) then `npm run build` (expect 10/10 static pages). |
| **Current state** | tsc 0 errors · build 10/10 · deployed & live. |
| **Architect** | SHA — approves direction, supplies assets, **never writes code**. Make decisions, document them, move on. |

### Environment gotchas (real, hit during last session)
- **OneDrive path with spaces** breaks the Claude preview launcher (`launch.json`) — `preview_start` fails. Use `npm run dev` via Bash if you need a local server; it boots fine and serves 200.
- **No Python** on the machine (`python` not found). Don't rely on Python-based skill scripts.
- **No image-generation tool** is wired into this environment. The "imagegen"/"brandkit" skills are *prompt guides only* — they do **not** produce raster images. You cannot generate Midjourney-style art here. (See §5 Mandala art.)
- **Browser screenshots can't be embedded** — the Claude-in-Chrome MCP can drive the live app and screenshot it (a local Chrome is connected), but `save_to_disk` does not surface a usable file path, so screenshots can't be pulled into docs.
- **`.docbuild/` temp folder** sometimes can't be `rm`'d (OneDrive lock) — harmless, delete later.
- **I (the agent) cannot see rendered visuals or GPU output headlessly.** All visual work was verified via SSR markup counts + deterministic logic, **never with human eyes on a device.** Real device QA of the Chamber visuals/audio is the single biggest outstanding gap.

---

## 1. What This Session Delivered (chronological)

1. **Phase 1 — Post-Session Summary + Outtake flow** (close the Chamber loop)
2. **Phase 2 — Sacred Tea Matching Engine + DIY herbal direction**
3. **Phase 3 — Color Therapy + Mandala Chamber views** (Body/Color/Mandala/Combined toggle)
4. **Phase 3B — Kaleidoscope upgrade**: WebGL/GLSL shader + layered-SVG fallback + **AI-art image pipeline**
5. **Phase 3C — Sacred Geometry visual engine** (Flower of Life, Metatron's Cube, platonic solids, orbital rosettes) + a **living-motion** pass (color pulse, kaleidoscope mirror, infinite-zoom morph)
6. **Language cleanup** — removed all user-facing "rite" terminology → "session / fork sequence"
7. **Tester guides** — branded Word docs (User + Practitioner) in `…/MARKETING/`

Phases 4 (Frequency Lab) and 5 (PDF export/billing) from the original roadmap were **not** part of this chat — these were the SHA-directed feature phases above. Confirm with SHA what "Phase 6" scope is.

---

## 2. Phase 1 — Post-Session Loop  ✅ shipped

**Goal:** completing a Chamber session must route *forward* to a check-in + continuation, never backward to Results.

- **New screen:** [`src/components/screens/PostSessionSummary.tsx`](src/components/screens/PostSessionSummary.tsx) — heading **"Recalibration Summary"** (SHA-renamed from "How did that land?"). Four sections: Session Summary → Check-In (mood/energy 1–10/body/mental/placement-accuracy/chamber-support/notes) → Continuation Protocol → Save. After save: Before→After comparison card.
- **Types** (`src/types/index.ts`): `SessionSummarySnapshot`, `PostSessionAnswers`, `ContinuationProtocol`, `ProgressEntry`; `AppScreen` gained `'post-session'`.
- **Store** (`src/lib/store.ts`): `pendingSession` (ephemeral hand-off snapshot), `sessionLog: ProgressEntry[]` (persisted), `setPendingSession`, `addSessionLog`, `deleteSessionLog`.
- **SessionScreen:** added `onComplete(snapshot)` prop; **Complete Session ✓** builds the snapshot and routes forward. In-chamber Step 10 was simplified to a grounding close (questionnaire moved to post-session). Practitioner `ClientSession` save also moved to the post-session page.
- **page.tsx:** `handleCompleteSession` → stores snapshot → `setScreen('post-session')`. Wired `onViewProgress`/`onRepeatChamber`/`onReturnHome`/`onDone`.
- **HistoryScreen:** now shows a **Chamber Sessions** progress panel (before/after chips) above the readings list.

---

## 3. Phase 2 — Sacred Tea Support  ✅ shipped

Optional layer added to the post-session protocol (Best Prepared Match first, DIY herbal direction second). **Does not touch existing remedy logic.**

All under `src/lib/tea/`:
- `SacredTeaMatchingEngine.ts` — `matchSacredTea(input)` + `matchSacredTeaForPostSession(snapshot, answers)`.
- `sacredTeaBlendProfiles.ts` — the **10 approved real products only** (Phoenix, Wise Elder, Blue Lotus Magic, Equinox, Euphoria, Egyptian/Blue/White/Red Lotus, All Four Lotus Collection).
- `sacredTeaPlanetRules.ts` — planet × signal-state → primary/secondary blend.
- `sacredTeaBodySystemModifiers.ts` — body-system boosts.
- `sacredTeaPostSessionModifiers.ts` — outtake prefer/avoid (e.g. "Too intense" holds Phoenix back).
- `diyPlanetaryHerbDirections.ts` — general herb categories only, **no competing brands**, non-medical.

Match levels: `Exact / Strong / Partial / No Current Match`. `futureBlendGap` recorded internally, shown only to practitioners. Rendered by `SacredTeaCard` inside `PostSessionSummary.tsx`. Verified against the directive's 3 worked examples (Euphoria/Strong, Wise Elder/Strong, Red Lotus/Strong — Phoenix correctly demoted on "too intense").

---

## 4. Phase 3 / 3B / 3C — The Chamber Visual System  ✅ shipped (SVG tier is the default)

This is the most important area for future work. **Read the renderer architecture before touching visuals.**

### 4.1 Renderer ladder (how a mandala is chosen)
Single mount point: [`src/components/engine/KaleidoscopeMandalaCanvas.tsx`](src/components/engine/KaleidoscopeMandalaCanvas.tsx). It picks a renderer:

1. **Art (image)** — if a PNG exists at `public/images/mandalas/{planet}[-{state}].png`, it's shown as a living lens (rotation + breath glow + edge-mask + state color-grade) via `mandala/ImageMandala.tsx`. **Preferred when on `Auto`.**
2. **WebGL** — GLSL kaleidoscope shader (R3F). **Currently OFF by default** (`ENABLE_WEBGL = false` in `src/lib/visual/mandalaPerformanceFallback.ts`) because it was dropping its GPU context on SHA's machine (`THREE.WebGLRenderer: Context Lost`). Still reachable via the in-Chamber **"3D"** toggle (forces it; falls back to SVG on context loss).
3. **SVG Sacred Geometry** — the **current default**: `mandala/SacredGeometryMandalaView.tsx` (Phase 3C). This is what users see today.

**In-Chamber toggle:** a small pill `Auto · 3D · SVG` appears in the Chamber bottom bar (only in Mandala/Combined views), persisted via store `mandalaRenderer`. A faint corner label shows the active renderer (`ART` / `WEBGL` / `SVG`).

### 4.2 The engines & libraries (`src/lib/visual/`)
- `visualShared.ts` — breath-sync model + chamber-phase modifiers (entry→integration).
- `planetColorTherapyLibrary.ts` + `ColorTherapyEngine.ts` — corrective color fields per planet × state (amplified→cool/settle, depleted→warm/bloom, etc.) + chakra tint. Powers the **Color** view ([`ColorTherapyView.tsx`](src/components/engine/ColorTherapyView.tsx)).
- `KaleidoscopeMandalaEngine.ts` (+ `mandalaPlanetPresets.ts`, `mandalaSignalStateModifiers.ts`, `mandalaGeometry.ts`) — the spec consumed by **all** mandala renderers. Output carries `planet`, `stateKey`, colors, rotation seconds, pulseRate, particle, brightness, etc.
- `SacredGeometryEngine.ts` (+ `sacredGeometryBaseLibrary.ts`, `platonicSolidLibrary.ts`, `planetSacredGeometryMap.ts`) — Phase 3C. Flower of Life, Seed of Life, **Metatron's Cube (13 nodes + 78 lines)**, Sri-Yantra triangle field, torus, spiral vortex, orbital rose curves, + 5 platonic-solid wireframes. Planet→geometry recipe map (e.g. Venus = Flower of Life + rose rosette + octahedron; Saturn = Metatron + cube + containment rings; Mars cooled blue-green).
- `MandalaEngine.ts` / `planetMandalaLibrary.ts` — **superseded by the Kaleidoscope engine**; `planetMandalaLibrary.ts` is still imported for the `ShapeFamily` type. `MandalaEngine.ts` is dead (kept for type only). `LayeredSvgMandala.tsx` is also now unused (replaced by SacredGeometryMandalaView) — safe to delete if you want.

### 4.3 View components (`src/components/engine/`)
- `ChamberVisualModeToggle.tsx` — Body/Color/Mandala/Combined.
- `ColorTherapyView.tsx`, `MandalaChamberView.tsx`, `CombinedChamberView.tsx`.
- `mandala/` subfolder: `SacredGeometryMandalaView.tsx` (the live one), `PlatonicSolidOverlay.tsx`, `OrbitalResonancePattern.tsx`, `LayeredSvgMandala.tsx` (legacy), `SvgMandalaRing/PetalLayer/OrbitParticles.tsx`, `ImageMandala.tsx`, `KaleidoscopeShaderMaterial.ts`, `MandalaShaderPlane.tsx`, `WebGLMandala.tsx`.

### 4.4 Living motion (last visual pass)
`SacredGeometryMandalaView.tsx` now has: **colorPulse** (slow hue/brightness shimmer), **kaleidoscope mirror** (counter-rotating mirrored copies → moiré), **infinite-zoom morph** (`zoomBloom` — geometry born at core, expands, dissolves), **cross-fade between base patterns** (`morphFade`), filled-petal depth, pulsing central burst. CSS keyframes in `src/styles/globals.css`: `platonicTumble, colorPulse, morphFade, zoomBloom, burstPulse, chamberBreathe, chamberDrift, mandalaTwinkle`, plus a `prefers-reduced-motion` block that freezes rotation/morph/bloom and keeps a gentle breath. `geometryQuality` high/medium/low gates heavy effects (mobile/low-power → medium).

### 4.5 SHA's standing feedback on visuals (important for Phase 6 visual work)
- SHA compares mandalas to **Midjourney** and found coded geometry "underwhelming / glowing stick figures." The agreed real path to that "wow" is **AI-generated art images**, not more code. (See §5.)
- Non-negotiables: switching visual modes must **never** reset audio/timer/session phase (it doesn't — toggle is local state). No flashing/strobe. Amplified states slow down + cool (Mars overactivated must read **cool blue-green, not fiery**).

---

## 5. The Mandala Art Pipeline (READY — awaiting art)

Because no image generator exists in this environment, the pipeline is built so SHA (or any image AI / Midjourney) just drops PNGs in:
- **Folder:** `public/images/mandalas/`
- **Naming:** `{planet}.png` (covers all states) or `{planet}-{state}.png` (state = elevated|depleted|blocked|balanced). Lowercase planet.
- **Guide with per-planet Midjourney prompts:** `astryx_v14/MANDALA_ART_GUIDE.md` (also referenced in `…/MARKETING/`).
- The moment a file exists, `Auto` renderer shows it as a living lens (corner label flips to `ART`); otherwise it falls to the Sacred Geometry SVG. Purely additive, never blanks.
- **If Phase 6 provides an image API key** (OpenAI `gpt-image-1`, Replicate Flux, fal.ai, Stability — Midjourney has no API): a small Node script could batch-generate all 10 and save into that folder. That's the cleanest way to finally satisfy SHA's Midjourney-grade ask.

---

## 6. Language Cleanup — "rite" → "session"  ✅ shipped

- **User-facing fix:** Chamber duration option label `"Rite"` → **`"Session"`** (description → "The complete fork sequence") in `src/lib/chamber/durationPresets.ts`.
- **Internal renames** (verified, tsc clean): `buildForkRite→buildForkSequence`, `riteStepAt→sequenceStepAt`, `RiteStep→SequenceStep`, `riteSteps→sequenceSteps`, `riteStepTitle→stepTitle`, `RiteStepCard→SequenceStepCard`, `PrepareRite→PrepareSession`. All "rite" comments purged.
- **Deliberately kept** (no user impact): the persisted setting **key** `'rite'` (renaming it would wipe users' saved duration preference) and the **filename** `src/lib/chamber/forkRite.ts` (internal module path). Also kept **factual botanical/cultural** "ritual/rites" in data (`lotusSpectrum.json` `ritualUse`, the physical product **"Ritual Brewing Guide"** in `starterKits.json`, a scent use-context, a practitioner-lens descriptor) — these describe real history/products, not the app's experience. If SHA wants those gone too, swap "Ritual Brewing Guide" → "Brewing & Intention Guide" etc.
- Terminology going forward: **session** = whole Chamber experience; **fork sequence** = ordered tuning-fork application; **tone sequence** = audio; **Recalibration Summary** = post-session heading.

---

## 7. Tester Guides (in `…/MARKETING/`, not in the app)

- `ASTRYX_USER_GUIDE.docx` (+ `.md`) — branded Quick Start for testers (SHA supplied the final copy).
- `ASTRYX_PRACTITIONER_GUIDE.docx` (+ `.md`) — branded practitioner manual (SHA supplied the expanded copy).
- Built with `docx-js` in a temp `.docbuild/` dir (gold #F59E0B headings, deep-space cover, callouts, footer). **SHA wants Word docs for all future guides/manuals** ("always generate the word doc"). To PDF: open in Word → Save As → PDF (no LibreOffice/Python on the machine).

---

## 8. Known Open Items / Likely Phase 6 Inputs

1. **Device QA of the Chamber** — never done with human eyes. Audio overlap, the visuals, mobile layout, reduced-motion all need a real pass. (Tester feedback presumably covers some of this — apply it.)
2. **Mandala art** — drop AI/Midjourney PNGs into `public/images/mandalas/` (or wire an image API) to reach the look SHA wants. Engine + guide are ready.
3. **WebGL shader** — built but disabled (context-loss on SHA's GPU). Re-enable by flipping `ENABLE_WEBGL = true` only after validating on target devices; it self-falls-back to SVG on context loss.
4. **Dead code** safe to remove if desired: `src/lib/visual/MandalaEngine.ts` (type-only), `mandala/LayeredSvgMandala.tsx` (replaced by SacredGeometryMandalaView).
5. **Roadmap not yet built:** Frequency Lab (original Phase 4), PDF export / Stripe billing (original Phase 6), DB persistence (sessions are localStorage-only today). Confirm what SHA's "Phase 6" actually means before building.
6. **Compliance posture** is non-negotiable (see `CLAUDE.md` + `COMPLIANCE.md`): probabilistic framing, "reference tool not medical advice," informed consent for clients, no banned phrases.

---

## 9. How to Work in This Repo

```bash
cd "…/MARKETING/astryx_v14"
npx tsc --noEmit            # must be 0
npm run build              # must be 10/10
vercel --prod --yes        # deploy → auto-aliases to n-pi-jet.vercel.app
```
- App routing is **screen-state via Zustand** (`screen` field), NOT URL routes. "Add a screen" = add to `AppScreen` union + render block in `src/app/page.tsx`.
- State persists to localStorage (`astryx-storage`); be careful changing persisted keys.
- SSR-smoke-test visual components by rendering them in a temp `src/app/<name>/page.tsx`, `curl localhost:3000/<name>`, grep the markup, then delete the temp route. (Used throughout to verify geometry without a GPU.)

---

## 10. Decisions Log (so Phase 6 doesn't re-litigate)
- Screen routing is state-based, not URL-based → `'post-session'` is a `screen` value.
- Post-session check-in lives on the post-session page, not in-chamber (single source of "after" data).
- Sacred Tea is an **optional** layer; never replaces remedy logic; only the 10 approved products ever shown.
- Default mandala renderer = **SVG Sacred Geometry** (reliable everywhere); WebGL gated; Art preferred when present.
- Kept persisted `'rite'` key + `forkRite.ts` filename + factual `ritualUse`/product data on purpose.
- All visual verification was logic/SSR-based; **no on-device visual confirmation by the agent** — treat device QA as required.

---

*End of Phase 6 handoff. The app is live, green, and deployed. Start by confirming with SHA exactly what "Phase 6" covers, apply the tester feedback, and — if visual polish is in scope — lead with the AI-art pipeline (§5), not more procedural geometry.*
