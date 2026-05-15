import { coreCol, ObjectId } from "@core/db/triMongo";
import { z } from "zod";
import type { Region } from "../contracts";
import {
  listDerivedRegionParticipationSignals,
  parseRegionParticipationReviewItem,
  parseRegionParticipationSignal,
  type RegionParticipationAggregationMode,
  type RegionParticipationPrivacyMode,
  type RegionParticipationReviewItem,
  type RegionParticipationReviewStatus,
  type RegionParticipationSignal,
  type RegionParticipationSignalSource,
  type RegionParticipationSignalSourceClass,
  type RegionParticipationSignalSourceType,
} from "../regionParticipationSignals";

export const REGION_PARTICIPATION_SIGNAL_REVIEW_DECISIONS = [
  "accept",
  "reject",
  "archive",
  "request_region_review",
  "confirm_region",
  "revoke",
  "restore_to_review",
] as const;

export type RegionParticipationSignalReviewDecision =
  (typeof REGION_PARTICIPATION_SIGNAL_REVIEW_DECISIONS)[number];

const RegionParticipationSignalRecordSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1).nullable(),
    proposedRegionId: z.string().trim().min(1).nullable(),
    needsRegionReview: z.boolean(),
    sourceClass: z.literal("participation"),
    sourceType: z.enum([
      "public_claim",
      "public_contribution",
      "public_question",
      "public_source_hint",
      "swipe_interest",
      "swipe_counterpoint",
      "saved_topic",
      "support_signal",
    ]),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    publicSafeTitle: z.string().trim().min(1).nullable(),
    publicSafeSummary: z.string().trim().min(1).nullable(),
    detectedTopics: z.array(z.string().trim().min(1)).default([]),
    detectedPlaces: z.array(z.string().trim().min(1)).default([]),
    matchedPlaces: z.array(z.string().trim().min(1)).default([]),
    matchedRegionIds: z.array(z.string().trim().min(1)).default([]),
    relatedClaimIds: z.array(z.string().trim().min(1)).default([]),
    relatedContributionIds: z.array(z.string().trim().min(1)).default([]),
    relatedStatementIds: z.array(z.string().trim().min(1)).default([]),
    relatedDossierIds: z.array(z.string().trim().min(1)).default([]),
    relatedAnlassraumIds: z.array(z.string().trim().min(1)).default([]),
    aggregationMode: z.enum(["single_review_item", "aggregate_only", "anonymized_count"]),
    privacyMode: z.enum(["no_personal_data", "anonymized", "review_restricted"]),
    reviewStatus: z.enum([
      "draft",
      "needs_review",
      "needs_region_review",
      "accepted",
      "rejected",
      "archived",
      "revoked",
    ]),
    confidence: z.number().min(0).max(1),
    provenance: z
      .object({
        sourceKind: z.enum(["runtime", "fixture", "seed"]),
        sourceCollection: z.string().trim().min(1).nullable().default(null),
        sourceRefId: z.string().trim().min(1).nullable().default(null),
        isFixture: z.boolean(),
        isPilotFixture: z.boolean(),
        notRealNews: z.boolean(),
        notProductionData: z.boolean(),
        notOfficial: z.literal(true),
        notRepresentative: z.literal(true),
      })
      .strict(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    reviewedBy: z.string().trim().min(1).nullable(),
    reviewedAt: z.string().datetime({ offset: true }).nullable(),
    noAutoPublish: z.literal(true),
    noAutoCreateDossier: z.literal(true),
    noAutoCreateAnlassraum: z.literal(true),
    noPersonalProfiling: z.literal(true),
    noPoliticalScoring: z.literal(true),
    noRepresentativeClaim: z.literal(true),
    noTenderMonitoring: z.literal(true),
    noProcurementMonitoring: z.literal(true),
  })
  .strict();

export type RegionParticipationSignalRecord = z.infer<
  typeof RegionParticipationSignalRecordSchema
>;

const RegionParticipationSignalReviewSchema = z
  .object({
    id: z.string().trim().min(1),
    signalId: z.string().trim().min(1),
    decision: z.enum(REGION_PARTICIPATION_SIGNAL_REVIEW_DECISIONS),
    previousStatus: z.enum([
      "draft",
      "needs_review",
      "needs_region_review",
      "accepted",
      "rejected",
      "archived",
      "revoked",
    ]),
    nextStatus: z.enum([
      "draft",
      "needs_review",
      "needs_region_review",
      "accepted",
      "rejected",
      "archived",
      "revoked",
    ]),
    regionId: z.string().trim().min(1).nullable(),
    note: z.string().trim().min(1).nullable(),
    reviewedBy: z.string().trim().min(1),
    reviewedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type RegionParticipationSignalReview = z.infer<
  typeof RegionParticipationSignalReviewSchema
>;

const RegionParticipationSignalAuditEventSchema = z
  .object({
    id: z.string().trim().min(1),
    signalId: z.string().trim().min(1),
    eventType: z.enum([
      "record_created",
      "record_synced",
      "reviewed",
      "region_confirmed",
      "archived",
      "revoked",
    ]),
    previousStatus: z.enum([
      "draft",
      "needs_review",
      "needs_region_review",
      "accepted",
      "rejected",
      "archived",
      "revoked",
    ]).nullable(),
    nextStatus: z.enum([
      "draft",
      "needs_review",
      "needs_region_review",
      "accepted",
      "rejected",
      "archived",
      "revoked",
    ]).nullable(),
    note: z.string().trim().min(1).nullable(),
    regionId: z.string().trim().min(1).nullable(),
    createdBy: z.string().trim().min(1),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type RegionParticipationSignalAuditEvent = z.infer<
  typeof RegionParticipationSignalAuditEventSchema
>;

const RegionParticipationSignalReviewResultSchema = z
  .object({
    ok: z.boolean(),
    blockedReason: z
      .enum([
        "signal_not_found",
        "public_signal_region_unconfirmed",
        "public_signal_privacy_restricted",
        "invalid_decision",
      ])
      .nullable()
      .optional(),
    record: RegionParticipationSignalRecordSchema.nullable().optional(),
    review: RegionParticipationSignalReviewSchema.nullable().optional(),
  })
  .strict();

export type RegionParticipationSignalReviewResult = z.infer<
  typeof RegionParticipationSignalReviewResultSchema
>;

export type ReviewParticipationSignalInput = {
  signalId: string;
  decision: RegionParticipationSignalReviewDecision;
  reviewedBy: string;
  regionId?: string | null;
  note?: string | null;
};

export type ListParticipationSignalsForReviewQuery = {
  regionId?: string | null;
  reviewStatus?: RegionParticipationReviewStatus | "all";
  needsRegionReview?: boolean | null;
  limit?: number;
};

export type ParticipationSignalReviewRuntimeRepo = {
  createParticipationSignalRecord(signal: RegionParticipationSignal): Promise<RegionParticipationSignalRecord>;
  listParticipationSignalsForRegion(regionId: string): Promise<RegionParticipationSignalRecord[]>;
  listParticipationSignalsForReview(
    query?: ListParticipationSignalsForReviewQuery,
  ): Promise<RegionParticipationSignalRecord[]>;
  getParticipationSignalRecordById(id: string): Promise<RegionParticipationSignalRecord | null>;
  reviewParticipationSignal(
    input: ReviewParticipationSignalInput,
  ): Promise<RegionParticipationSignalReviewResult>;
  confirmParticipationSignalRegion(
    signalId: string,
    regionId: string,
    reviewedBy: string,
    note?: string | null,
  ): Promise<RegionParticipationSignalReviewResult>;
  archiveParticipationSignal(
    signalId: string,
    reviewedBy: string,
    note?: string | null,
  ): Promise<RegionParticipationSignalReviewResult>;
  getAcceptedParticipationSignalForDraft(
    signalId: string,
  ): Promise<RegionParticipationSignalRecord | null>;
  appendParticipationSignalAuditEvent(
    event: RegionParticipationSignalAuditEvent,
  ): Promise<void>;
};

const RECORDS_COLLECTION = "edebatte_region_participation_signals";
const REVIEWS_COLLECTION = "edebatte_region_participation_signal_reviews";
const AUDIT_COLLECTION = "edebatte_region_participation_signal_audit_events";

type ParticipationSignalRecordDoc = {
  _id: string;
  record: RegionParticipationSignalRecord;
  createdAt: Date;
  updatedAt: Date;
};

type ParticipationSignalReviewDoc = {
  _id: string;
  review: RegionParticipationSignalReview;
  createdAt: Date;
};

type ParticipationSignalAuditEventDoc = {
  _id: string;
  event: RegionParticipationSignalAuditEvent;
  createdAt: Date;
};

let indexesReady = false;
let repoSingleton: ParticipationSignalReviewRuntimeRepo | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isoNow() {
  return new Date().toISOString();
}

function normalizeLimit(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 100;
  return Math.max(1, Math.min(2000, Math.floor(numeric)));
}

function activeDashboardStatuses(status: RegionParticipationReviewStatus) {
  return status === "needs_review" || status === "accepted";
}

function initialReviewStatus(
  signal: RegionParticipationSignal,
): RegionParticipationReviewStatus {
  if (signal.needsRegionReview) return "needs_region_review";
  if (signal.reviewStatus === "accepted") return "accepted";
  if (signal.reviewStatus === "rejected") return "rejected";
  if (signal.reviewStatus === "archived") return "archived";
  if (signal.reviewStatus === "revoked") return "revoked";
  if (signal.reviewStatus === "draft") return "draft";
  return "needs_review";
}

function buildPublicSafeTitle(signal: RegionParticipationSignal): string | null {
  if (signal.privacyMode === "review_restricted") return null;
  return signal.title;
}

function buildPublicSafeSummary(signal: RegionParticipationSignal): string | null {
  if (signal.privacyMode === "review_restricted") return null;
  return signal.summary;
}

function buildRecordFromSignal(
  signal: RegionParticipationSignal,
  existing?: RegionParticipationSignalRecord | null,
): RegionParticipationSignalRecord {
  const createdAt = existing?.createdAt ?? isoNow();
  const reviewStatus = existing?.reviewStatus ?? initialReviewStatus(signal);
  const proposedRegionId =
    existing?.proposedRegionId ??
    (signal.needsRegionReview ? signal.matchedRegionIds[0] ?? null : signal.regionId);
  const regionId =
    existing?.regionId ??
    (signal.needsRegionReview ? null : signal.regionId);
  return RegionParticipationSignalRecordSchema.parse({
    id: signal.id,
    regionId,
    proposedRegionId,
    needsRegionReview:
      existing?.needsRegionReview ??
      (reviewStatus === "needs_region_review" || signal.needsRegionReview),
    sourceClass: "participation",
    sourceType: signal.sourceType,
    title: signal.title,
    summary: signal.summary,
    publicSafeTitle: existing?.publicSafeTitle ?? buildPublicSafeTitle(signal),
    publicSafeSummary: existing?.publicSafeSummary ?? buildPublicSafeSummary(signal),
    detectedTopics: signal.detectedTopics,
    detectedPlaces: signal.detectedPlaces,
    matchedPlaces: signal.matchedPlaces,
    matchedRegionIds: signal.matchedRegionIds,
    relatedClaimIds: signal.relatedClaimIds,
    relatedContributionIds: signal.relatedContributionIds,
    relatedStatementIds: signal.relatedStatementIds,
    relatedDossierIds: signal.relatedDossierIds,
    relatedAnlassraumIds: signal.relatedAnlassraumIds,
    aggregationMode: signal.aggregationMode,
    privacyMode: signal.privacyMode,
    reviewStatus,
    confidence: signal.confidence,
    provenance: signal.source,
    createdAt,
    updatedAt: isoNow(),
    reviewedBy: existing?.reviewedBy ?? null,
    reviewedAt: existing?.reviewedAt ?? null,
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  });
}

function buildGenericRestrictedTitle(
  sourceType: RegionParticipationSignalSourceType,
): string {
  switch (sourceType) {
    case "public_source_hint":
      return "Öffentlicher Quellenhinweis";
    case "public_question":
      return "Öffentliche Frage";
    default:
      return "Öffentliches Beteiligungssignal";
  }
}

function buildGenericRestrictedSummary(record: RegionParticipationSignalRecord): string {
  if (record.sourceType === "public_source_hint") {
    return "Reviewbeschränkter öffentlicher Quellenhinweis. Details bleiben bis zur Prüfung reduziert.";
  }
  return "Reviewbeschränktes öffentliches Beteiligungssignal. Details bleiben bis zur Prüfung reduziert.";
}

export function serializeParticipationSignalForDashboard(
  record: RegionParticipationSignalRecord,
): RegionParticipationSignal | null {
  if (!record.regionId) return null;
  const title =
    record.publicSafeTitle ??
    (record.privacyMode === "review_restricted"
      ? buildGenericRestrictedTitle(record.sourceType)
      : record.title);
  const summary =
    record.publicSafeSummary ??
    (record.privacyMode === "review_restricted"
      ? buildGenericRestrictedSummary(record)
      : record.summary);

  return parseRegionParticipationSignal({
    id: record.id,
    regionId: record.regionId,
    sourceClass: record.sourceClass,
    sourceType: record.sourceType,
    title,
    summary,
    relatedClaimIds: record.relatedClaimIds,
    relatedContributionIds: record.relatedContributionIds,
    relatedStatementIds: record.relatedStatementIds,
    relatedDossierIds: record.relatedDossierIds,
    relatedAnlassraumIds: record.relatedAnlassraumIds,
    detectedTopics: record.detectedTopics,
    detectedPlaces: record.detectedPlaces,
    matchedPlaces: record.matchedPlaces,
    matchedRegionIds: record.matchedRegionIds,
    needsRegionReview: false,
    aggregationMode: record.aggregationMode,
    privacyMode: record.privacyMode,
    reviewStatus: record.reviewStatus,
    confidence: record.confidence,
    source: record.provenance as RegionParticipationSignalSource,
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  });
}

export function serializeParticipationReviewItem(
  record: RegionParticipationSignalRecord,
): RegionParticipationReviewItem {
  return parseRegionParticipationReviewItem({
    id: record.id,
    regionId: record.regionId ?? record.proposedRegionId ?? "needs-region-review",
    title:
      record.publicSafeTitle ??
      (record.privacyMode === "review_restricted"
        ? buildGenericRestrictedTitle(record.sourceType)
        : record.title),
    sourceType: record.sourceType,
    reviewStatus: record.reviewStatus,
    aggregationMode: record.aggregationMode,
    privacyMode: record.privacyMode,
    confidence: record.confidence,
    summary:
      record.publicSafeSummary ??
      (record.privacyMode === "review_restricted"
        ? buildGenericRestrictedSummary(record)
        : record.summary),
    needsRegionReview: record.needsRegionReview,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
  });
}

async function ensureMongoIndexes() {
  if (indexesReady) return;
  const [records, reviews, audit] = await Promise.all([
    coreCol<ParticipationSignalRecordDoc>(RECORDS_COLLECTION),
    coreCol<ParticipationSignalReviewDoc>(REVIEWS_COLLECTION),
    coreCol<ParticipationSignalAuditEventDoc>(AUDIT_COLLECTION),
  ]);
  await Promise.all([
    records.createIndex({ "record.regionId": 1, "record.reviewStatus": 1 }),
    records.createIndex({ "record.proposedRegionId": 1, "record.reviewStatus": 1 }),
    records.createIndex({ "record.needsRegionReview": 1, "record.reviewStatus": 1 }),
    records.createIndex({ "record.sourceType": 1, "record.createdAt": -1 }),
    records.createIndex({ "record.privacyMode": 1, "record.createdAt": -1 }),
    reviews.createIndex({ "review.signalId": 1, createdAt: -1 }),
    audit.createIndex({ "event.signalId": 1, createdAt: -1 }),
  ]);
  indexesReady = true;
}

function mapRecordDoc(
  doc: ParticipationSignalRecordDoc | null,
): RegionParticipationSignalRecord | null {
  if (!doc?.record) return null;
  return clone(doc.record);
}

async function appendAuditEventMongo(
  event: RegionParticipationSignalAuditEvent,
) {
  await ensureMongoIndexes();
  const col = await coreCol<ParticipationSignalAuditEventDoc>(AUDIT_COLLECTION);
  await col.insertOne({
    _id: event.id,
    event: clone(event),
    createdAt: new Date(event.createdAt),
  });
}

async function appendReviewMongo(review: RegionParticipationSignalReview) {
  await ensureMongoIndexes();
  const col = await coreCol<ParticipationSignalReviewDoc>(REVIEWS_COLLECTION);
  await col.insertOne({
    _id: review.id,
    review: clone(review),
    createdAt: new Date(review.reviewedAt),
  });
}

function regionReviewVisibleFor(
  record: RegionParticipationSignalRecord,
  regionId: string,
) {
  return (
    record.reviewStatus === "needs_region_review" &&
    (record.proposedRegionId === regionId || record.matchedRegionIds.includes(regionId))
  );
}

function nextStatusForDecision(
  record: RegionParticipationSignalRecord,
  input: ReviewParticipationSignalInput,
): RegionParticipationReviewStatus | null {
  switch (input.decision) {
    case "accept":
      if (!record.regionId || record.needsRegionReview) return null;
      if (
        record.privacyMode === "review_restricted" &&
        (!record.publicSafeTitle || !record.publicSafeSummary)
      ) {
        return null;
      }
      return "accepted";
    case "reject":
      return "rejected";
    case "archive":
      return "archived";
    case "request_region_review":
      return "needs_region_review";
    case "confirm_region":
      return record.reviewStatus === "accepted" ? "accepted" : "needs_review";
    case "revoke":
      return "revoked";
    case "restore_to_review":
      return record.regionId ? "needs_review" : "needs_region_review";
    default:
      return null;
  }
}

function reviewBlockedReason(
  record: RegionParticipationSignalRecord,
  input: ReviewParticipationSignalInput,
): RegionParticipationSignalReviewResult["blockedReason"] {
  if (input.decision === "accept" && (!record.regionId || record.needsRegionReview)) {
    return "public_signal_region_unconfirmed";
  }
  if (
    input.decision === "accept" &&
    record.privacyMode === "review_restricted" &&
    (!record.publicSafeTitle || !record.publicSafeSummary)
  ) {
    return "public_signal_privacy_restricted";
  }
  return "invalid_decision";
}

function buildUpdatedRecordFromDecision(
  record: RegionParticipationSignalRecord,
  input: ReviewParticipationSignalInput,
  nextStatus: RegionParticipationReviewStatus,
): RegionParticipationSignalRecord {
  const reviewedAt = isoNow();
  const confirmedRegionId =
    input.decision === "confirm_region" ? String(input.regionId ?? "").trim() || null : record.regionId;

  return RegionParticipationSignalRecordSchema.parse({
    ...record,
    regionId:
      input.decision === "request_region_review"
        ? null
        : confirmedRegionId ?? record.regionId,
    proposedRegionId:
      input.decision === "confirm_region"
        ? confirmedRegionId
        : input.decision === "request_region_review"
          ? String(input.regionId ?? record.regionId ?? record.proposedRegionId ?? "").trim() || null
          : record.proposedRegionId,
    needsRegionReview: nextStatus === "needs_region_review",
    reviewStatus: nextStatus,
    reviewedBy: input.reviewedBy,
    reviewedAt,
    updatedAt: reviewedAt,
  });
}

export function createMongoParticipationSignalReviewRuntimeRepo(): ParticipationSignalReviewRuntimeRepo {
  return {
    async createParticipationSignalRecord(signal) {
      await ensureMongoIndexes();
      const col = await coreCol<ParticipationSignalRecordDoc>(RECORDS_COLLECTION);
      const existing = mapRecordDoc(await col.findOne({ _id: signal.id }));
      const record = buildRecordFromSignal(signal, existing);
      const now = new Date();
      await col.updateOne(
        { _id: record.id },
        {
          $set: {
            record: clone(record),
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true },
      );
      await appendAuditEventMongo(
        RegionParticipationSignalAuditEventSchema.parse({
          id: new ObjectId().toHexString(),
          signalId: record.id,
          eventType: existing ? "record_synced" : "record_created",
          previousStatus: existing?.reviewStatus ?? null,
          nextStatus: record.reviewStatus,
          note: null,
          regionId: record.regionId ?? record.proposedRegionId ?? null,
          createdBy: "system_sync",
          createdAt: isoNow(),
        }),
      );
      return record;
    },

    async listParticipationSignalsForRegion(regionId) {
      await ensureMongoIndexes();
      const col = await coreCol<ParticipationSignalRecordDoc>(RECORDS_COLLECTION);
      const docs = await col
        .find({ "record.regionId": regionId })
        .sort({ "record.updatedAt": -1 })
        .toArray();
      return docs
        .map((doc) => mapRecordDoc(doc))
        .filter((record): record is RegionParticipationSignalRecord => Boolean(record));
    },

    async listParticipationSignalsForReview(query = {}) {
      await ensureMongoIndexes();
      const col = await coreCol<ParticipationSignalRecordDoc>(RECORDS_COLLECTION);
      const filter: Record<string, unknown> = {};
      const regionId = String(query.regionId ?? "").trim();
      if (regionId) {
        filter.$or = [
          { "record.regionId": regionId },
          { "record.proposedRegionId": regionId },
          { "record.matchedRegionIds": regionId },
        ];
      }
      if (query.reviewStatus && query.reviewStatus !== "all") {
        filter["record.reviewStatus"] = query.reviewStatus;
      }
      if (typeof query.needsRegionReview === "boolean") {
        filter["record.needsRegionReview"] = query.needsRegionReview;
      }
      const docs = await col
        .find(filter)
        .sort({ "record.updatedAt": -1 })
        .limit(normalizeLimit(query.limit))
        .toArray();
      return docs
        .map((doc) => mapRecordDoc(doc))
        .filter((record): record is RegionParticipationSignalRecord => Boolean(record));
    },

    async getParticipationSignalRecordById(id) {
      await ensureMongoIndexes();
      const col = await coreCol<ParticipationSignalRecordDoc>(RECORDS_COLLECTION);
      return mapRecordDoc(await col.findOne({ _id: id }));
    },

    async reviewParticipationSignal(input) {
      await ensureMongoIndexes();
      const col = await coreCol<ParticipationSignalRecordDoc>(RECORDS_COLLECTION);
      const existing = mapRecordDoc(await col.findOne({ _id: input.signalId }));
      if (!existing) {
        return RegionParticipationSignalReviewResultSchema.parse({
          ok: false,
          blockedReason: "signal_not_found",
          record: null,
          review: null,
        });
      }

      const nextStatus = nextStatusForDecision(existing, input);
      if (!nextStatus) {
        return RegionParticipationSignalReviewResultSchema.parse({
          ok: false,
          blockedReason: reviewBlockedReason(existing, input),
          record: existing,
          review: null,
        });
      }

      const updatedRecord = buildUpdatedRecordFromDecision(existing, input, nextStatus);
      const review = RegionParticipationSignalReviewSchema.parse({
        id: new ObjectId().toHexString(),
        signalId: existing.id,
        decision: input.decision,
        previousStatus: existing.reviewStatus,
        nextStatus,
        regionId: updatedRecord.regionId ?? updatedRecord.proposedRegionId ?? null,
        note: input.note ?? null,
        reviewedBy: input.reviewedBy,
        reviewedAt: updatedRecord.reviewedAt ?? isoNow(),
      });
      const now = new Date();
      await col.updateOne(
        { _id: updatedRecord.id },
        { $set: { record: clone(updatedRecord), updatedAt: now } },
      );
      await appendReviewMongo(review);
      await appendAuditEventMongo(
        RegionParticipationSignalAuditEventSchema.parse({
          id: new ObjectId().toHexString(),
          signalId: updatedRecord.id,
          eventType:
            input.decision === "confirm_region"
              ? "region_confirmed"
              : input.decision === "archive"
                ? "archived"
                : input.decision === "revoke"
                  ? "revoked"
                  : "reviewed",
          previousStatus: existing.reviewStatus,
          nextStatus,
          note: input.note ?? null,
          regionId: updatedRecord.regionId ?? updatedRecord.proposedRegionId ?? null,
          createdBy: input.reviewedBy,
          createdAt: isoNow(),
        }),
      );
      return RegionParticipationSignalReviewResultSchema.parse({
        ok: true,
        blockedReason: null,
        record: updatedRecord,
        review,
      });
    },

    async confirmParticipationSignalRegion(signalId, regionId, reviewedBy, note) {
      return this.reviewParticipationSignal({
        signalId,
        decision: "confirm_region",
        regionId,
        reviewedBy,
        note,
      });
    },

    async archiveParticipationSignal(signalId, reviewedBy, note) {
      return this.reviewParticipationSignal({
        signalId,
        decision: "archive",
        reviewedBy,
        note,
      });
    },

    async getAcceptedParticipationSignalForDraft(signalId) {
      const record = await this.getParticipationSignalRecordById(signalId);
      if (!record) return null;
      if (record.reviewStatus !== "accepted") return null;
      if (!record.regionId || record.needsRegionReview) return null;
      if (
        record.privacyMode === "review_restricted" &&
        (!record.publicSafeTitle || !record.publicSafeSummary)
      ) {
        return null;
      }
      return record;
    },

    async appendParticipationSignalAuditEvent(event) {
      await appendAuditEventMongo(event);
    },
  };
}

export function createInMemoryParticipationSignalReviewRuntimeRepo(seed?: {
  records?: RegionParticipationSignalRecord[];
  reviews?: RegionParticipationSignalReview[];
  auditEvents?: RegionParticipationSignalAuditEvent[];
}): ParticipationSignalReviewRuntimeRepo {
  const records = new Map<string, RegionParticipationSignalRecord>();
  const reviews = new Map<string, RegionParticipationSignalReview>();
  const auditEvents = new Map<string, RegionParticipationSignalAuditEvent>();

  for (const record of seed?.records ?? []) records.set(record.id, clone(record));
  for (const review of seed?.reviews ?? []) reviews.set(review.id, clone(review));
  for (const event of seed?.auditEvents ?? []) auditEvents.set(event.id, clone(event));

  return {
    async createParticipationSignalRecord(signal) {
      const existing = records.get(signal.id) ?? null;
      const record = buildRecordFromSignal(signal, existing);
      records.set(record.id, clone(record));
      auditEvents.set(
        new ObjectId().toHexString(),
        RegionParticipationSignalAuditEventSchema.parse({
          id: new ObjectId().toHexString(),
          signalId: record.id,
          eventType: existing ? "record_synced" : "record_created",
          previousStatus: existing?.reviewStatus ?? null,
          nextStatus: record.reviewStatus,
          note: null,
          regionId: record.regionId ?? record.proposedRegionId ?? null,
          createdBy: "system_sync",
          createdAt: isoNow(),
        }),
      );
      return clone(record);
    },

    async listParticipationSignalsForRegion(regionId) {
      return Array.from(records.values())
        .map((record) => clone(record))
        .filter((record) => record.regionId === regionId)
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },

    async listParticipationSignalsForReview(query = {}) {
      return Array.from(records.values())
        .map((record) => clone(record))
        .filter((record) => {
          const regionId = String(query.regionId ?? "").trim();
          if (regionId) {
            const matchesRegion =
              record.regionId === regionId ||
              record.proposedRegionId === regionId ||
              record.matchedRegionIds.includes(regionId);
            if (!matchesRegion) return false;
          }
          if (query.reviewStatus && query.reviewStatus !== "all" && record.reviewStatus !== query.reviewStatus) {
            return false;
          }
          if (typeof query.needsRegionReview === "boolean" && record.needsRegionReview !== query.needsRegionReview) {
            return false;
          }
          return true;
        })
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
        .slice(0, normalizeLimit(query.limit));
    },

    async getParticipationSignalRecordById(id) {
      const record = records.get(id);
      return record ? clone(record) : null;
    },

    async reviewParticipationSignal(input) {
      const existing = records.get(input.signalId) ?? null;
      if (!existing) {
        return RegionParticipationSignalReviewResultSchema.parse({
          ok: false,
          blockedReason: "signal_not_found",
          record: null,
          review: null,
        });
      }
      const nextStatus = nextStatusForDecision(existing, input);
      if (!nextStatus) {
        return RegionParticipationSignalReviewResultSchema.parse({
          ok: false,
          blockedReason: reviewBlockedReason(existing, input),
          record: clone(existing),
          review: null,
        });
      }
      const updatedRecord = buildUpdatedRecordFromDecision(existing, input, nextStatus);
      records.set(updatedRecord.id, clone(updatedRecord));
      const review = RegionParticipationSignalReviewSchema.parse({
        id: new ObjectId().toHexString(),
        signalId: updatedRecord.id,
        decision: input.decision,
        previousStatus: existing.reviewStatus,
        nextStatus,
        regionId: updatedRecord.regionId ?? updatedRecord.proposedRegionId ?? null,
        note: input.note ?? null,
        reviewedBy: input.reviewedBy,
        reviewedAt: updatedRecord.reviewedAt ?? isoNow(),
      });
      reviews.set(review.id, clone(review));
      const event = RegionParticipationSignalAuditEventSchema.parse({
        id: new ObjectId().toHexString(),
        signalId: updatedRecord.id,
        eventType:
          input.decision === "confirm_region"
            ? "region_confirmed"
            : input.decision === "archive"
              ? "archived"
              : input.decision === "revoke"
                ? "revoked"
                : "reviewed",
        previousStatus: existing.reviewStatus,
        nextStatus,
        note: input.note ?? null,
        regionId: updatedRecord.regionId ?? updatedRecord.proposedRegionId ?? null,
        createdBy: input.reviewedBy,
        createdAt: isoNow(),
      });
      auditEvents.set(event.id, clone(event));
      return RegionParticipationSignalReviewResultSchema.parse({
        ok: true,
        blockedReason: null,
        record: updatedRecord,
        review,
      });
    },

    async confirmParticipationSignalRegion(signalId, regionId, reviewedBy, note) {
      return this.reviewParticipationSignal({
        signalId,
        decision: "confirm_region",
        regionId,
        reviewedBy,
        note,
      });
    },

    async archiveParticipationSignal(signalId, reviewedBy, note) {
      return this.reviewParticipationSignal({
        signalId,
        decision: "archive",
        reviewedBy,
        note,
      });
    },

    async getAcceptedParticipationSignalForDraft(signalId) {
      const record = records.get(signalId) ?? null;
      if (!record) return null;
      if (record.reviewStatus !== "accepted") return null;
      if (!record.regionId || record.needsRegionReview) return null;
      if (
        record.privacyMode === "review_restricted" &&
        (!record.publicSafeTitle || !record.publicSafeSummary)
      ) {
        return null;
      }
      return clone(record);
    },

    async appendParticipationSignalAuditEvent(event) {
      auditEvents.set(event.id, clone(event));
    },
  };
}

export function getParticipationSignalReviewRuntimeRepo(): ParticipationSignalReviewRuntimeRepo {
  if (process.env.VITEST) {
    if (!repoSingleton) repoSingleton = createInMemoryParticipationSignalReviewRuntimeRepo();
    return repoSingleton;
  }
  if (!repoSingleton) {
    repoSingleton = createMongoParticipationSignalReviewRuntimeRepo();
  }
  return repoSingleton;
}

export function setParticipationSignalReviewRuntimeRepoForTests(
  repo: ParticipationSignalReviewRuntimeRepo | null,
) {
  repoSingleton = repo;
}

export async function syncParticipationSignalRecords(
  regions: Region[],
): Promise<RegionParticipationSignalRecord[]> {
  const repo = getParticipationSignalReviewRuntimeRepo();
  const signals = await listDerivedRegionParticipationSignals(regions);
  const records = await Promise.all(
    signals.map((signal) => repo.createParticipationSignalRecord(signal)),
  );
  return records.sort((left, right) => right.confidence - left.confidence);
}

export async function listParticipationSignalsForDashboard(params: {
  regions: Region[];
  regionId: string;
}): Promise<{
  activeSignals: RegionParticipationSignal[];
  needsRegionReviewSignals: RegionParticipationReviewItem[];
}> {
  const records = await syncParticipationSignalRecords(params.regions);
  const activeSignals = records
    .filter(
      (record) =>
        record.regionId === params.regionId && activeDashboardStatuses(record.reviewStatus),
    )
    .map((record) => serializeParticipationSignalForDashboard(record))
    .filter((record): record is RegionParticipationSignal => Boolean(record));
  const needsRegionReviewSignals = records
    .filter((record) => regionReviewVisibleFor(record, params.regionId))
    .map((record) => serializeParticipationReviewItem(record));

  return { activeSignals, needsRegionReviewSignals };
}

export async function listParticipationSignalsForReviewRuntime(params: {
  regions: Region[];
  query?: ListParticipationSignalsForReviewQuery;
}): Promise<RegionParticipationSignalRecord[]> {
  await syncParticipationSignalRecords(params.regions);
  const repo = getParticipationSignalReviewRuntimeRepo();
  return repo.listParticipationSignalsForReview(params.query);
}
