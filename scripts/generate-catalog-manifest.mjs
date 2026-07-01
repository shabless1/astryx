#!/usr/bin/env node
/**
 * ASTRYX — Suno catalog manifest generator (Directive I.4)
 * ════════════════════════════════════════════════════════════════════
 * Turns a flat listing of R2 object keys into `catalog.json`, the manifest
 * the app fetches at runtime (`{NEXT_PUBLIC_AUDIO_BASE_URL}/catalog.json`).
 * Upload the output to the bucket root and NEW SONGS APPEAR WITH NO REDEPLOY —
 * the app merges the manifest over the built-in seed catalog at load time.
 *
 * Node only (Python is not installed on this machine).
 *
 *   USAGE
 *     node scripts/generate-catalog-manifest.mjs <listing.txt> [out.json]
 *
 *   <listing.txt> = one object key per line, e.g.
 *       mars/exc/MARS_EXC_07.mp3
 *       moon/nat/MOON_NAT_05b.mp3
 *     Leading folders are tolerated (…/mars/exc/FILE.mp3). Non-.mp3 lines
 *     (incl. catalog.json itself) are ignored.
 *
 *   Produce the listing from the bucket, e.g.:
 *       rclone lsf -R r2:astryx-audio          > listing.txt
 *       # or, with an S3-compatible token:
 *       aws s3 ls s3://astryx-audio --recursive --endpoint-url <r2-endpoint> \
 *         | awk '{print $4}'                    > listing.txt
 *
 *   Then upload the result to the bucket root as `catalog.json`.
 *   (SHA deleted the R2 API token for security — mint a read-only one to list,
 *    or export the file list from the Cloudflare dashboard. See
 *    suno-audio-r2-pipeline.md.)
 *
 *   With NO args it prints this help (it cannot list the bucket itself).
 */

import { readFileSync, writeFileSync } from 'node:fs'

const STATES = new Set(['nat', 'exc', 'def', 'blk'])

function parseKey(line) {
  const clean = line.trim().replace(/^\/+/, '').split('?')[0]
  if (!clean || !/\.mp3$/i.test(clean)) return null
  const segs = clean.split('/').filter(Boolean)
  if (segs.length < 3) return null
  const file = segs[segs.length - 1].replace(/\.mp3$/i, '')
  const state = segs[segs.length - 2].toLowerCase()
  const planet = segs[segs.length - 3].toLowerCase()
  if (!STATES.has(state) || !file) return null
  return { planet, state, file, path: `${planet}/${state}/${file}.mp3` }
}

function main() {
  const [, , listingPath, outPath = 'catalog.json'] = process.argv
  if (!listingPath) {
    console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 38).join('\n').replace(/^ \*?/gm, ''))
    process.exit(1)
  }

  const raw = readFileSync(listingPath, 'utf8').split(/\r?\n/)
  const catalog = {}
  const tracks = []
  let skipped = 0

  for (const line of raw) {
    if (!line.trim()) continue
    const p = parseKey(line)
    if (!p) { skipped++; continue }
    catalog[p.planet] ??= { nat: [], exc: [], def: [], blk: [] }
    if (!catalog[p.planet][p.state].includes(p.file)) {
      catalog[p.planet][p.state].push(p.file)
      tracks.push(p.path)
    }
  }

  // Deterministic ordering so the manifest diffs cleanly between runs.
  for (const planet of Object.keys(catalog)) {
    for (const st of ['nat', 'exc', 'def', 'blk']) catalog[planet][st].sort()
  }
  tracks.sort()

  const manifest = { version: 1, count: tracks.length, tracks, catalog }
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`✓ ${outPath} — ${tracks.length} tracks across ${Object.keys(catalog).length} planets (${skipped} non-track lines skipped).`)
  console.log('  Upload this file to the R2 bucket root as catalog.json.')
}

main()
