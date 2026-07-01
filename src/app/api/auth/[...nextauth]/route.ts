/**
 * NextAuth route handler.
 *
 * Next.js 14 App Router route files can only export route handlers
 * (GET, POST, etc.) — so the actual `authOptions` config lives in
 * `src/lib/auth.ts` and this file just wires the handler.
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
