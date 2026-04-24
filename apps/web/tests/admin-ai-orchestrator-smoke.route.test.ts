import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  callE150Orchestrator: vi.fn(),
  analyzeContribution: vi.fn(),
  callOpenAI: vi.fn(),
  callAnthropic: vi.fn(),
  callMistral: vi.fn(),
  callGemini: vi.fn(),
  callAriLLM: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/ai/orchestratorE150", () => ({
  callE150Orchestrator: (...args: unknown[]) => mocks.callE150Orchestrator(...args),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

vi.mock("@features/ai/providers/openai", () => ({
  callOpenAI: (...args: unknown[]) => mocks.callOpenAI(...args),
}));

vi.mock("@features/ai/providers/anthropic", () => ({
  callAnthropic: (...args: unknown[]) => mocks.callAnthropic(...args),
}));

vi.mock("@features/ai/providers/mistral", () => ({
  callMistral: (...args: unknown[]) => mocks.callMistral(...args),
}));

vi.mock("@features/ai/providers/gemini", () => ({
  callGemini: (...args: unknown[]) => mocks.callGemini(...args),
}));

vi.mock("@features/ai/providers/ari_llm", () => ({
  callAriLLM: (...args: unknown[]) => mocks.callAriLLM(...args),
}));

import { clearAdminAiRunsForTests } from "@/features/ai/adminTelemetryStore";
import { POST } from "@/app/api/admin/ai/orchestrator-smoke/route";

function req(query = "") {
  return new NextRequest(`http://localhost/api/admin/ai/orchestrator-smoke${query}`, {
    method: "POST",
  });
}

const VALID_ANALYZE_JSON = {
  mode: "E150",
  sourceText: null,
  language: "de",
  claims: [],
  notes: [],
  questions: [],
  knots: [],
  consequences: { consequences: [], responsibilities: [] },
  responsibilityPaths: [],
  decisionTrees: [],
  eventualities: [],
  impactAndResponsibility: { impacts: [], responsibleActors: [] },
  report: {
    summary: null,
    keyConflicts: [],
    facts: { local: [], international: [] },
    openQuestions: [],
    takeaways: [],
  },
};

function mockFullOrchestrator(rawText: string) {
  mocks.callE150Orchestrator.mockResolvedValue({
    best: { provider: "openai", rawText },
    candidates: [{ provider: "openai", rawText }],
    meta: {
      providerMatrix: [{ provider: "openai", state: "ok", durationMs: 111 }],
      probes: [{ provider: "openai", ok: true, errorKind: null, durationMs: 80 }],
    },
  });
}

describe("/api/admin/ai/orchestrator-smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAdminAiRunsForTests();
    mocks.requireAdminOrResponse.mockResolvedValue({ userId: "admin-1" });
  });

  it("keeps provider matrix visibility on runtime errors", async () => {
    const error = Object.assign(new Error("orchestrator failed"), {
      meta: {
        providerMatrix: [
          {
            provider: "openai",
            state: "failed",
            durationMs: 123,
            reason: "timeout",
            errorKind: "TIMEOUT",
          },
          {
            provider: "anthropic",
            state: "disabled",
            durationMs: 0,
            reason: "disabled_by_env",
          },
          {
            provider: "mistral",
            state: "skipped",
            durationMs: 0,
            reason: "quota_guard",
          },
        ],
      },
    });
    mocks.callE150Orchestrator.mockRejectedValue(error);

    const response = await POST(req());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.mode).toBe("runtime_smoke");
    expect(body.ok).toBe(false);
    expect(body.orchestratorOk).toBe(false);
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results).toHaveLength(3);
    expect(body.results.map((entry: any) => entry.providerId)).toEqual([
      "openai",
      "anthropic",
      "mistral",
    ]);
    expect(body.results.map((entry: any) => entry.state)).toEqual([
      "failed",
      "disabled",
      "skipped",
    ]);
    expect(body.rows[0]).toMatchObject({
      provider: "openai",
      mode: "runtime_smoke",
      errorKind: "TIMEOUT",
      rootCause: "TIMEOUT",
    });
    expect(body.createAnalyzeApi).toMatchObject({
      state: "skipped",
      reason: "full_mode_only",
    });
  });

  it("reports orchestrator and create-analyze statuses separately in full mode", async () => {
    mocks.callE150Orchestrator.mockResolvedValue({
      best: {
        provider: "openai",
        rawText: JSON.stringify({
          mode: "E150",
          language: "de",
          claims: [],
          notes: [],
          questions: [],
          knots: [],
          consequences: { consequences: [], responsibilities: [] },
          responsibilityPaths: [],
          decisionTrees: [],
          eventualities: [],
          impactAndResponsibility: { impacts: [], responsibleActors: [] },
          report: { summary: null, keyConflicts: [], facts: { local: [], international: [] }, openQuestions: [], takeaways: [] },
        }),
      },
      candidates: [
        {
          provider: "openai",
          rawText: JSON.stringify({
            mode: "E150",
            language: "de",
            claims: [],
            notes: [],
            questions: [],
            knots: [],
            consequences: { consequences: [], responsibilities: [] },
            responsibilityPaths: [],
            decisionTrees: [],
            eventualities: [],
            impactAndResponsibility: { impacts: [], responsibleActors: [] },
            report: { summary: null, keyConflicts: [], facts: { local: [], international: [] }, openQuestions: [], takeaways: [] },
          }),
        },
      ],
      meta: {
        providerMatrix: [
          {
            provider: "openai",
            state: "ok",
            durationMs: 210,
          },
          {
            provider: "gemini",
            state: "disabled",
            durationMs: 0,
            reason: "disabled_by_env",
          },
        ],
        probes: [],
      },
    });
    mocks.analyzeContribution.mockRejectedValue(
      Object.assign(new Error("BAD_JSON"), { code: "BAD_JSON" }),
    );

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.mode).toBe("full_contract");
    expect(body.orchestratorOk).toBe(false);
    expect(body.createAnalyzeApi).toMatchObject({
      state: "failed",
      ok: false,
      code: "BAD_JSON",
    });
    expect(body.ok).toBe(false);
    expect(body.rows.map((entry: any) => entry.provider)).toEqual(["openai", "gemini"]);
  });

  it("includes ARI in provider_probe mode with config_missing when env is not complete", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("MISTRAL_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GOOGLE_API_KEY", "");
    vi.stubEnv("ARI_BASE_URL", "");
    vi.stubEnv("ARI_API_KEY", "");
    vi.stubEnv("YOUCOM_ARI_API_URL", "");
    vi.stubEnv("YOUCOM_ARI_API_KEY", "");

    const response = await POST(req("?mode=probe"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.mode).toBe("provider_probe");
    const ari = body.rows.find((row: any) => row.provider === "ari");
    expect(ari).toBeTruthy();
    expect(ari.status).toBe("config_missing");
    expect(ari.journeyDecision).toBe("config_missing");
    expect(ari.reason).toContain("missing ARI_BASE_URL / ARI_API_KEY");

    vi.unstubAllEnvs();
  });

  it("classifies full-contract BAD_JSON as parse failure while provider remains reachable", async () => {
    const error = Object.assign(new Error("full smoke failed"), {
      meta: {
        providerMatrix: [
          {
            provider: "openai",
            state: "failed",
            errorKind: "BAD_JSON",
            errorMessage: "Unexpected token < in JSON",
            reason: "Unexpected token < in JSON",
          },
        ],
        probes: [
          {
            provider: "openai",
            ok: true,
            errorKind: null,
            durationMs: 88,
          },
        ],
      },
    });
    mocks.callE150Orchestrator.mockRejectedValue(error);
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openai = body.rows.find((row: any) => row.provider === "openai");
    expect(openai.status).toBe("failed");
    expect(openai.providerStatus).toBe("reachable");
    expect(openai.parseStatus).toBe("failed");
    expect(openai.schemaStatus).toBe("not_started");
    expect(openai.errorKind).toBe("BAD_JSON");
    expect(openai.nextAction).toContain("Analyze-/JSON-Contract");
  });

  it("accepts fenced JSON in full contract mode when schema-valid", async () => {
    mockFullOrchestrator(`\`\`\`json\n${JSON.stringify(VALID_ANALYZE_JSON)}\n\`\`\``);
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openai = body.rows.find((row: any) => row.provider === "openai");
    expect(openai.status).toBe("ok");
    expect(openai.parseStatus).toBe("ok");
    expect(openai.schemaStatus).toBe("ok");
  });

  it("accepts prose plus clearly bounded JSON object in full contract mode", async () => {
    mockFullOrchestrator(`Analyse folgt:\n${JSON.stringify(VALID_ANALYZE_JSON)}\nEnde.`);
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const openai = body.rows.find((row: any) => row.provider === "openai");
    expect(openai.status).toBe("ok");
    expect(openai.parseStatus).toBe("ok");
  });

  it("reports BAD_JSON with parseError and rawExcerpt for malformed JSON", async () => {
    mockFullOrchestrator("```json\n{\"mode\":\"E150\", bad}\n```");
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const openai = body.rows.find((row: any) => row.provider === "openai");

    expect(openai.status).toBe("failed");
    expect(openai.errorKind).toBe("BAD_JSON");
    expect(openai.providerErrorCode).toBe("BAD_JSON");
    expect(openai.parseError).toBeTruthy();
    expect(openai.rawExcerpt).toBeTruthy();
  });

  it("reports SCHEMA_INVALID with schemaPath for valid JSON missing required fields", async () => {
    const { notes: _ignored, ...missingNotes } = VALID_ANALYZE_JSON;
    mockFullOrchestrator(JSON.stringify(missingNotes));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const openai = body.rows.find((row: any) => row.provider === "openai");

    expect(openai.status).toBe("failed");
    expect(openai.providerErrorCode).toBe("SCHEMA_INVALID");
    expect(openai.schemaStatus).toBe("failed");
    expect(openai.schemaPath).toContain("notes");
    expect(openai.errorKind).toBe("INTERNAL");
  });
});
