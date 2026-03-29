import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  handleAnalyze: vi.fn(),
}));

vi.mock("@/app/api/contributions/analyze/route", () => ({
  POST: (...args: unknown[]) => mocks.handleAnalyze(...args),
}));

import { POST as createAnalyzePOST } from "@/app/api/create/analyze/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/create/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/create/analyze route", () => {
  it("delegates to /api/contributions/analyze and forwards the contract payload unchanged", async () => {
    const upstreamResponse = Response.json({
      ok: true,
      result: { claims: [] },
      createAnalyze: {
        schemaVersion: "create_analyze.v1",
        orchestrator: "create_orchestration",
        runId: "run-1",
        inputRef: "run-1",
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        inputType: "free_text",
        languages: ["de"],
        normalizedInputSummary: "Test",
        claims: [],
        nonCheckableOpinions: [],
        evidenceNeeds: [],
        uncertainties: [],
        matches: [],
        matchStrength: "none",
        reasons: ["Kein belastbarer Match in produktiven Quellen gefunden."],
        suggestedCtas: [{ id: "neu_anlegen", label: "Neu anlegen", reason: "Kein Match" }],
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
        provenanceRefs: ["run-1"],
        createdAt: "2026-03-20T00:00:00.000Z",
      },
    });
    mocks.handleAnalyze.mockResolvedValue(upstreamResponse);

    const request = req({ text: "Beispieltext fuer den Freistart-Flow." });
    const response = await createAnalyzePOST(request);

    expect(mocks.handleAnalyze).toHaveBeenCalledTimes(1);
    expect(mocks.handleAnalyze).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.createAnalyze).toBeTruthy();
    expect(body.createAnalyze.noAutoPublish).toBe(true);
    expect(body.createAnalyze.noSilentMerge).toBe(true);
  });

  it("keeps degraded/fallback createAnalyze envelopes unchanged for wrapper parity", async () => {
    const upstreamResponse = Response.json({
      ok: true,
      degraded: true,
      fallback: true,
      errorCode: "ANALYZE_PROVIDER_FAILED",
      message: "fallback active",
      createAnalyze: {
        schemaVersion: "create_analyze.v1",
        orchestrator: "create_orchestration",
        runId: "run-2",
        inputRef: "run-2",
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        inputType: "source_url",
        languages: ["de", "en"],
        normalizedInputSummary: "https://example.org/report",
        claims: [],
        nonCheckableOpinions: [],
        evidenceNeeds: [],
        uncertainties: ["input_too_thin"],
        matches: [],
        matchStrength: "none",
        reasons: ["Kein belastbarer Match in produktiven Quellen gefunden."],
        suggestedCtas: [{ id: "neu_anlegen", label: "Neu anlegen", reason: "Fallback" }],
        matchSourceState: "degraded",
        matchSourceErrors: ["match_service_unavailable"],
        phases: {
          intake: { status: "done", summary: "ok" },
          quality: { status: "review_required", summary: "ok" },
          graph_matching: { status: "review_required", summary: "ok" },
          cta_suggestions: { status: "done", summary: "ok" },
        },
        confidence: 0.3,
        uncertaintyFlags: ["input_too_thin"],
        requiresHumanReview: true,
        noAutoPublish: true,
        noSilentMerge: true,
        provenanceRefs: ["run-2"],
        createdAt: "2026-03-20T00:00:00.000Z",
      },
    });
    mocks.handleAnalyze.mockResolvedValue(upstreamResponse);

    const response = await createAnalyzePOST(req({ text: "https://example.org/report" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.fallback).toBe(true);
    expect(body.createAnalyze.matchSourceState).toBe("degraded");
    expect(body.createAnalyze.suggestedCtas?.[0]?.id).toBe("neu_anlegen");
  });

  it("forwards non-200 upstream contract responses unchanged", async () => {
    const upstreamResponse = Response.json(
      {
        ok: false,
        errorCode: "BAD_INPUT",
        message: "text_missing",
      },
      { status: 400 },
    );
    mocks.handleAnalyze.mockResolvedValue(upstreamResponse);

    const response = await createAnalyzePOST(req({ text: "" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.errorCode).toBe("BAD_INPUT");
  });
});
