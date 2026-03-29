import type { MunicipalResponsibilityStatus } from "@features/anlassraum/municipalResponsibilityGuardrails";
import {
  MUNICIPAL_ALLOWED_STATUSES,
} from "@features/anlassraum/municipalResponsibilityGuardrails";

export type MunicipalFollowUpStatus =
  | "none"
  | "open"
  | "in_progress"
  | "blocked"
  | "done";

export type MunicipalReleaseStatus =
  | "not_requested"
  | "pending_review"
  | "approved_for_public_trace"
  | "rejected";

export type MunicipalGovernanceMode = "monitoring_only" | "institutional_followup";

export type MunicipalGovernanceGate =
  | "monitoring_first"
  | "status_reason_required"
  | "follow_up_reason_required"
  | "release_reason_required"
  | "mandate_progress_trace_required"
  | "public_followup_trace_required"
  | "no_truth_or_priority_inference";

export type MunicipalGovernanceModeContract = {
  institutionalContext: boolean;
  governanceMode: MunicipalGovernanceMode;
  processStatus: MunicipalResponsibilityStatus;
  followUpStatus: MunicipalFollowUpStatus;
  releaseStatus: MunicipalReleaseStatus;
  mandateRef: string | null;
  dueAt: string | null;
  progressPercent: number | null;
  visibleGates: readonly MunicipalGovernanceGate[];
  explainability: {
    transitionReasonRequired: boolean;
    transitionReason: string | null;
    auditFieldsRequired: readonly ["processStatus", "followUpStatus", "releaseStatus", "reason", "changedBy", "changedAt"];
  };
  guardrails: {
    monitoringFirst: true;
    deniesTruthPrivilege: true;
    deniesPriorityPrivilege: true;
    deniesOverrideOfAnlassraumDossierReviewMandate: true;
    requiresAuditTrail: true;
    requiresPublicFollowupTraceability: true;
  };
};

export type MunicipalGovernanceTransitionValidation =
  | { ok: true }
  | {
      ok: false;
      error:
        | "invalid_non_institutional_transition"
        | "invalid_release_transition"
        | "transition_reason_required";
      issues: string[];
    };

const FOLLOW_UP_STATUSES: readonly MunicipalFollowUpStatus[] = [
  "none",
  "open",
  "in_progress",
  "blocked",
  "done",
] as const;

const RELEASE_STATUSES: readonly MunicipalReleaseStatus[] = [
  "not_requested",
  "pending_review",
  "approved_for_public_trace",
  "rejected",
] as const;

const INSTITUTIONAL_GATES: readonly MunicipalGovernanceGate[] = [
  "monitoring_first",
  "status_reason_required",
  "follow_up_reason_required",
  "release_reason_required",
  "mandate_progress_trace_required",
  "public_followup_trace_required",
  "no_truth_or_priority_inference",
] as const;

const NON_INSTITUTIONAL_GATES: readonly MunicipalGovernanceGate[] = [
  "monitoring_first",
  "no_truth_or_priority_inference",
] as const;

function normalizeProcessStatus(value: unknown): MunicipalResponsibilityStatus {
  if (typeof value !== "string") return "beobachtet";
  const normalized = value.trim().toLowerCase();
  if (MUNICIPAL_ALLOWED_STATUSES.includes(normalized as MunicipalResponsibilityStatus)) {
    return normalized as MunicipalResponsibilityStatus;
  }
  return "beobachtet";
}

function normalizeFollowUpStatus(value: unknown): MunicipalFollowUpStatus {
  if (typeof value !== "string") return "none";
  const normalized = value.trim().toLowerCase();
  if (FOLLOW_UP_STATUSES.includes(normalized as MunicipalFollowUpStatus)) {
    return normalized as MunicipalFollowUpStatus;
  }
  return "none";
}

function normalizeReleaseStatus(value: unknown): MunicipalReleaseStatus {
  if (typeof value !== "string") return "not_requested";
  const normalized = value.trim().toLowerCase();
  if (RELEASE_STATUSES.includes(normalized as MunicipalReleaseStatus)) {
    return normalized as MunicipalReleaseStatus;
  }
  return "not_requested";
}

function normalizeString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function normalizeDueAt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeProgress(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolveMunicipalGovernanceModeContract(input: {
  institutionalContext: boolean;
  processStatus: unknown;
  followUpStatus?: unknown;
  releaseStatus?: unknown;
  mandateRef?: unknown;
  dueAt?: unknown;
  progressPercent?: unknown;
  transitionReason?: unknown;
}): MunicipalGovernanceModeContract {
  const institutionalContext = Boolean(input.institutionalContext);
  const processStatus = institutionalContext ? normalizeProcessStatus(input.processStatus) : "beobachtet";
  const transitionReason = normalizeString(input.transitionReason, 500);

  const followUpStatus = institutionalContext ? normalizeFollowUpStatus(input.followUpStatus) : "none";
  const releaseStatus = institutionalContext ? normalizeReleaseStatus(input.releaseStatus) : "not_requested";
  const transitionReasonRequired =
    institutionalContext &&
    (processStatus !== "beobachtet" || followUpStatus === "blocked" || releaseStatus !== "not_requested");

  return {
    institutionalContext,
    governanceMode: institutionalContext ? "institutional_followup" : "monitoring_only",
    processStatus,
    followUpStatus,
    releaseStatus,
    mandateRef: normalizeString(input.mandateRef, 160),
    dueAt: normalizeDueAt(input.dueAt),
    progressPercent: normalizeProgress(input.progressPercent),
    visibleGates: institutionalContext ? INSTITUTIONAL_GATES : NON_INSTITUTIONAL_GATES,
    explainability: {
      transitionReasonRequired,
      transitionReason,
      auditFieldsRequired: [
        "processStatus",
        "followUpStatus",
        "releaseStatus",
        "reason",
        "changedBy",
        "changedAt",
      ],
    },
    guardrails: {
      monitoringFirst: true,
      deniesTruthPrivilege: true,
      deniesPriorityPrivilege: true,
      deniesOverrideOfAnlassraumDossierReviewMandate: true,
      requiresAuditTrail: true,
      requiresPublicFollowupTraceability: true,
    },
  };
}

export function validateMunicipalGovernanceModeTransition(input: {
  institutionalContext: boolean;
  previousProcessStatus: unknown;
  nextProcessStatus: unknown;
  previousFollowUpStatus: unknown;
  nextFollowUpStatus: unknown;
  previousReleaseStatus: unknown;
  nextReleaseStatus: unknown;
  transitionReason?: unknown;
}): MunicipalGovernanceTransitionValidation {
  const institutionalContext = Boolean(input.institutionalContext);
  const previousProcessStatus = normalizeProcessStatus(input.previousProcessStatus);
  const nextProcessStatus = normalizeProcessStatus(input.nextProcessStatus);
  const previousFollowUpStatus = normalizeFollowUpStatus(input.previousFollowUpStatus);
  const nextFollowUpStatus = normalizeFollowUpStatus(input.nextFollowUpStatus);
  const previousReleaseStatus = normalizeReleaseStatus(input.previousReleaseStatus);
  const nextReleaseStatus = normalizeReleaseStatus(input.nextReleaseStatus);
  const transitionReason = normalizeString(input.transitionReason, 500);

  const issues: string[] = [];
  if (!institutionalContext) {
    if (
      nextProcessStatus !== "beobachtet" ||
      nextFollowUpStatus !== "none" ||
      nextReleaseStatus !== "not_requested"
    ) {
      issues.push("non_institutional_context_forbids_governance_mode_transitions");
    }
  }

  if (
    previousReleaseStatus === "rejected" &&
    nextReleaseStatus === "approved_for_public_trace"
  ) {
    issues.push("release_transition_rejected_to_approved_forbidden");
  }

  const statusChanged =
    previousProcessStatus !== nextProcessStatus ||
    previousFollowUpStatus !== nextFollowUpStatus ||
    previousReleaseStatus !== nextReleaseStatus;
  const reasonRequired =
    statusChanged &&
    (nextProcessStatus !== "beobachtet" || nextFollowUpStatus === "blocked" || nextReleaseStatus !== "not_requested");
  if (reasonRequired && !transitionReason) {
    issues.push("transition_reason_required");
  }

  if (issues.length > 0) {
    if (issues.includes("non_institutional_context_forbids_governance_mode_transitions")) {
      return { ok: false, error: "invalid_non_institutional_transition", issues };
    }
    if (issues.includes("release_transition_rejected_to_approved_forbidden")) {
      return { ok: false, error: "invalid_release_transition", issues };
    }
    return { ok: false, error: "transition_reason_required", issues };
  }

  return { ok: true };
}
