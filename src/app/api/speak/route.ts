/**
 * POST /api/speak — Astryx Voice (Directive v4.0 · Fix 6).
 *
 * Text-to-speech for the chat surface and the Daily Check-In headline. Reads
 * EXISTING rendered text only — the LLM is never called here, and nothing is
 * recomputed. OpenAI /v1/audio/speech streamed through as audio/mpeg.
 *
 * Voice is fixed by env (ASTRYX_TTS_VOICE, default 'sage') — it is the brand
 * voice; no picker is exposed. Auth-guarded; entitled users only (guests and
 * unentitled accounts fall back to the browser's speechSynthesis client-side).
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const MAX_CHARS = 4096

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!session.user.entitled) {
    return NextResponse.json({ error: 'Beta entitlement required' }, { status: 403 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
  }

  let text = ''
  try {
    const body = await req.json()
    text = typeof body?.text === 'string' ? body.text.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS)

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: process.env.ASTRYX_TTS_VOICE || 'sage',
      input: text,
      response_format: 'mp3',
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    console.error('[speak] upstream error', upstream.status, detail.slice(0, 300))
    return NextResponse.json({ error: `TTS upstream ${upstream.status}` }, { status: 502 })
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  })
}
