import { describe, expect, it, vi } from "vitest";

import { buildCreateHandoffDraft } from "@/features/create/createHandoff";
import { createHandoffDraftFromDialogOutcome } from "@/features/create/createHandoffDrafts";
import { createReviewQueueItemFromHandoffDraft } from "@/features/create/createHandoffReviewQueue";
import {
  getFactcheckSourceAdapterBlockers,
  mapCreateClaimToFactcheckReviewInput,
  submitFactcheckSourceReviewRequest,
} from "@/features/create/factcheckSourceAdapterBridge";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
import { DIALOG_INTELLIGENCE_PREVIEW_FIXTURES } from "@/features/dialog/dialogIntelligenceFixtures";

function buildFollowup(): CreateIntelligentFollowupResult {
  return {
    understanding: {
      summary: "Kurzfassung",
      dossierContext: "Sichere Schulwege",
      categories: [{ id: "claim", label: "Aussage", confidence: "high" }],
      topics: [{ id: "topic-1", label: "Sichere Schulwege", confidence: "high" }],
      statements: [
        {
          id: "statement-1",
          text: "Vor der Schule fehlen sichere Querungen.",
          kind: "claim",
          stance: "pro",
          confidence: "high",
          sourceExcerpt: "https://beispiel.de/bericht",
        },
      ],
      scopes: ["district"],
      openQuestion: "Welche Kreuzungen sind zuerst gemeint?",
      confidence: "high",
    },
    suggestions: [
      {
        id: "dossier:auto",
        kind: "dossier",
        title: "Sichere Schulwege",
        reason: "Das Thema passt zu einem bestehenden Arbeitsstand.",
        confidence: "high",
        href: "/dossier?topic=schulwege",
        requiresConfirmation: true,
      },
    ],
    sourceText: "https://beispiel.de/bericht Vor der Schule fehlen sichere Querungen.",
    generatedAt: "2026-06-28T10:00:00.000Z",
    meta: {
      planner: {
        source: "heuristic_fallback",
        plannerSource: "heuristic_fallback",
        plannerProvider: "local_fallback",
        plannerRole: "planner_only",
        plannerTopic: "Sichere Schulwege",
        plannerCore: "Vor der Schule fehlen sichere Querungen.",
        plannerScope: ["district", "municipal"],
        plannerStance: "pro",
        plannerClusters: ["Mobilität"],
        plannerOpenQuestions: ["Welche Kreuzungen sind zuerst gemeint?"],
        shortSummary: "Kurzfassung",
        topicCandidates: ["Sichere Schulwege"],
        clusterCandidates: ["Mobilität"],
        scopeCandidates: ["district", "municipal"],
        stance: "pro",
        openQuestions: ["Welche Kreuzungen sind zuerst gemeint?"],
        graphSearchTerms: ["Schulwege"],
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
        plannerDegraded: false,
        degradedReason: null,
        plannerDegradedReason: null,
        qualityStatus: "specific",
        qualityIssues: [],
        providerCallAttempted: false,
        providerCallSucceeded: false,
        plannerDebug: {
          attemptedProvider: "openai",
          usedProvider: "local_fallback",
          providerAvailable: false,
          providerErrorCode: null,
          providerErrorMessage: null,
          errorMessage: null,
          rawPayloadValid: false,
          rawTextValid: false,
          normalizedPayloadValid: false,
          qualityGatePassed: false,
        },
      },
      graphMatch: {
        stage: "after_structure",
        prepared: true,
        requiresConfirmation: true,
        searchTerms: ["Schulwege"],
        matches: [],
        matchedTopics: [],
        matchedDossiers: [],
        matchedClaims: [],
        matchedAnlassraeume: [],
        matchedVotes: [],
        shouldCreateNewTopic: true,
      },
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
    },
  };
}

function buildMaterialItem() {
  return {
    id: "material-1",
    kind: "web_document" as const,
    label: "Bericht",
    url: "https://beispiel.de/bericht",
    uploadId: null,
    mimeType: null,
    fileName: null,
    text: null,
    pageRef: null,
    timestampRef: null,
    extractedBy: null,
    extractionStatus: "partial" as const,
  };
}

function buildFactcheckQueueItem() {
  return createReviewQueueItemFromHandoffDraft(
    createHandoffDraftFromDialogOutcome(
      DIALOG_INTELLIGENCE_PREVIEW_FIXTURES.reviewReadySourceBlocked,
      "factcheck_request",
    ),
  );
}

describe("factcheck source adapter bridge", () => {
  it("maps create handoff claims into a review-first factcheck/source payload without deepsearch flags", () => {
    const result = buildFollowup();
    const draft = buildCreateHandoffDraft({
      result,
      selectedAction: "request_factcheck",
      id: "create-handoff-1",
      createdAt: "2026-06-28T10:00:00.000Z",
      sourceUrls: ["https://beispiel.de/bericht"],
      materialItems: [buildMaterialItem()],
    });

    const payload = mapCreateClaimToFactcheckReviewInput(draft);

    expect(payload.requestedAction).toBe("factcheck");
    expect(payload.text).toContain("Vor der Schule fehlen sichere Querungen.");
    expect(payload.claims.length).toBeGreaterThan(0);
    expect(payload.sourceRefs).toContain("https://beispiel.de/bericht");
    expect(payload.materialRefs).toContain("https://beispiel.de/bericht");
  });

  it("returns blocked/unwired for unsupported or incomplete runtime contexts", () => {
    const item = buildFactcheckQueueItem();
    const blockers = getFactcheckSourceAdapterBlockers({
      item: {
        ...item,
        target: "dossier_candidate",
      },
      result: {
        ...buildFollowup(),
        sourceText: "   ",
        meta: undefined,
      } as CreateIntelligentFollowupResult,
    });

    expect(blockers).toEqual([
      "unsupported_queue_target",
      "missing_followup_source_text",
      "missing_followup_planner",
      "missing_followup_graph_match",
    ]);
  });

  it("submits factcheck requests as review requests, not as confirmed truths or source inventions", async () => {
    const item = buildFactcheckQueueItem();
    const submit = vi.fn(async (input) => ({
      ok: true as const,
      jobId: "factcheck-job-1",
      status: "queued",
      requestScope: null,
      requestedAction: input.requestedAction,
      sourceRefCount: input.sourceRefs.length,
    }));

    const submission = await submitFactcheckSourceReviewRequest(
      {
        item,
        result: buildFollowup(),
        sourceUrls: ["https://beispiel.de/bericht"],
      },
      { submit },
    );

    expect(submission).toMatchObject({
      ok: true,
      status: "queued",
      jobId: "factcheck-job-1",
      message:
        "Die Aussage wurde zur Prüfung vorgemerkt. Es wurde noch keine Wahrheit bestätigt und keine Quelle automatisch bewertet.",
    });
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "factcheck_request",
        requestedAction: "factcheck",
        withSerp: false,
        deepSearch: false,
        researchConfirmed: false,
      }),
    );
  });

  it("keeps missing-source and access-denied states as blocked review requests instead of fake success", async () => {
    const item = buildFactcheckQueueItem();

    const submission = await submitFactcheckSourceReviewRequest(
      {
        item,
        result: buildFollowup(),
      },
      {
        submit: async () => ({
          ok: false,
          status: 403,
          message: "Entitlement fehlt für produktive Quellenprüfung.",
        }),
      },
    );

    expect(submission).toMatchObject({
      ok: false,
      blocked: true,
      error: "runtime_access_denied",
    });
    expect(submission.message).toContain(
      "Quellenprüfung vorgemerkt – direkte Übergabe ist noch nicht verfügbar.",
    );
    expect(submission.message).toContain("Entitlement fehlt");
  });

  it("does not silently convert failed runtime submissions into verified or published results", async () => {
    const item = buildFactcheckQueueItem();

    const submission = await submitFactcheckSourceReviewRequest(
      {
        item,
        result: buildFollowup(),
      },
      {
        submit: async () => {
          throw new Error("network");
        },
      },
    );

    expect(submission).toEqual({
      ok: false,
      blocked: false,
      blockers: [],
      error: "runtime_submit_failed",
      message: "Quellenprüfung konnte nicht übergeben werden. Bitte erneut versuchen.",
    });
  });
});
