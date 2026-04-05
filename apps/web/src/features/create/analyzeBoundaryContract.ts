import type { CreateAnalyzeResponse } from "@/features/create/analyzeContract";

export const CREATE_ANALYZE_SCHEMA_VERSION = "create_analyze.v1" as const;
export const CREATE_ANALYZE_ORCHESTRATOR = "create_orchestration" as const;

export const CREATE_ANALYZE_STAGE_KEYS = [
  "intake",
  "quality",
  "graph_matching",
  "cta_suggestions",
] as const;

type CreateAnalyzeStageKey = (typeof CREATE_ANALYZE_STAGE_KEYS)[number];

const STAGE_STATUS_ALLOWLIST: Record<CreateAnalyzeStageKey, Set<string>> = {
  intake: new Set(["done"]),
  quality: new Set(["done", "review_required"]),
  graph_matching: new Set(["done", "review_required"]),
  cta_suggestions: new Set(["done"]),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasValidStageContract(phases: unknown): phases is CreateAnalyzeResponse["phases"] {
  if (!isRecord(phases)) return false;

  for (const stageKey of CREATE_ANALYZE_STAGE_KEYS) {
    const stage = phases[stageKey];
    if (!isRecord(stage)) return false;
    if (typeof stage.summary !== "string") return false;
    if (typeof stage.status !== "string") return false;
    if (!STAGE_STATUS_ALLOWLIST[stageKey].has(stage.status)) return false;
  }
  return true;
}

export function parseCreateAnalyzeBoundarySnapshot(
  value: unknown,
): CreateAnalyzeResponse | null {
  if (!isRecord(value)) return null;
  const candidate = value as Partial<CreateAnalyzeResponse>;

  if (candidate.schemaVersion !== CREATE_ANALYZE_SCHEMA_VERSION) return null;
  if (candidate.orchestrator !== CREATE_ANALYZE_ORCHESTRATOR) return null;
  if (typeof candidate.runId !== "string" || !candidate.runId.trim()) return null;
  if (candidate.inputRef !== candidate.runId) return null;
  if (typeof candidate.createdAt !== "string" || !candidate.createdAt.trim()) return null;
  if (!isNonEmptyString(candidate.uiLocale)) return null;
  if (!isNonEmptyString(candidate.contentLanguage)) return null;
  if (!isNonEmptyString(candidate.sourceLanguage)) return null;
  if (
    candidate.matchingLanguageMode !== "same_language_only"
  ) {
    return null;
  }

  if (typeof candidate.confidence !== "number" || Number.isNaN(candidate.confidence)) return null;
  if (candidate.confidence < 0 || candidate.confidence > 1) return null;

  if (!isStringArray(candidate.languages)) return null;
  if (!Array.isArray(candidate.claims)) return null;
  if (!Array.isArray(candidate.evidenceNeeds)) return null;
  if (!Array.isArray(candidate.uncertainties)) return null;
  if (!Array.isArray(candidate.matches)) return null;
  if (!isStringArray(candidate.reasons)) return null;
  if (!Array.isArray(candidate.suggestedCtas)) return null;
  if (!isStringArray(candidate.matchSourceErrors)) return null;
  if (!isStringArray(candidate.provenanceRefs)) return null;
  if (!candidate.provenanceRefs.includes(candidate.runId)) return null;

  if (candidate.matchSourceState !== "ok" && candidate.matchSourceState !== "degraded") {
    return null;
  }
  if (!hasValidStageContract(candidate.phases)) return null;
  if (candidate.matchSourceState === "degraded" && candidate.phases.graph_matching.status !== "review_required") {
    return null;
  }

  if (candidate.noAutoPublish !== true) return null;
  if (candidate.noSilentMerge !== true) return null;

  return candidate as CreateAnalyzeResponse;
}
