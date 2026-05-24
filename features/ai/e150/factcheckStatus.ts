import {
  factcheckSealDecisionLabel,
  factcheckStatusLabel,
  factcheckVerificationModeToCompatibilityMode,
  factcheckResearchModeToCompatibilityResearchUsed,
} from "@features/factcheck/workflow";
import {
  deriveVerificationLabel,
  type ResearchUsed,
  type UserFacingVerificationLabel,
  type VerificationContract,
  type VerificationMode,
} from "./verificationContract";
import type {
  FactcheckResearchMode,
  FactcheckSealDecision,
  FactcheckSealEligibility,
  FactcheckStatus,
  FactcheckVerificationMode,
} from "@features/factcheck/db";

export type SealedFactcheckWorkflowStage =
  | "started"
  | "requested"
  | "queued"
  | "provider_review_required"
  | "in_progress"
  | "needs_source"
  | "completed"
  | "rejected"
  | "seal_review_required"
  | "sealed"
  | "not_seal_eligible"
  | "archived";

export type SealedFactcheckSealState =
  | "not_eligible"
  | "pending"
  | "granted"
  | "revoked"
  | "none";

export type SealedFactcheckStatusView = VerificationContract & {
  verificationLabel: UserFacingVerificationLabel;
  workflowStage: SealedFactcheckWorkflowStage;
  workflowLabel: string;
  sealState: SealedFactcheckSealState;
  sealLabel: string;
  factcheckStatus: FactcheckStatus;
  factcheckStatusLabel: string;
  factcheckVerificationMode: FactcheckVerificationMode;
  factcheckResearchMode: FactcheckResearchMode;
  factcheckSealEligibility: FactcheckSealEligibility;
  factcheckSealDecision: FactcheckSealDecision;
};

type VerificationLike = Partial<VerificationContract> | null | undefined;

const WORKFLOW_LABELS: Record<SealedFactcheckWorkflowStage, string> = {
  started: "angelegt",
  requested: "Prüfung angefragt",
  queued: "in Warteschlange",
  provider_review_required: "Provider-Freigabe erforderlich",
  in_progress: "Prüfung läuft",
  needs_source: "Quellen fehlen",
  completed: "Ergebnis liegt vor",
  rejected: "abgelehnt",
  seal_review_required: "Siegelprüfung erforderlich",
  sealed: "versiegelt",
  not_seal_eligible: "nicht siegelfähig",
  archived: "archiviert",
};

const SEAL_LABELS: Record<SealedFactcheckSealState, string> = {
  none: "kein Siegel",
  not_eligible: "nicht siegelfähig",
  pending: "Siegelprüfung ausstehend",
  granted: "Siegel erteilt",
  revoked: "Siegel widerrufen",
};

function asVerificationMode(value: unknown): VerificationMode | null {
  if (value === "none" || value === "precheck" || value === "sealed") return value;
  return null;
}

function asResearchUsed(value: unknown): ResearchUsed | null {
  if (
    value === "none" ||
    value === "lite" ||
    value === "search" ||
    value === "deep_search" ||
    value === "gemini"
  ) {
    return value;
  }
  return null;
}

function asFactcheckStatus(value: unknown): FactcheckStatus | null {
  switch (value) {
    case "draft":
    case "requested":
    case "queued":
    case "provider_review_required":
    case "running":
    case "needs_source":
    case "completed":
    case "rejected":
    case "seal_review_required":
    case "sealed":
    case "not_seal_eligible":
    case "archived":
      return value;
    default:
      return null;
  }
}

function asFactcheckVerificationMode(value: unknown): FactcheckVerificationMode | null {
  switch (value) {
    case "none":
    case "intake_only":
    case "manual_review":
    case "provider_assisted":
    case "operator_verified":
    case "sealed":
      return value;
    default:
      return null;
  }
}

function asFactcheckResearchMode(value: unknown): FactcheckResearchMode | null {
  switch (value) {
    case "none":
    case "light_metadata":
    case "manual_review":
    case "provider_assisted":
    case "deep_research_requested":
    case "deep_research_approved":
      return value;
    default:
      return null;
  }
}

function asFactcheckSealEligibility(value: unknown): FactcheckSealEligibility | null {
  switch (value) {
    case "unknown":
    case "eligible":
    case "needs_review":
    case "not_eligible":
      return value;
    default:
      return null;
  }
}

function asFactcheckSealDecision(value: unknown): FactcheckSealDecision | null {
  switch (value) {
    case "none":
    case "requested":
    case "granted":
    case "revoked":
      return value;
    default:
      return null;
  }
}

function asOptionalBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function resolveWorkflowStage(status: FactcheckStatus | null): SealedFactcheckWorkflowStage {
  switch (status) {
    case "requested":
      return "requested";
    case "queued":
      return "queued";
    case "provider_review_required":
      return "provider_review_required";
    case "running":
      return "in_progress";
    case "needs_source":
      return "needs_source";
    case "completed":
      return "completed";
    case "rejected":
      return "rejected";
    case "seal_review_required":
      return "seal_review_required";
    case "sealed":
      return "sealed";
    case "not_seal_eligible":
      return "not_seal_eligible";
    case "archived":
      return "archived";
    case "draft":
    default:
      return "started";
  }
}

function resolveSealState(params: {
  sealEligibility: FactcheckSealEligibility;
  sealDecision: FactcheckSealDecision;
}): SealedFactcheckSealState {
  if (params.sealDecision === "granted") return "granted";
  if (params.sealDecision === "revoked") return "revoked";
  if (params.sealEligibility === "not_eligible") return "not_eligible";
  if (params.sealDecision === "requested" || params.sealEligibility === "needs_review") {
    return "pending";
  }
  return "none";
}

export function resolveSealedFactcheckWorkflowStage(
  status: string | null | undefined,
): SealedFactcheckWorkflowStage {
  return resolveWorkflowStage(asFactcheckStatus(status));
}

export function resolveSealedFactcheckStatusView(params: {
  status?: string | null;
  verification?: VerificationLike;
  verificationMode?: unknown;
  researchUsed?: unknown;
  sealEligible?: unknown;
  sealGranted?: unknown;
  factcheckVerificationMode?: unknown;
  factcheckResearchMode?: unknown;
  factcheckSealEligibility?: unknown;
  factcheckSealDecision?: unknown;
}): SealedFactcheckStatusView {
  const factcheckStatus = asFactcheckStatus(params.status) ?? "draft";
  const factcheckVerificationMode =
    asFactcheckVerificationMode(params.factcheckVerificationMode) ??
    (factcheckStatus === "sealed"
      ? "sealed"
      : factcheckStatus === "completed" || factcheckStatus === "seal_review_required"
        ? "operator_verified"
        : factcheckStatus === "provider_review_required"
          ? "provider_assisted"
          : "intake_only");
  const factcheckResearchMode =
    asFactcheckResearchMode(params.factcheckResearchMode) ??
    (asResearchUsed(params.researchUsed) === "deep_search"
      ? "deep_research_requested"
      : asResearchUsed(params.researchUsed) === "search"
        ? "provider_assisted"
        : "none");
  const factcheckSealEligibility =
    asFactcheckSealEligibility(params.factcheckSealEligibility) ??
    (asOptionalBoolean(params.sealEligible) === false ? "not_eligible" : "needs_review");
  const factcheckSealDecision =
    asFactcheckSealDecision(params.factcheckSealDecision) ??
    (asOptionalBoolean(params.sealGranted) === true ? "granted" : "none");

  const compatibilityVerificationMode =
    asVerificationMode(params.verification?.verificationMode) ??
    asVerificationMode(params.verificationMode) ??
    factcheckVerificationModeToCompatibilityMode(factcheckVerificationMode);
  const compatibilityResearchUsed =
    asResearchUsed(params.verification?.researchUsed) ??
    asResearchUsed(params.researchUsed) ??
    factcheckResearchModeToCompatibilityResearchUsed(factcheckResearchMode);
  const compatibilitySealEligible =
    asOptionalBoolean(params.verification?.sealEligible) ??
    asOptionalBoolean(params.sealEligible) ??
    (factcheckSealEligibility === "eligible" ||
      factcheckSealEligibility === "needs_review");
  const compatibilitySealGranted =
    asOptionalBoolean(params.verification?.sealGranted) ??
    asOptionalBoolean(params.sealGranted) ??
    factcheckSealDecision === "granted";

  const workflowStage = resolveWorkflowStage(factcheckStatus);
  const sealState = resolveSealState({
    sealEligibility: factcheckSealEligibility,
    sealDecision: factcheckSealDecision,
  });

  return {
    verificationMode: compatibilityVerificationMode,
    researchUsed: compatibilityResearchUsed,
    sealEligible: compatibilitySealEligible,
    sealGranted: compatibilitySealGranted,
    verificationLabel: deriveVerificationLabel({
      verificationMode: compatibilityVerificationMode,
      sealGranted: compatibilitySealGranted,
    }),
    workflowStage,
    workflowLabel: WORKFLOW_LABELS[workflowStage],
    sealState,
    sealLabel:
      factcheckSealDecision === "granted" || factcheckSealDecision === "revoked"
        ? factcheckSealDecisionLabel(factcheckSealDecision)
        : SEAL_LABELS[sealState],
    factcheckStatus,
    factcheckStatusLabel: factcheckStatusLabel(factcheckStatus),
    factcheckVerificationMode,
    factcheckResearchMode,
    factcheckSealEligibility,
    factcheckSealDecision,
  };
}
