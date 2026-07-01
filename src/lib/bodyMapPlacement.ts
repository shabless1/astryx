/**
 * ASTRYX — Body Map Placement (Chamber integration · Pass 1 structure)
 *
 * Maps each planetary fork to: the body region it activates, the view
 * (anterior/posterior) that shows it best, an anchor point (% of the full-body
 * image) for the highlight glow, and the hold instruction. Drives the
 * instructional body map inside the Resonance Chamber.
 *
 * Anchors are fractions of the image box: x 0 (left) → 1 (right), y 0 (crown)
 * → 1 (feet). Centered figure ⇒ most x ≈ 0.5.
 */

export type BodyMapType = 'male' | 'female' | 'neutral'
export type BodyView = 'anterior' | 'posterior'

export interface PlanetPlacement {
  region: string          // machine key
  label: string           // human zone label
  view: BodyView          // default view that shows the zone
  anchor: { x: number; y: number }
  placement: string       // hold instruction (where + how)
}

// Front-facing zones → anterior; back-facing (spine/kidneys/sacrum/upper back)
// → posterior. Anchors approximate the existing body-map region grid.
export const PLANET_PLACEMENT: Record<string, PlanetPlacement> = {
  Sun: {
    region: 'heart_vitality', label: 'Heart · upper spine · vitality center',
    view: 'anterior', anchor: { x: 0.50, y: 0.30 },
    placement: 'Hold the fork 2–4 inches over the heart center / upper sternum.',
  },
  Moon: {
    region: 'chest_sacral', label: 'Chest · stomach · lower abdomen · sacral field',
    view: 'anterior', anchor: { x: 0.50, y: 0.42 },
    placement: 'Hold the fork 2–4 inches above the lower abdomen / sacral field.',
  },
  Mercury: {
    region: 'throat_nerves', label: 'Throat · neck · shoulders · nervous pathways',
    view: 'anterior', anchor: { x: 0.50, y: 0.17 },
    placement: 'Hold the fork by the throat and the sides of the neck.',
  },
  Venus: {
    region: 'heart_throat', label: 'Throat · heart · kidneys · lower back',
    view: 'anterior', anchor: { x: 0.50, y: 0.29 },
    placement: 'Hold the fork over the heart, then the throat.',
  },
  Mars: {
    region: 'solar_plexus', label: 'Blood · muscle · solar plexus',
    view: 'anterior', anchor: { x: 0.50, y: 0.37 },
    placement: 'Hold the fork over the solar plexus / upper abdomen.',
  },
  Jupiter: {
    region: 'liver_hips', label: 'Liver · hips · thighs',
    view: 'anterior', anchor: { x: 0.44, y: 0.46 },
    placement: 'Hold the fork over the right lower ribs (liver), then the hips.',
  },
  Saturn: {
    region: 'spine_joints', label: 'Bones · spine · knees · joints',
    view: 'posterior', anchor: { x: 0.50, y: 0.34 },
    placement: 'Hold the fork along the spine; then over the knees / joints.',
  },
  Uranus: {
    region: 'upper_spine_ankles', label: 'Nervous system · upper spine · ankles',
    view: 'posterior', anchor: { x: 0.50, y: 0.22 },
    placement: 'Hold the fork at the base of the neck / upper spine; then the ankles.',
  },
  Neptune: {
    region: 'feet_lymph', label: 'Feet · lymph / fluid field',
    view: 'anterior', anchor: { x: 0.44, y: 0.95 },
    placement: 'Hold the fork near the soles of the feet.',
  },
  Pluto: {
    region: 'lower_pelvis', label: 'Lower pelvis · eliminative · regenerative field',
    view: 'anterior', anchor: { x: 0.50, y: 0.54 },
    placement: 'Hold the fork low over the pelvis / sacral base.',
  },
}

// "Full Moon" (fork name) and Earth tones map to a sensible placement.
const FORK_ALIAS: Record<string, string> = { 'Full Moon': 'Moon' }

export function placementFor(planet: string): PlanetPlacement {
  const key = FORK_ALIAS[planet] ?? planet
  return PLANET_PLACEMENT[key] ?? PLANET_PLACEMENT.Sun
}

/**
 * Resolve the body-map image path for a profile + view.
 * Pass 2 assets live at /images/bodymaps/{type}-{view}.png. Until SHA drops
 * those in, the consumer falls back (onError) to the current images.
 */
export function resolveBodyMapAsset(type: BodyMapType, view: BodyView): string {
  const t = type === 'neutral' ? 'female' : type   // neutral → female anterior/posterior for now
  return `/images/bodymaps/${t}-${view}.png`
}

/** Fallback to the existing assets so the chamber map works before Pass 2. */
export function fallbackBodyMapAsset(type: BodyMapType, view: BodyView): string {
  const t = type === 'neutral' ? 'female' : type
  return view === 'posterior' ? '/images/body-posterior.png' : `/images/body-${t}-clean.png`
}
