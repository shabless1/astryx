'use client'

/**
 * Astryx NavBar v3.2 — Ethereal Glass Light-Up Tabs
 *
 * Visible horizontal tab strip (desktop) + hamburger drawer (mobile).
 * Each tab:
 *   • glyph icon + label
 *   • accent-color light-up on hover (lift + glow underline)
 *   • active state: filled accent background + glow + animated indicator
 *   • cubic-bezier(0.32, 0.72, 0, 1) for premium feel
 *
 * Header structure:
 *   Row 1 — Logo (left) + Premium/Mode/Avatar/Burger (right)
 *   Row 2 — Glowing tab strip (desktop only ≥md)
 *
 * Mobile: hides tab row, shows hamburger that opens a slide-down panel
 * with the same tabs but stacked vertically.
 */

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import type { AppScreen, AppMode } from '@/types'
import { hexToRgba } from '@/lib/utils'

interface NavBarProps {
  onNav: (screen: AppScreen) => void
  current: AppScreen
  accentColor: string
  mode: AppMode
  user?: { name?: string | null; email?: string | null; image?: string | null; isPremium?: boolean } | null
  hasProtocol?: boolean
  onAuthClick?: () => void
  onUpgradeClick?: () => void
  onAskAstryx?: () => void
  // Patch 0.2 / 0.3 — global Back + a logo that lands on the true Home.
  onBack?: () => void
  canGoBack?: boolean
  onLogoClick?: () => void
}

// ─── TAB DEFINITIONS ────────────────────────────────────────────
// Each tab gets a glyph that aligns with the cosmic aesthetic.
// Glyphs chosen to feel like planetary / sacred-geometric markers.
//
// Directive v2 Part E — the medical-astrology spine made navigable:
//   • Chart + Body Grid are the USER's own map — surfaced directly (need a reading).
//   • Body Systems (granular system breakdown) + Clients → PRACTITIONER tier only.
type NavItem = {
  key: AppScreen; label: string; short: string; glyph: string
  premiumOnly?: boolean   // Practitioner tier (session.isPremium) only
  needsProtocol?: boolean // only meaningful once a reading exists
}

// Phase 1 consolidation — the 8-item nav collapses to a lean 4. Results, Chart,
// Body Grid, and History now live as panels inside the Dashboard; Clients/Body
// Systems are reached through the Practitioner flow. Dashboard is home for a
// returning user (page.tsx coerces a no-protocol Dashboard tap to Intake).
const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', short: 'Dashboard', glyph: '⊞' },
  { key: 'session',   label: 'Chamber',   short: 'Chamber',   glyph: '◉', needsProtocol: true },
  { key: 'library',   label: 'Music',     short: 'Music',     glyph: '♫' },
  { key: 'settings',  label: 'Settings',  short: 'Settings',  glyph: '⚙' },
]

export default function NavBar({
  onNav, current, accentColor, user, hasProtocol = false, onAuthClick, onUpgradeClick,
  onAskAstryx, onBack, canGoBack = false, onLogoClick,
}: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  // Account dropdown (sign out) anchored to the avatar.
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!userMenuOpen) return
    const onDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setUserMenuOpen(false) }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey) }
  }, [userMenuOpen])

  // Part E tier/IA gating: Practitioner-only items require session.isPremium;
  // reading-dependent items appear once a calibration exists.
  const isPremium = !!user?.isPremium
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.premiumOnly && !isPremium) return false
    if (item.needsProtocol && !hasProtocol) return false
    return true
  })

  // Close mobile drawer on outside click / Esc
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    const onClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,7,20,0.65)',
      }}
    >
      {/* ──────────────────────────────────────────────────────
          ROW 1 — Logo · Right-side controls
          ────────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-between px-5 sm:px-8 py-3">
        {/* Left cluster — global Back (Patch 0.2) + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex items-center justify-center rounded-full kowalski-button shrink-0"
            style={{
              width: 38, height: 38,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)',
              transition: 'all 300ms cubic-bezier(0.32,0.72,0,1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.5) }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            <span className="text-[15px] leading-none">←</span>
          </button>
        )}
        {/* Logo / Wordmark — routes to the true Home (Patch 0.3) */}
        <button
          onClick={() => (onLogoClick ? onLogoClick() : onNav('intake'))}
          className="group flex items-center gap-3 kowalski-button"
          style={{ transition: 'all 300ms cubic-bezier(0.32,0.72,0,1)' }}
        >
          <img src="/images/astryx%20logo%20b.png" alt="Astryx" className="h-10 w-auto rounded-lg" />
          <div className="hidden sm:block">
            <div
              className="font-cinzel font-semibold tracking-[0.2em]"
              style={{ fontSize: 14, color: 'rgba(255,255,255,0.95)' }}
            >
              ASTRYX
            </div>
            <div
              className="text-[9px] tracking-[0.3em] uppercase font-rajdhani"
              style={{ color: hexToRgba(accentColor, 0.7) }}
            >
              Cosmic Resonance System
            </div>
          </div>
        </button>
        </div>

        {/* CENTER — Ask Astryx, a permanent fixture of the top navigation (SHA
            2026-06-28). Centered in the empty band between the logo and the
            account controls; the nav tabs sit on the row below it. */}
        {onAskAstryx && (
          <button
            onClick={onAskAstryx}
            aria-label="Ask Astryx"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full kowalski-button shrink-0 z-10"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.92)} 0%, ${hexToRgba(accentColor, 0.55)} 100%)`,
              color: '#020208',
              boxShadow: `0 0 20px -6px ${hexToRgba(accentColor, 0.65)}`,
              transition: 'all 300ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            <span className="text-[13px] leading-none">✦</span>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold hidden sm:inline">Ask Astryx</span>
          </button>
        )}

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Premium badge OR Upgrade pill */}
          {user?.isPremium ? (
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium"
              style={{
                background: hexToRgba(accentColor, 0.10),
                border: `1px solid ${hexToRgba(accentColor, 0.4)}`,
                color: accentColor,
                boxShadow: `0 0 16px -4px ${hexToRgba(accentColor, 0.5)}`,
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-cosmic-pulse"
                style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
              />
              Premium
            </div>
          ) : (
            <button
              onClick={onUpgradeClick}
              className="group hidden sm:inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full kowalski-button"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                transition: 'all 400ms cubic-bezier(0.32,0.72,0,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = hexToRgba(accentColor, 0.5)
                e.currentTarget.style.background = hexToRgba(accentColor, 0.06)
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
            >
              <span className="text-[10px] uppercase tracking-[0.25em] text-content-sm">
                Upgrade
              </span>
              <span
                className="btn-magnetic-icon w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                style={{
                  background: hexToRgba(accentColor, 0.2),
                  color: accentColor,
                }}
              >
                ✦
              </span>
            </button>
          )}

          {/* User avatar (with account dropdown) / Sign In */}
          {user ? (
            <div className="relative flex-shrink-0" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Account menu"
                className="flex items-center justify-center rounded-full text-[12px] font-semibold transition-all duration-300"
                style={{
                  width: 34, height: 34,
                  background: hexToRgba(accentColor, 0.22),
                  border: `1px solid ${hexToRgba(accentColor, userMenuOpen ? 0.8 : 0.5)}`,
                  color: 'rgba(255,255,255,0.95)',
                  boxShadow: `0 0 18px -6px ${hexToRgba(accentColor, 0.55)}`,
                  cursor: 'pointer',
                }}
                title={user.name ?? user.email ?? 'Account'}
              >
                {user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? '?'}
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden min-w-[200px]"
                  style={{
                    background: 'rgba(5,7,20,0.96)',
                    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 18px 50px -16px rgba(0,0,0,0.7)',
                  }}
                >
                  <div className="px-4 py-3 border-b border-white/8">
                    <div className="text-[9px] uppercase tracking-[0.25em] text-white/40 mb-0.5">Signed in</div>
                    <div className="text-[12.5px] text-white/90 truncate">{user.email ?? user.name ?? 'Your account'}</div>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                    className="w-full text-left px-4 py-3 text-[13px] text-white/85 hover:bg-white/5 transition-colors flex items-center gap-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <span aria-hidden>⏻</span> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.22em] kowalski-button"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)',
                transition: 'all 300ms cubic-bezier(0.32,0.72,0,1)',
              }}
            >
              Sign in
            </button>
          )}

          {/* Mobile hamburger (only ≤ md) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            className="md:hidden relative flex items-center justify-center rounded-full kowalski-button"
            style={{
              width: 44, height: 44,   // v2 FIX 8 — ≥44px mobile tap target
              background: menuOpen ? hexToRgba(accentColor, 0.2) : 'rgba(255,255,255,0.04)',
              border: `1px solid ${menuOpen ? hexToRgba(accentColor, 0.5) : 'rgba(255,255,255,0.12)'}`,
              transition: 'all 400ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {/* Animated hamburger → X morph */}
            <span className="relative w-4 h-4 flex flex-col justify-center items-center">
              <span
                className="absolute h-px w-4 rounded-full transition-all"
                style={{
                  background: menuOpen ? accentColor : 'rgba(255,255,255,0.85)',
                  transform: menuOpen ? 'rotate(45deg)' : 'translateY(-4px)',
                  transitionDuration: '350ms',
                  transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)',
                }}
              />
              <span
                className="absolute h-px w-4 rounded-full transition-all"
                style={{
                  background: menuOpen ? accentColor : 'rgba(255,255,255,0.85)',
                  opacity: menuOpen ? 0 : 1,
                  transitionDuration: '250ms',
                }}
              />
              <span
                className="absolute h-px w-4 rounded-full transition-all"
                style={{
                  background: menuOpen ? accentColor : 'rgba(255,255,255,0.85)',
                  transform: menuOpen ? 'rotate(-45deg)' : 'translateY(4px)',
                  transitionDuration: '350ms',
                  transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)',
                }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          ROW 2 — Glowing horizontal tab strip (desktop ≥ md)
          ────────────────────────────────────────────────────── */}
      <div
        className="hidden md:flex items-center justify-center gap-1 px-6 pb-2 pt-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        {visibleItems.map((item) => (
          <NavTab
            key={item.key}
            item={item}
            active={current === item.key}
            accent={accentColor}
            onClick={() => onNav(item.key)}
          />
        ))}
      </div>

      {/* ──────────────────────────────────────────────────────
          MOBILE DRAWER — full-width Ethereal Glass panel
          ────────────────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        className="md:hidden overflow-hidden"
        style={{
          maxHeight: menuOpen ? 600 : 0,
          opacity: menuOpen ? 1 : 0,
          transition:
            'max-height 500ms cubic-bezier(0.32,0.72,0,1), opacity 400ms ease',
          background: 'rgba(2,2,8,0.92)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderTop: menuOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <nav className="px-4 py-3 grid grid-cols-1 gap-1">
          {visibleItems.map((item, i) => {
            const isActive = current === item.key
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNav(item.key)
                  setMenuOpen(false)
                }}
                className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl kowalski-button"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${hexToRgba(accentColor, 0.18)} 0%, ${hexToRgba(accentColor, 0.06)} 100%)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? hexToRgba(accentColor, 0.45) : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isActive
                    ? `0 12px 28px -14px ${hexToRgba(accentColor, 0.55)}`
                    : 'none',
                  transform: menuOpen
                    ? 'translateY(0)'
                    : 'translateY(-8px)',
                  opacity: menuOpen ? 1 : 0,
                  transition: `all 500ms cubic-bezier(0.32,0.72,0,1) ${i * 40}ms`,
                }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center rounded-full"
                    style={{
                      width: 32, height: 32,
                      background: isActive
                        ? hexToRgba(accentColor, 0.28)
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? hexToRgba(accentColor, 0.5) : 'rgba(255,255,255,0.10)'}`,
                      color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                      fontFamily: 'Cinzel, serif',
                      fontSize: 14,
                    }}
                  >
                    {item.glyph}
                  </span>
                  <span
                    className="font-cinzel font-semibold tracking-[0.15em] uppercase text-[13px]"
                    style={{
                      color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    {item.label}
                  </span>
                </span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-cosmic-pulse"
                    style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════
// NAV TAB — desktop glowing tab with accent light-up
// ═══════════════════════════════════════════════════════════════

function NavTab({
  item, active, accent, onClick,
}: {
  item: { key: AppScreen; label: string; short: string; glyph: string }
  active: boolean
  accent: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-2 px-3.5 lg:px-4 py-1.5 rounded-full kowalski-button"
      style={{
        background: active
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.22)} 0%, ${hexToRgba(accent, 0.06)} 100%)`
          : 'transparent',
        border: `1px solid ${active ? hexToRgba(accent, 0.4) : 'transparent'}`,
        boxShadow: active
          ? `0 0 24px -6px ${hexToRgba(accent, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.06)`
          : 'none',
        transition: 'all 350ms cubic-bezier(0.32,0.72,0,1)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = hexToRgba(accent, 0.06)
          e.currentTarget.style.borderColor = hexToRgba(accent, 0.25)
          e.currentTarget.style.boxShadow = `0 6px 18px -8px ${hexToRgba(accent, 0.4)}`
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* Glyph */}
      <span
        className="font-cinzel"
        style={{
          fontSize: 13,
          lineHeight: 1,
          color: active ? accent : 'rgba(255,255,255,0.55)',
          textShadow: active ? `0 0 10px ${hexToRgba(accent, 0.65)}` : 'none',
          transition: 'all 350ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {item.glyph}
      </span>
      {/* Label */}
      <span
        className="tracking-[0.18em] uppercase font-medium hidden lg:inline"
        style={{
          fontSize: 11,
          color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
          transition: 'color 350ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {item.short}
      </span>
      {/* Active glow dot */}
      {active && (
        <span
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full animate-cosmic-pulse"
          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
        />
      )}
    </button>
  )
}
