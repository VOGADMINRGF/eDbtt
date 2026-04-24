import { describe, expect, it } from "vitest";

import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";

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
});
