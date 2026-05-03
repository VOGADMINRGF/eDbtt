import {
  assertThemenradarItem,
  canTransitionLifecycle,
  clampScore,
  normalizeCampaignKey,
  normalizeOptionalString,
  normalizeReviewNote,
  nowIsoString,
  type ThemenradarAuditEvent,
  type ThemenradarItem,
  type ThemenradarJurisdiction,
  type ThemenradarLifecycleStatus,
  type ThemenradarSourceType,
} from "@features/themenradar/contracts";
import {
  generateThemenradarContentPrep,
  type ThemenradarContentPrep,
} from "@features/themenradar/contentPrep";
import { createThemenradarShareReadyCandidate } from "@features/themenradar/shareReady";
import {
  applyThemenradarTelemetryEvent,
  type ThemenradarTelemetryEvent,
} from "@features/themenradar/telemetry";
import {
  buildThemenradarManualExportDraft,
  type ThemenradarExportFormat,
  type ThemenradarManualExportDraft,
} from "@features/themenradar/exportDraft";
import {
  getThemenradarRepo,
  setThemenradarRepoForTests,
  type ThemenradarRepo,
  type ThemenradarRepoListQuery,
  type ThemenradarStoredRecord,
} from "@features/themenradar/server/repo";

export type ThemenradarActorContext = {
  userId?: string | null;
  email?: string | null;
};

type ThemenradarLifecycleEvent = {
  status: ThemenradarLifecycleStatus;
  at: string;
  note: string | null;
};

export type ThemenradarListQuery = ThemenradarRepoListQuery;

export type ThemenradarDetail = {
  item: ThemenradarItem;
  contentPrep: ThemenradarContentPrep | null;
  lifecycleHistory: ThemenradarLifecycleEvent[];
  auditTrail: ThemenradarAuditEvent[];
};

export type CreateThemenradarItemInput = {
  title: string;
  rawSignal: string;
  sourceType?: ThemenradarSourceType;
  jurisdiction?: ThemenradarJurisdiction;
  heatScore?: number;
  everydayRelevanceScore?: number;
  polarizationScore?: number;
  membershipPotentialScore?: number;
  linkedAnlassraumId?: string | null;
  linkedDossierId?: string | null;
  campaignKey?: string | null;
};

type UpdateThemenradarItemInput = {
  title?: string;
  rawSignal?: string;
  jurisdiction?: ThemenradarJurisdiction;
  heatScore?: number;
  everydayRelevanceScore?: number;
  polarizationScore?: number;
  membershipPotentialScore?: number;
  linkedAnlassraumId?: string | null;
  linkedDossierId?: string | null;
  campaignKey?: string | null;
  lifecycleStatus?: ThemenradarLifecycleStatus;
  reviewNote?: string | null;
  publishIntent?: boolean;
};

export type ThemenradarTelemetryReportShape = {
  generatedAt: string;
  totalItems: number;
  totals: {
    clicks: number;
    leads: number;
    memberships: number;
  };
  byStatus: Array<{
    status: ThemenradarLifecycleStatus;
    items: number;
    clicks: number;
    leads: number;
    memberships: number;
  }>;
  byCampaign: Array<{
    campaignKey: string;
    items: number;
    clicks: number;
    leads: number;
    memberships: number;
  }>;
};

const MAX_REVIEW_NOTES = 40;
const LIFECYCLE_STATUSES: ThemenradarLifecycleStatus[] = [
  "raw",
  "qualified",
  "content_ready",
  "review_ready",
  "published",
  "archived",
];

function normalizeTitle(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 160);
}

function normalizeSignal(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 4000);
}

function normalizeActor(actor?: ThemenradarActorContext) {
  return {
    userId: normalizeOptionalString(actor?.userId, 120),
    email: normalizeOptionalString(actor?.email, 240),
  };
}

function resolveReviewNotes(notes: string[], reviewNote: string | null, actor: { userId: string | null }) {
  if (!reviewNote) return notes;
  const prefix = actor.userId ? `${actor.userId}: ` : "";
  const entry = `${nowIsoString()} | ${prefix}${reviewNote}`;
  return [...notes, entry].slice(-MAX_REVIEW_NOTES);
}

function buildLifecycleHistory(auditTrail: ThemenradarAuditEvent[]): ThemenradarLifecycleEvent[] {
  return auditTrail
    .filter((event) => event.toStatus && LIFECYCLE_STATUSES.includes(event.toStatus))
    .map((event) => ({
      status: event.toStatus as ThemenradarLifecycleStatus,
      at: event.at,
      note: event.note,
    }));
}

function normalizeStoredRecord(record: ThemenradarStoredRecord): ThemenradarStoredRecord {
  return {
    item: assertThemenradarItem(record.item),
    contentPrep: record.contentPrep ?? null,
  };
}

async function buildDetail(repo: ThemenradarRepo, record: ThemenradarStoredRecord): Promise<ThemenradarDetail> {
  const auditTrail = await repo.listAuditEvents(record.item.id);
  const lifecycleHistory = buildLifecycleHistory(auditTrail);
  return {
    item: record.item,
    contentPrep: record.contentPrep,
    lifecycleHistory,
    auditTrail,
  };
}

async function appendAuditEventAndBumpVersion(input: {
  repo: ThemenradarRepo;
  record: ThemenradarStoredRecord;
  actor: { userId: string | null; email: string | null };
  eventType: ThemenradarAuditEvent["eventType"];
  fromStatus: ThemenradarLifecycleStatus | null;
  toStatus: ThemenradarLifecycleStatus | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const nextAuditVersion = Math.max(0, input.record.item.auditVersion) + 1;
  const appended = await input.repo.appendAuditEvent({
    itemId: input.record.item.id,
    eventType: input.eventType,
    at: nowIsoString(),
    actorUserId: input.actor.userId,
    actorEmail: input.actor.email,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    note: input.note ?? null,
    auditVersion: nextAuditVersion,
    metadata: input.metadata ?? null,
  });
  input.record.item.auditVersion = nextAuditVersion;
  return appended;
}

function assertPatchLifecycleAllowed(input: {
  from: ThemenradarLifecycleStatus;
  to: ThemenradarLifecycleStatus;
  publishIntent: boolean;
}) {
  if (input.from === input.to) return;
  if (input.to === "review_ready") {
    throw new Error("review_ready_requires_share_ready_action");
  }
  if (!canTransitionLifecycle({ from: input.from, to: input.to })) {
    throw new Error("invalid_lifecycle_transition");
  }
  if (input.to === "published") {
    if (input.from !== "review_ready") {
      throw new Error("publish_requires_review_ready");
    }
    if (!input.publishIntent) {
      throw new Error("publish_requires_explicit_intent");
    }
  }
}

function assertContentPrepAllowed(status: ThemenradarLifecycleStatus) {
  if (status === "archived") {
    throw new Error("themenradar_content_prep_locked");
  }
  if (status === "published") {
    throw new Error("themenradar_content_prep_locked_after_publish");
  }
}

function assertShareReadyAllowed(status: ThemenradarLifecycleStatus) {
  if (status === "archived") {
    throw new Error("themenradar_share_ready_locked");
  }
  if (status === "raw" || status === "qualified") {
    throw new Error("themenradar_not_qualified_for_share_ready");
  }
}

function resolveRepo() {
  return getThemenradarRepo();
}

export async function listThemenradarItems(query: ThemenradarListQuery = {}): Promise<ThemenradarItem[]> {
  const repo = resolveRepo();
  const records = await repo.listRecords(query);
  return records.map((entry) => entry.item);
}

export async function getThemenradarDetail(id: string): Promise<ThemenradarDetail | null> {
  const repo = resolveRepo();
  const record = await repo.getRecordById(id);
  if (!record) return null;
  return buildDetail(repo, normalizeStoredRecord(record));
}

export async function createThemenradarItem(
  input: CreateThemenradarItemInput,
  actorInput?: ThemenradarActorContext,
): Promise<ThemenradarItem> {
  const repo = resolveRepo();
  const title = normalizeTitle(input.title);
  const rawSignal = normalizeSignal(input.rawSignal);
  if (!title) throw new Error("title_required");
  if (!rawSignal) throw new Error("raw_signal_required");

  const actor = normalizeActor(actorInput);
  const now = nowIsoString();
  const id = `themenradar_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const record: ThemenradarStoredRecord = {
    item: assertThemenradarItem({
      id,
      title,
      rawSignal,
      sourceType: input.sourceType ?? "manual",
      heatScore: clampScore(input.heatScore ?? 50),
      everydayRelevanceScore: clampScore(input.everydayRelevanceScore ?? 50),
      polarizationScore: clampScore(input.polarizationScore ?? 40),
      membershipPotentialScore: clampScore(input.membershipPotentialScore ?? 45),
      jurisdiction: input.jurisdiction ?? "mixed",
      lifecycleStatus: "raw",
      linkedAnlassraumId: normalizeOptionalString(input.linkedAnlassraumId) ?? null,
      linkedDossierId: normalizeOptionalString(input.linkedDossierId) ?? null,
      campaignKey:
        normalizeCampaignKey(input.campaignKey) ??
        normalizeCampaignKey(`${title}-${new Date().getUTCFullYear()}`),
      shareContractSnapshot: null,
      telemetrySnapshot: {
        campaignKey: normalizeCampaignKey(input.campaignKey) ?? null,
        clicks: 0,
        leads: 0,
        memberships: 0,
        updatedAt: now,
      },
      reviewRequired: true,
      autoPostEligible: false,
      officialSocialRequiresReview: true,
      createdBy: actor.userId,
      updatedBy: actor.userId,
      lastReviewedBy: null,
      lastReviewedAt: null,
      reviewNotes: [],
      auditVersion: 0,
      archivedAt: null,
      archivedBy: null,
      createdAt: now,
      updatedAt: now,
    }),
    contentPrep: null,
  };

  await repo.upsertRecord(record);
  await appendAuditEventAndBumpVersion({
    repo,
    record,
    actor,
    eventType: "created",
    fromStatus: null,
    toStatus: "raw",
    note: "created",
  });
  await repo.upsertRecord(record);
  return record.item;
}

export async function importIssueSignalFromCreate(
  input: {
    title: string;
    rawSignal: string;
    jurisdiction?: ThemenradarJurisdiction;
    campaignKey?: string | null;
  },
  actorInput?: ThemenradarActorContext,
) {
  return createThemenradarItem(
    {
      ...input,
      sourceType: "create_intake",
    },
    actorInput,
  );
}

export async function updateThemenradarItem(
  id: string,
  patch: UpdateThemenradarItemInput,
  actorInput?: ThemenradarActorContext,
): Promise<ThemenradarItem> {
  const repo = resolveRepo();
  const record = await repo.getRecordById(id);
  if (!record) throw new Error("themenradar_item_not_found");

  const actor = normalizeActor(actorInput);
  const reviewNote = normalizeReviewNote(patch.reviewNote);
  const publishIntent = Boolean(patch.publishIntent);
  const lifecycleBefore = record.item.lifecycleStatus;
  const lifecycleAfter = patch.lifecycleStatus ?? lifecycleBefore;

  assertPatchLifecycleAllowed({
    from: lifecycleBefore,
    to: lifecycleAfter,
    publishIntent,
  });

  const nextItem = assertThemenradarItem({
    ...record.item,
    title:
      patch.title !== undefined ? normalizeTitle(patch.title) || record.item.title : record.item.title,
    rawSignal:
      patch.rawSignal !== undefined
        ? normalizeSignal(patch.rawSignal) || record.item.rawSignal
        : record.item.rawSignal,
    jurisdiction: patch.jurisdiction ?? record.item.jurisdiction,
    heatScore:
      patch.heatScore !== undefined ? clampScore(patch.heatScore) : record.item.heatScore,
    everydayRelevanceScore:
      patch.everydayRelevanceScore !== undefined
        ? clampScore(patch.everydayRelevanceScore)
        : record.item.everydayRelevanceScore,
    polarizationScore:
      patch.polarizationScore !== undefined
        ? clampScore(patch.polarizationScore)
        : record.item.polarizationScore,
    membershipPotentialScore:
      patch.membershipPotentialScore !== undefined
        ? clampScore(patch.membershipPotentialScore)
        : record.item.membershipPotentialScore,
    linkedAnlassraumId:
      patch.linkedAnlassraumId !== undefined
        ? normalizeOptionalString(patch.linkedAnlassraumId)
        : record.item.linkedAnlassraumId ?? null,
    linkedDossierId:
      patch.linkedDossierId !== undefined
        ? normalizeOptionalString(patch.linkedDossierId)
        : record.item.linkedDossierId ?? null,
    campaignKey:
      patch.campaignKey !== undefined
        ? normalizeCampaignKey(patch.campaignKey)
        : record.item.campaignKey ?? null,
    lifecycleStatus: lifecycleAfter,
    updatedBy: actor.userId ?? record.item.updatedBy,
    lastReviewedBy:
      lifecycleAfter === "published"
        ? actor.userId ?? record.item.lastReviewedBy
        : record.item.lastReviewedBy,
    lastReviewedAt:
      lifecycleAfter === "published" ? nowIsoString() : record.item.lastReviewedAt,
    reviewNotes: resolveReviewNotes(record.item.reviewNotes, reviewNote, actor),
    archivedAt:
      lifecycleAfter === "archived" ? nowIsoString() : lifecycleBefore === "archived" ? record.item.archivedAt : null,
    archivedBy:
      lifecycleAfter === "archived"
        ? actor.userId ?? record.item.archivedBy
        : lifecycleBefore === "archived"
          ? record.item.archivedBy
          : null,
    updatedAt: nowIsoString(),
  });

  record.item = nextItem;

  if (lifecycleAfter !== lifecycleBefore) {
    if (lifecycleAfter === "qualified") {
      await appendAuditEventAndBumpVersion({
        repo,
        record,
        actor,
        eventType: "qualified",
        fromStatus: lifecycleBefore,
        toStatus: "qualified",
        note: reviewNote ?? "manual_transition",
      });
    } else if (lifecycleAfter === "archived") {
      await appendAuditEventAndBumpVersion({
        repo,
        record,
        actor,
        eventType: "archived",
        fromStatus: lifecycleBefore,
        toStatus: "archived",
        note: reviewNote ?? "archived",
      });
    } else if (lifecycleAfter === "published") {
      await appendAuditEventAndBumpVersion({
        repo,
        record,
        actor,
        eventType: "published_set",
        fromStatus: lifecycleBefore,
        toStatus: "published",
        note: reviewNote ?? "published",
      });
    } else {
      await appendAuditEventAndBumpVersion({
        repo,
        record,
        actor,
        eventType: "lifecycle_transition",
        fromStatus: lifecycleBefore,
        toStatus: lifecycleAfter,
        note: reviewNote ?? "manual_transition",
      });
    }
  }

  await repo.upsertRecord(record);
  return record.item;
}

export async function createContentPrepForThemenradarItem(
  id: string,
  actorInput?: ThemenradarActorContext,
): Promise<ThemenradarDetail> {
  const repo = resolveRepo();
  const record = await repo.getRecordById(id);
  if (!record) throw new Error("themenradar_item_not_found");

  assertContentPrepAllowed(record.item.lifecycleStatus);

  const actor = normalizeActor(actorInput);
  const lifecycleBefore = record.item.lifecycleStatus;
  let lifecycleAfter = lifecycleBefore;

  if (lifecycleBefore === "raw") {
    record.item.lifecycleStatus = "qualified";
    lifecycleAfter = "qualified";
    await appendAuditEventAndBumpVersion({
      repo,
      record,
      actor,
      eventType: "qualified",
      fromStatus: "raw",
      toStatus: "qualified",
      note: "content_prep_started",
    });
  }

  if (lifecycleAfter === "qualified") {
    record.item.lifecycleStatus = "content_ready";
    lifecycleAfter = "content_ready";
  }

  record.contentPrep = generateThemenradarContentPrep(record.item);
  record.item = assertThemenradarItem({
    ...record.item,
    lifecycleStatus: lifecycleAfter,
    updatedBy: actor.userId ?? record.item.updatedBy,
    updatedAt: nowIsoString(),
  });

  await appendAuditEventAndBumpVersion({
    repo,
    record,
    actor,
    eventType: "content_prep_generated",
    fromStatus: lifecycleBefore,
    toStatus: lifecycleAfter,
    note: "content_prep_generated",
  });

  await repo.upsertRecord(record);
  return buildDetail(repo, record);
}

export async function createShareReadyForThemenradarItem(
  id: string,
  actorInput?: ThemenradarActorContext,
): Promise<ThemenradarDetail> {
  const repo = resolveRepo();
  const record = await repo.getRecordById(id);
  if (!record) throw new Error("themenradar_item_not_found");

  assertShareReadyAllowed(record.item.lifecycleStatus);
  const actor = normalizeActor(actorInput);

  if (!record.contentPrep) {
    record.contentPrep = generateThemenradarContentPrep(record.item);
    record.item.updatedAt = nowIsoString();
    await appendAuditEventAndBumpVersion({
      repo,
      record,
      actor,
      eventType: "content_prep_generated",
      fromStatus: record.item.lifecycleStatus,
      toStatus: record.item.lifecycleStatus,
      note: "content_prep_generated_auto",
    });
  }

  const result = createThemenradarShareReadyCandidate(record.item);
  if (!result.ok) {
    throw new Error((result as { ok: false; error: string }).error);
  }

  const lifecycleBefore = record.item.lifecycleStatus;
  const shouldSetReviewReady = lifecycleBefore === "content_ready";
  const nextLifecycle = shouldSetReviewReady ? "review_ready" : lifecycleBefore;

  record.item = assertThemenradarItem({
    ...record.item,
    lifecycleStatus: nextLifecycle,
    shareContractSnapshot: result.shareReady,
    reviewRequired: true,
    autoPostEligible: false,
    officialSocialRequiresReview: true,
    lastReviewedBy:
      shouldSetReviewReady || lifecycleBefore === "review_ready"
        ? actor.userId ?? record.item.lastReviewedBy
        : record.item.lastReviewedBy,
    lastReviewedAt:
      shouldSetReviewReady || lifecycleBefore === "review_ready"
        ? nowIsoString()
        : record.item.lastReviewedAt,
    updatedBy: actor.userId ?? record.item.updatedBy,
    updatedAt: nowIsoString(),
  });

  if (shouldSetReviewReady) {
    await appendAuditEventAndBumpVersion({
      repo,
      record,
      actor,
      eventType: "review_ready_set",
      fromStatus: lifecycleBefore,
      toStatus: "review_ready",
      note: "share_ready_prepared",
    });
  }

  await appendAuditEventAndBumpVersion({
    repo,
    record,
    actor,
    eventType: "share_ready_generated",
    fromStatus: lifecycleBefore,
    toStatus: record.item.lifecycleStatus,
    note: "share_ready_generated",
  });

  await repo.upsertRecord(record);
  return buildDetail(repo, record);
}

export async function createThemenradarManualExport(
  id: string,
  format: ThemenradarExportFormat,
  actorInput?: ThemenradarActorContext,
): Promise<ThemenradarManualExportDraft> {
  const repo = resolveRepo();
  const record = await repo.getRecordById(id);
  if (!record) throw new Error("themenradar_item_not_found");

  const actor = normalizeActor(actorInput);
  const draft = buildThemenradarManualExportDraft({
    item: record.item,
    contentPrep: record.contentPrep,
    format,
  });

  await appendAuditEventAndBumpVersion({
    repo,
    record,
    actor,
    eventType: "lifecycle_transition",
    fromStatus: record.item.lifecycleStatus,
    toStatus: record.item.lifecycleStatus,
    note: `manual_export_generated:${format}`,
    metadata: {
      exportFormat: format,
      reviewRequired: true,
      autoPostEligible: false,
      officialSocialAutoPosting: false,
    },
  });

  record.item = assertThemenradarItem({
    ...record.item,
    updatedBy: actor.userId ?? record.item.updatedBy,
    updatedAt: nowIsoString(),
  });
  await repo.upsertRecord(record);

  return draft;
}

export async function applyThemenradarTelemetry(
  id: string,
  event: ThemenradarTelemetryEvent,
  actorInput?: ThemenradarActorContext,
): Promise<ThemenradarItem> {
  const repo = resolveRepo();
  const record = await repo.getRecordById(id);
  if (!record) throw new Error("themenradar_item_not_found");

  const actor = normalizeActor(actorInput);
  const telemetrySnapshot = applyThemenradarTelemetryEvent({
    snapshot: record.item.telemetrySnapshot ?? null,
    event,
  });

  record.item = assertThemenradarItem({
    ...record.item,
    telemetrySnapshot,
    updatedBy: actor.userId ?? record.item.updatedBy,
    updatedAt: nowIsoString(),
  });

  await repo.upsertRecord(record);
  return record.item;
}

export async function getThemenradarTelemetryReportShape(
  query: ThemenradarListQuery = {},
): Promise<ThemenradarTelemetryReportShape> {
  const repo = resolveRepo();
  const records = await repo.listRecords({
    ...query,
    limit: query.limit ?? 500,
  });

  const totals = {
    clicks: 0,
    leads: 0,
    memberships: 0,
  };

  const byStatusMap = new Map<ThemenradarLifecycleStatus, {
    status: ThemenradarLifecycleStatus;
    items: number;
    clicks: number;
    leads: number;
    memberships: number;
  }>();

  const byCampaignMap = new Map<string, {
    campaignKey: string;
    items: number;
    clicks: number;
    leads: number;
    memberships: number;
  }>();

  for (const status of LIFECYCLE_STATUSES) {
    byStatusMap.set(status, {
      status,
      items: 0,
      clicks: 0,
      leads: 0,
      memberships: 0,
    });
  }

  for (const record of records) {
    const telemetry = record.item.telemetrySnapshot;
    const clicks = telemetry?.clicks ?? 0;
    const leads = telemetry?.leads ?? 0;
    const memberships = telemetry?.memberships ?? 0;

    totals.clicks += clicks;
    totals.leads += leads;
    totals.memberships += memberships;

    const statusBucket = byStatusMap.get(record.item.lifecycleStatus);
    if (statusBucket) {
      statusBucket.items += 1;
      statusBucket.clicks += clicks;
      statusBucket.leads += leads;
      statusBucket.memberships += memberships;
    }

    const campaignKey =
      normalizeCampaignKey(record.item.campaignKey) ??
      normalizeCampaignKey(telemetry?.campaignKey) ??
      null;

    if (campaignKey) {
      const existing = byCampaignMap.get(campaignKey) ?? {
        campaignKey,
        items: 0,
        clicks: 0,
        leads: 0,
        memberships: 0,
      };
      existing.items += 1;
      existing.clicks += clicks;
      existing.leads += leads;
      existing.memberships += memberships;
      byCampaignMap.set(campaignKey, existing);
    }
  }

  return {
    generatedAt: nowIsoString(),
    totalItems: records.length,
    totals,
    byStatus: Array.from(byStatusMap.values()),
    byCampaign: Array.from(byCampaignMap.values()).sort(
      (left, right) => right.clicks + right.leads * 5 + right.memberships * 8 - (left.clicks + left.leads * 5 + left.memberships * 8),
    ),
  };
}

export { setThemenradarRepoForTests };
