/**
 * ASTRYX — the model provider is DeepSeek-V4-Flash on DeepInfra (SHA, 2026-09-10).
 *
 * SHA's ruling: run the same lineage already in production for AKASHA SV and the
 * North Node composer, hosted in the US by DeepInfra. These pin the parts that
 * are easy to get silently wrong — the host actually called, the exact model id,
 * the non-streaming rule, and that the OpenAI-only retry pool is gone from the
 * route. A regression here sends user questions to the wrong vendor.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { getAstryxModel, modelConfigured } from '@/lib/astryx/modelAdapter'

const OLD_ENV = { ...process.env }
beforeEach(() => {
  process.env.ASTRYX_MODEL_PROVIDER = 'deepseek'
  process.env.DEEPINFRA_API_KEY = 'test-key'
  delete process.env.ASTRYX_DEEPSEEK_MODEL
  delete process.env.DEEPINFRA_BASE_URL
})
afterEach(() => { vi.unstubAllGlobals(); process.env = { ...OLD_ENV } })

function okOnce(content: string) {
  const body = JSON.stringify({ choices: [{ message: { content } }] })
  return vi.fn(async () => ({
    ok: true, status: 200,
    headers: { get: () => null },
    text: async () => body,
    json: async () => JSON.parse(body),
  }))
}

describe('DeepSeek via DeepInfra', () => {
  it('is the default provider when nothing is configured', () => {
    delete process.env.ASTRYX_MODEL_PROVIDER
    expect(getAstryxModel().provider).toBe('deepseek')
  })

  it('calls DeepInfra, not OpenAI, with the V4-Flash model and no streaming', async () => {
    const f = okOnce('a reply')
    vi.stubGlobal('fetch', f)
    const out = await getAstryxModel().complete({ system: 's', context: 'c', message: 'm' })
    expect(out).toBe('a reply')
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.deepinfra.com/v1/openai/chat/completions')
    expect(url).not.toMatch(/openai\.com/)
    const body = JSON.parse(String(init.body))
    expect(body.model).toBe('deepseek-ai/DeepSeek-V4-Flash')
    expect(body.stream).toBe(false)
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key')
  })

  it('surfaces a 429 the same way OpenAI did, so the route retry still works', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false, status: 429,
      headers: { get: (k: string) => (k.toLowerCase() === 'retry-after' ? '2' : null) },
      text: async () => 'rate limited',
      json: async () => ({}),
    })))
    let err: any
    try { await getAstryxModel().complete({ system: 's', context: 'c', message: 'm' }) } catch (e) { err = e }
    expect(err?.status).toBe(429)
    expect(err?.retryAfterMs).toBe(2000)
  })

  it('reports configured off the DeepInfra key, not the OpenAI one', () => {
    expect(modelConfigured()).toBe(true)
    delete process.env.DEEPINFRA_API_KEY
    expect(modelConfigured()).toBe(false)
  })

  it('declares no fallback pool — OpenAI keeps its mini sibling', async () => {
    expect(getAstryxModel().fallbackModel).toBeUndefined()
    process.env.ASTRYX_MODEL_PROVIDER = 'openai'
    expect(getAstryxModel().fallbackModel).toBe('gpt-4o-mini')
  })

  it('the route no longer hardcodes an OpenAI-only retry', async () => {
    const fs = await import('node:fs')
    const src = fs.readFileSync('src/app/api/astryx/route.ts', 'utf8')
    expect(src).not.toMatch(/model\.provider === 'openai'/)
    expect(src).toMatch(/model\.fallbackModel/)
  })
})
