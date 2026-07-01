/**
 * ASTRYX — Audio catalog manifest proxy (Directive I-FIX · FIX 3)
 *
 * The R2 bucket serves `catalog.json` WITHOUT an Access-Control-Allow-Origin
 * header, so a browser `fetch('{bucket}/catalog.json')` throws and the app
 * silently falls back to the static seed catalog (library never grows in prod).
 *
 * Server-side fetch is NOT CORS-bound, so we proxy it here on the same origin.
 * The client calls `/api/catalog`; mp3 playback still streams directly from the
 * public bucket (media elements don't need CORS). Keeping the bucket URL
 * server-side here also keeps its structure off the client (trade-secret posture).
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Prefer a non-public server var; fall back to the public one so this works
// without a new env var being provisioned.
const AUDIO_BASE = (process.env.AUDIO_BASE_URL ?? process.env.NEXT_PUBLIC_AUDIO_BASE_URL ?? '')
  .replace(/\/$/, '')

export async function GET() {
  if (!AUDIO_BASE) {
    return NextResponse.json({ error: 'audio base not configured', tracks: [] }, { status: 200 })
  }
  try {
    const res = await fetch(`${AUDIO_BASE}/catalog.json`, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}`, tracks: [] }, { status: 200 })
    }
    const data = await res.json()
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Edge-cache 5 min, serve stale while revalidating.
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err), tracks: [] }, { status: 200 })
  }
}
