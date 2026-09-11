/**
 * ASTRYX — Sovereign retrieval brain  (Directive v1.0 · FIX 6 · Decision D1)
 * ════════════════════════════════════════════════════════════════════════════
 * Replaces the Gemini `/api/teach` call. Astryx now answers RETRIEVAL-ONLY from
 * SHA's own canon (JSON libraries) + the user's OWN reading & session history.
 * Nothing leaves the stack — no third-party API, no data egress. Pure function.
 *
 * Three jobs (one face):
 *   • Depth-on-demand — "why Mercury / what's this cell salt / why this tea / fork"
 *   • Continuity      — "last time you came in X and left Y; today's sky is different"
 *   • Learn-more      — the post-session learn-more tab calls the same brain
 *
 * Compliance: crisis keywords trump everything (detectCrisis); every reply is
 * passed through the banned-phrase guard; framing stays "may / traditionally
 * associated with"; health decisions are redirected to a licensed practitioner.
 */

import sacredTones from '@/data/sacredTones_nervousSystem.json'
import { detectCrisis, CRISIS_RESOURCES_CARD, containsBannedPhrase } from '@/lib/compliance'
import { planetBodyRulershipLibrary, RULERSHIP_SIGNS } from '@/lib/BodyPlacementEngine'
import type { SacredFork } from '@/types'

export interface AstryxContext {
  protocol?: any
  sessionLog?: Array<{ signalState?: string; planetaryCarrier?: string; dateTime?: string; postSessionState?: { feeling?: string[] } }>
  dailyElementNote?: string | null
}

export interface AstryxAnswer {
  reply: string
  crisis?: boolean
  suggestedConcept?: { key: string }
}

const FORKS = sacredTones as SacredFork[]
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

// Invariant symbolism (not dynamic data) — a one-line role per body.
const PLANET_ROLE: Record<string, string> = {
  Sun: 'vitality, identity, and your core spark',
  Moon: 'emotion, rhythm, and what soothes you',
  Mercury: 'the mind, thinking, and communication',
  Venus: 'harmony, relating, pleasure, and worth',
  Mars: 'drive, action, heat, and boundaries',
  Jupiter: 'expansion, meaning, and growth',
  Saturn: 'structure, boundaries, time, and discipline',
  Uranus: 'change, insight, and the unexpected',
  Neptune: 'imagination, intuition, and dissolving edges',
  Pluto: 'depth, power, and transformation',
}

const ELEMENT_NOTE: Record<string, string> = {
  fire: 'Fire is warmth, drive, and spark — when it runs high it can overheat; cooling and pacing settle it.',
  earth: 'Earth is grounding, structure, and the body — when heavy it can feel stuck; movement and air lift it.',
  air: 'Air is mind, breath, and connection — when busy it can scatter up top; grounding low and slow settles it.',
  water: 'Water is feeling, flow, and intuition — when deep it can overwhelm; warmth and steady rhythm give it banks.',
}

const has = (s: string, ...kw: string[]) => kw.some((k) => s.includes(k))
function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }

function forkFor(planet: string): SacredFork | undefined {
  const name = planet === 'Moon' ? 'Full Moon' : planet
  return FORKS.find((f) => f.planet === name)
}

function primaryPlanet(protocol: any): string {
  return protocol?.signalHierarchy?.primary?.planet
    ?? protocol?.diagnostic?.dominantPlanet
    ?? 'Sun'
}

/** A planet named IN the question (so "where do I place the Saturn fork" answers
 *  about SATURN, not the primary signal — never contradict what the user named). */
function namedPlanetIn(q: string): string | undefined {
  return PLANETS.find((p) => q.includes(p.toLowerCase()))
}

/** Deterministic, tiny string hash → lets us vary phrasing by the exact wording so
 *  she doesn't read like a robot on repeat, while staying pure (same text → same
 *  reply). Reword the question a little and she answers a little differently. */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function pick<T>(arr: T[], key: string): T {
  return arr[hashStr(key) % arr.length]
}

/** The body field a planet's fork settles on — reused from the placement engine
 *  so the sovereign brain never contradicts the chamber's own placement. */
function placementZone(target: string): { zone: string; sign?: string } {
  const field = planetBodyRulershipLibrary[target]?.placementLabel
  const sign = RULERSHIP_SIGNS[target]?.[0]
  return { zone: field ? field.toLowerCase() : `the area ${target} governs`, sign }
}

/** The sovereign answer. Pure — same inputs → same reply. */
export function answerAstryx(message: string, ctx: AstryxContext = {}): AstryxAnswer {
  const raw = (message ?? '').trim()
  const q = raw.toLowerCase()
  const { protocol, sessionLog, dailyElementNote } = ctx

  // 1) Crisis trumps everything.
  if (detectCrisis(raw).isCrisis) {
    return { reply: CRISIS_RESOURCES_CARD, crisis: true }
  }

  const planet = primaryPlanet(protocol)
  const d = protocol?.diagnostic
  const rx = protocol?.prescriptions?.[0]

  let reply: string
  let concept: string | undefined

  // 1a) THE BOUNDARY (2026-09-10) — cure / heal / medication / doctor questions.
  // The battery showed a "will this cure my anxiety" question surrendering to the
  // generic orientation line. This is the warm boundary from the persona's own
  // exemplar, lint-clean, and it names where the question belongs.
  if (has(q, 'cure', 'heal me', 'heal my', 'fix my', 'get rid of', 'medication', 'medicine', 'pills', 'my doctor', 'instead of my', 'stop taking', 'symptom')) {
    reply = `That is a question for your licensed practitioner — anything about a symptom, a medication, or whether something will ease lives with the person who can examine you, and Astryx makes no claim there. What I can do is explain why your calibration leans the way it does: today your signal reads ${planet}, and the tones, the colour and the plant in your protocol are chosen to settle that pattern rather than amplify it. It is a calming, sensory practice and a reference for your own chart, never a substitute for care. Shall I walk you through why it landed this way?`
    concept = 'boundary'
  }
  // 1b) USING THE APP (2026-09-10) — the guide answers usage questions offline
  // too. Ordered most-specific first so "marma session" lands on marma, not on
  // the generic session branch. "How do I start" gets the first-session walk
  // (it used to fall into the six-types overview); "simulated tone" gets its own
  // answer rather than the whole Settings list.
  else if (has(q, 'how do i start', 'how to start', 'first session', 'getting started', 'get started', 'where do i begin', 'how do i begin', 'new here')) {
    reply = `Your first session, start to finish. Create your account and accept the Terms and Consent. Enter your birth data at Intake — date, time (or tap "I don't know my birth time"), and city — plus how you feel today and an intention if you like. A brief Analysis runs. Today's Reading appears: one card naming your signal, its carrier planet and today's fork sequence. Then the Dashboard, your daily home: under Sessions tap Today's Calibration, or pick Full Body, Chakra or Marma. In the Chamber press Play in the music player — nothing begins until you do — and follow the phase cards: each names the fork, the frequency, where to hold it and for how long. Afterwards the Post-Session summary records how you feel. Tomorrow the Daily Check-In sets a fresh calibration.`
    concept = 'getting-started'
  }
  else if (has(q, 'simulated')) {
    reply = `In the chamber the app plays each fork's tone for you. When you don't own that physical fork, the phase card says the tone is simulated and names the frequency the real fork rings at, so you always know what you are hearing. Tap the forks you do own in Settings under Sacred Tones You Own and that note disappears for them. Two sets are made: the aluminum field set, held four to six inches off the body or by the ear, and the weighted steel set, struck and rested stem-down on the point — choose yours on the phase card and the instructions key to it.`
    concept = 'simulated-tone'
  }
  else if (has(q, 'marma', 'marmani', 'named point', 'ayurved', 'shalaka')) {
    reply = `Marma is the named point inside the body zone — Ayurveda's map of places where nerve, vessel, muscle, bone and joint meet. Astryx carries twenty-seven of them, each chosen because it sits on a fork's own application point or a chakra center. Every fork has its primary point (the Sun at Surya above the navel, Saturn at Janu on the kneecap, Mercury at Krikatika at the top of the neck) and every point shows how the fork may meet it: a gold badge means the weighted stem may rest there, cyan means light contact or the fork held in the field, magenta means never touched — a six-inch field sweep only. The Marma Recalibration walks all twelve from the heel to the crown and closes at the sole; start it from the Sessions tiles on your Dashboard or the session picker.`
    concept = 'marma'
  }
  else if (has(q, 'locked', 'lock out', 'locked out', 'subscribe', 'subscription', 'trial', 'paywall', 'expired', 'gate', 'how much', 'price', 'cost', 'pay', 'renew', 'cancel')) {
    reply = `Your account begins with thirty days free, no card. When they are complete the app shows the subscribe gate — nothing of yours is removed; your chart, readings and history wait exactly where you left them. Subscribing at sacredtea.net restores you the moment the order goes through: $9.99 a month or $99 a year for Individual, $39.95 a month for Practitioner. Use the same email you sign in with, because access is matched to your checkout email. If you already subscribed and still see the gate, sign in with the email you used at checkout, or write to info@sacredtea.net. Bought the Sacred Tones forks? That purchase grants access under the same email.`
    concept = 'access'
  }
  else if (has(q, 'practitioner', 'client roster', 'my clients', 'session mode', 'pdf', 'export', 'clinical')) {
    reply = `The Practitioner tier ($39.95 a month) turns Astryx toward the people who sit in your chair: a client roster, running any session on a client's chart, Sacred Tones Session Mode showing which fork goes where for that chart today with the named marma and its safety class, session notes with a vagal-tone rating, the practitioner PDF with your name and modality on the footer, the sixty-minute container, clinical terminology, and unmetered Ask Astryx. Subscribe to Practitioner Access at sacredtea.net with your sign-in email and the surface opens on your next sign-in. It is self-attested — Astryx is a builder of tools, not a credentialing body.`
    concept = 'practitioner'
  }
  else if (has(q, 'how do i start', 'start a session', 'begin a session', 'which session', 'what session', 'session types', 'kinds of session', 'full body', 'full-body', 'chakra recal', 'full spectrum', 'full-spectrum', 'how long')) {
    reply = `Six session types live in the Resonance Chamber. Calibrated is tuned to your chart and today's sky — fifteen or thirty minutes, sixty for practitioners. The other five are the same map for every body and need no reading: Full-Spectrum (all ten planetary forks feet to head, about twenty-eight minutes), Full Body (the twelve-fork ladder up and back, about thirty-five), Chakra (seven centers crown to root and back, Solfeggio or Planetary forks, about twenty-seven), and Marma (the twelve forks at their named Ayurvedic points, heel to crown to sole, about thirty). Tap a tile under Sessions on your Dashboard, then press Play in the Chamber Music player — nothing begins until you do. Every phase card names the fork, the frequency, where to hold it and for how long.`
    concept = 'sessions'
  }
  else if (has(q, 'settings', 'simulated', 'forks i own', 'forks you own', 'own the forks', 'motion', 'body map type')) {
    reply = `Settings holds: Motion (how much the cosmos moves behind you); Chamber Music (Default lets Astryx pick each fork's song, Customize remembers your choice per planet); Session Mode (Ask each time, or a default of Calibrated, Full Body, Chakra or Marma); Sacred Tones You Own (tap the forks you physically hold and the chamber stops calling those tones simulated); the Body Map silhouette; the User Guide; and your Terms and Consent. Practitioners also see a Mode toggle between the full pattern and personal guidance.`
    concept = 'settings'
  }
  else if (has(q, 'daily allowance', 'how many questions', 'limit', 'allowance', 'questions a day', 'questions per day')) {
    reply = `On the Individual tier I answer twenty questions a day, refreshing tomorrow — your reading, protocol and every session stay fully open when the allowance is spent; only the chat pauses. The Practitioner tier lifts the limit. I explain your existing reading; I never recompute or change it, I make no clinical call about your body, and I keep every statement probabilistic. Anything about a symptom, a medication or a health decision belongs with your licensed practitioner.`
    concept = 'allowance'
  }

  // 2) Continuity — pick up the thread.
  else if (has(q, 'last time', 'where did we', 'pick up', 'continue', 'recap', 'left off')) {
    const last = sessionLog?.[0]
    if (last?.planetaryCarrier) {
      const felt = last.postSessionState?.feeling?.join(', ')
      reply = `Last time you came in on a ${last.signalState ?? ''} ${last.planetaryCarrier} signal${felt ? ` and left ${felt.toLowerCase()}` : ''}. Today the sky is different — your signal now reads ${planet}. We pick up from there: a fresh calibration for today, not a repeat of last time.`
    } else {
      reply = `This looks like your first calibration, so there's no earlier session to pick up from yet. Today's signal reads ${planet} — once you run a session, I'll hold the thread for next time.`
    }
    concept = 'continuity'
  }

  // 3) Planet ≠ Remedy concept.
  else if (has(q, 'planet ≠ remedy', 'planet not remedy', 'planet ≠', 'why not just', 'planet vs remedy', 'tonic', 'counterweight', 'opposition')) {
    const reg = protocol?.dominantPolarity?.protocol?.regulator_planets?.find(Boolean)
    reply = `Astryx balances a pattern instead of amplifying it. The planet that's loud today names the pattern; the remedy is its counterweight, not more of the same. ${reg ? `Today your ${planet} signal is balanced by ${reg} — that's why your fork sequence pairs them.` : ''} Calibration is tuning, not prediction.`
    concept = 'planet-not-remedy'
  }

  // 4) Ascendant / rising.
  else if (has(q, 'ascendant', 'rising', 'asc')) {
    const asc = d?.risingSign
    reply = asc
      ? `Your Ascendant (rising sign) is ${asc}. It's the lens the whole calibration reads through — the angle that was rising on the eastern horizon at your birth. It colours how everything else lands, but it's the lens, not the verdict.`
      : `Your Ascendant is the sign that was rising at your birth — the lens the calibration reads through. Your current reading doesn't have a confirmed birth time, so it may be using Solar Chart mode; add your birth time for a precise Ascendant.`
    concept = 'ascendant'
  }

  // 5) Sun / Moon sign.
  else if (has(q, 'sun sign', 'my sun') && d?.sunSign) {
    reply = `Your Sun is in ${d.sunSign} — ${PLANET_ROLE.Sun}. It's your steady core signature beneath the day-to-day weather.`
    concept = 'sun-sign'
  }
  else if (has(q, 'moon sign', 'my moon') && d?.moonSign) {
    reply = `Your Moon is in ${d.moonSign} — ${PLANET_ROLE.Moon}. It shapes what settles or unsettles you emotionally.`
    concept = 'moon-sign'
  }

  // 5b) WHERE do I place / hold the fork? — the placement answer (uses the planet
  // the user NAMED, e.g. Saturn, so it never contradicts their question).
  else if (has(q, 'place', 'placement', 'where do i', 'where should i', 'where to', 'hold the fork', 'hold it', 'apply', 'on my body', 'body point', 'which spot', 'put the fork', 'put it')) {
    const target = namedPlanetIn(q) ?? planet
    const f = forkFor(target)
    const { zone, sign } = placementZone(target)
    const opener = pick([
      `Good question — let's get the ${target} fork onto the right spot.`,
      `Here's where the ${target} fork likes to land.`,
      `The ${target} fork has a home on the body — let me point you to it.`,
    ], raw)
    reply = `${opener} It settles best over ${zone}${sign ? ` — ${sign}'s territory in the body` : ''}${f ? `, and it carries ${f.hz} Hz` : ''}. Strike it on something soft — never metal — then rest the stem right on that point, or float the tines by your ear so the tone travels inward. Two gentle rings is plenty; less is more. Open with one slow breath and close with another to seal it. Want me to walk through why ${target} lands there?`
    concept = 'placement'
  }

  // 6) Today's transit / weather. (Kept off bare "today" so a "today's fork /
  // where do I place it" question doesn't get mistaken for a weather question.)
  else if (has(q, 'transit', 'weather', 'cosmic weather', 'the sky', 'sky today', "what's happening", 'whats happening')) {
    const t = d?.headlineTransit ?? d?.activeTransits?.[0]
    const opener = pick([`Here's the sky's read on you today.`, `Let's look at today's weather over your chart.`, `Today's contact, in plain terms:`], raw)
    if (t) {
      const effect = t.interpretation?.effect
      reply = `${opener} A transiting ${t.transitingPlanet} is ${t.aspect} your natal ${t.natalPlanet}.${effect ? ` It may correlate with: ${effect}.` : ''} That's the collective weather moving through — your own signal today reads ${planet}, and that's what your calibration works with. Weather passes; your reading is the steadier thread.`
    } else {
      reply = `${opener} It's fairly quiet against your chart — a calm, low-noise window. Your own signal today reads ${planet}, so it's a gentle day to simply calibrate.`
    }
    concept = 'transits'
  }

  // 7) Element.
  else if (has(q, 'element', 'fire', 'earth', 'air', 'water', 'grounding')) {
    const namedEl = ['fire', 'earth', 'air', 'water'].find((e) => q.includes(e))
    reply = (namedEl ? ELEMENT_NOTE[namedEl] + ' ' : '')
      + (dailyElementNote ? `For you today: ${dailyElementNote}` : `Your element note is part of today's reading — it's the one small daily action keyed to the elemental weather.`)
    concept = 'elements'
  }

  // 8) Herb / tea.
  else if (has(q, 'herb', 'tea', 'botanical', 'plant')) {
    const tea = rx?.fiveSenses?.taste?.tea
    const botanical = rx?.botanical?.sacredBotanical
    reply = `${tea ? `Today's tea is ${tea}. ` : ''}${botanical ? `Its sacred botanical is ${botanical}. ` : ''}These are traditionally associated with supporting your ${planet} signal as ritual and comfort — a self-care practice, not a treatment for any condition. For anything health-related, please see your licensed practitioner.`
    concept = 'botanicals'
  }

  // 9) Crystal / stone.
  else if (has(q, 'crystal', 'stone', 'gem', 'mineral', 'salt')) {
    if (has(q, 'salt', 'cell salt') && d?.cellSaltPrescription?.primarySalt?.saltName) {
      const s = d.cellSaltPrescription.primarySalt
      reply = `Your active cell salt is ${s.saltName}${s.epithet ? ` (${s.epithet})` : ''}. ${s.plainLanguageSignal ?? ''} It's a mineral-foundation reference with food sources${s.foodSources?.length ? ` like ${s.foodSources.slice(0, 4).join(', ')}` : ''} — not a dose or medical advice.`.trim()
      concept = 'cell-salts'
    } else {
      const crystal = rx?.crystal?.featuredCrystal
      const isMal = crystal?.toLowerCase() === 'malachite'
      reply = `${crystal ? `Today's featured stone is ${crystal}. ` : ''}It's a traditional crystal association for reflection${rx?.crystal?.featuredCrystalData?.bodyPlacement ? ` — carry it at your ${rx.crystal.featuredCrystalData.bodyPlacement}` : ''}.${isMal ? ' ⚠ Malachite: polished & sealed only — never raw, never as an elixir; wash hands after handling.' : ''} Not medical advice.`
      concept = 'crystals'
    }
  }

  // 10) Fork / frequency / tone. Uses the NAMED planet if the user mentioned one
  // (so "tell me about the Saturn fork" is about Saturn), else the primary signal.
  else if (has(q, 'fork', 'frequency', 'hz', 'tone', 'sound', 'tuning')) {
    const target = namedPlanetIn(q) ?? planet
    const isPrimary = target === planet
    const f = forkFor(target)
    const lead = isPrimary ? `Your primary fork today is ${target}` : `The ${target} fork`
    reply = f
      ? `${lead}, calibrated to ${f.hz} Hz${f.note ? ` (note ${f.note})` : ''}${f.chakra ? `, and it maps to the ${f.chakra}` : ''}. In the Chamber the app carries that tone for you; the real metal fork rings at the very same ${f.hz} Hz in your hand.${isPrimary ? '' : ` ${target} is ${PLANET_ROLE[target] ?? 'part of your supporting field today'}.`}`
      : `${lead} tunes to its own calibrated frequency, and the real metal fork carries that same tone in your hand.`
    concept = 'forks'
  }

  // 11) A named planet → its role today.
  else if (PLANETS.some((p) => q.includes(p.toLowerCase()))) {
    const named = PLANETS.find((p) => q.includes(p.toLowerCase()))!
    const isPrimary = named === planet
    const dir = protocol?.dominantPolarity?.protocol?.corrective_direction
    reply = `${named} is ${PLANET_ROLE[named]}.${isPrimary ? ` It's your signal today${dir?.length ? `, and the calibration leans toward: ${dir.slice(0, 3).map(cap).join(', ')}.` : '.'}` : ` Today it's part of the supporting cast behind your ${planet} signal.`} Remember: this is tuning, not prediction.`
    concept = `planet-${named.toLowerCase()}`
  }

  // 12) Fallback — orient warmly, anchored to their reading (varied, not canned).
  else {
    const opener = pick([
      `I'm right here with your calibration.`,
      `Happy to help — I read your calibration in plain language.`,
      `Let's stay with what your chart is actually showing.`,
    ], raw)
    reply = `${opener} Today your signal reads ${planet}. Ask me anything close to it — "why ${planet}?", "where do I place the ${planet} fork?", "what's today's sky doing?", "why this tea?", "what's my Ascendant?", or "what's the Planet ≠ Remedy idea?" I'll keep it grounded in your reading. For a symptom or a health decision, that belongs with your licensed practitioner.`
    concept = 'orientation'
  }

  // Compliance guard — never emit a banned phrase; fall back to a safe line.
  if (containsBannedPhrase(reply)) {
    // (This line is itself lint-checked by the tests — it used to say "never a
    // diagnosis", a banned word inside the compliance fallback.)
    reply = `Here's what I can share about your ${planet} calibration in plain language — it's a reference and a self-care practice, never a clinical verdict. For anything health-related, please speak with your licensed practitioner.`
  }

  return { reply, suggestedConcept: concept ? { key: concept } : undefined }
}
