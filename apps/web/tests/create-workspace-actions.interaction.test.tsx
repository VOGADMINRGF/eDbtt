/** @vitest-environment jsdom */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";
import {
  buildCreateStructureBranches,
  type CreateIntelligentFollowupResult,
  type DocumentAnalysisSummary,
} from "@/features/create/intelligentFollowupContract";
import {
  buildCreateTechnicalFollowup,
  buildCreateValidatedDocumentFollowup,
} from "@/features/create/intelligentFollowupResults";
import { detectCreateLinkIntake } from "@/features/create/linkIntake";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/create/existingTopicMatchesRuntimeBridge", () => ({
  resolveExistingTopicMatchesFromRuntime: vi.fn().mockResolvedValue({
    status: "preview",
    blockers: [],
    usedSources: ["preview"],
    model: {
      topicTitle: "Preview",
      introText: "Preview",
      matches: [],
      suggestedDecision: "connect_to_existing",
      openQuestions: [],
      guardrailNote: "Das sind Anschlussvorschläge, keine automatische Zusammenführung.",
      sourceKind: "preview",
      sourceLabel: "Preview",
      emptyStateText: "Keine bestehenden Treffer.",
      outcomeResultStatus: "draft",
    },
  }),
}));

afterEach(() => {
  cleanup();
});

function buildGraphMatch() {
  return {
    stage: "after_structure" as const,
    prepared: false,
    requiresConfirmation: true as const,
    searchTerms: [],
    matches: [],
    matchedTopics: [],
    matchedDossiers: [],
    matchedClaims: [],
    matchedAnlassraeume: [],
    matchedVotes: [],
    shouldCreateNewTopic: false,
  };
}

function buildSpecificPlanner() {
  return {
    source: "openai" as const,
    plannerSource: "openai" as const,
    plannerProvider: "openai" as const,
    plannerRole: "planner_only" as const,
    plannerTopic: "ÖPNV und Mobilität",
    plannerCore:
      "Der Beitrag verbindet abendlichen Bus-Takt, Anschlussmobilität sowie Fragen zu Straßenraum, Parkraum und Radwegen.",
    plannerScope: ["district" as const],
    plannerStance: "open" as const,
    plannerClusters: [
      "ÖPNV und Mobilität",
      "Straßenraum und Radverkehr",
      "Parkraum und kommunale Planung",
      "Pendler- und Anschlussmobilität",
    ],
    plannerOpenQuestions: ["Welcher Themenstrang soll zuerst vertieft werden?"],
    shortSummary:
      "Der Beitrag verknüpft Bus-Takt, Anschlussmobilität, Straßenumbau, Parkraum und Radwege.",
    topicCandidates: [
      "ÖPNV und Mobilität",
      "Straßenraum und Radverkehr",
      "Parkraum und kommunale Planung",
      "Pendler- und Anschlussmobilität",
    ],
    clusterCandidates: [
      "ÖPNV und Mobilität",
      "Straßenraum und Radverkehr",
      "Parkraum und kommunale Planung",
      "Pendler- und Anschlussmobilität",
    ],
    scopeCandidates: ["district" as const],
    stance: "open" as const,
    openQuestions: ["Welcher Themenstrang soll zuerst vertieft werden?"],
    graphSearchTerms: ["öpnv", "straßenraum", "parkraum", "anschlussmobilität"],
    materialSignals: [],
    recommendedLane: "create_fast_followup" as const,
    providerPlan: {
      lane: "create_fast_followup" as const,
      plannerProvider: "openai" as const,
      plannerRole: "planner_only" as const,
      structureProvider: "mistral" as const,
      summaryProvider: "claude" as const,
      researchUsed: "none" as const,
      researchProvider: null,
      deepSearchUsed: false,
      graphMatch: "after_structure" as const,
    },
    permissions: {
      nonMutative: true as const,
      canPublish: false as const,
      canSave: false as const,
      canMerge: false as const,
      canDeepSearch: false as const,
    },
    plannerDegraded: false,
    degradedReason: null,
    plannerDegradedReason: null,
    qualityStatus: "specific" as const,
    qualityIssues: [],
    providerCallAttempted: true,
    providerCallSucceeded: true,
    plannerDebug: {
      attemptedProvider: "openai" as const,
      usedProvider: "openai" as const,
      providerAvailable: true,
      providerErrorCode: null,
      providerErrorMessage: null,
      errorMessage: null,
      rawPayloadValid: true,
      rawTextValid: true,
      normalizedPayloadValid: true,
      qualityGatePassed: true,
    },
  };
}

function buildValidatedTopicResult(): CreateIntelligentFollowupResult {
  return {
    understanding: {
      summary:
        "Der Beitrag verknüpft Bus-Takt, Anschlussmobilität, Straßenumbau, Parkraum und Radwege.",
      categories: [{ id: "claim", label: "Aussage", confidence: "high" }],
      topics: [
        { id: "topic-1", label: "ÖPNV und Mobilität", confidence: "high" },
        { id: "topic-2", label: "Straßenraum und Radverkehr", confidence: "high" },
        { id: "topic-3", label: "Parkraum und kommunale Planung", confidence: "high" },
        { id: "topic-4", label: "Pendler- und Anschlussmobilität", confidence: "medium" },
      ],
      statements: [
        {
          id: "statement-1",
          text: "Bei uns im Bezirk fährt der Bus abends nur noch alle 30 Minuten.",
          kind: "claim",
          stance: "open",
          confidence: "high",
        },
      ],
      scopes: ["district"],
      openQuestion: "Welcher Themenstrang soll zuerst vertieft werden?",
      confidence: "high",
    },
    suggestions: [],
    sourceText:
      "Bei uns im Bezirk fährt der Bus abends nur noch alle 30 Minuten. Dadurch verpassen viele Beschäftigte den Anschluss an die S-Bahn. Gleichzeitig soll die Hauptstraße umgebaut werden, aber niemand weiß, ob dabei Parkplätze wegfallen oder neue Radwege entstehen.",
    generatedAt: "2026-07-18T10:00:00.000Z",
    meta: {
      planner: buildSpecificPlanner(),
      graphMatch: buildGraphMatch(),
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
      analysis: {
        state: "result_ready",
        analysisId: "analysis-topics",
        sourceType: "text",
        sourceUrl: null,
        sourceContentHash: "hash-topics",
        analyzedAt: "2026-07-18T10:00:00.000Z",
        orchestrationRunId: "orch-topics",
        schemaVersion: "create_followup.v2",
        validationStatus: "validated",
        evidenceReferences: [],
        confidence: 0.88,
        sourceLoaded: true,
        userMessage: null,
      },
    },
  };
}

function buildDocumentAnalysis(): DocumentAnalysisSummary {
  return {
    sourceUrl: "https://example.com/fdp-programm.pdf",
    documentTitle: "Grundsatzprogramm der FDP",
    documentType: "party_program",
    pageCount: 78,
    wordCount: 18240,
    topicCount: 4,
    subtopicCount: 18,
    keyStatementCount: 94,
    verifiableClaimCount: 31,
    policyProposalCount: 12,
    subjectBreadth: "broad",
    subjectDepth: "mixed",
    balanceAssessment: "programmatic",
    sourceSpecificity: "partly_specific",
    sourceVerificationStatus: "not_started",
    counterpositionCoverage: "weak",
    summary:
      "Das Programm verbindet wirtschaftliche Liberalisierung, Digitalisierung, Bürgerrechte und staatliche Modernisierung.",
    topics: [
      { id: "topic-1", label: "Wirtschaft & Steuern", subtopicCount: 5, keyStatementCount: 20, verifiableClaimCount: 7, policyProposalCount: 3, summary: "Wirtschaftspolitische Leitlinien." },
      { id: "topic-2", label: "Arbeit & Soziales", subtopicCount: 4, keyStatementCount: 18, verifiableClaimCount: 6, policyProposalCount: 2, summary: "Arbeitsmarkt und Sozialstaat." },
      { id: "topic-3", label: "Bildung & Forschung", subtopicCount: 4, keyStatementCount: 16, verifiableClaimCount: 5, policyProposalCount: 3, summary: "Bildungspolitische Schwerpunkte." },
      { id: "topic-4", label: "Staat & Verwaltung", subtopicCount: 5, keyStatementCount: 21, verifiableClaimCount: 13, policyProposalCount: 4, summary: "Verwaltungsmodernisierung." },
    ],
  };
}

function buildDocumentResult() {
  return buildCreateValidatedDocumentFollowup({
    text: "https://example.com/fdp-programm.pdf",
    sourceUrl: "https://example.com/fdp-programm.pdf",
    documentAnalysis: buildDocumentAnalysis(),
    generatedAt: "2026-07-18T11:00:00.000Z",
  });
}

function Harness(props: {
  initialResult: CreateIntelligentFollowupResult;
  linkText?: string;
  previewAllTopics?: boolean;
}) {
  const [result, setResult] = React.useState(props.initialResult);
  const [confirmed, setConfirmed] = React.useState(false);
  const [documentTopicOverviewOpened, setDocumentTopicOverviewOpened] = React.useState(false);
  const [showExpandedTopicPreview, setShowExpandedTopicPreview] = React.useState(false);
  const [topicExpansionDecision, setTopicExpansionDecision] = React.useState<
    "idle" | "expanded" | "compact" | "link" | "later"
  >("idle");
  const [composerMode, setComposerMode] = React.useState<"default" | "edit" | "source" | "manual_topic">(
    "default",
  );
  const [parkedTopicLabels, setParkedTopicLabels] = React.useState<string[]>([]);
  const [selectedPrimaryTopic, setSelectedPrimaryTopic] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const linkDetection = React.useMemo(
    () => detectCreateLinkIntake(props.linkText ?? result.sourceText),
    [props.linkText, result.sourceText],
  );

  const composerPlaceholder =
    composerMode === "source"
      ? "Füge eine Quelle, einen Beschluss oder ein Beispiel hinzu …"
      : !confirmed
        ? "Möchtest du ein Thema ändern, ergänzen oder zusammenführen?"
        : "Welche Aussage möchtest du schärfen?";

  return (
    <div>
      <CreateVisualFollowup
        result={result}
        actionNotice={actionNotice}
        isConfirmed={confirmed}
        selectedPrimaryTopic={selectedPrimaryTopic}
        parkedTopicLabels={parkedTopicLabels}
        composerMode={composerMode}
        linkDetection={linkDetection}
        compactBranchLimit={3}
        expandedBranchLimit={4}
        documentTopicOverviewOpened={documentTopicOverviewOpened}
        showExpandedTopicPreview={showExpandedTopicPreview}
        topicExpansionDecision={topicExpansionDecision}
        expandedTopicAccess={{
          canPreviewAllTopics: props.previewAllTopics ?? true,
          isPrivilegedPreview: false,
          costState: "uses_search_credit",
        }}
        onConfirm={() => {
          setConfirmed(true);
          setComposerMode("default");
          setSelectedPrimaryTopic((current) => current ?? buildCreateStructureBranches(result, 3)[0]?.title ?? null);
          setActionNotice("Themenstruktur bestätigt.");
        }}
        onEdit={() => setComposerMode("edit")}
        onParkTopic={(topicLabel) => {
          setParkedTopicLabels((current) => (current.includes(topicLabel) ? current : [...current, topicLabel]));
          setActionNotice(`${topicLabel} wurde geparkt.`);
        }}
        onOpenManualTopicChooser={() => setComposerMode("manual_topic")}
        onPrepareSubmission={() => {}}
        onPrepareAnlassraum={() => {}}
        onOpenDossierAppend={() => {}}
        onOpenDossierCreate={() => {}}
        onPrepareVote={() => {}}
        onExpandTopicPreview={() => {
          setShowExpandedTopicPreview(true);
          setTopicExpansionDecision("expanded");
          setActionNotice("Das weitere Thema wird jetzt angezeigt.");
        }}
        onKeepCompactTopicPreview={() => {
          setShowExpandedTopicPreview(false);
          setTopicExpansionDecision("compact");
          setActionNotice("Du arbeitest zunächst nur mit diesen drei Themen weiter.");
        }}
        onOpenDocumentTopicOverview={() => {
          setDocumentTopicOverviewOpened(true);
          setActionNotice("Die Themenübersicht ist jetzt geöffnet.");
        }}
        onPrepareLinkReview={() => {
          const state = result.meta?.analysis?.state;
          if (state === "link_detected") {
            setResult(
              buildCreateTechnicalFollowup({
                text: result.sourceText,
                analysisState: "entitlement_required",
                sourceType: "link",
                sourceUrl: linkDetection.primaryUrl,
                sourceLoaded: false,
                userMessage:
                  "Die vollständige Link- und Dokumentanalyse nutzt dein verfügbares Analyse-/Recherche-Kontingent.",
              }),
            );
            return;
          }
          setTopicExpansionDecision("link");
        }}
        onDeferExpandedReview={() => setTopicExpansionDecision("later")}
        onSaveOnly={() => setActionNotice("Entwurf gespeichert. Noch nicht veröffentlicht.")}
        onSaveQuestion={() => {}}
        onSaveTopic={() => {}}
        onSaveSource={() => {}}
        onSaveInternal={() => {}}
        onPrepareCommunity={() => {}}
        onDeferWork={() => setActionNotice("Später fortsetzen gewählt.")}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />
      <div data-testid="composer-placeholder">{composerPlaceholder}</div>
      <div data-testid="topic-expansion-decision">{topicExpansionDecision}</div>
      <div data-testid="parked-topics">{parkedTopicLabels.join("|")}</div>
      <div data-testid="analysis-state">{result.meta?.analysis?.state ?? ""}</div>
    </div>
  );
}

describe("create workspace actions interaction", () => {
  it("keeps unloaded links purely technical until analysis is explicitly started", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initialResult={buildCreateTechnicalFollowup({
          text: "https://example.com/fundstelle.pdf",
          analysisState: "link_detected",
          sourceType: "link",
          sourceUrl: "https://example.com/fundstelle.pdf",
          sourceLoaded: false,
          userMessage:
            "Ich muss den verlinkten Inhalt zuerst vollständig laden und mit dem KI-Orchester analysieren. Vorher leite ich keine Themen ab.",
        })}
        linkText="https://example.com/fundstelle.pdf"
      />,
    );

    expect(screen.getByText("Link erkannt")).toBeTruthy();
    expect(screen.getAllByText(/Vorher leite ich keine Themen ab/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Link analysieren" })).toBeTruthy();
    expect(screen.queryByText("ÖPNV und Mobilität")).toBeNull();
    expect(screen.queryByText("78 Seiten")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Link analysieren" }));

    expect(screen.getByTestId("analysis-state").textContent).toBe("entitlement_required");
    expect(screen.getAllByText(/Analyse-\/Recherche-Kontingent/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Analyse starten" })).toBeTruthy();
  });

  it("shows fetch and ai failures without deriving fallback topics", () => {
    render(
      <div>
        <Harness
          initialResult={buildCreateTechnicalFollowup({
            text: "https://example.com/kaputt.pdf",
            analysisState: "fetch_failed",
            sourceType: "link",
            sourceUrl: "https://example.com/kaputt.pdf",
            sourceLoaded: false,
            userMessage:
              "Der Linkinhalt konnte nicht vollständig geladen werden. Es wurden keine Themen abgeleitet.",
          })}
        />
        <Harness
          initialResult={buildCreateTechnicalFollowup({
            text: "https://example.com/inhalt.pdf",
            analysisState: "ai_failed",
            sourceType: "document",
            sourceUrl: "https://example.com/inhalt.pdf",
            sourceLoaded: true,
            userMessage:
              "Der Inhalt wurde geladen, konnte aber noch nicht durch das KI-Orchester analysiert werden. Es wurden keine Themen abgeleitet.",
          })}
        />
      </div>,
    );

    expect(screen.getAllByText(/konnte nicht vollständig geladen werden/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/konnte aber noch nicht durch das KI-Orchester analysiert werden/).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Parkraum und kommunale Planung")).toBeNull();
    expect(screen.queryByText("Wohnen und Genehmigungen")).toBeNull();
  });

  it("renders the validated document diagnosis before the topic overview and uses result counts only", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initialResult={buildDocumentResult()} previewAllTopics />);

    expect(screen.getByText("Dokument erkannt")).toBeTruthy();
    expect(screen.getByText("Grundsatzprogramm der FDP")).toBeTruthy();
    expect(screen.getByText("78 Seiten · 4 Themen · 18 Unterthemen")).toBeTruthy();
    expect(screen.getByText("31 überprüfbare Tatsachenbehauptungen")).toBeTruthy();
    expect(screen.getByText("noch nicht erfolgt")).toBeTruthy();
    expect(screen.queryByText("27 Unterthemen")).toBeNull();
    expect(container.querySelectorAll("[data-create-topic-branch-card]")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Themenübersicht öffnen" }));

    expect(screen.getByText("Ich habe 4 Themenbereiche und 18 Unterthemen erkannt. Drei zeige ich dir als Einstieg.")).toBeTruthy();
    expect(container.querySelectorAll("[data-create-topic-branch-card]")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Weiteres Thema anzeigen" })).toBeTruthy();
  });

  it("keeps the bus and street-planning smoke topics consistent and removes wrong fallback topics", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initialResult={buildValidatedTopicResult()} previewAllTopics />);

    expect(container.querySelectorAll("[data-create-pipeline-rail]")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Details & Transparenz" })).toHaveLength(1);
    expect(screen.getAllByText("ÖPNV und Mobilität").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Straßenraum und Radverkehr").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Parkraum und kommunale Planung").length).toBeGreaterThan(0);
    expect(container.textContent ?? "").not.toContain("Wohnen und Genehmigungen");
    expect(container.textContent ?? "").not.toContain("Bildung, Integration und Sicherheit");
    expect(container.querySelectorAll("[data-create-topic-branch-card]")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Weiteres Thema anzeigen" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Aussage schärfen" })).toBeNull();
    expect(screen.getByTestId("composer-placeholder").textContent).toBe(
      "Möchtest du ein Thema ändern, ergänzen oder zusammenführen?",
    );

    await user.click(screen.getByRole("button", { name: "Weiteres Thema anzeigen" }));
    expect(screen.getByTestId("topic-expansion-decision").textContent).toBe("expanded");
    expect(container.querySelectorAll("[data-create-topic-branch-card]")).toHaveLength(4);
    expect(container.textContent ?? "").toContain("Pendler- und Anschlussmobilität");
  });

  it("keeps themes confirm-first and updates placeholder and topic state after visible actions", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initialResult={buildValidatedTopicResult()} previewAllTopics />);

    const branchCards = Array.from(container.querySelectorAll("[data-create-topic-branch-card]"));
    expect(branchCards.length).toBeGreaterThanOrEqual(2);

    await user.click(screen.getAllByRole("button", { name: "Themenstruktur bestätigen" })[0]!);
    expect(screen.getByTestId("composer-placeholder").textContent).toBe(
      "Welche Aussage möchtest du schärfen?",
    );
    expect(screen.getByRole("button", { name: "Aussage schärfen" })).toBeTruthy();

    await user.click(screen.getAllByRole("button", { name: "Thema parken" })[0]!);
    expect(screen.getByTestId("parked-topics").textContent).not.toBe("");
  });

  it("keeps public wording free of provider, runtime and policy leakage in the main flow", () => {
    const { container } = render(<Harness initialResult={buildValidatedTopicResult()} previewAllTopics />);
    const text = container.textContent ?? "";

    expect(text).not.toContain("OpenAI");
    expect(text).not.toContain("Provider");
    expect(text).not.toContain("Runtime");
    expect(text).not.toContain("Policy");
  });
});
