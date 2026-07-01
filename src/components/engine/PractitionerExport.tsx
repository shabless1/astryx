'use client'

import { useState } from 'react'
import type { ProtocolOutput } from '@/types'
import type { IntakeData } from '@/types'
import { hexToRgba } from '@/lib/utils'

interface PractitionerExportProps {
  protocol: ProtocolOutput
  intake: IntakeData
  accentColor: string
  chartData?: any
}

export default function PractitionerExport({
  protocol,
  intake,
  accentColor,
  chartData,
}: PractitionerExportProps) {
  const [exporting, setExporting] = useState(false)
  const [done, setDone]           = useState(false)

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    setDone(false)

    try {
      const { exportPractitionerPDF } = await import('@/lib/pdfExport')
      await exportPractitionerPDF({
        intake,
        protocol,
        accentColor,
        chartData,
        practitionerName: 'Astryx System',
        sessionDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
      })
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (err) {
      console.error('[PDF Export]', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 font-rajdhani text-[12px] tracking-[0.15em] uppercase transition-all duration-200"
      style={{
        padding: '10px 18px',
        borderRadius: 10,
        border: `1px solid ${done ? '#4CAF89' : 'rgba(255,255,255,0.15)'}`,
        background: done
          ? 'rgba(76,175,137,0.12)'
          : exporting
          ? 'rgba(255,255,255,0.04)'
          : hexToRgba(accentColor, 0.08),
        color: done ? '#4CAF89' : exporting ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
        cursor: exporting ? 'wait' : 'pointer',
        opacity: exporting ? 0.7 : 1,
      }}
    >
      {done ? (
        <>✓ Downloaded</>
      ) : exporting ? (
        <>Generating PDF...</>
      ) : (
        <>⬇ Export PDF Report</>
      )}
    </button>
  )
}
