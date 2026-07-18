/** @vitest-environment jsdom */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
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

function buildOverflowResult(): CreateIntelligentFollowupResult {
  const base = buildStandardResult();
  return {
    ...base,
    understanding: {
      ...base.understanding,
      summary:
        "Der Beitrag verbindet abendlichen ÖPNV, Anschlussmobilität und den Umbau der Hauptstraße mit Parkraum- und Radverkehrsfragen.",
      dossierContext: "Mobilität und Straßenumbau im Bezirk",
      topics: [
        { id: "wohnen", label: "Wohnen", confidence: "medium" },
        { id: "verkehr", label: "Verkehr", confidence: "high" },
        { id: "bildung", label: "Bildung", confidence: "low" },
        { id: "integration", label: "Migration/Integration", confidence: "low" },
      ],
      statements: [
        {
          id: "statement-1",
          text: "Bei uns im Bezirk fährt der Bus abends nur noch alle 30 Minuten.",
          kind: "claim",
          stance: "open",
          confidence: "high",
        },
        {
          id: "statement-2",
          text: "Dadurch verpassen viele Beschäftigte den Anschluss an die S-Bahn.",
          kind: "claim",
          stance: "open",
          confidence: "high",
        },
        {
          id: "statement-3",
          text: "Gleichzeitig soll die Hauptstraße umgebaut werden, aber niemand weiß, ob dabei Parkplätze wegfallen oder neue Radwege entstehen.",
          kind: "claim",
          stance: "open",
          confidence: "high",
        },
      ],
    },
    sourceText:
      "Bei uns im Bezirk fährt der Bus abends nur noch alle 30 Minuten. Dadurch verpassen viele Beschäftigte den Anschluss an die S-Bahn. Gleichzeitig soll die Hauptstraße umgebaut werden, aber niemand weiß, ob dabei Parkplätze wegfallen oder neue Radwege entstehen.",
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

function Harness(props: {
  result: CreateIntelligentFollowupResult;
  linkText?: string;
  previewAllTopics?: boolean;
}) {
  const composerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [activeTopicLabel, setActiveTopicLabel] = React.useState<string | null>(null);
  const [selectedPrimaryTopic, setSelectedPrimaryTopic] = React.useState<string | null>(null);
  const [groupedTopicLabels, setGroupedTopicLabels] = React.useState<string[]>([]);
  const [parkedTopicLabels, setParkedTopicLabels] = React.useState<string[]>([]);
  const [showExpandedTopicPreview, setShowExpandedTopicPreview] = React.useState(false);
  const [topicExpansionDecision, setTopicExpansionDecision] = React.useState<
    "idle" | "expanded" | "compact" | "link" | "later"
  >("idle");
  const [composerMode, setComposerMode] = React.useState<"default" | "edit" | "source" | "manual_topic">(
    "default",
  );
  const [confirmed, setConfirmed] = React.useState(false);
  const [saveCount, setSaveCount] = React.useState(0);
  const [sourceCount, setSourceCount] = React.useState(0);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [reviewRequestMessage, setReviewRequestMessage] = React.useState<string | null>(null);
  const linkDetection = React.useMemo(
    () => detectCreateLinkIntake(props.linkText ?? props.result.sourceText),
    [props.linkText, props.result.sourceText],
  );
  const composerPlaceholder =
    composerMode === "source"
      ? "Füge eine Quelle, einen Beschluss oder ein Beispiel hinzu …"
      : !confirmed
        ? "Möchtest du ein Thema ändern, ergänzen oder zusammenführen?"
        : composerMode === "edit"
          ? "Welche Aussage möchtest du schärfen?"
          : composerMode === "manual_topic"
            ? "Möchtest du ein Thema ändern, ergänzen oder zusammenführen?"
            : "Welche Aussage möchtest du schärfen?";
  const nextStepLabel =
    !confirmed
      ? "Themenstruktur bestätigen"
      : composerMode === "source"
      ? "Quellen prüfen"
      : composerMode === "manual_topic"
        ? "Themen ändern"
        : groupedTopicLabels.length > 1
          ? "Themen gemeinsam weiterführen"
          : selectedPrimaryTopic
            ? "Aussage schärfen"
            : "Aussage schärfen";

  React.useEffect(() => {
    if (composerMode === "default") return;
    composerRef.current?.focus();
  }, [composerMode]);

  return (
    <div>
      <CreateVisualFollowup
        result={props.result}
        actionNotice={actionNotice}
        isConfirmed={confirmed}
        activeTopicLabel={activeTopicLabel}
        selectedPrimaryTopic={selectedPrimaryTopic}
        groupedTopicLabels={groupedTopicLabels}
        parkedTopicLabels={parkedTopicLabels}
        composerMode={composerMode}
        reviewRequestMessage={reviewRequestMessage}
        factcheckMessage={
          composerMode === "source"
            ? "Quellenmodus aktiv. Eine externe Prüfung startet erst nach Bestätigung."
            : null
        }
        linkDetection={linkDetection}
        compactBranchLimit={3}
        expandedBranchLimit={5}
        showExpandedTopicPreview={showExpandedTopicPreview}
        topicExpansionDecision={topicExpansionDecision}
        expandedTopicAccess={{
          canPreviewAllTopics: props.previewAllTopics ?? false,
          isPrivilegedPreview: false,
          costState: props.previewAllTopics ? "uses_search_credit" : "addon_required",
        }}
        onConfirm={() => {
          setSelectedPrimaryTopic((current) => current ?? activeTopicLabel ?? "Verkehr");
          setParkedTopicLabels((current) => current.filter((topic) => topic !== "Verkehr"));
          setGroupedTopicLabels([]);
          setConfirmed(true);
          setComposerMode("default");
          setActionNotice("Themenstruktur bestätigt.");
        }}
        onFocusTopic={(topicLabel) => {
          setActiveTopicLabel(topicLabel);
          setComposerMode("default");
          setActionNotice(`${topicLabel} wurde fokussiert.`);
        }}
        onSelectPrimaryTopic={(topicLabel) => {
          setActiveTopicLabel(topicLabel);
          setSelectedPrimaryTopic(topicLabel);
          setGroupedTopicLabels([]);
          setParkedTopicLabels((current) => current.filter((topic) => topic !== topicLabel));
          setConfirmed(true);
          setComposerMode("default");
          setActionNotice(`${topicLabel} ist jetzt dein Fokus.`);
        }}
        onGroupTopics={(topicLabels) => {
          setGroupedTopicLabels(topicLabels);
          setConfirmed(false);
          setComposerMode("default");
          setActionNotice(`${topicLabels.join(", ")} werden gemeinsam weitergeführt.`);
        }}
        onSeparateTopics={() => {
          setGroupedTopicLabels([]);
          setConfirmed(false);
          setComposerMode("default");
          setActionNotice("Die Themen werden wieder getrennt weitergeführt.");
        }}
        onParkTopic={(topicLabel) => {
          setParkedTopicLabels((current) => (current.includes(topicLabel) ? current : [...current, topicLabel]));
          setGroupedTopicLabels((current) => current.filter((topic) => topic !== topicLabel));
          setActiveTopicLabel((current) => (current === topicLabel ? null : current));
          setSelectedPrimaryTopic((current) => (current === topicLabel ? null : current));
          setConfirmed(false);
          setComposerMode("default");
          setActionNotice(`${topicLabel} wurde geparkt.`);
        }}
        onEdit={() => {
          setComposerMode("edit");
          setActionNotice("Aussage schärfen geöffnet.");
        }}
        onOpenManualTopicChooser={() => {
          setComposerMode("manual_topic");
          setActionNotice("Themen ändern geöffnet.");
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
          setActionNotice("Quellenmodus geöffnet.");
        }}
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
        onPrepareLinkReview={() => {
          setComposerMode("source");
          setTopicExpansionDecision("link");
          setSourceCount((count) => count + 1);
          setActionNotice("Quellenprüfung vorbereitet. Sie startet erst nach Bestätigung.");
        }}
        onDeferExpandedReview={() => {
          setShowExpandedTopicPreview(false);
          setTopicExpansionDecision("later");
          setActionNotice("Vollständige Auswertung bleibt vorerst zurückgestellt.");
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
      <div data-testid="composer-placeholder">{composerPlaceholder}</div>
      <div data-testid="next-step-label">{nextStepLabel}</div>
      <div data-testid="save-count">{String(saveCount)}</div>
      <div data-testid="source-count">{String(sourceCount)}</div>
      <div data-testid="topic-expansion-decision">{topicExpansionDecision}</div>
      <textarea ref={composerRef} placeholder={composerPlaceholder} data-testid="composer-input" />
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

    await user.click(within(firstBranchCard).getByRole("button", { name: /Verkehr/ }));

    const focusedCard = container.querySelector('[data-active-topic="true"]');
    expect(focusedCard).not.toBeNull();
    expect(screen.queryByText("Du schaust Thema 1: Verkehr.")).not.toBeNull();
    expect(screen.getByTestId("next-step-label").textContent).toBe("Themenstruktur bestätigen");

    await user.click(screen.getAllByRole("button", { name: "Themenstruktur bestätigen" })[0]!);
    expect(screen.getByTestId("selected-topic").textContent).toBe("Verkehr");
    expect(screen.queryAllByText("Themenstruktur bestätigt.").length).toBeGreaterThan(0);
    expect(screen.getByTestId("next-step-label").textContent).toBe("Aussage schärfen");

    const allBranchCards = Array.from(container.querySelectorAll("[data-create-topic-branch-card]"));
    expect(allBranchCards.length).toBeGreaterThan(1);
    const secondBranchCard = allBranchCards[1];
    if (!secondBranchCard) return;

    await user.click(within(secondBranchCard).getByRole("button", { name: "Thema parken" }));
    expect(screen.getByTestId("parked-topics").textContent).toContain("Sicherheit/Rechtsstaat");
    expect(screen.queryAllByText("Sicherheit/Rechtsstaat wurde geparkt.").length).toBeGreaterThan(0);
    expect(
      secondBranchCard.getAttribute("data-parked-topic") === "true" ||
      within(secondBranchCard).queryByText("Geparkt") !== null,
    ).toBe(true);
    expect(screen.getByTestId("next-step-label").textContent).toBe("Themenstruktur bestätigen");

    await user.click(screen.getAllByRole("button", { name: "Themenstruktur bestätigen" })[0]!);
    expect(screen.getByTestId("next-step-label").textContent).toBe("Aussage schärfen");

    await user.click(screen.getAllByRole("button", { name: "Aussage schärfen" })[0]!);
    expect(screen.queryByText("Aussage schärfen aktiv")).not.toBeNull();
    expect(screen.getByTestId("composer-mode").textContent).toBe("edit");
    expect(screen.getByTestId("composer-placeholder").textContent).toBe("Welche Aussage möchtest du schärfen?");
    expect(document.activeElement).toBe(screen.getByTestId("composer-input"));

    await user.click(screen.getAllByRole("button", { name: "Quelle ergänzen" })[0]!);
    expect(screen.queryByText("Quellenmodus geöffnet")).not.toBeNull();
    expect(screen.getByTestId("composer-mode").textContent).toBe("source");
    expect(screen.getByTestId("composer-placeholder").textContent).toBe("Füge eine Quelle, einen Beschluss oder ein Beispiel hinzu …");
    expect(screen.getByTestId("next-step-label").textContent).toBe("Quellen prüfen");
    expect(screen.getByTestId("source-count").textContent).toBe("1");
    expect(document.activeElement).toBe(screen.getByTestId("composer-input"));
  });

  it("surfaces link and topic-overflow decisions without auto-starting external search", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(
      <Harness
        result={buildOverflowResult()}
        linkText="https://example.com/artikel Mehr Themen bitte prüfen"
        previewAllTopics
      />,
    );

    expect(container.querySelectorAll("[data-create-pipeline-rail]")).toHaveLength(1);
    expect(screen.queryByText("Ich habe 4 Themen erkannt. 3 zeige ich dir kompakt.")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Weiteres Thema anzeigen" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Nur mit diesen 3 weiterarbeiten" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Quellenmodus vorbereiten" })).not.toBeNull();
    expect(container.textContent ?? "").toContain("ÖPNV und Mobilität");
    expect(container.textContent ?? "").toContain("Straßenraum und Radverkehr");
    expect(container.textContent ?? "").toContain("Parkraum und kommunale Planung");
    expect(container.textContent ?? "").not.toContain("Wohnen und Genehmigungen");
    expect(container.textContent ?? "").not.toContain("Bildung, Integration und Sicherheit");
    expect(container.querySelectorAll("[data-create-topic-branch-card]")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Quellenmodus vorbereiten" }));
    expect(screen.getByTestId("topic-expansion-decision").textContent).toBe("link");
    expect(screen.getByTestId("composer-mode").textContent).toBe("source");
    expect(screen.getByTestId("source-count").textContent).toBe("1");
    expect(screen.queryByText("Quellenprüfung vorbereitet. Sie startet erst nach Bestätigung.")).not.toBeNull();

    unmount();

    const expandedRender = render(
      <Harness
        result={buildOverflowResult()}
        linkText="https://example.com/artikel Mehr Themen bitte prüfen"
        previewAllTopics
      />,
    );

    await user.click(screen.getByRole("button", { name: "Weiteres Thema anzeigen" }));
    expect(screen.getByTestId("topic-expansion-decision").textContent).toBe("expanded");
    expect(screen.queryByText("Das weitere Thema wird jetzt angezeigt.")).not.toBeNull();
    expect(expandedRender.container.querySelectorAll("[data-create-topic-branch-card]")).toHaveLength(4);
    expect(expandedRender.container.textContent ?? "").toContain("Pendler- und Anschlussmobilität");
  });

  it("keeps retry behind details and opens the manual topic chooser on demand", async () => {
    const user = userEvent.setup();
    render(<Harness result={buildDegradedResult()} />);

    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).toBeNull();

    const detailButtons = screen.getAllByRole("button", { name: "Details & Transparenz" });
    await user.click(detailButtons[0]);

    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Themen ändern" }));

    expect(screen.queryByPlaceholderText("Eigenes Hauptthema benennen")).not.toBeNull();
    expect(screen.getByTestId("composer-mode").textContent).toBe("manual_topic");

    await user.click(detailButtons[0]);
    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).toBeNull();
  });

  it("keeps details closed by default in the normal result flow", async () => {
    const user = userEvent.setup();
    render(<Harness result={buildStandardResult()} />);

    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).toBeNull();

    const detailButtons = screen.getAllByRole("button", { name: "Details & Transparenz" });
    await user.click(detailButtons[0]);

    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).toBeNull();
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
    expect(screen.queryByRole("button", { name: "Themenstruktur bestätigen" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Themen ändern" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Aussage schärfen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Quelle ergänzen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Entwurf speichern" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Einordnung erneut versuchen" })).toBeNull();

    const firstBranchCard = container.querySelector("[data-create-topic-branch-card]");
    expect(firstBranchCard).not.toBeNull();
    if (!firstBranchCard) return;

    const trafficBranchButton = within(firstBranchCard).getByRole("button", { name: /Verkehrssicherheit/ });
    await user.click(trafficBranchButton);
    expect(firstBranchCard.getAttribute("data-active-topic")).toBe("true");

    await user.click(screen.getAllByRole("button", { name: "Themenstruktur bestätigen" })[0]!);
    expect(screen.getByTestId("selected-topic").textContent).toBe("Verkehrssicherheit");
    expect(screen.queryAllByText("Themenstruktur bestätigt.").length).toBeGreaterThan(0);
    expect(screen.getByTestId("next-step-label").textContent).toBe("Aussage schärfen");
  });

  it("keeps only one primary CTA before the theme structure was confirmed", () => {
    render(<Harness result={buildOverflowResult()} />);

    const primaryActions = screen.getAllByRole("button", { name: "Themenstruktur bestätigen" });
    expect(primaryActions).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Aussage schärfen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Quelle ergänzen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Entwurf speichern" })).toBeNull();
    expect(screen.getByTestId("composer-placeholder").textContent).toBe(
      "Möchtest du ein Thema ändern, ergänzen oder zusammenführen?",
    );
  });
});
