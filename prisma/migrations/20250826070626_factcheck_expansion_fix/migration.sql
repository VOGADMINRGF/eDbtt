/*
  Warnings:

  - A unique constraint covering the columns `[canonicalKey]` on the table `FactcheckClaim` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `canonicalKey` to the `FactcheckClaim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FactcheckClaim` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UnitKind" AS ENUM ('claim', 'opinion', 'policy', 'question', 'prediction');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'VERIFIED', 'REFUTED', 'MIXED', 'STALE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."Interest" AS ENUM ('interested', 'ignored', 'undecided');

-- CreateEnum
CREATE TYPE "public"."Triage" AS ENUM ('none', 'watchlist', 'escalate');

-- AlterTable
ALTER TABLE "public"."FactcheckClaim" ADD COLUMN     "canonicalKey" TEXT NOT NULL,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "status" "public"."ReviewStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "timeframe" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."ExtractedUnit" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "kind" "public"."UnitKind" NOT NULL,
    "text" TEXT NOT NULL,
    "spanStart" INTEGER NOT NULL,
    "spanEnd" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "scope" TEXT,
    "timeframe" TEXT,
    "claimId" TEXT,
    "interest" "public"."Interest" NOT NULL DEFAULT 'undecided',
    "triage" "public"."Triage" NOT NULL DEFAULT 'none',
    "editorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractedUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Finding" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "metrics" JSONB,
    "comparedJurisdictions" JSONB,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtractedUnit_kind_canonicalKey_idx" ON "public"."ExtractedUnit"("kind", "canonicalKey");

-- CreateIndex
CREATE INDEX "ExtractedUnit_interest_triage_idx" ON "public"."ExtractedUnit"("interest", "triage");

-- CreateIndex
CREATE INDEX "ExtractedUnit_itemId_idx" ON "public"."ExtractedUnit"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Finding_claimId_key" ON "public"."Finding"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "FactcheckClaim_canonicalKey_key" ON "public"."FactcheckClaim"("canonicalKey");

-- CreateIndex
CREATE INDEX "FactcheckClaim_status_updatedAt_idx" ON "public"."FactcheckClaim"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "public"."ExtractedUnit" ADD CONSTRAINT "ExtractedUnit_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExtractedUnit" ADD CONSTRAINT "ExtractedUnit_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."FactcheckClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Finding" ADD CONSTRAINT "Finding_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."FactcheckClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
