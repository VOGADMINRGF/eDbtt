import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import CreateVisualFollowup, {
  CreateStructureOverview,
  deriveCreateStructureOverviewMetrics,
} from "@/features/create/CreateVisualFollowup";

describe("create planner degraded ui contract", () => {
  it("does not claim finished understanding when the planner is degraded or generic", () => {
    const degradedResult = {
      understanding: {
        summary: "Der Beitrag berührt mehrere politische Themen gleichzeitig.",
        categories: [{ id: "claim", label: "Aussage", confidence: "medium" as const }],
        topics: [{ id: "topic-1", label: "Öffentliches Anliegen mit Klärungsbedarf", confidence: "low" as const }],
        statements: [
          {
            id: "statement-1",
            text: "Aussage",
            kind: "claim" as const,
            stance: "open" as const,
            confidence: "medium" as const,
          },
        ],
        scopes: ["unclear" as const],
        openQuestion: "Was genau soll zuerst bearbeitet werden?",
        confidence: "medium" as const,
      },
      suggestions: [],
      sourceText: "Längerer Mehrthemenbeitrag.",
      generatedAt: "2026-05-11T10:00:00.000Z",
      degraded: false,
      degradedReason: null,
      meta: {
        planner: {
          source: "heuristic_fallback" as const,
          plannerSource: "heuristic_fallback" as const,
          plannerProvider: "openai" as const,
          plannerRole: "planner_only" as const,
          plannerTopic: "GPT-Einordnung nicht abgeschlossen",
          plannerCore: "Die schnelle GPT-Einordnung konnte nicht abgeschlossen werden.",
          plannerScope: ["unclear" as const],
          plannerStance: "open" as const,
          plannerClusters: [],
          plannerOpenQuestions: ["Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen."],
          shortSummary: "Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen.",
          topicCandidates: [],
          clusterCandidates: [],
          scopeCandidates: ["unclear" as const],
          stance: "open" as const,
          openQuestions: ["Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen."],
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
            nonMutative: true,
            canPublish: false,
            canSave: false,
            canMerge: false,
            canDeepSearch: false,
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
            providerErrorMessage: "create_planner_timeout_after_4000ms",
            errorMessage: "create_planner_timeout_after_4000ms",
            rawPayloadValid: false,
            rawTextValid: false,
            normalizedPayloadValid: false,
            qualityGatePassed: false,
          },
        },
        graphMatch: {
          stage: "after_structure" as const,
          prepared: false,
          requiresConfirmation: true,
          searchTerms: [],
          matches: [],
          matchedTopics: [],
          matchedDossiers: [],
          matchedClaims: [],
          matchedAnlassraeume: [],
          matchedVotes: [],
          shouldCreateNewTopic: false,
        },
        researchUsed: "none" as const,
        researchProvider: null,
        deepSearchUsed: false as const,
      },
    };
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={degradedResult}
        onConfirm={() => {}}
        onEdit={() => {}}
        onPrepareSubmission={() => {}}
        onPrepareAnlassraum={() => {}}
        onOpenDossierAppend={() => {}}
        onOpenDossierCreate={() => {}}
        onPrepareVote={() => {}}
        onRequestEditorialReview={() => {}}
        onStartOptionalService={() => {}}
        onRetryPlanner={() => {}}
        onSaveOnly={() => {}}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />,
    );

    expect(html).toContain("Automatische Einordnung nicht abgeschlossen");
    expect(html).toContain("Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen.");
    expect(html).toContain("Einordnung erneut versuchen");
    expect(html).toContain("Details ansehen");
    expect(html).toContain("Hauptthema wählen");
    expect(html).toContain("Beitrag weiterentwickeln");
    expect(html).toContain("Entwurf speichern");
    expect(html).toContain("Anlassraum vorbereiten");
    expect(html).toContain("Thema selbst wählen");
    expect(html).toContain("So kannst du weitermachen");
    expect(html).toContain("Keine automatische Veröffentlichung. Keine automatische Kostenbuchung.");
    expect(html).toContain("Die automatische Einordnung hat nicht rechtzeitig geantwortet.");
    expect(html).not.toContain("Ich sehe einen gemeinsamen Kern.");
    expect(html).not.toContain("Kern</p><p class=\"text-base font-semibold text-[rgb(var(--fg))]\">Aussage");
    expect(html).not.toContain("Direkt Entwurf");
    expect(html).not.toContain("Faktencheck anfragen");
    expect(html).not.toContain("KI-Suche aktivieren");
    expect(html).not.toContain("Bericht an die Redaktion senden");
    expect(html).not.toContain("Timeout");
    expect(html.indexOf("Hauptthema wählen")).toBeLessThan(html.lastIndexOf("Einordnung erneut versuchen"));

    const metrics = deriveCreateStructureOverviewMetrics({ result: degradedResult, isConfirmed: false });
    expect(metrics).toEqual({
      prioritiesCount: 0,
      clustersCount: 0,
      questionsCount: 0,
      nextStepsCount: 0,
    });

    const overviewHtml = renderToStaticMarkup(
      <CreateStructureOverview locale="de" showOpenLabels prioritiesCount={0} clustersCount={0} questionsCount={0} nextStepsCount={0} />,
    );
    expect((overviewHtml.match(/>Offen<\/span>/g) ?? []).length).toBe(4);
    expect((overviewHtml.match(/>offen<\/span>/g) ?? []).length).toBe(4);
    expect(overviewHtml).not.toContain(">neu</span>");
  });
});
