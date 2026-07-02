#!/usr/bin/env node
/**
 * ASTRYX — static data-copy compliance lint (Directive v4.0 · Fix 5)
 * ════════════════════════════════════════════════════════════════════
 * The chat surface is guarded by lib/compliance.ts at runtime, but static
 * JSON copy in src/data/ ships straight to the dashboard UNFILTERED. This
 * lint walks every prose string value in src/data/*.json (and bodySystems/)
 * against the SAME banned-phrase list the runtime guard uses — the list is
 * parsed out of src/lib/compliance.ts so there is a single source of truth.
 *
 *   npm run lint:copy          → exit 0 when clean, 1 with findings
 *
 * Wired into the build pipeline: a future data edit that reintroduces a
 * banned phrase fails the build.
 *
 * SCOPE: string VALUES that look like prose (≥ 2 words). Identifier-like
 * values and object KEYS are never flagged — the engine matches on those and
 * they are not user-facing copy. astryxCanon.json is skipped (generated —
 * fix the source file and `npm run build:canon`).
 *
 * NON-USER-FACING subtrees are skipped (dev/engine documentation that never
 * renders): keys starting with '_' (_meta, _description), complianceNotes
 * (internal scope-of-practice guidance), engineUsage (engine wiring docs),
 * and keys containing 'phase2' or 'placeholder' (unshipped content banks).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = join(root, 'src', 'data')
const COMPLIANCE = join(root, 'src', 'lib', 'compliance.ts')

// ─── Extract BANNED_PHRASES + BANNED_ALLOWLIST from compliance.ts ──────────
function extractRegexArray(src, constName) {
  const start = src.indexOf(constName)
  if (start === -1) throw new Error(`${constName} not found in compliance.ts`)
  const open = src.indexOf('[', start)
  const close = src.indexOf(']', open)
  // Strip line comments so slashes in prose don't parse as regex literals.
  const body = src.slice(open + 1, close).replace(/\/\/[^\n]*/g, '')
  const out = []
  for (const m of body.matchAll(/\/((?:[^/\\\n]|\\.)+)\/([a-z]*)/g)) {
    out.push(new RegExp(m[1], m[2]))
  }
  if (!out.length) throw new Error(`${constName} parsed to zero regexes`)
  return out
}

const complianceSrc = readFileSync(COMPLIANCE, 'utf8')
const BANNED = extractRegexArray(complianceSrc, 'export const BANNED_PHRASES')
const ALLOW = extractRegexArray(complianceSrc, 'const BANNED_ALLOWLIST')

function findBanned(text) {
  let stripped = text
  for (const allow of ALLOW) stripped = stripped.replace(allow, '')
  const hits = []
  for (const banned of BANNED) {
    const m = stripped.match(banned)
    if (m) hits.push(m[0])
  }
  return hits
}

// ─── Individual-facing transit copy guard (Fix 5 §2) ────────────────────────
// The Daily Check-In transit list renders `effect` + "Support: {intervention}"
// verbatim to Individual-tier users. Named medical conditions and supplement
// recommendations are forbidden there — the register is energetic/somatic
// quality + practices within the app's five layers (sound, scent, taste/tea,
// body, sight). Cell salts, teas, forks, and crystals are app layers — allowed.
const TRANSIT_FIELDS = new Set(['effect', 'intervention'])
const CONDITION_TERMS =
  /\b(depression|anxiety disorder|arrhythmia|cancer|diabetes|fibromyalgia|insomnia disorder|disorder|disease|syndrome|dysregulation|compromise[sd]?|surgery|medical (?:consultation|care)|cardiologist|psychiatr(?:y|ist)|rheumatolog(?:y|ist)|gynecolog(?:y|ist)|neurolog(?:y|ist))\b/i
const SUPPLEMENT_TERMS =
  /\b(magnesium|vitamin [a-z0-9]+|b12|b-complex|coq10|zinc|melatonin|supplement(?:s|ation)?|5-htp|same\b|omega-3)\b/i

function lintTransitCopy(value, key) {
  if (!TRANSIT_FIELDS.has(key) || typeof value !== 'string') return []
  const hits = []
  const c = value.match(CONDITION_TERMS)
  if (c) hits.push(`condition-name: ${c[0]}`)
  const s = value.match(SUPPLEMENT_TERMS)
  if (s) hits.push(`supplement: ${s[0]}`)
  return hits
}

// ─── Walk ───────────────────────────────────────────────────────────────────
const SKIP_FILES = new Set(['astryxCanon.json'])
const isProse = (s) => typeof s === 'string' && s.trim().split(/\s+/).length >= 2

function* jsonFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* jsonFiles(p)
    else if (name.endsWith('.json') && !SKIP_FILES.has(name)) yield p
  }
}

function walk(node, path, report, key = '') {
  if (typeof node === 'string') {
    const hits = []
    if (isProse(node)) hits.push(...findBanned(node))
    hits.push(...lintTransitCopy(node, key))
    if (hits.length) report.push({ path, hits, text: node })
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, report, key))
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      // Non-user-facing subtrees — see SCOPE note in the header.
      if (k.startsWith('_')) continue
      if (k === 'complianceNotes' || k === 'engineUsage') continue
      if (/phase2|placeholder/i.test(k)) continue
      walk(v, path ? `${path}.${k}` : k, report, k)
    }
  }
}

let total = 0
for (const file of jsonFiles(DATA_DIR)) {
  const rel = relative(root, file)
  let data
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    console.error(`✗ ${rel}: unparseable JSON — ${e.message}`)
    total++
    continue
  }
  const report = []
  walk(data, '', report)
  if (report.length) {
    console.log(`\n${rel}`)
    for (const { path, hits, text } of report) {
      console.log(`  · ${path}  →  [${hits.join(', ')}]`)
      console.log(`      "${text.length > 140 ? text.slice(0, 140) + '…' : text}"`)
    }
    total += report.length
  }
}

if (total) {
  console.log(`\n✗ ${total} banned-phrase finding(s). Rewrite per COMPLIANCE.md §3 — name the energetic/somatic quality, not the condition; suggest a practice within the app's five layers, not a substance.`)
  process.exit(1)
} else {
  console.log('✓ lint:copy — zero banned-phrase findings across src/data/*.json')
}
