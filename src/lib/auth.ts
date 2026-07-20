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
      consented: boolean
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
    consented?: boolean
    xrpAddress?: string
  }
}

// ─── AUTH OPTIONS ────────────────────────────────────────────

// Directive v1.1 · FIX 4 — never let a hardcoded secret be reachable in
// production. Require NEXTAUTH_SECRET in prod (fail-closed on boot); allow a
// clearly-labeled dev-only placeholder locally so `npm run dev` still works.
function resolveNextAuthSecret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (s && s.length > 0) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is required in production — set it in the server environment.')
  }
  return 'astryx-dev-only-secret-do-not-use-in-production'
}

// ─── OAUTH COOKIE DOMAIN (Health-Analyst v1.1 · OAuth fix 2026-07-20) ─────────
// Root cause of the recurring Google "OAUTH_CALLBACK_ERROR — state cookie was
// missing" (firing since 2026-07-10): apex ↔ www host split. Both myastryx.com
// and www.myastryx.com resolve; a next.config www→apex 301 exists, but NextAuth
// scopes the OAuth `state`/PKCE cookie to whichever HOST set it. If Google's
// callback lands on the apex while the cookie was set on www (or the 301 fires
// mid-callback), the state cookie isn't sent → the login fails.
//
// Fix: pin the round-trip cookies to the SHARED parent domain (.myastryx.com,
// derived from NEXTAUTH_URL) so they survive apex↔www. Only in production over
// https; local dev (http://localhost) keeps NextAuth's defaults untouched.
// NOTE: csrfToken is deliberately NOT overridden — it uses the `__Host-` prefix,
// which forbids a Domain attribute, and it's validated at sign-in initiation on
// a single host, so it needs no cross-subdomain sharing.
function resolveCookieConfig(): Pick<NextAuthOptions, 'useSecureCookies' | 'cookies'> {
  const url = process.env.NEXTAUTH_URL ?? ''
  if (!url.startsWith('https://')) return {} // dev / http → NextAuth defaults

  let host = ''
  try { host = new URL(url).hostname } catch { host = '' }
  const apex = host.replace(/^www\./, '')
  if (!apex || apex === 'localhost') return { useSecureCookies: true }

  const domain = `.${apex}`
  const base = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: true, domain }

  return {
    useSecureCookies: true,
    cookies: {
      sessionToken:     { name: '__Secure-next-auth.session-token',      options: { ...base } },
      callbackUrl:      { name: '__Secure-next-auth.callback-url',       options: { ...base } },
      state:            { name: '__Secure-next-auth.state',              options: { ...base, maxAge: 900 } },
      pkceCodeVerifier: { name: '__Secure-next-auth.pkce.code_verifier', options: { ...base, maxAge: 900 } },
      nonce:            { name: '__Secure-next-auth.nonce',              options: { ...base } },
    },
  }
}

export const authOptions: NextAuthOptions = {
  secret: resolveNextAuthSecret(),

  // Cross-subdomain OAuth cookies — see resolveCookieConfig() above.
  ...resolveCookieConfig(),

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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id         = user.id
        token.isPremium  = user.isPremium ?? false
        token.xrpAddress = user.xrpAddress
        // Fix 2 — fork-buyer / allowlist entitlement, stamped ONCE at sign-in
        // and cached in the JWT (no DB read per request). A user who buys the
        // forks after signing in picks it up on their next sign-in.
        const { hasEntitlement } = await import('./entitlement')
        token.entitled = await hasEntitlement(user.email ?? token.email)
        // LEGAL SHIELD v1 · FIX 1 — consent stamp. False for a fresh signup;
        // flips to true after they accept (see the `update` trigger below).
        const { hasAcceptedCurrentConsent, resolveUserId } = await import('./consent')
        // Self-heal a stale JWT id (e.g. DB reset regenerated cuids) to the real
        // User row by email, so reads/consent key off the right account.
        const realId = await resolveUserId(user.id, user.email ?? token.email)
        if (realId) token.id = realId
        token.consented = await hasAcceptedCurrentConsent(token.id, user.email ?? token.email)
      } else if (trigger === 'update' && token.id) {
        // FIX 1 — the client calls session.update() right after accepting, so
        // the consent gate flips within the same session (no re-login needed).
        const { hasAcceptedCurrentConsent, resolveUserId } = await import('./consent')
        const realId = await resolveUserId(token.id, token.email)
        if (realId) token.id = realId
        token.consented = await hasAcceptedCurrentConsent(token.id, token.email)
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id         = token.id
        session.user.isPremium  = token.isPremium
        session.user.entitled   = token.entitled ?? false
        session.user.consented  = token.consented ?? false
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
