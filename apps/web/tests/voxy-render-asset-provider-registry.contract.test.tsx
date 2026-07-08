import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";
import VoxyRenderAssetProviderRegistryPanel from "@/features/create/VoxyRenderAssetProviderRegistryPanel";
import {
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import { buildVoxyCocreationDialog } from "@/features/create/voxyCocreationDialogContract";
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

describe("voxy render asset provider registry contract", () => {
  it("recognizes real repo assets but keeps missing render assets and provider adapters explicit", () => {
    const model = buildVoxyRenderAssetProviderRegistryFromReviewContext(
      buildReviewContextFixture({
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
      }),
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
    expect(model?.registryStatus).toBe("needs_provider_configuration");
    expect(model?.assetInventory.find((item) => item.id === "voxy_avatar")).toMatchObject({
      status: "available",
      source: "repo",
      publicPath: "/brand/voxy/voxy-confident.png",
    });
    expect(model?.assetInventory.find((item) => item.id === "brand_logo")).toMatchObject({
      status: "available",
      source: "repo",
      publicPath: "/brand/voxy/overlays/voxy-wordmark.svg",
    });
    expect(model?.assetInventory.find((item) => item.id === "voice_profile")?.status).toBe("missing");
    expect(model?.assetInventory.find((item) => item.id === "subtitle_template")?.status).toBe("missing");
    expect(model?.assetInventory.find((item) => item.id === "lower_third_template")?.status).toBe("missing");
    expect(model?.assetInventory.find((item) => item.id === "source_caption_template")?.status).toBe("missing");
    expect(model?.assetInventory.find((item) => item.id === "export_preset")?.status).toBe("missing");
    expect(model?.providerRegistry.find((item) => item.id === "avatar_video")).toMatchObject({
      status: "adapter_needed",
      providerName: null,
      executionAllowed: false,
    });
    expect(model?.providerRegistry.find((item) => item.id === "voiceover")?.status).toBe("adapter_needed");
    expect(model?.providerRegistry.find((item) => item.id === "render_queue")?.status).toBe("adapter_needed");
    expect(model?.noRenderAction).toBe(true);
    expect(model?.noProviderExecution).toBe(true);
    expect(model?.noCostDebit).toBe(true);
    expect(model?.noPublishAction).toBe(true);

    const html = renderToStaticMarkup(
      React.createElement(VoxyRenderAssetProviderRegistryPanel, {
        model,
        dataTestId: "voxy-render-asset-provider-registry",
      }),
    );

    expect(html).toContain("Asset- &amp; Provider-Registry");
    expect(html).toContain("Was ist vorhanden?");
    expect(html).toContain("Was fehlt?");
    expect(html).toContain("Was ist nur Anforderung?");
    expect(html).toContain("Warum noch kein Rendering?");
    expect(html).toContain("/brand/voxy/manifest.json");
    expect(html).toContain("/brand/voxy/voxy-confident.png");
    expect(html).not.toContain("adapter_needed");
    expect(html).not.toContain("requirement_only");
    expect(html).not.toContain("OpenAI");
    expect(html).not.toContain("Anthropic");
  });

  it("keeps Turkish source language separate and marks multilingual voice as requirement only", () => {
    const model = buildVoxyRenderAssetProviderRegistryFromReviewContext(
      buildReviewContextFixture({
        sourceLanguage: "tr",
        readingLanguage: "de",
        originalText: "Aileler için hangi önlem önce gelmeli?",
        summaryText: "Mehrsprachige Schulweg-Debatte",
        openQuestions: ["Welche Gruppen in beiden Sprachen müssen einbezogen werden?"],
        claims: ["Sichere Schulwege betreffen Familien und Mieter:innen."],
      }),
      {
        audience: "workspace",
        contributionRef: {
          id: "handoff-tr-1",
          title: "Mehrsprachige Schulwege",
          href: "/create?resume=handoff-tr-1",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.languageRequirements.sourceLanguage).toBe("tr");
    expect(model?.languageRequirements.readingLanguage).toBe("de");
    expect(model?.languageRequirements.translationIsEvidence).toBe(false);
    expect(model?.providerRegistry.find((item) => item.id === "multilingual_voice")?.status).toBe("requirement_only");
  });

  it("keeps Arabic rtl cases blocked on missing subtitle assets and rtl subtitle requirements", () => {
    const dialog = buildVoxyCocreationDialog({
      contributionRef: {
        id: "local-ar-1",
        title: "النص ما زال أوليًا",
        href: "/account",
      },
      sourceLanguage: "ar",
      readingLanguage: "de",
      uiLocale: "de",
      originalText: "نحتاج شيئًا أفضل.",
      summaryText: "Noch sehr knapp",
      sourcePresent: false,
      openQuestions: ["Was genau soll zuerst geklärt werden?"],
      uncertaintyNotes: ["source_needed", "review_first_only"],
      claimCount: 0,
      questionCount: 1,
      voxyBriefingState: "not_connected",
      surface: "account",
    });

    const model = buildVoxyRenderAssetProviderRegistryFromVoxyDialog(dialog, {
      contributionRef: dialog.contributionRef,
      nextStep: "Mit Quellen und Sprache weiter schärfen",
    });

    expect(model).not.toBeNull();
    expect(model?.languageRequirements.sourceLanguage).toBe("ar");
    expect(model?.languageRequirements.rtlRequired).toBe(true);
    expect(model?.providerRegistry.find((item) => item.id === "rtl_subtitles")?.status).toBe("requirement_only");
    expect(model?.assetInventory.find((item) => item.id === "subtitle_template")?.status).toBe("missing");
  });

  it("keeps English to French render reading layers review-first without fake export presets", () => {
    const model = buildVoxyRenderAssetProviderRegistryFromReviewContext(
      buildReviewContextFixture({
        sourceLanguage: "en",
        readingLanguage: "fr",
        originalText: "Which next step would actually be workable?",
        summaryText: "Cross-lingual neighborhood debate",
        openQuestions: ["What would count as a usable next step?"],
        claims: ["The next step should remain practical and review-first."],
      }),
      {
        audience: "admin",
        contributionRef: {
          id: "handoff-en-fr-1",
          title: "Cross-lingual neighborhood debate",
          href: "/create?resume=handoff-en-fr-1",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.languageRequirements.sourceLanguage).toBe("en");
    expect(model?.languageRequirements.readingLanguage).toBe("fr");
    expect(model?.assetInventory.find((item) => item.id === "export_preset")?.status).toBe("missing");
    expect(model?.providerRegistry.every((item) => item.executionAllowed === false)).toBe(true);
  });
});
