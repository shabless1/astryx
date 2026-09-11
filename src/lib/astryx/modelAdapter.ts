/**
 * ASTRYX — Model adapter (Directive L.2)
 * ════════════════════════════════════════════════════════════════════════════
 * SERVER-ONLY. One provider-agnostic interface; the ONLY place a provider is
 * named. Selected by ASTRYX_MODEL_PROVIDER (default 'gemini'):
 *   gemini    — gemini-2.5-flash-lite (default; reuses GEMINI_API_KEY).
 *   openai    — OpenAI chat + embeddings (gated on OPENAI_API_KEY). Drop-in.
 *   selfhost  — POSTs to SELFHOST_LLM_URL (OpenAI-compatible, e.g. Ollama/vLLM).
 *               Implemented-but-unconfigured: Phase 2 is just setting the env.
 *
 * Keys never leave the server. A/B Gemini vs OpenAI by flipping one env var.
 */

if (typeof window !== 'undefined') {
  throw new Error('astryx/modelAdapter.ts is server-only and must not be imported client-side')
}

import { GoogleGenAI } from '@google/genai'

/** In-character but consistent. Surfaced as a constant (Directive L.2). */
export const ASTRYX_TEMPERATURE = 0.4

/**
 * Ceiling on ONE upstream model call. Must stay comfortably under the route's
 * own maxDuration so a slow provider produces a handled failure (retry, then
 * the offline brain) instead of a gateway 504 with an empty body.
 */
export const UPSTREAM_TIMEOUT_MS = Number(process.env.ASTRYX_UPSTREAM_TIMEOUT_MS || 24_000)

export interface CompleteArgs {
  system: string
  context: string
  message: string
  temperature?: number
  maxTokens?: number
    /** Per-call model (the 429 fallback to gpt-4o-mini). */
    modelOverride?: string
}

export interface AstryxModel {
  readonly provider: string
  /**
   * A cheaper/roomier sibling to retry on when the primary pool 429s. The route
   * used to hardcode 'gpt-4o-mini', which quietly made the retry OpenAI-only.
   * Undefined means "this provider has no second pool — fail to the offline brain".
   */
  readonly fallbackModel?: string
  complete(args: CompleteArgs): Promise<string>
  embed(texts: string[]): Promise<number[][]>
}

/**
 * One OpenAI-DIALECT call. OpenAI, DeepInfra (DeepSeek) and any self-host all
 * speak the same /chat/completions shape, so the request, the error envelope and
 * the 429 retry-after parsing live here once instead of per provider.
 *
 * `stream: false` is deliberate and load-bearing — the same rule SHA's Akasha
 * worker runs under. Nothing in Astryx needs tokens before the whole reply
 * exists, and one JSON response cannot hang.
 */
async function openAIDialectComplete(opts: {
  label: string
  baseUrl: string
  apiKey: string
  model: string
  system: string
  context: string
  message: string
  temperature: number
  maxTokens: number
}): Promise<string> {
  // A single upstream call must never eat the whole serverless budget. DeepSeek
  // writes longer and slower than gpt-4o (richer answers, 6-20s typical), and an
  // unbounded call that ran past the function's own ceiling returned a bare 504
  // to the user — worse than a fallback, because nothing was written at all.
  // Bounded here so a slow call fails while the route still has room to retry.
  const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    body: JSON.stringify({
      model: opts.model,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      stream: false,
      messages: [
        { role: 'system', content: `${opts.system}\n\n${opts.context}` },
        { role: 'user', content: opts.message },
      ],
    }),
  })
  if (!res.ok) {
    const text = (await res.text().catch(() => '')).slice(0, 240)
    const err = new Error(`${opts.label} ${res.status}: ${text}`) as Error & { status?: number; retryAfterMs?: number }
    err.status = res.status
    // 429s carry the wait the provider actually wants — a header, or the body's
    // "Please try again in 945ms" / "3.72s". A fixed 700ms retry ignored both
    // and failed a second time, every time.
    const hdr = Number(res.headers.get('retry-after'))
    const m = text.match(/try again in\s+([\d.]+)\s*(ms|s)\b/i)
    err.retryAfterMs = Number.isFinite(hdr) && hdr > 0 ? hdr * 1000
      : m ? Math.round(parseFloat(m[1]) * (m[2].toLowerCase() === 'ms' ? 1 : 1000))
      : undefined
    throw err
  }
  const data = await res.json()
  return (data?.choices?.[0]?.message?.content ?? '').trim()
}

// ─── Gemini (default) ────────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_EMBED = 'text-embedding-004'

// HOTFIX 2026-06-28 — Google migrated Gemini API keys to the new Auth-key format
// (`AQ.Ab8…`), which 401s on the legacy `x-goog-api-key`/`generativelanguage` REST
// path. We now authenticate through the official @google/genai SDK, which carries
// the new key format correctly. Do NOT hand-set `x-goog-api-key` or `?key=` here.
const geminiModel: AstryxModel = {
  provider: 'gemini',
  async complete({ system, context, message, temperature = ASTRYX_TEMPERATURE, maxTokens = 800 }) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')
    const ai = new GoogleGenAI({ apiKey })
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${context}\n\nUser: ${message}`,
      config: {
        systemInstruction: system,
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.9,
      },
    })
    return (res.text ?? '').trim()
  },
  async embed(texts) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not set')
    const ai = new GoogleGenAI({ apiKey })
    const res = await ai.models.embedContent({ model: GEMINI_EMBED, contents: texts })
    return (res.embeddings ?? []).map((e) => e.values ?? [])
  },
}

// ─── OpenAI (drop-in) ────────────────────────────────────────────────────────
// Directive Q (B.5) — Astryx runs on a GPT-4-class model so she can go DEEP, not
// the cheapest `mini`. One config constant; env OPENAI_MODEL still overrides.
// (Billed via the OpenAI API key — separate from a ChatGPT Plus sub. Pennies/chat.)
const OPENAI_MODEL_DEFAULT = 'gpt-4o'
const openaiModel: AstryxModel = {
  provider: 'openai',
  fallbackModel: 'gpt-4o-mini',
  async complete({ system, context, message, temperature = ASTRYX_TEMPERATURE, maxTokens = 800, modelOverride }) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')
    return openAIDialectComplete({
      label: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey,
      model: modelOverride || process.env.OPENAI_MODEL || OPENAI_MODEL_DEFAULT,
      system, context, message, temperature, maxTokens,
    })
  },
  async embed(texts) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small', input: texts }),
    })
    if (!res.ok) throw new Error(`OpenAI embed ${res.status}`)
    const data = await res.json()
    return (data?.data ?? []).map((d: { embedding: number[] }) => d.embedding)
  },
}

// ─── DeepSeek via DeepInfra (SHA ruling 2026-09-10 — the production default) ──
// Same lineage SHA already runs in AKASHA SV and the North Node composer:
// DeepSeek-V4-Flash served from DeepInfra's US infrastructure, OpenAI dialect,
// non-streaming. Two things this buys Astryx over gpt-4o:
//   · COST — roughly an order of magnitude cheaper per token.
//   · HEADROOM — a 1M-token context and a far larger throughput pool, which is
//     what was actually throttling the guide (the OpenAI org ceiling of 30k
//     tokens/minute capped everyone at ~4 questions a minute, org-wide).
// Weights are DeepSeek's; the HOSTING is DeepInfra in the US, which is the
// distinction SHA means by "the US version" — no request reaches a China-based
// endpoint. Override the host with DEEPINFRA_BASE_URL if that ever changes.
const DEEPSEEK_MODEL_DEFAULT = 'deepseek-ai/DeepSeek-V4-Flash'
const deepseekModel: AstryxModel = {
  provider: 'deepseek',
  // No second pool worth reaching for: V4-Flash IS the fast, cheap tier, and a
  // smaller sibling would answer worse for a guide that has to be right.
  fallbackModel: undefined,
  async complete({ system, context, message, temperature = ASTRYX_TEMPERATURE, maxTokens = 800, modelOverride }) {
    const apiKey = process.env.DEEPINFRA_API_KEY
    if (!apiKey) throw new Error('DEEPINFRA_API_KEY not set')
    return openAIDialectComplete({
      label: 'DeepInfra',
      baseUrl: process.env.DEEPINFRA_BASE_URL || 'https://api.deepinfra.com/v1/openai',
      apiKey,
      model: modelOverride || process.env.ASTRYX_DEEPSEEK_MODEL || DEEPSEEK_MODEL_DEFAULT,
      system, context, message, temperature, maxTokens,
    })
  },
  async embed() {
    // Nothing calls this — canon retrieval is deterministic keyword scoring, not
    // vectors. Fail loudly rather than silently returning empty embeddings.
    throw new Error('DeepSeek/DeepInfra embeddings are not wired — Astryx retrieval is keyword-based.')
  },
}

// ─── Self-host (Phase 2 stub — reachable, unconfigured) ──────────────────────
// Point SELFHOST_LLM_URL at an OpenAI-compatible endpoint (Ollama/vLLM) and set
// ASTRYX_MODEL_PROVIDER=selfhost — then nothing leaves the stack. No code change.
const selfhostModel: AstryxModel = {
  provider: 'selfhost',
  async complete({ system, context, message, temperature = ASTRYX_TEMPERATURE, maxTokens = 800 }) {
    const url = process.env.SELFHOST_LLM_URL
    if (!url) throw new Error('SELFHOST_LLM_URL not set (Phase 2)')
    const res = await fetch(`${url.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.SELFHOST_LLM_MODEL || 'local',
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: `${system}\n\n${context}` },
          { role: 'user', content: message },
        ],
      }),
    })
    if (!res.ok) throw new Error(`Self-host ${res.status}`)
    const data = await res.json()
    return (data?.choices?.[0]?.message?.content ?? '').trim()
  },
  async embed() {
    throw new Error('Self-host embeddings not configured (Phase 2).')
  },
}

const MODELS: Record<string, AstryxModel> = {
  gemini: geminiModel,
  openai: openaiModel,
  deepseek: deepseekModel,
  selfhost: selfhostModel,
}

/** The active model per ASTRYX_MODEL_PROVIDER (default deepseek — SHA, 2026-09-10). */
export function getAstryxModel(): AstryxModel {
  const key = (process.env.ASTRYX_MODEL_PROVIDER || 'deepseek').toLowerCase()
  return MODELS[key] ?? deepseekModel
}

/** True when the active provider has the credentials it needs to answer. */
export function modelConfigured(): boolean {
  const key = (process.env.ASTRYX_MODEL_PROVIDER || 'deepseek').toLowerCase()
  if (key === 'openai') return !!process.env.OPENAI_API_KEY
  if (key === 'gemini') return !!process.env.GEMINI_API_KEY
  if (key === 'selfhost') return !!process.env.SELFHOST_LLM_URL
  return !!process.env.DEEPINFRA_API_KEY
}
