-- OUTCOME CAPTURE (Positioning Roadmap 0.2, 2026-09-09)
-- Before/after energy, protocol used, and chart signature become queryable
-- columns on ChamberSession (RLS is already ON for this table — see
-- 20260701000001_enable_rls; columns inherit it, nothing to re-enable).
-- Subjective felt-state only; no clinical fields; no free text.

ALTER TABLE "ChamberSession" ADD COLUMN "energyBefore"    INTEGER;
ALTER TABLE "ChamberSession" ADD COLUMN "energyAfter"     INTEGER;
ALTER TABLE "ChamberSession" ADD COLUMN "carrierPlanet"   TEXT;
ALTER TABLE "ChamberSession" ADD COLUMN "signalState"     TEXT;
ALTER TABLE "ChamberSession" ADD COLUMN "forkSequence"    JSONB;
ALTER TABLE "ChamberSession" ADD COLUMN "intention"       JSONB;
ALTER TABLE "ChamberSession" ADD COLUMN "chartHash"       TEXT;
ALTER TABLE "ChamberSession" ADD COLUMN "standardVersion" TEXT;
ALTER TABLE "ChamberSession" ADD COLUMN "outcome"         JSONB;
ALTER TABLE "ChamberSession" ADD COLUMN "outcomeAt"       TIMESTAMP(3);

CREATE INDEX "ChamberSession_chartHash_idx" ON "ChamberSession"("chartHash");
CREATE INDEX "ChamberSession_carrierPlanet_signalState_idx" ON "ChamberSession"("carrierPlanet", "signalState");
