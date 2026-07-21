import { describe, expect, it } from "vitest";

import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import { LEGACY_DIRECT_PROVIDER_ROUTES } from "@/features/ai/orchestrationRouteContract";

describe("e150 route classification", () => {
  it("marks canonical analyze route as canonical", () => {
    const classification = resolveAiRouteClassification("/api/contributions/analyze");
    expect(classification.canonical).toBe(true);
    expect(classification.notCanonical).toBe(false);
    expect(classification.routeProfile).toBe("e150_canonical");
    expect(classification.directProviderPath).toBe(false);
  });

  it("marks factcheck seal route as sealed canonical path", () => {
    const classification = resolveAiRouteClassification("/api/factcheck/status/job_1/seal");
    expect(classification.canonical).toBe(true);
    expect(classification.routeProfile).toBe("sealed_factcheck");
  });

  it("marks direct provider legacy paths as not canonical", () => {
    const trace = resolveAiRouteClassification("/api/contributions/trace");
    expect(trace.canonical).toBe(false);
    expect(trace.legacyExceptionPath).toBe(true);
    expect(trace.directProviderPath).toBe(true);
    expect(trace.routeProfile).toBe("legacy_exception");

    const diag = resolveAiRouteClassification("/api/diag/gpt");
    expect(diag.canonical).toBe(false);
    expect(diag.routeProfile).toBe("diagnostic");
    expect(diag.directProviderPath).toBe(true);
  });

  it("keeps legacy direct-provider route catalog aligned with e150 route classification", () => {
    for (const route of LEGACY_DIRECT_PROVIDER_ROUTES) {
      const classification = resolveAiRouteClassification(route);
      expect(classification.routePath).toBe(route);
      expect(classification.canonical).toBe(false);
      expect(classification.notCanonical).toBe(true);
      expect(classification.legacyExceptionPath).toBe(true);
      expect(classification.directProviderPath).toBe(true);
      expect(classification.routeProfile).not.toBe("unknown");
    }
  });
});
