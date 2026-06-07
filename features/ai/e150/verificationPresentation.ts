import type { E150Lane } from "./journeyProfiles";
import {
  buildStandardLaneContract,
  deriveTruthGuardContract,
  deriveVerificationLabel,
  type SourceSupport,
  type TruthStatus,
  type ResearchUsed,
  type UserFacingVerificationLabel,
  type VerificationMode,
} from "./verificationContract";
import type { SealedFactcheckWorkflowStage } from "./factcheckStatus";
import { resolveSealedFactcheckStatusView } from "./factcheckStatus";

export type VerificationBadgeTone = "neutral" | "caution" | "success";

export type VerificationPresentationView = {
  lane: E150Lane;
  laneLabel: string;
  verificationMode: VerificationMode;
  verificationLabel: UserFacingVerificationLabel;
  verificationLabelDisplay: string;
  verificationHint: string;
  truthStatus: TruthStatus;
  truthStatusLabel: string;
  sourceSupport: SourceSupport;
  sourceSupportLabel: string;
  sourceStatus: string;
  reviewRecommended: boolean;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
  researchUsed: ResearchUsed;
  researchLabel: string;
  sealEligible: boolean;
  sealGranted: boolean;
  sealLabel: string;
  workflowStage: SealedFactcheckWorkflowStage | null;
  workflowLabel: string | null;
  badgeTone: VerificationBadgeTone;
  isVerified: boolean;
};

type ResolveVerificationPresentationArgs = {
  lane?: unknown;
  status?: string | null;
  verificationMode?: unknown;
  researchUsed?: unknown;
  sealEligible?: unknown;
  sealGranted?: unknown;
  verificationLabel?: unknown;
  truthStatus?: unknown;
  sourceSupport?: unknown;
  sourceStatus?: unknown;
  reviewRecommended?: unknown;
};

const TRUTH_STATUS_LABEL: Record<TruthStatus, string> = {
  draft_analysis: "Analyse-Entwurf",
  source_open: "Quellenlage offen",
  source_grounded: "Quellenbezug vorhanden",
  review_required: "Prüfung empfohlen",
  factcheck_requested: "Quellenprüfung angefragt",
  factcheck_passed: "Quellenprüfung erfolgt",
  sealed_verified: "Verifiziert",
};

const SOURCE_SUPPORT_LABEL: Record<SourceSupport, string> = {
  none: "Keine Quellenprüfung gestartet",
  open: "Noch unbelegt",
  inferred: "Abgeleitet – bitte prüfen",
  partial: "Teilweise belegt",
  sourced: "Quellenbezug vorhanden",
  sealed: "Verifiziert",
};

const RESEARCH_LABEL: Record<ResearchUsed, string> = {
  none: "keine Recherche",
  lite: "Lite-Recherche",
  gemini: "Gemini Research",
  search: "Search",
  deep_search: "Deep Search",
};

function asLane(value: unknown): E150Lane | null {
  if (value === "standard" || value === "sealed_factcheck" || value === "material_grounding") return value;
  return null;
}

function asVerificationMode(value: unknown): VerificationMode | null {
  if (value === "none" || value === "precheck" || value === "sealed") return value;
  return null;
}

function asVerificationLabel(value: unknown): UserFacingVerificationLabel | null {
  if (value === "analysiert" || value === "geprueft" || value === "verifiziert") return value;
  return null;
}

function asTruthStatus(value: unknown): TruthStatus | null {
  if (
    value === "draft_analysis" ||
    value === "source_open" ||
    value === "source_grounded" ||
    value === "review_required" ||
    value === "factcheck_requested" ||
    value === "factcheck_passed" ||
    value === "sealed_verified"
  ) {
    return value;
  }
  return null;
}

function asSourceSupport(value: unknown): SourceSupport | null {
  if (
    value === "none" ||
    value === "open" ||
    value === "inferred" ||
    value === "partial" ||
    value === "sourced" ||
    value === "sealed"
  ) {
    return value;
  }
  return null;
}

function resolveLane(args: ResolveVerificationPresentationArgs): E150Lane {
  const explicitLane = asLane(args.lane);
  if (explicitLane) return explicitLane;
  return asVerificationMode(args.verificationMode) === "sealed" ? "sealed_factcheck" : "standard";
}

export function getTruthStatusLabel(status: TruthStatus): string {
  return TRUTH_STATUS_LABEL[status];
}

export function getSourceSupportLabel(sourceSupport: SourceSupport): string {
  return SOURCE_SUPPORT_LABEL[sourceSupport];
}

export function getVerificationDisplayLabel(params: {
  verificationLabel: UserFacingVerificationLabel;
  truthStatus: TruthStatus;
  workflowStage?: SealedFactcheckWorkflowStage | null;
}): string {
  if (params.truthStatus === "sealed_verified" || params.verificationLabel === "verifiziert") {
    return "Verifiziert";
  }
  if (
    params.workflowStage === "completed" ||
    params.workflowStage === "seal_review_required" ||
    params.workflowStage === "not_seal_eligible" ||
    params.truthStatus === "factcheck_passed"
  ) {
    return "Quellenprüfung erfolgt";
  }
  if (
    params.workflowStage === "started" ||
    params.workflowStage === "requested" ||
    params.workflowStage === "queued" ||
    params.workflowStage === "provider_review_required" ||
    params.workflowStage === "in_progress" ||
    params.workflowStage === "needs_source" ||
    params.truthStatus === "factcheck_requested"
  ) {
    return "Quellenprüfung angefragt";
  }
  if (params.truthStatus === "review_required") return "Prüfung empfohlen";
  if (params.truthStatus === "source_grounded") return "Quellenbezug vorhanden";
  if (params.truthStatus === "source_open") return "Quellenlage offen";
  return "Analyse-Entwurf";
}

export function getTruthGuardHint(params: {
  truthStatus: TruthStatus;
  sourceSupport: SourceSupport;
  sourceStatus: string;
  reviewRecommended: boolean;
  workflowStage?: SealedFactcheckWorkflowStage | null;
}): string {
  if (params.truthStatus === "sealed_verified") {
    return "Der sealed Factcheck ist abgeschlossen. Erst damit liegt ein verifizierter Status vor.";
  }
  if (
    params.workflowStage === "completed" ||
    params.workflowStage === "seal_review_required" ||
    params.truthStatus === "factcheck_passed"
  ) {
    return "Die Quellenprüfung ist erfolgt. Ein Wahrheitssiegel besteht erst mit explizit erteiltem Siegel.";
  }
  if (
    params.workflowStage === "started" ||
    params.workflowStage === "requested" ||
    params.workflowStage === "queued" ||
    params.workflowStage === "provider_review_required" ||
    params.workflowStage === "in_progress" ||
    params.workflowStage === "needs_source" ||
    params.truthStatus === "factcheck_requested"
  ) {
    return "Die Quellenprüfung wurde angefragt oder vorbereitet. Ein belastbarer Abschluss liegt noch nicht vor.";
  }
  if (params.sourceSupport === "none" || params.sourceSupport === "open") {
    return "Diese Einordnung strukturiert deinen Beitrag. Es wurde noch keine Quellenprüfung gestartet.";
  }
  if (params.sourceSupport === "inferred" || params.sourceSupport === "partial") {
    return "Die Einordnung enthält offene oder abgeleitete Punkte. Bitte die Quellenlage vor belastbarer Verwendung klären.";
  }
  if (params.reviewRecommended || params.truthStatus === "review_required") {
    return "Diese Einordnung bleibt ein Arbeitsstand. Vor Veröffentlichung oder Zusammenführung ist eine Prüfung empfohlen.";
  }
  if (params.truthStatus === "source_grounded") {
    return "Es gibt Quellenbezug, aber keine versiegelte Verifizierung.";
  }
  return params.sourceStatus;
}

function resolveBadgeTone(params: {
  truthStatus: TruthStatus;
  reviewRecommended: boolean;
}): VerificationBadgeTone {
  if (params.truthStatus === "sealed_verified") return "success";
  if (params.reviewRecommended || params.truthStatus !== "draft_analysis") return "caution";
  return "neutral";
}

function resolveTruthGuardView(args: {
  lane: E150Lane;
  verificationMode: VerificationMode;
  sealGranted: boolean;
  workflowStage?: SealedFactcheckWorkflowStage | null;
  verificationLabelFallback: UserFacingVerificationLabel;
  reviewRecommendedFallback?: boolean;
} & ResolveVerificationPresentationArgs) {
  const derived = deriveTruthGuardContract({
    lane: args.lane,
    verificationMode: args.verificationMode,
    sealGranted: args.sealGranted,
    reviewRecommended: args.reviewRecommendedFallback,
  });
  const truthStatus = asTruthStatus(args.truthStatus) ?? derived.truthStatus;
  const sourceSupport = asSourceSupport(args.sourceSupport) ?? derived.sourceSupport;
  const sourceStatus =
    typeof args.sourceStatus === "string" && args.sourceStatus.trim().length > 0
      ? args.sourceStatus.trim()
      : derived.sourceStatus;
  const reviewRecommended =
    typeof args.reviewRecommended === "boolean"
      ? args.reviewRecommended
      : args.reviewRecommendedFallback ?? derived.reviewRecommended;
  const verificationLabel =
    asVerificationLabel(args.verificationLabel) ??
    (truthStatus === "sealed_verified"
      ? "verifiziert"
      : truthStatus === "source_grounded" || truthStatus === "factcheck_passed"
        ? "geprueft"
        : derived.verificationLabel ?? args.verificationLabelFallback);

  return {
    verificationLabel,
    verificationLabelDisplay: getVerificationDisplayLabel({
      verificationLabel,
      truthStatus,
      workflowStage: args.workflowStage ?? null,
    }),
    verificationHint: getTruthGuardHint({
      truthStatus,
      sourceSupport,
      sourceStatus,
      reviewRecommended,
      workflowStage: args.workflowStage ?? null,
    }),
    truthStatus,
    truthStatusLabel: getTruthStatusLabel(truthStatus),
    sourceSupport,
    sourceSupportLabel: getSourceSupportLabel(sourceSupport),
    sourceStatus,
    reviewRecommended,
    noTruthPromotion: true as const,
    noAutoGraphPromotion: true as const,
  };
}

export function resolveVerificationPresentationView(
  args: ResolveVerificationPresentationArgs,
): VerificationPresentationView {
  const lane = resolveLane(args);

  if (lane === "sealed_factcheck") {
    const sealedView = resolveSealedFactcheckStatusView({
      status: args.status,
      verificationMode: args.verificationMode,
      researchUsed: args.researchUsed,
      sealEligible: args.sealEligible,
      sealGranted: args.sealGranted,
    });
    return {
      lane,
      laneLabel: "Sealed Factcheck-Lane",
      verificationMode: sealedView.verificationMode,
      ...resolveTruthGuardView({
        ...args,
        lane,
        verificationMode: sealedView.verificationMode,
        sealGranted: sealedView.sealGranted,
        workflowStage: sealedView.workflowStage,
        verificationLabelFallback: sealedView.verificationLabel,
        reviewRecommendedFallback: sealedView.workflowStage !== "sealed" && sealedView.workflowStage !== "completed",
      }),
      researchUsed: sealedView.researchUsed,
      researchLabel: RESEARCH_LABEL[sealedView.researchUsed],
      sealEligible: sealedView.sealEligible,
      sealGranted: sealedView.sealGranted,
      sealLabel: sealedView.sealLabel,
      workflowStage: sealedView.workflowStage,
      workflowLabel: sealedView.workflowLabel,
      badgeTone: resolveBadgeTone(
        resolveTruthGuardView({
          ...args,
          lane,
          verificationMode: sealedView.verificationMode,
          sealGranted: sealedView.sealGranted,
          workflowStage: sealedView.workflowStage,
          verificationLabelFallback: sealedView.verificationLabel,
          reviewRecommendedFallback: sealedView.workflowStage !== "sealed" && sealedView.workflowStage !== "completed",
        }),
      ),
      isVerified: sealedView.sealGranted === true,
    };
  }

  const modeRaw = asVerificationMode(args.verificationMode);
  const standardMode: "none" | "precheck" =
    modeRaw === "precheck" ? "precheck" : "none";
  const standardContract = buildStandardLaneContract({
    verificationMode: standardMode,
    researchUsed: args.researchUsed === "gemini" || args.researchUsed === "deep_search" ? args.researchUsed : "none",
  });
  const verificationLabel = deriveVerificationLabel({
    verificationMode: standardContract.verificationMode,
    sealGranted: standardContract.sealGranted,
  });

  const laneLabel = lane === "material_grounding" ? "Material-Grounding-Lane" : "Standard-Lane";

  return {
    lane,
    laneLabel,
    verificationMode: standardContract.verificationMode,
    ...resolveTruthGuardView({
      ...args,
      lane,
      verificationMode: standardContract.verificationMode,
      sealGranted: standardContract.sealGranted,
      verificationLabelFallback: verificationLabel,
    }),
    researchUsed: standardContract.researchUsed,
    researchLabel: RESEARCH_LABEL[standardContract.researchUsed],
    sealEligible: standardContract.sealEligible,
    sealGranted: standardContract.sealGranted,
    sealLabel: "kein Siegel",
    workflowStage: null,
    workflowLabel: null,
    badgeTone: resolveBadgeTone(
      resolveTruthGuardView({
        ...args,
        lane,
        verificationMode: standardContract.verificationMode,
        sealGranted: standardContract.sealGranted,
        verificationLabelFallback: verificationLabel,
      }),
    ),
    isVerified: false,
  };
}
