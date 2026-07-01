/**
 * Astryx PDF Export
 *
 * Generates a professional practitioner-grade protocol report.
 * Client-side using jsPDF — no server required.
 *
 * Report sections:
 * 1. Header + branding
 * 2. Client info (name, birth data, location)
 * 3. Dominant pattern + confidence
 * 4. Full SOAP output
 * 5. Sound protocol (frequencies + behavior)
 * 6. Scent protocol
 * 7. Taste / herbal protocol
 * 8. Body protocol
 * 9. Sight protocol (colors + geometry)
 * 10. Practitioner notes footer
 */

import type { ProtocolOutput } from '@/types'
import type { IntakeData } from '@/types'

interface ExportOptions {
  intake: IntakeData
  protocol: ProtocolOutput
  accentColor: string
  chartData?: any
  practitionerName?: string
  clientName?: string
  sessionDate?: string
}

// ─── COLOR HELPERS ────────────────────────────────────────────

function hexToRGB(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

// ─── MAIN EXPORT FUNCTION ─────────────────────────────────────

export async function exportPractitionerPDF(options: ExportOptions): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const {
    intake,
    protocol,
    accentColor,
    chartData,
    practitionerName = 'Astryx Practitioner',
    sessionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
  } = options

  const p = protocol.dominant_pattern
  const accentRGB = hexToRGB(accentColor)

  // ── Page dimensions ──
  const W  = 210  // A4 width mm
  const H  = 297  // A4 height mm
  const ML = 18   // margin left
  const MR = 18   // margin right
  const CW = W - ML - MR  // content width

  let y = 0  // current y position

  // ─── HEADER ───────────────────────────────────────────────

  // Deep background strip
  doc.setFillColor(5, 7, 20)
  doc.rect(0, 0, W, 42, 'F')

  // Accent line
  doc.setFillColor(...accentRGB)
  doc.rect(0, 0, W, 1.5, 'F')

  // Logo / title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text('ASTRYX', ML, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 200)
  doc.text('COSMIC RESONANCE SYSTEM', ML, 22)
  doc.text('PRACTITIONER PROTOCOL REPORT', ML, 27)

  // Date + practitioner (right aligned)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 170)
  doc.text(sessionDate, W - MR, 16, { align: 'right' })
  doc.text(practitionerName, W - MR, 22, { align: 'right' })

  // Accent bottom border on header. jspdf's GState constructor isn't in
  // the public types, so we widen here without changing runtime behavior.
  doc.setFillColor(...accentRGB)
  const docAny = doc as unknown as { setGState: (s: unknown) => void; GState: new (o: { opacity: number }) => unknown }
  docAny.setGState(new docAny.GState({ opacity: 0.3 }))
  doc.rect(0, 41, W, 0.5, 'F')
  docAny.setGState(new docAny.GState({ opacity: 1 }))

  y = 52

  // ─── CLIENT SECTION ───────────────────────────────────────

  sectionTitle(doc, 'CLIENT INFORMATION', y, ML, CW, accentRGB)
  y += 8

  const clientInfo = [
    ['Name',           intake.name || 'Not provided'],
    ['Birth Date',     intake.birthDate || '—'],
    ['Birth Time',     intake.birthTime || (chartData?.isSolarChart ? 'Unknown — Solar Chart used' : 'Unknown (noon default)')],
    ['Chart Mode',     chartData?.isSolarChart ? 'Solar Chart (Sun on Ascendant)' : 'Natal Chart (Placidus)'],
    ['Birth Location', intake.birthLocation || '—'],
    ['Session Mode',   intake.mode === 'practitioner' ? 'Practitioner' : 'User'],
    ['Symptoms',       (intake.symptoms ?? []).join(', ') || 'None reported'],
    ['Emotional State',(intake.emotionalState ?? []).filter(Boolean).join(', ') || '—'],
    ['Intention',      (intake.intention      ?? []).filter(Boolean).join(', ') || '—'],
  ]

  clientInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(130, 130, 160)
    doc.text(label.toUpperCase(), ML, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 50)
    const lines = doc.splitTextToSize(value, CW - 50)
    doc.text(lines, ML + 50, y)
    y += 5.5
  })

  y += 4

  // ─── DOMINANT PATTERN ─────────────────────────────────────

  checkPageBreak(doc, y, 55)
  sectionTitle(doc, 'DOMINANT PATTERN', y, ML, CW, accentRGB)
  y += 8

  // Pattern card background
  doc.setFillColor(248, 248, 252)
  doc.roundedRect(ML, y, CW, 28, 3, 3, 'F')
  doc.setDrawColor(...accentRGB)
  doc.setLineWidth(0.5)
  doc.roundedRect(ML, y, CW, 28, 3, 3, 'D')

  // Accent left stripe
  doc.setFillColor(...accentRGB)
  doc.roundedRect(ML, y, 3, 28, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(10, 10, 30)
  doc.text(p.title, ML + 7, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...accentRGB)
  doc.text(p.subtitle, ML + 7, y + 15)

  doc.setTextColor(80, 80, 100)
  doc.text(`Signs: ${p.signs.join(' · ')}   |   Houses: ${p.houses.join(' & ')}   |   ${p.element_modality}`, ML + 7, y + 21)
  doc.text(`Aspect: ${p.aspect.charAt(0).toUpperCase() + p.aspect.slice(1)}   |   Confidence: ${p.confidence_score}%`, ML + 7, y + 26)

  // Confidence bar (right side)
  const barX = W - MR - 32
  doc.setFillColor(230, 230, 240)
  doc.roundedRect(barX, y + 14, 30, 4, 2, 2, 'F')
  doc.setFillColor(...accentRGB)
  doc.roundedRect(barX, y + 14, 30 * (p.confidence_score / 100), 4, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...accentRGB)
  doc.text(`${p.confidence_score}%`, barX + 15, y + 10, { align: 'center' })

  y += 36

  // ─── SOAP ─────────────────────────────────────────────────

  checkPageBreak(doc, y, 60)
  sectionTitle(doc, 'SOAP ASSESSMENT', y, ML, CW, accentRGB)
  y += 8

  const soapSections = [
    { label: 'S — Subjective', content: protocol.soap.subjective.join('\n') },
    { label: 'O — Objective',  content: protocol.soap.objective.join('\n') },
    { label: 'A — Assessment', content: protocol.soap.assessment },
    { label: 'P — Plan',       content: protocol.soap.plan },
  ]

  soapSections.forEach(({ label, content }) => {
    checkPageBreak(doc, y, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...accentRGB)
    doc.text(label, ML, y)
    y += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 60)
    doc.setFontSize(8.5)
    const lines = doc.splitTextToSize(content, CW)
    doc.text(lines, ML, y)
    y += lines.length * 4.5 + 3
  })

  y += 2

  // ─── PROTOCOL LAYERS ──────────────────────────────────────

  const protocols = [
    {
      title: 'SOUND PROTOCOL',
      rows: [
        ['Primary Anchors', protocol.plan.sound.primary_anchors.map((h) => `${h} Hz`).join(', ')],
        ['Regulator',       `${protocol.plan.sound.regulator.name} — ${protocol.plan.sound.regulator.hz} Hz`],
        ['Style',           protocol.plan.sound.style ?? '—'],
        ['Duration',        protocol.plan.sound.duration],
        ['Notes',           protocol.plan.sound.description],
      ],
    },
    {
      title: 'SCENT PROTOCOL',
      rows: [
        ['Action',  protocol.plan.scent.action],
        ['Oils',    protocol.plan.scent.oils.join(', ')],
        ['Delivery',protocol.plan.scent.delivery],
        ['Duration',protocol.plan.scent.duration],
      ],
    },
    {
      title: 'TASTE / HERBAL PROTOCOL',
      rows: [
        ['Blend Type',   protocol.plan.taste.blend_type],
        ['Profile',      protocol.plan.taste.taste_profile.join(', ')],
        ['Ingredients',  protocol.plan.taste.ingredients.join(', ')],
        ['Preparation',  protocol.plan.taste.preparation],
        ['Timing',       protocol.plan.taste.timing],
      ],
    },
    {
      title: 'BODY PROTOCOL',
      rows: [
        ['Breath',      protocol.plan.body.breath],
        ['Movement',    protocol.plan.body.movement],
        ['Posture',     protocol.plan.body.posture],
        ['Touch',       protocol.plan.body.touch],
        ['Orientation', protocol.plan.body.orientation],
      ],
    },
    {
      title: 'SIGHT PROTOCOL',
      rows: [
        ['Geometry', protocol.plan.sight.geometry ?? protocol.plan.sight.geometry_overlay ?? '—'],
        ['Motion',   protocol.plan.sight.motion ?? protocol.plan.sight.motion_type ?? '—'],
        ['Delivery', (protocol.plan.sight.delivery ?? []).join(', ') || '—'],
        ['Notes',    protocol.plan.sight.description ?? '—'],
      ],
    },
  ]

  for (const section of protocols) {
    checkPageBreak(doc, y, 40)
    sectionTitle(doc, section.title, y, ML, CW, accentRGB)
    y += 8

    for (const [label, value] of section.rows) {
      checkPageBreak(doc, y, 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(110, 110, 140)
      doc.text((label ?? '').toUpperCase(), ML, y)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(40, 40, 60)
      doc.setFontSize(8.5)
      const lines = doc.splitTextToSize(value || '—', CW - 40)
      doc.text(lines, ML + 40, y)
      y += lines.length * 4.5 + 1
    }
    y += 5
  }

  // ─── SACRED LAYER PAGE ─────────────────────────────────────
  // Renders the Sacred Botanical, Featured Crystal, and Sacred Tones
  // dominant fork on a dedicated page. Malachite always shows a red
  // POLISHED-ONLY warning. All safety notes are always printed.
  if (protocol.sacredLayer) {
    const sl = protocol.sacredLayer
    doc.addPage()
    y = 24

    // Page title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...accentRGB)
    doc.text('Sacred Layer · Astryx Proprietary', ML, y)
    y += 10
    doc.setDrawColor(...accentRGB)
    doc.setLineWidth(0.3)
    doc.line(ML, y - 2, ML + CW, y - 2)
    y += 4

    // Sacred Botanical
    if (sl.botanical) {
      const b = sl.botanical
      checkPageBreak(doc, y, 60)
      sectionTitle(doc, `Sacred Botanical — ${b.sacredBotanical}`, y, ML, CW, accentRGB)
      y += 8
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(110, 110, 140)
      doc.text(b.latinName, ML, y); y += 5

      const botanicalRows: [string, string][] = [
        ['Biological System',  b.biologicalSystem],
        ['Mechanism',          b.biologicalMechanism],
        ['Endocrine Target',   b.endocrineTarget],
        ['Nervous System',     b.nervousSystem],
        ['Brainwave Affinity', b.brainwaveAffinity],
        ['Body Placement',     b.bodyPlacement],
        ['Wellness Benefits',  b.wellnessBenefits.join(' · ')],
      ]
      for (const [label, value] of botanicalRows) {
        checkPageBreak(doc, y, 10)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(110, 110, 140)
        doc.text(label.toUpperCase(), ML, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 60)
        doc.setFontSize(8.5)
        const lines = doc.splitTextToSize(value || '—', CW - 40)
        doc.text(lines, ML + 40, y)
        y += lines.length * 4.5 + 1
      }
      // Safety note — always printed
      checkPageBreak(doc, y, 10)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(160, 100, 40)
      const safetyLines = doc.splitTextToSize(`Safety: ${b.safetyNote}`, CW)
      doc.text(safetyLines, ML, y)
      y += safetyLines.length * 4.5 + 6
    }

    // Featured Crystal — Malachite gets a red POLISHED ONLY badge in text
    if (sl.crystal) {
      const cd = sl.crystal.featuredCrystalData
      const isMalachite = cd.name === 'Malachite'

      checkPageBreak(doc, y, 60)
      const titleText = `Featured Crystal — ${cd.name}`
      sectionTitle(doc, titleText, y, ML, CW, accentRGB)

      // Malachite warning printed in red right under the title
      if (isMalachite) {
        y += 6
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(200, 30, 30)
        doc.text('⚠ RAW FORM TOXIC — POLISHED / SEALED ONLY', ML, y)
        y += 4
      } else {
        y += 8
      }

      const crystalRows: [string, string][] = [
        ['Composition',       cd.mineralComposition],
        ['Mechanism',         cd.biologicalMechanism],
        ['Biological System', cd.biologicalSystem],
        ['Endocrine Target',  cd.endocrineTarget],
        ['Nervous System',    cd.nervousSystem],
        ['Body Placement',    cd.bodyPlacement],
        ['Placement Note',    cd.placementNote],
        ['Ruling Metal',      `${sl.crystal.metal} — ${sl.crystal.existingGems.join(', ')}`],
      ]
      for (const [label, value] of crystalRows) {
        checkPageBreak(doc, y, 10)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(110, 110, 140)
        doc.text(label.toUpperCase(), ML, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 60)
        doc.setFontSize(8.5)
        const lines = doc.splitTextToSize(value || '—', CW - 40)
        doc.text(lines, ML + 40, y)
        y += lines.length * 4.5 + 1
      }
      checkPageBreak(doc, y, 10)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(160, 100, 40)
      const safetyLines = doc.splitTextToSize(`Safety: ${cd.safetyNote}`, CW)
      doc.text(safetyLines, ML, y)
      y += safetyLines.length * 4.5 + 6
    }

    // Sacred Tones — dominant fork for this client
    if (sl.dominantFork) {
      const f = sl.dominantFork
      checkPageBreak(doc, y, 60)
      sectionTitle(doc, `Sacred Tones — ${f.planet} Fork (${f.hz} Hz · ${f.note})`, y, ML, CW, accentRGB)
      y += 8

      const forkRows: [string, string][] = [
        ['Chakra',            f.chakra],
        ['Nerve Plexus',      f.nervePlexus],
        ['Application Point', f.boneApplicationPoint],
        ['Vagal Connection',  `${f.vagusConnection} (Strength: ${f.vagusStrength})`],
        ['ANS Effect',        f.ANSEffect],
        ['Brainwave',         `${f.brainwaveAffinity} — ${f.brainwaveState}`],
      ]
      for (const [label, value] of forkRows) {
        checkPageBreak(doc, y, 10)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(110, 110, 140)
        doc.text(label.toUpperCase(), ML, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 60)
        doc.setFontSize(8.5)
        const lines = doc.splitTextToSize(value || '—', CW - 40)
        doc.text(lines, ML + 40, y)
        y += lines.length * 4.5 + 1
      }
      checkPageBreak(doc, y, 14)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...accentRGB)
      doc.text('CLINICAL NOTE', ML, y); y += 4
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(60, 60, 90)
      const clinicalLines = doc.splitTextToSize(f.clinicalNote, CW)
      doc.text(clinicalLines, ML, y)
      y += clinicalLines.length * 4.5 + 6
    }
  }

  // ─── FOOTER ───────────────────────────────────────────────

  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(5, 7, 20)
    doc.rect(0, H - 12, W, 12, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 130)
    doc.text('ASTRYX — Cosmic Resonance System', ML, H - 6)
    doc.text(
      'This report is for wellness guidance only. Not a medical diagnosis. All assessments use probabilistic language.',
      ML, H - 3,
    )
    doc.text(`Page ${i} / ${totalPages}`, W - MR, H - 6, { align: 'right' })
  }

  // ─── SAVE ─────────────────────────────────────────────────

  const filename = `astryx_protocol_${intake.name?.replace(/\s+/g, '_') || 'session'}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

// ─── HELPERS ──────────────────────────────────────────────────

function sectionTitle(
  doc: any,
  title: string,
  y: number,
  ml: number,
  cw: number,
  accentRGB: [number, number, number]
) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...accentRGB)
  doc.text(title, ml, y)
  doc.setDrawColor(...accentRGB)
  doc.setGState(new doc.GState({ opacity: 0.3 }))
  doc.setLineWidth(0.3)
  doc.line(ml + doc.getTextWidth(title) + 3, y - 0.5, ml + cw, y - 0.5)
  doc.setGState(new doc.GState({ opacity: 1 }))
}

function checkPageBreak(doc: any, y: number, needed: number) {
  if (y + needed > 275) {
    doc.addPage()
    return 20
  }
  return y
}
