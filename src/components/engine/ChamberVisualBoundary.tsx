'use client'

/**
 * ASTRYX — Chamber Visual Error Boundary  (Patch 0.1)
 * ════════════════════════════════════════════════════════════════════════════
 * A full Resonance Chamber session must play start → finish through EVERY fork
 * phase with no crash. The visual layer (color field / mandala / body map) is the
 * heaviest part of the render; if any single phase's visual throws — a malformed
 * record, a renderer fault — it must NOT white-screen the whole Chamber.
 *
 * This boundary catches a render throw in the visual layer, LOGS the bad record
 * (the active planet + phase), and falls back to a calm accent field so the
 * session keeps running. KEY IT by the active planet so the next phase remounts
 * and recovers automatically (a fault on Neptune's phase doesn't poison Saturn's).
 *
 * The audio, timeline, breath, and controls live OUTSIDE this boundary, so they
 * keep running underneath the fallback — the user can always complete the session.
 */

import React from 'react'

interface Props {
  /** The active fork planet — used only for logging context. */
  planet: string
  /** Calm fallback field colour. */
  accentColor: string
  children: React.ReactNode
}

interface State {
  failed: boolean
}

export default class ChamberVisualBoundary extends React.Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Log the bad record so a recurring fault can be traced to a specific phase.
    console.error(
      `[Chamber] visual render fault on the "${this.props.planet}" phase — ` +
        `falling back to a calm field for this phase; the session continues.`,
      error,
      info,
    )
  }

  render() {
    if (this.state.failed) {
      // Graceful fallback: a calm, slow-breathing accent field. The session's
      // audio + phases keep advancing beneath it; switching phase remounts.
      return (
        <div
          className="absolute inset-0 chamber-breathe"
          style={{
            background: `radial-gradient(circle at 50% 48%, ${this.props.accentColor}33 0%, #020208 72%)`,
          }}
          aria-hidden
        />
      )
    }
    return this.props.children
  }
}
