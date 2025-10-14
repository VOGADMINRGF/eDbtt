-- DropForeignKey
ALTER TABLE "public"."Finding" DROP CONSTRAINT "Finding_claimId_fkey";

-- AlterTable
ALTER TABLE "public"."ExtractedUnit" ADD COLUMN     "statementId" TEXT,
ALTER COLUMN "itemId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ExtractedUnit_statementId_idx" ON "public"."ExtractedUnit"("statementId");

-- AddForeignKey
ALTER TABLE "public"."Finding" ADD CONSTRAINT "Finding_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."FactcheckClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
