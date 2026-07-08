import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";
import VoxyRenderPreflightReadinessPanel from "@/features/create/VoxyRenderPreflightReadinessPanel";
import {
  buildVoxyRenderPreflightReadinessFromReviewContext,
  buildVoxyRenderPreflightReadinessFromVoxyDialog,
} from "@/features/create/voxyRenderPreflightReadinessContract";
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

describe("voxy render preflight readiness contract", () => {
  it("builds a German review-first preflight without leaking raw runtime enums", () => {
    const model = buildVoxyRenderPreflightReadinessFromReviewContext(
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
    expect(model?.preflightStatus).toBe("keep_as_script_only");
    expect(model?.providerSelectionStatus).toBe("configuration_needed");
    expect(model?.costStatus).toBe("estimate_needed");
    expect(model?.publicSafeLabel).toBe("Noch kein Rendering");
    expect(model?.noProviderExecution).toBe(true);
    expect(model?.noCostDebit).toBe(true);

    const html = renderToStaticMarkup(
      React.createElement(VoxyRenderPreflightReadinessPanel, {
        model,
        dataTestId: "voxy-render-preflight-readiness",
      }),
    );

    expect(html).toContain("Render-Preflight");
    expect(html).toContain("Warum noch nicht gerendert wird");
    expect(html).toContain("Asset-Status");
    expect(html).toContain("Provider");
    expect(html).toContain("Kosten &amp; Credits");
    expect(html).toContain("Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.");
    expect(html).not.toContain("keep_as_script_only");
    expect(html).not.toContain("configuration_needed");
  });

  it("keeps Turkish source language separate from the German render reading layer", () => {
    const model = buildVoxyRenderPreflightReadinessFromReviewContext(
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
    expect(model?.sourceLanguage).toBe("tr");
    expect(model?.readingLanguage).toBe("de");
    expect(model?.scriptLanguage).toBe("de");
    expect(model?.translationIsEvidence).toBe(false);
    expect(model?.requiredCapabilities.map((item) => item.id)).toContain("multilingual_voice");
    expect(model?.reviewReadiness.find((item) => item.id === "languageReview")?.status).toBe("needs_review");
  });

  it("keeps Arabic rtl cases blocked on language review instead of pretending render readiness", () => {
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

    const model = buildVoxyRenderPreflightReadinessFromVoxyDialog(dialog, {
      contributionRef: dialog.contributionRef,
      nextStep: "Mit Quellen und Sprache weiter schärfen",
    });

    expect(model).not.toBeNull();
    expect(model?.sourceLanguage).toBe("ar");
    expect(model?.rtlPreflightHint).toContain("RTL");
    expect(model?.preflightStatus).toBe("keep_as_script_only");
    expect(model?.requiredCapabilities.map((item) => item.id)).toContain("rtl_subtitles");
    expect(model?.reviewReadiness.find((item) => item.id === "languageReview")?.status).toBe("needs_review");
  });
});
