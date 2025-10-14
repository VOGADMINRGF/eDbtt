-- CreateEnum
CREATE TYPE "public"."ContentKind" AS ENUM ('SWIPE', 'EVENT', 'SUNDAY_POLL');

-- CreateEnum
CREATE TYPE "public"."PublishStatus" AS ENUM ('draft', 'review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "public"."RegionMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."Locale" AS ENUM ('de', 'en', 'fr', 'it', 'es', 'pl', 'uk', 'ru', 'tr', 'hi', 'zh', 'ar');

-- CreateTable
CREATE TABLE "public"."Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "locale" "public"."Locale" NOT NULL DEFAULT 'de',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TopicTag" (
    "topicId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TopicTag_pkey" PRIMARY KEY ("topicId","tagId")
);

-- CreateTable
CREATE TABLE "public"."ItemTag" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ItemTag_pkey" PRIMARY KEY ("itemId","tagId")
);

-- CreateTable
CREATE TABLE "public"."Region" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "parentId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegionClosure" (
    "ancestorId" TEXT NOT NULL,
    "descendantId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "RegionClosure_pkey" PRIMARY KEY ("ancestorId","descendantId")
);

-- CreateTable
CREATE TABLE "public"."ContentItem" (
    "id" TEXT NOT NULL,
    "kind" "public"."ContentKind" NOT NULL,
    "topicId" TEXT NOT NULL,
    "locale" "public"."Locale" NOT NULL DEFAULT 'de',
    "title" TEXT,
    "text" TEXT NOT NULL,
    "richText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'draft',
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "regionMode" "public"."RegionMode" NOT NULL DEFAULT 'AUTO',
    "regionManualId" TEXT,
    "regionAuto" JSONB,
    "regionEffectiveId" TEXT,
    "validation" JSONB,
    "meta" JSONB,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnswerOption" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "exclusive" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,

    CONSTRAINT "AnswerOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "public"."Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_locale_idx" ON "public"."Topic"("locale");

-- CreateIndex
CREATE INDEX "Topic_createdAt_idx" ON "public"."Topic"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "public"."Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "public"."Region"("code");

-- CreateIndex
CREATE INDEX "Region_level_idx" ON "public"."Region"("level");

-- CreateIndex
CREATE INDEX "RegionClosure_ancestorId_depth_idx" ON "public"."RegionClosure"("ancestorId", "depth");

-- CreateIndex
CREATE INDEX "RegionClosure_descendantId_depth_idx" ON "public"."RegionClosure"("descendantId", "depth");

-- CreateIndex
CREATE INDEX "ContentItem_kind_status_locale_idx" ON "public"."ContentItem"("kind", "status", "locale");

-- CreateIndex
CREATE INDEX "ContentItem_publishAt_idx" ON "public"."ContentItem"("publishAt");

-- CreateIndex
CREATE INDEX "ContentItem_topicId_idx" ON "public"."ContentItem"("topicId");

-- CreateIndex
CREATE INDEX "ContentItem_regionEffectiveId_idx" ON "public"."ContentItem"("regionEffectiveId");

-- CreateIndex
CREATE INDEX "AnswerOption_itemId_order_idx" ON "public"."AnswerOption"("itemId", "order");

-- AddForeignKey
ALTER TABLE "public"."TopicTag" ADD CONSTRAINT "TopicTag_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TopicTag" ADD CONSTRAINT "TopicTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemTag" ADD CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemTag" ADD CONSTRAINT "ItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Region" ADD CONSTRAINT "Region_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionClosure" ADD CONSTRAINT "RegionClosure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "public"."Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegionClosure" ADD CONSTRAINT "RegionClosure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "public"."Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentItem" ADD CONSTRAINT "ContentItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentItem" ADD CONSTRAINT "ContentItem_regionManualId_fkey" FOREIGN KEY ("regionManualId") REFERENCES "public"."Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentItem" ADD CONSTRAINT "ContentItem_regionEffectiveId_fkey" FOREIGN KEY ("regionEffectiveId") REFERENCES "public"."Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnswerOption" ADD CONSTRAINT "AnswerOption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
