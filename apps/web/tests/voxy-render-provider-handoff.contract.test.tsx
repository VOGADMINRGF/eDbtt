import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";
import VoxyRenderProviderHandoffPanel from "@/features/create/VoxyRenderProviderHandoffPanel";
import {
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
  buildVoxyRenderProviderHandoffPacket,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyBriefingScriptCandidateFromReviewContext,
} from "@/features/create/voxyBriefingScriptCandidateContract";
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

describe("voxy render provider handoff contract", () => {
  it("builds a German review-first provider handoff without leaking raw adapter enums", () => {
    const context = buildReviewContextFixture({
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
    const model = buildVoxyRenderProviderHandoffFromReviewContext(context, {
      audience: "admin",
      contributionRef: {
        id: "handoff-1",
        title: "Sichere Schulwege",
        href: "/create?resume=handoff-1",
      },
    });

    expect(model).not.toBeNull();
    expect(model?.handoffStatus).toBe("blocked_by_provider");
    expect(model?.providerTargets.find((item) => item.id === "render_adapter")?.status).toBe("blocked");
    expect(model?.publicSafeLabel).toBe("Interner Handoff-Kandidat, kein Renderlauf");

    const html = renderToStaticMarkup(
      React.createElement(VoxyRenderProviderHandoffPanel, {
        model,
        dataTestId: "voxy-render-provider-handoff",
      }),
    );

    expect(html).toContain("Voxy Render/Provider Handoff");
    expect(html).toContain("Handoff-Paket");
    expect(html).toContain("Adapterpunkte");
    expect(html).toContain("Provider-Gate blockiert");
    expect(html).not.toContain("blocked_by_provider");
    expect(html).not.toContain("adapter_only");
  });

  it("keeps Turkish to German handoffs multilingual and review-first", () => {
    const model = buildVoxyRenderProviderHandoffFromReviewContext(
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
    expect(model?.scriptLanguage).toBe("de");
    expect(model?.handoffSignals.map((item) => item.id)).toContain("multilingual_review_needed");
    expect(model?.translationIsEvidence).toBe(false);
  });

  it("keeps Arabic rtl handoffs in a human-loop state instead of pretending provider truth", () => {
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
      maxCards: 3,
    });
    const model = buildVoxyRenderProviderHandoffFromVoxyDialog(dialog, {
      contributionRef: dialog.contributionRef,
      nextStep: "Beitrag konkretisieren",
    });

    expect(model).not.toBeNull();
    expect(model?.rtlDisplayHint).toBe(true);
    expect(model?.handoffStatus).toBe("needs_human_input");
    expect(model?.handoffSignals.map((item) => item.id)).toContain("provider_mapping_missing");
    expect(model?.noProviderCall).toBe(true);
  });

  it("builds an adapter-only packet from the script candidate without triggering runtime work", () => {
    const context = buildReviewContextFixture();
    const model = buildVoxyRenderProviderHandoffFromReviewContext(context, {
      audience: "admin",
      contributionRef: {
        id: "handoff-1",
        title: "Sichere Schulwege",
        href: "/create?resume=handoff-1",
      },
    });
    const scriptModel = buildVoxyBriefingScriptCandidateFromReviewContext(context, {
      audience: "admin",
      contributionRef: {
        id: "handoff-1",
        title: "Sichere Schulwege",
        href: "/create?resume=handoff-1",
      },
    });
    const packet = buildVoxyRenderProviderHandoffPacket({
      model,
      scriptModel,
      briefingId: "briefing-packet-1",
    });

    expect(packet).not.toBeNull();
    expect(packet?.providerInterface).toBe("adapter_only");
    expect(packet?.segmentCount).toBeGreaterThan(0);
    expect(packet?.noProviderCall).toBe(true);
    expect(packet?.noRenderTrigger).toBe(true);
    expect(packet?.noPublishTrigger).toBe(true);
  });
});
