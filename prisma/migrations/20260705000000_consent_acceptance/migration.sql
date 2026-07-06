-- LEGAL SHIELD v1 · FIX 1 — informed-consent + assumption-of-risk record.
-- One row per acceptance; a CONSENT_VERSION bump writes a NEW row (old rows
-- are retained as the audit trail, never updated/deleted).

CREATE TABLE "ConsentAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAtAcceptance" TEXT,
    "consentTextHash" TEXT,

    CONSTRAINT "ConsentAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsentAcceptance_userId_consentVersion_idx" ON "ConsentAcceptance"("userId", "consentVersion");

ALTER TABLE "ConsentAcceptance"
    ADD CONSTRAINT "ConsentAcceptance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defense in depth — mirror the enable_rls migration: the app reaches this
-- table ONLY through Prisma (table owner -> bypasses RLS); enabling RLS with
-- no policies closes the Supabase REST/anon-key path to consent PII.
ALTER TABLE "public"."ConsentAcceptance" ENABLE ROW LEVEL SECURITY;
