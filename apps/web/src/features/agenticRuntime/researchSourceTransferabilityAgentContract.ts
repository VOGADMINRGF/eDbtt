import {
  buildCanonicalSourcePack,
  getCanonicalSourcePackOverallEvidenceState,
  type BuildCanonicalSourcePackInput,
  type CanonicalSourcePack,
} from "@/features/create/canonicalSourcePackContract";
import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export const RESEARCH_TRANSFERABILITY_DECISIONS = [
  "local_reference",
  "translation_reading_only",
  "international_review_required",
] as const;

export type ResearchTransferabilityDecision =
  (typeof RESEARCH_TRANSFERABILITY_DECISIONS)[number];

export type ResearchTransferabilitySourceInput =
  NonNullable<BuildCanonicalSourcePackInput["sources"]>[number] & {
    issuerLabel?: string | null;
    jurisdictionLabel?: string | null;
  };

export type ResearchTransferabilityEntry = {
  sourceId: string;
  title: string;
  issuerLabel: string | null;
  jurisdictionLabel: string | null;
  sourceLocale: string | null;
  regionCode: string | null;
  retrievedAt: string | null;
  decision: ResearchTransferabilityDecision;
  reason: string;
  evidenceState: ReturnType<typeof getCanonicalSourcePackOverallEvidenceState>;
};

export type ResearchSourceTransferabilityContract = {
  sourcePack: CanonicalSourcePack;
  overallEvidenceState: ReturnType<typeof getCanonicalSourcePackOverallEvidenceState>;
  translationIsEvidence: false;
  entries: ResearchTransferabilityEntry[];
  reviewRequired: true;
  noAutoPublish: true;
  safeTrace: AgentSafeTraceStep[];
};

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function countryPrefix(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return null;
  return normalized.split("-")[0] ?? null;
}

function buildDecision(input: {
  source: ResearchTransferabilitySourceInput;
  localRegionCode: string | null;
}): Pick<ResearchTransferabilityEntry, "decision" | "reason"> {
  const sourceRegion = countryPrefix(input.source.regionCode);
  const localRegion = countryPrefix(input.localRegionCode);
  const hasTranslation =
    input.source.translationStatus === "translated" ||
    input.source.translationStatus === "needs_review" ||
    input.source.translationStatus === "uncertain";

  if (sourceRegion && localRegion && sourceRegion !== localRegion) {
    return {
      decision: "international_review_required",
      reason:
        "Internationale Referenz bleibt getrennt von lokaler Wahrheitsbehauptung, bis eine Uebertragbarkeitspruefung vorliegt.",
    };
  }

  if (hasTranslation) {
    return {
      decision: "translation_reading_only",
      reason: "Uebersetzung bleibt Lesehilfe und keine eigenstaendige Evidenz.",
    };
  }

  return {
    decision: "local_reference",
    reason: "Quelle bleibt als lokale oder gleichgerichtete Referenz review-first nutzbar.",
  };
}

export function buildResearchSourceTransferabilityContract(input: {
  sourcePackId: string;
  localRegionCode?: string | null;
  sources: ResearchTransferabilitySourceInput[];
}): ResearchSourceTransferabilityContract {
  const sourcePack = buildCanonicalSourcePack({
    sourcePackId: input.sourcePackId,
    sources: input.sources,
  });
  const overallEvidenceState = getCanonicalSourcePackOverallEvidenceState(sourcePack);
  const entries: ResearchTransferabilityEntry[] = sourcePack.sources.map((source, index) => {
    const rawSource = input.sources[index] ?? {};
    const decision = buildDecision({
      source: rawSource,
      localRegionCode: input.localRegionCode ?? null,
    });

    return {
      sourceId: source.sourceId,
      title: source.title,
      issuerLabel: rawSource.issuerLabel?.trim() ?? null,
      jurisdictionLabel: rawSource.jurisdictionLabel?.trim() ?? null,
      sourceLocale: source.sourceLocale ?? null,
      regionCode: source.regionCode ?? null,
      retrievedAt: rawSource.retrievedAt?.trim() ?? null,
      decision: decision.decision,
      reason: decision.reason,
      evidenceState: overallEvidenceState,
    };
  });

  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01",
      stepId: "research_source_pack_review",
      surface: "/create",
      userSafeLabel:
        "Quellen bleiben mit Originalsprache, Herkunft und Review-Pflicht sichtbar; Uebersetzung wird nicht als Evidenz ausgegeben.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "verify_source_provenance",
      inputArtifacts: input.sources.map((source, index) => ({
        id: `source-input-${index + 1}`,
        type: "source_reference",
        label: source.title?.trim() || source.url?.trim() || `Quelle ${index + 1}`,
        reviewState: "present",
      })),
      outputArtifacts: [
        {
          id: `${input.sourcePackId}:source-pack`,
          type: "source_pack",
          label: input.sourcePackId,
          reviewState: "review_required",
        },
      ],
      evidenceRefs: unique(
        input.sources.flatMap((source) => [
          source.sourceId ?? "",
          source.url ?? "",
          source.retrievedAt ?? "",
        ]),
      ),
    }),
    buildAgentSafeTraceStep({
      taskId: "V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01",
      stepId: "research_transferability_gate",
      surface: "/dossier/[id]",
      userSafeLabel:
        "Internationale Beispiele bleiben getrennte Transferkandidaten, bis Voraussetzungen und lokale Uebertragbarkeit geprueft sind.",
      status: entries.some((entry) => entry.decision !== "local_reference")
        ? "review_required"
        : "completed",
      confidenceLabel: entries.some((entry) => entry.decision === "international_review_required")
        ? AGENT_SAFE_TRACE_CONFIDENCE_LABELS[0]
        : AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "assess_transferability",
      inputArtifacts: [
        {
          id: `${input.sourcePackId}:source-pack-input`,
          type: "source_pack",
          label: input.sourcePackId,
          reviewState: "review_required",
        },
      ],
      outputArtifacts: [
        {
          id: `${input.sourcePackId}:transferability`,
          type: "transferability_candidate",
          label: "Transferability review",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: unique(entries.map((entry) => entry.sourceId)),
    }),
  ];

  return {
    sourcePack,
    overallEvidenceState,
    translationIsEvidence: false,
    entries,
    reviewRequired: true,
    noAutoPublish: true,
    safeTrace,
  };
}
