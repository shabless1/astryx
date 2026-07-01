#!/usr/bin/env python3
"""
ASTRYX — Local folder → Cloudflare R2 upload
============================================
Uploads MP3s you've dropped locally (no Google Drive needed). Walks the staging
folder and uploads each file to the astryx-audio bucket, preserving the folder
path as the R2 key. Safe to re-run — files already in R2 are skipped.

 STAGING FOLDER (already built for you):
   SUNO_LIBRARY/_incoming/r2_upload/{planet}/{state}/{FILENAME}.mp3
   e.g. _incoming/r2_upload/earthday/nat/EARTHDAY_NAT_01.mp3
   → uploads to R2 key: earthday/nat/EARTHDAY_NAT_01.mp3

 SETUP (same 3 env vars as transfer_to_r2.py):
   pip install boto3 --break-system-packages
   export R2_ACCESS_KEY="your_access_key_id"
   export R2_SECRET_KEY="your_secret_access_key"
   export R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
   python3 upload_local_to_r2.py
"""

import os
import sys
from pathlib import Path

# Folder whose tree mirrors the R2 key structure ({planet}/{state}/FILE.mp3)
STAGING_DIR = Path(__file__).parent / "_incoming" / "r2_upload"

R2_BUCKET   = os.environ.get("R2_BUCKET", "astryx-audio")
R2_ENDPOINT = os.environ.get("R2_ENDPOINT", "")
R2_ACCESS   = os.environ.get("R2_ACCESS_KEY", "")
R2_SECRET   = os.environ.get("R2_SECRET_KEY", "")


def check_env():
    missing = [v for v in ("R2_ENDPOINT", "R2_ACCESS_KEY", "R2_SECRET_KEY")
               if not os.environ.get(v)]
    if missing:
        print(f"❌  Missing env vars: {', '.join(missing)}")
        for v in missing:
            print(f"      export {v}=your_value")
        sys.exit(1)


def make_s3():
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS,
        aws_secret_access_key=R2_SECRET,
        region_name="auto",
    )


def key_exists(s3, key):
    try:
        s3.head_object(Bucket=R2_BUCKET, Key=key)
        return True
    except Exception:
        return False


def main():
    check_env()
    try:
        import boto3  # noqa: F401
    except ImportError:
        print("❌  boto3 not installed. Run: pip install boto3 --break-system-packages")
        sys.exit(1)

    if not STAGING_DIR.exists():
        print(f"❌  Staging folder not found: {STAGING_DIR}")
        sys.exit(1)

    files = sorted(STAGING_DIR.rglob("*.mp3"))
    if not files:
        print(f"⚠  No .mp3 files under {STAGING_DIR}")
        sys.exit(0)

    s3 = make_s3()
    uploaded = skipped = 0
    failed = []

    print(f"\n\U0001f3b5  ASTRYX local → R2 upload")
    print(f"    Bucket : {R2_BUCKET}")
    print(f"    Files  : {len(files)}\n")

    for i, path in enumerate(files, 1):
        key = path.relative_to(STAGING_DIR).as_posix()  # earthday/nat/EARTHDAY_NAT_01.mp3
        prefix = f"[{i:2d}/{len(files)}]"
        if key_exists(s3, key):
            print(f"{prefix} ✓ skip   {key}")
            skipped += 1
            continue
        size_kb = path.stat().st_size // 1024
        print(f"{prefix} ↑ upload {key}  ({size_kb:,} KB) ... ", end="", flush=True)
        try:
            s3.upload_file(str(path), R2_BUCKET, key,
                           ExtraArgs={"ContentType": "audio/mpeg"})
            print("✓")
            uploaded += 1
        except Exception as e:
            print(f"FAILED: {e}")
            failed.append(key)

    print(f"\n{'─'*56}")
    print(f"  Done!  uploaded={uploaded}  skipped={skipped}  failed={len(failed)}")
    if failed:
        for f in failed:
            print(f"     ⚠  {f}")
    else:
        print(f"  ✅  All files are in {R2_BUCKET}. They're already registered in the catalog.")


if __name__ == "__main__":
    main()
