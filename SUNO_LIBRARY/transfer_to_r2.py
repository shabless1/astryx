#!/usr/bin/env python3
"""
ASTRYX Suno Library — Google Drive → Cloudflare R2 Transfer
============================================================
Downloads every MP3 from the MUSIC LIBRARY Google Drive folder and uploads
to the astryx-audio R2 bucket with the correct folder structure.

 REQUIREMENTS
  pip install gdown boto3 --break-system-packages

 ONE-TIME SETUP (two steps — both take under 2 minutes)

 Step 1 — Make Drive files accessible:
   • Open Google Drive → MUSIC LIBRARY folder
   • Right-click → Share → Change to "Anyone with the link" → Viewer
   • (Can revoke after transfer completes)

 Step 2 — Get R2 credentials:
   • Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create Token
   • Permissions: Object Read & Write on bucket "astryx-audio"
   • Copy the Access Key ID and Secret Access Key

 USAGE
   export R2_ACCESS_KEY="your_access_key_id"
   export R2_SECRET_KEY="your_secret_access_key"
   export R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
   python3 transfer_to_r2.py

   Find YOUR_ACCOUNT_ID: Cloudflare Dashboard → R2 → top-right account overview

 WHAT IT DOES
   • Skips files already in R2 (safe to re-run if interrupted)
   • Downloads to /tmp, uploads immediately, deletes temp file
   • Prints progress and a final summary of any failures
   • ~210 files, ~840 MB total — takes 10-20 min depending on connection

 GAPS (tracks missing from Drive — generate these in Suno and add to Drive):
   MERCURY_NAT_04       VENUS_NAT_03         VENUS_DEF_02
   MARS_NAT_05          JUPITER_DEF_02       MOON_BLK_02
   URANUS_NAT_01        URANUS_EXC_01        PLUTO_EXC_01
   PLUTO_DEF_01
"""

import os
import sys
import tempfile
import time
from pathlib import Path

# ─── MANIFEST ─────────────────────────────────────────────────────────────────
# Format: (google_drive_file_id, r2_key)
# r2_key = {planet}/{state}/{FILENAME}.mp3

MANIFEST = [

    # ─── SUN ──────────────────────────────────────────────────────────────────
    ("1a6HzYNTIypWfEy8dxomxZ5_aYc68_uNb", "sun/nat/SUN_NAT_01.mp3"),
    ("1O5l5O6gQ0CfxDEouODti1aTPtTGwWvXj", "sun/nat/SUN_NAT_02.mp3"),
    ("19JeIbfg2oDioEltcqE_EAFEns5ia17Ic", "sun/nat/SUN_NAT_03.mp3"),
    ("1MYVskN95yrGmAIH1Mz5uw5oLnB9MB-mO", "sun/nat/SUN_NAT_04.mp3"),
    ("1n_Yf-VqGLEJpesDTDCiBNj8oGWa2aSYG", "sun/nat/SUN_NAT_04b.mp3"),
    ("1nHps2bPq_usFh0Gwsf12vPrtIBQ5E9vm", "sun/nat/SUN_NAT_05.mp3"),
    ("1JcHu9NLjnBrrfsLYgW6R6OF68A2QLI7y", "sun/nat/SUN_NAT_05b.mp3"),
    ("1vVkRXDq0Jvs1CLRk3QlBYYFawKnOCLqt", "sun/exc/SUN_EXC_01.mp3"),
    ("1jkezxbIPQGp1gvxeSSddv5fwNJR0t0ue", "sun/exc/SUN_EXC_02.mp3"),
    ("11-pJ3_xCYbI0di5CIan4tj8Zo1-97ce_", "sun/exc/SUN_EXC_02b.mp3"),
    ("15Xeg9p1gXplr-dN0zV-CCJCm7BIeZwI7", "sun/exc/SUN_EXC_03.mp3"),
    ("1jUHobjVaN8C5Iif3n4D4hfARYgyhTtW_", "sun/def/SUN_DEF_01.mp3"),
    ("14CzvjUruXgbBWA6UAgIftRLWDY2NX_u5", "sun/def/SUN_DEF_01b.mp3"),
    ("1KoUNl0h8gT6pHDRuzGXU6LPfVPh3afU_", "sun/def/SUN_DEF_01c.mp3"),
    ("1FMNhexGjAXsJyJEVpm61aunUGqvdbRjV", "sun/def/SUN_DEF_02.mp3"),
    ("1EuftQsvWXvK7Z1-qtbVgORbNuImtDHFt", "sun/blk/SUN_BLK_01.mp3"),
    ("1Yab-KkpkkmWIGDIdlkNRmhofNuC4A7vQ", "sun/blk/SUN_BLK_01b.mp3"),
    ("11BQGoIth82ygNN4Oza3RngXOfiPn8N4l", "sun/blk/SUN_BLK_02.mp3"),
    ("1CZyYECTT0IXAUtRQAln35vbVlVCgvLKy", "sun/blk/SUN_BLK_02b.mp3"),

    # ─── MOON ─────────────────────────────────────────────────────────────────
    ("1taWfszg6fWeSu6xC5e6SK4LmCCQQjNtc", "moon/nat/MOON_NAT_01.mp3"),
    ("1OmImndf_C-pxeu_emRYLpz7yyDMi6bAV", "moon/nat/MOON_NAT_02.mp3"),
    ("1lFRnrscOgr0MdI5u5qbluTZP39KmCDlg", "moon/nat/MOON_NAT_03.mp3"),
    ("1yhdvdelh9p6O0vld64-VS9n_iDG6mSe8", "moon/nat/MOON_NAT_03b.mp3"),
    ("1Hd4iCUrNNzutjXjq_Z7Yrr6kLtQohQuD", "moon/nat/MOON_NAT_04.mp3"),
    ("10srCOVfL6D2sQ0NzECmAGlYkvqLIZP33", "moon/nat/MOON_NAT_04b.mp3"),
    ("1t9wMovrnPXmj_-vlsVR1ccdctdpcE9Qa", "moon/nat/MOON_NAT_05.mp3"),
    ("1EQQRRzejepCRJ6Jup77zVyuEyVjixU-y", "moon/nat/MOON_NAT_05b.mp3"),
    ("1rTd-8MsrO5i4OUS3AK3qzhvt_vQW9iO4", "moon/exc/MOON_EXC_01.mp3"),
    ("1rTKxTtbuG8hZQsD7HH5_EtT5Cyc7zczl", "moon/exc/MOON_EXC_01a.mp3"),
    ("1CPTlpr6mpxtpSGJRKQjISO7mzZHZpgbI", "moon/exc/MOON_EXC_01b.mp3"),
    ("1A6lpm_PZ3HBIMBoZgyvAd3ElypnmuKhb", "moon/exc/MOON_EXC_02.mp3"),
    ("17jH5Yb-zXfigUSHLNtMBBuUBQzo77elo", "moon/exc/MOON_EXC_02b.mp3"),
    ("1XvyeXU2hyQ56TxDjBDI3mn7uYaL0ledU", "moon/exc/MOON_EXC_03.mp3"),
    ("1llXnrg0BdAJJXmLKng-GU7U9iGpOa-qI", "moon/exc/MOON_EXC_03b.mp3"),
    ("15YILVVDcU3_tCN1OhaSj8zKLMqMa3or5", "moon/def/MOON_DEF_01.mp3"),
    ("1FoxxsrnvfeRa-tV-_u2HEyaYPgiUGehP", "moon/def/MOON_DEF_02.mp3"),
    ("1W1sbVp4vS2H1MUGHZ7v5d3C6sL_9uGwS", "moon/blk/MOON_BLK_01.mp3"),
    # MOON_BLK_02 — not yet created

    # ─── MERCURY ──────────────────────────────────────────────────────────────
    ("1LP3v8knJ2c6GdxMuLYIShCew83TUfNfO", "mercury/nat/MERCURY_NAT_01.mp3"),
    ("1_g8uMa7tm4H31ZPL8K9oD42N9jxwTJCr", "mercury/nat/MERCURY_NAT_01b.mp3"),
    ("13QjgAmSzu7_muQvt2DBa82a9eeXJHqLW", "mercury/nat/MERCURY_NAT_02.mp3"),
    ("1tcpHSWAfG6zKPce59mwyJ1oAur7BS66w", "mercury/nat/MERCURY_NAT_03.mp3"),
    # MERCURY_NAT_04 — not yet created
    ("1kHQjb6QXYvR0BUiNNOicLvtmDgoiuA2_", "mercury/nat/MERCURY_NAT_05.mp3"),
    ("15P6ulrkrvbnoUCBfGO0GTZYi7rsqjVLY", "mercury/nat/MERCURY_NAT_05b.mp3"),
    ("1_1dkig-VahASjSXXnq8jix_G5ZLUg7n4", "mercury/exc/MERCURY_EXC_01.mp3"),
    ("1JNZTOppbwMDpasbj0s0N6khwr3Pcmg0E", "mercury/exc/MERCURY_EXC_01b.mp3"),
    ("1Qn1zn884gg1GnYSJmRy8SLjAYepW7CZc", "mercury/exc/MERCURY_EXC_02.mp3"),
    ("1yxdX3wkuxHAqcbVPcZI6s3B3d_vR6xaq", "mercury/exc/MERCURY_EXC_03.mp3"),
    ("1-U05KOxYzUNdE6jo1PU_xF4_CIehsXoi", "mercury/def/MERCURY_DEF_01.mp3"),
    ("1fy1ljmOfmSppsw3nvmxnHmsFXmq3OpSE", "mercury/def/MERCURY_DEF_01b.mp3"),
    ("1yivHynmnLgbhQRfIx8crLBgzTe0K7PQQ", "mercury/def/MERCURY_DEF_02.mp3"),
    ("1kL_Gx78_wf0PDx9xWdm-KVVXmIJqSvwx", "mercury/blk/MERCURY_BLK_01.mp3"),
    ("1Bm02lof1cm9XpIQi_TqPL6rBXXU61zAJ", "mercury/blk/MERCURY_BLK_01b.mp3"),
    ("15k5BD-M32d6e4rshX-IAtzIPnBaUdpNX", "mercury/blk/MERCURY_BLK_02.mp3"),
    ("12ECjv5FpFUHPJPdzaaaQMj23Esmzlkd4", "mercury/blk/MERCURY_BLK_02b.mp3"),

    # ─── VENUS ────────────────────────────────────────────────────────────────
    ("1geZ9v2jfBwvhJhGkO_Ap41AkPMA6qymw", "venus/nat/VENUS_NAT_01.mp3"),
    ("1sCc8bfAYQqtOl76ig0mFhz6gsCqTdPkr", "venus/nat/VENUS_NAT_01b.mp3"),
    ("1TDmFsRw-l2JqyH4d0DUZwQ-WKFZAKU5Q", "venus/nat/VENUS_NAT_02.mp3"),
    ("13yEECNUrtalt4rBHeSh9wXHliuzQCJSG", "venus/nat/VENUS_NAT_02b.mp3"),
    ("15TIxj4hgfdoZxb3ZOniTOr9HvSwktp0M", "venus/nat/VENUS_NAT_02c.mp3"),
    # VENUS_NAT_03 — not yet created
    ("1YJsUkR0zqbFhOU8FlfWo3TQKv-Rp_jd_", "venus/nat/VENUS_NAT_04.mp3"),
    ("1HOTc5CEgARS73YHSAbyCugmr9QoPGW6W", "venus/nat/VENUS_NAT_04b.mp3"),
    ("1WrPvly2sfVJZuoa0C7t_lnRbGraOodFN", "venus/nat/VENUS_NAT_05.mp3"),
    ("14SY5BzzJ2kbx5ct9MbYJfD7pDpntMPPR", "venus/nat/VENUS_NAT_05b.mp3"),
    ("1G1HLwL6ttoRmAf26vlbIm9QhhrHAqJqJ", "venus/exc/VENUS_EXC_01.mp3"),
    ("1Qttpm-aYlz8TKBTKVnoz2jSn8KdjlJnq", "venus/exc/VENUS_EXC_01b.mp3"),
    ("19t2zVIiCux7p4rWWWsVmW14XPtU8L2LT", "venus/exc/VENUS_EXC_02.mp3"),
    ("1YHJQ_O0BJpGn7O6sTEA9MKampQRjk-dO", "venus/exc/VENUS_EXC_03.mp3"),
    ("1GeAfHlzfqjdDCroT6J9h65-64p9sFn3q", "venus/def/VENUS_DEF_01.mp3"),
    # VENUS_DEF_02 — not yet created
    ("1dfQd9wjnLtDBJ4tR6EnduJcxuZ18pnt-", "venus/blk/VENUS_BLK_01.mp3"),
    ("1EV4bzOVkxiXiSWPlan8jdMO6SLFZuHNU", "venus/blk/VENUS_BLK_01b.mp3"),
    ("1qRbzMfhcymxCUebYSt-ZDr6twQH3Vk0I", "venus/blk/VENUS_BLK_02.mp3"),
    ("1FzKhAFiqDAxDT4rXR5ta7aVe8DqxARWZ", "venus/blk/VENUS_BLK_02b.mp3"),

    # ─── MARS ─────────────────────────────────────────────────────────────────
    ("1HbqEHcGCnKMnNNMsvsEzLuRkH86Ali1e", "mars/nat/MARS_NAT_01.mp3"),
    ("1_B5e5UoyZTlmJ-3uRNTdw8qwBdXcUR6N", "mars/nat/MARS_NAT_01b.mp3"),
    ("1A3c_hfc04ytyMPbkHVdQkz_rVVxH7prX", "mars/nat/MARS_NAT_02.mp3"),
    ("13SWuo5NYfEfm311Ux2OrPKkwWtkpFDwM", "mars/nat/MARS_NAT_02b.mp3"),
    ("16uyCJt0P90jT_epAqxsyaWMciN9lwx63", "mars/nat/MARS_NAT_03.mp3"),
    ("1GinvlPrT_qxm2R3JQUZ7RvrTtXyMK5J4", "mars/nat/MARS_NAT_04.mp3"),
    ("1inQlqVYnQECfx8SwRuKxCK5u88olygkg", "mars/nat/MARS_NAT_04b.mp3"),
    # MARS_NAT_05 — not yet created
    ("1BCQezS0HBoYro4RzssTuBNoNZ7o3tZ5N", "mars/exc/MARS_EXC_01.mp3"),
    ("1du36qUayBmNvW11DqWUzcw1-_XIn9JC-", "mars/exc/MARS_EXC_01b.mp3"),
    ("1OYuy5pM4cAYqwN5HpzEju4uNcPtFB8s7", "mars/exc/MARS_EXC_02.mp3"),
    ("1P9MIoEnmAF046TGn1ybsXF-vVjdvBgXx", "mars/exc/MARS_EXC_02b.mp3"),
    ("1uh2BoUokDbwpQJfsRWBiJywrgRthNrhS", "mars/exc/MARS_EXC_03.mp3"),
    ("10aLKnc4_GrJTmD5LlinpAj-cRiBzyi_v", "mars/exc/MARS_EXC_03b.mp3"),
    ("14cK1I8e-k60H1pFgNK5BihVCUowoECxj", "mars/def/MARS_DEF_01.mp3"),
    ("1ZwaiPR3NFghR49oE_3spEpEL2VKMR_bC", "mars/def/MARS_DEF_01b.mp3"),
    ("1CGJ9Fm-WIc1THTmR__9WFr_GP_a2RO7x", "mars/def/MARS_DEF_02.mp3"),
    ("1F45bQbNQybCq_S8Toh59YfxmWmVbQqgF", "mars/def/MARS_DEF_02b.mp3"),
    ("1Dd0Css3h2HcYe7Pt0lSxmIvU8FoiDfga", "mars/blk/MARS_BLK_01.mp3"),
    ("1U4Ofa33lOLScxgWwmTtobBrOJjLuq9_S", "mars/blk/MARS_BLK_01b.mp3"),
    ("17zQLKVCRDZl8774rwSqbRpFy0nMLNTiF", "mars/blk/MARS_BLK_02.mp3"),
    ("1KWLTj2igv9KxwOaBOQ-3IV64RK7RanQy", "mars/blk/MARS_BLK_02b.mp3"),

    # ─── JUPITER ──────────────────────────────────────────────────────────────
    ("1LiK-hqxwI6pYGC7tHlsTrgFewMB8HLPd", "jupiter/nat/JUPITER_NAT_01.mp3"),
    ("1l31EMxXn-bDZmTuhG7GitB_50ZJrdIB0", "jupiter/nat/JUPITER_NAT_01b.mp3"),
    ("1-77oaRfCtq752akCjRwmMqw5kSkblmtU", "jupiter/nat/JUPITER_NAT_01c.mp3"),
    ("1meKL2uzdhoLByiamZIxzEzsXb9_SKGFX", "jupiter/nat/JUPITER_NAT_02.mp3"),
    ("1zEepqZiZ1sNf23tYGbtTN92wLchI_hJp", "jupiter/nat/JUPITER_NAT_02b.mp3"),
    ("1K_FT89BnDn1BhTj7p_Wu8wy99wTEjqfc", "jupiter/nat/JUPITER_NAT_02c.mp3"),
    ("1-ET4LhKK0q1_AhbDGwBIWjH2fuIeY1--", "jupiter/nat/JUPITER_NAT_03.mp3"),
    ("11E59CBbcYDSB1SgSch0WKnp63kQT3kvE", "jupiter/nat/JUPITER_NAT_03b.mp3"),
    ("1w9NwdgZMQRWO7j2_jDdOmj9ImHvOZLv8", "jupiter/nat/JUPITER_NAT_04.mp3"),
    ("1w0wu-ceY_GCtq3-Cm1oq4QobGl3sj1SG", "jupiter/nat/JUPITER_NAT_04b.mp3"),
    ("1XdeugCAma3odEzj0_OwE7G0ox50_5uhz", "jupiter/nat/JUPITER_NAT_05.mp3"),
    ("1E7k-a92C1cEHYzUFE71SLnXD0tFpkmYG", "jupiter/nat/JUPITER_NAT_05b.mp3"),
    ("16xmSX695yG9Anmo5bXb3oYWfrEeKeYYL", "jupiter/nat/JUPITER_NAT_05c.mp3"),
    ("1WnhQBIQDlXWfyBLIGtdCQF6WtpZ1P-g0", "jupiter/exc/JUPITER_EXC_01.mp3"),
    ("1Irlooq-Z7YtY4qLqmcM-ATYxWoiUrLza", "jupiter/exc/JUPITER_EXC_01b.mp3"),
    ("1i-ykxK-JkwLrJYQMFbZNGpBlWuow1Rtj", "jupiter/exc/JUPITER_EXC_01c.mp3"),
    ("14ilPo4Q7Mgbb0X41Jzxfm1a8FWqpAcan", "jupiter/exc/JUPITER_EXC_02.mp3"),
    ("1z7w0lwE-osaiSuu0IEyn2wnJ1G8uSwdZ", "jupiter/exc/JUPITER_EXC_02b.mp3"),
    ("12ackyYESBq4PvOcEsTqqivSfLfYQSu-A", "jupiter/exc/JUPITER_EXC_02c.mp3"),
    ("1S8bG_jyb5gOwgPmPJRY-xSpjLVDvic9K", "jupiter/exc/JUPITER_EXC_03.mp3"),
    ("1Odz7fB0oryoOaWiodor8c8aT9277XZ3-", "jupiter/exc/JUPITER_EXC_03b.mp3"),
    ("1WJax7ai6BwIcRCAWEDrglGN-yLJYchap", "jupiter/def/JUPITER_DEF_01.mp3"),
    ("1jV8KW8QToqNPdvmGjnqt226QFgFBkBMb", "jupiter/def/JUPITER_DEF_01b.mp3"),
    # JUPITER_DEF_02 — not yet created
    ("1qD__gxuHEL6VB1W5egtrjY6Q9Tl2oACI", "jupiter/blk/JUPITER_BLK_01.mp3"),
    ("15KlcK0Up7u_T9WFBZCdloV31N9zv1WfS", "jupiter/blk/JUPITER_BLK_01b.mp3"),
    ("14-w35aPjtEjeVAUZ9Uy-cGHHFUHejdja", "jupiter/blk/JUPITER_BLK_02.mp3"),
    ("1A_NGFJ_8SzyGPeOhzndJ4L_z9npQ0Z-1", "jupiter/blk/JUPITER_BLK_02b.mp3"),
    ("1vwrP0LyHKA212xf485Mbh1jx_r1uaJKq", "jupiter/blk/JUPITER_BLK_02c.mp3"),

    # ─── SATURN ───────────────────────────────────────────────────────────────
    ("1gV_TywFHcR5POm_qQ7sXamUm5OHo85IA", "saturn/nat/SATURN_NAT_01.mp3"),
    ("1-rTqkxJkdyrBgKf12OjsaPxuEuAdkC60", "saturn/nat/SATURN_NAT_01b.mp3"),
    ("1Cy5GeuR51njPIckvDRLNlqnzmbzu1o_g", "saturn/nat/SATURN_NAT_02.mp3"),
    ("1dcVwcbzuBqZVmh4UK-BZme1LNi88fmjk", "saturn/nat/SATURN_NAT_03.mp3"),
    ("11PjHFu5X_Jztng9Cggzy0ssknDjC71Ii", "saturn/nat/SATURN_NAT_03b.mp3"),
    ("112nkIcAC1DZwOXXp9IZEPP4UQSCM6abP", "saturn/nat/SATURN_NAT_04.mp3"),
    ("17nw2eMZeMydvJVV3OnswnNf4mi2R4ZAQ", "saturn/nat/SATURN_NAT_05.mp3"),
    ("1hcdtsBasX1FZSQnYxiaPNzhRqvVA3LcH", "saturn/nat/SATURN_NAT_05b.mp3"),
    ("1wwpgCDH8RbB8lCZP73AvDh2jPbNBEp7x", "saturn/exc/SATURN_EXC_01.mp3"),
    ("1tNNtrFlEUeCCAAvtGAv6MsGA4GclEz3X", "saturn/exc/SATURN_EXC_01b.mp3"),
    ("1hTxN6b0clEUXvKezQpsahc-5iP5Wxgk9", "saturn/exc/SATURN_EXC_02.mp3"),
    ("1Il765_4yNTSi-AkNgGZWWi9H3coDwSoE", "saturn/exc/SATURN_EXC_02b.mp3"),
    ("13vbg3X0ojOTyDJaEFXciYZVbFwmq0rLV", "saturn/exc/SATURN_EXC_03.mp3"),
    ("1cHObZ4JMPFxxca6Qw3iMmdGis7acXYK7", "saturn/exc/SATURN_EXC_03b.mp3"),
    ("1RaSvj9Vwy8eORdFzQkB_oEJtE0vmQFRm", "saturn/def/SATURN_DEF_01.mp3"),
    ("1eXlhTGLkwYs-9js0_sxs3m2k717z2cHd", "saturn/def/SATURN_DEF_01b.mp3"),
    ("1yXYORrcjufvcCZNiPHhMIJ3JYevOsMQt", "saturn/def/SATURN_DEF_01c.mp3"),
    ("13q8gAFKQeqbgMkpnVHRBMmKZRlMRPefd", "saturn/def/SATURN_DEF_02.mp3"),
    ("1hpbdP95i1R08jOZr-y-MVPiylJ2v09dx", "saturn/def/SATURN_DEF_02b.mp3"),
    ("1kvO_zO13dnJzaJDaampQ108Xus9SxJ4J", "saturn/blk/SATURN_BLK_01.mp3"),
    ("1DOGnUKOIHiJ1fsFE_FCFo5KYahgTb48Q", "saturn/blk/SATURN_BLK_01b.mp3"),
    ("1dEHdI1G5p39JUVTdS7Gocoh2ETRwFBJx", "saturn/blk/SATURN_BLK_02.mp3"),
    ("1A-dCYCkFWEdqAt7tjYFfUu-W3gQj4o6Z", "saturn/blk/SATURN_BLK_02b.mp3"),
    ("1q0phUSbzViO1UKU0XU5hKjT67yGMeL2f", "saturn/blk/SATURN_BLK_02c.mp3"),

    # ─── URANUS ───────────────────────────────────────────────────────────────
    # URANUS_NAT_01 — not yet created
    ("18Bvzk50WMZOxfq8ZCrhwX9SmY3sLGa3R", "uranus/nat/URANUS_NAT_02.mp3"),
    ("1B1Q7LJpV3FhQ-xB_XRW4sVUnmOuB9UwT", "uranus/nat/URANUS_NAT_03.mp3"),
    ("19LfOlpwOrtERk6YedbATTvbtAqawnr-U", "uranus/nat/URANUS_NAT_04.mp3"),
    ("1K8wSvuI0lJkzchtwr_qgv9za9Sk5wWnZ", "uranus/nat/URANUS_NAT_05.mp3"),
    ("1TmplknkBBEFmnJ2ojKS_KJKbXjCu1jOl", "uranus/nat/URANUS_NAT_05b.mp3"),
    ("16_k0N1jXDWOsZdhdp8-CBJL8SSkoH7Ii", "uranus/nat/URANUS_NAT_05c.mp3"),
    # URANUS_EXC_01 — not yet created
    ("1ddl7ZnIAA16L2bKERgstuj0aTxQ2MFhh", "uranus/exc/URANUS_EXC_02.mp3"),
    ("1FKaaeD5VDSXF9aYpIwvSwsUlPqOeUcM6", "uranus/exc/URANUS_EXC_02b.mp3"),
    ("1m_j-t8bIDy5pD_iE8s38_0B1bfKHx6-q", "uranus/exc/URANUS_EXC_03.mp3"),
    ("1f20VXI_ZRXKi_rBb8GlKli-9-I7ag6YY", "uranus/exc/URANUS_EXC_03b.mp3"),
    ("1RE6ZR1wO7GNUSLnMukvLd-AtccboX84K", "uranus/exc/URANUS_EXC_03c.mp3"),
    ("1hRKKASPi3_OkD5cyQXelYsGSqr5Sgaz0", "uranus/def/URANUS_DEF_01.mp3"),
    ("1bOf4TrzNyHU2ejSVa204XdIJ6nsWyiC9", "uranus/def/URANUS_DEF_02.mp3"),
    ("1XubdD6Y0sKFxMLwpFOQ4N6K0PLkaUKQQ", "uranus/def/URANUS_DEF_02b.mp3"),
    ("1bCNf106JZFfmTdAA1ec0NBTwx1idFI5P", "uranus/blk/URANUS_BLK_01.mp3"),
    ("1a8VsNrqgmyziKaOrwND8A-dlKcyjg72l", "uranus/blk/URANUS_BLK_01b.mp3"),
    ("1J6K3cIuO0byk1VNn2TBrTUyjDsIcAqAr", "uranus/blk/URANUS_BLK_02.mp3"),
    ("1rtiEid22Etyt8ko_WSSe3RCEJr9V-iOE", "uranus/blk/URANUS_BLK_02b.mp3"),

    # ─── NEPTUNE ──────────────────────────────────────────────────────────────
    ("1wtG5z_gOusLsdt2c4EXFC40lxumDYsNs", "neptune/nat/NEPTUNE_NAT_01.mp3"),
    ("1XLc3aS1VWZ5WMcJZOjN2j4G1wLyCdm3n", "neptune/nat/NEPTUNE_NAT_01b.mp3"),
    ("15rRKsd25ucJFLyvgIKH8B7WU3IsqF6f4", "neptune/nat/NEPTUNE_NAT_02.mp3"),
    ("1OS_OELn4rfCkgl0D-3rU90R0nQ2xQPxJ", "neptune/nat/NEPTUNE_NAT_02b.mp3"),
    ("1BiOhLXlEypJDGuCBpPXEUd_92_hLkQvZ", "neptune/nat/NEPTUNE_NAT_03.mp3"),
    ("1msWGaW3KawlwlK3P87mwn7HVBjozb-nE", "neptune/nat/NEPTUNE_NAT_03b.mp3"),
    ("1aytdr4lWT3-M6u5HLbjit7Hqlg76jOWM", "neptune/nat/NEPTUNE_NAT_04.mp3"),
    ("1ovQzpIpQfZsQaZU0kuVnn8LVGCfibVnw", "neptune/nat/NEPTUNE_NAT_04b.mp3"),
    ("1lTvnk681MRRr26b3RlHeAPylYuwYbPD_", "neptune/nat/NEPTUNE_NAT_05.mp3"),
    ("1Iv8uf0w9jojnyVSdowmt2ADU7JQvzSjh", "neptune/nat/NEPTUNE_NAT_05b.mp3"),
    ("1ajJ7bCE1ErTAod7rvI-e1xu3mSdoOqJ1", "neptune/nat/NEPTUNE_NAT_05c.mp3"),
    ("1ot1DSo6l3LQR0HPbU6XfB6Jo4V9HHZLe", "neptune/exc/NEPTUNE_EXC_01.mp3"),
    ("1ZCVssW2c53y5MpuyYIaZKsOwlnEVjTYB", "neptune/exc/NEPTUNE_EXC_01b.mp3"),
    ("18xBXi6IfRUqj7G9X4Y6optujmpDO-8lM", "neptune/exc/NEPTUNE_EXC_02.mp3"),
    ("1Y8QZhdCR4OBlarJdBLzVoAK0v_Hf2yLK", "neptune/exc/NEPTUNE_EXC_02b.mp3"),
    ("1lkIDjKyrSQRpt3ZWkuFhD7c1HtAM7Q-W", "neptune/exc/NEPTUNE_EXC_03.mp3"),
    ("1_g1sQILcs5HEsi01bHZIz4MQSSbOV8NB", "neptune/exc/NEPTUNE_EXC_03b.mp3"),
    ("1fBNd9O9CAqrmUJ008OE22B5GdFlpXtMZ", "neptune/def/NEPTUNE_DEF_01.mp3"),
    ("1GQVkfP7RjcwDov6HhhmHw6The4_Utmkj", "neptune/def/NEPTUNE_DEF_01b.mp3"),
    ("19s7GnKG5vVk5EQpB-RJ3WfyIweZ27nEa", "neptune/def/NEPTUNE_DEF_01c.mp3"),
    ("1Q80xNATCmoI7XNNbHqtnCDu8ARC1n0-b", "neptune/def/NEPTUNE_DEF_02.mp3"),
    ("1sblniB99J63itwvVG1XqnnwXbGRGiOTx", "neptune/def/NEPTUNE_DEF_02b.mp3"),
    ("1q6X8BDONPemYnATIJgfho_1C9loSK93k", "neptune/blk/NEPTUNE_BLK_01.mp3"),
    ("1-jLZouvcyLODiJjD2AnZ5ejnOrYYl9QJ", "neptune/blk/NEPTUNE_BLK_01b.mp3"),
    ("1TUiee29nNQMg_uGtcNOyWFzaMarDuKRx", "neptune/blk/NEPTUNE_BLK_02.mp3"),
    ("1Vw7avVsGOsW9w6vbUakZlJ1gB0gvU_Zt", "neptune/blk/NEPTUNE_BLK_02b.mp3"),

    # ─── PLUTO ────────────────────────────────────────────────────────────────
    ("1E6kul1S4_ty7IbufiqEJyuyC0tTUkHfe", "pluto/nat/PLUTO_NAT_01.mp3"),
    ("1DLIEGpeyBgiPbNovu1t8wv0IuTybTXdi", "pluto/nat/PLUTO_NAT_02.mp3"),
    ("1EWfeq0I3wJavzU5xgQqbdNPA-6XqQBSb", "pluto/nat/PLUTO_NAT_03.mp3"),
    ("1MP038ZLivNCV-tQNkukK1IS3uqsGFSjx", "pluto/nat/PLUTO_NAT_03b.mp3"),
    ("1eGxSdJqB4FSalOg0Un0fc192ha-kRo_u", "pluto/nat/PLUTO_NAT_04.mp3"),
    ("1Z3e7VIh0JUtlxg6Pz_N6PKSMsbz_pQ0_", "pluto/nat/PLUTO_NAT_05.mp3"),
    # PLUTO_EXC_01 — not yet created
    ("11O-qmMO6EdbBEkuLJN2SnthQNS4p-Jzb", "pluto/exc/PLUTO_EXC_02.mp3"),
    ("196_--wZI5xmXMrOycgRnu41FAnyid9rj", "pluto/exc/PLUTO_EXC_03.mp3"),
    ("1SwOtvYf9IGOtaLRD8fu1m_SHXW-bUWNB", "pluto/exc/PLUTO_EXC_03b.mp3"),
    # PLUTO_DEF_01 — not yet created
    ("1HPTLB_miakx_bLdYtu-MunttOBLQanw8", "pluto/def/PLUTO_DEF_02.mp3"),
    ("1ikDAe1JLeT_sBztflcJdjSblIpMHaN_a", "pluto/def/PLUTO_DEF_02b.mp3"),
    ("1ppMTQLfILmM9mUDgc8-J7wx-dJcLsuPU", "pluto/blk/PLUTO_BLK_01.mp3"),
    ("1Ho2De6EcBuegC5gD7lavG8kR4igqwHEf", "pluto/blk/PLUTO_BLK_01b.mp3"),
    ("1Z_WIMQKarnyN4HmqbjXfQJJHt8AKGRHw", "pluto/blk/PLUTO_BLK_02.mp3"),
    ("1JtRztIakQbf4m8ZptshU425R4jxLNV2B", "pluto/blk/PLUTO_BLK_02b.mp3"),
]

# ─── CONFIG ───────────────────────────────────────────────────────────────────

R2_BUCKET    = os.environ.get("R2_BUCKET", "astryx-audio")
R2_ENDPOINT  = os.environ.get("R2_ENDPOINT", "")   # https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS    = os.environ.get("R2_ACCESS_KEY", "")
R2_SECRET    = os.environ.get("R2_SECRET_KEY", "")

# ─── MAIN ─────────────────────────────────────────────────────────────────────

def check_env():
    missing = []
    if not R2_ENDPOINT: missing.append("R2_ENDPOINT")
    if not R2_ACCESS:   missing.append("R2_ACCESS_KEY")
    if not R2_SECRET:   missing.append("R2_SECRET_KEY")
    if missing:
        print(f"❌  Missing env vars: {', '.join(missing)}")
        print("    Set them before running:")
        for v in missing:
            print(f"      export {v}=your_value")
        sys.exit(1)

def make_s3_client():
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS,
        aws_secret_access_key=R2_SECRET,
        region_name="auto",
    )

def key_exists(s3, key: str) -> bool:
    try:
        s3.head_object(Bucket=R2_BUCKET, Key=key)
        return True
    except Exception:
        return False

def download_file(drive_id: str, dest_path: str) -> bool:
    """Download from Google Drive using gdown."""
    import gdown
    url = f"https://drive.google.com/uc?id={drive_id}&export=download"
    try:
        gdown.download(url, dest_path, quiet=True, fuzzy=True)
        return Path(dest_path).exists() and Path(dest_path).stat().st_size > 0
    except Exception as e:
        print(f"  ⚠  gdown failed: {e}")
        return False

def upload_file(s3, local_path: str, r2_key: str) -> bool:
    try:
        s3.upload_file(
            local_path,
            R2_BUCKET,
            r2_key,
            ExtraArgs={"ContentType": "audio/mpeg"},
        )
        return True
    except Exception as e:
        print(f"  ⚠  Upload failed: {e}")
        return False

def main():
    check_env()

    try:
        import gdown
    except ImportError:
        print("❌  gdown not installed. Run: pip install gdown boto3 --break-system-packages")
        sys.exit(1)

    s3 = make_s3_client()
    total = len(MANIFEST)
    skipped = 0
    uploaded = 0
    failed = []

    print(f"\n🎵  ASTRYX Suno Library Transfer")
    print(f"    Bucket : {R2_BUCKET}")
    print(f"    Files  : {total} tracks\n")

    with tempfile.TemporaryDirectory() as tmpdir:
        for i, (drive_id, r2_key) in enumerate(MANIFEST, 1):
            filename = r2_key.split("/")[-1]
            prefix = f"[{i:3d}/{total}]"

            # Skip if already in R2
            if key_exists(s3, r2_key):
                print(f"{prefix} ✓ skip   {r2_key}")
                skipped += 1
                continue

            print(f"{prefix} ↓ get    {filename} ... ", end="", flush=True)
            tmp_path = str(Path(tmpdir) / filename)

            ok = download_file(drive_id, tmp_path)
            if not ok:
                print("FAILED download")
                failed.append(r2_key)
                continue

            size_kb = Path(tmp_path).stat().st_size // 1024
            print(f"{size_kb:,} KB → upload ... ", end="", flush=True)

            ok = upload_file(s3, tmp_path, r2_key)
            if ok:
                print("✓")
                uploaded += 1
            else:
                print("FAILED upload")
                failed.append(r2_key)

            # Clean up temp file immediately to save disk
            try:
                Path(tmp_path).unlink()
            except Exception:
                pass

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"\n{'─'*60}")
    print(f"  Done!  uploaded={uploaded}  skipped={skipped}  failed={len(failed)}")
    if failed:
        print(f"\n  ⚠  Failed files ({len(failed)}):")
        for f in failed:
            print(f"     {f}")
        print("\n  Retry failed files by running the script again")
        print("  (already-uploaded files are skipped automatically)")
    else:
        print(f"\n  ✅  All {total} tracks are in {R2_BUCKET}")
        print(f"\n  Next step:")
        print(f"    1. Enable R2.dev public URL in Cloudflare Dashboard → R2 → {R2_BUCKET} → Settings")
        print(f"    2. Copy the public URL (looks like https://pub-xxxx.r2.dev)")
        print(f"    3. Set in Vercel env vars: NEXT_PUBLIC_AUDIO_BASE_URL=https://pub-xxxx.r2.dev")
        print(f"    4. Redeploy")

if __name__ == "__main__":
    main()
