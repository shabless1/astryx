/**
 * Auth configuration + utilities.
 *
 * NextAuth v4 + Next.js 14 App Router: route files can ONLY export
 * route handlers (GET/POST/...). So `authOptions` lives here and the
 * route file in `/api/auth/[...nextauth]/route.ts` imports it.
 */

import { getServerSession } from 'next-auth/next'
import { type NextAuthOptions, type DefaultSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { Session } from 'next-auth'

// ─── TYPE AUGMENTATION ────────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isPremium: boolean
      xrpAddress?: string
    } & DefaultSession['user']
  }
  interface User {
    id: string
    isPremium?: boolean
    xrpAddress?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    isPremium: boolean
    xrpAddress?: string
  }
}

// ─── DEMO USER STORE ─────────────────────────────────────────
// In production replace this with a real DB lookup (Prisma, etc.)
// For now, a simple in-memory map that survives the process lifetime.
// On Vercel each cold start re-creates it — swap for DB when ready.

const DEMO_USERS: Record<string, { passwordHash: string; isPremium: boolean }> = {}

// ─── AUTH OPTIONS ────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'astryx-dev-secret-change-in-production',

  providers: [
    // Google is only registered when credentials are provided — keeps
    // local dev working without OAuth setup.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId:     process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),

    // ── Email / Password ──────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
        action:   { label: 'Action',   type: 'text'     }, // 'signin' | 'signup'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()

        // ── Sign Up ──
        if (credentials.action === 'signup') {
          if (DEMO_USERS[email]) throw new Error('Email already registered')
          const hash = await bcrypt.hash(credentials.password, 10)
          DEMO_USERS[email] = { passwordHash: hash, isPremium: false }
          return { id: email, email, name: email.split('@')[0], isPremium: false }
        }

        // ── Sign In ──
        const user = DEMO_USERS[email]
        if (!user) throw new Error('No account found with this email')
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) throw new Error('Incorrect password')

        return {
          id: email,
          email,
          name: email.split('@')[0],
          isPremium: user.isPremium,
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id
        token.isPremium  = user.isPremium ?? false
        token.xrpAddress = user.xrpAddress
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id         = token.id
        session.user.isPremium  = token.isPremium
        session.user.xrpAddress = token.xrpAddress
      }
      return session
    },
  },

  pages: {
    signIn:  '/auth',
    error:   '/auth',
    signOut: '/',
  },
}

// ─── SERVER-SIDE SESSION ──────────────────────────────────────

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions)
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error('Authentication required')
  return session
}

// ─── PREMIUM CHECK ────────────────────────────────────────────

export async function isPremiumUser(): Promise<boolean> {
  const session = await getSession()
  return session?.user?.isPremium ?? false
}

// ─── MARK PREMIUM (called after XRP payment confirmed) ────────
// In production, this would update a DB record.
// For now, we use a simple server-side map (same lifetime as auth store).

const premiumUsers = new Set<string>()

export function grantPremium(userId: string): void {
  premiumUsers.add(userId)
}

export function checkPremium(userId: string): boolean {
  return premiumUsers.has(userId)
}

// ─── CLIENT HELPERS (re-exported from next-auth/react) ────────
// Components import from here to keep imports clean.

export { useSession, signIn, signOut, SessionProvider } from 'next-auth/react'
