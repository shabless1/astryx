/**
 * ASTRYX — Aspect → Geometry Map
 * Per Final 20% Directive §4
 *
 * Deterministic mapping from aspect type to geometry, motion, and symmetry.
 * Consumed by the VisualProtocolRenderer / geometryEngine.
 */

export type AspectKey =
  | 'conjunction' | 'opposition' | 'square'
  | 'trine' | 'sextile' | 'quincunx'

export type GeometryKind =
  | 'concentricCircles'
  | 'mirroredAxis'
  | 'gridCube'
  | 'triangleFlow'
  | 'hexagonHoneycomb'
  | 'offsetSpiral'

export type MotionKind =
  | 'pulse'
  | 'oscillation'
  | 'compressionRelease'
  | 'bloom'
  | 'spiral'
  | 'glitchReset'
  | 'waveDrift'

export type Symmetry =
  | 'radial' | 'bilateral' | 'crossFrame'
  | 'triangular' | 'hexagonal' | 'asymmetric'

export interface AspectGeometry {
  geometry: GeometryKind
  motion: MotionKind
  symmetry: Symmetry
}

export const aspectGeometryMap: Record<AspectKey, AspectGeometry> = {
  conjunction: { geometry: 'concentricCircles', motion: 'pulse',              symmetry: 'radial' },
  opposition:  { geometry: 'mirroredAxis',      motion: 'oscillation',        symmetry: 'bilateral' },
  square:      { geometry: 'gridCube',          motion: 'compressionRelease', symmetry: 'crossFrame' },
  trine:       { geometry: 'triangleFlow',      motion: 'bloom',              symmetry: 'triangular' },
  sextile:     { geometry: 'hexagonHoneycomb',  motion: 'spiral',             symmetry: 'hexagonal' },
  quincunx:    { geometry: 'offsetSpiral',      motion: 'glitchReset',        symmetry: 'asymmetric' },
}

export function geometryForAspect(aspect: string): AspectGeometry {
  return aspectGeometryMap[(aspect as AspectKey)] ?? aspectGeometryMap.conjunction
}
