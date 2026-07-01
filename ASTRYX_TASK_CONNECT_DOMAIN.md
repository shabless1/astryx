# ASTRYX — Task: Connect myastryx.com (Vercel side) + print the Cloudflare records
### Claude Code · 2026-06-28 · domain attach, then hand SHA the exact DNS records

**Goal:** add `myastryx.com` (+ `www`) to the Vercel project and output the EXACT A-record IP and CNAME target SHA must create in Cloudflare. You do the Vercel side only — SHA does the two Cloudflare records herself (the Cloudflare integration here has no DNS access; don't attempt it).

**Context:** `myastryx.com` is registered with **Cloudflare Registrar** and Active, so its nameservers are already Cloudflare's and DNS is managed in the Cloudflare zone. The app deploys to Vercel via the CLI you already use.

---

## STEPS

1. **Confirm prod is ready first.** The domain points at the **production** deployment. Verify the latest prod build is the one to expose (Gemini hotfix in, Astryx answering). If prod is stale, redeploy prod **before** attaching the domain so the world doesn't land on a half-built version. Report the current prod deployment URL + commit.

2. **Add the domain to the project** (Vercel CLI, already authenticated):
   ```bash
   vercel domains add myastryx.com         # apex
   vercel domains add www.myastryx.com     # www
   ```
   If `domains add` isn't the right surface for this project/team, use `vercel domains inspect myastryx.com` or the project's domain settings to attach + retrieve records. Set **`myastryx.com` as the primary** and **`www.myastryx.com` → redirect to `myastryx.com`**.

3. **Retrieve the EXACT records** Vercel requires:
   ```bash
   vercel domains inspect myastryx.com
   ```
   Pull the apex **A record IP** and the **www CNAME target** Vercel lists for THIS project (do not assume `76.76.21.21` / `cname.vercel-dns.com` — print what Vercel actually returns).

4. **Output a copy-paste block for SHA** in exactly this shape, filled with the real values:
   ```
   ── CREATE THESE IN CLOUDFLARE (DNS tab) ──
   A      @     <IP from Vercel>            Proxy: DNS only (grey cloud)
   CNAME  www   <target from Vercel>        Proxy: DNS only (grey cloud)
   Then: SSL/TLS → Overview → set encryption mode to FULL.
   Delete any pre-existing @ or www A/AAAA/CNAME records first.
   ```

5. **Do NOT** touch Cloudflare, generate tokens, or change DNS yourself. Stop after printing the block.

## VERIFY / REPORT BACK
- Vercel shows `myastryx.com` + `www` attached (state will read "Invalid Configuration" until SHA adds the records — that's expected).
- Report: prod deployment URL, the exact A IP, the exact CNAME target, and confirm www is set to redirect to the apex.
- After SHA adds the records + sets SSL Full, Vercel auto-verifies and issues the Let's Encrypt cert (minutes–~1 hr). No further build needed.

## NOTES
- Grey-cloud (DNS only) is mandatory — orange-cloud proxy blocks Vercel's SSL provisioning.
- SSL mode FULL (not Flexible) — Flexible causes a redirect loop.
- No `FIXES_COMPLETE` entry needed (infra, not code), but drop a one-line note in `SESSION_HANDOFF` that the domain is attached and awaiting DNS.
