import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
              source: "planner_unavailable",
              plannerSource: "planner_unavailable",
              plannerProvider: "openai",
              plannerRole: "planner_only",
              plannerTopic: "GPT-Einordnung nicht abgeschlossen",
              plannerCore: "Die schnelle GPT-Einordnung konnte nicht abgeschlossen werden.",
              plannerScope: ["unclear"],
              plannerStance: "open",
              plannerClusters: [],
              plannerOpenQuestions: ["Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen."],
              shortSummary: "Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen.",
              topicCandidates: [],
              clusterCandidates: [],
              scopeCandidates: ["unclear"],
              stance: "open",
              openQuestions: ["Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen."],
              graphSearchTerms: [],
              materialSignals: [],
              recommendedLane: "standard",
              providerPlan: {
                lane: "standard",
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
              plannerDegraded: true,
              degradedReason: "timeout",
              plannerDegradedReason: "timeout",
              qualityStatus: "failed",
              qualityIssues: ["planner_unavailable"],
              providerCallAttempted: true,
              providerCallSucceeded: false,
              plannerDebug: {
                attemptedProvider: "openai",
                usedProvider: "none",
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

    expect(html).toContain("Automatische Einordnung nicht abgeschlossen");
    expect(html).toContain("Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen.");
    expect(html).toContain("GPT-Einordnung erneut versuchen");
    expect(html).toContain("Beitrag als Entwurf weiter vorbereiten");
    expect(html).toContain("Anlassraum vorbereiten");
    expect(html).toContain("Thema selbst wählen");
    expect(html).toContain("So kannst du weitermachen");
    expect(html).not.toContain("Haben wir dich richtig verstanden?");
    expect(html).not.toContain("Öffentliches Anliegen</p>");
    expect(html).not.toContain("Kern</p>");
    expect(html).not.toContain("Ja, so einreichen");
    expect(html).not.toContain("Faktencheck anfragen");
    expect(html).not.toContain("KI-Suche aktivieren");
    expect(html).not.toContain("Bericht an die Redaktion senden");
  });

  it("makes retry the primary CTA, shows a loading label, and keeps retry on the same planner_only route", () => {
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={{
          understanding: {
            summary: "Der Beitrag bleibt als Entwurf erhalten.",
            categories: [{ id: "claim", label: "Aussage", confidence: "medium" }],
            topics: [],
            statements: [
              {
                id: "statement-1",
                text: "Mehrthemenbeitrag",
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
          sourceText: "Mehrthemenbeitrag",
          generatedAt: "2026-06-03T12:00:00.000Z",
          meta: {
            planner: {
              source: "planner_unavailable",
              plannerSource: "planner_unavailable",
              plannerProvider: "openai",
              plannerRole: "planner_only",
              plannerTopic: "GPT-Einordnung nicht abgeschlossen",
              plannerCore: "Die schnelle GPT-Einordnung konnte nicht abgeschlossen werden.",
              plannerScope: ["unclear"],
              plannerStance: "open",
              plannerClusters: [],
              plannerOpenQuestions: ["Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen."],
              shortSummary: "Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen.",
              topicCandidates: [],
              clusterCandidates: [],
              scopeCandidates: ["unclear"],
              stance: "open",
              openQuestions: ["Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen."],
              graphSearchTerms: [],
              materialSignals: [],
              recommendedLane: "standard",
              providerPlan: {
                lane: "standard",
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
              plannerDegraded: true,
              degradedReason: "timeout",
              plannerDegradedReason: "timeout",
              qualityStatus: "failed",
              qualityIssues: ["planner_unavailable"],
              providerCallAttempted: true,
              providerCallSucceeded: false,
              plannerDebug: {
                attemptedProvider: "openai",
                usedProvider: "openai",
                providerAvailable: true,
                rawPayloadValid: false,
                rawTextValid: false,
                normalizedPayloadValid: false,
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
        isRetryPlannerPending
        onSaveOnly={() => {}}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />,
    );

    expect(html.indexOf("GPT-Einordnung wird erneut versucht")).toBeLessThan(html.indexOf("Thema selbst wählen"));
    expect(html).toContain("GPT-Einordnung wird erneut versucht …");

    const clientSource = readFileSync(resolve(process.cwd(), "src/app/create/CreateClient.tsx"), "utf8");
    expect(clientSource).toContain('fetch("/api/create/intelligent-followup"');
    expect(clientSource).toContain("setIsRetryPlannerPending(true);");
    expect(clientSource).toContain("setIsRetryPlannerPending(false);");
    expect(clientSource).not.toContain("window.location.reload");
  });
});
