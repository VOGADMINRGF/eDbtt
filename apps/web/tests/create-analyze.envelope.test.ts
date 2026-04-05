import { describe, expect, it } from "vitest";
import { parseCreateAnalyzeEnvelope } from "@/features/create/analyzeEnvelope";

function buildCreateAnalyze() {
  return {
    schemaVersion: "create_analyze.v1",
    orchestrator: "create_orchestration",
    runId: "run-123",
    inputRef: "run-123",
    sourceLanguage: "de",
    contentLanguage: "de",
    uiLocale: "de",
    inputType: "free_text",
    languages: ["de"],
    normalizedInputSummary: "Kurz",
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
    matchingLanguageMode: "same_language_only",
    phases: {
      intake: { status: "done", summary: "ok" },
      quality: { status: "review_required", summary: "ok" },
      graph_matching: { status: "done", summary: "ok" },
      cta_suggestions: { status: "done", summary: "ok" },
    },
    confidence: 0.5,
    uncertaintyFlags: [],
    requiresHumanReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
    provenanceRefs: ["run-123"],
    createdAt: "2026-03-27T00:00:00.000Z",
  };
}

describe("create analyze envelope parser", () => {
  it("keeps provider matrix only when meta.runId matches createAnalyze.runId", () => {
    const parsed = parseCreateAnalyzeEnvelope({
      ok: true,
      createAnalyze: buildCreateAnalyze(),
      meta: {
        runId: "run-123",
        providerMatrix: [{ provider: "openai", state: "ok", durationMs: 120 }],
      },
    });

    expect(parsed.createAnalyze?.runId).toBe("run-123");
    expect(parsed.providerMatrix).toHaveLength(1);
    expect(parsed.providerMatrix[0]?.provider).toBe("openai");
  });

  it("drops provider matrix for runId mismatches to avoid cross-run meta drift", () => {
    const parsed = parseCreateAnalyzeEnvelope({
      ok: true,
      createAnalyze: buildCreateAnalyze(),
      meta: {
        runId: "run-other",
        providerMatrix: [{ provider: "openai", state: "ok" }],
      },
    });
    expect(parsed.providerMatrix).toEqual([]);
  });

  it("keeps degraded/fallback flags deterministic across envelope fields", () => {
    const parsed = parseCreateAnalyzeEnvelope({
      ok: true,
      fallback: true,
      createAnalyze: {
        ...buildCreateAnalyze(),
        matchSourceState: "degraded",
        phases: {
          intake: { status: "done", summary: "ok" },
          quality: { status: "review_required", summary: "ok" },
          graph_matching: { status: "review_required", summary: "ok" },
          cta_suggestions: { status: "done", summary: "ok" },
        },
      },
    });
    expect(parsed.degraded).toBe(true);
    expect(parsed.fallback).toBe(true);
  });
});
