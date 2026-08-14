/**
 * FUNNEL v1 — every word ASTRYX emails a customer, in one file.
 *
 * Kept separate from the sending machinery on purpose: this is the file SHA
 * reads and edits. Changing the funnel's voice should never mean opening a
 * route handler.
 *
 * COMPLIANCE (COMPLIANCE.md §2–3): no medical claims, no banned phrases, no
 * occult/ritual register — energy, frequency and calibration only. The
 * disclaimer rides in the shell on every send, so it can't be forgotten here.
 *
 * The funnel, end to end:
 *   1. forkWelcome  — fires the moment a fork order is paid. "Your forks are
 *      on the way; here is the app that tells you how to use them."
 *   2. trialEnding  — 3 days left. First mention of the subscribe link.
 *   3. trialEnded   — the door closed. The subscribe link, and the promise
 *      that their chart and history are still theirs.
 */

import { astryxEmailShell } from './mailer'
import { SUBSCRIBE_URL, PRICE_MONTHLY, PRICE_YEARLY } from './subscription'

const APP_URL = 'https://myastryx.com'
const GUIDE_URL = 'https://myastryx.com/guide'

function button(href: string, label: string): string {
  return `<p style="text-align:center;margin:26px 0 0;">
    <a href="${href}" style="display:inline-block;color:#020208;background:linear-gradient(135deg,#F59E0B,#FBBF24);text-decoration:none;font-weight:700;font-size:.92rem;padding:14px 30px;border-radius:10px;">${label}</a>
  </p>`
}

function h1(text: string): string {
  return `<h1 style="text-align:center;color:#F8FAFC;font-weight:400;font-size:1.35rem;line-height:1.4;margin:0 0 14px;">${text}</h1>`
}

function p(text: string): string {
  return `<p style="color:#94A3B8;font-size:.92rem;line-height:1.75;margin:0 0 14px;">${text}</p>`
}

const firstName = (raw: string | null | undefined, fallback: string): string => {
  const first = (raw ?? '').trim().split(/\s+/)[0]?.replace(/[^A-Za-z'’-]/g, '') ?? ''
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : fallback
}

// ── 1. The fork buyer, at the moment of purchase ─────────────────────────────

export function forkWelcome(name: string | null): { subject: string; html: string } {
  const who = firstName(name, 'there')
  return {
    subject: '✦ Your Sacred Tones are coming — here is the app that reads your chart',
    html: astryxEmailShell(`
      ${h1(`${who}, your forks are on the way.`)}
      ${p(`A tuning fork is only half the instrument. The other half is knowing <em>which</em> one to strike today, and where on your body to hold it — and that is what ASTRYX is for.`)}
      ${p(`Enter your birth data once. ASTRYX reads your natal chart as a pattern map and builds you a daily protocol across six channels — Sound, Scent, Taste, Body, Sight, and your auric Field. It names the fork, the exact frequency, and the placement, then plays that tone so the fork you are holding rings with it.`)}
      ${p(`<strong style="color:#E2E8F0;">Start with 30 days free, no card.</strong> Create your account with this same email address.`)}
      ${button(APP_URL, 'Open ASTRYX →')}
      ${p(`<span style="font-size:.85rem;">New to the forks? The guide walks through your first session start to finish: <a href="${GUIDE_URL}" style="color:#F59E0B;">${GUIDE_URL.replace('https://', '')}</a></span>`)}
    `),
  }
}

// ── 2. Three days out ────────────────────────────────────────────────────────

export function trialEnding(name: string | null, daysLeft: number): { subject: string; html: string } {
  const who = firstName(name, 'there')
  const days = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`
  return {
    subject: `Your ASTRYX access pauses ${days}`,
    html: astryxEmailShell(`
      ${h1(`${who}, your 30 days end ${days}.`)}
      ${p(`Thirty days of calibrating to your own chart and the live sky. Keeping it going is ${PRICE_MONTHLY} — or ${PRICE_YEARLY} if you would rather pay once and forget it.`)}
      ${p(`Nothing is deleted when the door closes. Your natal chart, your session history and your energy trend stay exactly where you left them, and subscribing puts you straight back in.`)}
      ${button(SUBSCRIBE_URL, 'Keep my calibration →')}
      ${p(`<span style="font-size:.85rem;">Both plans are on that one page — pick monthly or yearly at checkout. Use the same email you signed in with and your access unlocks on its own.</span>`)}
    `),
  }
}

// ── 3. The door closed ───────────────────────────────────────────────────────

export function trialEnded(name: string | null): { subject: string; html: string } {
  const who = firstName(name, 'there')
  return {
    subject: '✦ Your ASTRYX 30 days are complete',
    html: astryxEmailShell(`
      ${h1(`${who}, the door is closed — but nothing is lost.`)}
      ${p(`Your free 30 days are complete. Your chart, your readings, your session history and your before-and-after energy trend are all still yours, waiting behind the gate.`)}
      ${p(`Come back for ${PRICE_MONTHLY}, or ${PRICE_YEARLY} for the year. Cancel whenever you like — it renews until you say otherwise, and nothing renews quietly at a different price.`)}
      ${button(SUBSCRIBE_URL, 'Return to my daily calibration →')}
      ${p(`<span style="font-size:.85rem;">Subscribe with the same email you signed in with. Your access restores the moment the order goes through — you land back exactly where you left off.</span>`)}
    `),
  }
}
