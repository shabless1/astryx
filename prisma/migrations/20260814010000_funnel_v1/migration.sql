-- FUNNEL v1 (2026-08-14)
-- Fork buyers become tracked leads at the moment they pay, and the trial
-- lifecycle mails carry send-once stamps so the daily cron is safe to re-run.

-- ── Send-once stamps for the trial lifecycle mails ───────────────────────────
ALTER TABLE "User" ADD COLUMN "trialEndingEmailAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "trialEndedEmailAt"  TIMESTAMP(3);

-- ── Every fork buyer, account or not ─────────────────────────────────────────
CREATE TABLE "BuyerLead" (
    "id"             TEXT NOT NULL,
    "email"          TEXT NOT NULL,
    "name"           TEXT,
    "product"        TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "purchasedAt"    TIMESTAMP(3) NOT NULL,
    "welcomeEmailAt" TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BuyerLead_shopifyOrderId_key" ON "BuyerLead"("shopifyOrderId");
CREATE INDEX "BuyerLead_email_idx" ON "BuyerLead"("email");

-- RLS on, no policy — matches every other table here. Prisma connects as the
-- owning role and bypasses; anon/authenticated get nothing.
ALTER TABLE "BuyerLead" ENABLE ROW LEVEL SECURITY;

-- Backfill the founding fork buyers from their existing entitlement rows, so
-- the never-activated report is complete from its first run. welcomeEmailAt is
-- stamped NOW for all of them: they bought before this funnel existed and must
-- never receive a "your forks are on the way" mail weeks after delivery.
INSERT INTO "BuyerLead" ("id", "email", "product", "shopifyOrderId", "purchasedAt", "welcomeEmailAt")
SELECT 'lead_' || e."id", e."email", 'forks', e."shopifyOrderId", e."createdAt", CURRENT_TIMESTAMP
  FROM "Entitlement" e
 WHERE e."source" = 'shopify_fork_kit'
   AND e."shopifyOrderId" IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM "BuyerLead" b WHERE b."shopifyOrderId" = e."shopifyOrderId");
