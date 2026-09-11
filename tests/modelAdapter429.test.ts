/**
 * ASTRYX — the OpenAI adapter surfaces what a 429 actually asks for.
 *
 * The live battery showed every blank answer was a 429 the route retried after
 * a fixed 700ms while OpenAI's body said "Please try again in 3.72s". The route
 * now honours retryAfterMs; this pins that the adapter PRODUCES it, from either
 * the Retry-After header or the body text, and that a per-call model override
 * (the gpt-4o-mini fallback pool) is actually sent.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { getAstryxModel } from '@/lib/astryx/modelAdapter'

const OLD_ENV = { ...process.env }
beforeEach(() => {
  process.env.ASTRYX_MODEL_PROVIDER = 'openai'
  process.env.OPENAI_API_KEY = 'test-key'
  delete process.env.OPENAI_MODEL
})
afterEach(() => { vi.unstubAllGlobals(); process.env = { ...OLD_ENV } })

function mockOnce(status: number, body: string, headers: Record<string, string> = {}) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    text: async () => body,
    json: async () => JSON.parse(body),
  }))
}

describe('OpenAI adapter — 429 surface', () => {
  it('parses "try again in Xs" from the body into retryAfterMs', async () => {
    vi.stubGlobal('fetch', mockOnce(429, '{"error":{"message":"Rate limit reached for gpt-4o on tokens per min (TPM): Limit 30000, Used 24102, Requested 7758. Please try again in 3.72s. Visit https://platform.openai.com"}}'))
    const m = getAstryxModel()
    let err: any
    try { await m.complete({ system: 's', context: 'c', message: 'm' }) } catch (e) { err = e }
    expect(err?.status).toBe(429)
    expect(err?.retryAfterMs).toBe(3720)
  })

  it('parses milliseconds too', async () => {
    vi.stubGlobal('fetch', mockOnce(429, '{"error":{"message":"Please try again in 945ms."}}'))
    let err: any
    try { await getAstryxModel().complete({ system: 's', context: 'c', message: 'm' }) } catch (e) { err = e }
    expect(err?.retryAfterMs).toBe(945)
  })

  it('prefers a Retry-After header when present', async () => {
    vi.stubGlobal('fetch', mockOnce(429, '{"error":{"message":"slow down"}}', { 'retry-after': '2' }))
    let err: any
    try { await getAstryxModel().complete({ system: 's', context: 'c', message: 'm' }) } catch (e) { err = e }
    expect(err?.retryAfterMs).toBe(2000)
  })

  it('leaves retryAfterMs undefined when nothing is stated (route falls back to its own backoff)', async () => {
    vi.stubGlobal('fetch', mockOnce(503, 'upstream unavailable'))
    let err: any
    try { await getAstryxModel().complete({ system: 's', context: 'c', message: 'm' }) } catch (e) { err = e }
    expect(err?.status).toBe(503)
    expect(err?.retryAfterMs).toBeUndefined()
  })

  it('sends the per-call model override — the gpt-4o-mini fallback pool is real', async () => {
    const f = mockOnce(200, JSON.stringify({ choices: [{ message: { content: 'ok' } }] }))
    vi.stubGlobal('fetch', f)
    const out = await getAstryxModel().complete({ system: 's', context: 'c', message: 'm', modelOverride: 'gpt-4o-mini' })
    expect(out).toBe('ok')
    const sent = JSON.parse((f.mock.calls[0] as any)[1].body)
    expect(sent.model).toBe('gpt-4o-mini')
  })

  it('uses the default model when no override is given', async () => {
    const f = mockOnce(200, JSON.stringify({ choices: [{ message: { content: 'ok' } }] }))
    vi.stubGlobal('fetch', f)
    await getAstryxModel().complete({ system: 's', context: 'c', message: 'm' })
    expect(JSON.parse((f.mock.calls[0] as any)[1].body).model).toBe('gpt-4o')
  })
})
