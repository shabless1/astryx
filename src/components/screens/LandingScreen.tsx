'use client'

/**
 * ASTRYX — the front door at myastryx.com
 * ════════════════════════════════════════════════════════════════════════════
 * SHA, 2026-09-12. This replaces the sign-in wall. A stranger used to arrive,
 * read one paragraph and be asked to create an account before anything had been
 * shown to them; they could not learn what this was, what it cost, or what it
 * looked like without signing up first. Sign In is now a corner link.
 *
 * THE ONE THING THIS PAGE DOES THAT NO DESCRIPTION CAN: it sounds. Twelve real
 * Cousto frequencies, generated live in the browser. Sound is the only sense a
 * web page can actually deliver, so the page delivers it instead of describing
 * it — the hero's primary action is to hear a tone, not to subscribe.
 *
 * House style: live things are lit, reference things are printed. The
 * oscilloscope, the photographs and the hero stay on the dark ground; the tone
 * key, the arithmetic, the pricing and the Clairs column sit on stone.
 *
 * Every frequency here is the one ENGRAVED ON THE FORK. Uranus 207.33, Neptune
 * 211.45. A person holding the metal and reading the screen sees one number.
 *
 * All copy is compliance-clean: probabilistic framing, nothing treats, cures or
 * promises. See COMPLIANCE.md before editing a word of it.
 */

import { useCallback, useRef, useState } from 'react'
import ToneLadder, { type ToneApi } from './landing/ToneLadder'
import './landing/landing.css'

interface LandingScreenProps {
  accentColor: string
  onSignUp: () => void
  onSignIn: () => void
}

const IMG = '/images/marketing'

/** Chakra centres measured off the artwork; the light climbs root to crown and
 *  back — the direction the Full Body session actually travels. */
const CHAKRAS = [
  { y: 11.8, c: '#C9B7FF' }, { y: 18.9, c: '#B98CFF' }, { y: 23.9, c: '#7FC8F5' },
  { y: 32.9, c: '#FF8FD0' }, { y: 42.3, c: '#FFA6C4' }, { y: 51.3, c: '#FFB27A' },
  { y: 60.8, c: '#FF8A6B' },
]

const PLACEMENTS = [
  { fork: 'Neptune',    img: 'CROWN',     point: 'Adhipati · the crown',        hz: '211.45 Hz',
    alt: 'A practitioner sounds a fork above the crown of a reclining man’s head.' },
  { fork: 'Uranus',     img: 'trapizius', point: 'Urdhva Skandha · the shoulder', hz: '207.33 Hz',
    alt: 'A practitioner rests a weighted fork on a seated woman’s upper trapezius.' },
  { fork: 'Earth Year', img: 'HEEL',      point: 'Parshni · the heel',          hz: '136.10 Hz',
    alt: 'A practitioner applies a fork at the heel of a client lying face down.' },
]

export default function LandingScreen({ onSignUp, onSignIn }: LandingScreenProps) {
  const toneRef = useRef<ToneApi | null>(null)
  const [sounding, setSounding] = useState<string | null>(null)
  const onReady = useCallback((api: ToneApi) => { toneRef.current = api }, [])

  const sound = useCallback((fork: string) => {
    toneRef.current?.play(fork)
    setSounding(fork)
    window.setTimeout(() => setSounding((s) => (s === fork ? null : s)), 6200)
  }, [])

  return (
    <div className="ax-landing">
      <div className="ax-aura" aria-hidden="true" />

      <div className="ax-wrap">
        <nav className="ax-nav">
          <div className="ax-mark">ASTRYX</div>
          <div className="ax-navlinks">
            <a href="#ax-derive" className="ax-hide-sm">The Arithmetic</a>
            <a href="#ax-astra" className="ax-hide-sm">Astra</a>
            <a href="#ax-forks" className="ax-hide-sm">The Forks</a>
            <a href="#ax-access" className="ax-hide-sm">Access</a>
            <button type="button" className="ax-signin" onClick={onSignIn}>Sign in</button>
          </div>
        </nav>

        {/* ── hero ──────────────────────────────────────────────────────── */}
        <div className="ax-hero">
          <div className="ax-field" aria-hidden="true">
            <div className="ax-field-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/hero-figure.jpg`} alt="" />
              <span className="ax-beam" />
              {CHAKRAS.map((c, i) => (
                <span key={i} className="ax-ck" style={{ top: `${c.y}%`, ['--c' as string]: c.c }} />
              ))}
            </div>
          </div>

          <div>
            <div className="ax-eyebrow">Sacred Tones &middot; Astryx</div>
            <h1 className="ax-wordmark">ASTRYX</h1>
            <div className="ax-thesis">You were born into a chord.<br />It is still sounding.</div>
            <p className="ax-lede">
              Twelve bodies were turning somewhere at your first breath, each at its own rate, and that
              arrangement has a sound. Not a metaphor. <strong>A number.</strong>
            </p>
            <p className="ax-lede">
              Astryx works out which tone your chart is leaning on today, and where on the body to let
              it ring. Nothing here asks you to believe it first &mdash;{' '}
              <strong>put your volume up and touch one.</strong>
            </p>
            <div className="ax-ctas">
              <button type="button" className="ax-btn ax-btn-sound" onClick={() => sound('Earth Year')}>
                &#9654;&nbsp;&nbsp;Sound the Earth tone
              </button>
              <button type="button" className="ax-btn ax-btn-ghost" onClick={onSignUp}>
                Start your calibration &rarr;
              </button>
            </div>
            <div className="ax-undercta">
              $9.99 a month &middot; 30 days free &middot; Already bought the forks? Your access came with them.
            </div>
          </div>

          <ToneLadder onReady={onReady} />
        </div>
      </div>

      <div className="ax-wrap">
        {/* ── the arithmetic ──────────────────────────────────────────────── */}
        <section id="ax-derive">
          <div className="ax-two">
            <div>
              <div className="ax-label">Where the numbers come from</div>
              <h2 className="ax-h2">An orbit, folded until you can hear it</h2>
              <p className="ax-lede">
                Earth takes a year to go once around the sun. That is a frequency &mdash; an impossibly
                slow one, a single cycle in three hundred and sixty-five days. Too low to hear, but not
                too low to <strong>double</strong>.
              </p>
              <p className="ax-lede">
                Double it, and double that, thirty-two times, and it arrives somewhere your ear can
                follow. Hans Cousto worked this out in 1978 and called it the cosmic octave. Every one
                of the twelve forks is the same arithmetic run on a different body.
              </p>
              <p className="ax-lede">
                <strong>That is the whole trick, and it is checkable.</strong> No one has to take
                anything on faith.
              </p>
            </div>
            <div className="ax-derive">
              <div className="dl">Earth Year &middot; worked</div>
              <div className="ax-step"><span className="what">One orbit of the sun</span><span className="val">365.256 days</span></div>
              <div className="ax-step"><span className="what">As a frequency</span><span className="val">0.0000000317 Hz</span></div>
              <div className="ax-step"><span className="what">Doubled, thirty-two times</span><span className="val">&times; 2<sup>32</sup></span></div>
              <div className="ax-step final"><span className="what">Audible. Machined into steel.</span><span className="val">136.10 Hz</span></div>
              <p>
                <b>Now look at the ladder again.</b> Saturn sits at 147.85 and Jupiter at 183.58, and
                nothing fills the space between them. Nothing was left out. That silence is the actual
                shape of the solar system, printed in a row of forks.
              </p>
            </div>
          </div>
        </section>

        {/* ── placements ──────────────────────────────────────────────────── */}
        <section>
          <div className="ax-label">Show me</div>
          <h2 className="ax-h2">This is what it looks like when it is working</h2>
          <p className="ax-lede" style={{ maxWidth: '64ch' }}>
            Every phase names the fork, the frequency, the named point and how long to let it ring. You
            are never guessing where a thing goes.{' '}
            <strong>Tap any of these and hear the tone that belongs to it.</strong>
          </p>
          <div className="ax-strip">
            {PLACEMENTS.map((p) => (
              <div key={p.fork}>
                <figure
                  className={`ax-shot${sounding === p.fork ? ' sounding' : ''}`}
                  data-fork={p.fork}
                  role="button"
                  tabIndex={0}
                  aria-label={`Sound the ${p.fork} fork`}
                  onClick={() => sound(p.fork)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sound(p.fork) } }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${IMG}/${p.img}.jpg`} alt={p.alt} loading="lazy" />
                </figure>
                <div className="ax-cap"><b>{p.point}</b><span className="hz">{p.fork} &middot; {p.hz}</span></div>
              </div>
            ))}
            <div>
              <figure className="ax-shot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/sweep.jpg`} alt="A fork held a clear distance above a reclining client’s belly, never touching." loading="lazy" />
              </figure>
              <div className="ax-cap"><b>Swept, never touched</b><span className="hz">Six inches above the body</span></div>
            </div>
          </div>
          <div className="ax-note" style={{ marginTop: 24 }}>
            <b>That last one has no button, on purpose.</b> Two named points are met at six inches and
            swept rather than touched &mdash; the reproductive point below the navel, and the tail bone.
            For every fork, every chart, every person. A rule that holds without exception is worth more
            than one that mostly holds.
          </div>
        </section>

        {/* ── six channels ────────────────────────────────────────────────── */}
        <section>
          <div className="ax-two">
            <div>
              <div className="ax-label">The 6-Sense Protocol</div>
              <h2 className="ax-h2">Six channels. Every one opens both ways.</h2>
              <p className="ax-lede">
                There is an instrument you pick up, and there is a faculty it trains. The fork and the
                ear. The oil, and the nose that starts catching what is not in the room.
              </p>
              <p className="ax-lede">
                Astryx works the outward side, because{' '}
                <strong>that is the side that can be measured.</strong> What opens on the inward side is
                yours. Nobody can hand it to you, and nobody should promise you they can.
              </p>
            </div>
            <figure style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${IMG}/anatomy.jpg`}
                alt="A luminous figure: the body in cyan filament with the chakra column burning crown to root."
                loading="lazy"
                style={{
                  display: 'block', width: '100%',
                  WebkitMaskImage: 'radial-gradient(66% 62% at 50% 50%, #000 58%, transparent 92%)',
                  maskImage: 'radial-gradient(66% 62% at 50% 50%, #000 58%, transparent 92%)',
                }}
              />
            </figure>
          </div>

          <div className="ax-chead" style={{ marginTop: 26 }}>
            <div>Channel</div><div>What you pick up</div><div>What it trains</div>
          </div>
          <div className="ax-rows">
            <div className="ax-row"><div className="ax-r-k">Sound</div><div className="ax-r-out">Today&rsquo;s fork, at its own frequency</div><div className="ax-r-in"><em>Clairaudience</em> &mdash; clear hearing</div></div>
            <div className="ax-row"><div className="ax-r-k">Sight</div><div className="ax-r-out">The colour the chamber bathes you in</div><div className="ax-r-in"><em>Clairvoyance</em> &mdash; clear seeing</div></div>
            <div className="ax-row"><div className="ax-r-k">Scent</div><div className="ax-r-out">The oil tied to the planet carrying your signal</div><div className="ax-r-in"><em>Clairalience</em> &mdash; clear smelling</div></div>
            <div className="ax-row"><div className="ax-r-k">Taste</div><div className="ax-r-out">A tea and a plant ally, safety notes shown</div><div className="ax-r-in"><em>Clairgustance</em> &mdash; clear tasting</div></div>
            <div className="ax-row"><div className="ax-r-k">Body</div><div className="ax-r-out">The breath, the posture, the placement</div><div className="ax-r-in"><em>Clairsentience</em> and <em>clairtangency</em></div></div>
            <div className="ax-row"><div className="ax-r-k">Field</div><div className="ax-r-out">The auric layer &mdash; swept, never touched</div><div className="ax-r-in"><em>Claircognizance</em> and <em>clairempathy</em></div></div>
          </div>
        </section>

        {/* ── Astra ───────────────────────────────────────────────────────── */}
        <section id="ax-astra">
          <div className="ax-astra">
            <figure className="ax-face">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/astra-portrait.jpg`} alt="Astra, the Astryx guide, rendered in neon and circuitry." loading="lazy" />
            </figure>
            <div>
              <div className="ax-label">Your guide</div>
              <h2 className="ax-h2">Meet Astra</h2>
              <p className="ax-lede" style={{ maxWidth: '58ch' }}>
                Astryx is the instrument. <strong>Astra is the one who explains it.</strong> She holds
                your chart, the whole fork canon, this morning&rsquo;s sky and every corner of the app
                &mdash; and she will not make you feel foolish for asking.
              </p>
              <p className="ax-lede" style={{ maxWidth: '58ch' }}>
                Ask her why Saturn turned up today. Ask what a marma point is, or how to cancel. She
                answers plainly, she makes no claim about your body, and the moment a question belongs
                to someone who can examine you, she says so and means it.
              </p>
              <div className="ax-chat">
                <div className="ax-chat-top">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${IMG}/astra-avatar.jpg`} alt="" />
                  <span>Astra</span>
                </div>
                <div className="ax-bub">
                  <div className="ax-b you">Which fork is for grounding?</div>
                  <div className="ax-b her">
                    The grounding fork is the Earth Year fork at <i>136.10&nbsp;Hz</i> &mdash; the Om
                    tone. It&rsquo;s the regulator in the system, the one that doesn&rsquo;t belong to
                    any single planet but to the ground under all of them.
                  </div>
                  <div className="ax-b you">Can I put the fork on my pelvis?</div>
                  <div className="ax-b her">
                    Mostly yes &mdash; the hips and the sacrum are ordinary contact. Two points are the
                    exception: the reproductive point below the navel and the tail bone. Those are met
                    six inches above the body and swept, never touched.
                  </div>
                </div>
                <div className="ax-verbatim">Real answers, word for word out of the live app.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── the chamber ─────────────────────────────────────────────────── */}
        <section>
          <div className="ax-two" style={{ gridTemplateColumns: '1.18fr .82fr' }}>
            <div>
              <div className="ax-label">The Chamber</div>
              <h2 className="ax-h2">Five ways to sit down with it</h2>
              <p className="ax-lede">
                One is built from your chart and this morning&rsquo;s sky, so it is different today than
                it was yesterday. The other four are the same map for every body &mdash; walk in, press
                play, follow the cards.
              </p>
              <div className="ax-sx-grid">
                <div className="ax-sx cream"><div className="n">Today&rsquo;s Calibration</div><div className="m">15 or 30 min</div><div className="d">Your chart against the sky as it stands right now.</div></div>
                <div className="ax-sx sky"><div className="n">Full Spectrum</div><div className="m">28 min</div><div className="d">All ten planetary forks, feet to head, in order.</div></div>
                <div className="ax-sx sage"><div className="n">Full Body</div><div className="m">35 min</div><div className="d">The twelve-fork ladder, up the body and back down.</div></div>
                <div className="ax-sx lilac"><div className="n">Chakra</div><div className="m">27 min</div><div className="d">Seven centres, crown to root. Solfeggio or planetary.</div></div>
                <div className="ax-sx rose"><div className="n">Marma</div><div className="m">30 min</div><div className="d">Twelve forks at their named Ayurvedic points.</div></div>
              </div>
            </div>
            <figure className="ax-shot" style={{ borderRadius: 15 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/inside-session.jpg`} alt="A man seated in a candlelit room, eyes closed, bathed in cyan, sound spiralling around him." loading="lazy" style={{ aspectRatio: '3 / 4' }} />
            </figure>
          </div>
        </section>

        {/* ── the forks ───────────────────────────────────────────────────── */}
        <section id="ax-forks">
          <div className="ax-label">Sacred Tones</div>
          <h2 className="ax-h2">Twelve forks, cut to the sky</h2>
          <p className="ax-lede" style={{ maxWidth: '64ch' }}>
            A fork is not a symbol here. It is a machined length of steel that rings at one number, and
            the number came from an orbit. Strike Earth Year and{' '}
            <strong>you are listening to this planet&rsquo;s year</strong>, folded upward until your ear
            can reach it.
          </p>
          <div className="ax-cards2">
            <div className="ax-stone">
              <div className="pic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/real-unweighted.jpg`} alt="The twelve-piece unweighted Sacred Tones set in its case, each fork engraved." loading="lazy" />
              </div>
              <div className="n">12-Piece Planetary Set &mdash; Unweighted</div>
              <div className="p">$699</div>
              <div className="d">The full ladder, 126.22 to 221.23&nbsp;Hz. Unweighted forks carry further through air &mdash; the choice for working around the body and in the field.</div>
              <a className="ax-cta-dark" href="https://sacredtea.net/products/sacred-tones%E2%84%A2-resonance-forks-12-piece-stainless-steel-planetary-set-unweighted" target="_blank" rel="noopener noreferrer">View in the shop &rarr;</a>
            </div>
            <div className="ax-stone">
              <div className="pic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/real-weighted.jpg`} alt="The twelve-piece weighted Sacred Tones set, weights visible at the tines." loading="lazy" />
              </div>
              <div className="n">12-Piece Planetary Set &mdash; Weighted</div>
              <div className="p">$799</div>
              <div className="d">The same twelve tones, weighted at the tines. You feel these through bone and tissue when the stem rests on a point.</div>
              <a className="ax-cta-dark" href="https://sacredtea.net/products/sacred-tones%E2%84%A2-resonance-forks-12-piece-weighted-stainless-steel-planetary-set" target="_blank" rel="noopener noreferrer">View in the shop &rarr;</a>
            </div>
          </div>
          <div className="ax-note">
            <b>You do not need the forks to begin.</b> The app sounds every tone for you and says plainly
            that it is simulating &mdash; exactly like the ladder at the top of this page. Tick a fork in
            Settings once you own it and the app stops standing in for that one.
          </div>
        </section>

        {/* ── practitioners ───────────────────────────────────────────────── */}
        <section>
          <div className="ax-label">For practitioners</div>
          <h2 className="ax-h2">The chart is on the screen. Your hands are on the body.</h2>
          <p className="ax-lede" style={{ maxWidth: '64ch' }}>
            In Practitioner mode Astryx runs on <strong>your client&rsquo;s chart, not yours</strong>.
            The screen beside you names the fork, the frequency, the point and whether that point is
            contact or field. You read a protocol instead of trying to remember one.
          </p>
          <div className="ax-room">
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/room.jpg`} alt="A practitioner sounds a fork over a reclining client while a screen beside them shows the Astryx chamber." loading="lazy" />
            </figure>
            <figure className="ax-mount">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/app-practitioner.jpg`} alt="The Astryx practitioner screen: dominant configuration, planetary positions with frequencies, and the session protocol." loading="lazy" />
              <figcaption>
                The actual screen, out of the running app. <b>Sun&ndash;Mercury conjunction, 74% confidence</b>{' '}
                &mdash; every planet with its Cousto frequency, and the fork order with nerve plexus and
                application point.
              </figcaption>
            </figure>
          </div>
          <div className="ax-pgrid">
            <div className="ax-pcell"><div className="pk">Your roster</div><div className="pv">Enter a client&rsquo;s birth data once. Their blueprint is waiting every time they come back.</div></div>
            <div className="ax-pcell"><div className="pk">Your modality</div><div className="pv">Eight lenses &mdash; medical astrology, Reiki, bodywork, naturopathy, Ayurveda, TCM. The same chart, read in your language.</div></div>
            <div className="ax-pcell"><div className="pk">Your notes</div><div className="pv">A vagal-tone rating and observations per session, kept with the client.</div></div>
            <div className="ax-pcell"><div className="pk">Your paperwork</div><div className="pv">A PDF export carrying your name and your claimed modality on the footer.</div></div>
          </div>
        </section>

        {/* ── access ──────────────────────────────────────────────────────── */}
        <section id="ax-access">
          <div className="ax-label">Access</div>
          <h2 className="ax-h2">Two ways in</h2>
          <p className="ax-lede" style={{ maxWidth: '62ch' }}>
            Your chart, your history and every session you have run stay yours. Nothing is deleted if
            you pause.
          </p>
          <div className="ax-cards2">
            <div className="ax-stone">
              <div className="n">Individual</div>
              <div className="p">$9.99 <small>/ month</small></div>
              <ul>
                <li>Your full reading and the daily plan across all six channels</li>
                <li>Every session type, Marma included</li>
                <li>Today&rsquo;s sky read against your chart</li>
                <li>The body map and your energy trends</li>
                <li>Twenty questions a day with Astra</li>
              </ul>
              <button type="button" className="ax-cta-violet" onClick={onSignUp}>Start &mdash; 30 days free</button>
            </div>
            <div className="ax-stone pro">
              <div className="n">Practitioner</div>
              <div className="p">$39.95 <small>/ month</small></div>
              <ul>
                <li>Everything in Individual, turned toward your clients</li>
                <li>A client roster &mdash; enter their birth data once</li>
                <li>Run any session on a client&rsquo;s chart, not your own</li>
                <li>Session notes with a vagal-tone rating</li>
                <li>PDF export with your name and modality</li>
                <li>Unlimited questions with Astra</li>
              </ul>
              <a className="ax-cta-dark" href="https://sacredtea.net/products/astryx-practitioner-access" target="_blank" rel="noopener noreferrer">Work on other people&rsquo;s charts</a>
            </div>
          </div>
        </section>
      </div>

      <footer className="ax-footer">
        <div className="ax-wrap">
          <div className="ax-fgrid">
            <div>
              <div className="ax-mark" style={{ fontSize: 16, marginBottom: 9 }}>ASTRYX</div>
              <div style={{ fontSize: 12.5, color: 'var(--ax-dim)' }}>
                Calibration, not prediction.<br />A House of MahMah Tea instrument.
              </div>
            </div>
            <div className="ax-flinks">
              <a href="/guide.html">User Guide</a>
              <a href="/standard.html">The Calibration Standard</a>
              <a href="https://sacredtea.net" target="_blank" rel="noopener noreferrer">Sacred Tea Shop</a>
              <button type="button" onClick={onSignIn}>Sign in</button>
            </div>
          </div>
          <div className="ax-disc">
            &#9432; Reference tool &middot; Not medical advice. Astryx does not diagnose, and nothing
            here replaces care from a licensed practitioner.
          </div>
        </div>
      </footer>
    </div>
  )
}
