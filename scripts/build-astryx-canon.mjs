/**
 * ASTRYX — Canon index builder (Directive L.1)
 * ════════════════════════════════════════════════════════════════════════════
 * Walks every file in src/data/*.json + src/data/bodySystems/*.json (the 38 canon
 * files) plus src/data/appKnowledge.json, flattens each into discrete knowledge
 * chunks, and writes src/data/astryxCanon.json — the corpus Astryx retrieves over.
 *
 * Phase 1 ships KEYWORD retrieval (no embeddings) — frugal, sovereign, no
 * build-time API calls, no vector DB. Embeddings are a documented Phase-2 add
 * (see lib/astryx/modelAdapter.embed + canon.ts). Run: `npm run build:canon`.
 *
 * Each chunk: { id, topic, planet?, sign?, system?, text, source }
 *   source ← the file's _meta.lineage / _meta.sources (the citation Astryx attributes).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'data')
const BODY_DIR = join(DATA_DIR, 'bodySystems')
const OUT = join(DATA_DIR, 'astryxCanon.json')

const PLANETS = new Set(['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Earth','Earth Day','Earth Year'])
const SIGNS = new Set(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'])

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const clamp = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const pretty = (base) => base.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// Citation source from a file's _meta.
function sourceOf(data, base) {
  const m = data?._meta ?? data?.meta ?? {}
  if (typeof m.lineage === 'string' && m.lineage.trim()) return m.lineage.trim()
  if (Array.isArray(m.sources) && m.sources.length) return m.sources.join(', ')
  if (typeof m.sourcesUsed === 'string') return m.sourcesUsed
  if (typeof m.title === 'string') return `Astryx canon · ${m.title}`
  return `Astryx canon · ${pretty(base)}`
}

// Readable flatten of any value → a text blob (good for keyword retrieval AND the LLM).
function flattenToText(value, depth = 0) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (!value.length) return ''
    if (value.every((v) => typeof v !== 'object')) return value.join(', ')
    return value.map((v) => flattenToText(v, depth + 1)).filter(Boolean).join('; ')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([k]) => k !== '_meta')
      .map(([k, v]) => {
        const t = flattenToText(v, depth + 1)
        return t ? `${pretty(k)}: ${t}` : ''
      })
      .filter(Boolean)
      .join(depth === 0 ? '\n' : ' · ')
  }
  return ''
}

const isRecordMap = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const vals = Object.values(v)
  if (vals.length < 2) return false
  const objCount = vals.filter((x) => x && typeof x === 'object' && !Array.isArray(x)).length
  return objCount >= Math.ceil(vals.length * 0.6)
}

function tagFor(label, data, base) {
  const out = {}
  if (PLANETS.has(label)) out.planet = label
  if (SIGNS.has(label)) out.sign = label
  if (base.startsWith('bodySystems') || data?.system) out.system = data?.system ?? base.replace('bodySystems/', '')
  return out
}

const chunks = []
function push(base, idPath, label, value, source, data) {
  const text = clamp(flattenToText(value), 1600).trim()
  if (text.length < 12) return // skip empty / trivial
  chunks.push({
    id: `${base}/${idPath}`,
    topic: `${pretty(basename(base))} · ${label}`,
    ...tagFor(label, data, base),
    text,
    source,
  })
}

function ingestFile(absPath, base) {
  const data = readJson(absPath)
  const source = sourceOf(data, base)

  // App self-knowledge — explicit { entries: [{id, topic, text}] }.
  if (Array.isArray(data.entries)) {
    for (const e of data.entries) {
      if (!e?.text) continue
      // 2026-09-10 — honour a per-entry `system` tag. Tag match is the strongest
      // retrieval signal (+6); without it the guide's explanatory entries lost
      // to dense data records (12 fork mappings all shouting 'marma') on the
      // very questions a new user asks. Default stays 'app'.
      chunks.push({ id: `${base}/${e.id}`, topic: e.topic ?? 'app', system: e.system ?? 'app', text: clamp(e.text, 1600), source })
    }
    return
  }

  // NON-USER-FACING keys never enter the canon, at any depth. Mirrors the
  // lint-data-copy rule: complianceNotes (internal scope-of-practice guidance),
  // engineUsage (wiring docs), '_' keys (dev metadata), phase2/placeholder
  // (unshipped content). The live battery caught a complianceNotes block being
  // handed to the model as teaching material.
  const internalKey = (k) => k.startsWith('_') || k === 'complianceNotes' || k === 'engineUsage' || /phase2|placeholder/i.test(k)
  for (const [key, value] of Object.entries(data)) {
    if (key === '_meta' || key === 'meta') continue
    // 2026-09-10 — NON-USER-FACING subtrees never enter the canon. Mirrors the
    // lint-data-copy rule: complianceNotes (internal scope-of-practice guidance),
    // engineUsage (wiring docs), '_' keys (dev metadata), phase2/placeholder
    // (unshipped content). The live battery caught a bodySystems complianceNotes
    // block being handed to the model as if it were teaching material.
    if (internalKey(key)) continue
    if (isRecordMap(value)) {
      // Nested record keys too — modalitySpecificGrid.ayurvedic_phase2_placeholder
      // slipped past a top-level-only check (11 unshipped placeholders reached the model).
      for (const [rk, rv] of Object.entries(value)) { if (internalKey(rk)) continue; push(base, `${key}.${rk}`, rk, rv, source, data) }
    } else if (Array.isArray(value)) {
      if (value.length && typeof value[0] === 'object') {
        value.forEach((item, i) => push(base, `${key}[${i}]`, item?.name ?? item?.id ?? item?.sign ?? item?.planet ?? `${key} ${i}`, item, source, data))
      } else {
        push(base, key, key, value, source, data)
      }
    } else {
      push(base, key, key, value, source, data)
    }
  }
}

// Walk the data dir (skip the output + bodySystems handled separately).
for (const f of readdirSync(DATA_DIR)) {
  if (!f.endsWith('.json') || f === 'astryxCanon.json') continue
  ingestFile(join(DATA_DIR, f), basename(f, '.json'))
}
for (const f of readdirSync(BODY_DIR)) {
  if (!f.endsWith('.json')) continue
  ingestFile(join(BODY_DIR, f), `bodySystems/${basename(f, '.json')}`)
}

const out = {
  _meta: {
    generatedBy: 'scripts/build-astryx-canon.mjs',
    note: 'Astryx canon corpus — keyword retrieval (Phase 1). Regenerate via `npm run build:canon`.',
    chunkCount: chunks.length,
  },
  chunks,
}
writeFileSync(OUT, JSON.stringify(out))
console.log(`[canon] wrote ${chunks.length} chunks → src/data/astryxCanon.json`)
