/**
 * Auth configuration + utilities.
 *
 * NextAuth v4 + Next.js 14 App Router: route files can ONLY export
 * route handlers (GET/POST/...). So `authOptions` lives here and the
 * route file in `/api/auth/[...nextauth]/route.ts` imports it.
 *
 * Directive v4.0 · Fix 1 — users now live in Supabase Postgres via Prisma
 * (the old in-memory DEMO_USERS evaporated on every serverless cold start).
 * Session strategy stays `jwt` so we never pay a DB read per request.
 */

import { getServerSession } from 'next-auth/next'
import { type NextAuthOptions, type DefaultSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import type { Session } from 'next-auth'
import { prisma } from './db'

// ─── TYPE AUGMENTATION ────────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isPremium: boolean
      entitled: boolean
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
    entitled?: boolean
    xrpAddress?: string
  }
}

// ─── AUTH OPTIONS ────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'astryx-dev-secret-change-in-production',

  // Prisma adapter persists OAuth users/accounts. Credentials sign-in is
  // handled manually below (NextAuth v4 never persists credentials sessions
  // through the adapter — JWT strategy carries them).
  adapter: PrismaAdapter(prisma),

  providers: [
    // Google is only registered when credentials are provided — keeps
    // local dev working without OAuth setup.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId:     process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          // A returning Google user whose email already exists from a
          // Credentials signup should link, not error out.
          allowDangerousEmailAccountLinking: true,
        })]
      : []),

    // ── Email / Password (DB-backed — Fix 1) ─────────────────
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
          const existing = await prisma.user.findUnique({ where: { email } })
          if (existing?.passwordHash) throw new Error('Email already registered')
          const passwordHash = await bcrypt.hash(credentials.password, 10)
          // A Google-created user adding a password keeps their row.
          const user = existing
            ? await prisma.user.update({ where: { email }, data: { passwordHash } })
            : await prisma.user.create({
                data: { email, name: email.split('@')[0], passwordHash },
              })
          return { id: user.id, email, name: user.name, isPremium: user.isPremium }
        }

        // ── Sign In ──
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) throw new Error('No account found with this email')
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) throw new Error('Incorrect password')

        return {
          id: user.id,
          email,
          name: user.name,
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
        // Fix 2 — fork-buyer / allowlist entitlement, stamped ONCE at sign-in
        // and cached in the JWT (no DB read per request). A user who buys the
        // forks after signing in picks it up on their next sign-in.
        const { hasEntitlement } = await import('./entitlement')
        token.entitled = await hasEntitlement(user.email ?? token.email)
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id         = token.id
        session.user.isPremium  = token.isPremium
        session.user.entitled   = token.entitled ?? false
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
// Fix 1 — now a DB write. Accepts a user id OR an email (the XRP route
// historically passed either).

export async function grantPremium(userId: string): Promise<void> {
  const where = userId.includes('@') ? { email: userId.toLowerCase() } : { id: userId }
  await prisma.user.updateMany({ where, data: { isPremium: true } })
}

export async function checkPremium(userId: string): Promise<boolean> {
  const where = userId.includes('@') ? { email: userId.toLowerCase() } : { id: userId }
  const user = await prisma.user.findFirst({ where, select: { isPremium: true } })
  return user?.isPremium ?? false
}

// ─── CLIENT HELPERS (re-exported from next-auth/react) ────────
// Components import from here to keep imports clean.

export { useSession, signIn, signOut, SessionProvider } from 'next-auth/react'
