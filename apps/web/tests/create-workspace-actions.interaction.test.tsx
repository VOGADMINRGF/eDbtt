/** @vitest-environment jsdom */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";

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
      topicTitle: "Verkehr",
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
    searchTerms: ["verkehr", "sicherheit", "finanzen"],
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
    plannerTopic: "Verkehr",
    plannerCore: "Der Beitrag verbindet Schulwegsicherheit, Regelklarheit und Finanzierung.",
    plannerScope: ["district" as const],
    plannerStance: "open" as const,
    plannerClusters: ["Verkehr", "Sicherheit/Rechtsstaat", "Kommunale Finanzen"],
    plannerOpenQuestions: ["Welcher Themenstrang soll zuerst vertieft werden?"],
    shortSummary: "Mehrere Themenstränge sind erkennbar und können jetzt sortiert werden.",
    topicCandidates: ["Verkehr", "Sicherheit/Rechtsstaat", "Kommunale Finanzen"],
    clusterCandidates: ["Verkehr", "Sicherheit/Rechtsstaat", "Kommunale Finanzen"],
    scopeCandidates: ["district" as const],
    stance: "open" as const,
    openQuestions: ["Welcher Themenstrang soll zuerst vertieft werden?"],
    graphSearchTerms: ["verkehr", "schulweg", "sicherheit", "haushalt"],
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

function buildDegradedPlanner() {
  return {
    source: "heuristic_fallback" as const,
    plannerSource: "heuristic_fallback" as const,
    plannerProvider: "openai" as const,
    plannerRole: "planner_only" as const,
    plannerTopic: "GPT-Einordnung nicht abgeschlossen",
    plannerCore: "Die Einordnung ist noch nicht belastbar genug.",
    plannerScope: ["unclear" as const],
    plannerStance: "open" as const,
    plannerClusters: [],
    plannerOpenQuestions: ["Thema selbst wählen oder später erneut prüfen."],
    shortSummary: "Vorläufiger Fallback aktiv.",
    topicCandidates: [],
    clusterCandidates: [],
    scopeCandidates: ["unclear" as const],
    stance: "open" as const,
    openQuestions: ["Thema selbst wählen oder später erneut prüfen."],
    graphSearchTerms: [],
    materialSignals: [],
    recommendedLane: "standard" as const,
    providerPlan: {
      lane: "standard" as const,
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
    plannerDegraded: true,
    degradedReason: "timeout" as const,
    plannerDegradedReason: "timeout" as const,
    qualityStatus: "failed" as const,
    qualityIssues: ["technical_fallback_only"],
    providerCallAttempted: true,
    providerCallSucceeded: false,
    plannerDebug: {
      attemptedProvider: "openai" as const,
      usedProvider: "none" as const,
      providerAvailable: true,
      providerErrorCode: null,
      providerErrorMessage: "timeout",
      errorMessage: "timeout",
      rawPayloadValid: false,
      rawTextValid: false,
      normalizedPayloadValid: false,
      qualityGatePassed: false,
    },
  };
}

function buildStandardResult(): CreateIntelligentFollowupResult {
  return {
    understanding: {
      summary: "Der Beitrag verbindet sichere Schulwege, klare Regeln und eine belastbare Finanzierung.",
      dossierContext: "Verkehr",
      categories: [{ id: "hint", label: "Hinweis", confidence: "high" }],
      topics: [
        { id: "verkehr", label: "Verkehr", confidence: "high" },
        { id: "sicherheit", label: "Sicherheit/Rechtsstaat", confidence: "medium" },
        { id: "finanzen", label: "Kommunale Finanzen", confidence: "medium" },
      ],
      statements: [
        {
          id: "statement-1",
          text: "Vor der Schule fehlen sichere Querungen und klare Tempo-30-Kontrollen.",
          kind: "demand",
          stance: "pro",
          confidence: "high",
        },
      ],
      scopes: ["district"],
      confidence: "high",
    },
    suggestions: [
      {
        id: "dossier-auto",
        kind: "dossier",
        title: "Sichere Schulwege",
        reason: "Das Thema passt zu einem bestehenden Arbeitsstand.",
        confidence: "high",
        href: "/dossier?topic=schulwege",
        requiresConfirmation: true,
      },
    ],
    sourceText:
      "Verkehr rund um die Schule ist unsicher, Regeln werden missachtet und die Finanzierung ist unklar.",
    generatedAt: "2026-07-15T10:00:00.000Z",
    meta: {
      planner: buildSpecificPlanner(),
      graphMatch: buildGraphMatch(),
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
    },
  };
}

function buildDegradedResult(): CreateIntelligentFollowupResult {
  return {
    understanding: {
      summary: "Mehrere Themenstränge sind vorhanden, die Einordnung bleibt vorläufig.",
      categories: [{ id: "claim", label: "Aussage", confidence: "medium" }],
      topics: [{ id: "placeholder", label: "Öffentliches Anliegen mit Klärungsbedarf", confidence: "low" }],
      statements: [
        {
          id: "statement-1",
          text: "In Rahnsdorf fehlen sichere Querungen an Kita, Straße und Haltestelle. Radfahrer und Familien kommen schlecht durch, Bauprojekte verdrängen Grünflächen und der Haushalt ist knapp.",
          kind: "claim",
          stance: "open",
          confidence: "medium",
        },
      ],
      scopes: ["unclear"],
      openQuestion: "Was soll zuerst bearbeitet werden?",
      confidence: "medium",
    },
    suggestions: [],
    sourceText:
      "In Rahnsdorf fehlen sichere Querungen an Kita, Straße und Haltestelle. Radfahrer und Familien kommen schlecht durch, Bauprojekte verdrängen Grünflächen und der Haushalt ist knapp.",
    generatedAt: "2026-07-15T10:05:00.000Z",
    meta: {
      planner: buildDegradedPlanner(),
      graphMatch: buildGraphMatch(),
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
    },
  };
}

function Harness(props: { result: CreateIntelligentFollowupResult }) {
  const [selectedPrimaryTopic, setSelectedPrimaryTopic] = React.useState<string | null>(null);
  const [parkedTopicLabels, setParkedTopicLabels] = React.useState<string[]>([]);
  const [composerMode, setComposerMode] = React.useState<"default" | "edit" | "source" | "manual_topic">(
    "default",
  );
  const [confirmed, setConfirmed] = React.useState(false);
  const [saveCount, setSaveCount] = React.useState(0);
  const [sourceCount, setSourceCount] = React.useState(0);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [reviewRequestMessage, setReviewRequestMessage] = React.useState<string | null>(null);

  return (
    <div>
      <CreateVisualFollowup
        result={props.result}
        actionNotice={actionNotice}
        isConfirmed={confirmed}
        selectedPrimaryTopic={selectedPrimaryTopic}
        parkedTopicLabels={parkedTopicLabels}
        composerMode={composerMode}
        reviewRequestMessage={reviewRequestMessage}
        factcheckMessage={
          composerMode === "source"
            ? "Quellenmodus aktiv. Eine externe Prüfung startet erst nach Bestätigung."
            : null
        }
        onConfirm={() => {
          setSelectedPrimaryTopic((current) => current ?? "Verkehr");
          setParkedTopicLabels((current) => current.filter((topic) => topic !== "Verkehr"));
          setConfirmed(true);
          setComposerMode("default");
          setActionNotice("Hauptthema „Verkehr“ gewählt.");
        }}
        onSelectPrimaryTopic={(topicLabel) => {
          setSelectedPrimaryTopic(topicLabel);
          setParkedTopicLabels((current) => current.filter((topic) => topic !== topicLabel));
          setConfirmed(true);
          setComposerMode("default");
          setActionNotice(`Hauptthema „${topicLabel}“ gewählt.`);
        }}
        onParkTopic={(topicLabel) => {
          setParkedTopicLabels((current) => (current.includes(topicLabel) ? current : [...current, topicLabel]));
          setSelectedPrimaryTopic((current) => (current === topicLabel ? null : current));
          setConfirmed(false);
          setComposerMode("default");
          setActionNotice(`„${topicLabel}“ wurde als Zweig geparkt.`);
        }}
        onEdit={() => {
          setComposerMode("edit");
          setActionNotice("Weiterarbeit aktiv. Ergänze unten, was geschärft oder geändert werden soll.");
        }}
        onOpenManualTopicChooser={() => {
          setComposerMode("manual_topic");
          setActionNotice("Themenwahl geöffnet.");
        }}
        onPrepareSubmission={() => {}}
        onPrepareAnlassraum={() => {
          if (!selectedPrimaryTopic) {
            setActionNotice("Bitte wähle zuerst ein Hauptthema, bevor wir einen Anlassraum vorbereiten.");
            return;
          }
          setActionNotice(`Anlassraum für „${selectedPrimaryTopic}“ wird vorbereitet.`);
        }}
        onOpenDossierAppend={() => {}}
        onOpenDossierCreate={() => {}}
        onPrepareVote={() => {}}
        onRequestEditorialReview={() => {}}
        onStartOptionalService={() => {
          setComposerMode("source");
          setSourceCount((count) => count + 1);
          setActionNotice("Quellenmodus aktiv. Eine externe Prüfung startet erst nach Bestätigung.");
        }}
        onRetryPlanner={() => {}}
        onSaveOnly={() => {
          setSaveCount((count) => count + 1);
          setReviewRequestMessage("Entwurf gespeichert. Noch nicht veröffentlicht.");
          setActionNotice("Entwurf gespeichert. Noch nicht veröffentlicht.");
        }}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />
      <div data-testid="selected-topic">{selectedPrimaryTopic ?? ""}</div>
      <div data-testid="parked-topics">{parkedTopicLabels.join("|")}</div>
      <div data-testid="composer-mode">{composerMode}</div>
      <div data-testid="save-count">{String(saveCount)}</div>
      <div data-testid="source-count">{String(sourceCount)}</div>
    </div>
  );
}

describe("create workspace actions interaction", () => {
  it("marks the chosen primary topic, parks branches and drives follow-up actions locally", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness result={buildStandardResult()} />);

    const firstBranchCard = container.querySelector("[data-create-topic-branch-card]");
    expect(firstBranchCard).not.toBeNull();
    if (!firstBranchCard) return;

    await user.click(within(firstBranchCard).getByRole("button", { name: "Hauptthema wählen" }));

    const selectedCard = container.querySelector('[data-selected-primary-topic="true"]');
    expect(selectedCard).not.toBeNull();
    expect(screen.getByTestId("selected-topic").textContent).toBe("Verkehr");
    expect(screen.queryByText("Hauptthema „Verkehr“ gewählt.")).not.toBeNull();

    const allBranchCards = Array.from(container.querySelectorAll("[data-create-topic-branch-card]"));
    expect(allBranchCards.length).toBeGreaterThan(1);
    const secondBranchCard = allBranchCards[1];
    if (!secondBranchCard) return;

    await user.click(within(secondBranchCard).getByRole("button", { name: "Als Zweig parken" }));
    expect(screen.getByTestId("parked-topics").textContent).toContain("Sicherheit/Rechtsstaat");
    expect(screen.queryByText("„Sicherheit/Rechtsstaat“ wurde als Zweig geparkt.")).not.toBeNull();
    expect(
      secondBranchCard.getAttribute("data-parked-topic") === "true" ||
      within(secondBranchCard).queryByRole("button", { name: "Als Zweig geparkt" }) !== null,
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: "Beitrag weiterentwickeln" }));
    expect(screen.queryByText("Weiterarbeit aktiv")).not.toBeNull();
    expect(screen.getByTestId("composer-mode").textContent).toBe("edit");

    await user.click(screen.getByRole("button", { name: "Quellen ergänzen" }));
    expect(screen.queryByText("Quellenmodus aktiv")).not.toBeNull();
    expect(screen.getByTestId("composer-mode").textContent).toBe("source");
    expect(screen.getByTestId("source-count").textContent).toBe("1");
    expect(screen.queryAllByText(/erst nach Bestätigung/i).length).toBeGreaterThan(0);
  });

  it("keeps retry behind details and opens the manual topic chooser on demand", async () => {
    const user = userEvent.setup();
    render(<Harness result={buildDegradedResult()} />);

    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).toBeNull();

    const detailButtons = screen.getAllByRole("button", { name: "Details ansehen" });
    await user.click(detailButtons[0]);

    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Thema selbst wählen" }));

    expect(screen.queryByPlaceholderText("Eigenes Hauptthema benennen")).not.toBeNull();
    expect(screen.getByTestId("composer-mode").textContent).toBe("manual_topic");
  });

  it("shows deterministic civic fallback branches and keeps retry out of the main CTA group", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness result={buildDegradedResult()} />);

    const branchGrids = Array.from(container.querySelectorAll("[data-create-topic-branches]"));
    const branchGrid =
      branchGrids.find((node) => node.textContent?.includes("Verkehrssicherheit")) ??
      branchGrids[branchGrids.length - 1] ??
      null;
    expect(branchGrid).not.toBeNull();
    if (!branchGrid) return;

    expect(branchGrid.textContent ?? "").toContain("Verkehrssicherheit");
    expect(branchGrid.textContent ?? "").toContain("Kita-/Schulweg & Barrierefreiheit");
    expect(branchGrid.textContent ?? "").toContain("Stadtplanung & Finanzierung");
    expect(branchGrid.textContent ?? "").not.toContain("Wohnen und Genehmigungen");
    expect(branchGrid.textContent ?? "").not.toContain("Bildung, Integration und Sicherheit");
    expect(screen.queryAllByRole("button", { name: /Hauptthema wählen/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Beitrag weiterentwickeln" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Quellen ergänzen" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Entwurf speichern" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Entwurf speichern" }));
    expect(screen.getByTestId("save-count").textContent).toBe("1");
    expect(screen.queryAllByText("Entwurf gespeichert. Noch nicht veröffentlicht.").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Anlassraum vorbereiten" }));
    expect(
      screen.queryByText("Bitte wähle zuerst ein Hauptthema, bevor wir einen Anlassraum vorbereiten."),
    ).not.toBeNull();
  });
});
