#!/usr/bin/env node
/**
 * ASTRYX — R2 catalog probe (Directive v4.0 · Fix 4)
 * ════════════════════════════════════════════════════════════════════
 * The R2 API token was deleted for security, so the bucket can't be LISTED —
 * but it IS public. This tool builds an accurate inventory by HEAD-probing
 * the public bucket over the candidate universe:
 *
 *   • every stem in the seed CATALOG (src/lib/astryxAudioLibrary.ts)
 *   • every r2_key in SUNO_LIBRARY/transfer_to_r2.py (historical upload manifest)
 *
 * Confirmed keys are written to a listing file for
 * scripts/generate-catalog-manifest.mjs.
 *
 *   USAGE
 *     node scripts/probe-r2-catalog.mjs [baseUrl] [outListing]
 *     # defaults: baseUrl = https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev
 *     #           outListing = scripts/r2-listing.txt
 *
 * NOTE: probing can only confirm candidates it knows about — a brand-new track
 * uploaded under a name no manifest mentions won't be discovered. When SHA
 * re-mints an R2 read token, prefer a true bucket listing (rclone/aws s3 ls).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = (process.argv[2] || 'https://pub-001f9f7c6afb42968add391c9e525ad8.r2.dev').replace(/\/$/, '')
const OUT = process.argv[3] || join(root, 'scripts', 'r2-listing.txt')

const candidates = new Set()

// 1 — seed CATALOG stems from astryxAudioLibrary.ts
{
  const src = readFileSync(join(root, 'src/lib/astryxAudioLibrary.ts'), 'utf8')
  const catalogBlock = src.slice(src.indexOf('const CATALOG'), src.indexOf('// ─── RUNTIME CATALOG'))
  const planetBlocks = [...catalogBlock.matchAll(/^\s{2}(\w+):\s*\{([\s\S]*?)^\s{2}\},/gm)]
  for (const [, planet, body] of planetBlocks) {
    for (const [, state, arr] of body.matchAll(/(nat|exc|def|blk):\s*\[([^\]]*)\]/g)) {
      for (const [, stem] of arr.matchAll(/'([^']+)'/g)) {
        if (planet === 'earthyear') {
          // Lives directly under earthyear/ with literal spaces (no state folder)
          candidates.add(`earthyear/${stem}.mp3`)
        } else {
          candidates.add(`${planet}/${state}/${stem}.mp3`)
        }
      }
    }
  }
}

// 2 — historical upload manifest keys from transfer_to_r2.py
try {
  const py = readFileSync(join(root, 'SUNO_LIBRARY/transfer_to_r2.py'), 'utf8')
  for (const [, key] of py.matchAll(/,\s*"([a-z]+\/(?:nat|exc|def|blk)\/[^"]+\.mp3)"\)/g)) {
    candidates.add(key)
  }
} catch { /* optional source */ }

console.log(`Probing ${candidates.size} candidate keys against ${BASE} …`)

const confirmed = []
const missing = []
const list = [...candidates].sort()
const CONCURRENCY = 12

async function probe(key) {
  const url = `${BASE}/${key.split('/').map(encodeURIComponent).join('/')}`
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (res.ok) confirmed.push(key)
    else missing.push(`${key} → ${res.status}`)
  } catch (e) {
    missing.push(`${key} → ${e?.message ?? e}`)
  }
}

for (let i = 0; i < list.length; i += CONCURRENCY) {
  await Promise.all(list.slice(i, i + CONCURRENCY).map(probe))
  process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, list.length)}/${list.length}`)
}
console.log()

confirmed.sort()
writeFileSync(OUT, confirmed.join('\n') + '\n', 'utf8')
console.log(`✓ ${confirmed.length} confirmed → ${OUT}`)
if (missing.length) {
  console.log(`✗ ${missing.length} candidates NOT in bucket:`)
  for (const m of missing) console.log(`   ${m}`)
}
