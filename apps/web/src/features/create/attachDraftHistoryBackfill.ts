import { ObjectId } from "@core/db/triMongo";
import {
  CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION,
  createApplyHistoryEvent,
  createReviewHistoryEvent,
  type CreatePrepareAttachDraftHistoryEvent,
} from "@/features/create/attachDraftHistory";
import { createPrepareAttachHistoryEventsCol } from "@/features/create/attachDraftCollections";
import {
  isCreatePrepareAttachDraftApplyState,
  isCreatePrepareAttachDraftReviewDecision,
  isCreatePrepareAttachDraftReviewState,
  type CreatePrepareAttachDraftApplyState,
  type CreatePrepareAttachDraftReviewDecision,
  type CreatePrepareAttachDraftReviewState,
  type CreatePrepareAttachTargetType,
} from "@/features/create/prepareAttachDraft";

export const CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MODES = ["dry_run", "apply"] as const;
export type CreatePrepareAttachHistoryBackfillMode =
  (typeof CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MODES)[number];

export const CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_DEFAULT_PREVIEW_LIMIT = 8;
export const CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MAX_PREVIEW_LIMIT = 30;

export type CreatePrepareAttachHistoryBackfillStatus =
  | "canonical_already_ok"
  | "normalizable"
  | "unsafe_to_backfill";

export type CreatePrepareAttachHistoryBackfillAssessment = {
  status: CreatePrepareAttachHistoryBackfillStatus;
  rowId: string | null;
  draftId: string | null;
  inferredEventType: "review" | "apply" | null;
  reasons: string[];
  normalizedEvent: CreatePrepareAttachDraftHistoryEvent | null;
};

export type CreatePrepareAttachHistoryBackfillSample = {
  rowId: string | null;
  draftId: string | null;
  status: CreatePrepareAttachHistoryBackfillStatus;
  inferredEventType: "review" | "apply" | null;
  reasons: string[];
};

export type CreatePrepareAttachHistoryBackfillReport = {
  mode: CreatePrepareAttachHistoryBackfillMode;
  totalScanned: number;
  canonical: number;
  normalizable: number;
  unsafe: number;
  applied: number;
  applySkipped: number;
  samples: CreatePrepareAttachHistoryBackfillSample[];
  reasonBuckets: Record<string, number>;
};

export type CreatePrepareAttachHistoryBackfillCliOptions = {
  mode: CreatePrepareAttachHistoryBackfillMode;
  previewLimit: number;
  scanLimit: number | null;
  json: boolean;
};

export function normalizeCreatePrepareAttachHistoryBackfillMode(
  value: unknown,
): CreatePrepareAttachHistoryBackfillMode {
  const normalized = String(value ?? "dry_run").trim().toLowerCase();
  if (normalized === "dry_run" || normalized === "apply") return normalized;
  throw new Error("invalid_history_backfill_mode");
}

export function normalizeCreatePrepareAttachHistoryBackfillPreviewLimit(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_DEFAULT_PREVIEW_LIMIT;
  const rounded = Math.floor(numeric);
  return Math.max(1, Math.min(CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MAX_PREVIEW_LIMIT, rounded));
}

function normalizeCreatePrepareAttachHistoryBackfillScanLimit(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("invalid_history_backfill_scan_limit");
  }
  return Math.floor(numeric);
}

export function parseCreatePrepareAttachHistoryBackfillArgs(
  argv: string[],
): CreatePrepareAttachHistoryBackfillCliOptions {
  let modeInput: string | null = null;
  let previewLimitInput: string | null = null;
  let scanLimitInput: string | null = null;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "").trim();
    if (!arg) continue;
    if (arg === "--apply") {
      modeInput = "apply";
      continue;
    }
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--mode") {
      modeInput = String(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg.startsWith("--mode=")) {
      modeInput = arg.slice("--mode=".length);
      continue;
    }
    if (arg === "--preview-limit") {
      previewLimitInput = String(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg.startsWith("--preview-limit=")) {
      previewLimitInput = arg.slice("--preview-limit=".length);
      continue;
    }
    if (arg === "--scan-limit") {
      scanLimitInput = String(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg.startsWith("--scan-limit=")) {
      scanLimitInput = arg.slice("--scan-limit=".length);
      continue;
    }
    throw new Error("invalid_history_backfill_arg");
  }

  return {
    mode: normalizeCreatePrepareAttachHistoryBackfillMode(modeInput ?? "dry_run"),
    previewLimit: normalizeCreatePrepareAttachHistoryBackfillPreviewLimit(previewLimitInput),
    scanLimit: normalizeCreatePrepareAttachHistoryBackfillScanLimit(scanLimitInput),
    json,
  };
}

export function classifyCreatePrepareAttachHistoryLegacyRow(
  row: Record<string, unknown>,
): CreatePrepareAttachHistoryBackfillAssessment {
  if (!row || typeof row !== "object") {
    return {
      status: "unsafe_to_backfill",
      rowId: null,
      draftId: null,
      inferredEventType: null,
      reasons: ["invalid_row_object"],
      normalizedEvent: null,
    };
  }

  const raw = row as Record<string, unknown>;
  const rowId = getRowIdString(raw._id);
  const draftId = String(raw.draftId || "").trim() || null;
  const reasons = new Set<string>();

  if (!rowId) {
    reasons.add("row_id_missing");
    return {
      status: "unsafe_to_backfill",
      rowId,
      draftId,
      inferredEventType: null,
      reasons: Array.from(reasons),
      normalizedEvent: null,
    };
  }
  if (!draftId) {
    reasons.add("missing_draft_id");
    return {
      status: "unsafe_to_backfill",
      rowId,
      draftId,
      inferredEventType: null,
      reasons: Array.from(reasons),
      normalizedEvent: null,
    };
  }

  const typeResult = inferBackfillEventType(raw);
  if (!typeResult.eventType) {
    reasons.add(typeResult.reasonCode || "event_type_unrecoverable");
    return {
      status: "unsafe_to_backfill",
      rowId,
      draftId,
      inferredEventType: null,
      reasons: Array.from(reasons),
      normalizedEvent: null,
    };
  }

  if (typeResult.inferred) {
    reasons.add("event_type_inferred");
  }

  const actor = inferBackfillActor(raw);
  if (actor.reasonCode) reasons.add(actor.reasonCode);

  const timestamp = inferBackfillTimestamp(raw);
  if (!timestamp.value) {
    reasons.add(timestamp.reasonCode || "timestamp_unrecoverable");
    return {
      status: "unsafe_to_backfill",
      rowId,
      draftId,
      inferredEventType: typeResult.eventType,
      reasons: Array.from(reasons),
      normalizedEvent: null,
    };
  }
  if (timestamp.reasonCode) reasons.add(timestamp.reasonCode);

  if (String(raw.schemaVersion || "") !== CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION) {
    reasons.add("schema_version_normalized");
  }

  const eventIdResult = resolveBackfillEventId(raw, {
    draftId,
    actorUserId: actor.actorUserId,
    createdAt: timestamp.value,
    eventType: typeResult.eventType,
  });
  if (eventIdResult.reasonCode) reasons.add(eventIdResult.reasonCode);

  const normalizedEvent = buildNormalizedHistoryEvent({
    raw,
    draftId,
    eventType: typeResult.eventType,
    actorUserId: actor.actorUserId,
    createdAt: timestamp.value,
    eventId: eventIdResult.eventId,
    reasons,
  });

  if (!normalizedEvent) {
    reasons.add(typeResult.eventType === "review" ? "review_state_unrecoverable" : "apply_result_unrecoverable");
    return {
      status: "unsafe_to_backfill",
      rowId,
      draftId,
      inferredEventType: typeResult.eventType,
      reasons: Array.from(reasons),
      normalizedEvent: null,
    };
  }

  if (isCanonicalHistoryRow(raw, typeResult.eventType)) {
    return {
      status: "canonical_already_ok",
      rowId,
      draftId,
      inferredEventType: typeResult.eventType,
      reasons: [],
      normalizedEvent: null,
    };
  }

  if (reasons.size === 0) {
    reasons.add("contract_fields_enriched");
  }

  return {
    status: "normalizable",
    rowId,
    draftId,
    inferredEventType: typeResult.eventType,
    reasons: Array.from(reasons),
    normalizedEvent,
  };
}

export async function runCreatePrepareAttachHistoryBackfill(params?: {
  mode?: CreatePrepareAttachHistoryBackfillMode | string | null;
  previewLimit?: number | string | null;
  scanLimit?: number | string | null;
}): Promise<CreatePrepareAttachHistoryBackfillReport> {
  const mode = normalizeCreatePrepareAttachHistoryBackfillMode(params?.mode ?? "dry_run");
  const previewLimit = normalizeCreatePrepareAttachHistoryBackfillPreviewLimit(
    params?.previewLimit ?? CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_DEFAULT_PREVIEW_LIMIT,
  );
  const scanLimit = normalizeCreatePrepareAttachHistoryBackfillScanLimit(params?.scanLimit ?? null);

  const History = await createPrepareAttachHistoryEventsCol();
  const cursor = History.find({}).sort({ _id: 1 });
  if (scanLimit) cursor.limit(scanLimit);
  const rows = await cursor.toArray();

  const report: CreatePrepareAttachHistoryBackfillReport = {
    mode,
    totalScanned: 0,
    canonical: 0,
    normalizable: 0,
    unsafe: 0,
    applied: 0,
    applySkipped: 0,
    samples: [],
    reasonBuckets: {},
  };

  for (const row of rows as Record<string, unknown>[]) {
    report.totalScanned += 1;
    const assessment = classifyCreatePrepareAttachHistoryLegacyRow(row);

    if (assessment.status === "canonical_already_ok") report.canonical += 1;
    if (assessment.status === "normalizable") report.normalizable += 1;
    if (assessment.status === "unsafe_to_backfill") report.unsafe += 1;

    for (const reason of assessment.reasons) {
      report.reasonBuckets[reason] = (report.reasonBuckets[reason] ?? 0) + 1;
    }

    if (report.samples.length < previewLimit) {
      report.samples.push({
        rowId: assessment.rowId,
        draftId: assessment.draftId,
        status: assessment.status,
        inferredEventType: assessment.inferredEventType,
        reasons: assessment.reasons,
      });
    }

    if (mode !== "apply") continue;
    if (assessment.status !== "normalizable") continue;
    if (!assessment.normalizedEvent) {
      report.applySkipped += 1;
      continue;
    }

    const filter = buildRowFilter(row);
    if (!filter) {
      report.applySkipped += 1;
      continue;
    }

    const updateRes = await History.updateOne(filter, {
      $set: assessment.normalizedEvent as Record<string, unknown>,
    });
    if (updateRes.modifiedCount === 1) {
      report.applied += 1;
    } else {
      report.applySkipped += 1;
    }
  }

  return report;
}

function buildRowFilter(row: Record<string, unknown>) {
  if (!Object.prototype.hasOwnProperty.call(row, "_id")) return null;
  if ((row as { _id?: unknown })._id == null) return null;
  return { _id: (row as { _id: unknown })._id };
}

function buildNormalizedHistoryEvent(params: {
  raw: Record<string, unknown>;
  draftId: string;
  eventType: "review" | "apply";
  actorUserId: string;
  createdAt: string;
  eventId: string;
  reasons: Set<string>;
}): CreatePrepareAttachDraftHistoryEvent | null {
  const reason = params.reasons.size > 0 ? Array.from(params.reasons).join(",") : null;
  if (params.eventType === "review") {
    const nextReviewState =
      parseReviewDecision(params.raw.nextReviewState) ?? parseReviewDecision(params.raw.reviewState);
    if (!nextReviewState) return null;
    return createReviewHistoryEvent({
      draftId: params.draftId,
      actorUserId: params.actorUserId,
      previousReviewState: parseReviewState(params.raw.previousReviewState) ?? "pending",
      nextReviewState,
      previousApplyState: parseApplyState(params.raw.previousApplyState) ?? "not_applied",
      nextApplyState: parseApplyState(params.raw.nextApplyState) ?? "not_applied",
      reviewNote: params.raw.reviewNote == null ? null : String(params.raw.reviewNote),
      normalizedFromLegacy: true,
      legacyNormalizationReason: reason,
      createdAt: params.createdAt,
      eventId: params.eventId,
    });
  }

  const result = inferApplyResult(params.raw);
  if (!result) return null;
  const previousReviewState = parseReviewState(params.raw.previousReviewState) ?? parseReviewState(params.raw.reviewState) ?? null;
  const nextReviewState = parseReviewState(params.raw.nextReviewState) ?? previousReviewState;
  const previousApplyState = parseApplyState(params.raw.previousApplyState) ?? "not_applied";
  const nextApplyState =
    parseApplyState(params.raw.nextApplyState) ??
    parseApplyState(params.raw.applyState) ??
    (result === "applied" ? "applied" : "apply_failed");
  return createApplyHistoryEvent({
    draftId: params.draftId,
    actorUserId: params.actorUserId,
    targetType: parseTargetType(params.raw.targetType),
    targetId: params.raw.targetId == null ? null : String(params.raw.targetId),
    result,
    applyNote: params.raw.applyNote == null ? null : String(params.raw.applyNote),
    mutationType: params.raw.mutationType == null ? null : String(params.raw.mutationType),
    errorCode: params.raw.errorCode == null ? null : String(params.raw.errorCode),
    normalizedFromLegacy: true,
    legacyNormalizationReason: reason,
    previousReviewState,
    nextReviewState,
    previousApplyState,
    nextApplyState,
    createdAt: params.createdAt,
    eventId: params.eventId,
  });
}

function inferBackfillEventType(raw: Record<string, unknown>): {
  eventType: "review" | "apply" | null;
  inferred: boolean;
  reasonCode?: string;
} {
  if (raw.eventType === "review" || raw.eventType === "apply") {
    return { eventType: raw.eventType, inferred: false };
  }
  const hasReviewStrongSignal =
    typeof raw.reviewNote === "string" ||
    typeof raw.reviewedBy === "string";
  const hasReviewDecisionSignal =
    parseReviewDecision(raw.nextReviewState) !== null ||
    parseReviewDecision(raw.reviewState) !== null;
  const applyState = parseApplyState(raw.nextApplyState) ?? parseApplyState(raw.applyState);
  const hasApplyStrongSignal =
    raw.result === "applied" ||
    raw.result === "failed" ||
    typeof raw.appliedBy === "string" ||
    typeof raw.applyNote === "string" ||
    typeof raw.applyError === "string" ||
    typeof raw.targetType === "string" ||
    typeof raw.targetId === "string" ||
    typeof raw.mutationType === "string";
  const hasApplyResultSignal =
    inferApplyResult(raw) !== null ||
    applyState === "applied" ||
    applyState === "apply_failed";

  if ((hasApplyStrongSignal || hasApplyResultSignal) && hasReviewStrongSignal) {
    return { eventType: null, inferred: false, reasonCode: "ambiguous_event_signals" };
  }
  if (hasApplyStrongSignal || hasApplyResultSignal) return { eventType: "apply", inferred: true };
  if (hasReviewStrongSignal || hasReviewDecisionSignal) return { eventType: "review", inferred: true };
  return { eventType: null, inferred: false, reasonCode: "event_type_unrecoverable" };
}

function inferBackfillActor(raw: Record<string, unknown>) {
  if (typeof raw.actorUserId === "string" && raw.actorUserId.trim()) {
    return { actorUserId: raw.actorUserId.trim(), reasonCode: null as string | null };
  }
  if (typeof raw.reviewedBy === "string" && raw.reviewedBy.trim()) {
    return { actorUserId: raw.reviewedBy.trim(), reasonCode: "actor_inferred" };
  }
  if (typeof raw.appliedBy === "string" && raw.appliedBy.trim()) {
    return { actorUserId: raw.appliedBy.trim(), reasonCode: "actor_inferred" };
  }
  return { actorUserId: "unknown", reasonCode: "actor_inferred_unknown" };
}

function inferBackfillTimestamp(raw: Record<string, unknown>) {
  const checks: Array<{ field: string; value: unknown }> = [
    { field: "createdAt", value: raw.createdAt },
    { field: "reviewedAt", value: raw.reviewedAt },
    { field: "appliedAt", value: raw.appliedAt },
    { field: "updatedAt", value: raw.updatedAt },
  ];
  for (const check of checks) {
    if (typeof check.value !== "string") continue;
    const trimmed = check.value.trim();
    if (!trimmed || Number.isNaN(Date.parse(trimmed))) continue;
    if (check.field === "createdAt") {
      return { value: trimmed, reasonCode: null as string | null };
    }
    return { value: trimmed, reasonCode: "timestamp_inferred" };
  }
  const oid = parseObjectIdLike(raw._id);
  if (oid) {
    return { value: oid.getTimestamp().toISOString(), reasonCode: "timestamp_inferred_from_object_id" };
  }
  return { value: null, reasonCode: "timestamp_unrecoverable" };
}

function resolveBackfillEventId(
  raw: Record<string, unknown>,
  params: {
    draftId: string;
    actorUserId: string;
    createdAt: string;
    eventType: "review" | "apply";
  },
) {
  if (typeof raw.eventId === "string" && raw.eventId.trim()) {
    return { eventId: raw.eventId.trim(), reasonCode: null as string | null };
  }
  const oid = parseObjectIdLike(raw._id);
  if (oid) {
    return { eventId: oid.toHexString(), reasonCode: "event_id_inferred_from_row_id" };
  }
  return {
    eventId: deriveDeterministicObjectIdHex(
      `${params.draftId}|${params.createdAt}|${params.actorUserId}|${params.eventType}`,
    ),
    reasonCode: "event_id_generated",
  };
}

function inferApplyResult(raw: Record<string, unknown>): "applied" | "failed" | null {
  if (raw.result === "applied" || raw.result === "failed") return raw.result;
  const nextState = parseApplyState(raw.nextApplyState) ?? parseApplyState(raw.applyState);
  if (nextState === "applied") return "applied";
  if (nextState === "apply_failed") return "failed";
  return null;
}

function parseTargetType(value: unknown): CreatePrepareAttachTargetType | "unknown" {
  if (value === "claim" || value === "anlassraum" || value === "dossier" || value === "perspective") {
    return value;
  }
  return "unknown";
}

function isCanonicalHistoryRow(raw: Record<string, unknown>, eventType: "review" | "apply") {
  if (String(raw.schemaVersion || "") !== CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION) return false;
  if (raw.eventType !== eventType) return false;
  if (typeof raw.eventId !== "string" || !raw.eventId.trim()) return false;
  if (typeof raw.draftId !== "string" || !raw.draftId.trim()) return false;
  if (typeof raw.actorUserId !== "string" || !raw.actorUserId.trim()) return false;
  if (typeof raw.createdAt !== "string" || Number.isNaN(Date.parse(raw.createdAt))) return false;
  if (eventType === "review") {
    if (!isReviewStateOrNull(raw.previousReviewState)) return false;
    if (!parseReviewDecision(raw.nextReviewState)) return false;
    if (!isApplyStateOrNull(raw.previousApplyState)) return false;
    if (!parseApplyState(raw.nextApplyState)) return false;
    if (raw.resultCode !== "review_state_changed") return false;
    return true;
  }
  if (!isReviewStateOrNull(raw.previousReviewState)) return false;
  if (!isReviewStateOrNull(raw.nextReviewState)) return false;
  if (!isApplyStateOrNull(raw.previousApplyState)) return false;
  if (!parseApplyState(raw.nextApplyState)) return false;
  if (raw.result !== "applied" && raw.result !== "failed") return false;
  if (typeof raw.resultCode !== "string" || !raw.resultCode.trim()) return false;
  return true;
}

function isReviewStateOrNull(value: unknown) {
  if (value == null) return true;
  return parseReviewState(value) !== null;
}

function isApplyStateOrNull(value: unknown) {
  if (value == null) return true;
  return parseApplyState(value) !== null;
}

function parseReviewState(value: unknown): CreatePrepareAttachDraftReviewState | null {
  if (typeof value !== "string") return null;
  return isCreatePrepareAttachDraftReviewState(value) ? value : null;
}

function parseReviewDecision(value: unknown): CreatePrepareAttachDraftReviewDecision | null {
  if (typeof value !== "string") return null;
  return isCreatePrepareAttachDraftReviewDecision(value) ? value : null;
}

function parseApplyState(value: unknown): CreatePrepareAttachDraftApplyState | null {
  if (typeof value !== "string") return null;
  return isCreatePrepareAttachDraftApplyState(value) ? value : null;
}

function parseObjectIdLike(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  return null;
}

function getRowIdString(value: unknown): string | null {
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function deriveDeterministicObjectIdHex(seed: string): string {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const head = (hash >>> 0).toString(16).padStart(8, "0");
  const body = seed
    .split("")
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16)
    .padEnd(16, "0");
  return `${head}${body}`.slice(0, 24);
}
