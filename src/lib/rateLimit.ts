/**
 * ASTRYX — burst rate limiter (Security Directive v1.1 · FIX 3)
 * ════════════════════════════════════════════════════════════════════════
 * A deterministic engine behind an open endpoint is an input→output oracle: a
 * caller could script it to reconstruct the model from pairs without ever
 * seeing the code. FIX 1 relocated the code/data off the client; this raises the
 * COST of scraping (it does not eliminate it — see SECURITY_AUDIT.md residual
 * risk) by capping calls per caller per window and logging heavy volume.
 *
 * In-memory fixed window (per serverless instance; resets on cold start) — the
 * same backstop pattern the chat/teach daily metering already uses. Fails OPEN
 * on any internal error so a limiter bug can never lock out legitimate users.
 *
 * NOTE: not a determinism-path module (no engine/chamber/audio), so wall-clock
 * (Date.now) is allowed and required here.
 */

import type { NextRequest } from 'next/server'

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
let lastPrune = 0

function prune(now: number): void {
  if (now - lastPrune < 60_000) return
  lastPrune = now
  buckets.forEach((b, k) => { if (b.resetAt <= now) buckets.delete(k) })
}

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  count: number
  retryAfterSec: number
}

/**
 * Fixed-window limiter. `key` must already encode the route + caller identity
 * (e.g. `protocol:user:abc`). Returns ok=false once `limit` is exceeded within
 * `windowSec`. Fails open (ok=true) if anything unexpected happens.
 */
export function rateLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  try {
    const now = Date.now()
    prune(now)
    const existing = buckets.get(key)
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 })
      return { ok: true, limit, remaining: limit - 1, count: 1, retryAfterSec: windowSec }
    }
    existing.count += 1
    const remaining = Math.max(0, limit - existing.count)
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return { ok: existing.count <= limit, limit, remaining, count: existing.count, retryAfterSec }
  } catch {
    return { ok: true, limit, remaining: limit, count: 0, retryAfterSec: 0 }
  }
}

/** Stable per-caller identity: signed-in user id, else client IP (Vercel x-forwarded-for). */
export function clientIdentity(req: NextRequest, userId?: string | null): string {
  if (userId) return `user:${userId}`
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'anon'
  return `ip:${ip}`
}

/**
 * Enforce a limit and, when heavy, log the caller's volume for visibility
 * (surfaces in Vercel logs so bulk extraction is observable). Returns the result;
 * the caller decides how to respond (429 + Retry-After).
 */
export function enforceRateLimit(route: string, id: string, limit: number, windowSec: number): RateLimitResult {
  const res = rateLimit(`${route}:${id}`, limit, windowSec)
  if (!res.ok || res.count > Math.floor(limit * 0.8)) {
    console.warn(`[rate-limit] ${route} ${id} count=${res.count}/${limit} ok=${res.ok}`)
  }
  return res
}
