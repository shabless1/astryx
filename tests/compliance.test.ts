/**
 * Compliance gate (Directive v4.0 · Fix 7.3).
 *
 * The banned-phrase + transit-copy lint (scripts/lint-data-copy.mjs, the same
 * walker Fix 5 introduced) must return ZERO findings across src/data/*.json.
 * A data edit that reintroduces banned phrasing fails this test — and the
 * build (npm test runs before next build).
 */

import { describe, it } from 'vitest'
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
