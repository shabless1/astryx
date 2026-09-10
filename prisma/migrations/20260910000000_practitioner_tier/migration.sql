-- PRACTITIONER TIER (SHA ruling 2026-09-10)
-- The one-sentence blocker from the portal audit: there was no practitioner
-- tier anywhere in the money path, so the portal was free to any subscriber who
-- opened Settings. `plan` encodes DURATION (monthly/yearly/lifetime); it never
-- encoded WHAT you bought. This column does.
--
-- Two values only. SHA cut the Verified tier on 2026-09-10 ("just one price for
-- practitioner $39.95, we don't need verification, that's a bit much") —
-- Astryx builds systems and tools and will not act as a credentialing body.
--
-- Default 'individual' so every existing row keeps exactly the access it has.
-- RLS is already ON for this table (20260701000001_enable_rls); a new column
-- inherits it, so there is nothing to re-enable here.

ALTER TABLE "Entitlement" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'individual';

CREATE INDEX "Entitlement_email_tier_idx" ON "Entitlement"("email", "tier");
