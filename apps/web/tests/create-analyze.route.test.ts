import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

function sseReq(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
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
    process.env.NODE_ENV = "test";
    delete process.env.VERCEL_ENV;
    delete process.env.E150_PRESENTATION_PASS_DEFAULT;

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

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
    expect(body.verificationMode).toBe("none");
    expect(body.researchUsed).toBe("none");
    expect(body.sealEligible).toBe(false);
    expect(body.sealGranted).toBe(false);
    expect(body.verificationLabel).toBe("analysiert");
    expect(body.truthStatus).toBe("source_open");
    expect(body.sourceSupport).toBe("open");
    expect(body.sourceStatus).toBe("Keine Quellenprüfung gestartet");
    expect(body.reviewRecommended).toBe(false);
    expect(body.noTruthPromotion).toBe(true);
    expect(body.noAutoGraphPromotion).toBe(true);
    expect(body.createAnalyze.truthStatus).toBe("source_open");
    expect(body.createAnalyze.sourceSupport).toBe("open");
    expect(body.createAnalyze.noTruthPromotion).toBe(true);
    expect(body.meta?.verificationLabel).toBe(body.verificationLabel);
    expect(body.meta?.truthStatus).toBe(body.truthStatus);
    expect(body.meta?.sourceSupport).toBe(body.sourceSupport);
    expect(body.meta?.sourceStatus).toBe(body.sourceStatus);
    expect(body.meta?.reviewRecommended).toBe(body.reviewRecommended);
    expect(body.meta?.graphSync).toEqual(
      expect.objectContaining({
        attempted: false,
        mode: "disabled",
        noAutoPromote: true,
      }),
    );
    expect(body.meta?.journeyProfile).toBe("analyze");
    expect(body.meta?.lane).toBe("standard");
    expect(body.meta?.fallbackUsed).toBe(false);
    expect(body.meta?.disagreement?.present).toBe(false);
    expect(mocks.syncAnalyzeResultToGraph).not.toHaveBeenCalled();
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

  it("maps create analysis modes to explicit audience/profile hints", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));

    await analyzePOST(
      req({
        text: "Dies ist ein ausreichend langer Text fuer den Medienmodus-Test.",
        locale: "de-DE",
        analysisMode: "media",
      }),
    );
    expect(mocks.analyzeContribution).toHaveBeenLastCalledWith(
      expect.objectContaining({
        analysisMode: "media",
        audienceRole: "staff",
      }),
    );

    await analyzePOST(
      req({
        text: "Dies ist ein ausreichend langer Text fuer den Guided-Modus-Test.",
        locale: "de-DE",
        analysisMode: "guided",
      }),
    );
    expect(mocks.analyzeContribution).toHaveBeenLastCalledWith(
      expect.objectContaining({
        analysisMode: "guided",
        audienceRole: "institution",
      }),
    );
  });

  it("forwards explicit create intent as journey hint", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));

    await analyzePOST(
      req({
        text: "Dies ist ein ausreichend langer Text fuer den Intent-Check.",
        locale: "de-DE",
        intent: "check",
        analysisMode: "media",
      }),
    );

    expect(mocks.analyzeContribution).toHaveBeenLastCalledWith(
      expect.objectContaining({
        analysisMode: "media",
        journeyHint: "media",
      }),
    );
  });

  it("forwards explicit presentationPass flag to analyzeContribution as optional tone pass switch", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));

    const res = await analyzePOST(
      req({
        text: "Das ist ein ausreichend langer Text fuer den Presentation-Pass-Test.",
        locale: "de-DE",
        analysisMode: "media",
        presentationPass: true,
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.analyzeContribution).toHaveBeenLastCalledWith(
      expect.objectContaining({
        analysisMode: "media",
        presentationPassEnabled: true,
      }),
    );
  });

  it("passes upload-aware source grounding prompt addon to analyzer", async () => {
    mocks.analyzeContribution.mockResolvedValue(
      buildAnalyzeResult({ claims: [{ id: "c1", text: "Dokumentbasierter Claim mit Mobilität." }] }),
    );

    const res = await analyzePOST(
      req({
        text: "Bitte den hochgeladenen Bericht auswerten.",
        locale: "de-DE",
        analysisMode: "analyze",
        evidenceItems: [
          {
            kind: "upload_document",
            id: "doc-1",
            title: "Bericht Mobilität",
            documentText:
              "Die Mobilität im Quartier hat sich im mittleren Abschnitt stark verändert. Der Bericht nennt konkrete Konflikte.",
          },
        ],
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.analyzeContribution).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisMode: "analyze",
        sourceGroundingPromptAddon: expect.stringContaining("SOURCE ORCHESTRATION CONTRACT"),
      }),
    );
  });

  it("forwards real analyze run and dossier correlation into analyzeContribution", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));

    const res = await analyzePOST(
      req({
        text: "Dies ist ein ausreichend langer Text fuer die Korrelation.",
        locale: "de-DE",
        dossierId: "dossier-42",
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.analyzeContribution).toHaveBeenLastCalledWith(
      expect.objectContaining({
        runId: expect.any(String),
        dossierId: "dossier-42",
        operationId: expect.any(String),
        operationType: "analyze_run",
        userId: null,
      }),
    );
  });

  it("returns source grounding audit metadata with upload priority and contradiction signals", async () => {
    mocks.analyzeContribution.mockResolvedValue(
      buildAnalyzeResult({
        claims: [{ id: "c1", text: "Der Bericht beschreibt einen Mobilitätskonflikt im Quartier." }],
      }),
    );

    const res = await analyzePOST(
      req({
        text: "Bitte den Bericht analysieren und Widersprüche markieren.",
        locale: "de-DE",
        analysisMode: "analyze",
        evidenceItems: [
          {
            kind: "upload_document",
            id: "doc-1",
            title: "Mobilitätsbericht",
            documentText:
              "Im mittleren Abschnitt beschreibt der Bericht einen Mobilitätskonflikt im Quartier und offene Fragen zur Umsetzung.",
          },
        ],
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.meta?.sourceGrounding).toBeTruthy();
    expect(body.meta?.sourceGrounding?.sourceInventory?.uploadDocuments).toBe(1);
    expect(body.meta?.sourceGrounding?.documentGroundingPass?.required).toBe(true);
    expect(body.meta?.sourceGrounding?.documentGroundingPass?.middleCoverage).toBe(true);
    expect(body.meta?.sourceGrounding?.noSourceBluffing?.passed).toBe(true);
    expect(body.meta?.sourceGrounding?.synthesis?.documentGroundedClaims).toBeGreaterThanOrEqual(1);
  });

  it("routes YouTube material intake through review-first material grounding without auto research", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));

    const res = await analyzePOST(
      req({
        sourceUrls: ["https://www.youtube.com/watch?v=demo12345"],
        researchMode: "auto",
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.meta?.lane).toBe("material_grounding");
    expect(body.meta?.journeyProfile).toBe("material_grounding");
    expect(body.meta?.materialProvider).toBe("none");
    expect(body.meta?.researchProvider).toBe("none");
    expect(body.meta?.fallbackUsed).toBe(false);
    expect(body.researchUsed).toBe("none");
    expect(body.createAnalyze?.requiresHumanReview).toBe(true);
    expect(body.meta?.sourceGrounding?.sourceInventory?.youtubeTranscripts).toBe(0);
    expect(body.meta?.materialIntake?.items?.[0]).toEqual(
      expect.objectContaining({
        type: "youtube_video",
        status: "extraction_pending",
        reviewRequired: true,
        publicReferenceAllowed: false,
      }),
    );
    expect(body.meta?.materialIntake?.guardrails).toEqual(
      expect.objectContaining({
        noAutoNotebook: true,
        noAutoGemini: true,
        noAutoDeepSearch: true,
        noAutoPublish: true,
      }),
    );
    expect(mocks.analyzeContribution).toHaveBeenLastCalledWith(
      expect.objectContaining({
        journeyHint: "material_grounding",
        text: expect.stringContaining("Material eingereicht"),
      }),
    );
  });

  it("routes PDF uploads into material grounding without auto publish side effects", async () => {
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult({ claims: [] }));

    const res = await analyzePOST(
      req({
        uploadIds: ["upload-7"],
        materialItems: [{ uploadId: "upload-7", fileName: "bericht.pdf", kind: "upload_document" }],
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.meta?.lane).toBe("material_grounding");
    expect(body.meta?.materialProvider).toBe("none");
    expect(body.researchUsed).toBe("none");
    expect(body.createAnalyze?.noAutoPublish).toBe(true);
    expect(body.createAnalyze?.noSilentMerge).toBe(true);
    expect(body.meta?.materialIntake?.items?.[0]).toEqual(
      expect.objectContaining({
        type: "pdf",
        status: "scan_needed",
        reviewRequired: true,
        publicReferenceAllowed: false,
      }),
    );
    expect(body.meta?.sourceGrounding?.sourceInventory?.pdfDocuments).toBeGreaterThanOrEqual(1);
  });

  it("falls back to heuristic createAnalyze output when analyze times out", async () => {
    const timeoutError = Object.assign(new Error("analyze_timeout"), { code: "ANALYZE_TIMEOUT" });
    mocks.analyzeContribution.mockRejectedValue(timeoutError);
    mocks.buildHeuristicAnalyzeResult.mockReturnValue(
      buildAnalyzeResult({ claims: [{ id: "c-timeout", text: "Fallback-Claim" }] }),
    );

    const res = await analyzePOST(
      req({
        text: "Das ist ein laengerer Freitext mit genug Kontext fuer die Analyse.",
        locale: "de-DE",
        createMode: "source",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.fallback).toBe(true);
    expect(body.errorCode).toBe("ANALYZE_TIMEOUT");
    expect(body.result?.claims?.[0]?.text).toBe("Fallback-Claim");
    expect(body.createAnalyze).toBeTruthy();
    expect(body.meta?.fallbackUsed).toBe(true);
    expect(body.verificationLabel).toBe("analysiert");
    expect(body.reviewRecommended).toBe(true);
    expect(body.noTruthPromotion).toBe(true);
    expect(body.meta?.graphSync?.mode).toBe("disabled");
  });

  it("does not surface precheck as geprueft when provider fallback is used", async () => {
    mocks.analyzeContribution.mockResolvedValue({
      ...buildAnalyzeResult({ claims: [{ id: "c1", text: "Pruefbarer Claim" }] }),
      _meta: {
        verificationMode: "precheck",
        researchUsed: "none",
        sealEligible: false,
        sealGranted: false,
        fallbackUsed: true,
        lane: "standard",
        journeyProfile: "media",
        disagreement: {
          present: true,
          successfulProviders: ["openai"],
          failedProviders: ["mistral"],
          missingSpecialists: ["mistral"],
          insufficientIndependentSuccess: true,
        },
        confidence: {
          score: 0.32,
          bucket: "low",
          reasons: ["insufficient_independent_success"],
        },
      },
    });

    const res = await analyzePOST(
      req({
        text: "Dies ist ein ausreichend langer Text fuer den Fallback-Precheck-Test.",
        locale: "de-DE",
        analysisMode: "media",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.verificationMode).toBe("precheck");
    expect(body.verificationLabel).toBe("analysiert");
    expect(body.reviewRecommended).toBe(true);
    expect(body.noTruthPromotion).toBe(true);
    expect(body.meta?.confidence?.bucket).toBe("low");
    expect(body.meta?.verificationLabel).toBe(body.verificationLabel);
    expect(body.meta?.truthStatus).toBe(body.truthStatus);
    expect(body.meta?.graphSync?.mode).toBe("disabled");
  });

  it("keeps degraded provider responses on the same centralized truth meta", async () => {
    const providerError = Object.assign(new Error("provider failed"), {
      code: "ANALYZE_PROVIDER_FAILED",
      meta: {
        providerMatrix: [{ provider: "mistral", state: "failed", reason: "bad_json" }],
        failedProviders: [{ provider: "mistral", error: "bad_json" }],
      },
    });
    mocks.analyzeContribution.mockRejectedValue(providerError);

    const res = await analyzePOST(
      req({
        text: "Ausreichend langer Text fuer den degraded provider path.",
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.verificationLabel).toBe("analysiert");
    expect(body.noTruthPromotion).toBe(true);
    expect(body.noAutoGraphPromotion).toBe(true);
    expect(body.meta?.graphSync?.mode).toBe("disabled");
    expect(body.meta?.verificationLabel).toBe(body.verificationLabel);
    expect(body.meta?.truthStatus).toBe(body.truthStatus);
    expect(body.meta?.sourceSupport).toBe(body.sourceSupport);
  });

  it("keeps development/test no-provider responses explicitly degraded with heuristic fallback", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    mocks.analyzeContribution.mockRejectedValue(
      Object.assign(new Error("no provider"), { code: "NO_ANALYZE_PROVIDER" }),
    );
    mocks.buildHeuristicAnalyzeResult.mockReturnValue(
      buildAnalyzeResult({ claims: [{ id: "c-dev", text: "Fallback-Claim" }] }),
    );

    const res = await analyzePOST(
      req({
        text: "Ausreichend langer Text fuer den Development-Fallback.",
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.fallback).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.realProviderSuccess).toBe(false);
    expect(body.errorCode).toBe("NO_ANALYZE_PROVIDER");
    expect(body.result?.claims?.[0]?.text).toBe("Fallback-Claim");
  });

  it("fails closed in preview without providers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    mocks.analyzeContribution.mockRejectedValue(
      Object.assign(new Error("no provider"), { code: "NO_ANALYZE_PROVIDER" }),
    );

    const res = await analyzePOST(
      req({
        text: "Ausreichend langer Text fuer den Preview-No-Provider-Fall.",
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errorCode).toBe("NO_ANALYZE_PROVIDER");
    expect(body.result).toBeUndefined();
  });

  it("fails closed in production without providers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mocks.analyzeContribution.mockRejectedValue(
      Object.assign(new Error("no provider"), { code: "NO_ANALYZE_PROVIDER" }),
    );

    const res = await analyzePOST(
      req({
        text: "Ausreichend langer Text fuer den Production-No-Provider-Fall.",
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errorCode).toBe("NO_ANALYZE_PROVIDER");
    expect(body.result).toBeUndefined();
  });

  it("fails closed in preview and production for provider failures and invalid responses", async () => {
    for (const runtimeEnv of ["preview", "production"] as const) {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("VERCEL_ENV", runtimeEnv);

      mocks.analyzeContribution.mockRejectedValueOnce(
        Object.assign(new Error("provider failed"), { code: "ANALYZE_PROVIDER_FAILED" }),
      );
      let res = await analyzePOST(
        req({
          text: `Ausreichend langer Text fuer ${runtimeEnv} provider failure.`,
          locale: "de-DE",
        }),
      );
      expect(res.status).toBe(502);
      let body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.errorCode).toBe("ANALYZE_PROVIDER_FAILED");
      expect(body.result).toBeUndefined();

      mocks.analyzeContribution.mockRejectedValueOnce(
        Object.assign(new Error("bad json"), { code: "BAD_JSON" }),
      );
      res = await analyzePOST(
        req({
          text: `Ausreichend langer Text fuer ${runtimeEnv} bad json.`,
          locale: "de-DE",
        }),
      );
      expect(res.status).toBe(502);
      body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.errorCode).toBe("BAD_JSON");
      expect(body.result).toBeUndefined();
    }
  });

  it("keeps timeouts degraded only in development and fail-closed in production", async () => {
    const timeoutError = Object.assign(new Error("analyze_timeout"), { code: "ANALYZE_TIMEOUT" });

    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    mocks.analyzeContribution.mockRejectedValueOnce(timeoutError);
    mocks.buildHeuristicAnalyzeResult.mockReturnValueOnce(
      buildAnalyzeResult({ claims: [{ id: "c-timeout-dev", text: "Timeout-Fallback" }] }),
    );

    let res = await analyzePOST(
      req({
        text: "Ausreichend langer Text fuer den Development-Timeout-Fall.",
        locale: "de-DE",
      }),
    );
    expect(res.status).toBe(200);
    let body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.fallback).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.realProviderSuccess).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mocks.analyzeContribution.mockRejectedValueOnce(timeoutError);

    res = await analyzePOST(
      req({
        text: "Ausreichend langer Text fuer den Production-Timeout-Fall.",
        locale: "de-DE",
      }),
    );
    expect(res.status).toBe(504);
    body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errorCode).toBe("ANALYZE_TIMEOUT");
    expect(body.result).toBeUndefined();
  });

  it("emits only an error event for production SSE runtime failures", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mocks.analyzeContribution.mockRejectedValue(
      Object.assign(new Error("no provider"), { code: "NO_ANALYZE_PROVIDER" }),
    );

    const res = await analyzePOST(
      sseReq({
        text: "Ausreichend langer Text fuer den SSE-Production-Fehler.",
        locale: "de-DE",
        stream: true,
      }),
    );

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("event: error");
    expect(text).not.toContain("event: result");
    expect(text).toContain("\"code\":\"NO_ANALYZE_PROVIDER\"");
  });

  it("strips provider, prompt, response, pii and token text from the public provider matrix", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mocks.analyzeContribution.mockRejectedValue(
      Object.assign(new Error("provider failed"), {
        code: "ANALYZE_PROVIDER_FAILED",
        meta: {
          providerMatrix: [
            {
              provider: "openai",
              state: "failed",
              attempt: 1,
              errorKind: "BAD_JSON",
              status: 502,
              durationMs: 123,
              model: "gpt-5",
              reason:
                "Alice alice@example.org Prompt: Bitte prüfe das Thema. Response: Volltext https://api.example.org?token=abc Bearer sk-secret",
              errorMessage: "freie Providerantwort",
              rawExcerpt: "freie Providerantwort",
              openaiErrorMessage: "schema fallback",
              providerErrorCode: "BAD_JSON",
            },
          ],
        },
      }),
    );

    const res = await analyzePOST(
      req({
        text: "Ausreichend langer Text fuer die Provider-Matrix-Haertung.",
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    const row = body.meta?.providerMatrix?.[0];
    const serialized = JSON.stringify(body);

    expect(body.ok).toBe(false);
    expect(row).toEqual({
      provider: "openai",
      state: "failed",
      attempt: 1,
      errorKind: "BAD_JSON",
      status: 502,
      durationMs: 123,
      model: "gpt-5",
      reason: "provider_failed",
    });
    expect(serialized).not.toContain("alice@example.org");
    expect(serialized).not.toContain("Alice");
    expect(serialized).not.toContain("Prompt:");
    expect(serialized).not.toContain("Response:");
    expect(serialized).not.toContain("Bearer sk-secret");
    expect(serialized).not.toContain("token=abc");
    expect(serialized).not.toContain("freie Providerantwort");
    expect(serialized).not.toContain("schema fallback");
  });

  it("logs analyze failures without prompt, provider response, pii or tokens", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.analyzeContribution.mockRejectedValue(
      Object.assign(
        new Error(
          "Alice alice@example.org Prompt: Bitte prüfe das Thema. Response: Volltext Bearer sk-secret",
        ),
        { code: "ANALYZE_PROVIDER_FAILED" },
      ),
    );

    const res = await analyzePOST(
      req({
        text: "Ausreichend langer Text fuer den Logging-Haertungsfall.",
        locale: "de-DE",
      }),
    );

    expect(res.status).toBe(502);
    const consoleDump = JSON.stringify(consoleErrorSpy.mock.calls);
    const loggerDump = JSON.stringify(mocks.loggerError.mock.calls);

    expect(consoleDump).not.toContain("alice@example.org");
    expect(consoleDump).not.toContain("Prompt:");
    expect(consoleDump).not.toContain("Response:");
    expect(consoleDump).not.toContain("sk-secret");
    expect(loggerDump).not.toContain("alice@example.org");
    expect(loggerDump).not.toContain("Prompt:");
    expect(loggerDump).not.toContain("Response:");
    expect(loggerDump).not.toContain("sk-secret");
    expect(loggerDump).toContain("ANALYZE_PROVIDER_FAILED");
  });
});
