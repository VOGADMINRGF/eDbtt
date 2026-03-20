import type {
  CreateAnalyzeMatchEntityType,
  CreateAnalyzeMatchItem,
  CreateAnalyzeMatchType,
} from "@/features/create/analyzeContract";
import type { CreateCtaHandoff } from "@/features/create/ctaHandoff";

export type CreatePrepareAttachCtaId = "perspektive_anhaengen" | "zustimmen" | "anders_sehen";
export type CreatePrepareAttachTargetType = "claim" | "anlassraum" | "dossier" | "perspective";
export type CreatePrepareAttachDraftReviewState =
  | "pending"
  | "accepted_for_apply"
  | "rejected"
  | "parked";
export type CreatePrepareAttachDraftApplyState = "not_applied" | "applied" | "apply_failed";
export type CreatePrepareAttachDraftReviewDecision = Exclude<
  CreatePrepareAttachDraftReviewState,
  "pending"
>;
export const CREATE_PREPARE_ATTACH_APPLY_STATES: ReadonlyArray<CreatePrepareAttachDraftApplyState> =
  ["not_applied", "applied", "apply_failed"];

export const CREATE_PREPARE_ATTACH_DRAFT_SCHEMA_VERSION = "create_prepare_attach_draft.v1";
export const CREATE_PREPARE_ATTACH_REVIEW_STATES: ReadonlyArray<CreatePrepareAttachDraftReviewState> =
  ["pending", "accepted_for_apply", "rejected", "parked"];
export const CREATE_PREPARE_ATTACH_REVIEW_DECISIONS: ReadonlyArray<CreatePrepareAttachDraftReviewDecision> =
  ["accepted_for_apply", "rejected", "parked"];

export type CreatePrepareAttachTargetOption = {
  key: string;
  attachTargetType: CreatePrepareAttachTargetType;
  attachTargetId: string;
  attachTargetRef: string | null;
  title: string;
  matchType: CreateAnalyzeMatchType;
  matchEntityType: CreateAnalyzeMatchEntityType;
  reasons: string[];
};

export type CreatePrepareAttachDraft = {
  schemaVersion: string;
  draftId: string;
  sourceRunId: string;
  ctaId: CreatePrepareAttachCtaId;
  matchType?: CreateAnalyzeMatchType | null;
  matchEntityType?: CreateAnalyzeMatchEntityType | null;
  attachTargetType: CreatePrepareAttachTargetType | null;
  attachTargetId: string | null;
  attachTargetRef?: string | null;
  attachTargetLabel?: string | null;
  sourceSummary: string;
  selectedReason?: string | null;
  reasons: string[];
  sourceLanguage: string;
  contentLanguage: string;
  uiLocale: string;
  requiresReview: true;
  noAutoPublish: true;
  noSilentMerge: true;
  originPreserved: true;
  duplicateRisk: boolean;
  reviewState: CreatePrepareAttachDraftReviewState;
  applyState: CreatePrepareAttachDraftApplyState;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  appliedAt?: string | null;
  appliedBy?: string | null;
  applyNote?: string | null;
  applyError?: string | null;
  userConfirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePrepareAttachDraftWriteInput = Omit<
  CreatePrepareAttachDraft,
  | "draftId"
  | "createdAt"
  | "updatedAt"
  | "reviewState"
  | "applyState"
  | "reviewNote"
  | "reviewedAt"
  | "reviewedBy"
>;

export function isCreatePrepareAttachDraftReviewState(
  value: string | null | undefined,
): value is CreatePrepareAttachDraftReviewState {
  return (CREATE_PREPARE_ATTACH_REVIEW_STATES as readonly string[]).includes(String(value || ""));
}

export function isCreatePrepareAttachDraftReviewDecision(
  value: string | null | undefined,
): value is CreatePrepareAttachDraftReviewDecision {
  return (CREATE_PREPARE_ATTACH_REVIEW_DECISIONS as readonly string[]).includes(String(value || ""));
}

export function isCreatePrepareAttachDraftApplyState(
  value: string | null | undefined,
): value is CreatePrepareAttachDraftApplyState {
  return (CREATE_PREPARE_ATTACH_APPLY_STATES as readonly string[]).includes(String(value || ""));
}

export function createInitialPrepareAttachDraftReviewFields() {
  return {
    reviewState: "pending" as const,
    applyState: "not_applied" as const,
    reviewNote: null,
    reviewedAt: null,
    reviewedBy: null,
    appliedAt: null,
    appliedBy: null,
    applyNote: null,
    applyError: null,
  };
}

export function applyPrepareAttachDraftReviewDecision(params: {
  decision: CreatePrepareAttachDraftReviewDecision;
  reviewNote?: string | null;
  reviewedAt: string;
  reviewedBy: string;
}) {
  return {
    reviewState: params.decision,
    applyState: "not_applied" as const,
    reviewNote: params.reviewNote?.trim() || null,
    reviewedAt: params.reviewedAt,
    reviewedBy: params.reviewedBy,
    appliedAt: null,
    appliedBy: null,
    applyNote: null,
    applyError: null,
  };
}

export function applyPrepareAttachDraftSuccess(params: {
  appliedAt: string;
  appliedBy: string;
  applyNote?: string | null;
}) {
  return {
    applyState: "applied" as const,
    appliedAt: params.appliedAt,
    appliedBy: params.appliedBy,
    applyNote: params.applyNote?.trim() || null,
    applyError: null,
  };
}

export function applyPrepareAttachDraftFailure(params: {
  appliedAt: string;
  appliedBy: string;
  applyNote?: string | null;
  applyError: string;
}) {
  return {
    applyState: "apply_failed" as const,
    appliedAt: params.appliedAt,
    appliedBy: params.appliedBy,
    applyNote: params.applyNote?.trim() || null,
    applyError: params.applyError,
  };
}

function toAttachTargetType(
  value: CreateAnalyzeMatchItem["matchEntityType"],
): CreatePrepareAttachTargetType | null {
  if (value === "claim") return "claim";
  if (value === "anlassraum") return "anlassraum";
  if (value === "dossier") return "dossier";
  if (value === "perspective") return "perspective";
  return null;
}

function normalizeAttachCtaId(value: CreateCtaHandoff["ctaId"]): CreatePrepareAttachCtaId | null {
  if (value === "perspektive_anhaengen") return "perspektive_anhaengen";
  if (value === "zustimmen") return "zustimmen";
  if (value === "anders_sehen") return "anders_sehen";
  return null;
}

export function canCreatePrepareAttachDraftFromHandoff(handoff: CreateCtaHandoff): boolean {
  return (
    handoff.actionType === "prepare_attach" &&
    normalizeAttachCtaId(handoff.ctaId) !== null
  );
}

export function derivePrepareAttachTargetOptions(matches: CreateAnalyzeMatchItem[]): CreatePrepareAttachTargetOption[] {
  const deduped = new Map<string, CreatePrepareAttachTargetOption>();
  for (const match of matches) {
    const attachTargetType = toAttachTargetType(match.matchEntityType);
    const attachTargetId = String(match.entityId || "").trim();
    if (!attachTargetType || !attachTargetId) continue;
    const key = `${attachTargetType}:${attachTargetId}`;
    if (deduped.has(key)) continue;
    deduped.set(key, {
      key,
      attachTargetType,
      attachTargetId,
      attachTargetRef: match.targetRef ?? null,
      title: match.label || `${attachTargetType}:${attachTargetId}`,
      matchType: match.matchType,
      matchEntityType: match.matchEntityType,
      reasons: Array.isArray(match.reasons) ? match.reasons.slice(0, 4) : [],
    });
  }
  return Array.from(deduped.values());
}

export function resolveInitialPrepareAttachTargetKey(params: {
  options: CreatePrepareAttachTargetOption[];
  handoff: CreateCtaHandoff;
}): string | null {
  if (params.options.length === 0) return null;
  if (params.options.length === 1) return params.options[0].key;
  // If multiple targets are plausible, user must pick explicitly.
  return null;
}

export function buildCreatePrepareAttachDraftInput(params: {
  sourceLanguage: string;
  contentLanguage: string;
  uiLocale: string;
  sourceRunId: string;
  sourceSummary: string;
  reasons: string[];
  userConfirmedAt: string | null;
  handoff: CreateCtaHandoff;
  selectedTarget: CreatePrepareAttachTargetOption;
  selectedReason?: string | null;
}): CreatePrepareAttachDraftWriteInput {
  const ctaId = normalizeAttachCtaId(params.handoff.ctaId);
  if (!ctaId) {
    throw new Error("invalid_prepare_attach_cta");
  }
  const selectedReason = params.selectedReason?.trim() || null;
  const duplicateRisk =
    params.selectedTarget.matchType === "duplicate_risk" ||
    params.handoff.matchType === "duplicate_risk";

  if (duplicateRisk && !selectedReason) {
    throw new Error("duplicate_risk_requires_reason");
  }

  const dedupedReasons = Array.from(
    new Set([
      ...(Array.isArray(params.reasons) ? params.reasons : []),
      ...(Array.isArray(params.selectedTarget.reasons) ? params.selectedTarget.reasons : []),
    ]),
  )
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 8);

  return {
    schemaVersion: CREATE_PREPARE_ATTACH_DRAFT_SCHEMA_VERSION,
    sourceRunId: params.sourceRunId,
    ctaId,
    matchType: params.selectedTarget.matchType ?? params.handoff.matchType ?? null,
    matchEntityType:
      params.selectedTarget.matchEntityType ?? params.handoff.matchEntityType ?? null,
    attachTargetType: params.selectedTarget.attachTargetType,
    attachTargetId: params.selectedTarget.attachTargetId,
    attachTargetRef: params.selectedTarget.attachTargetRef,
    attachTargetLabel: params.selectedTarget.title || null,
    sourceSummary: params.sourceSummary.trim(),
    selectedReason,
    reasons: dedupedReasons,
    sourceLanguage: params.sourceLanguage.trim() || "de",
    contentLanguage: params.contentLanguage.trim() || "de",
    uiLocale: params.uiLocale.trim() || "de",
    requiresReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
    originPreserved: true,
    duplicateRisk,
    userConfirmedAt: params.userConfirmedAt,
  };
}
