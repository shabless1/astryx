/**
 * ASTRYX — Kaleidoscope Shader Material (Phase 3B · WebGL primary)
 *
 * A custom GLSL fragment shader that renders the mandala as a radial, mirrored
 * kaleidoscope with soft in-shader glow (no external postprocessing needed).
 * Breath-synced, slow-rotating, signal-state corrected. No flashing — every
 * time term is a continuous sine/linear, brightness is clamped, amplified states
 * are dimmed + slowed via uniforms.
 */

import * as THREE from 'three'

export const mandalaVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const mandalaFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float u_time;
  uniform float u_breathPhase;
  uniform float u_intensity;
  uniform float u_depth;
  uniform float u_softness;
  uniform float u_brightness;
  uniform float u_rotationPrimary;
  uniform float u_rotationSecondary;
  uniform float u_symmetryCount;
  uniform float u_chakraStrength;
  uniform int   u_shaderMode;
  uniform int   u_signalState;
  uniform int   u_chamberPhase;
  uniform vec3  u_planetPrimaryColor;
  uniform vec3  u_planetSecondaryColor;
  uniform vec3  u_planetAccentColor;
  uniform vec3  u_chakraAccentColor;

  const float TAU = 6.28318530718;

  float ringField(float r, float t) { return 0.5 + 0.5 * sin(r * 11.0 - t * 0.5); }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;                 // -1 .. 1
    float breath = 0.9 + 0.16 * u_breathPhase;  // inhale gently expands the field
    p /= breath;

    float r = length(p);
    float baseAng = atan(p.y, p.x);

    // primary rotation + kaleidoscope mirror fold
    float seg = TAU / max(3.0, u_symmetryCount);
    float ang = baseAng + u_time * u_rotationPrimary;
    ang = abs(mod(ang, seg) - seg * 0.5);

    // counter-rotated layer for parallax depth
    float ang2 = baseAng + u_time * u_rotationSecondary;
    ang2 = abs(mod(ang2, seg) - seg * 0.5);

    float g;
    if (u_shaderMode == 1) {            // petals / lotus
      float lobes = pow(max(0.0, cos(ang / seg * 3.14159)), 2.0);
      g = lobes * smoothstep(1.0, 0.1, r) + 0.4 * ringField(r, u_time);
    } else if (u_shaderMode == 2) {     // angular / star
      float spokes = smoothstep(0.12, 0.0, abs(ang));
      g = spokes + 0.5 * ringField(r, u_time * 0.8) + 0.3 * smoothstep(0.1, 0.0, abs(ang2));
    } else if (u_shaderMode == 3) {     // spiral / vortex
      float sp = 0.5 + 0.5 * sin(ang * 4.0 + r * 9.0 - u_time * 0.5);
      g = sp * smoothstep(1.1, 0.1, r);
    } else if (u_shaderMode == 4) {     // grid / architecture
      g = smoothstep(0.06, 0.0, abs(ang)) + 0.5 * ringField(r, u_time * 0.6);
    } else {                            // rings (default)
      float rays = 0.4 * smoothstep(0.08, 0.0, abs(ang));
      g = ringField(r, u_time) * 0.7 + rays;
    }
    // layered mirrored contribution (depth)
    g += 0.3 * ringField(r * 1.3, -u_time * 0.4) * smoothstep(1.2, 0.2, r);

    // colour blend: primary → secondary → accent
    vec3 col = mix(u_planetPrimaryColor, u_planetSecondaryColor, clamp(r, 0.0, 1.0));
    col = mix(col, u_planetAccentColor, clamp(g * 0.6, 0.0, 1.0));
    col *= g;

    // soft chakra accent (supports, never overrides)
    col += u_chakraAccentColor * u_chakraStrength * smoothstep(1.0, 0.3, r);

    // central glowing core
    float core = exp(-r * r * 4.0);
    col += u_planetPrimaryColor * core * 1.3;

    // base glowing disk — guarantees a clearly-present luminous field (never a
    // faint dot), with the geometry reading on top of it.
    vec3 baseGlow = mix(u_planetSecondaryColor, u_planetPrimaryColor, 0.5);
    col += baseGlow * exp(-r * r * 1.3) * 0.55;

    // depth / edge vignette (wide) + brightness (amplified states dim via u_brightness)
    col *= smoothstep(1.75, 0.1, r);
    col *= u_brightness * (0.85 + 0.4 * u_intensity);

    // keep all declared uniforms live (no-op) so they aren't optimised out
    col += vec3(0.0) * (u_depth + u_softness + float(u_signalState) + float(u_chamberPhase));

    col = clamp(col, 0.0, 1.2);   // safety — no white blowout
    // alpha: central field reads solidly; geometry + glow add on top
    float alpha = clamp(g * 0.6 + core, 0.0, 1.0);
    alpha = max(alpha, exp(-r * r * 1.6) * 0.7);
    alpha *= 0.6 + 0.4 * u_intensity;
    gl_FragColor = vec4(col, alpha);
  }
`

export interface MandalaUniforms {
  [k: string]: THREE.IUniform<any>
}

export function makeMandalaUniforms(): MandalaUniforms {
  return {
    u_time:                { value: 0 },
    u_breathPhase:         { value: 0 },
    u_intensity:           { value: 0.8 },
    u_depth:               { value: 0.6 },
    u_softness:            { value: 0.7 },
    u_brightness:          { value: 0.9 },
    u_rotationPrimary:     { value: 0.03 },
    u_rotationSecondary:   { value: -0.02 },
    u_symmetryCount:       { value: 8 },
    u_chakraStrength:      { value: 0 },
    u_shaderMode:          { value: 0 },
    u_signalState:         { value: 0 },
    u_chamberPhase:        { value: 2 },
    u_planetPrimaryColor:  { value: new THREE.Color('#7DF9FF') },
    u_planetSecondaryColor:{ value: new THREE.Color('#50E3A4') },
    u_planetAccentColor:   { value: new THREE.Color('#C084FC') },
    u_chakraAccentColor:   { value: new THREE.Color('#000000') },
  }
}

/** Map drift/bloom semantics to a small int for the shader (informational). */
export function signalStateToInt(drift: string, bloom: string): number {
  if (drift === 'down') return 1            // amplified — settle
  if (bloom === 'outward') return 2         // depleted — bloom
  if (bloom === 'compression-release') return 3  // restricted
  return 0                                  // coherent
}

export function chamberPhaseToInt(id: string): number {
  return ['entry', 'activation', 'peak', 'regulation', 'integration'].indexOf(id)
}
