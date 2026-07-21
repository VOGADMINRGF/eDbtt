export type AiRouteProfile =
  | "e150_canonical"
  | "sealed_factcheck"
  | "legacy_exception"
  | "diagnostic"
  | "unknown";

export type AiRouteClassification = {
  routePath: string;
  routeProfile: AiRouteProfile;
  canonical: boolean;
  notCanonical: boolean;
  legacyExceptionPath: boolean;
  directProviderPath: boolean;
  note: string;
};

function canonical(routePath: string, routeProfile: AiRouteProfile, note: string): AiRouteClassification {
  return {
    routePath,
    routeProfile,
    canonical: true,
    notCanonical: false,
    legacyExceptionPath: false,
    directProviderPath: false,
    note,
  };
}

function exception(
  routePath: string,
  routeProfile: AiRouteProfile,
  note: string,
  directProviderPath = true,
): AiRouteClassification {
  return {
    routePath,
    routeProfile,
    canonical: false,
    notCanonical: true,
    legacyExceptionPath: true,
    directProviderPath,
    note,
  };
}

export function resolveAiRouteClassification(routePath: string): AiRouteClassification {
  const normalized = String(routePath || "").trim().toLowerCase();
  if (normalized === "/api/contributions/analyze") {
    return canonical(normalized, "e150_canonical", "journey_specialist_routing");
  }
  if (normalized === "/api/factcheck/enqueue") {
    return canonical(normalized, "sealed_factcheck", "sealed_factcheck_lane");
  }
  if (normalized === "/api/factcheck/status" || normalized.startsWith("/api/factcheck/status/")) {
    return canonical(normalized, "sealed_factcheck", "sealed_factcheck_status");
  }
  if (normalized.startsWith("/api/factcheck/result/")) {
    return canonical(normalized, "sealed_factcheck", "sealed_factcheck_result");
  }
  if (normalized === "/api/contributions/trace") {
    return exception(normalized, "legacy_exception", "direct_provider_trace_path");
  }
  if (normalized === "/api/contributions/refine") {
    return exception(normalized, "legacy_exception", "direct_provider_refine_path");
  }
  if (normalized === "/api/contributions/analyze/save") {
    return exception(normalized, "legacy_exception", "direct_provider_analyze_save_path");
  }
  if (normalized === "/api/quality/polish") {
    return exception(normalized, "legacy_exception", "direct_provider_polish_path");
  }
  if (normalized === "/api/quality/clarify") {
    return exception(normalized, "legacy_exception", "direct_provider_clarify_path");
  }
  if (normalized === "/api/news/survey-topics") {
    return exception(normalized, "legacy_exception", "direct_provider_news_survey_path");
  }
  if (normalized === "/api/diag/gpt" || normalized === "/api/_diag/gpt") {
    return exception(normalized, "diagnostic", "diagnostic_direct_provider_path");
  }
  if (normalized === "/api/admin/ai/orchestrator-smoke") {
    return exception(normalized, "diagnostic", "diagnostic_orchestrator_smoke_path");
  }
  return {
    routePath: normalized,
    routeProfile: "unknown",
    canonical: false,
    notCanonical: true,
    legacyExceptionPath: false,
    directProviderPath: false,
    note: "unclassified",
  };
}
