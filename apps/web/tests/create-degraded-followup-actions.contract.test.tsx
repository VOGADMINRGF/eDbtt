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
            summary: "Der Beitrag berührt mehrere kommunale Themen rund um Schule, Wege, Bauprojekte und Haushalt.",
            categories: [{ id: "claim", label: "Aussage", confidence: "medium" }],
            topics: [{ id: "topic-1", label: "Öffentliches Anliegen", confidence: "low" }],
            statements: [
              {
                id: "statement-1",
                text: "In Rahnsdorf fehlen sichere Querungen an Kita, Straße und Haltestelle. Bauprojekte verdrängen Grünflächen und der Haushalt ist knapp.",
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
            "In Rahnsdorf fehlen sichere Querungen an Kita, Straße und Haltestelle. Radfahrer kommen schlecht durch, Bauprojekte verdrängen Grünflächen und der Haushalt ist knapp.",
          generatedAt: "2026-05-12T08:00:00.000Z",
          degraded: false,
          degradedReason: null,
          meta: {
            planner: {
              source: "heuristic_fallback",
              plannerSource: "heuristic_fallback",
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
              qualityIssues: ["technical_fallback_only"],
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

    expect(html).toContain("Ich habe diese Themen erkannt.");
    expect(html).toContain("Ich sehe drei Themenstränge. Du kannst sie zusammen lassen oder einzeln weiterführen.");
    expect(html).toContain("Details ansehen");
    expect(html).toContain("Hauptthema wählen");
    expect(html).toContain("Beitrag weiterentwickeln");
    expect(html).toContain("Quellen ergänzen");
    expect(html).toContain("Entwurf speichern");
    expect(html).toContain("Anlassraum vorbereiten");
    expect(html).toContain("Thema selbst wählen");
    expect(html).toContain("Was du jetzt tun kannst");
    expect(html).toContain("Verkehrssicherheit");
    expect(html).toContain("Kita-/Schulweg &amp; Barrierefreiheit");
    expect(html).toContain("Stadtplanung &amp; Finanzierung");
    expect(html).not.toContain("Ich sehe einen gemeinsamen Kern.");
    expect(html).not.toContain("Einordnung erneut versuchen");
    expect(html).not.toContain("Öffentliches Anliegen</p>");
    expect(html).not.toContain("Kern</p>");
    expect(html).not.toContain("Direkt Entwurf");
    expect(html).not.toContain("Faktencheck anfragen");
    expect(html).not.toContain("KI-Suche aktivieren");
    expect(html).not.toContain("Bericht an die Redaktion senden");
    expect(html.indexOf("Hauptthema wählen")).toBeLessThan(html.indexOf("Details ansehen"));
  });

  it("keeps retry secondary in details, shows a loading label, and keeps retry on the same planner_only route", () => {
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
              source: "heuristic_fallback",
              plannerSource: "heuristic_fallback",
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
              qualityIssues: ["technical_fallback_only"],
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

    expect(html).toContain("Details ansehen");
    expect(html).not.toContain("Einordnung wird erneut versucht …");

    const clientSource = readFileSync(resolve(process.cwd(), "src/app/create/CreateClient.tsx"), "utf8");
    expect(clientSource).toContain('fetch("/api/create/intelligent-followup"');
    expect(clientSource).toContain("setIsRetryPlannerPending(true);");
    expect(clientSource).toContain("setIsRetryPlannerPending(false);");
    expect(clientSource).not.toContain("window.location.reload");
  });
});
