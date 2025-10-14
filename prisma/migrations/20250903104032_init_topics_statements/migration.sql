/*
  Warnings:

  - The `locale` column on the `Topic` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AnswerOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConsensusRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Evidence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExtractedUnit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FactcheckClaim` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FactcheckJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FactcheckResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Finding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProviderRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Region` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RegionClosure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SourceTrust` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TopicTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerdictVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."StatementStatus" AS ENUM ('draft', 'published', 'archived');

-- DropForeignKey
ALTER TABLE "public"."AnswerOption" DROP CONSTRAINT "AnswerOption_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ConsensusRun" DROP CONSTRAINT "ConsensusRun_claimId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ContentItem" DROP CONSTRAINT "ContentItem_regionEffectiveId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ContentItem" DROP CONSTRAINT "ContentItem_regionManualId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ContentItem" DROP CONSTRAINT "ContentItem_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Evidence" DROP CONSTRAINT "Evidence_claimId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExtractedUnit" DROP CONSTRAINT "ExtractedUnit_claimId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExtractedUnit" DROP CONSTRAINT "ExtractedUnit_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FactcheckClaim" DROP CONSTRAINT "FactcheckClaim_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FactcheckResult" DROP CONSTRAINT "FactcheckResult_jobId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Finding" DROP CONSTRAINT "Finding_claimId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ItemTag" DROP CONSTRAINT "ItemTag_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ItemTag" DROP CONSTRAINT "ItemTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProviderRun" DROP CONSTRAINT "ProviderRun_claimId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Region" DROP CONSTRAINT "Region_parentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RegionClosure" DROP CONSTRAINT "RegionClosure_ancestorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RegionClosure" DROP CONSTRAINT "RegionClosure_descendantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TopicTag" DROP CONSTRAINT "TopicTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TopicTag" DROP CONSTRAINT "TopicTag_topicId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VerdictVersion" DROP CONSTRAINT "VerdictVersion_claimId_fkey";

-- DropIndex
DROP INDEX "public"."Topic_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Topic_locale_idx";

-- AlterTable
ALTER TABLE "public"."Topic" DROP COLUMN "locale",
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'de';

-- DropTable
DROP TABLE "public"."AnswerOption";

-- DropTable
DROP TABLE "public"."AuditLog";

-- DropTable
DROP TABLE "public"."ConsensusRun";

-- DropTable
DROP TABLE "public"."ContentItem";

-- DropTable
DROP TABLE "public"."Evidence";

-- DropTable
DROP TABLE "public"."ExtractedUnit";

-- DropTable
DROP TABLE "public"."FactcheckClaim";

-- DropTable
DROP TABLE "public"."FactcheckJob";

-- DropTable
DROP TABLE "public"."FactcheckResult";

-- DropTable
DROP TABLE "public"."Finding";

-- DropTable
DROP TABLE "public"."ItemTag";

-- DropTable
DROP TABLE "public"."ProviderRun";

-- DropTable
DROP TABLE "public"."Region";

-- DropTable
DROP TABLE "public"."RegionClosure";

-- DropTable
DROP TABLE "public"."SourceTrust";

-- DropTable
DROP TABLE "public"."Tag";

-- DropTable
DROP TABLE "public"."TopicTag";

-- DropTable
DROP TABLE "public"."VerdictVersion";

-- DropEnum
DROP TYPE "public"."ContentKind";

-- DropEnum
DROP TYPE "public"."Interest";

-- DropEnum
DROP TYPE "public"."Locale";

-- DropEnum
DROP TYPE "public"."PublishStatus";

-- DropEnum
DROP TYPE "public"."RegionMode";

-- DropEnum
DROP TYPE "public"."ReviewStatus";

-- DropEnum
DROP TYPE "public"."Stance";

-- DropEnum
DROP TYPE "public"."Triage";

-- DropEnum
DROP TYPE "public"."UnitKind";

-- CreateTable
CREATE TABLE "public"."Statement" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."StatementStatus" NOT NULL DEFAULT 'published',
    "authorName" TEXT,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Statement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Statement_topicId_order_idx" ON "public"."Statement"("topicId", "order");

-- CreateIndex
CREATE INDEX "Statement_status_idx" ON "public"."Statement"("status");

-- AddForeignKey
ALTER TABLE "public"."Statement" ADD CONSTRAINT "Statement_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
