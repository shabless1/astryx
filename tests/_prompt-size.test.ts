/**
 * ONE-OFF (manual) — measure the prompt the route actually sends, per question,
 * to find why some questions 400 at the model in ~1.4s while others answer.
 *   $env:ASTRYX_PROMPT_SIZE='1'; npx vitest run tests/_prompt-size.test.ts
 */
import { describe, it } from 'vitest'
import { retrieve } from '@/lib/astryx/canon'
import { buildAstryxSystem } from '@/lib/astryx/persona'
import { lintForBannedPhrases, lintClinicalClaims } from '@/lib/compliance'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const ON = process.env.ASTRYX_PROMPT_SIZE === '1'
const K = 7

const QS: [string, string][] = [
  ['FAIL', "Why does the chamber say 'simulated tone'?"],
  ['FAIL', 'What is a marma point and why does it matter?'],
  ['FAIL', 'Tell me about the Marma Recalibration session.'],
  ['FAIL', "Why is Uranus my signal today, and why isn't the calibration amplifying it?"],
  ['FAIL', 'Where do I hold the Uranus fork, and which marma point is it?'],
  ['FAIL', 'Should I stop taking my medication and use the forks instead?'],
  ['ok  ', 'How much does Astryx cost and how do I subscribe?'],
  ['ok  ', 'Why Skullcap?'],
  ['ok  ', 'What do I get if I become a practitioner?'],
]

describe.skipIf(!ON)('prompt size per question', () => {
  it('prints system + canon sizes and guard hits on the canon itself', () => {
    const out: string[] = []
    const log = (...a: unknown[]) => out.push(a.join(' '))
    const system = buildAstryxSystem()
    log(`SYSTEM prompt: ${system.length} chars (~${Math.round(system.length / 4)} tok)`)
    for (const [tag, q] of QS) {
      const chunks = retrieve(q, K)
      const canon = chunks.map((c) => c.text).join('\n\n')
      // Does the CANON we hand the model already contain guard-tripping words?
      const banned = lintForBannedPhrases(canon.replace(/\bprescriptions?\b/gi, ''))
      const clinical = lintClinicalClaims(canon)
      log(
        `${tag} canon=${String(canon.length).padStart(5)} chars (~${Math.round(canon.length / 4)} tok) ` +
        `total≈${Math.round((system.length + canon.length + 2500) / 4)} tok | ` +
        `banned-in-canon=${banned.length} clinical-in-canon=${clinical.length} | ${q.slice(0, 48)}`,
      )
      if (clinical.length) log('      clinical hits:', clinical.slice(0, 6).join(', '))
      if (banned.length) log('      banned hits:', banned.slice(0, 6).join(', '))
      log('      chunks:', chunks.map((c) => `${c.id}(${c.text.length})`).join(' '))
    }
    writeFileSync(join(tmpdir(), 'astryx-prompt-size.txt'), out.join(String.fromCharCode(10)), 'utf8')
  })
})
