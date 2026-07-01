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

export interface CompleteArgs {
  system: string
  context: string
  message: string
  temperature?: number
  maxTokens?: number
}

export interface AstryxModel {
  readonly provider: string
  complete(args: CompleteArgs): Promise<string>
  embed(texts: string[]): Promise<number[][]>
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
  async complete({ system, context, message, temperature = ASTRYX_TEMPERATURE, maxTokens = 800 }) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')
    const model = process.env.OPENAI_MODEL || OPENAI_MODEL_DEFAULT
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: `${system}\n\n${context}` },
          { role: 'user', content: message },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text().catch(() => '')).slice(0, 240)}`)
    const data = await res.json()
    return (data?.choices?.[0]?.message?.content ?? '').trim()
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
  selfhost: selfhostModel,
}

/** The active model per ASTRYX_MODEL_PROVIDER (default gemini). */
export function getAstryxModel(): AstryxModel {
  const key = (process.env.ASTRYX_MODEL_PROVIDER || 'gemini').toLowerCase()
  return MODELS[key] ?? geminiModel
}

/** True when the active provider has the credentials it needs to answer. */
export function modelConfigured(): boolean {
  const key = (process.env.ASTRYX_MODEL_PROVIDER || 'gemini').toLowerCase()
  if (key === 'openai') return !!process.env.OPENAI_API_KEY
  if (key === 'selfhost') return !!process.env.SELFHOST_LLM_URL
  return !!process.env.GEMINI_API_KEY
}
