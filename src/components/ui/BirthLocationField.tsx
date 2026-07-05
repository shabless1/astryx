'use client'

import { useState, useEffect, useRef } from 'react'
import { geocodeLocation, type GeoResult } from '@/lib/engineClient'
import { hexToRgba } from '@/lib/utils'

interface BirthLocationFieldProps {
  value: string
  onChange: (location: string) => void
  onCoordsChange: (coords: { lat: number; lon: number; tzOffset?: number } | null) => void
  accentColor: string
}

export default function BirthLocationField({
  value,
  onChange,
  onCoordsChange,
  accentColor,
}: BirthLocationFieldProps) {
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced geocode search
  useEffect(() => {
    // v4 FIX 3 — fire on partial input (≥2 chars), debounced ~300ms, so a bare
    // city name ("Chicago") returns ranked suggestions without the full
    // "City, State, Country" format.
    if (selected || value.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await geocodeLocation(value)
      setResults(res)
      setShowDropdown(res.length > 0)
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, selected])

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [tzLabel, setTzLabel] = useState<string | null>(null)

  const handleSelect = (result: GeoResult) => {
    onChange(result.name)
    const tz = (result as any).timezone
    const tzOffset = tz?.offsetHours ?? 0
    setTzLabel(tz?.label ?? null)
    onCoordsChange({ lat: result.lat, lon: result.lon, tzOffset })
    setSelected(true)
    setShowDropdown(false)
    setResults([])
  }

  const handleInputChange = (v: string) => {
    onChange(v)
    setSelected(false)
    onCoordsChange(null) // clear coords when typing
  }

  return (
    <div ref={containerRef} className="relative">
      {/* N.4 — the label is provided by the wrapping field (IntakeField /
          ClientRoster); the internal duplicate is removed. */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="City, State, Country (e.g. New York, NY, USA)"
          className="w-full px-4 py-3 text-white text-sm font-rajdhani rounded-[10px] transition-colors duration-200"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${focused ? hexToRgba(accentColor, 0.6) : 'rgba(255,255,255,0.1)'}`,
            outline: 'none',
            paddingRight: loading ? '40px' : '16px',
          }}
          autoComplete="off"
        />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="rounded-full border-t-transparent"
              style={{
                width: 14,
                height: 14,
                border: `1.5px solid ${hexToRgba(accentColor, 0.6)}`,
                borderTopColor: 'transparent',
                animation: 'rotate 0.8s linear infinite',
              }}
            />
          </div>
        )}

        {/* Confirmed checkmark */}
        {selected && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: accentColor }}
          >
            ✓
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && results.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 py-1 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(8,12,28,0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={() => handleSelect(r)} // mouseDown fires before blur
              className="w-full text-left px-4 py-2.5 font-rajdhani transition-colors duration-150 hover:bg-white/5"
            >
              <div className="text-[13px] text-white/85">{r.name}</div>
              <div className="text-[11px] text-white/35 mt-0.5 truncate">{r.country}</div>
            </button>
          ))}
        </div>
      )}

      {/* Quick-confirm first result.
          Renders below the input (out of the dropdown) so the user always sees
          a clear "this is the one I want" action even after the dropdown has
          closed. Fixes the silent-fallback bug where users typed a location
          and pressed Continue without clicking a dropdown row. See FIXES.md → 1B. */}
      {!selected && results.length > 0 && !loading && (
        <button
          type="button"
          onMouseDown={() => handleSelect(results[0])}
          className="mt-1.5 w-full text-left px-4 py-2 font-rajdhani text-[11px] tracking-[0.15em] uppercase transition-all duration-150"
          style={{
            background: hexToRgba(accentColor, 0.12),
            color: accentColor,
            border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          ◎ Use: {results[0].name}
        </button>
      )}

      {/* Coords confirmed indicator */}
      {selected && (
        <div className="mt-1.5 font-rajdhani" style={{ color: hexToRgba(accentColor, 0.7) }}>
          <div className="text-[10px] tracking-[0.15em]">◎ Location confirmed — precise chart enabled</div>
          {tzLabel && (
            <div className="text-[10px] tracking-[0.1em] text-white/35 mt-0.5">
              Timezone detected: {tzLabel}
            </div>
          )}
        </div>
      )}

      {/* Helpful empty state — never reads as "broken" (v4 FIX 3) */}
      {!selected && value.trim().length >= 2 && !loading && results.length === 0 && (
        <div className="mt-1.5 text-[10px] tracking-[0.1em] text-white/30 font-rajdhani">
          Keep typing, or add a state/country to narrow it.
        </div>
      )}
    </div>
  )
}
