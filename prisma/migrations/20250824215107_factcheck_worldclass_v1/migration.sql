-- CreateEnum
CREATE TYPE "public"."Stance" AS ENUM ('FOR', 'AGAINST', 'NEUTRAL');

-- CreateTable
CREATE TABLE "public"."FactcheckJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactcheckJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FactcheckClaim" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "topic" TEXT,
    "falsifiable" BOOLEAN NOT NULL DEFAULT true,
    "frames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rhetoricalFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactcheckClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderRun" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "costTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsensusRun" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "balanceScore" DOUBLE PRECISION NOT NULL,
    "diversityIndex" DOUBLE PRECISION NOT NULL,
    "providers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsensusRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evidence" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "stance" "public"."Stance" NOT NULL,
    "snapshotHash" TEXT,
    "firstSeenAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "trustScore" INTEGER,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SourceTrust" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "bayesScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "extScore" INTEGER,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "clusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceTrust_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerdictVersion" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersedes" TEXT,

    CONSTRAINT "VerdictVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FactcheckResult" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "rawOutput" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactcheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FactcheckJob_jobId_key" ON "public"."FactcheckJob"("jobId");

-- CreateIndex
CREATE INDEX "FactcheckJob_status_createdAt_idx" ON "public"."FactcheckJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FactcheckClaim_jobId_createdAt_idx" ON "public"."FactcheckClaim"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderRun_claimId_provider_idx" ON "public"."ProviderRun"("claimId", "provider");

-- CreateIndex
CREATE INDEX "ProviderRun_createdAt_idx" ON "public"."ProviderRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsensusRun_claimId_key" ON "public"."ConsensusRun"("claimId");

-- CreateIndex
CREATE INDEX "Evidence_claimId_domain_idx" ON "public"."Evidence"("claimId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "SourceTrust_domain_key" ON "public"."SourceTrust"("domain");

-- CreateIndex
CREATE INDEX "SourceTrust_flagged_updatedAt_idx" ON "public"."SourceTrust"("flagged", "updatedAt");

-- CreateIndex
CREATE INDEX "VerdictVersion_claimId_asOf_idx" ON "public"."VerdictVersion"("claimId", "asOf");

-- CreateIndex
CREATE INDEX "FactcheckResult_jobId_createdAt_idx" ON "public"."FactcheckResult"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_at_idx" ON "public"."AuditLog"("entityType", "at");

-- AddForeignKey
ALTER TABLE "public"."FactcheckClaim" ADD CONSTRAINT "FactcheckClaim_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."FactcheckJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderRun" ADD CONSTRAINT "ProviderRun_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."FactcheckClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsensusRun" ADD CONSTRAINT "ConsensusRun_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."FactcheckClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."FactcheckClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VerdictVersion" ADD CONSTRAINT "VerdictVersion_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."FactcheckClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FactcheckResult" ADD CONSTRAINT "FactcheckResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."FactcheckJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
