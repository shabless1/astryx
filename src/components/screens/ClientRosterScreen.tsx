'use client'

/**
 * ASTRYX — Client Roster Screen
 *
 * Build Directive Fix 2 · Practitioner mode only.
 *
 * Practitioners manage multiple clients here. Each client carries their own
 * birth data + practitioner-attested informed consent. The "Run Session"
 * button on a client card loads THAT client's birth data into the engine
 * (not the practitioner's) and routes to the analysis flow.
 *
 * DECISION: Single-screen layout with three view states managed by local
 * useState — "list" (default roster), "add" (the new client form), and
 * "history" (per-client session log). Modal-style swap rather than slide-in
 * panels keeps the component simple and mobile-friendly without animation
 * libraries. The Add Client form gates Save behind the COMPLIANCE.md §10
 * informed-consent attestation — non-negotiable per the directive.
 */

import { useState } from 'react'
import type { ClientRecord, ClientSession } from '@/types'
import { useAppStore } from '@/lib/store'
import {
  GlassCard, PrimaryButton, FormField, SectionLabel, Tag,
} from '@/components/ui'
import BirthLocationField from '@/components/ui/BirthLocationField'
import { hexToRgba } from '@/lib/utils'
import { MICRO_DISCLAIMER } from '@/lib/compliance'

// The 8 practitioner lens types — clients are tagged with which modality of
// care this practitioner uses for them. Source of truth: PractitionerLens in
// types/index.ts. Display labels chosen for client-facing clarity.
const MODALITY_OPTIONS = [
  { value: 'medical_astrologer',    label: 'Medical Astrologer' },
  { value: 'reiki',                 label: 'Reiki Practitioner' },
  { value: 'bodyworker',            label: 'Bodyworker (Massage / NMT)' },
  { value: 'naturopath_herbalist',  label: 'Naturopath / Herbalist' },
  { value: 'ayurvedic',             label: 'Ayurvedic Practitioner' },
  { value: 'acupuncturist_tcm',     label: 'Acupuncturist / TCM' },
  { value: 'pastoral_spiritual',    label: 'Pastoral / Spiritual Counselor' },
  { value: 'general_wellness',      label: 'General Wellness' },
] as const

type ViewMode = 'list' | 'add' | 'history'

interface ClientRosterScreenProps {
  accentColor: string
  onBack: () => void
  onRunSession: (client: ClientRecord) => void
}

export default function ClientRosterScreen({
  accentColor, onBack, onRunSession,
}: ClientRosterScreenProps) {
  const clients              = useAppStore((s) => s.clients)
  const addClient            = useAppStore((s) => s.addClient)
  const deleteClient         = useAppStore((s) => s.deleteClient)
  const getSessionsForClient = useAppStore((s) => s.getSessionsForClient)
  const deleteClientSession  = useAppStore((s) => s.deleteClientSession)

  const [view, setView]                 = useState<ViewMode>('list')
  const [viewingClientId, setViewingClientId] = useState<string | null>(null)
  const viewingClient = viewingClientId ? clients.find((c) => c.id === viewingClientId) ?? null : null

  return (
    <div className="min-h-screen font-rajdhani">
      <div className="max-w-3xl mx-auto px-5" style={{ paddingTop: 90, paddingBottom: 80 }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <SectionLabel>Practitioner</SectionLabel>
            <h1 className="font-cinzel text-2xl text-white">Client Roster</h1>
            <p className="text-[12px] text-white/45 mt-0.5">
              {clients.length} {clients.length === 1 ? 'client' : 'clients'} on file
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {view !== 'list' && (
              <PrimaryButton
                label="← Roster"
                onClick={() => { setView('list'); setViewingClientId(null) }}
                accent="rgba(255,255,255,0.1)" outlined
              />
            )}
            {view === 'list' && (
              <>
                <PrimaryButton label="+ Add Client" onClick={() => setView('add')} accent={accentColor} glow />
                <PrimaryButton label="← Back" onClick={onBack} accent="rgba(255,255,255,0.1)" outlined />
              </>
            )}
          </div>
        </div>

        {/* ── View: LIST (default roster) ── */}
        {view === 'list' && (
          <>
            {clients.length === 0 ? (
              <GlassCard accentColor={accentColor} opacity={0.06} className="p-10 text-center animate-fade-in-up">
                <div className="text-5xl mb-3 opacity-40">⊕</div>
                <h3 className="font-cinzel text-lg text-white mb-2">Add your first client to begin.</h3>
                <p className="text-[13px] text-white/55 mb-6 max-w-md mx-auto">
                  Each client carries their own birth data and session history. Astryx runs
                  the engine on their chart — not yours — so every session reflects them.
                </p>
                <PrimaryButton label="+ Add Client" onClick={() => setView('add')} accent={accentColor} glow />
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {clients.map((c) => (
                  <ClientCard
                    key={c.id}
                    client={c}
                    accentColor={accentColor}
                    sessionCount={getSessionsForClient(c.id).length}
                    onRunSession={() => onRunSession(c)}
                    onViewHistory={() => { setViewingClientId(c.id); setView('history') }}
                    onDelete={() => {
                      if (confirm(`Delete ${c.name} and all their session history? This cannot be undone.`)) {
                        deleteClient(c.id)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── View: ADD CLIENT FORM ── */}
        {view === 'add' && (
          <AddClientForm
            accentColor={accentColor}
            onSave={(client) => { addClient(client); setView('list') }}
            onCancel={() => setView('list')}
          />
        )}

        {/* ── View: CLIENT HISTORY ── */}
        {view === 'history' && viewingClient && (
          <ClientHistoryPanel
            client={viewingClient}
            sessions={getSessionsForClient(viewingClient.id)}
            accentColor={accentColor}
            onRunNewSession={() => onRunSession(viewingClient)}
            onDeleteSession={(id) => {
              if (confirm('Delete this session record? This cannot be undone.')) {
                deleteClientSession(id)
              }
            }}
          />
        )}

        {/* ── Persistent micro-disclaimer (every screen, per directive global rule #5) ── */}
        <div className="text-[10px] text-white/30 text-center mt-10 tracking-widest">
          {MICRO_DISCLAIMER}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CLIENT CARD — one row in the roster
// ═══════════════════════════════════════════════════════════════
function ClientCard({
  client, accentColor, sessionCount, onRunSession, onViewHistory, onDelete,
}: {
  client: ClientRecord
  accentColor: string
  sessionCount: number
  onRunSession: () => void
  onViewHistory: () => void
  onDelete: () => void
}) {
  const modalityLabel = MODALITY_OPTIONS.find((m) => m.value === client.modality)?.label ?? client.modality
  const lastSession = client.lastSessionAt
    ? `Last session: ${new Date(client.lastSessionAt).toLocaleDateString()}`
    : 'No sessions yet'

  return (
    <GlassCard accentColor={accentColor} opacity={0.08} className="p-5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-cinzel text-[18px] text-white mb-1">{client.name}</h3>
          <div className="text-[12px] text-white/55 mb-2">
            Born {client.birthDate}{client.birthTime !== 'unknown' && ` · ${client.birthTime}`}
            {client.birthLocation && ` · ${client.birthLocation}`}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Tag label={modalityLabel} accent={accentColor} small />
            <Tag label={`${sessionCount} session${sessionCount === 1 ? '' : 's'}`} accent="rgba(255,255,255,0.15)" small />
          </div>
          <p className="text-[11px] text-white/40 italic">{lastSession}</p>
          {client.notes && (
            <p className="text-[12px] text-white/55 mt-2 leading-relaxed">{client.notes}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <PrimaryButton label="⬡ Run Session" onClick={onRunSession} accent={accentColor} glow />
          <PrimaryButton label="View History" onClick={onViewHistory} accent="rgba(255,255,255,0.1)" outlined />
          <button onClick={onDelete} className="text-[10px] tracking-widest text-white/30 hover:text-red-400 transition mt-1">
            DELETE
          </button>
        </div>
      </div>
    </GlassCard>
  )
}

// ═══════════════════════════════════════════════════════════════
// ADD CLIENT FORM
// ═══════════════════════════════════════════════════════════════
function AddClientForm({
  accentColor, onSave, onCancel,
}: {
  accentColor: string
  onSave: (client: ClientRecord) => void
  onCancel: () => void
}) {
  const [name,         setName]         = useState('')
  const [birthDate,    setBirthDate]    = useState('')
  const [birthTime,    setBirthTime]    = useState('')
  const [timeUnknown,  setTimeUnknown]  = useState(false)
  const [birthLocation, setBirthLocation] = useState('')
  const [birthCoords,  setBirthCoords]  = useState<{ lat: number; lon: number; tzOffset?: number } | null>(null)
  const [modality,     setModality]     = useState<string>('general_wellness')
  const [notes,        setNotes]        = useState('')
  const [consent,      setConsent]      = useState(false)

  // Derived validation — Save is disabled until all required fields filled
  // AND consent is checked. Per directive: consent is non-negotiable.
  const requiredFilled = !!(name.trim() && birthDate && birthLocation.trim() && modality)
  const canSave        = requiredFilled && consent

  const handleSave = () => {
    if (!canSave) return
    const client: ClientRecord = {
      id:               crypto.randomUUID(),
      name:             name.trim(),
      birthDate,
      birthTime:        timeUnknown ? 'unknown' : (birthTime || '12:00'),
      birthLocation:    birthLocation.trim(),
      birthCoords:      birthCoords ?? undefined,
      modality,
      notes:            notes.trim(),
      consentConfirmed: true,
      createdAt:        new Date().toISOString(),
    }
    onSave(client)
  }

  return (
    <GlassCard accentColor={accentColor} opacity={0.10} topBorder className="p-7 animate-fade-in-up">
      <SectionLabel>New Client</SectionLabel>
      <h2 className="font-cinzel text-xl text-white mb-1 mt-1">Add Client to Roster</h2>
      <p className="text-[12px] text-white/50 mb-6">
        Their birth data will be saved encrypted in your local roster. Informed consent attestation required (below).
      </p>

      <div className="space-y-4">
        <FormField
          label="Full Name *"
          value={name}
          onChange={setName}
          placeholder="Client's full name"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Date of Birth *"
            type="date"
            value={birthDate}
            onChange={setBirthDate}
          />
          <div>
            <FormField
              label={timeUnknown ? 'Time of Birth (unknown)' : 'Time of Birth'}
              type="time"
              value={timeUnknown ? '' : birthTime}
              onChange={setBirthTime}
              disabled={timeUnknown}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer text-[11px] text-white/60">
              <input
                type="checkbox"
                checked={timeUnknown}
                onChange={(e) => setTimeUnknown(e.target.checked)}
                className="cursor-pointer"
              />
              I don&apos;t know the birth time (use Solar Chart mode)
            </label>
          </div>
        </div>

        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/40 mb-2 uppercase">
            City / Country of Birth *
          </div>
          <BirthLocationField
            value={birthLocation}
            onChange={setBirthLocation}
            onCoordsChange={(coords) => setBirthCoords(coords)}
            accentColor={accentColor}
          />
        </div>

        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/40 mb-2 uppercase">
            Modality of Care *
          </div>
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-[13px] focus:outline-none focus:border-white/30"
            style={{ background: 'rgba(15,15,26,0.65)' }}
          >
            {MODALITY_OPTIONS.map((m) => (
              <option key={m.value} value={m.value} style={{ background: '#0F0F1A' }}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/40 mb-2 uppercase">
            Notes (optional)
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-[13px] focus:outline-none focus:border-white/30 resize-none"
            placeholder="Intake notes, goals, observations…"
            style={{ background: 'rgba(15,15,26,0.65)' }}
          />
        </div>

        {/* ─── Informed Consent Attestation ───────────────────────
            Per COMPLIANCE.md §10 + Build Directive Fix 2 — the practitioner
            attests under their own professional responsibility that the
            client has provided informed consent. Save is gated on this. */}
        <div
          className="p-4 rounded-lg border"
          style={{
            background: consent ? hexToRgba(accentColor, 0.06) : 'rgba(232, 69, 60, 0.04)',
            borderColor: consent ? hexToRgba(accentColor, 0.35) : 'rgba(232, 69, 60, 0.25)',
          }}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 cursor-pointer"
            />
            <span className="text-[12px] text-white/80 leading-relaxed">
              I confirm this client has provided informed consent for their birth data to be entered and used in Astryx.
              I understand Astryx is a reference instrument, not a diagnostic or treatment tool.
            </span>
          </label>
          {!consent && (
            <p className="text-[10px] text-red-300/80 italic mt-2 ml-7">
              Required — practitioner attestation per COMPLIANCE framework
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6 flex-wrap">
          <PrimaryButton
            label={canSave ? 'Save Client' : (consent ? 'Fill required fields' : 'Consent required')}
            onClick={handleSave}
            accent={accentColor}
            disabled={!canSave}
            glow={canSave}
          />
          <PrimaryButton label="Cancel" onClick={onCancel} accent="rgba(255,255,255,0.1)" outlined />
        </div>
      </div>
    </GlassCard>
  )
}

// ═══════════════════════════════════════════════════════════════
// CLIENT HISTORY PANEL
// ═══════════════════════════════════════════════════════════════
function ClientHistoryPanel({
  client, sessions, accentColor, onRunNewSession, onDeleteSession,
}: {
  client: ClientRecord
  sessions: ClientSession[]
  accentColor: string
  onRunNewSession: () => void
  onDeleteSession: (id: string) => void
}) {
  const modalityLabel = MODALITY_OPTIONS.find((m) => m.value === client.modality)?.label ?? client.modality

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Client header */}
      <GlassCard accentColor={accentColor} opacity={0.08} className="p-5">
        <h2 className="font-cinzel text-xl text-white mb-1">{client.name}</h2>
        <p className="text-[12px] text-white/55 mb-3">
          {modalityLabel} · Born {client.birthDate}{client.birthTime !== 'unknown' && ` · ${client.birthTime}`}
        </p>
        <PrimaryButton label="⬡ Run New Session" onClick={onRunNewSession} accent={accentColor} glow />
      </GlassCard>

      {/* Session list */}
      <div>
        <SectionLabel>Session History</SectionLabel>
        {sessions.length === 0 ? (
          <GlassCard className="p-6 text-center mt-2">
            <p className="text-[13px] text-white/55">No sessions logged yet for this client.</p>
            <p className="text-[11px] text-white/35 italic mt-2">
              Complete a session and the Post-Session SOAP entry to log it here.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-2 mt-2">
            {sessions.map((s) => (
              <GlassCard key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-cinzel text-[14px] text-white mb-1">
                      {new Date(s.date).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </div>
                    <div className="text-[10px] tracking-widest text-white/35 mb-2">
                      {new Date(s.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {s.forksUsed.length > 0 && (
                      <div className="mb-1.5">
                        <span className="text-[10px] tracking-widest text-white/40 mr-2">FORKS</span>
                        <span className="text-[12px] text-white/70">{s.forksUsed.join(' · ')}</span>
                      </div>
                    )}
                    {s.crystalsUsed.length > 0 && (
                      <div className="mb-1.5">
                        <span className="text-[10px] tracking-widest text-white/40 mr-2">CRYSTALS</span>
                        <span className="text-[12px] text-white/70">{s.crystalsUsed.join(' · ')}</span>
                      </div>
                    )}
                    {typeof s.vagalToneRating === 'number' && (
                      <div className="mb-1.5">
                        <span className="text-[10px] tracking-widest text-white/40 mr-2">VAGAL TONE</span>
                        <span className="text-[12px]" style={{ color: accentColor }}>
                          {'★'.repeat(s.vagalToneRating)}{'☆'.repeat(5 - s.vagalToneRating)} ({s.vagalToneRating}/5)
                        </span>
                      </div>
                    )}
                    {s.notes && (
                      <p className="text-[12px] text-white/65 leading-relaxed mt-2 italic">{s.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteSession(s.id)}
                    className="text-[10px] tracking-widest text-white/30 hover:text-red-400 transition shrink-0"
                  >
                    DELETE
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
