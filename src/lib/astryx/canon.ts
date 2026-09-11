/**
 * ASTRYX — Canon retrieval (Directive L.1)
 * ════════════════════════════════════════════════════════════════════════════
 * SERVER-ONLY. In-memory keyword / term-overlap retrieval over the canon corpus
 * (src/data/astryxCanon.json, built by scripts/build-astryx-canon.mjs). Frugal
 * and sovereign — no vector DB, no external call. Embeddings are a documented
 * Phase-2 upgrade (modelAdapter.embed) that can be blended in here later.
 */

if (typeof window !== 'undefined') {
  throw new Error('astryx/canon.ts is server-only and must not be imported client-side')
}

import canonData from '@/data/astryxCanon.json'

export interface CanonChunk {
  id: string
  topic: string
  planet?: string
  sign?: string
  system?: string
  text: string
  source: string
}

const CHUNKS = (canonData as { chunks: CanonChunk[] }).chunks ?? []

const STOP = new Set([
  'the', 'a', 'an', 'of', 'for', 'to', 'in', 'on', 'is', 'are', 'am', 'my', 'me',
  'what', 'how', 'why', 'do', 'does', 'did', 'and', 'or', 'with', 'about', 'can',
  'you', 'your', 'this', 'that', 'it', 'its', 'be', 'as', 'at', 'by', 'from', 'has',
  'have', 'was', 'were', 'will', 'would', 'should', 'could', 'tell', 'explain', 'mean',
])

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length >= 3 && !STOP.has(t))
}

// Precompute a lightweight index once at module load.
interface Indexed {
  c: CanonChunk
  freq: Map<string, number>
  tagTokens: Set<string>
  topicLc: string
  blob: string
}
const INDEX: Indexed[] = CHUNKS.map((c) => {
  const blob = `${c.topic} ${c.text}`.toLowerCase()
  const freq = new Map<string, number>()
  for (const t of tokenize(blob)) freq.set(t, (freq.get(t) ?? 0) + 1)
  const tagTokens = new Set(tokenize([c.planet, c.sign, c.system].filter(Boolean).join(' ')))
  return { c, freq, tagTokens, topicLc: c.topic.toLowerCase(), blob }
})

/**
 * Retrieve the top-K canon chunks for a query. Blended keyword score:
 *   tag (planet/sign/system) match = strong · topic match = medium ·
 *   text term frequency = base · whole-phrase substring = bonus.
 */
/**
 * Chunk-id prefixes that are the PRACTITIONER clinical layer. An individual-tier
 * caller never retrieves these — the same seam sacredShape.ts applies to the API
 * response, applied here to what the MODEL is allowed to read.
 *
 * Found live 2026-09-10: an individual asking about Uranus was handed a chunk
 * containing "arrhythmia"; a medication question pulled endocrine/reproductive
 * pathology records naming cancer. The model echoed the words, the individual
 * guard rejected the draft twice, and the person got a canned line. Filtering
 * retrieval by tier fixes the quality problem AND closes the model-side seam.
 */
const PRACTITIONER_ONLY_PREFIXES = ['bodySystems/', 'medicalAstrology/']
export type RetrieveTier = 'individual' | 'practitioner'

export function retrieve(query: string, k = 6, opts: { tier?: RetrieveTier } = {}): CanonChunk[] {
  const qt = tokenize(query)
  if (!qt.length) return []
  const ql = query.toLowerCase().trim()
  const pro = opts.tier === 'practitioner'
  const pool = pro ? INDEX : INDEX.filter(({ c }) => !PRACTITIONER_ONLY_PREFIXES.some((p) => c.id.startsWith(p)))

  const scored = pool.map(({ c, freq, tagTokens, topicLc, blob }) => {
    let s = 0
    for (const t of qt) {
      if (tagTokens.has(t)) s += 6
      if (topicLc.includes(t)) s += 3
      const f = freq.get(t)
      if (f) s += Math.min(f, 4)
    }
    if (ql.length > 6 && blob.includes(ql)) s += 4
    return { c, s }
  }).filter((x) => x.s > 0)

  scored.sort((a, b) => (b.s - a.s) || a.c.id.localeCompare(b.c.id)) // deterministic tie-break
  return scored.slice(0, k).map((x) => x.c)
}

export const CANON_CHUNK_COUNT = CHUNKS.length
