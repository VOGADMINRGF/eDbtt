import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";
import VoxyRenderAdapterNoopPanel from "@/features/create/VoxyRenderAdapterNoopPanel";
import {
  buildVoxyRenderAdapterNoopFromReadmodels,
  buildVoxyRenderAdapterNoopFromReviewContext,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyBriefingScriptCandidateFromReviewContext,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromReviewContext,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromReviewContext,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyPublishDraft,
  buildVoxyReviewState,
  buildVoxyVideoBriefing,
  resolveVoxyRenderJob,
} from "@/features/voxyVideo";

function buildReviewContextFixture(input?: {
  sourceLanguage?: string;
  readingLanguage?: string;
  originalText?: string;
  summaryText?: string;
  openQuestions?: string[];
  sourceGaps?: string[];
  claims?: string[];
  counterPositions?: string[];
  participationCandidate?: {
    recommendation: string;
    title: string;
    prompt: string;
    options?: string[];
  } | null;
  socialDrafts?: Array<{
    kind: Parameters<typeof buildDossierSocialOutputDraft>[0]["kind"];
    title: string;
    summary: string;
  }>;
}) {
  const sourceLanguage = input?.sourceLanguage ?? "de";
  const readingLanguage = input?.readingLanguage ?? "de";
  const sourcePack = buildCanonicalSourcePack({
    sourcePackId: "source-pack-1",
    sources: [],
    openGaps: input?.sourceGaps ?? [],
  });
  const languageBridge = buildCanonicalLanguageBridgeRecord({
    sourceLanguage,
    contentLanguage: readingLanguage,
    readingLocale: readingLanguage,
    uiLocale: "de",
    originalText:
      input?.originalText ??
      "Wir brauchen sichere Schulwege und klare Prioritäten.",
    summaryText:
      input?.summaryText ??
      input?.claims?.[0] ??
      "Sichere Schulwege priorisieren.",
    openQuestions: input?.openQuestions ?? [],
    trustState: "source_needed",
  });
  const voxyBriefing = buildVoxyVideoBriefing({
    briefingId: "briefing-1",
    sourceContextKind: "dossier",
    sourceContextId: "dossier-1",
    title: "Sichere Schulwege · Voxy-Briefing",
    summary: "Nur als interner Briefing-Entwurf sichtbar.",
    languageBridge,
    sourcePack,
  });

  return {
    primaryUnifiedItem: {
      id: "create-handoff-1",
      source: "create_handoff",
      sourceId: "create-handoff-1",
      title: "Arbeitsstand",
      summary: "Review-first Handoff",
      queueState: "review_ready",
      requiredReviewType: "editorial_review",
      requiredReviewerRoles: ["editor"],
      lifecycleStatus: "review_ready",
      preparationStatus: "review_ready",
      reviewReadyIsApproved: false,
      publishReadyIsPublished: false,
      reviewRequired: true,
      autoPublish: false,
      publishGuard: {
        autoPublish: false,
        reviewRequired: true,
        publicOutputAllowed: false,
        publishActionEnabled: false,
        externalSocialApiTriggered: false,
      },
      sourcePackId: "source-pack-1",
      sourcePackEvidenceState: "missing",
      trustState: "source_needed",
      languageSummary: {
        originalLanguage: sourceLanguage,
        readingLanguage,
      },
      nextAllowedActions: ["review"],
      reviewWorld: "existing_review_queue",
    },
    unifiedItems: [],
    sourcePack,
    languageBridge,
    multilingualThread: {
      readingLocale: readingLanguage,
    },
    multilingualEvidence: {
      overallTrustStatus: "source_needed",
    },
    participationCandidates: input?.participationCandidate
      ? [
          buildParticipationHandoffCandidate({
            id: "candidate-1",
            recommendation: input.participationCandidate.recommendation,
            title: input.participationCandidate.title,
            prompt: input.participationCandidate.prompt,
            options: input.participationCandidate.options ?? [],
          }),
        ]
      : [],
    crossLingualSuggestions: [],
    socialOutputDrafts:
      input?.socialDrafts?.map((draft, index) =>
        buildDossierSocialOutputDraft({
          draftId: `draft-${index + 1}`,
          dossierId: "dossier-1",
          kind: draft.kind,
          title: draft.title,
          summary: draft.summary,
        }),
      ) ?? [],
    dossierWorkspaceSurface: {
      title: "Arbeitsstand",
      sections: {
        claims: input?.claims ?? ["Sichere Schulwege sollen priorisiert werden."],
        counterPositions: input?.counterPositions ?? [],
        openQuestions: input?.openQuestions ?? [],
      },
    },
    voxyBriefing,
    voxyScriptSegments: [],
    voxyReviewState: buildVoxyReviewState(),
    voxyRenderJob: resolveVoxyRenderJob({
      briefingId: "briefing-1",
      approvalGranted: true,
      providerConfigured: false,
    }),
    voxyPublishDraft: buildVoxyPublishDraft({
      briefingId: "briefing-1",
      publishApproved: false,
      runtimeReady: false,
      targetHints: ["voxy_briefing_note"],
    }),
  } as any;
}

function buildBaseModels(input?: {
  sourceLanguage?: string;
  readingLanguage?: string;
  originalText?: string;
  summaryText?: string;
}) {
  const context = buildReviewContextFixture({
    sourceLanguage: input?.sourceLanguage,
    readingLanguage: input?.readingLanguage,
    originalText: input?.originalText,
    summaryText: input?.summaryText,
    claims: ["Sichere Schulwege sollen priorisiert werden."],
    counterPositions: ["Lieferverkehr und Erreichbarkeit müssen mitgedacht werden."],
    openQuestions: ["Welche Kreuzung zuerst?"],
    participationCandidate: {
      recommendation: "statement_review",
      title: "Eltern und Schule einbeziehen",
      prompt: "Welche Erfahrung vor Ort fehlt noch?",
    },
    socialDrafts: [
      {
        kind: "voxy_briefing_note",
        title: "Voxy Briefing Notiz",
        summary: "Nur interner Entwurf, noch kein Video.",
      },
    ],
  });

  const contributionRef = {
    id: "handoff-1",
    title: "Sichere Schulwege",
    href: "/create?resume=handoff-1",
  };

  return {
    context,
    contributionRef,
    scriptModel: buildVoxyBriefingScriptCandidateFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
    handoffModel: buildVoxyRenderProviderHandoffFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
    preflightModel: buildVoxyRenderPreflightReadinessFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
    registryModel: buildVoxyRenderAssetProviderRegistryFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
  };
}

describe("voxy render adapter noop contract", () => {
  it("builds a noop adapter contract that never executes anything", () => {
    const model = buildVoxyRenderAdapterNoopFromReviewContext(
      buildBaseModels().context,
      {
        audience: "admin",
        contributionRef: {
          id: "handoff-1",
          title: "Sichere Schulwege",
          href: "/create?resume=handoff-1",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.requestPreview.adapterRequestId).toContain("render-adapter-request");
    expect(model?.execution).toEqual({
      executionAllowed: false,
      providerExecutionAllowed: false,
      renderQueueAllowed: false,
      mediaFileCreationAllowed: false,
      costDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
    });
    expect(model?.noopResult).toMatchObject({
      rendered: false,
      providerCalled: false,
      queueCreated: false,
      mediaCreated: false,
      costDebited: false,
      published: false,
    });
    expect(model?.publicSafeLabel).toBe("Noch kein Providerlauf");
    expect(model?.requestPreview.videoFormat).toBe("briefing_video");

    const html = renderToStaticMarkup(
      React.createElement(VoxyRenderAdapterNoopPanel, {
        model,
        dataTestId: "voxy-render-adapter-noop",
      }),
    );

    expect(html).toContain("Render-Adapter");
    expect(html).toContain("Noch kein Providerlauf");
    expect(html).toContain("Adapter-Vertrag vorbereitet");
    expect(html).toContain("Noop-Ergebnis");
    expect(html).toContain("Adapter-Request ist Vorschau, nicht Render-Job.");
    expect(html).toContain("nicht ausgeführt");
    expect(html).toContain("nichts gerendert");
    expect(html).toContain("keine Datei erzeugt");
    expect(html).toContain("keine Kosten gebucht");
    expect(html).toContain("nichts veröffentlicht");
    expect(html).not.toContain("blocked_by_missing_review");
    expect(html).not.toContain("adapter_contract_only");
    expect(html).not.toContain("render_queued");
    expect(html).not.toContain("OpenAI");
    expect(html).not.toContain("Anthropic");
    expect(html).not.toContain(".mp4");
  });

  it("blocks on missing provider when review, assets, cost, and language are otherwise cleared", () => {
    const base = buildBaseModels();
    const model = buildVoxyRenderAdapterNoopFromReadmodels({
      surface: "admin",
      scriptModel: base.scriptModel,
      handoffModel: {
        ...base.handoffModel!,
        handoffStatus: "blocked_by_provider",
        reviewGates: base.handoffModel!.reviewGates.map((item) => ({
          ...item,
          status: "approved",
          statusLabel: "Freigegeben",
        })),
      },
      preflightModel: {
        ...base.preflightModel!,
        costStatus: "policy_ready" as any,
        costStatusLabel: "Regel belegt",
        providerSelectionStatus: "none_configured",
        providerSelectionStatusLabel: "Noch kein Provider",
        requiredAssets: base.preflightModel!.requiredAssets.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
        reviewReadiness: base.preflightModel!.reviewReadiness.map((item) => ({
          ...item,
          status: "ready",
          statusLabel: "Freigegeben",
        })),
        subtitleLanguage: null,
      } as any,
      registryModel: {
        ...base.registryModel!,
        providerRegistry: base.registryModel!.providerRegistry.map((item, index) => ({
          ...item,
          status: index === 0 ? "missing" : "configuration_needed",
          statusLabel: index === 0 ? "Fehlt" : "Konfiguration fehlt",
        })),
        assetInventory: base.registryModel!.assetInventory.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
      },
      contributionRef: base.contributionRef,
    });

    expect(model?.adapterStatus).toBe("blocked_by_missing_provider");
    expect(model?.adapterType).toBe("provider_requirement_only");
  });

  it("blocks on missing assets or missing cost policy before any provider execution is possible", () => {
    const base = buildBaseModels();
    const commonReadyHandoff = {
      ...base.handoffModel!,
      handoffStatus: "handoff_preview",
      handoffStatusLabel: "Handoff-Vorschau",
      reviewGates: base.handoffModel!.reviewGates.map((item) => ({
        ...item,
        status: "approved",
        statusLabel: "Freigegeben",
      })),
    };
    const commonReadyRegistry = {
      ...base.registryModel!,
      providerRegistry: base.registryModel!.providerRegistry.map((item) => ({
        ...item,
        status: "configuration_needed",
        statusLabel: "Konfiguration fehlt",
      })),
      assetInventory: base.registryModel!.assetInventory.map((item) => ({
        ...item,
        status: "available",
        statusLabel: "Vorhanden",
      })),
    };

    const assetsModel = buildVoxyRenderAdapterNoopFromReadmodels({
      surface: "admin",
      scriptModel: base.scriptModel,
      handoffModel: commonReadyHandoff,
      preflightModel: {
        ...base.preflightModel!,
        costStatus: "policy_ready" as any,
        costStatusLabel: "Regel belegt",
        providerSelectionStatus: "configuration_needed",
        providerSelectionStatusLabel: "Konfiguration fehlt",
        requiredAssets: base.preflightModel!.requiredAssets.map((item, index) => ({
          ...item,
          status: index === 0 ? "missing" : "available",
          statusLabel: index === 0 ? "Fehlt" : "Vorhanden",
        })),
        reviewReadiness: base.preflightModel!.reviewReadiness.map((item) => ({
          ...item,
          status: "ready",
          statusLabel: "Freigegeben",
        })),
        subtitleLanguage: null,
      } as any,
      registryModel: {
        ...commonReadyRegistry,
        assetInventory: commonReadyRegistry.assetInventory.map((item, index) => ({
          ...item,
          status: index === 0 ? "missing" : "available",
          statusLabel: index === 0 ? "Fehlt" : "Vorhanden",
        })),
      },
      contributionRef: base.contributionRef,
    });
    expect(assetsModel?.adapterStatus).toBe("blocked_by_missing_assets");

    const costModel = buildVoxyRenderAdapterNoopFromReadmodels({
      surface: "admin",
      scriptModel: base.scriptModel,
      handoffModel: commonReadyHandoff,
      preflightModel: {
        ...base.preflightModel!,
        costStatus: "credit_policy_needed",
        costStatusLabel: "Credit-Regel fehlt",
        providerSelectionStatus: "configuration_needed",
        providerSelectionStatusLabel: "Konfiguration fehlt",
        requiredAssets: base.preflightModel!.requiredAssets.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
        reviewReadiness: base.preflightModel!.reviewReadiness.map((item) => ({
          ...item,
          status: "ready",
          statusLabel: "Freigegeben",
        })),
        subtitleLanguage: null,
      },
      registryModel: commonReadyRegistry,
      contributionRef: base.contributionRef,
    });
    expect(costModel?.adapterStatus).toBe("blocked_by_missing_cost_policy");
  });

  it("blocks on missing review or language review for German, Turkish, Arabic, and English/French cases", () => {
    const german = buildBaseModels();
    const reviewModel = buildVoxyRenderAdapterNoopFromReadmodels({
      surface: "admin",
      scriptModel: german.scriptModel,
      handoffModel: german.handoffModel,
      preflightModel: {
        ...german.preflightModel!,
        costStatus: "policy_ready" as any,
        costStatusLabel: "Regel belegt",
        subtitleLanguage: null,
      },
      registryModel: german.registryModel,
      contributionRef: german.contributionRef,
    });
    expect(reviewModel?.adapterStatus).toBe("blocked_by_missing_review");
    expect(reviewModel?.languageLabel).toContain("Original: Deutsch");

    const turkish = buildBaseModels({
      sourceLanguage: "tr",
      readingLanguage: "de",
      originalText: "Aileler için hangi önlem önce gelmeli?",
      summaryText: "Mehrsprachige Schulweg-Debatte",
    });
    const turkishModel = buildVoxyRenderAdapterNoopFromReadmodels({
      surface: "workspace",
      scriptModel: turkish.scriptModel,
      handoffModel: {
        ...turkish.handoffModel!,
        reviewGates: turkish.handoffModel!.reviewGates.map((item) => ({
          ...item,
          status: "approved",
          statusLabel: "Freigegeben",
        })),
      },
      preflightModel: {
        ...turkish.preflightModel!,
        costStatus: "policy_ready" as any,
        costStatusLabel: "Regel belegt",
        requiredAssets: turkish.preflightModel!.requiredAssets.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
        reviewReadiness: turkish.preflightModel!.reviewReadiness.map((item) => ({
          ...item,
          status: item.id === "languageReview" ? "needs_review" : "ready",
          statusLabel: item.id === "languageReview" ? "Review fehlt" : "Freigegeben",
        })),
      } as any,
      registryModel: {
        ...turkish.registryModel!,
        assetInventory: turkish.registryModel!.assetInventory.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
      },
      contributionRef: turkish.contributionRef,
    });
    expect(turkishModel?.adapterStatus).toBe("blocked_by_language_review");
    expect(turkishModel?.languageLabel).toContain("Original: Türkisch");
    expect(turkishModel?.translationIsEvidence).toBe(false);

    const arabic = buildBaseModels({
      sourceLanguage: "ar",
      readingLanguage: "de",
      originalText: "ما الإجراء الذي يجب أن يأتي أولاً؟",
      summaryText: "Mehrsprachige Mobilitätsdebatte",
    });
    const arabicModel = buildVoxyRenderAdapterNoopFromReadmodels({
      surface: "workspace",
      scriptModel: arabic.scriptModel,
      handoffModel: {
        ...arabic.handoffModel!,
        reviewGates: arabic.handoffModel!.reviewGates.map((item) => ({
          ...item,
          status: "approved",
          statusLabel: "Freigegeben",
        })),
      },
      preflightModel: {
        ...arabic.preflightModel!,
        costStatus: "policy_ready" as any,
        costStatusLabel: "Regel belegt",
        requiredAssets: arabic.preflightModel!.requiredAssets.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
        reviewReadiness: arabic.preflightModel!.reviewReadiness.map((item) => ({
          ...item,
          status: item.id === "languageReview" ? "needs_review" : "ready",
          statusLabel: item.id === "languageReview" ? "Review fehlt" : "Freigegeben",
        })),
      } as any,
      registryModel: {
        ...arabic.registryModel!,
        assetInventory: arabic.registryModel!.assetInventory.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
      },
      contributionRef: arabic.contributionRef,
    });
    expect(arabicModel?.adapterStatus).toBe("blocked_by_language_review");
    expect(arabicModel?.rtlRequired).toBe(true);

    const englishFrench = buildBaseModels({
      sourceLanguage: "en",
      readingLanguage: "fr",
      originalText: "Which measure should come first?",
      summaryText: "Cross-lingual mobility briefing",
    });
    const englishFrenchModel = buildVoxyRenderAdapterNoopFromReadmodels({
      surface: "admin",
      scriptModel: englishFrench.scriptModel,
      handoffModel: {
        ...englishFrench.handoffModel!,
        reviewGates: englishFrench.handoffModel!.reviewGates.map((item) => ({
          ...item,
          status: "approved",
          statusLabel: "Freigegeben",
        })),
      },
      preflightModel: {
        ...englishFrench.preflightModel!,
        costStatus: "policy_ready" as any,
        costStatusLabel: "Regel belegt",
        requiredAssets: englishFrench.preflightModel!.requiredAssets.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
        reviewReadiness: englishFrench.preflightModel!.reviewReadiness.map((item) => ({
          ...item,
          status: item.id === "languageReview" ? "needs_review" : "ready",
          statusLabel: item.id === "languageReview" ? "Review fehlt" : "Freigegeben",
        })),
      } as any,
      registryModel: {
        ...englishFrench.registryModel!,
        assetInventory: englishFrench.registryModel!.assetInventory.map((item) => ({
          ...item,
          status: "available",
          statusLabel: "Vorhanden",
        })),
      },
      contributionRef: englishFrench.contributionRef,
    });
    expect(englishFrenchModel?.adapterStatus).toBe("blocked_by_language_review");
    expect(englishFrenchModel?.languageLabel).toContain("Original: Englisch");
    expect(englishFrenchModel?.languageLabel).toContain("Lesefassung: Französisch");
  });

  it("turns missing handoff, preflight, or registry truth into blocked runtime truth", () => {
    const base = buildBaseModels();
    const model = buildVoxyRenderAdapterNoopFromReadmodels({
      surface: "create",
      scriptModel: base.scriptModel,
      handoffModel: null,
      preflightModel: null,
      registryModel: null,
      contributionRef: base.contributionRef,
    });

    expect(model?.adapterStatus).toBe("blocked_by_runtime_truth");
  });
});
