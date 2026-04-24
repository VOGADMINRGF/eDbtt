import { buildSealedFactcheckContract } from "./factcheckProfiles";
import {
  deriveVerificationLabel,
  type ResearchUsed,
  type UserFacingVerificationLabel,
  type VerificationContract,
  type VerificationMode,
} from "./verificationContract";

export type SealedFactcheckWorkflowStage =
  | "started"
  | "queued"
  | "in_progress"
  | "completed";

export type SealedFactcheckSealState = "not_eligible" | "pending" | "granted";

export type SealedFactcheckStatusView = VerificationContract & {
  verificationLabel: UserFacingVerificationLabel;
  workflowStage: SealedFactcheckWorkflowStage;
  workflowLabel: string;
  sealState: SealedFactcheckSealState;
  sealLabel: string;
};

type VerificationLike = Partial<VerificationContract> | null | undefined;

const WORKFLOW_LABELS: Record<SealedFactcheckWorkflowStage, string> = {
  started: "gestartet",
  queued: "queued",
  in_progress: "in Prüfung",
  completed: "abgeschlossen",
};

const SEAL_LABELS: Record<SealedFactcheckSealState, string> = {
  not_eligible: "kein Siegel",
  pending: "Siegel ausstehend",
  granted: "Siegel erteilt",
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
    value === "deep_search"
  ) {
    return value;
  }
  return null;
}

function asOptionalBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function resolveSealState(params: {
  verificationMode: VerificationMode;
  sealEligible: boolean;
  sealGranted: boolean;
}): SealedFactcheckSealState {
  if (!params.sealEligible) return "not_eligible";
  if (params.verificationMode === "sealed" && params.sealGranted) return "granted";
  return "pending";
}

export function resolveSealedFactcheckWorkflowStage(
  status: string | null | undefined,
): SealedFactcheckWorkflowStage {
  const normalized = (status ?? "").trim().toLowerCase();
  if (!normalized) return "started";
  if (normalized === "started" || normalized === "created" || normalized === "init") {
    return "started";
  }
  if (normalized === "queued" || normalized === "pending") return "queued";
  if (
    normalized === "processing" ||
    normalized === "running" ||
    normalized === "in_progress"
  ) {
    return "in_progress";
  }
  if (normalized === "completed" || normalized === "failed" || normalized === "error") {
    return "completed";
  }
  return "started";
}

export function resolveSealedFactcheckStatusView(params: {
  status?: string | null;
  verification?: VerificationLike;
  verificationMode?: unknown;
  researchUsed?: unknown;
  sealEligible?: unknown;
  sealGranted?: unknown;
}): SealedFactcheckStatusView {
  const verificationMode =
    asVerificationMode(params.verification?.verificationMode) ??
    asVerificationMode(params.verificationMode);
  const researchUsed =
    asResearchUsed(params.verification?.researchUsed) ??
    asResearchUsed(params.researchUsed);
  const sealEligible =
    asOptionalBoolean(params.verification?.sealEligible) ??
    asOptionalBoolean(params.sealEligible);
  const sealGranted =
    asOptionalBoolean(params.verification?.sealGranted) ??
    asOptionalBoolean(params.sealGranted);

  const fallback = buildSealedFactcheckContract({
    researchUsed: researchUsed === "deep_search" ? "deep_search" : "search",
    sealGranted: sealGranted === true,
  });

  const resolvedVerificationMode = verificationMode ?? fallback.verificationMode;
  const resolvedResearchUsed = researchUsed ?? fallback.researchUsed;
  const resolvedSealEligible = sealEligible ?? fallback.sealEligible;
  const resolvedSealGranted = sealGranted ?? fallback.sealGranted;
  const workflowStage = resolveSealedFactcheckWorkflowStage(params.status);
  const sealState = resolveSealState({
    verificationMode: resolvedVerificationMode,
    sealEligible: resolvedSealEligible,
    sealGranted: resolvedSealGranted,
  });

  return {
    verificationMode: resolvedVerificationMode,
    researchUsed: resolvedResearchUsed,
    sealEligible: resolvedSealEligible,
    sealGranted: resolvedSealGranted,
    verificationLabel: deriveVerificationLabel({
      verificationMode: resolvedVerificationMode,
      sealGranted: resolvedSealGranted,
    }),
    workflowStage,
    workflowLabel: WORKFLOW_LABELS[workflowStage],
    sealState,
    sealLabel: SEAL_LABELS[sealState],
  };
}
