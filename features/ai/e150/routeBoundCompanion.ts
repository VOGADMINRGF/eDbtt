import { resolveJourneyProfile, type E150RoleRoutingInput } from "./roleRouting";
import { resolveVerificationPresentationView } from "./verificationPresentation";
import type {
  ResearchUsed,
  SourceSupport,
  TruthStatus,
  UserFacingVerificationLabel,
  VerificationMode,
} from "./verificationContract";
import type { E150JourneyKey, E150Lane } from "./journeyProfiles";
import {
  normalizePresentationText,
  normalizePresentationTextList,
  runNonMutativePresentationPass,
  type PresentationPassExecutionMeta,
} from "./presentationPass";

export type RouteBoundCompanionContextKind =
  | "dossier"
  | "factcheck"
  | "guided_workspace"
  | "journalist_companion";

export type RouteBoundCompanionParentStatus = {
  status?: string | null;
  lane?: E150Lane;
  verificationMode?: VerificationMode;
  researchUsed?: ResearchUsed;
  sealEligible?: boolean;
  sealGranted?: boolean;
  verificationLabel?: UserFacingVerificationLabel;
  truthStatus?: TruthStatus;
  sourceSupport?: SourceSupport;
  sourceStatus?: string | null;
  reviewRecommended?: boolean;
};

export type RouteBoundCompanionContext = {
  kind: RouteBoundCompanionContextKind;
  title?: string | null;
  analysisMode?: "analyze" | "media" | "guided" | null;
  routePath?: string | null;
  parentStatus?: RouteBoundCompanionParentStatus | null;
};

export type RouteBoundCompanionResolved = {
  contextKind: RouteBoundCompanionContextKind;
  journeyProfile: E150JourneyKey;
  lane: E150Lane;
  verificationMode: VerificationMode;
  researchUsed: ResearchUsed;
  sealEligible: boolean;
  sealGranted: boolean;
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
  workflowLabel: string | null;
  parentStatus: {
    lane: E150Lane;
    verificationMode: VerificationMode;
    researchUsed: ResearchUsed;
    sealEligible: boolean;
    sealGranted: boolean;
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
    workflowLabel: string | null;
  };
};

export type RouteBoundCompanionAnswer = {
  text: string;
  followUps: string[];
  disclaimers: string[];
};

function trimToSingleLine(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function compactMessage(input: string, maxLen = 220): string {
  const text = trimToSingleLine(input);
  if (!text) return "Kein Kontext übergeben.";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}

function routingInputForContext(
  context: RouteBoundCompanionContext,
): E150RoleRoutingInput {
  switch (context.kind) {
    case "factcheck":
      return {
        journeyHint: "sealed_factcheck",
        sealedFactcheck: true,
        pipeline: "factcheck",
        routePath: context.routePath ?? "/api/factcheck/enqueue",
      };
    case "guided_workspace":
      return {
        analysisMode: "guided",
        routePath: context.routePath ?? "/api/contributions/analyze",
      };
    case "journalist_companion":
      return {
        analysisMode: "media",
        routePath: context.routePath ?? "/companion",
      };
    case "dossier":
    default:
      return {
        analysisMode: context.analysisMode ?? "media",
        routePath: context.routePath ?? "/dossier",
      };
  }
}

export function resolveRouteBoundCompanionContext(
  context: RouteBoundCompanionContext,
): RouteBoundCompanionResolved {
  const journeyProfile = resolveJourneyProfile(routingInputForContext(context));
  const defaults = journeyProfile.verificationDefaults;
  const parent = context.parentStatus ?? null;

  const normalizedVerificationMode: VerificationMode =
    journeyProfile.lane === "standard"
      ? parent?.verificationMode === "precheck" || parent?.verificationMode === "none"
        ? parent.verificationMode
        : defaults.verificationMode === "precheck"
          ? "precheck"
          : "none"
      : parent?.verificationMode ?? defaults.verificationMode;
  const normalizedResearchUsed: ResearchUsed =
    journeyProfile.lane === "standard"
      ? "none"
      : parent?.researchUsed ?? defaults.researchUsed;
  const normalizedSealEligible =
    journeyProfile.lane === "standard"
      ? false
      : parent?.sealEligible ?? defaults.sealEligible;
  const normalizedSealGranted =
    journeyProfile.lane === "standard"
      ? false
      : parent?.sealGranted ?? defaults.sealGranted;

  const presentation = resolveVerificationPresentationView({
    lane: journeyProfile.lane,
    status: parent?.status ?? null,
    verificationMode: normalizedVerificationMode,
    researchUsed: normalizedResearchUsed,
    sealEligible: normalizedSealEligible,
    sealGranted: normalizedSealGranted,
    verificationLabel: parent?.verificationLabel,
    truthStatus: parent?.truthStatus,
    sourceSupport: parent?.sourceSupport,
    sourceStatus: parent?.sourceStatus,
    reviewRecommended: parent?.reviewRecommended,
  });

  return {
    contextKind: context.kind,
    journeyProfile: journeyProfile.journey,
    lane: presentation.lane,
    verificationMode: presentation.verificationMode,
    researchUsed: presentation.researchUsed,
    sealEligible: presentation.sealEligible,
    sealGranted: presentation.sealGranted,
    verificationLabel: presentation.verificationLabel,
    verificationLabelDisplay: presentation.verificationLabelDisplay,
    verificationHint: presentation.verificationHint,
    truthStatus: presentation.truthStatus,
    truthStatusLabel: presentation.truthStatusLabel,
    sourceSupport: presentation.sourceSupport,
    sourceSupportLabel: presentation.sourceSupportLabel,
    sourceStatus: presentation.sourceStatus,
    reviewRecommended: presentation.reviewRecommended,
    noTruthPromotion: presentation.noTruthPromotion,
    noAutoGraphPromotion: presentation.noAutoGraphPromotion,
    workflowLabel: presentation.workflowLabel,
    parentStatus: {
      lane: presentation.lane,
      verificationMode: presentation.verificationMode,
      researchUsed: presentation.researchUsed,
      sealEligible: presentation.sealEligible,
      sealGranted: presentation.sealGranted,
      verificationLabel: presentation.verificationLabel,
      verificationLabelDisplay: presentation.verificationLabelDisplay,
      verificationHint: presentation.verificationHint,
      truthStatus: presentation.truthStatus,
      truthStatusLabel: presentation.truthStatusLabel,
      sourceSupport: presentation.sourceSupport,
      sourceSupportLabel: presentation.sourceSupportLabel,
      sourceStatus: presentation.sourceStatus,
      reviewRecommended: presentation.reviewRecommended,
      noTruthPromotion: presentation.noTruthPromotion,
      noAutoGraphPromotion: presentation.noAutoGraphPromotion,
      workflowLabel: presentation.workflowLabel,
    },
  };
}

function followUpsForContext(
  kind: RouteBoundCompanionContextKind,
  verificationLabel: UserFacingVerificationLabel,
): string[] {
  if (kind === "factcheck") {
    return verificationLabel === "verifiziert"
      ? [
          "Welche Aussage soll als Nächstes vertieft dokumentiert werden?",
          "Sollen Gegenquellen und Einwände separat zusammengefasst werden?",
        ]
      : [
          "Welche konkrete Aussage soll zuerst geprüft werden?",
          "Welche Quelle fehlt noch für einen belastbaren Abschluss?",
        ];
  }
  if (kind === "guided_workspace") {
    return [
      "Welcher nächste administrative Schritt ist jetzt entscheidungsreif?",
      "Welche offene Frage blockiert die Umsetzung am stärksten?",
    ];
  }
  if (kind === "journalist_companion") {
    return [
      "Welche Gegenposition sollte im nächsten Entwurf stärker sichtbar sein?",
      "Welche Quelle ist für die Einordnung noch unklar?",
    ];
  }
  return [
    "Welche Konfliktlinie soll im Dossier als Nächstes geschärft werden?",
    "Welche offene Frage braucht zuerst belastbare Quellen?",
  ];
}

export function buildRouteBoundCompanionAnswer(params: {
  context: RouteBoundCompanionContext;
  userMessage: string;
  resolved: RouteBoundCompanionResolved;
}): RouteBoundCompanionAnswer {
  const { context, resolved } = params;
  const message = compactMessage(params.userMessage);
  const title = context.title ? trimToSingleLine(context.title) : null;
  const lead =
    context.kind === "factcheck"
      ? "Factcheck-Companion"
      : context.kind === "guided_workspace"
        ? "Guided-Workspace-Companion"
        : context.kind === "journalist_companion"
          ? "Journalistischer Companion"
          : "Dossier-Companion";

  const statusLine = resolved.workflowLabel
    ? `Status: ${resolved.workflowLabel} · ${resolved.verificationLabelDisplay}.`
    : `Status: ${resolved.verificationLabelDisplay}.`;
  const researchLine =
    resolved.lane === "sealed_factcheck"
      ? `Recherchemodus: ${resolved.researchUsed}.`
      : "Recherchemodus: none (Standard-Lane, keine stille Recherche).";
  const titleLine = title ? `Kontext: ${title}.` : "";

  const text = [
    `${lead}: ${statusLine}`,
    titleLine,
    `Ihre Nachfrage: ${message}`,
    researchLine,
    "Hinweis: Diese Antwort ist ein Kontextdialog und kein Wahrheits- oder Siegelsystem.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    text,
    followUps: followUpsForContext(context.kind, resolved.verificationLabel),
    disclaimers: [
      "Kein impliziter Faktencheck.",
      "Kein Siegel außerhalb sealed_factcheck.",
      "Keine stille Recherche in Standard-Lanes.",
    ],
  };
}

function applyPresentationToneToCompanionAnswer(
  answer: RouteBoundCompanionAnswer,
): { payload: RouteBoundCompanionAnswer; changed: boolean; changedFields: string[] } {
  let changed = false;
  const changedFields: string[] = [];

  const text = normalizePresentationText(answer.text);
  if (text !== answer.text) {
    changed = true;
    changedFields.push("text");
  }

  const followUps = normalizePresentationTextList(answer.followUps);
  if (JSON.stringify(followUps) !== JSON.stringify(answer.followUps)) {
    changed = true;
    changedFields.push("followUps");
  }

  const disclaimers = normalizePresentationTextList(answer.disclaimers);
  if (JSON.stringify(disclaimers) !== JSON.stringify(answer.disclaimers)) {
    changed = true;
    changedFields.push("disclaimers");
  }

  return {
    payload: {
      text,
      followUps,
      disclaimers,
    },
    changed,
    changedFields,
  };
}

export function runRouteBoundCompanionPresentationPass(params: {
  resolved: RouteBoundCompanionResolved;
  answer: RouteBoundCompanionAnswer;
  enabled?: boolean;
}): {
  answer: RouteBoundCompanionAnswer;
  meta: PresentationPassExecutionMeta;
} {
  const result = runNonMutativePresentationPass({
    provider: "openai",
    enabled: params.enabled,
    payload: params.answer,
    snapshot: () => ({
      claims: null,
      evidence: null,
      trust: null,
      verificationMode: params.resolved.verificationMode,
      researchUsed: params.resolved.researchUsed,
      sealEligible: params.resolved.sealEligible,
      sealGranted: params.resolved.sealGranted,
      laneMeta: {
        lane: params.resolved.lane,
        journeyProfile: params.resolved.journeyProfile,
        verificationLabel: params.resolved.verificationLabel,
      },
      providerMeta: {
        provider: "openai",
        role: "presentation_pass",
      },
    }),
    apply: applyPresentationToneToCompanionAnswer,
  });

  return {
    answer: result.payload,
    meta: result.meta,
  };
}
