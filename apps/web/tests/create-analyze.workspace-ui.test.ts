import { describe, expect, it, vi } from "vitest";
import {
  buildAnalyzeWorkspaceMaterialPayload,
  buildAnalyzeWorkspaceSavePayload,
  buildCreatePrepareAttachReviewState,
  collectCreateAnalyzeReasons,
  deriveSourceGroundingUiHint,
  deriveCreateAnalyzeRoutingHint,
  resolveFinalizeRedirectTarget,
  shouldRenderCompactEmbeddedWorkspaceHeader,
  shouldHydrateDraftIdentityFromStorage,
  shouldRenderWorkspacePrimaryTextInput,
  shouldTriggerEmbeddedAutoAnalyze,
  shouldUseInlineCreateActionBar,
} from "@/components/analyze/AnalyzeWorkspace";
import {
  buildFinalizeFallbackPath,
  resolveAndNavigateAfterFinalize,
} from "@/features/create/finalizeRedirect";

describe("create analyze workspace UI helpers", () => {
  it("keeps source/material payload compact and omits empty arrays", () => {
    expect(
      buildAnalyzeWorkspaceMaterialPayload({
        sourceUrls: ["https://example.org/bericht"],
        uploadIds: [],
        materialItems: [
          {
            id: "mat-1",
            kind: "web_document",
            label: "Bericht",
            url: "https://example.org/bericht",
            uploadId: null,
            mimeType: null,
            fileName: null,
            text: null,
            pageRef: null,
            timestampRef: null,
            extractedBy: null,
            extractionStatus: "partial",
          },
        ],
      }),
    ).toEqual({
      sourceUrls: ["https://example.org/bericht"],
      materialItems: [
        expect.objectContaining({
          id: "mat-1",
          kind: "web_document",
        }),
      ],
    });

    expect(
      buildAnalyzeWorkspaceMaterialPayload({
        sourceUrls: [],
        uploadIds: [],
        materialItems: [],
      }),
    ).toEqual({});
  });

  it("omits null draftId from save payload so first embedded save stays schema-safe", () => {
    expect(
      buildAnalyzeWorkspaceSavePayload({
        draftId: null,
        preparedText: "Bitte prüft die Tierwohl-Standards im Import.",
        text: "Bitte prüft die Tierwohl-Standards im Import.",
        locale: "de",
        mode: "contribution",
        resolvedCreateMode: "source",
        selectedAnlassraumId: null,
        authorName: null,
        useCase: "civic",
        materialPayload: {},
        analysis: {
          claims: [],
          notes: [],
          questions: [],
          knots: [],
          consequences: [],
          responsibilities: [],
          responsibilityPaths: [],
          impactAndResponsibility: { impacts: [], responsibleActors: [] },
          report: null,
          eventualities: [],
          decisionTrees: [],
        },
      }),
    ).toEqual(
      expect.not.objectContaining({
        draftId: expect.anything(),
      }),
    );
  });

  it("prioritizes neu_anlegen messaging for no_match", () => {
    const hint = deriveCreateAnalyzeRoutingHint({
      matchType: "no_match",
      suggestedCtas: [
        {
          id: "neu_anlegen",
          label: "Neu anlegen",
          reason: "Kein belastbarer Match.",
        },
      ],
    });

    expect(hint.tone).toBe("info");
    expect(hint.primaryCtaId).toBe("neu_anlegen");
    expect(hint.message).toContain("Kein belastbarer Match");
  });

  it("marks duplicate_risk as warning and keeps manual control wording", () => {
    const hint = deriveCreateAnalyzeRoutingHint({
      matchType: "duplicate_risk",
      suggestedCtas: [
        {
          id: "anders_sehen",
          label: "Anders sehen",
          reason: "Duplikatrisiko manuell pruefen.",
        },
      ],
    });

    expect(hint.tone).toBe("warning");
    expect(hint.primaryCtaId).toBe("anders_sehen");
    expect(hint.message).toContain("kein Silent-Merge");
  });

  it("dedupes and exposes match reasons for UI visibility", () => {
    const reasons = collectCreateAnalyzeReasons({
      reasons: ["Explizit gesetzter Anlassraum-Kontext.", "Explizit gesetzter Anlassraum-Kontext."],
      matches: [
        {
          id: "m1",
          label: "Anlassraum Innenstadt",
          matchType: "same_anlassraum",
          matchEntityType: "anlassraum",
          strength: "high",
          reason: "Explizit gesetzter Anlassraum-Kontext.",
          reasons: [
            "Explizit gesetzter Anlassraum-Kontext.",
            "Kontext wurde im produktiven Anlassraum-Read-Model gefunden.",
          ],
        },
      ],
    } as any);

    expect(reasons).toContain("Explizit gesetzter Anlassraum-Kontext.");
    expect(reasons).toContain("Kontext wurde im produktiven Anlassraum-Read-Model gefunden.");
    expect(reasons.length).toBe(2);
  });

  it("builds explicit prepare-attach review state only after confirmed handoff", () => {
    const review = buildCreatePrepareAttachReviewState({
      createAnalyze: {
        runId: "run-1",
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        normalizedInputSummary: "Kurzsummary",
        matchType: "related_claim",
        matchEntityType: "claim",
        reasons: ["Semantische Naehe"],
        matches: [
          {
            id: "m1",
            label: "Claim A",
            matchType: "related_claim",
            matchEntityType: "claim",
            strength: "medium",
            reason: "Semantische Naehe",
            reasons: ["Semantische Naehe"],
            entityId: "claim-1",
            targetRef: "/swipes?statementId=claim-1",
          },
        ],
      } as any,
      handoff: {
        ctaId: "perspektive_anhaengen",
        sourceRunId: "run-1",
        sourceConfidence: 0.71,
        sourceMatchSourceState: "ok",
        sourcePhases: null,
        matchType: "related_claim",
        matchEntityType: "claim",
        actionType: "prepare_attach",
        entityType: "claim",
        entityId: "claim-1",
        targetRef: "/swipes?statementId=claim-1",
        requiresConfirm: true,
        noAutoPublish: true,
        noSilentMerge: true,
        summary: "Prepare attach",
        warning: null,
        guardrails: ["Kein Auto-Merge."],
      },
    });

    expect(review).toBeTruthy();
    expect(review?.targets.length).toBe(1);
    expect(review?.selectedTargetKey).toBe("claim:claim-1");
    expect(review?.handoff.ctaId).toBe("perspektive_anhaengen");
    expect(review?.sourceLanguage).toBe("de");
    expect(review?.contentLanguage).toBe("de");
    expect(review?.uiLocale).toBe("de");
    expect(typeof review?.userConfirmedAt).toBe("string");
    expect(review?.reasons.length).toBeGreaterThan(0);
  });

  it("prefers handoff sourceRunId to keep analyze -> CTA transfer stable", () => {
    const review = buildCreatePrepareAttachReviewState({
      createAnalyze: {
        runId: "run-create",
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        normalizedInputSummary: "Kurzsummary",
        matchType: "related_claim",
        matchEntityType: "claim",
        reasons: ["Semantische Naehe"],
        matches: [
          {
            id: "m1",
            label: "Claim A",
            matchType: "related_claim",
            matchEntityType: "claim",
            strength: "medium",
            reason: "Semantische Naehe",
            reasons: ["Semantische Naehe"],
            entityId: "claim-1",
            targetRef: "/swipes?statementId=claim-1",
          },
        ],
      } as any,
      handoff: {
        ctaId: "perspektive_anhaengen",
        sourceRunId: "run-handoff",
        sourceConfidence: 0.5,
        sourceMatchSourceState: "ok",
        sourcePhases: null,
        matchType: "related_claim",
        matchEntityType: "claim",
        actionType: "prepare_attach",
        entityType: "claim",
        entityId: "claim-1",
        targetRef: "/swipes?statementId=claim-1",
        requiresConfirm: true,
        noAutoPublish: true,
        noSilentMerge: true,
        summary: "Prepare attach",
        warning: null,
        guardrails: ["Kein Auto-Merge."],
      },
    });

    expect(review?.sourceRunId).toBe("run-handoff");
  });

  it("requires explicit target choice when multiple prepare-attach targets are plausible", () => {
    const review = buildCreatePrepareAttachReviewState({
      createAnalyze: {
        runId: "run-1",
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        normalizedInputSummary: "Kurzsummary",
        matchType: "related_claim",
        matchEntityType: "claim",
        reasons: ["Semantische Naehe"],
        matches: [
          {
            id: "m1",
            label: "Claim A",
            matchType: "related_claim",
            matchEntityType: "claim",
            strength: "medium",
            reason: "Semantische Naehe",
            reasons: ["Semantische Naehe"],
            entityId: "claim-1",
            targetRef: "/swipes?statementId=claim-1",
          },
          {
            id: "m2",
            label: "Dossier A",
            matchType: "related_dossier",
            matchEntityType: "dossier",
            strength: "medium",
            reason: "Dossier-Naehe",
            reasons: ["Dossier-Naehe"],
            entityId: "dossier-1",
            targetRef: "/dossier/dossier-1",
          },
        ],
      } as any,
      handoff: {
        ctaId: "perspektive_anhaengen",
        sourceRunId: "run-1",
        sourceConfidence: 0.52,
        sourceMatchSourceState: "ok",
        sourcePhases: null,
        matchType: "related_claim",
        matchEntityType: "claim",
        actionType: "prepare_attach",
        entityType: "claim",
        entityId: "claim-1",
        targetRef: "/swipes?statementId=claim-1",
        requiresConfirm: true,
        noAutoPublish: true,
        noSilentMerge: true,
        summary: "Prepare attach",
        warning: null,
        guardrails: ["Kein Auto-Merge."],
      },
    });

    expect(review?.targets.length).toBe(2);
    expect(review?.selectedTargetKey).toBeNull();
  });

  it("returns null review state when no valid attach target exists", () => {
    const review = buildCreatePrepareAttachReviewState({
      createAnalyze: {
        runId: "run-2",
        sourceLanguage: "de",
        contentLanguage: "de",
        uiLocale: "de",
        normalizedInputSummary: "Summary",
        matchType: "no_match",
        matchEntityType: "question",
        reasons: [],
        matches: [],
      } as any,
      handoff: {
        ctaId: "perspektive_anhaengen",
        sourceRunId: "run-2",
        sourceConfidence: 0.33,
        sourceMatchSourceState: "degraded",
        sourcePhases: null,
        matchType: "no_match",
        matchEntityType: "question",
        actionType: "prepare_attach",
        entityType: "question",
        entityId: null,
        targetRef: null,
        requiresConfirm: true,
        noAutoPublish: true,
        noSilentMerge: true,
        summary: "Prepare attach",
        warning: null,
        guardrails: ["Kein Auto-Merge."],
      },
    });

    expect(review).toBeNull();
  });

  it("shows warning source-grounding hint when no-source-bluffing fails", () => {
    const hint = deriveSourceGroundingUiHint({
      taskType: "analyze",
      sourceInventory: {
        total: 1,
        uploadDocuments: 1,
        webReferences: 0,
        freeNotes: 0,
      },
      documentGroundingPass: {
        required: true,
        documentsWithText: 0,
        startCoverage: false,
        middleCoverage: false,
        endCoverage: false,
        contextRotRisk: "high",
      },
      externalContextPass: {
        webReferences: 0,
        policy: "supplement_only",
      },
      synthesis: {
        documentGroundedClaims: 0,
        webGroundedClaims: 0,
        inferredClaims: 2,
        openClaims: 1,
      },
      contradictionAudit: {
        contradictionSignals: [],
        hasSignal: false,
      },
      noSourceBluffing: {
        passed: false,
        reason: "Uploads vorhanden, aber kein dokumentgestützter Befund.",
      },
      requiresManualReview: true,
    });

    expect(hint?.tone).toBe("warning");
    expect(hint?.message).toContain("Uploads vorhanden");
  });

  it("shows info source-grounding hint when audit is healthy", () => {
    const hint = deriveSourceGroundingUiHint({
      taskType: "media",
      sourceInventory: {
        total: 3,
        uploadDocuments: 1,
        webReferences: 1,
        freeNotes: 1,
      },
      documentGroundingPass: {
        required: true,
        documentsWithText: 1,
        startCoverage: true,
        middleCoverage: true,
        endCoverage: true,
        contextRotRisk: "low",
      },
      externalContextPass: {
        webReferences: 1,
        policy: "supplement_only",
      },
      synthesis: {
        documentGroundedClaims: 3,
        webGroundedClaims: 1,
        inferredClaims: 0,
        openClaims: 0,
      },
      contradictionAudit: {
        contradictionSignals: [],
        hasSignal: false,
      },
      noSourceBluffing: {
        passed: true,
        reason: null,
      },
      requiresManualReview: false,
    });

    expect(hint?.tone).toBe("info");
    expect(hint?.title).toContain("Quellenbindung");
  });

  it("resolves finalize redirects to internal paths only", () => {
    expect(
      resolveFinalizeRedirectTarget({
        apiRedirectTo: "/swipes?fromDraft=abc",
        fallbackRedirectTo: "/runden",
      }),
    ).toBe("/swipes?fromDraft=abc");

    expect(
      resolveFinalizeRedirectTarget({
        apiRedirectTo: "https://evil.example/phish",
        fallbackRedirectTo: "/swipes",
      }),
    ).toBe("/swipes");

    expect(
      resolveFinalizeRedirectTarget({
        apiRedirectTo: "//evil.example/phish",
        fallbackRedirectTo: "/swipes",
      }),
    ).toBe("/swipes");
  });

  it("triggers navigation immediately after finalize target resolution", () => {
    const navigate = vi.fn();
    const target = resolveAndNavigateAfterFinalize({
      apiRedirectTo: "/swipes?fromDraft=65f000000000000000000011",
      fallbackRedirectTo: "/swipes",
      navigate,
    });

    expect(target).toBe("/swipes?fromDraft=65f000000000000000000011");
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/swipes?fromDraft=65f000000000000000000011");
  });

  it("does not navigate when api and fallback redirects are both external/invalid", () => {
    const navigate = vi.fn();
    const target = resolveAndNavigateAfterFinalize({
      apiRedirectTo: "https://evil.example",
      fallbackRedirectTo: "javascript:alert(1)",
      navigate,
    });

    expect(target).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("derives wrapper fallback path with dossier priority", () => {
    expect(buildFinalizeFallbackPath({ dossierId: "dossier-1" })).toBe("/dossier/dossier-1");
    expect(buildFinalizeFallbackPath({ dossierId: null })).toBe("/swipes");
    expect(
      buildFinalizeFallbackPath({
        dossierId: null,
        preferredSurface: "runden",
        anlassraumId: "65f000000000000000000011",
      }),
    ).toBe("/runden?view=active&anlassraumId=65f000000000000000000011");
    expect(
      buildFinalizeFallbackPath({
        dossierId: null,
        preferredSurface: "runden",
      }),
    ).toBe("/runden?view=active");
    expect(
      buildFinalizeFallbackPath({
        dossierId: null,
        preferredSurface: "runden",
        fallbackReturnTo: "/runden?view=results",
      }),
    ).toBe("/runden?view=results");
  });

  it("hides the workspace primary text input in embedded single-intake mode", () => {
    expect(
      shouldRenderWorkspacePrimaryTextInput({
        embeddedSingleIntake: true,
      }),
    ).toBe(false);
    expect(
      shouldRenderWorkspacePrimaryTextInput({
        embeddedSingleIntake: false,
      }),
    ).toBe(true);
  });

  it("triggers embedded auto-analyze only on fresh token with non-empty prepared text", () => {
    expect(
      shouldTriggerEmbeddedAutoAnalyze({
        autoRunToken: 2,
        lastHandledToken: 1,
        preparedText: "Neuer Start aus Composer",
      }),
    ).toBe(true);
    expect(
      shouldTriggerEmbeddedAutoAnalyze({
        autoRunToken: 2,
        lastHandledToken: 2,
        preparedText: "Neuer Start aus Composer",
      }),
    ).toBe(false);
    expect(
      shouldTriggerEmbeddedAutoAnalyze({
        autoRunToken: 3,
        lastHandledToken: 2,
        preparedText: "   ",
      }),
    ).toBe(false);
  });

  it("does not hydrate persisted draft identifiers when text is parent-synced", () => {
    expect(
      shouldHydrateDraftIdentityFromStorage({
        syncTextFromParent: true,
      }),
    ).toBe(false);
    expect(
      shouldHydrateDraftIdentityFromStorage({
        syncTextFromParent: false,
      }),
    ).toBe(true);
  });

  it("uses a compact workspace header for embedded create analysis scenes", () => {
    expect(
      shouldRenderCompactEmbeddedWorkspaceHeader({
        analysisEntryVariant: "single_button",
      }),
    ).toBe(true);
    expect(
      shouldRenderCompactEmbeddedWorkspaceHeader({
        analysisEntryVariant: "use_case_cards",
      }),
    ).toBe(false);
  });

  it("switches the create analysis action bar from global overlay to inline/sticky mode", () => {
    expect(
      shouldUseInlineCreateActionBar({
        analysisEntryVariant: "single_button",
      }),
    ).toBe(true);
    expect(
      shouldUseInlineCreateActionBar({
        analysisEntryVariant: "use_case_cards",
      }),
    ).toBe(false);
  });
});
