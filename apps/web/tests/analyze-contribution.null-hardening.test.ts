import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callE150Orchestrator: vi.fn(),
}));

vi.mock("@features/ai/orchestratorE150", () => ({
  callE150Orchestrator: (...args: unknown[]) => mocks.callE150Orchestrator(...args),
  OrchestratorNoProviderError: class extends Error {},
  OrchestratorAllFailedError: class extends Error {},
}));

import { analyzeContribution } from "@features/analyze/analyzeContribution";

function orchestratorResult(parsed: Record<string, unknown>) {
  return {
    rawText: JSON.stringify(parsed),
    best: {
      provider: "openai",
      rawText: JSON.stringify(parsed),
      score: 1,
      durationMs: 12,
      parsed,
    },
    candidates: [],
    meta: {
      usedProviders: ["openai"],
      failedProviders: [],
      timings: {
        openai: 12,
        anthropic: null,
        mistral: null,
        gemini: null,
        ari: null,
      },
      disabledProviders: [],
      skippedProviders: [],
      providerMatrix: [],
    },
  };
}

describe("analyzeContribution null hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses standard journey specialist routing without OpenAI in primary providers", async () => {
    mocks.callE150Orchestrator.mockResolvedValue(
      orchestratorResult({
        claims: [{ id: "claim-1", text: "Ein pruefbarer Beitragstext." }],
      }),
    );

    await analyzeContribution({
      text: "Das ist ein laengerer Beitragstext mit genug Kontext.",
      locale: "de",
      analysisMode: "guided",
      audienceRole: "institution",
    });

    const args = mocks.callE150Orchestrator.mock.calls[0]?.[0] as any;
    expect(args?.journey).toBe("guided");
    expect(args?.journeyProfile?.lane).toBe("standard");
    expect(Object.values(args?.journeyProfile?.primaryRoles ?? {}).flat()).not.toContain("openai");
    expect(args?.journeyProfile?.fallbackProviders).toEqual(["openai"]);
    expect(args?.journeyProfile?.openAiRoles).toEqual(["fallback", "presentation_pass"]);
  });

  it("routes factcheck contexts into sealed_factcheck defaults", async () => {
    mocks.callE150Orchestrator.mockResolvedValue(
      orchestratorResult({
        claims: [{ id: "claim-1", text: "Factcheck-Claim." }],
      }),
    );

    const result = await analyzeContribution({
      text: "Pruefbarer Factcheck-Ausgangstext mit Kontext.",
      locale: "de",
      pipeline: "factcheck" as any,
      journeyHint: "sealed_factcheck",
      sealedFactcheck: true,
      audienceRole: "staff",
    });

    const args = mocks.callE150Orchestrator.mock.calls[0]?.[0] as any;
    expect(args?.journey).toBe("sealed_factcheck");
    expect(args?.journeyProfile?.lane).toBe("sealed_factcheck");
    expect(args?.journeyProfile?.verificationDefaults?.verificationMode).toBe("sealed");
    expect(args?.journeyProfile?.verificationDefaults?.researchUsed).toBe("search");
    expect(result?._meta?.verificationMode).toBe("sealed");
    expect(result?._meta?.researchUsed).toBe("search");
    expect(result?._meta?.sealEligible).toBe(true);
    expect(result?._meta?.sealGranted).toBe(false);
  });

  it("normalizes null-heavy AI payloads before strict AnalyzeResultSchema validation", async () => {
    mocks.callE150Orchestrator.mockResolvedValue(
      orchestratorResult({
        claims: [{ id: "claim-1", text: "Ein prüfbarer Beitragstext.", domain: "gesellschaft" }],
        notes: [{ id: "n1", text: null }, { id: "n2", text: "Kontext vorhanden." }],
        questions: [{ id: "q1", text: null }, { id: "q2", text: "Welche Daten fehlen?" }],
        knots: [{ id: "k1", label: "Konflikt", description: null, text: "Beschreibung" }],
        participationCandidates: [{ id: "pc-1", label: "Option A", description: "Kompakter Hinweis" }],
        report: {
          summary: null,
          keyConflicts: [null, "Interessenkonflikt"],
          facts: { local: [null, "Lokaler Fakt"], international: [null, "Internationaler Fakt"] },
          openQuestions: [null, "Offene Frage"],
          takeaways: [null, "Takeaway"],
        },
      }),
    );

    const result = await analyzeContribution({
      text: "Das ist ein längerer Beitragstext mit Kontext und Folgen.",
      locale: "de",
    });

    expect(result.notes.map((item) => item.text)).toEqual(["Kontext vorhanden."]);
    expect(result.questions.map((item) => item.text)).toEqual(["Welche Daten fehlen?"]);
    expect(result.knots[0]?.description).toBe("Beschreibung");
    expect(result.participationCandidates[0]?.text).toBe("Option A");
    expect(result.participationCandidates[0]?.rationale).toBe("Kompakter Hinweis");
    expect(result.report.keyConflicts).toEqual(["Interessenkonflikt"]);
    expect(result.report.facts.local).toEqual(["Lokaler Fakt"]);
    expect(result.report.facts.international).toEqual(["Internationaler Fakt"]);
    expect(result.report.openQuestions).toEqual(["Offene Frage"]);
    expect(result.report.takeaways).toEqual(["Takeaway"]);
  });

  it("sanitizes responsibility path nodes and locale when AI returns nullable path fields", async () => {
    mocks.callE150Orchestrator.mockResolvedValue(
      orchestratorResult({
        claims: [{ id: "claim-1", text: "Pfadbezogener Claim." }],
        responsibilityPaths: [
          {
            id: "path-1",
            statementId: null,
            claimId: "claim-1",
            locale: null,
            nodes: [
              {
                level: "federal",
                actorKey: null,
                actor: "bundestag",
                displayName: null,
                name: "Deutscher Bundestag",
                description: null,
                contactUrl: null,
                processHint: null,
              },
            ],
          },
        ],
      }),
    );

    const result = await analyzeContribution({
      text: "Längerer Beitrag für Zuständigkeitspfad.",
      locale: "de",
    });

    expect(result.responsibilityPaths).toHaveLength(1);
    expect(result.responsibilityPaths[0]?.statementId).toBe("claim-1");
    expect(result.responsibilityPaths[0]?.locale).toBe("de");
    expect(result.responsibilityPaths[0]?.nodes).toHaveLength(1);
    expect(result.responsibilityPaths[0]?.nodes[0]?.level).toBe("federal");
    expect(result.responsibilityPaths[0]?.nodes[0]?.actorKey).toBe("bundestag");
    expect(result.responsibilityPaths[0]?.nodes[0]?.displayName).toBe("Deutscher Bundestag");
  });

  it("applies optional presentation pass only to display text and keeps verification fields stable", async () => {
    mocks.callE150Orchestrator.mockResolvedValue(
      orchestratorResult({
        claims: [{ id: "claim-1", text: "Claim bleibt gleich." }],
        notes: [{ id: "n1", text: "  Kontext   ;  knapp  " }],
        questions: [{ id: "q1", text: "  Welche  Daten  fehlen ?  " }],
        report: {
          summary: "  Kompakt   ;  neutral !!  ",
          keyConflicts: ["  Konflikt   A  "],
          facts: { local: ["Fakt"], international: [] },
          openQuestions: ["  Offen ?  "],
          takeaways: ["  Nächster   Schritt  "],
        },
      }),
    );

    const result = await analyzeContribution({
      text: "Ein längerer Medienbeitrag mit Kontext und Detailpunkten.",
      locale: "de",
      analysisMode: "media",
      audienceRole: "staff",
      presentationPassEnabled: true,
    });

    expect(result.claims).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "claim-1", text: "Claim bleibt gleich." })]),
    );
    expect(result.report.summary).toBe("Kompakt; neutral!");
    expect(result.report.keyConflicts).toEqual(["Konflikt A"]);
    expect(result.report.openQuestions).toEqual(["Offen?"]);
    expect(result.report.takeaways).toEqual(["Nächster Schritt"]);
    expect(result.notes[0]?.text).toBe("Kontext; knapp");
    expect(result.questions[0]?.text).toBe("Welche Daten fehlen?");
    expect(result?._meta?.verificationMode).toBe("precheck");
    expect(result?._meta?.researchUsed).toBe("none");
    expect(result?._meta?.sealEligible).toBe(false);
    expect(result?._meta?.sealGranted).toBe(false);
    expect(result?._meta?.tonePassUsed).toBe(true);
    expect(result?._meta?.presentationPass?.applied).toBe(true);
  });

  it("forwards real runtime correlation context into orchestrator telemetry only when provided", async () => {
    mocks.callE150Orchestrator.mockResolvedValue(
      orchestratorResult({
        claims: [{ id: "claim-1", text: "Korrelation pruefbar." }],
      }),
    );

    await analyzeContribution({
      text: "Ein längerer Beitrag mit echtem Laufkontext.",
      locale: "de",
      runId: "run-1",
      userId: "user-1",
      dossierId: "dossier-1",
      operationId: "operation-1",
      operationType: "analyze_run",
      requestId: "request-1",
      organizationId: "org-1",
    });

    const args = mocks.callE150Orchestrator.mock.calls[0]?.[0] as any;
    expect(args?.telemetry).toMatchObject({
      pipeline: "contribution_analyze",
      runId: "run-1",
      userId: "user-1",
      dossierId: "dossier-1",
      operationId: "operation-1",
      operationType: "analyze_run",
      requestId: "request-1",
      organizationId: "org-1",
    });
  });
});
