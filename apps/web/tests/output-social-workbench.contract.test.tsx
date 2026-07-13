import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import OutputSocialWorkbenchPanel from "@/features/create/OutputSocialWorkbenchPanel";
import {
  buildOutputSocialWorkbenchFromReviewContext,
  buildOutputSocialWorkbenchFromVoxyDialog,
} from "@/features/create/outputSocialWorkbenchContract";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";
import { buildVoxyCocreationDialog } from "@/features/create/voxyCocreationDialogContract";

function buildReviewContextFixture(input?: {
  sourceLanguage?: string;
  readingLanguage?: string;
  originalText?: string;
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
    summaryText: input?.claims?.[0] ?? "Sichere Schulwege priorisieren.",
    openQuestions: input?.openQuestions ?? [],
    trustState: "source_needed",
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
    multilingualEvidence: null,
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
    voxyBriefing: null,
    voxyScriptSegments: [],
    voxyReviewState: null,
    voxyRenderJob: null,
    voxyPublishDraft: null,
  } as any;
}

describe("output social workbench contract", () => {
  it("keeps cross-lingual output drafts review-first and marks translation risk", () => {
    const model = buildOutputSocialWorkbenchFromReviewContext(
      buildReviewContextFixture({
        sourceLanguage: "tr",
        readingLanguage: "de",
        originalText:
          "Aileler için hangi önlem önce gelmeli?",
        openQuestions: ["Welche Gruppen in beiden Sprachen müssen einbezogen werden?"],
        claims: ["Sichere Schulwege betreffen Familien und Mieter:innen."],
        participationCandidate: {
          recommendation: "poll",
          title: "Prioritäten mehrsprachig prüfen",
          prompt: "Welche Maßnahme soll zuerst kommen?",
          options: ["Sicherere Querungen", "Tempo 30", "Mehr Schulbusse"],
        },
      }),
      {
        audience: "admin",
        contributionRef: {
          id: "handoff-1",
          title: "Mehrsprachige Schulwege",
          href: "/create?resume=handoff-1",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.outputLanguage).toBe("de");
    expect(model?.translationIsEvidence).toBe(false);
    expect(model?.copyRisks.map((item) => item.id)).toContain(
      "translation_misread_risk",
    );
    expect(model?.readinessSignals.map((item) => item.id)).toContain(
      "multilingual_review_needed",
    );

    const html = renderToStaticMarkup(
      React.createElement(OutputSocialWorkbenchPanel, {
        model,
        dataTestId: "output-social-workbench",
      }),
    );

    expect(html).toContain("Ausgabe vorbereiten");
    expect(html).toContain("Vorschlag, nicht veröffentlicht");
    expect(html).toContain("Review-ready ist nicht approved_for_export.");
    expect(html).toContain("approved_for_export ist nicht publish_ready oder published.");
    expect(html).toContain("Mögliche Ausgabeformate");
    expect(html).not.toContain("output_preview");
    expect(html).not.toContain("translation_misread_risk");
  });

  it("maps existing output drafts into the workbench without claiming publication", () => {
    const model = buildOutputSocialWorkbenchFromReviewContext(
      buildReviewContextFixture({
        claims: ["Sichere Schulwege priorisieren."],
        socialDrafts: [
          {
            kind: "newsletter_draft",
            title: "Newsletter Entwurf",
            summary: "Nur als interner Entwurf sichtbar.",
          },
          {
            kind: "linkedin_draft",
            title: "LinkedIn Entwurf",
            summary: "Noch nicht gepostet.",
          },
        ],
      }),
      {
        audience: "workspace",
        dossierRef: {
          id: "dossier-1",
          title: "Schulwege und Prioritäten",
          href: "/dossier/dossier-1/studio",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.draftItems.some((item) => item.channelLabel === "Newsletter")).toBe(true);
    expect(model?.draftItems.some((item) => item.channelLabel === "LinkedIn")).toBe(true);
    expect(model?.downstreamReadiness.find((item) => item.id === "newsletter")?.status).toBe(
      "needs_review",
    );
    expect(model?.publicSafeLabel).toBe("Vorschlag, nicht veröffentlicht");
  });

  it("keeps low-context Arabic input as internal output work with rtl hint", () => {
    const dialog = buildVoxyCocreationDialog({
      contributionRef: {
        id: "local-1",
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

    const model = buildOutputSocialWorkbenchFromVoxyDialog(dialog, {
      contributionRef: {
        id: "local-1",
        title: "Arabischer Entwurf",
        href: "/account",
      },
    });

    expect(model).not.toBeNull();
    expect(model?.rtlDisplayHint).toBe(true);
    expect(model?.outputStatus).toBe("needs_source_review");
    expect(model?.outputFormats).toContain("keep_internal_draft");
    expect(model?.noSocialPostAction).toBe(true);
  });
});
