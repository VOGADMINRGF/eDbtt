import { describe, expect, it } from "vitest";
import {
  CREATE_ANALYZE_ORCHESTRATOR,
  CREATE_ANALYZE_SCHEMA_VERSION,
  parseCreateAnalyzeBoundarySnapshot,
} from "@/features/create/analyzeBoundaryContract";

function buildValidSnapshot() {
  return {
    schemaVersion: CREATE_ANALYZE_SCHEMA_VERSION,
    orchestrator: CREATE_ANALYZE_ORCHESTRATOR,
    runId: "run-123",
    inputRef: "run-123",
    sourceLanguage: "de",
    contentLanguage: "de",
    uiLocale: "de",
    inputType: "free_text",
    languages: ["de"],
    normalizedInputSummary: "Kurzer Beispieltext",
    claims: [],
    nonCheckableOpinions: [],
    evidenceNeeds: [],
    uncertainties: [],
    matches: [],
    matchStrength: "none",
    reasons: ["Kein Match"],
    suggestedCtas: [{ id: "neu_anlegen", label: "Neu anlegen", reason: "Fallback" }],
    matchSourceState: "ok",
    matchSourceErrors: [],
    phases: {
      intake: { status: "done", summary: "ok" },
      quality: { status: "review_required", summary: "ok" },
      graph_matching: { status: "done", summary: "ok" },
      cta_suggestions: { status: "done", summary: "ok" },
    },
    confidence: 0.42,
    uncertaintyFlags: ["input_too_thin"],
    requiresHumanReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
    provenanceRefs: ["run-123"],
    createdAt: "2026-03-27T00:00:00.000Z",
  } as const;
}

describe("create analyze boundary contract parser", () => {
  it("accepts strict-staged snapshots with complete stage/meta contract", () => {
    const parsed = parseCreateAnalyzeBoundarySnapshot(buildValidSnapshot());
    expect(parsed?.runId).toBe("run-123");
    expect(parsed?.phases.graph_matching.status).toBe("done");
  });

  it("rejects snapshots with missing stage entries", () => {
    const snapshot = {
      ...buildValidSnapshot(),
      phases: {
        intake: { status: "done", summary: "ok" },
        quality: { status: "review_required", summary: "ok" },
        graph_matching: { status: "done", summary: "ok" },
      },
    } as any;
    expect(parseCreateAnalyzeBoundarySnapshot(snapshot)).toBeNull();
  });

  it("rejects degraded snapshots when graph_matching is not review_required", () => {
    const snapshot = {
      ...buildValidSnapshot(),
      matchSourceState: "degraded",
      phases: {
        intake: { status: "done", summary: "ok" },
        quality: { status: "review_required", summary: "ok" },
        graph_matching: { status: "done", summary: "ok" },
        cta_suggestions: { status: "done", summary: "ok" },
      },
    } as const;
    expect(parseCreateAnalyzeBoundarySnapshot(snapshot)).toBeNull();
  });

  it("rejects snapshots when provenanceRefs does not include runId", () => {
    const snapshot = {
      ...buildValidSnapshot(),
      provenanceRefs: ["run-other"],
    } as const;
    expect(parseCreateAnalyzeBoundarySnapshot(snapshot)).toBeNull();
  });
});
