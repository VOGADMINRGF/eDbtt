import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import VoxyRenderHybridRuntimeFoundationPanel from "@/features/create/VoxyRenderHybridRuntimeFoundationPanel";
import { buildCreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import {
  buildVoxyRenderHybridRuntimeFoundationFromCreateCandidatePreview,
  buildVoxyRenderHybridRuntimeFoundationPanelModel,
} from "@/features/create/voxyRenderHybridRuntimeFoundationContract";

function buildFollowupFixture() {
  return {
    understanding: {
      summary: "Kurzfassung",
      categories: [{ id: "claim", label: "Aussage", confidence: "medium" as const }],
      topics: [{ id: "topic-1", label: "Schulwege", confidence: "medium" as const }],
      statements: [
        {
          id: "statement-1",
          text: "Die Stadt sollte sichere Schulwege priorisieren.",
          kind: "claim" as const,
          stance: "pro" as const,
          confidence: "medium" as const,
        },
      ],
      scopes: ["district" as const],
      openQuestion: "Welche Kreuzung zuerst?",
      confidence: "medium" as const,
    },
    suggestions: [
      {
        id: "vote-1",
        kind: "vote" as const,
        title: "Welche Maßnahme soll zuerst kommen?",
        reason: "Beteiligungsfrage erkannt.",
        confidence: "medium" as const,
        requiresConfirmation: true as const,
      },
    ],
    sourceText: "Sichere Schulwege und klare Prioritäten im Kiez.",
    generatedAt: "2026-07-03T14:00:00.000Z",
    degraded: false,
    degradedReason: null,
    meta: {
      planner: {
        source: "openai" as const,
        plannerSource: "openai" as const,
        plannerProvider: "openai" as const,
        plannerRole: "planner_only" as const,
        plannerTopic: "Sichere Schulwege",
        plannerCore: "Die Stadt sollte sichere Schulwege priorisieren.",
        plannerScope: ["district" as const],
        plannerStance: "pro" as const,
        plannerClusters: ["Mobilität"],
        plannerOpenQuestions: ["Welche Kreuzung zuerst?"],
        shortSummary: "Kurzfassung",
        topicCandidates: ["Sichere Schulwege"],
        clusterCandidates: ["Mobilität"],
        scopeCandidates: ["district" as const],
        stance: "pro" as const,
        openQuestions: ["Welche Kreuzung zuerst?"],
        graphSearchTerms: ["Schulwege"],
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
      },
      graphMatch: {
        stage: "after_structure" as const,
        prepared: true,
        requiresConfirmation: true as const,
        searchTerms: ["Schulwege"],
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
      deepSearchUsed: false,
    },
  };
}

describe("voxy hybrid runtime foundation contract", () => {
  it("stays foundation-ready while runtime execution remains disabled", () => {
    const model = buildCreateCandidatePreviewReadModel({
      followup: buildFollowupFixture(),
      draftId: "65a111111111111111111122",
      sourceUrls: [],
      materialItems: [],
    });

    const foundation = buildVoxyRenderHybridRuntimeFoundationFromCreateCandidatePreview(model);

    expect(foundation.foundationStatus).toBe("foundation_ready");
    expect(foundation.selectedPath).toBe("hybrid_external_render_adapter");
    expect(foundation.foundationContract.foundationReady).toBe(true);
    expect(foundation.foundationContract.runtimeEnabled).toBe(false);
    expect(foundation.foundationContract.providerNeutral).toBe(true);
    expect(foundation.executionFlags).toMatchObject({
      executionAllowed: false,
      providerExecutionAllowed: false,
      externalApiCalled: false,
      queueAllowed: false,
      workerAllowed: false,
      storageWriteAllowed: false,
      uploadAllowed: false,
      schedulingAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      renderAllowed: false,
      secretsAccessed: false,
      runtimeEnabled: false,
    });
    expect(foundation.configRequirements.every((item) => item.status === "requirement_only")).toBe(
      true,
    );
    expect(foundation.secretRequirements.every((item) => item.status === "requirement_only")).toBe(
      true,
    );
  });

  it("renders the disabled hybrid foundation panel with explicit guardrails", () => {
    const model = buildCreateCandidatePreviewReadModel({
      followup: buildFollowupFixture(),
      draftId: "65a111111111111111111122",
      sourceUrls: [],
      materialItems: [],
    });
    const panelModel = buildVoxyRenderHybridRuntimeFoundationPanelModel({
      preview: buildVoxyRenderHybridRuntimeFoundationFromCreateCandidatePreview(model),
    });

    const html = renderToStaticMarkup(
      <VoxyRenderHybridRuntimeFoundationPanel
        model={panelModel}
        dataTestId="hybrid-runtime-foundation-panel"
      />,
    );

    expect(html).toContain("Hybrid Runtime Foundation");
    expect(html).toContain("selected_path = hybrid_external_render_adapter");
    expect(html).toContain("runtimeEnabled = false");
    expect(html).toContain("Secrets nur Requirement");
    expect(html).toContain("Keine Queue/Worker-Ausführung");
    expect(html).toContain('data-testid="hybrid-runtime-foundation-panel"');
  });
});
