import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";

describe("create planner degraded ui contract", () => {
  it("does not claim finished understanding when the planner is degraded or generic", () => {
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={{
          understanding: {
            summary: "Der Beitrag berührt mehrere politische Themen gleichzeitig.",
            categories: [{ id: "claim", label: "Aussage", confidence: "medium" }],
            topics: [{ id: "topic-1", label: "Öffentliches Anliegen mit Klärungsbedarf", confidence: "low" }],
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
          sourceText: "Längerer Mehrthemenbeitrag.",
          generatedAt: "2026-05-11T10:00:00.000Z",
          degraded: false,
          degradedReason: null,
          meta: {
            planner: {
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
              shortSummary: "Der Beitrag berührt mehrere politische Themen gleichzeitig.",
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

    expect(html).toContain("Wir konnten dein Anliegen noch nicht sicher einordnen.");
    expect(html).toContain("Du kannst trotzdem weitermachen.");
    expect(html).toContain("Wähle selbst ein Thema oder bereite den Beitrag zur Prüfung vor.");
    expect(html).toContain("Text sortieren lassen");
    expect(html).toContain("Beitrag vorbereiten");
    expect(html).toContain("Anlassraum vorbereiten");
    expect(html).toContain("Thema selbst wählen");
    expect(html).toContain("So kannst du weitermachen");
    expect(html).toContain("Keine automatische Veröffentlichung. Keine automatische Kostenbuchung.");
    expect(html.match(/Wir konnten dein Anliegen noch nicht sicher einordnen\./g)?.length ?? 0).toBe(1);
    expect(html).not.toContain("Haben wir dich richtig verstanden?");
    expect(html).not.toContain("Kern</p><p class=\"text-base font-semibold text-[rgb(var(--fg))]\">Aussage");
    expect(html).not.toContain("Öffentliches Anliegen mit Klärungsbedarf");
    expect(html).not.toContain("Ja, so einreichen");
    expect(html).not.toContain("Faktencheck anfragen");
    expect(html).not.toContain("KI-Suche aktivieren");
    expect(html).not.toContain("Bericht an die Redaktion senden");
    expect(html).not.toContain("Timeout");
  });
});
