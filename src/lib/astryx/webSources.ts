/**
 * ASTRYX — Curated web sources (Directive L.8 · Phase 2 stub — OFF)
 * ════════════════════════════════════════════════════════════════════════════
 * SERVER-ONLY. Tier-3 live-web retrieval, locked to a SHA-approved allowlist and
 * gated by ASTRYX_WEB_ENABLED (default OFF). The plumbing is wired; the behavior
 * is identical to Phase 1 until the flag is flipped. Whatever the web returns is
 * Tier 3 — cited, fenced, never diagnostic, and subject to the same compliance
 * guard as every other Astryx answer.
 *
 * To enable in Phase 2: set ASTRYX_WEB_ENABLED=true and implement fetchWebContext
 * against the allowlist (no code path here changes for the rest of the app).
 */

if (typeof window !== 'undefined') {
  throw new Error('astryx/webSources.ts is server-only and must not be imported client-side')
}

export const ASTRYX_WEB_ENABLED = process.env.ASTRYX_WEB_ENABLED === 'true'

// SHA-confirmed Phase-2 allowlist (2026-06-28). sacredtea.net may be added later.
export const WEB_ALLOWLIST: string[] = [
  // Medical / physiology
  'pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 'nih.gov', 'medlineplus.gov',
  '.gov', '.edu',
  // Live ephemeris / sky data
  'api.astro.com', 'ephemeris', // placeholder host(s) for a chosen ephemeris API
  // Established astrology / herbal references (curated)
  'astro.com', 'skyfield', 'examine.com',
]

export interface WebSnippet { text: string; source: string; url: string }

/**
 * Phase 1: returns [] (OFF). Phase 2: query the allowlist and return Tier-3
 * snippets. The route already treats any returned snippet as fenced Tier-3.
 */
export async function fetchWebContext(_query: string, _k = 3): Promise<WebSnippet[]> {
  if (!ASTRYX_WEB_ENABLED) return []
  // Phase 2 implementation goes here (allowlist-restricted fetch + extract).
  return []
}

/** True only when a host is on the approved allowlist (defense for Phase 2). */
export function isAllowlistedHost(host: string): boolean {
  const h = host.toLowerCase()
  return WEB_ALLOWLIST.some((a) => h === a || h.endsWith(a))
}
