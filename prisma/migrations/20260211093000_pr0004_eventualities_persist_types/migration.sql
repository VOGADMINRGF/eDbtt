-- PR-0004 Block D: Eventualities / DecisionTree persistence

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'ScenarioOption' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."ScenarioOption" AS ENUM ('pro', 'neutral', 'contra');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."EventualitySnapshot" (
  "id" TEXT NOT NULL,
  "contributionId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "userHash" TEXT,
  "userIdMasked" TEXT,
  "nodesCount" INTEGER NOT NULL,
  "treesCount" INTEGER NOT NULL,
  "consequences" JSONB,
  "responsibilities" JSONB,
  "responsibilityPaths" JSONB,
  "consequencesCount" INTEGER,
  "responsibilitiesCount" INTEGER,
  "pathsCount" INTEGER,
  "reviewed" BOOLEAN NOT NULL DEFAULT false,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventualitySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventualitySnapshot_contributionId_key"
  ON "public"."EventualitySnapshot"("contributionId");

CREATE INDEX IF NOT EXISTS "EventualitySnapshot_reviewed_createdAt_idx"
  ON "public"."EventualitySnapshot"("reviewed", "createdAt");

CREATE INDEX IF NOT EXISTS "EventualitySnapshot_createdAt_idx"
  ON "public"."EventualitySnapshot"("createdAt");

CREATE TABLE IF NOT EXISTS "public"."EventualityNode" (
  "id" TEXT NOT NULL,
  "contributionId" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "statementId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "option" "public"."ScenarioOption",
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventualityNode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventualityNode_nodeId_key"
  ON "public"."EventualityNode"("nodeId");

CREATE INDEX IF NOT EXISTS "EventualityNode_contributionId_statementId_idx"
  ON "public"."EventualityNode"("contributionId", "statementId");

CREATE INDEX IF NOT EXISTS "EventualityNode_statementId_option_idx"
  ON "public"."EventualityNode"("statementId", "option");

CREATE TABLE IF NOT EXISTS "public"."DecisionTree" (
  "id" TEXT NOT NULL,
  "contributionId" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "rootStatementId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionTree_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DecisionTree_treeId_key"
  ON "public"."DecisionTree"("treeId");

CREATE INDEX IF NOT EXISTS "DecisionTree_contributionId_rootStatementId_idx"
  ON "public"."DecisionTree"("contributionId", "rootStatementId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventualityNode_contributionId_fkey'
  ) THEN
    ALTER TABLE "public"."EventualityNode"
      ADD CONSTRAINT "EventualityNode_contributionId_fkey"
      FOREIGN KEY ("contributionId")
      REFERENCES "public"."EventualitySnapshot"("contributionId")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DecisionTree_contributionId_fkey'
  ) THEN
    ALTER TABLE "public"."DecisionTree"
      ADD CONSTRAINT "DecisionTree_contributionId_fkey"
      FOREIGN KEY ("contributionId")
      REFERENCES "public"."EventualitySnapshot"("contributionId")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
