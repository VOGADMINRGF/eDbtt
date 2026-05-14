import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";

describe("create degraded followup actions contract", () => {
  it("replaces the normal understanding summary with degraded planner actions", () => {
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={{
          understanding: {
            summary: "Der Beitrag berührt mehrere mögliche Themen rund um Gleichberechtigung und Unternehmensregeln.",
            categories: [{ id: "claim", label: "Aussage", confidence: "medium" }],
            topics: [{ id: "topic-1", label: "Öffentliches Anliegen", confidence: "low" }],
            statements: [
              {
                id: "statement-1",
                text: "Aussage",
                kind: "claim",
                stance: "open",
                confidence: "medium",
              },
            ],
            scopes: ["unclear"],
            openQuestion: "Was genau soll zuerst bearbeitet werden?",
            confidence: "medium",
          },
          suggestions: [],
          sourceText:
            "ich bin gegen frauenquote aber für mehr gleichberechtigung. gibt es eine frauenquote müsste es auch quoten von anderen minderheiten geben, das kann nicht richtig und wirtschaftlich für ein unternehmen sein.",
          generatedAt: "2026-05-12T08:00:00.000Z",
          degraded: false,
          degradedReason: null,
          meta: {
            planner: {
              source: "heuristic_fallback",
              plannerSource: "heuristic_fallback",
              plannerProvider: "local_fallback",
              plannerRole: "planner_only",
              plannerTopic: "Öffentliches Anliegen",
              plannerCore: "Aussage",
              plannerScope: ["unclear"],
              plannerStance: "open",
              plannerClusters: [],
              plannerOpenQuestions: ["Was genau soll geklärt, verändert oder vorbereitet werden?"],
              shortSummary: "Mehrere mögliche Themen sind enthalten.",
              topicCandidates: ["Öffentliches Anliegen"],
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
                usedProvider: "heuristic_fallback",
                providerAvailable: true,
                providerErrorCode: null,
                providerErrorMessage: "quality gate failed",
                errorMessage: "quality gate failed",
                rawPayloadValid: true,
                rawTextValid: true,
                normalizedPayloadValid: true,
                qualityGatePassed: false,
              },
            },
            graphMatch: {
              stage: "after_structure",
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
            researchUsed: "none",
            researchProvider: null,
            deepSearchUsed: false,
          },
        }}
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

    expect(html).toContain("Wir konnten deinen Beitrag noch nicht exakt zuordnen.");
    expect(html).toContain("KI-Suche aktivieren");
    expect(html).toContain("Bericht an die Redaktion senden");
    expect(html).toContain("Thema selbst auswählen");
    expect(html).toContain("Mögliche Startpunkte");
    expect(html).toContain("Gleichberechtigung und Frauenquote");
    expect(html).not.toContain("Wir haben deinen Beitrag grob verstanden.");
    expect(html).not.toContain("Öffentliches Anliegen</p>");
    expect(html).not.toContain("Kern</p>");
    expect(html).not.toContain("Beitrag einreichen");
    expect(html).not.toContain("Faktencheck anfragen");
  });
});
