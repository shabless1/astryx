/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Directive v4.0 Fix 7 — the determinism ESLint ban runs as its own build
  // gate (npm run lint:determinism, scoped to the engine/chamber/audio paths).
  // The full-codebase lint stays advisory (`npm run lint`) — it was never a
  // build gate before this sprint and turning it on wholesale is out of scope.
  eslint: { ignoreDuringBuilds: true },
  // Force Tone.js through Next's bundler so the ESM wrapper issue can't
  // resurface. Pairs with the runtime unwrap in src/lib/soundEngine.ts.
  // See FIXES.md → Fix 2.
  transpilePackages: ['tone'],
  images: {
    domains: [],
  },
  // N.5 — canonical host: redirect www → apex (myastryx.com is primary, and
  // matches NEXTAUTH_URL so logins stay on one clean host).
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.myastryx.com' }],
        destination: 'https://myastryx.com/:path*',
        permanent: true,
      },
    ]
  },
  // Allow video files to be served from public
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
