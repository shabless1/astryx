/**
 * ASTRYX — Element + Modality Visual Modifiers
 * Per Final 20% Directive §7 (element) + §8 (modality)
 */

export type Element = 'fire' | 'earth' | 'air' | 'water'
export type Modality = 'cardinal' | 'fixed' | 'mutable'

export interface ElementVisual {
  texture: 'sharpRays' | 'solidGrid' | 'thinLattice' | 'fluidRings'
  movementSpeed: number
  glowIntensity: number
  lineStyle: 'angular' | 'structured' | 'fineLines' | 'curved'
}

export const elementVisualMap: Record<Element, ElementVisual> = {
  fire:  { texture: 'sharpRays',   movementSpeed: 1.25, glowIntensity: 1.30, lineStyle: 'angular' },
  earth: { texture: 'solidGrid',   movementSpeed: 0.65, glowIntensity: 0.85, lineStyle: 'structured' },
  air:   { texture: 'thinLattice', movementSpeed: 1.10, glowIntensity: 1.00, lineStyle: 'fineLines' },
  water: { texture: 'fluidRings',  movementSpeed: 0.80, glowIntensity: 1.10, lineStyle: 'curved' },
}

export interface ModalityMotion {
  startBehavior: 'fastInitiation' | 'slowBuild' | 'softEntry'
  loopStyle: 'surge' | 'sustained' | 'morphing'
}

export const modalityMotionMap: Record<Modality, ModalityMotion> = {
  cardinal: { startBehavior: 'fastInitiation', loopStyle: 'surge' },
  fixed:    { startBehavior: 'slowBuild',      loopStyle: 'sustained' },
  mutable:  { startBehavior: 'softEntry',      loopStyle: 'morphing' },
}

const ELEMENT_DEFAULT: ElementVisual = elementVisualMap.air
const MODALITY_DEFAULT: ModalityMotion = modalityMotionMap.fixed

export function elementVisualFor(el?: string | null): ElementVisual {
  if (!el) return ELEMENT_DEFAULT
  return elementVisualMap[(el.toLowerCase() as Element)] ?? ELEMENT_DEFAULT
}

export function modalityMotionFor(mod?: string | null): ModalityMotion {
  if (!mod) return MODALITY_DEFAULT
  return modalityMotionMap[(mod.toLowerCase() as Modality)] ?? MODALITY_DEFAULT
}
