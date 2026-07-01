'use client'

/**
 * ASTRYX — Body System Preview Screen
 *
 * Renders a body system JSON file as a readable in-app document so SHA
 * can visually approve the schema before scaling to all 11 systems.
 * Each section is a collapsible card. Default state: header + axes + first
 * 3 pathologies expanded.
 *
 * This is a SCHEMA REVIEW UI — not the final practitioner-facing surface.
 * The final UI will route through the Practitioner Lens Switcher and
 * present only the slice relevant to the active lens.
 */

import { useState } from 'react'
import { GlassCard, SectionLabel, Tag, DataPoint, PrimaryButton } from '@/components/ui'
import cardiovascularData    from '@/data/bodySystems/cardiovascular.json'
import respiratoryData       from '@/data/bodySystems/respiratory.json'
import digestiveData         from '@/data/bodySystems/digestive.json'
import nervousData           from '@/data/bodySystems/nervous.json'
import endocrineData         from '@/data/bodySystems/endocrine.json'
import muscularData          from '@/data/bodySystems/muscular.json'
import skeletalData          from '@/data/bodySystems/skeletal.json'
import integumentaryData     from '@/data/bodySystems/integumentary.json'
import lymphaticImmuneData   from '@/data/bodySystems/lymphatic-immune.json'
import urinaryData           from '@/data/bodySystems/urinary.json'
import reproductiveData      from '@/data/bodySystems/reproductive.json'

// All 11 systems, in standard anatomy order
const ALL_SYSTEMS: Record<string, any> = {
  cardiovascular:    cardiovascularData,
  respiratory:       respiratoryData,
  digestive:         digestiveData,
  nervous:           nervousData,
  endocrine:         endocrineData,
  muscular:          muscularData,
  skeletal:          skeletalData,
  integumentary:     integumentaryData,
  'lymphatic-immune': lymphaticImmuneData,
  urinary:           urinaryData,
  reproductive:      reproductiveData,
}

const SYSTEM_ORDER = [
  'cardiovascular', 'respiratory', 'digestive', 'nervous', 'endocrine',
  'muscular', 'skeletal', 'integumentary', 'lymphatic-immune', 'urinary', 'reproductive',
]

interface BodySystemPreviewScreenProps {
  accentColor: string
  onBack: () => void
}

export default function BodySystemPreviewScreen({ accentColor, onBack }: BodySystemPreviewScreenProps) {
  const [activeSystemId, setActiveSystemId] = useState<string>('cardiovascular')
  const data = ALL_SYSTEMS[activeSystemId] as any
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    anatomy: true,
    rulership: true,
    axes: true,
    energetics: false,
    prescriptions: false,
    modalities: false,
    pathologies: true,
    vedic: false,
    compliance: false,
  })

  const [expandedPathology, setExpandedPathology] = useState<number | null>(0)
  const [activeModality, setActiveModality] = useState<string>('individual')

  const sysColor = data.system?.accentColor ?? accentColor

  const toggle = (key: string) => setExpanded((e) => ({ ...e, [key]: !e[key] }))

  return (
    <div className="min-h-screen font-rajdhani">
      <div className="max-w-3xl mx-auto px-5" style={{ paddingTop: 90, paddingBottom: 80 }}>

        {/* Header banner */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] tracking-[0.3em] text-white/40">
              BODY SYSTEMS · PRACTITIONER · {SYSTEM_ORDER.indexOf(activeSystemId) + 1} OF 11
            </div>
            <button onClick={onBack} className="text-[11px] text-white/45 hover:text-white/70 tracking-widest">
              ← BACK
            </button>
          </div>

          {/* System switcher — horizontal scroll bar of 11 system tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
            {SYSTEM_ORDER.map((sysId) => {
              const sys = ALL_SYSTEMS[sysId].system
              const isActive = sysId === activeSystemId
              return (
                <button
                  key={sysId}
                  onClick={() => {
                    setActiveSystemId(sysId)
                    setExpanded({ anatomy: true, rulership: true, axes: true, energetics: false, prescriptions: false, modalities: false, pathologies: true, vedic: false, compliance: false })
                    setExpandedPathology(0)
                  }}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-[11px] tracking-widest transition whitespace-nowrap"
                  style={{
                    background: isActive ? `${sys.accentColor}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? sys.accentColor + '66' : 'rgba(255,255,255,0.1)'}`,
                    color: isActive ? sys.accentColor : 'rgba(255,255,255,0.55)',
                  }}
                >
                  <span className="mr-1.5">{sys.icon}</span>
                  <span className="uppercase">{sys.name.replace(' System', '').replace(' & Immune', '/Immune')}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── System header ── */}
        <GlassCard accentColor={sysColor} opacity={0.14} topBorder className="p-7 mb-5 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 flex items-center justify-center font-cinzel rounded-2xl"
              style={{
                width: 64, height: 64,
                background: `${sysColor}22`,
                border: `1px solid ${sysColor}55`,
                color: sysColor,
                fontSize: 36,
              }}
            >
              {data.system?.icon}
            </div>
            <div className="flex-1">
              <h1 className="font-cinzel text-3xl text-white mb-1">{data.system?.name}</h1>
              {/* Part E — the medical-astrology chain, always together: SYSTEM · SIGN · PLANET */}
              {(data.astrologicalRulership?.primarySign || data.astrologicalRulership?.primaryPlanet) && (
                <div className="text-[11px] tracking-[0.22em] mb-2 font-medium" style={{ color: sysColor }}>
                  {(data.system?.name ?? '').replace(/\s*System$/i, '').toUpperCase()}
                  {data.astrologicalRulership?.primarySign ? ` · ${data.astrologicalRulership.primarySign.toUpperCase()}` : ''}
                  {data.astrologicalRulership?.primaryPlanet ? ` · ${data.astrologicalRulership.primaryPlanet.toUpperCase()}` : ''}
                </div>
              )}
              <p className="text-[13px] text-white/65 mb-2">{data.system?.shortDescription}</p>
              <div className="flex flex-wrap gap-1.5">
                {data.system?.alternateNames?.map((n: string) => (
                  <Tag key={n} label={n} accent="rgba(255,255,255,0.15)" small />
                ))}
                <Tag label={data.system?.elementalProfile ?? ''} accent={`${sysColor}55`} small />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── 1. ANATOMY ── */}
        <Section
          id="anatomy"
          label="Anatomy"
          tag="MULTI-LAYERED GRID"
          color={sysColor}
          expanded={expanded.anatomy}
          onToggle={() => toggle('anatomy')}
        >
          <div className="mb-3">
            <div className="text-[10px] tracking-[0.2em] text-white/45 mb-1.5">PRIMARY STRUCTURES</div>
            <ul className="space-y-1">
              {data.anatomy?.primaryStructures?.map((s: string, i: number) => (
                <li key={i} className="text-[13px] text-white/75 leading-relaxed flex gap-2">
                  <span style={{ color: sysColor }}>·</span><span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          {data.anatomy?.subStructures && (
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(data.anatomy.subStructures).map(([k, v]) => (
                <div key={k} className="p-3 rounded-lg border border-white/10 bg-white/3">
                  <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1 capitalize">
                    {k.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[12px] text-white/65">{(v as string[]).join(' · ')}</div>
                </div>
              ))}
            </div>
          )}
          {data.anatomy?.vertebralCorrelates && (
            <div className="p-3 rounded-lg border border-white/10 bg-white/3 mb-2">
              <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">VERTEBRAL CORRELATES</div>
              <div className="text-[12px] text-white/65 leading-relaxed">{data.anatomy.vertebralCorrelates}</div>
            </div>
          )}
          {data.anatomy?.nervePlexus && (
            <div className="p-3 rounded-lg border border-white/10 bg-white/3">
              <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">NERVE PLEXUS</div>
              <div className="text-[12px] text-white/65">{data.anatomy.nervePlexus}</div>
            </div>
          )}
        </Section>

        {/* ── 2. ASTROLOGICAL RULERSHIP ── */}
        <Section
          id="rulership"
          label="Astrological Rulership"
          tag="CORNELL (1933) SOURCED"
          color={sysColor}
          expanded={expanded.rulership}
          onToggle={() => toggle('rulership')}
        >
          <div className="p-4 rounded-lg mb-3" style={{ background: `${sysColor}10`, border: `1px solid ${sysColor}33` }}>
            <div className="text-[10px] tracking-[0.2em] text-white/45 mb-2">PRIMARY</div>
            <div className="font-cinzel text-xl text-white mb-1">
              {data.astrologicalRulership?.primaryPlanet} · {data.astrologicalRulership?.primarySign} · {data.astrologicalRulership?.primaryHouse}th House
            </div>
            <p className="text-[12px] text-white/65 italic leading-relaxed">{data.astrologicalRulership?.primaryPlanetRationale}</p>
          </div>

          <div className="text-[10px] tracking-[0.2em] text-white/45 mb-2">SECONDARY PLANETS (10) — what each rules within the system</div>
          <div className="space-y-2 mb-4">
            {data.astrologicalRulership?.secondaryPlanets?.map((p: any) => (
              <div key={p.planet} className="p-3 rounded-lg border border-white/10 bg-white/3">
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="font-cinzel text-[14px] text-white">{p.planet}</span>
                  <span className="text-[12px] text-white/60">{p.rules}</span>
                </div>
                <p className="text-[11px] text-white/45 italic leading-relaxed">{p.rationale}</p>
              </div>
            ))}
          </div>

          {data.astrologicalRulership?.fixedCrossInfluence && (
            <div className="p-3 rounded-lg" style={{ background: `${sysColor}08`, border: `1px solid ${sysColor}22` }}>
              <div className="text-[10px] tracking-[0.2em] mb-1" style={{ color: sysColor }}>FIXED CROSS INFLUENCE</div>
              <p className="text-[12px] text-white/65 leading-relaxed">{data.astrologicalRulership.fixedCrossInfluence}</p>
            </div>
          )}
        </Section>

        {/* ── 3. HEALTH AXES (Minerva) ── */}
        <Section
          id="axes"
          label="Health Axes (Minerva Polarities)"
          tag={`${data.axes?.length ?? 0} AXES`}
          color={sysColor}
          expanded={expanded.axes}
          onToggle={() => toggle('axes')}
        >
          <div className="space-y-3">
            {data.axes?.map((axis: any, i: number) => (
              <div key={i} className="p-4 rounded-lg border border-white/10 bg-white/3">
                <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
                  <div>
                    <div className="font-cinzel text-[15px] text-white">{axis.name}</div>
                    <div className="text-[12px]" style={{ color: sysColor }}>{axis.polarity}</div>
                  </div>
                  <div className="text-[10px] text-white/35 italic">{axis.source}</div>
                </div>
                <p className="text-[12px] text-white/70 leading-relaxed mb-3">{axis.interpretation}</p>
                {axis.indicatorPattern && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {Object.entries(axis.indicatorPattern).map(([side, desc]) => (
                      <div key={side} className="p-2 rounded border border-white/8 bg-white/3">
                        <div className="text-[9px] tracking-widest text-white/40 uppercase mb-1">{side.replace(/_/g, ' ')}</div>
                        <div className="text-[11px] text-white/65 leading-snug">{desc as string}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── 4. ENERGETICS ── */}
        <Section
          id="energetics"
          label="Energetics"
          tag="CHAKRA · HZ · NERVOUS SYSTEM"
          color={sysColor}
          expanded={expanded.energetics}
          onToggle={() => toggle('energetics')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <DataPoint label="Chakra" value={`${data.energetics?.chakra} · ${data.energetics?.chakraColor}`} />
            <DataPoint label="Frequency" value={`${data.energetics?.chakraHz} Hz`} />
            <DataPoint label="Nervous System" value={data.energetics?.nervousSystemPathway} />
            <DataPoint label="Endocrine" value={data.energetics?.endocrineCorrespondence} />
            <DataPoint label="Element" value={data.energetics?.elementalCorrespondence} />
            <DataPoint label="Brainwave" value={data.energetics?.brainwaveAffinity} />
            <div className="sm:col-span-2"><DataPoint label="TCM Meridian Crossover" value={data.energetics?.meridianCrossover_TCM} /></div>
          </div>
        </Section>

        {/* ── 5. PRESCRIPTIONS ── */}
        <Section
          id="prescriptions"
          label="Prescriptions"
          tag="CELL SALTS · HERBS · CRYSTALS · FORKS"
          color={sysColor}
          expanded={expanded.prescriptions}
          onToggle={() => toggle('prescriptions')}
        >
          <SubSection title="Cell Salts" color={sysColor}>
            <div className="space-y-2">
              {data.prescriptions?.cellSalts?.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/3">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="font-cinzel text-[14px] text-white">{s.saltShortName}</span>
                    <span className="text-[11px] text-white/50">{s.saltFullName} · {s.sign}</span>
                  </div>
                  <div className="text-[11px] italic text-white/55 mb-1">{s.epithet}</div>
                  <p className="text-[12px] text-white/65 leading-relaxed">{s.indicatedFor}</p>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Sacred Botanicals" color={sysColor}>
            <div className="space-y-2">
              {data.prescriptions?.sacredBotanicals?.map((b: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/3">
                  <div className="font-cinzel text-[14px] text-white">{b.name} <span className="text-[11px] text-white/45">({b.planet})</span></div>
                  <p className="text-[12px] text-white/65 leading-relaxed mt-1">{b.mechanism}</p>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Supplementary Herbs" color={sysColor}>
            <div className="space-y-2">
              {data.prescriptions?.supplementaryHerbs?.map((h: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/3">
                  <div className="font-cinzel text-[14px] text-white">{h.name}</div>
                  <div className="text-[11px] text-white/50 italic mb-1">{h.classicalAttribution}</div>
                  <p className="text-[12px] text-white/65 leading-relaxed">{h.mechanism}</p>
                  <p className="text-[11px] text-white/50 mt-1 italic">{h.indicatedFor}</p>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Crystals" color={sysColor}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {data.prescriptions?.crystals?.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/3">
                  <div className="font-cinzel text-[13px] text-white">{c.name}</div>
                  <div className="text-[10px] text-white/45 mb-1">{c.planet}</div>
                  <div className="text-[11px] text-white/60">{c.bodyPlacement}</div>
                  {c.classicalAttribution && <div className="text-[10px] text-white/40 italic mt-1">{c.classicalAttribution}</div>}
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Tuning Forks (Cousto Hz)" color={sysColor}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {data.prescriptions?.tuningForks?.map((f: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-white/10 bg-white/3">
                  <div className="font-cinzel text-[13px] text-white">{f.planet}</div>
                  <div className="text-[12px]" style={{ color: sysColor }}>{f.hz} Hz</div>
                  <div className="text-[11px] text-white/55 mt-1">{f.applicationPoint}</div>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ── 6. MODALITY RECOMMENDATIONS (PRACTITIONER LENS SWITCHER PROTOTYPE) ── */}
        <Section
          id="modalities"
          label="Practitioner Lens Switcher"
          tag="ONE SLICE PER MODALITY"
          color={sysColor}
          expanded={expanded.modalities}
          onToggle={() => toggle('modalities')}
        >
          <div className="text-[11px] text-white/50 italic mb-3 leading-relaxed">
            This is the prototype of the lens switcher. The user/practitioner selects their modality and the data presents the slice relevant to their scope of practice.
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.keys(data.prescriptions?.modalityRecommendations ?? {}).map((mod) => (
              <button
                key={mod}
                onClick={() => setActiveModality(mod)}
                className="px-3 py-1.5 rounded-lg text-[11px] tracking-widest transition"
                style={{
                  background: activeModality === mod ? `${sysColor}22` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeModality === mod ? sysColor + '66' : 'rgba(255,255,255,0.1)'}`,
                  color: activeModality === mod ? sysColor : 'rgba(255,255,255,0.6)',
                }}
              >
                {mod.replace(/_/g, ' ').replace(/phase2 placeholder/i, '(Phase 2)').toUpperCase()}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-white/3 mb-4">
            <p className="text-[13px] text-white/80 leading-relaxed">
              {data.prescriptions?.modalityRecommendations?.[activeModality]}
            </p>
          </div>

          {data.modalitySpecificGrid?.[activeModality] && (
            <div className="p-3 rounded-lg border border-white/10 bg-white/3">
              <div className="text-[10px] tracking-[0.2em] text-white/40 mb-2">LENS DETAIL · {activeModality.replace(/_/g, ' ').toUpperCase()}</div>
              {Object.entries(data.modalitySpecificGrid[activeModality]).map(([k, v]) => (
                <div key={k} className="mb-2">
                  <div className="text-[10px] tracking-widest text-white/40 uppercase mb-0.5">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-[12px] text-white/65 leading-relaxed">
                    {Array.isArray(v) ? (v as string[]).join(' · ') : (v as string)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 7. PATHOLOGIES (Cornell-sourced) ── */}
        <Section
          id="pathologies"
          label="Pathologies (Cornell-Sourced)"
          tag={`${data.pathologies?.length ?? 0} CONDITIONS — SAMPLE`}
          color={sysColor}
          expanded={expanded.pathologies}
          onToggle={() => toggle('pathologies')}
        >
          <div className="space-y-2">
            {data.pathologies?.map((p: any, i: number) => (
              <PathologyCard
                key={p.id}
                pathology={p}
                expanded={expandedPathology === i}
                onToggle={() => setExpandedPathology(expandedPathology === i ? null : i)}
                color={sysColor}
              />
            ))}
          </div>
          <div className="mt-4 text-[11px] text-white/40 italic leading-relaxed">
            Schema sample: 6 representative pathologies shown. Full Cornell extraction will add 30-50 conditions per system once scaled.
          </div>
        </Section>

        {/* ── 8. VEDIC OVERLAY (Phase 2 placeholder) ── */}
        <Section
          id="vedic"
          label="Vedic Overlay"
          tag="PHASE 2 · PLACEHOLDER"
          color="#94A3B8"
          expanded={expanded.vedic}
          onToggle={() => toggle('vedic')}
        >
          <div className="p-4 rounded-lg border border-white/10 bg-white/3">
            <p className="text-[11px] text-white/45 italic mb-3">
              {data.vedicOverlay?._status}
            </p>
            <div className="space-y-2 text-[12px] text-white/60">
              <div><span className="text-white/40 tracking-widest text-[10px]">TRIDOSHA · PRIMARY:</span> {data.vedicOverlay?.tridosha?.primary}</div>
              <div><span className="text-white/40 tracking-widest text-[10px]">SECONDARY:</span> {data.vedicOverlay?.tridosha?.secondary}</div>
              <div><span className="text-white/40 tracking-widest text-[10px]">TERTIARY:</span> {data.vedicOverlay?.tridosha?.tertiary}</div>
              <div><span className="text-white/40 tracking-widest text-[10px]">NAKSHATRAS:</span> {data.vedicOverlay?.nakshatras_governing_heart?.join(' · ')}</div>
              <div><span className="text-white/40 tracking-widest text-[10px]">AYURVEDIC ORGANS:</span> {data.vedicOverlay?.ayurvedicOrgans?.join(' · ')}</div>
              <div className="pt-2"><span className="text-white/40 tracking-widest text-[10px]">DASHA RELEVANCE:</span> <span className="italic">{data.vedicOverlay?.dashaRelevance}</span></div>
            </div>
          </div>
        </Section>

        {/* ── 9. COMPLIANCE / SCOPE-OF-PRACTICE ── */}
        <Section
          id="compliance"
          label="Compliance & Scope of Practice"
          tag="NON-NEGOTIABLE"
          color="#E8453C"
          expanded={expanded.compliance}
          onToggle={() => toggle('compliance')}
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-white/10 bg-white/3">
              <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">SCOPE OF PRACTICE</div>
              <p className="text-[12px] text-white/70 leading-relaxed">{data.complianceNotes?.scopeOfPractice}</p>
            </div>
            <div className="p-3 rounded-lg border border-white/10 bg-white/3">
              <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">INDICATOR LANGUAGE POLICY</div>
              <p className="text-[12px] text-white/70 leading-relaxed">{data.complianceNotes?.indicatorLanguagePolicy}</p>
            </div>
            <div className="p-3 rounded-lg border" style={{ background: 'rgba(232,69,60,0.08)', borderColor: 'rgba(232,69,60,0.3)' }}>
              <div className="text-[10px] tracking-[0.2em] mb-1 text-red-400">⚠ CRITICAL REFERRAL RULES</div>
              <ul className="space-y-1">
                {data.complianceNotes?.criticalReferralRules?.map((r: string, i: number) => (
                  <li key={i} className="text-[12px] text-white/70 flex gap-2"><span className="text-red-400">·</span><span>{r}</span></li>
                ))}
              </ul>
            </div>
            <div className="p-3 rounded-lg border border-white/10 bg-white/3">
              <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">RED FLAG KEYWORDS</div>
              <div className="flex flex-wrap gap-1.5">
                {data.complianceNotes?.redFlagKeywords?.map((k: string) => (
                  <Tag key={k} label={k} accent="rgba(232,69,60,0.5)" small />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── CTAs ── */}
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton label="↩ Back to Astryx" onClick={onBack} accent="rgba(255,255,255,0.1)" outlined />
        </div>

        <div className="mt-6 text-[10px] text-white/30 text-center tracking-widest">
          ⓘ Reference tool · Not medical advice — Practitioner-tier clinical reference
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION — collapsible card wrapper
// ═══════════════════════════════════════════════════════════════
function Section({
  id, label, tag, color, expanded, onToggle, children,
}: {
  id: string; label: string; tag: string; color: string
  expanded: boolean; onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <GlassCard accentColor={color} opacity={expanded ? 0.14 : 0.06} className="mb-3 overflow-hidden animate-fade-in-up">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="flex-1 min-w-0">
          <SectionLabel>{label}</SectionLabel>
          <div className="text-[10px] tracking-[0.25em] text-white/35 mt-0.5">{tag}</div>
        </div>
        <div
          className="text-lg text-white/30 transition-transform"
          style={{ transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </div>
      </button>
      {expanded && <div className="px-4 pb-5 animate-fade-in">{children}</div>}
    </GlassCard>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB SECTION — smaller subdivision within Section
// ═══════════════════════════════════════════════════════════════
function SubSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] tracking-[0.25em] mb-2" style={{ color }}>{title.toUpperCase()}</div>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PATHOLOGY CARD — one Cornell-sourced condition
// ═══════════════════════════════════════════════════════════════
function PathologyCard({
  pathology, expanded, onToggle, color,
}: {
  pathology: any; expanded: boolean; onToggle: () => void; color: string
}) {
  const isRedFlag = (pathology.redFlags?.length ?? 0) > 0

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: expanded ? `${color}08` : 'rgba(255,255,255,0.03)' }}>
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span className="font-cinzel text-[15px] text-white">{pathology.name}</span>
            {pathology.icdReference && (
              <span className="text-[10px] text-white/40 tracking-widest">{pathology.icdReference}</span>
            )}
            {isRedFlag && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-600/40 text-red-200">⚠ REFERRAL RULES</span>
            )}
          </div>
          <div className="text-[11px] text-white/45 tracking-widest">{pathology.category?.toUpperCase()}</div>
        </div>
        <div className="text-lg text-white/30 transition-transform" style={{ transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="h-px bg-white/5 mb-4" />

          {pathology.classicalReference && (
            <div className="mb-3 p-3 rounded-lg" style={{ background: `${color}10`, border: `1px solid ${color}33` }}>
              <div className="text-[10px] tracking-widest mb-1" style={{ color }}>CLASSICAL SOURCE</div>
              <p className="text-[12px] text-white/70 italic leading-relaxed">{pathology.classicalReference}</p>
            </div>
          )}

          {pathology.astrologicalSignature && (
            <div className="mb-3">
              <div className="text-[10px] tracking-widest text-white/40 mb-2">ASTROLOGICAL SIGNATURE</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pathology.astrologicalSignature.planetaryCombinations && (
                  <DataPoint label="Planetary Combinations" value={pathology.astrologicalSignature.planetaryCombinations.join(' · ')} />
                )}
                {pathology.astrologicalSignature.signEmphasis && (
                  <DataPoint label="Sign Emphasis" value={pathology.astrologicalSignature.signEmphasis.join(' · ')} />
                )}
                {pathology.astrologicalSignature.houseEmphasis && (
                  <DataPoint label="House Emphasis" value={pathology.astrologicalSignature.houseEmphasis.join(' · ')} />
                )}
                {pathology.astrologicalSignature.transitTriggers && (
                  <DataPoint label="Transit Triggers" value={pathology.astrologicalSignature.transitTriggers.join(' · ')} />
                )}
              </div>
            </div>
          )}

          {pathology.indicatorLanguage && (
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border border-white/10 bg-white/3">
                <div className="text-[10px] tracking-widest text-white/40 mb-1">INDIVIDUAL TIER LANGUAGE</div>
                <p className="text-[11px] text-white/70 leading-relaxed">{pathology.indicatorLanguage.individual}</p>
              </div>
              <div className="p-3 rounded-lg border border-white/10 bg-white/3">
                <div className="text-[10px] tracking-widest mb-1" style={{ color }}>PRACTITIONER TIER LANGUAGE</div>
                <p className="text-[11px] text-white/70 leading-relaxed">{pathology.indicatorLanguage.practitioner}</p>
              </div>
            </div>
          )}

          {pathology.cellSalts && (
            <div className="mb-3">
              <div className="text-[10px] tracking-widest text-white/40 mb-1">CELL SALT SUPPORT</div>
              <div className="flex flex-wrap gap-1.5">
                {pathology.cellSalts.map((s: string) => (
                  <Tag key={s} label={s} accent={`${color}55`} small />
                ))}
              </div>
            </div>
          )}

          {pathology.modalityNotes && (
            <div className="mb-3">
              <div className="text-[10px] tracking-widest text-white/40 mb-2">MODALITY NOTES</div>
              <div className="space-y-1.5">
                {Object.entries(pathology.modalityNotes).map(([k, v]) => (
                  <div key={k} className="p-2 rounded border border-white/8 bg-white/3">
                    <div className="text-[10px] tracking-widest text-white/45 mb-0.5 uppercase">{k}</div>
                    <div className="text-[11px] text-white/65 leading-relaxed">{v as string}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pathology.redFlags && pathology.redFlags.length > 0 && (
            <div className="p-3 rounded-lg" style={{ background: 'rgba(232,69,60,0.10)', border: '1px solid rgba(232,69,60,0.35)' }}>
              <div className="text-[10px] tracking-widest mb-1 text-red-400">⚠ RED FLAGS — REFER IMMEDIATELY</div>
              <ul className="space-y-0.5">
                {pathology.redFlags.map((r: string, i: number) => (
                  <li key={i} className="text-[11px] text-red-200 flex gap-2"><span>·</span><span>{r}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
