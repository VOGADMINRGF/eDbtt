import type {
  CreateInputSafetyFinding,
  CreateInputSafetyFindingKind,
  CreateInputSafetyRouteStage,
  CreateInputSafetyDecision,
  CreateInputSafetySeverity,
} from "@/features/create/safety/createInputSafety";

export type CreateSafetyTelemetry = {
  schemaVersion: "create_safety_telemetry_v1";
  decision: CreateInputSafetyDecision;
  severity: CreateInputSafetySeverity;
  findingKinds: CreateInputSafetyFindingKind[];
  findingCounts: Partial<Record<CreateInputSafetyFindingKind, number>>;
  requiresHumanReview: boolean;
  crossLingualRisk: boolean;
  quality: {
    overall: number;
  };
  redactionApplied: boolean;
  factCheckCandidateCount: number;
  graphReviewHintCount: number;
  routeStage: CreateInputSafetyRouteStage;
  runId?: string | null;
  correlationId?: string | null;
  timestamp: string;
};

type BuildCreateSafetyTelemetryParams = {
  decision: CreateInputSafetyDecision;
  severity: CreateInputSafetySeverity;
  findings: CreateInputSafetyFinding[];
  requiresHumanReview: boolean;
  crossLingualRisk: boolean;
  qualityOverall: number;
  redactedText: string;
  factCheckCandidateCount: number;
  graphReviewHintCount: number;
  routeStage: CreateInputSafetyRouteStage;
  runId?: string | null;
  correlationId?: string | null;
  timestamp: string;
};

function roundQuality(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function hasRedaction(text: string): boolean {
  return /\[(?:E-MAIL|TELEFON|ADRESSE|PLZ) ENTFERNT\]/.test(text);
}

export function buildCreateSafetyTelemetry(
  params: BuildCreateSafetyTelemetryParams,
): CreateSafetyTelemetry {
  const findingCounts: Partial<Record<CreateInputSafetyFindingKind, number>> = {};

  for (const finding of params.findings) {
    findingCounts[finding.kind] = (findingCounts[finding.kind] ?? 0) + 1;
  }

  return {
    schemaVersion: "create_safety_telemetry_v1",
    decision: params.decision,
    severity: params.severity,
    findingKinds: Array.from(new Set(params.findings.map((finding) => finding.kind))),
    findingCounts,
    requiresHumanReview: params.requiresHumanReview,
    crossLingualRisk: params.crossLingualRisk,
    quality: {
      overall: roundQuality(params.qualityOverall),
    },
    redactionApplied: hasRedaction(params.redactedText),
    factCheckCandidateCount: params.factCheckCandidateCount,
    graphReviewHintCount: params.graphReviewHintCount,
    routeStage: params.routeStage,
    runId: params.runId ?? null,
    correlationId: params.correlationId ?? null,
    timestamp: params.timestamp,
  };
}
