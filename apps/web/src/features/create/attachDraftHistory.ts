import { ObjectId } from "@core/db/triMongo";
import type {
  CreatePrepareAttachDraftApplyState,
  CreatePrepareAttachDraftReviewDecision,
  CreatePrepareAttachDraftReviewState,
  CreatePrepareAttachTargetType,
} from "@/features/create/prepareAttachDraft";

export const CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION = "create_prepare_attach_history.v1";

export const ATTACH_DRAFT_ERROR_CODES = [
  "invalid_attach_draft_id",
  "attach_draft_not_found",
  "actor_scope_forbidden",
  "attach_draft_review_state_not_accepted",
  "attach_draft_already_applied",
  "unsupported_attach_target_type",
  "invalid_attach_target",
  "invalid_attach_target_id",
  "attach_target_not_found",
  "attach_draft_state_conflict",
] as const;
export type CreatePrepareAttachDraftErrorCode = (typeof ATTACH_DRAFT_ERROR_CODES)[number];

export const ATTACH_DRAFT_HISTORY_RESULT_CODES = [
  "review_state_changed",
  "apply_success",
  "apply_failed_target_not_found",
  "apply_failed_invalid_target",
  "apply_failed_unsupported_target_type",
  "apply_failed_wrong_review_state",
  "apply_failed_already_applied",
  "apply_failed_state_conflict",
  "apply_failed_unknown",
] as const;
export type CreatePrepareAttachDraftHistoryResultCode = (typeof ATTACH_DRAFT_HISTORY_RESULT_CODES)[number];

export type CreatePrepareAttachReviewHistoryEvent = {
  schemaVersion: typeof CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION;
  eventType: "review";
  eventId: string;
  draftId: string;
  actorUserId: string;
  previousReviewState: CreatePrepareAttachDraftReviewState | null;
  nextReviewState: CreatePrepareAttachDraftReviewDecision;
  previousApplyState: CreatePrepareAttachDraftApplyState | null;
  nextApplyState: CreatePrepareAttachDraftApplyState;
  reviewNote: string | null;
  resultCode: "review_state_changed";
  createdAt: string;
};

export type CreatePrepareAttachApplyHistoryEvent = {
  schemaVersion: typeof CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION;
  eventType: "apply";
  eventId: string;
  draftId: string;
  actorUserId: string;
  targetType: CreatePrepareAttachTargetType | "unknown";
  targetId: string | null;
  result: "applied" | "failed";
  applyNote: string | null;
  mutationType: string | null;
  errorCode: CreatePrepareAttachDraftErrorCode | null;
  resultCode: Exclude<CreatePrepareAttachDraftHistoryResultCode, "review_state_changed">;
  previousReviewState: CreatePrepareAttachDraftReviewState | null;
  nextReviewState: CreatePrepareAttachDraftReviewState | null;
  previousApplyState: CreatePrepareAttachDraftApplyState | null;
  nextApplyState: CreatePrepareAttachDraftApplyState;
  createdAt: string;
};

export type CreatePrepareAttachDraftHistoryEvent =
  | CreatePrepareAttachReviewHistoryEvent
  | CreatePrepareAttachApplyHistoryEvent;

export type CreatePrepareAttachDraftHistoryEventDoc = CreatePrepareAttachDraftHistoryEvent & {
  _id?: ObjectId;
};

export function isCreatePrepareAttachDraftErrorCode(
  value: string | null | undefined,
): value is CreatePrepareAttachDraftErrorCode {
  return (ATTACH_DRAFT_ERROR_CODES as readonly string[]).includes(String(value || ""));
}

export function mapApplyFailureResultCode(
  errorCode: string | null | undefined,
): Exclude<CreatePrepareAttachDraftHistoryResultCode, "review_state_changed" | "apply_success"> {
  if (errorCode === "attach_target_not_found") return "apply_failed_target_not_found";
  if (errorCode === "invalid_attach_target" || errorCode === "invalid_attach_target_id")
    return "apply_failed_invalid_target";
  if (errorCode === "unsupported_attach_target_type") return "apply_failed_unsupported_target_type";
  if (errorCode === "attach_draft_review_state_not_accepted") return "apply_failed_wrong_review_state";
  if (errorCode === "attach_draft_already_applied") return "apply_failed_already_applied";
  if (errorCode === "attach_draft_state_conflict") return "apply_failed_state_conflict";
  return "apply_failed_unknown";
}

export function createReviewHistoryEvent(input: {
  draftId: string;
  actorUserId: string;
  previousReviewState: CreatePrepareAttachDraftReviewState | null;
  nextReviewState: CreatePrepareAttachDraftReviewDecision;
  previousApplyState: CreatePrepareAttachDraftApplyState | null;
  nextApplyState: CreatePrepareAttachDraftApplyState;
  reviewNote?: string | null;
  createdAt?: string;
  eventId?: string;
}): CreatePrepareAttachReviewHistoryEvent {
  return {
    schemaVersion: CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION,
    eventType: "review",
    eventId: input.eventId || new ObjectId().toHexString(),
    draftId: input.draftId,
    actorUserId: input.actorUserId,
    previousReviewState: input.previousReviewState,
    nextReviewState: input.nextReviewState,
    previousApplyState: input.previousApplyState,
    nextApplyState: input.nextApplyState,
    reviewNote: input.reviewNote?.trim() || null,
    resultCode: "review_state_changed",
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function createApplyHistoryEvent(input: {
  draftId: string;
  actorUserId: string;
  targetType: CreatePrepareAttachTargetType | "unknown";
  targetId: string | null;
  result: "applied" | "failed";
  applyNote?: string | null;
  mutationType?: string | null;
  errorCode?: string | null;
  previousReviewState: CreatePrepareAttachDraftReviewState | null;
  nextReviewState: CreatePrepareAttachDraftReviewState | null;
  previousApplyState: CreatePrepareAttachDraftApplyState | null;
  nextApplyState: CreatePrepareAttachDraftApplyState;
  createdAt?: string;
  eventId?: string;
}): CreatePrepareAttachApplyHistoryEvent {
  const normalizedError = isCreatePrepareAttachDraftErrorCode(input.errorCode)
    ? input.errorCode
    : null;
  const resultCode =
    input.result === "applied" ? "apply_success" : mapApplyFailureResultCode(normalizedError || input.errorCode);
  return {
    schemaVersion: CREATE_PREPARE_ATTACH_HISTORY_SCHEMA_VERSION,
    eventType: "apply",
    eventId: input.eventId || new ObjectId().toHexString(),
    draftId: input.draftId,
    actorUserId: input.actorUserId,
    targetType: input.targetType,
    targetId: input.targetId,
    result: input.result,
    applyNote: input.applyNote?.trim() || null,
    mutationType: input.mutationType ?? null,
    errorCode: normalizedError,
    resultCode,
    previousReviewState: input.previousReviewState,
    nextReviewState: input.nextReviewState,
    previousApplyState: input.previousApplyState,
    nextApplyState: input.nextApplyState,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

