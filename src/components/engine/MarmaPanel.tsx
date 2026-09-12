'use client'

/**
 * ASTRYX — Marma panel
 * ════════════════════════════════════════════════════════════════════════════
 * The named Ayurvedic doorway inside the fork's resolved body zone.
 * SHA approved the Marma × Sacred Tones map (proposal v2, 2026-09-10).
 *
 * TIER SEAM — individuals see the point's name, its plain-language location,
 * how the fork meets it, and its safety note. The practitioner tier adds the
 * classical location, the doshic subtypes, the element, the vitality class,
 * the anatomical relation and the contraindications.
 *
 * SAFETY — the application badge is never decorative. A magenta badge means the
 * point is never contacted at any pressure; the six-inch field sweep is the only
 * way that point is ever addressed. Every point renders its own safety note,
 * with no exception and no truncation.
 */

import { hexToRgba } from '@/lib/utils'
import { photoForMarma } from '@/lib/bodySites'
import type { MarmaLayer, MarmaPlacement, MarmaApplication } from '@/lib/MarmaEngine'

/**
 * SHA, 2026-09-11 — a placement is SHOWN, not described.
 *
 * The chamber used to teach a placement with a wireframe silhouette while the
 * marketing page taught it with a photograph, so a person who subscribed because
 * of the photographs arrived and got a diagram. These are the photographs.
 *
 * Wave one covers eight points. A point with no photograph renders none — the
 * body map above still shows where on the body it sits. Never substitute a
 * different point's picture; a wrong placement is worse than no placement.
 */
// The picture now keys to the BODY SITE, not to this point's id, so one
// photograph serves every system that visits the same place — and the gate
// withholds a contact picture on a step the engine tightened to a sweep.

const APP_STYLE: Record<MarmaApplication, { label: string; color: string; bg: string; border: string }> = {
  weighted: { label: 'WEIGHTED · STEM ON THE POINT', color: '#FDE047', bg: 'rgba(253,224,71,0.10)', border: 'rgba(253,224,71,0.38)' },
  field: { label: 'FIELD · 4″ · NO DEEP PRESSURE', color: '#38BDF8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.38)' },
  fieldOnly: { label: 'NEVER TOUCHED · 6″ FIELD SWEEP', color: '#FF006E', bg: 'rgba(255,0,110,0.12)', border: 'rgba(255,0,110,0.45)' },
}

const ROLE_LABEL: Record<string, string> = {
  primary: 'PRIMARY',
  secondary: 'SECONDARY',
  chakra: 'CHAKRA DOORWAY',
  counterweight: 'COUNTERWEIGHT',
}

const BASIS_LABEL: Record<string, string> = {
  'bone-point': 'matched to this fork’s own bone point',
  chakra: 'the named point of this centre',
  dosha: 'a home seat of this fork’s dosha',
  grounding: 'a closing and grounding point',
}

function MarmaCard({
  point, accentColor, isPractitionerMode,
}: { point: MarmaPlacement; accentColor: string; isPractitionerMode: boolean }) {
  const app = APP_STYLE[point.application]
  const neverTouched = point.application === 'fieldOnly'
  // RESOLVED application, not the site's default — if this person's engine
  // tightened a contact point to a sweep, the contact photograph disappears
  // rather than contradict the instruction printed beside it.
  const photo = photoForMarma(point.id, point.application)

  return (
    <div
      className="rounded-xl px-3 py-2.5 mb-2"
      style={{
        background: neverTouched ? 'rgba(255,0,110,0.05)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${neverTouched ? 'rgba(255,0,110,0.28)' : 'rgba(255,255,255,0.09)'}`,
      }}
    >
      {photo && (
        <figure className="relative mb-2.5 -mx-1 rounded-lg overflow-hidden"
                style={{ border: `1px solid ${neverTouched ? 'rgba(255,0,110,0.35)' : 'rgba(255,255,255,0.12)'}` }}>
          <img
            src={`/images/placements/${photo.file}`}
            alt={photo.alt}
            loading="lazy"
            className="block w-full"
            style={{ aspectRatio: '3 / 2', objectFit: 'cover' }}
          />
          {/* The badge repeats ON the photograph, because the picture is what
              gets copied — contact or field has to read without the caption. */}
          <figcaption
            className="absolute left-2 bottom-2 px-2 py-[3px] rounded-full text-[8.5px] font-bold tracking-[0.14em]"
            style={{ background: app.bg, color: app.color, border: `1px solid ${app.border}`, backdropFilter: 'blur(6px)' }}
          >
            {app.label}
          </figcaption>
        </figure>
      )}

      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <span className="text-[8.5px] tracking-[0.2em] text-white/40">{ROLE_LABEL[point.role] ?? 'POINT'}</span>
        <span className="font-cinzel text-[15px]" style={{ color: accentColor }}>{point.sanskrit}</span>
        {point.alsoKnownAs && (
          <span className="text-[10.5px] text-white/40 italic">also {point.alsoKnownAs}</span>
        )}
      </div>

      <div className="text-[12.5px] text-white/85 leading-snug mb-1.5">{point.plainLocation}</div>

      <span
        className="inline-block px-2 py-[3px] rounded-full text-[8.5px] font-bold tracking-[0.14em]"
        style={{ background: app.bg, color: app.color, border: `1px solid ${app.border}` }}
      >
        {app.label}
      </span>

      <div className="text-[12px] text-white/75 leading-relaxed mt-2">{point.instruction}</div>

      {/* Why a rule moved the fork off the body — never silent. */}
      {point.applicationReason && (
        <div className="text-[11px] italic leading-relaxed mt-1.5" style={{ color: app.color }}>
          {point.applicationReason}
        </div>
      )}

      {/* Rule 6 — every safety note renders. No exception, no truncation. */}
      <div
        className="text-[11px] leading-relaxed mt-2 pl-2.5"
        style={{ borderLeft: `2px solid ${neverTouched ? '#FF006E' : 'rgba(255,255,255,0.18)'}`, color: neverTouched ? 'rgba(255,150,190,0.95)' : 'rgba(255,255,255,0.55)' }}
      >
        {point.safetyNote}
      </div>

      {isPractitionerMode && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[9px] tracking-[0.2em] text-white/45 hover:text-white/80">
            POINT DETAIL
          </summary>
          <div className="mt-2 space-y-1.5">
            <Detail label="LOCATION" value={point.location} />
            <Detail label="WHY THIS POINT" value={`${point.why} (${BASIS_LABEL[point.basis] ?? point.basis})`} />
            <Detail label="ANATOMY" value={point.anatomicalRelation} />
            <Detail label="DOSHIC SUBTYPES" value={point.doshicSubtypes.join(' · ')} />
            <Detail label="ELEMENT" value={point.element} />
            <Detail label="VITALITY CLASS" value={point.vitalityLabel} />
            <Detail
              label="TRADITIONALLY ASSOCIATED WITH"
              value={point.traditionallyAssociatedWith.join(' · ')}
            />
            {point.nameNote && <Detail label="THE NAME" value={point.nameNote} />}
            <Detail label="CONTRAINDICATIONS" value={point.contraindications.join(' · ')} />
            <div className="text-[9.5px] text-white/30 pt-1">Lad &amp; Durve, {point.sourcePage}</div>
          </div>
        </details>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[8.5px] tracking-[0.22em] text-white/38">{label}</div>
      <div className="text-[11.5px] text-white/70 leading-relaxed">{value}</div>
    </div>
  )
}

export default function MarmaPanel({
  marma, accentColor, isPractitionerMode = false, compact = false,
}: {
  marma: MarmaLayer | null | undefined
  accentColor: string
  isPractitionerMode?: boolean
  /** compact renders the leading point only — for tight session cards. */
  compact?: boolean
}) {
  if (!marma || !marma.points.length) return null
  const points = compact ? marma.points.slice(0, 1) : marma.points

  return (
    <div className="mt-3">
      <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
        <span className="text-[9px] tracking-[0.25em] text-white/55">MARMA · THE NAMED POINT</span>
        {!compact && (
          <span className="text-[9.5px] tracking-[0.14em] text-white/32">
            {marma.method.label.toUpperCase()} · {marma.method.direction.toUpperCase()}
          </span>
        )}
      </div>

      {points.map((p) => (
        <MarmaCard key={p.id} point={p} accentColor={accentColor} isPractitionerMode={isPractitionerMode} />
      ))}

      {!compact && (
        <>
          <div
            className="text-[11.5px] text-white/60 leading-relaxed rounded-xl px-3 py-2 mt-1"
            style={{ background: hexToRgba(accentColor, 0.06), border: `1px solid ${hexToRgba(accentColor, 0.16)}` }}
          >
            {marma.method.instruction}
            {marma.method.neverAmplify && (
              <span className="block mt-1 text-[11px] italic" style={{ color: accentColor }}>
                Never-amplify holds here as everywhere else.
              </span>
            )}
          </div>

          {isPractitionerMode && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[9px] tracking-[0.2em] text-white/45 hover:text-white/80">
                THE FORK AS SHALAKA
              </summary>
              <div className="mt-2 space-y-1.5">
                <p className="text-[12px] text-white/72 leading-relaxed italic">{marma.bridge.headline}</p>
                <p className="text-[11.5px] text-white/60 leading-relaxed">{marma.bridge.body}</p>
                <Detail label="THE CLASSICAL ROD" value={marma.bridge.shalakaMetals} />
                <Detail label="DWELL" value={marma.bridge.dwell} />
                <Detail label="DOSHA" value={`${marma.dosha} — ${marma.doshaNote}`} />
                {marma.alternates.length > 0 && (
                  <div>
                    <div className="text-[8.5px] tracking-[0.22em] text-white/38">ALTERNATES</div>
                    {marma.alternates.map((a) => (
                      <div key={a.id} className="text-[11.5px] text-white/62 leading-relaxed">
                        <span className="text-white/85">{a.sanskrit}</span> — {a.why}
                      </div>
                    ))}
                    <div className="text-[10.5px] text-white/35 italic mt-1">
                      Placement is not one settled system. Any alternate above is yours to take. The safety layer is the part that does not move.
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="text-[9.5px] text-white/28 mt-2">{marma.citation}</div>
        </>
      )}
    </div>
  )
}
