/**
 * Compliance gate (Directive v4.0 · Fix 7.3).
 *
 * The banned-phrase + transit-copy lint (scripts/lint-data-copy.mjs, the same
 * walker Fix 5 introduced) must return ZERO findings across src/data/*.json.
 * A data edit that reintroduces banned phrasing fails this test — and the
 * build (npm test runs before next build).
 */

import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('static data copy — compliance lint', () => {
  it('lint-data-copy.mjs reports zero banned-phrase findings', () => {
    // Throws (test fails) on a non-zero exit; stdout carries the findings.
    execFileSync(process.execPath, [path.join(root, 'scripts', 'lint-data-copy.mjs')], {
      cwd: root,
      stdio: 'pipe',
    })
  })
})

// ─── DISEASE NAMING vs THE ZODIAC SIGN ───────────────────────────────
//
// Found while building the Worker's compliance envelope: the clinical-condition
// lint read every "Cancer" as the disease, so eleven ordinary lines across the
// data files — "Sun, Moon, or Rising in Cancer", "Calc Fluor (Cancer)", "Moon
// rules Cancer" — came back as clinical claims. On the individual tier that is
// a hard gate, so a calibration for anyone born under the sign could be refused
// for naming it. Astrological use is always capitalised; the disease, in real
// prose, is lowercase or keeps disease company. These fence both directions:
// the sign must pass, and a genuine claim must still be caught.

import { lintClinicalClaims } from '@/lib/compliance'

describe('clinical-claim lint — the sign is not the disease', () => {
  const asSign = [
    'Sun, Moon, or Rising in Cancer',
    'Moon rules Cancer. This is the mineral your body needs to recalibrate this signature.',
    'Calc Fluor (Cancer) — for tissue restoration after eruption',
    'cardinal sign Cancer → excess bias (+1 confidence-only)',
    'Born in Cancer — your body did not gestate through Leo.',
    'Cancer Tissue Tone Blend — Calc Fluor foods + horsetail + nettle',
  ]
  for (const text of asSign) {
    it(`passes the sign: "${text.slice(0, 44)}…"`, () => {
      expect(lintClinicalClaims(text)).toEqual([])
    })
  }

  const asDisease = [
    'may help prevent cancer',
    'supports patients through cancer treatment',
    'Cancer risk is reduced by this protocol',
    'shown to shrink tumours in Cancer patients',
  ]
  for (const text of asDisease) {
    it(`still catches the claim: "${text.slice(0, 44)}…"`, () => {
      expect(lintClinicalClaims(text).length).toBeGreaterThan(0)
    })
  }

  it('still catches every other condition term', () => {
    expect(lintClinicalClaims('helps with diabetes').length).toBeGreaterThan(0)
    expect(lintClinicalClaims('prevents osteoporosis').length).toBeGreaterThan(0)
    expect(lintClinicalClaims('for any known arrhythmia').length).toBeGreaterThan(0)
    expect(lintClinicalClaims('avoid in kidney disease').length).toBeGreaterThan(0)
  })
})
