/**
 * ASTRYX mailer — one thin door to Resend, so the from-address, the branding
 * and the failure behaviour stay consistent across every mail the app sends.
 *
 * Best-effort by design: returns false, never throws. An access grant or a
 * webhook 200 must never fail because mail did.
 *
 * Server-only: RESEND_API_KEY is read here and must never reach the client.
 *
 * THE GATE: with no RESEND_API_KEY set, nothing sends and every call is a
 * no-op. That single switch is what keeps this whole funnel inert until SHA
 * has read the copy in `emails.ts` and decided to turn it on.
 */

const FROM = 'ASTRYX <noreply@mail.sacredtea.net>'
/** Replies land in a real inbox — people answer transactional mail. */
const REPLY_TO = 'info@sacredtea.net'

export function mailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY
}

export async function sendAstryxEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to, subject, html }),
    })
    if (!r.ok) console.error('[mailer] resend rejected:', r.status, await r.text().catch(() => ''))
    return r.ok
  } catch (e) {
    console.error('[mailer] send failed:', e)
    return false
  }
}

/** Shared shell so every ASTRYX email reads as one system. */
export function astryxEmailShell(inner: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#020208;color:#E2E8F0;padding:30px;border-radius:18px;border:1px solid rgba(245,158,11,.28);">
    <p style="text-align:center;font-size:.7rem;letter-spacing:.34em;color:#F59E0B;text-transform:uppercase;margin:0 0 22px;">✦ ASTRYX</p>
    ${inner}
    <p style="text-align:center;color:#64748B;font-size:.68rem;line-height:1.7;margin:26px 0 0;border-top:1px solid rgba(148,163,184,.14);padding-top:16px;">
      ⓘ Reference tool · Not medical advice.<br/>
      ASTRYX is a wellness and observational-reference system. It does not diagnose or replace care from a licensed professional.<br/>
      House of MahMah Tea LLC · <a href="https://myastryx.com" style="color:#F59E0B;">myastryx.com</a>
    </p>
  </div>`
}
