-- SUBSCRIPTION GATE v1 (2026-08-14)
-- Time-bound entitlements + a server-side trial clock, mirroring the Sacred
-- Vault protocol: only the ASTRYX subscription product grants access, the
-- grant carries an expiry, and a lapsed rebill simply lets access run out.

-- ── Entitlement: time-bound access ───────────────────────────────────────────
ALTER TABLE "Entitlement" ADD COLUMN "plan"              TEXT NOT NULL DEFAULT 'lifetime';
ALTER TABLE "Entitlement" ADD COLUMN "shopifyCustomerId" TEXT;
ALTER TABLE "Entitlement" ADD COLUMN "currentPeriodEnd"  TIMESTAMP(3);
ALTER TABLE "Entitlement" ADD COLUMN "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Entitlement_email_status_idx" ON "Entitlement"("email", "status");

-- GRANDFATHER (SHA ruling 2026-08-14): every entitlement that exists at this
-- moment belongs to a founding $499 fork buyer or a hand-granted beta email.
-- They keep LIFETIME access — currentPeriodEnd stays NULL, which never lapses.
-- Fork orders paid after this migration get the standard 30-day trial instead.
UPDATE "Entitlement"
   SET "plan" = 'lifetime', "currentPeriodEnd" = NULL
 WHERE "status" = 'active';

-- ACTIVATION FIX — Nina Johnson bought the forks (order #4035) under
-- nijohn7@yahoo.com but created her ASTRYX account under nijohn7@gmail.com, so
-- the email-keyed entitlement never reached her and she has been sitting behind
-- the trial wall as a paying founding buyer. Same first + last name on the
-- Shopify customer record and the app account; verified 2026-08-14.
INSERT INTO "Entitlement" ("id", "email", "source", "plan", "status", "currentPeriodEnd")
SELECT 'ent_nina_gmail_activation', 'nijohn7@gmail.com', 'manual_buyer_email_match', 'lifetime', 'active', NULL
 WHERE NOT EXISTS (SELECT 1 FROM "Entitlement" WHERE "email" = 'nijohn7@gmail.com');

-- ── User: the 30-day trial clock moves server-side ───────────────────────────
-- It previously lived only in localStorage, so clearing site data or opening
-- the app on a second device handed out a fresh 30 days.
ALTER TABLE "User" ADD COLUMN "trialStartedAt" TIMESTAMP(3);

-- Seed existing accounts from their signup date rather than starting everyone
-- over: for every account on the books, first onboarding happened within a day
-- of signup, so this reproduces the clock they already see locally.
UPDATE "User" SET "trialStartedAt" = "createdAt" WHERE "trialStartedAt" IS NULL;
