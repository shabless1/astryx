/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        space: {
          950: '#020408',
          900: '#050714',
          800: '#080d1f',
          700: '#0d1530',
        },
        accent: {
          violet: '#8B5CF6',
          gold: '#F4A940',
          mars: '#E8453C',
          moon: '#A8C4D0',
          venus: '#4CAF89',
          saturn: '#C9993A',
          neptune: '#9B5DE5',
          mercury: '#9EC832',
          jupiter: '#6B7FD4',
        },
      },
      animation: {
        'cosmic-breath': 'cosmicBreath 8s ease-in-out infinite',
        'rotate-slow': 'rotate 20s linear infinite',
        'rotate-medium': 'rotate 12s linear infinite',
        'rotate-fast': 'rotate 6s linear infinite',
        'counter-rotate': 'counterRotate 12s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'star-twinkle': 'starTwinkle 3s ease-in-out infinite',
        'ripple': 'ripple 3s ease-out infinite',
        'scan-line': 'scanLine 0.1s linear infinite',
      },
      keyframes: {
        cosmicBreath: {
          '0%, 100%': { transform: 'scale(1) translateY(0)', opacity: '0.35' },
          '50%': { transform: 'scale(1.02) translateY(-8px)', opacity: '0.42' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        starTwinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.9' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.7' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        scanLine: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 4px' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
