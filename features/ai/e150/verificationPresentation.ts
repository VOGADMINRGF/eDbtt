import type { E150Lane } from "./journeyProfiles";
import {
  buildStandardLaneContract,
  deriveVerificationLabel,
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
};

const LABEL_DISPLAY: Record<UserFacingVerificationLabel, string> = {
  analysiert: "analysiert",
  geprueft: "geprüft",
  verifiziert: "verifiziert",
};

const LABEL_HINT: Record<UserFacingVerificationLabel, string> = {
  analysiert: "Analysiert: Struktur und Plausibilisierung ohne verifizierten Faktencheck.",
  geprueft: "Geprüft: Vorprüfung oder laufender sealed Factcheck, Siegel noch ausstehend.",
  verifiziert: "Verifiziert: sealed Factcheck vollständig abgeschlossen, Siegel erteilt.",
};

const RESEARCH_LABEL: Record<ResearchUsed, string> = {
  none: "keine Recherche",
  lite: "Lite-Recherche",
  search: "Search",
  deep_search: "Deep Search",
};

const WORKFLOW_LABEL: Record<SealedFactcheckWorkflowStage, string> = {
  started: "gestartet",
  queued: "in Warteschlange",
  in_progress: "in Prüfung",
  completed: "abgeschlossen",
};

function asLane(value: unknown): E150Lane | null {
  if (value === "standard" || value === "sealed_factcheck") return value;
  return null;
}

function asVerificationMode(value: unknown): VerificationMode | null {
  if (value === "none" || value === "precheck" || value === "sealed") return value;
  return null;
}

function resolveLane(args: ResolveVerificationPresentationArgs): E150Lane {
  const explicitLane = asLane(args.lane);
  if (explicitLane) return explicitLane;
  return asVerificationMode(args.verificationMode) === "sealed" ? "sealed_factcheck" : "standard";
}

function resolveBadgeTone(label: UserFacingVerificationLabel): VerificationBadgeTone {
  if (label === "verifiziert") return "success";
  if (label === "geprueft") return "caution";
  return "neutral";
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
      verificationLabel: sealedView.verificationLabel,
      verificationLabelDisplay: LABEL_DISPLAY[sealedView.verificationLabel],
      verificationHint: LABEL_HINT[sealedView.verificationLabel],
      researchUsed: sealedView.researchUsed,
      researchLabel: RESEARCH_LABEL[sealedView.researchUsed],
      sealEligible: sealedView.sealEligible,
      sealGranted: sealedView.sealGranted,
      sealLabel: sealedView.sealLabel,
      workflowStage: sealedView.workflowStage,
      workflowLabel: WORKFLOW_LABEL[sealedView.workflowStage],
      badgeTone: resolveBadgeTone(sealedView.verificationLabel),
      isVerified: sealedView.verificationLabel === "verifiziert",
    };
  }

  const modeRaw = asVerificationMode(args.verificationMode);
  const standardMode: "none" | "precheck" =
    modeRaw === "precheck" ? "precheck" : "none";
  const standardContract = buildStandardLaneContract({
    verificationMode: standardMode,
  });
  const verificationLabel = deriveVerificationLabel({
    verificationMode: standardContract.verificationMode,
    sealGranted: standardContract.sealGranted,
  });

  return {
    lane,
    laneLabel: "Standard-Lane",
    verificationMode: standardContract.verificationMode,
    verificationLabel,
    verificationLabelDisplay: LABEL_DISPLAY[verificationLabel],
    verificationHint: LABEL_HINT[verificationLabel],
    researchUsed: standardContract.researchUsed,
    researchLabel: RESEARCH_LABEL[standardContract.researchUsed],
    sealEligible: standardContract.sealEligible,
    sealGranted: standardContract.sealGranted,
    sealLabel: "kein Siegel",
    workflowStage: null,
    workflowLabel: null,
    badgeTone: resolveBadgeTone(verificationLabel),
    isVerified: false,
  };
}
