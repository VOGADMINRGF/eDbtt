import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildCreatePlanner: vi.fn(),
}));

vi.mock("@/features/create/createPlanner", () => ({
  buildCreatePlanner: (...args: unknown[]) => mocks.buildCreatePlanner(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";

describe("create planner routing contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses planner_only metadata for normal free text without mutative actions", async () => {
    mocks.buildCreatePlanner.mockResolvedValue({
      source: "openai",
      plannerSource: "openai",
      plannerProvider: "openai",
      plannerRole: "planner_only",
      plannerTopic: "Tierschutz, Tierhaltung und Agrarstandards",
      plannerCore: "Forderung nach besseren Tierschutz- und Tierhaltungsstandards",
      plannerScope: ["eu", "federal", "international"],
      plannerStance: "pro",
      plannerClusters: ["Tierwohl und Haltungsstandards", "Import- und Exportregeln"],
      plannerOpenQuestions: ["Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?"],
      shortSummary: "Der Beitrag fordert strengere Tierwohlstandards.",
      topicCandidates: ["Tierschutz, Tierhaltung und Agrarstandards", "Tierwohl"],
      clusterCandidates: ["Tierwohl und Haltungsstandards", "Import- und Exportregeln"],
      scopeCandidates: ["eu", "federal", "international"],
      stance: "pro",
      openQuestions: [
        "Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?",
        "Sollten importierte und exportierte Tierprodukte nur zugelassen werden, wenn vergleichbare Tierwohlstandards eingehalten werden?",
      ],
      graphSearchTerms: ["Tierwohl", "Import Export Tierprodukte"],
      materialSignals: [],
      recommendedLane: "create_fast_followup",
      providerPlan: {
        lane: "create_fast_followup",
        plannerProvider: "openai",
        plannerRole: "planner_only",
        structureProvider: "mistral",
        summaryProvider: "claude",
        researchUsed: "none",
        researchProvider: null,
        deepSearchUsed: false,
        graphMatch: "after_structure",
      },
      permissions: {
        nonMutative: true,
        canPublish: false,
        canSave: false,
        canMerge: false,
        canDeepSearch: false,
      },
      plannerDegraded: false,
      degradedReason: null,
      plannerDegradedReason: null,
      qualityStatus: "specific",
      qualityIssues: [],
      providerCallAttempted: true,
      providerCallSucceeded: true,
      plannerDebug: {
        attemptedProvider: "openai",
        usedProvider: "openai",
        providerAvailable: true,
        providerErrorCode: null,
        providerErrorMessage: null,
        errorMessage: null,
        rawPayloadValid: true,
        rawTextValid: true,
        normalizedPayloadValid: true,
        qualityGatePassed: true,
      },
    });
    const result = await buildCreateIntelligentFollowup({
      text: "Ich bin für bessere Tierwohlstandards.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.meta?.planner.source).toBe("openai");
    expect(result.meta?.planner.providerPlan.plannerRole).toBe("planner_only");
    expect(result.meta?.planner.permissions.nonMutative).toBe(true);
    expect(result.meta?.planner.permissions.canPublish).toBe(false);
    expect(result.meta?.planner.permissions.canSave).toBe(false);
    expect(result.meta?.planner.permissions.canMerge).toBe(false);
    expect(result.meta?.planner.permissions.canDeepSearch).toBe(false);
    expect(result.meta?.researchUsed).toBe("none");
    expect(result.meta?.researchProvider).toBeNull();
    expect(result.meta?.deepSearchUsed).toBe(false);
    expect(result.meta?.graphMatch.stage).toBe("after_structure");
    expect(result.meta?.graphMatch.requiresConfirmation).toBe(true);
    expect(result.meta?.graphMatch.searchTerms).toEqual(expect.arrayContaining(["Tierwohl"]));
    expect(result.degraded).toBe(false);
    expect(result.understanding.topics[0]?.label).toBe("Tierschutz, Tierhaltung und Agrarstandards");
    expect(result.understanding.statements[0]?.text).toBe("Forderung nach besseren Tierschutz- und Tierhaltungsstandards");
  });

  it("keeps fallback planners visible as degraded when the provider contract is not fulfilled", async () => {
    mocks.buildCreatePlanner.mockResolvedValue({
      source: "heuristic_fallback",
      plannerSource: "heuristic_fallback",
      plannerProvider: "local_fallback",
      plannerRole: "planner_only",
      plannerTopic: "Öffentliches Anliegen mit Klärungsbedarf",
      plannerCore: "Neues öffentliches Thema strukturieren",
      plannerScope: ["unclear"],
      plannerStance: "open",
      plannerClusters: [],
      plannerOpenQuestions: ["Was genau soll geklärt, verändert oder vorbereitet werden?"],
      shortSummary: "Kurzfassung",
      topicCandidates: ["Öffentliches Anliegen mit Klärungsbedarf"],
      clusterCandidates: [],
      scopeCandidates: ["unclear"],
      stance: "open",
      openQuestions: ["Was genau soll geklärt, verändert oder vorbereitet werden?"],
      graphSearchTerms: [],
      materialSignals: [],
      recommendedLane: "standard",
      providerPlan: {
        lane: "standard",
        plannerProvider: "local_fallback",
        plannerRole: "planner_only",
        structureProvider: "mistral",
        summaryProvider: "claude",
        researchUsed: "none",
        researchProvider: null,
        deepSearchUsed: false,
        graphMatch: "after_structure",
      },
      permissions: {
        nonMutative: true,
        canPublish: false,
        canSave: false,
        canMerge: false,
        canDeepSearch: false,
      },
      plannerDegraded: true,
      degradedReason: "quality_gate_failed",
      plannerDegradedReason: "quality_gate_failed",
      qualityStatus: "generic",
      qualityIssues: ["core_generic", "topic_generic"],
      providerCallAttempted: true,
      providerCallSucceeded: false,
      plannerDebug: {
        attemptedProvider: "openai",
        usedProvider: "local_fallback",
        providerAvailable: true,
        providerErrorCode: null,
        providerErrorMessage: "qualityStatus=generic",
        errorMessage: "qualityStatus=generic",
        rawPayloadValid: true,
        rawTextValid: true,
        normalizedPayloadValid: true,
        qualityGatePassed: false,
      },
    });
    const result = await buildCreateIntelligentFollowup({
      text: "Ein längerer Mehrthemenbeitrag ohne brauchbaren Planner-Vertrag.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.meta?.planner.plannerDegraded).toBe(true);
    expect(result.meta?.planner.degradedReason).toBe("quality_gate_failed");
    expect(result.meta?.planner.qualityStatus).toBe("generic");
    expect(result.meta?.graphMatch.prepared).toBe(false);
    expect(result.meta?.graphMatch.searchTerms).toEqual([]);
    expect(result.meta?.planner.plannerDebug.attemptedProvider).toBe("openai");
    expect(result.meta?.planner.plannerDebug.usedProvider).toBe("local_fallback");
    expect(result.degraded).toBe(true);
  });

  it("keeps concrete local planner structure usable when the automatic planner timed out", async () => {
    mocks.buildCreatePlanner.mockResolvedValue({
      source: "heuristic_fallback",
      plannerSource: "heuristic_fallback",
      plannerProvider: "local_fallback",
      plannerRole: "planner_only",
      plannerTopic: "Grundrechte, gesellschaftliche Pflichten und demokratische Priorisierung",
      plannerCore:
        "Zielkonflikt zwischen Menschenwürde, Grundrechten, gesellschaftlicher Verantwortung, Migration, europäischer Politik, regionaler Beteiligung und Budgetprioritäten.",
      plannerScope: ["federal", "eu", "local"],
      plannerStance: "reform_oriented",
      plannerClusters: [
        "Menschenwürde, Grundrechte und Verantwortung",
        "Migration, offene Grenzen und gesellschaftliche Regeln",
        "Europäische Energie- und Industriepolitik",
        "Regionale Abstimmungen und Bürgerbeteiligung",
        "Budgetverteilung und öffentliche Prioritäten",
      ],
      plannerOpenQuestions: [
        "Welcher Teil soll zuerst bearbeitet werden: Grundrechte, Migration, Energiepolitik, regionale Abstimmung oder Budgetverteilung?",
      ],
      shortSummary:
        "Der Beitrag verbindet Grundrechte, Migration, europäische Politik, Beteiligung und Budgetfragen zu einem Mehrthemenkonflikt.",
      topicCandidates: [
        "Grundrechte, gesellschaftliche Pflichten und demokratische Priorisierung",
        "Menschenwürde",
        "Migration",
        "Energiepolitik Europa",
        "regionale Abstimmungen",
        "Budgetpriorisierung",
      ],
      clusterCandidates: [
        "Menschenwürde, Grundrechte und Verantwortung",
        "Migration, offene Grenzen und gesellschaftliche Regeln",
        "Europäische Energie- und Industriepolitik",
        "Regionale Abstimmungen und Bürgerbeteiligung",
        "Budgetverteilung und öffentliche Prioritäten",
      ],
      scopeCandidates: ["federal", "eu", "local"],
      stance: "reform_oriented",
      openQuestions: [
        "Welcher Teil soll zuerst bearbeitet werden: Grundrechte, Migration, Energiepolitik, regionale Abstimmung oder Budgetverteilung?",
      ],
      graphSearchTerms: [
        "Menschenwürde",
        "Grundrechte",
        "Migration",
        "EU Energiepolitik",
        "regionale Abstimmungen",
        "Budgetpriorisierung",
      ],
      materialSignals: [],
      recommendedLane: "create_fast_followup",
      providerPlan: {
        lane: "create_fast_followup",
        plannerProvider: "local_fallback",
        plannerRole: "planner_only",
        structureProvider: "mistral",
        summaryProvider: "claude",
        researchUsed: "none",
        researchProvider: null,
        deepSearchUsed: false,
        graphMatch: "after_structure",
      },
      permissions: {
        nonMutative: true,
        canPublish: false,
        canSave: false,
        canMerge: false,
        canDeepSearch: false,
      },
      plannerDegraded: true,
      degradedReason: "timeout",
      plannerDegradedReason: "timeout",
      qualityStatus: "needs_confirmation",
      qualityIssues: ["provider_timeout"],
      providerCallAttempted: true,
      providerCallSucceeded: false,
      plannerDebug: {
        attemptedProvider: "openai",
        usedProvider: "local_fallback",
        providerAvailable: true,
        providerErrorCode: null,
        providerErrorMessage: "create_planner_timeout_after_2200ms",
        errorMessage: "create_planner_timeout_after_2200ms",
        rawPayloadValid: false,
        rawTextValid: false,
        normalizedPayloadValid: false,
        qualityGatePassed: false,
      },
    });

    const result = await buildCreateIntelligentFollowup({
      text: "Ein längerer Mehrthemenbeitrag zu Grundrechten, Migration, Energiepolitik, Abstimmungen und Budget.",
      locale: "de",
      intent: "contribute",
    });

    expect(result.degraded).toBe(true);
    expect(result.meta?.planner.degradedReason).toBe("timeout");
    expect(result.understanding.summary).toContain("Grundrechte");
    expect(result.understanding.topics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Grundrechte, gesellschaftliche Pflichten und demokratische Priorisierung" }),
        expect.objectContaining({ label: "Menschenwürde" }),
        expect.objectContaining({ label: "Migration" }),
        expect.objectContaining({ label: "Energiepolitik Europa" }),
        expect.objectContaining({ label: "regionale Abstimmungen" }),
        expect.objectContaining({ label: "Budgetpriorisierung" }),
      ]),
    );
    expect(result.understanding.statements[0]?.text).toContain("Menschenwürde");
    expect(result.meta?.graphMatch.prepared).toBe(false);
  });

  it("builds a concrete local planner for mixed quota and equality text when AI is unavailable", async () => {
    const originalOpenAiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const { buildCreatePlanner } = await vi.importActual<typeof import("@/features/create/createPlanner")>(
        "@/features/create/createPlanner",
      );
      const planner = await buildCreatePlanner({
        text: "ich bin gegen frauenquote aber für mehr gleichberechtigung, gibt es eine frauenquote müsste es auch quoten von anderen minderheiten geben, das kann nicht richtig und wirtschaftlich für ein unternehmen sein.",
        locale: "de",
      });

      expect(planner.source).toBe("heuristic_fallback");
      expect(planner.plannerProvider).toBe("local_fallback");
      expect(planner.plannerRole).toBe("planner_only");
      expect(planner.plannerTopic).toBe("Gleichberechtigung, Antidiskriminierung und Quotenregelungen");
      expect(planner.plannerCore).toBe(
        "Kritik an verbindlichen Quotenregelungen bei gleichzeitigem Wunsch nach Gleichberechtigung",
      );
      expect(planner.plannerClusters).toEqual([
        "Gleichberechtigung",
        "Frauenquote",
        "Minderheitenförderung",
        "wirtschaftliche Auswirkungen für Unternehmen",
      ]);
      expect(planner.plannerOpenQuestions).toEqual([
        "Geht es um gesetzliche Quoten, Unternehmensquoten oder Förderprogramme?",
        "Welche Minderheiten oder Gruppen sollen verglichen werden?",
        "Soll daraus ein Claim, eine Frage oder ein Dossier entstehen?",
      ]);
      expect(planner.qualityStatus).toBe("needs_confirmation");
      expect(planner.plannerDegraded).toBe(true);
      expect(planner.degradedReason).toBe("missing_provider_key");
      expect(planner.qualityIssues).toContain("technical_fallback_only");
      expect(planner.permissions.canSave).toBe(false);
      expect(planner.permissions.canPublish).toBe(false);
      expect(planner.permissions.canMerge).toBe(false);
      expect(planner.permissions.canDeepSearch).toBe(false);
      expect(planner.providerPlan.deepSearchUsed).toBe(false);
      expect(planner.providerPlan.researchUsed).toBe("none");
      expect(planner.providerPlan.plannerProvider).toBe("local_fallback");
      expect(planner.providerPlan.graphMatch).toBe("after_structure");
    } finally {
      if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = originalOpenAiKey;
    }
  });
});
