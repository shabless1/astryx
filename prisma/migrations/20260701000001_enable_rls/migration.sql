-- Directive v4.0 Fix 1 — defense in depth. The app reaches these tables ONLY
-- through Prisma as role astryx_prisma (table owner -> bypasses RLS). Enabling
-- RLS with no policies closes the Supabase REST/anon-key path to user PII.
-- NOTE: any future migration that creates a table must ENABLE ROW LEVEL
-- SECURITY on it the same way.
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Entitlement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Reading" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ChamberSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
