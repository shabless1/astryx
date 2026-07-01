# ASTRYX Suno Library — Hosting & Integration Guide
### Getting 120 tracks from Google Drive into production

---

## Why Google Drive Won't Work for Audio

Google Drive blocks cross-origin audio requests (`CORS`). The browser will refuse to play a Drive URL from your Vercel domain, even if the file is publicly shared. The tracks need to live on a real CDN with `Access-Control-Allow-Origin: *`.

**Three options, cheapest to most expensive:**

| Option | Cost | Setup Time | Best For |
|--------|------|------------|----------|
| **Cloudflare R2** | Free up to 10GB | ~20 min | Production (recommended) |
| **Vercel Blob** | $0.023/GB | ~10 min | If already on Vercel Pro |
| **public/ folder** | Free | 5 min | Local dev only |

---

## Option 1: Cloudflare R2 (Recommended)

### Step 1 — Create R2 bucket

1. Go to [cloudflare.com](https://cloudflare.com) → R2 Object Storage → Create Bucket
2. Name it `astryx-audio` (or anything)
3. Under **Settings → CORS Policy**, add:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

4. Under **Public Access** → Enable **R2.dev subdomain**
5. Copy the public URL — looks like `https://pub-XXXXXXXXXXXXXXXX.r2.dev`

### Step 2 — Upload tracks in the correct folder structure

Upload your MP3s maintaining this exact structure:

```
sun/nat/SUN_NAT_01.mp3
sun/nat/SUN_NAT_01b.mp3   ← variant (if created)
sun/nat/SUN_NAT_02.mp3
...
sun/exc/SUN_EXC_01.mp3
...
mars/exc/MARS_EXC_01.mp3
mars/exc/MARS_EXC_01b.mp3
...
pluto/nat/PLUTO_NAT_05.mp3
```

**Using Cloudflare dashboard:** Drag the folder structure directly.
**Using rclone (faster for bulk):**
```bash
rclone copy ./SUNO_TRACKS r2:astryx-audio --progress
```

### Step 3 — Set env var

In your `.env.local` and Vercel dashboard:
```bash
NEXT_PUBLIC_AUDIO_BASE_URL=https://pub-XXXXXXXXXXXXXXXX.r2.dev
```

That's it. The app builds track URLs as:
`https://pub-XXX.r2.dev/mars/exc/MARS_EXC_01.mp3`

---

## Option 2: Vercel Blob

```bash
npm install @vercel/blob
```

Upload via CLI or dashboard. Set:
```bash
NEXT_PUBLIC_AUDIO_BASE_URL=https://xxxxx.public.blob.vercel-storage.com/audio
```

---

## Option 3: Local Dev (public/ folder)

1. Create: `public/audio/library/`
2. Copy tracks maintaining folder structure: `public/audio/library/sun/nat/SUN_NAT_01.mp3`
3. Set in `.env.local`:
```bash
NEXT_PUBLIC_AUDIO_BASE_URL=/audio/library
```

⚠ Don't commit audio files to Git — 120 MP3s = hundreds of MB.

---

## Adding Track Variants to the Catalog

When a track has b/c/d versions, add them to `src/lib/sunoLibrary.ts`:

```typescript
// Before (single track):
mars: {
  exc: ['MARS_EXC_01', 'MARS_EXC_02', 'MARS_EXC_03'],
  ...
}

// After (with variants — seed selects deterministically):
mars: {
  exc: ['MARS_EXC_01', 'MARS_EXC_01b', 'MARS_EXC_01c', 'MARS_EXC_02', 'MARS_EXC_03'],
  ...
}
```

The seed is a 32-bit hash of birth data — same person always gets the same track, but different people get different ones from the pool.

---

## File Naming Rules

Files must exactly match the catalog entries in `sunoLibrary.ts`:
- All uppercase: `MARS_EXC_01.mp3` ✓ — `mars_exc_01.mp3` ✗
- Variants: `MARS_EXC_01b.mp3`, `MARS_EXC_01c.mp3`, `MARS_EXC_01d.mp3`
- Extension: `.mp3`

---

## Verifying Integration

Once `NEXT_PUBLIC_AUDIO_BASE_URL` is set and tracks are uploaded, start a session. In the Sound Engine panel you'll see:

```
♫ mars exc 01        [LIVE]
```

The track name shows which file is playing. If you see `[ERR]`, check the browser console for the actual CORS or 404 error.

---

## Complete Folder Checklist

```
sun/nat/   SUN_NAT_01 through SUN_NAT_05  (+ variants)
sun/exc/   SUN_EXC_01 through SUN_EXC_03  (+ variants)
sun/def/   SUN_DEF_01 through SUN_DEF_02  (+ variants)
sun/blk/   SUN_BLK_01 through SUN_BLK_02  (+ variants)

moon/      MOON_NAT_01-05, MOON_EXC_01-03, MOON_DEF_01-02, MOON_BLK_01-02
mercury/   MERCURY_NAT_01-05, ...
venus/     VENUS_NAT_01-05, ...
mars/      MARS_NAT_01-05, ...
jupiter/   JUPITER_NAT_01-05, ...
saturn/    SATURN_NAT_01-05, ...
uranus/    URANUS_NAT_01-05, ...
neptune/   NEPTUNE_NAT_01-05, ...
pluto/     PLUTO_NAT_01-05, ...
```

Total base tracks: 120 | Plus your variants = up to 200+ unique playable tracks.

---

*ASTRYX Suno Library Hosting Guide | June 2026*
