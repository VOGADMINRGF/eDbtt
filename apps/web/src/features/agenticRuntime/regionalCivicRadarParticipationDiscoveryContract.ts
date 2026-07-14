import type {
  RegionIntelligencePreparationResult,
  RegionIntelligenceSignalSeed,
} from "@features/region";
import type { PersonalVoxyMode } from "@/features/agenticRuntime/agentRegistryBootstrapContract";
import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export type RegionalDiscoveryDeadline = {
  label: string | null;
  state: "present" | "missing_runtime_truth";
};

export type RegionalCivicDiscoveryItem = {
  id: string;
  title: string;
  organizerLabel: string;
  jurisdictionLabel: string;
  retrievedAt: string | null;
  deadline: RegionalDiscoveryDeadline;
  sourceLabel: string;
  relevanceReasons: string[];
  reviewStatus: RegionIntelligenceSignalSeed["reviewStatus"];
  proactiveEligible: boolean;
  noAutoNotification: true;
};

export type RegionalCivicRadarParticipationDiscoveryContract = {
  mode: PersonalVoxyMode;
  sourceStatusLabel: string;
  items: RegionalCivicDiscoveryItem[];
  reviewRequired: true;
  noAutoPublish: true;
  noParallelDataBasis: true;
  safeTrace: AgentSafeTraceStep[];
};

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildRelevanceReasons(seed: RegionIntelligenceSignalSeed, jurisdictionLabel: string) {
  return unique([
    seed.detectedTopics[0] ? `Thema: ${seed.detectedTopics[0]}` : "",
    jurisdictionLabel ? `Jurisdiktion: ${jurisdictionLabel}` : "",
    seed.relatedAnlassraumIds.length > 0 ? "Bestehender Anlassraum-Bezug vorhanden" : "",
    seed.suggestedAction === "create_dossier"
      ? "Reviewpflichtiger Dossier-Vorschlag vorhanden"
      : "Reviewpflichtiger Beteiligungs- oder Klaerungspfad vorhanden",
  ]);
}

function toDiscoveryItem(
  seed: RegionIntelligenceSignalSeed,
  mode: PersonalVoxyMode,
  jurisdictionLabel: string,
): RegionalCivicDiscoveryItem {
  return {
    id: seed.id,
    title: seed.title,
    organizerLabel: seed.sourceLabel,
    jurisdictionLabel,
    retrievedAt: seed.publishedAt,
    deadline: {
      label: null,
      state: "missing_runtime_truth",
    },
    sourceLabel: seed.sourceLabel,
    relevanceReasons: buildRelevanceReasons(seed, jurisdictionLabel),
    reviewStatus: seed.reviewStatus,
    proactiveEligible: mode !== "passive",
    noAutoNotification: true,
  };
}

export function buildRegionalCivicRadarParticipationDiscoveryContract(input: {
  mode: PersonalVoxyMode;
  jurisdictionLabel: string;
  preparation: RegionIntelligencePreparationResult;
}): RegionalCivicRadarParticipationDiscoveryContract {
  const items = input.preparation.signalSeeds.map((seed) =>
    toDiscoveryItem(seed, input.mode, input.jurisdictionLabel),
  );

  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01",
      stepId: "regional_signal_review",
      surface: "/account",
      userSafeLabel:
        "Regionale Themen und Beteiligungshinweise bleiben review-first mit Quelle, Jurisdiktion und Relevanzgruenden sichtbar.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "triage_regional_relevance",
      inputArtifacts: input.preparation.signalSeeds.map((seed) => ({
        id: `${seed.id}:regional-input`,
        type: "regional_signal",
        label: seed.title,
        reviewState: "present",
      })),
      outputArtifacts: [
        {
          id: "regional-civic-radar-items",
          type: "regional_signal",
          label: `${items.length} regionale Hinweise`,
          reviewState: "review_required",
        },
      ],
      evidenceRefs: unique(
        input.preparation.signalSeeds.flatMap((seed) => [seed.id, seed.sourceId, seed.sourceLabel]),
      ),
    }),
  ];

  return {
    mode: input.mode,
    sourceStatusLabel: input.preparation.sourceStatusSummary.overallLabel,
    items,
    reviewRequired: true,
    noAutoPublish: true,
    noParallelDataBasis: true,
    safeTrace,
  };
}
