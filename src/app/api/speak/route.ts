/**
 * POST /api/speak — Astryx Voice (Directive v4.0 · Fix 6).
 *
 * Text-to-speech for the chat surface and the Daily Check-In headline. Reads
 * EXISTING rendered text only — the LLM is never called here, and nothing is
 * recomputed. OpenAI /v1/audio/speech streamed through as audio/mpeg.
 *
 * Voice: Astryx is feminine. The client may send a `voice` (validated against
 * ASTRYX_VOICES); otherwise the env default (ASTRYX_TTS_VOICE) or 'coral' (warm
 * feminine) is used. A short style instruction keeps her warm, not robotic.
 * Auth-guarded; entitled users only (guests / unentitled fall back to the
 * browser's speechSynthesis client-side, where we also pick a female voice).
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const MAX_CHARS = 4096

// Astryx's voice is feminine — the only voices the client may request.
const ASTRYX_VOICES = ['coral', 'shimmer', 'nova', 'sage'] as const
const DEFAULT_VOICE = 'coral'
// Keeps the delivery warm and human (gpt-4o-mini-tts honours `instructions`).
const VOICE_INSTRUCTIONS =
  'Speak as Astryx, a warm, calm, feminine guide. Unhurried and gentle, grounded and reassuring — natural and human, never robotic or flat.'

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
  let requestedVoice = ''
  try {
    const body = await req.json()
    text = typeof body?.text === 'string' ? body.text.trim() : ''
    requestedVoice = typeof body?.voice === 'string' ? body.voice.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS)

  // Feminine voice: the caller's choice if valid, else env default, else 'coral'.
  const voice = (ASTRYX_VOICES as readonly string[]).includes(requestedVoice)
    ? requestedVoice
    : ((ASTRYX_VOICES as readonly string[]).includes(process.env.ASTRYX_TTS_VOICE ?? '')
        ? (process.env.ASTRYX_TTS_VOICE as string)
        : DEFAULT_VOICE)

  const model = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts'
  // `instructions` is only honoured by the steerable gpt-4o TTS models; older
  // tts-1 / tts-1-hd reject unknown fields, so only send it when supported.
  const supportsInstructions = /gpt-4o/i.test(model)

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      ...(supportsInstructions ? { instructions: VOICE_INSTRUCTIONS } : {}),
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
