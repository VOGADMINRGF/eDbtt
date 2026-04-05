import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
  rateLimitOrThrow: vi.fn(),
  deriveContextNotes: vi.fn(),
  deriveCriticalQuestions: vi.fn(),
  deriveKnots: vi.fn(),
  syncAnalyzeResultToGraph: vi.fn(),
  persistEventualitiesSnapshot: vi.fn(),
  upsertRunReceipt: vi.fn(),
  loggerError: vi.fn(),
  maskUserId: vi.fn(),
  buildHeuristicAnalyzeResult: vi.fn(),
  resolveCreateGraphMatches: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: (...args: unknown[]) => mocks.rateLimitOrThrow(...args),
}));

vi.mock("@features/analyze/context", () => ({
  deriveContextNotes: (...args: unknown[]) => mocks.deriveContextNotes(...args),
}));

vi.mock("@features/analyze/questionizers", () => ({
  deriveCriticalQuestions: (...args: unknown[]) => mocks.deriveCriticalQuestions(...args),
  deriveKnots: (...args: unknown[]) => mocks.deriveKnots(...args),
}));

vi.mock("@core/graph", () => ({
  syncAnalyzeResultToGraph: (...args: unknown[]) => mocks.syncAnalyzeResultToGraph(...args),
}));

vi.mock("@core/eventualities", () => ({
  persistEventualitiesSnapshot: (...args: unknown[]) => mocks.persistEventualitiesSnapshot(...args),
}));

vi.mock("@/lib/db/runReceiptsRepo", () => ({
  upsertRunReceipt: (...args: unknown[]) => mocks.upsertRunReceipt(...args),
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => mocks.loggerError(...args),
  },
}));

vi.mock("@core/pii/redact", () => ({
  maskUserId: (...args: unknown[]) => mocks.maskUserId(...args),
}));

vi.mock("@features/analyze/heuristics", () => ({
  buildHeuristicAnalyzeResult: (...args: unknown[]) => mocks.buildHeuristicAnalyzeResult(...args),
}));

vi.mock("@/features/create/matchService", () => ({
  resolveCreateGraphMatches: (...args: unknown[]) => mocks.resolveCreateGraphMatches(...args),
}));

import { POST as analyzePOST } from "@/app/api/contributions/analyze/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

function buildAnalyzeResult(params?: { claims?: Array<Record<string, unknown>> }) {
  return {
    mode: "E150",
    sourceText: null,
    language: "de",
    claims: params?.claims ?? [],
    notes: [{ id: "n1", kind: "FACTS", text: "Quelle fehlt" }],
    questions: [{ id: "q1", text: "Welche Quelle bestaetigt das?", dimension: "FACTS" }],
    missingPerspectives: [],
    findings: [],
    knots: [],
    consequences: { consequences: [], responsibilities: [] },
    responsibilityPaths: [],
    eventualities: [],
    decisionTrees: [],
    impactAndResponsibility: { impacts: [], responsibleActors: [] },
    participationCandidates: [],
    report: {
      summary: null,
      keyConflicts: [],
      facts: { local: [], international: [] },
      openQuestions: [],
      takeaways: [],
    },
    _meta: {
      provider: null,
      model: null,
      pipeline: "contribution_analyze",
      contributionId: "cid-1",
    },
  };
}

describe("/api/contributions/analyze create orchestration envelope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANALYZE_ENABLED = "true";

    mocks.rateLimitOrThrow.mockResolvedValue({ ok: true, retryIn: 0 });
    mocks.deriveContextNotes.mockReturnValue([]);
    mocks.deriveCriticalQuestions.mockReturnValue([]);
    mocks.deriveKnots.mockReturnValue([]);
    mocks.syncAnalyzeResultToGraph.mockResolvedValue(undefined);
    mocks.persistEventualitiesSnapshot.mockResolvedValue(null);
    mocks.upsertRunReceipt.mockResolvedValue(undefined);
    mocks.maskUserId.mockImplementation((value: unknown) => String(value ?? ""));
    mocks.buildHeuristicAnalyzeResult.mockReturnValue(buildAnalyzeResult());
    mocks.resolveCreateGraphMatches.mockResolvedValue({
      matches: [
        {
          id: "no-match",
          matchType: "no_match",
          matchEntityType: "question",
          strength: "none",
          label: "Kein belastbarer Match",
          reason: "Kein belastbarer Match in produktiven Quellen gefunden.",
          reasons: ["Kein belastbarer Match in produktiven Quellen gefunden."],
          entityId: null,
          targetRef: null,
        },
      ],
      matchStrength: "none",
      matchType: "no_match",
      matchEntityType: "question",
      reasons: ["Kein belastbarer Match in produktiven Quellen gefunden."],
      suggestedCtas: [
        {
          id: "neu_anlegen",
          label: "Neu anlegen",
          reason: "Kein belastbarer Match. Ein neuer Strang ist der kanonische Einstieg.",
        },
      ],
      sourceState: "ok",
      sourceErrors: [],
    });
  });

  it("returns typed createAnalyze payload using productive same_anlassraum match", async () => {
    mocks.analyzeContribution.mockResolvedValue(
      buildAnalyzeResult({ claims: [{ id: "c1", text: "Pruefbarer Claim" }] }),
    );
    mocks.resolveCreateGraphMatches.mockResolvedValueOnce({
      matches: [
        {
          id: "65f000000000000000000011",
          matchType: "same_anlassraum",
          matchEntityType: "anlassraum",
          strength: "high",
          label: "Anlassraum Innenstadt",
          reason: "Explizit gesetzter Anlassraum-Kontext.",
          reasons: [
            "Explizit gesetzter Anlassraum-Kontext.",
            "Kontext wurde im produktiven Anlassraum-Read-Model gefunden.",
          ],
          entityId: "65f000000000000000000011",
          targetRef: "/create?anlassraumId=65f000000000000000000011",
        },
      ],
      matchStrength: "high",
      matchType: "same_anlassraum",
      matchEntityType: "anlassraum",
      reasons: ["Explizit gesetzter Anlassraum-Kontext."],
      suggestedCtas: [
        {
          id: "anlassraum_oeffnen",
          label: "Anlassraum oeffnen",
          reason: "Kontext wurde im selben Anlassraum erkannt; manuelle Bestaetigung bleibt erforderlich.",
        },
        {
          id: "perspektive_anhaengen",
          label: "Perspektive anhaengen",
          reason: "Ursprung bleibt erhalten; Perspektive wird additiv angehaengt.",
        },
      ],
      sourceState: "ok",
      sourceErrors: [],
    });

    const res = await analyzePOST(
      req({
        text: "Das ist ein laengerer Freitext mit genug Kontext fuer die Analyse.",
        locale: "de-DE",
        createMode: "source",
        anlassraumId: "65f000000000000000000011",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.createAnalyze).toBeTruthy();
    expect(body.createAnalyze.schemaVersion).toBe("create_analyze.v1");
    expect(body.createAnalyze.orchestrator).toBe("create_orchestration");
    expect(body.createAnalyze.inputRef).toBe(body.createAnalyze.runId);
    expect(body.createAnalyze.provenanceRefs).toContain(body.createAnalyze.runId);
    expect(body.meta?.runId).toBe(body.createAnalyze.runId);
    expect(body.createAnalyze.inputType).toBe("free_text");
    expect(body.createAnalyze.matchStrength).toBe("high");
    expect(body.createAnalyze.matchType).toBe("same_anlassraum");
    expect(body.createAnalyze.matchEntityType).toBe("anlassraum");
    expect(body.createAnalyze.reasons).toContain("Explizit gesetzter Anlassraum-Kontext.");
    expect(body.createAnalyze.noAutoPublish).toBe(true);
    expect(body.createAnalyze.noSilentMerge).toBe(true);
    expect(body.createAnalyze.phases.intake.status).toBe("done");
    expect(Array.isArray(body.createAnalyze.suggestedCtas)).toBe(true);
    expect(mocks.resolveCreateGraphMatches).toHaveBeenCalledTimes(1);
  });

  it("maps quote input to quote type and recommends new strand CTA for no-match", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));
    mocks.resolveCreateGraphMatches.mockResolvedValueOnce({
      matches: [
        {
          id: "no-match",
          matchType: "no_match",
          matchEntityType: "question",
          strength: "none",
          label: "Kein belastbarer Match",
          reason: "Kein belastbarer Match in produktiven Quellen gefunden.",
          reasons: ["Kein belastbarer Match in produktiven Quellen gefunden."],
          entityId: null,
          targetRef: null,
        },
      ],
      matchStrength: "none",
      matchType: "no_match",
      matchEntityType: "question",
      reasons: ["Kein belastbarer Match in produktiven Quellen gefunden."],
      suggestedCtas: [
        {
          id: "neu_anlegen",
          label: "Neu anlegen",
          reason: "Kein belastbarer Match. Ein neuer Strang ist der kanonische Einstieg.",
        },
      ],
      sourceState: "ok",
      sourceErrors: [],
    });

    const res = await analyzePOST(
      req({
        text: 'Zitat: "Kurzer Auszug" ohne belastbare Zuordnung im Graphen.',
        locale: "de-DE",
        createMode: "source",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.createAnalyze.inputType).toBe("quote");
    expect(body.createAnalyze.matchStrength).toBe("none");
    expect(body.createAnalyze.matchType).toBe("no_match");
    expect(body.createAnalyze.suggestedCtas.some((item: any) => item.id === "neu_anlegen")).toBe(true);
    expect(body.createAnalyze.phases.graph_matching.summary).toContain("matchType=no_match");
  });

  it("detects source_url and mixed-language signals in typed envelope", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));
    mocks.resolveCreateGraphMatches.mockResolvedValueOnce({
      matches: [
        {
          id: "dossier-1",
          matchType: "related_dossier",
          matchEntityType: "dossier",
          strength: "medium",
          label: "Dossier Verkehr",
          reason: "Semantische Naehe zum produktiven Dossier-Titel.",
          reasons: ["Semantische Naehe zum produktiven Dossier-Titel."],
          entityId: "dossier-1",
          targetRef: "/dossier/dossier-1",
        },
      ],
      matchStrength: "medium",
      matchType: "related_dossier",
      matchEntityType: "dossier",
      reasons: ["Semantische Naehe zum produktiven Dossier-Titel."],
      suggestedCtas: [
        {
          id: "dossier_oeffnen",
          label: "Dossier oeffnen",
          reason: "Dossier-Naehe erkannt; Einlesen vor jeder manuellen Uebernahme.",
        },
      ],
      sourceState: "ok",
      sourceErrors: [],
    });

    const res = await analyzePOST(
      req({
        text: "https://example.org/report This and that is relevant und sollte geprueft werden.",
        locale: "de-DE",
        createMode: "source",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.createAnalyze.inputType).toBe("source_url");
    expect(body.createAnalyze.languages).toContain("de");
    expect(body.createAnalyze.languages).toContain("en");
    expect(body.createAnalyze.matchType).toBe("related_dossier");
    expect(body.createAnalyze.requiresHumanReview).toBe(true);
  });

  it("keeps route stable and explicit when productive match service is unavailable", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));
    mocks.resolveCreateGraphMatches.mockRejectedValueOnce(new Error("source_unavailable"));

    const res = await analyzePOST(
      req({
        text: "Inhalt mit ausreichender Laenge fuer den Analyze-Pfad ohne produktive Match-Quelle.",
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.createAnalyze.matchType).toBe("no_match");
    expect(body.createAnalyze.matchSourceState).toBe("degraded");
    expect(body.createAnalyze.matchSourceErrors).toContain("match_service_unavailable");
    expect(body.createAnalyze.phases.graph_matching.status).toBe("review_required");
    expect(body.createAnalyze.suggestedCtas.some((item: any) => item.id === "neu_anlegen")).toBe(true);
    expect(body.createAnalyze.matchingLanguageMode).toBe("same_language_only");
  });

  it("uses explicit language triplet with contentLanguage as analyze language", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));

    const res = await analyzePOST(
      req({
        text: "Dies ist ein laengerer Text fuer die Sprachkontext-Pruefung.",
        locale: "en-US",
        uiLocale: "fr-FR",
        contentLanguage: "de-DE",
        sourceLanguage: "es-ES",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.createAnalyze.uiLocale).toBe("fr");
    expect(body.createAnalyze.contentLanguage).toBe("de");
    expect(body.createAnalyze.sourceLanguage).toBe("es");
    expect(body.createAnalyze.matchingLanguageMode).toBe("same_language_only");
    expect(mocks.analyzeContribution).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "de",
      }),
    );
  });
});
