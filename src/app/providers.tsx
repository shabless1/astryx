'use client'

/**
 * Client-side provider boundary.
 *
 * NextAuth's SessionProvider relies on React Context, which only works
 * inside Client Components. The root layout (layout.tsx) is a Server
 * Component, so we wrap it here to flip the boundary.
 */

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
