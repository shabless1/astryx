import type { Metadata, Viewport } from 'next'
import Providers from './providers'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Astryx — Cosmic Resonance System',
  description: 'A deterministic multi-sensory calibration system that translates astrological pattern intelligence into structured wellness protocols.',
  keywords: ['astryx', 'cosmic resonance', 'astrology', 'wellness', 'multi-sensory'],
  authors: [{ name: 'Astryx' }],
  manifest: '/manifest.json',
  icons: { icon: '/images/astryx%20logo%20b.png', apple: '/images/astryx%20logo%20b.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050714',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Rajdhani:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-space-900 text-white font-body antialiased overflow-x-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
