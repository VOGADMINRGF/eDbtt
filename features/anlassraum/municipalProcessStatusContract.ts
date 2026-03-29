import {
  MUNICIPAL_ALLOWED_STATUSES,
  type MunicipalResponsibilityStatus,
} from "@features/anlassraum/municipalResponsibilityGuardrails";

export type MunicipalProcessStatusContract = {
  institutionalContext: boolean;
  currentStatus: MunicipalResponsibilityStatus;
  allowedTransitions: readonly MunicipalResponsibilityStatus[];
  mandate: {
    mandateRef: string | null;
    dueAt: string | null;
    progressPercent: number | null;
  };
  explainability: {
    statusReasonRequired: boolean;
    statusReason: string | null;
    auditFieldsRequired: readonly ["currentStatus", "statusReason", "changedBy", "changedAt"];
  };
  guardrails: {
    deniesTruthInferenceFromProcessStatus: true;
    deniesPriorityInferenceFromInstitutionStatus: true;
    deniesEpistemicClosureByCompletion: true;
    requiresOpenQuestionsAndConflictsVisible: true;
    requiresMonitoringFirst: true;
  };
};

export type MunicipalProcessTransitionValidation =
  | { ok: true; fromStatus: MunicipalResponsibilityStatus; toStatus: MunicipalResponsibilityStatus }
  | { ok: false; error: "invalid_status_transition" | "status_reason_required"; issues: string[] };

const ALLOWED_TRANSITIONS: Record<MunicipalResponsibilityStatus, readonly MunicipalResponsibilityStatus[]> = {
  beobachtet: ["beobachtet", "in_pruefung"],
  in_pruefung: ["beobachtet", "in_pruefung", "in_bearbeitung"],
  in_bearbeitung: ["in_pruefung", "in_bearbeitung", "umgesetzt"],
  umgesetzt: ["in_bearbeitung", "umgesetzt", "abgeschlossen"],
  abgeschlossen: ["in_bearbeitung", "abgeschlossen"],
} as const;

function normalizeStatus(value: unknown): MunicipalResponsibilityStatus {
  if (typeof value !== "string") return "beobachtet";
  const normalized = value.trim().toLowerCase();
  if (MUNICIPAL_ALLOWED_STATUSES.includes(normalized as MunicipalResponsibilityStatus)) {
    return normalized as MunicipalResponsibilityStatus;
  }
  return "beobachtet";
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 160) : null;
}

function normalizeReason(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 500) : null;
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

export function resolveMunicipalProcessStatusContract(input: {
  institutionalContext: boolean;
  currentStatus: unknown;
  mandateRef?: unknown;
  dueAt?: unknown;
  progressPercent?: unknown;
  statusReason?: unknown;
}): MunicipalProcessStatusContract {
  const institutionalContext = Boolean(input.institutionalContext);
  const baseStatus = normalizeStatus(input.currentStatus);
  const currentStatus = institutionalContext ? baseStatus : "beobachtet";
  const statusReason = normalizeReason(input.statusReason);
  const statusReasonRequired = currentStatus !== "beobachtet";
  const allowedTransitions = institutionalContext ? ALLOWED_TRANSITIONS[currentStatus] : (["beobachtet"] as const);

  return {
    institutionalContext,
    currentStatus,
    allowedTransitions,
    mandate: {
      mandateRef: normalizeString(input.mandateRef),
      dueAt: normalizeDueAt(input.dueAt),
      progressPercent: normalizeProgress(input.progressPercent),
    },
    explainability: {
      statusReasonRequired,
      statusReason,
      auditFieldsRequired: ["currentStatus", "statusReason", "changedBy", "changedAt"],
    },
    guardrails: {
      deniesTruthInferenceFromProcessStatus: true,
      deniesPriorityInferenceFromInstitutionStatus: true,
      deniesEpistemicClosureByCompletion: true,
      requiresOpenQuestionsAndConflictsVisible: true,
      requiresMonitoringFirst: true,
    },
  };
}

export function validateMunicipalProcessTransition(input: {
  institutionalContext: boolean;
  fromStatus: unknown;
  toStatus: unknown;
  statusReason?: unknown;
}): MunicipalProcessTransitionValidation {
  const institutionalContext = Boolean(input.institutionalContext);
  const fromStatus = institutionalContext ? normalizeStatus(input.fromStatus) : "beobachtet";
  const toStatus = institutionalContext ? normalizeStatus(input.toStatus) : "beobachtet";
  const statusReason = normalizeReason(input.statusReason);
  const allowed = institutionalContext ? ALLOWED_TRANSITIONS[fromStatus] : (["beobachtet"] as const);

  const issues: string[] = [];
  if (!allowed.includes(toStatus)) {
    issues.push(`transition_forbidden:${fromStatus}->${toStatus}`);
  }
  if (toStatus !== fromStatus && toStatus !== "beobachtet" && !statusReason) {
    issues.push("status_reason_required_for_transition");
  }

  if (issues.length > 0) {
    if (issues.includes("status_reason_required_for_transition")) {
      return { ok: false, error: "status_reason_required", issues };
    }
    return { ok: false, error: "invalid_status_transition", issues };
  }

  return { ok: true, fromStatus, toStatus };
}
