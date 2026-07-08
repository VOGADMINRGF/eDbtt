import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";
import VoxyBriefingScriptCandidatePanel from "@/features/create/VoxyBriefingScriptCandidatePanel";
import {
  buildVoxyBriefingScriptCandidateFromReviewContext,
  buildVoxyBriefingScriptCandidateFromVoxyDialog,
  buildVoxyVideoSegmentsFromScriptCandidate,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import { buildVoxyCocreationDialog } from "@/features/create/voxyCocreationDialogContract";
import {
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
  withBriefing?: boolean;
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
  const voxyBriefing = input?.withBriefing
    ? buildVoxyVideoBriefing({
        briefingId: "briefing-1",
        sourceContextKind: "dossier",
        sourceContextId: "dossier-1",
        title: "Sichere Schulwege · Voxy-Briefing",
        summary: "Nur als interner Briefing-Entwurf sichtbar.",
        languageBridge,
        sourcePack,
      })
    : null;

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
    voxyReviewState: null,
    voxyRenderJob: input?.withBriefing
      ? resolveVoxyRenderJob({
          briefingId: "briefing-1",
          approvalGranted: true,
          providerConfigured: false,
        })
      : null,
    voxyPublishDraft: null,
  } as any;
}

describe("voxy briefing script candidate contract", () => {
  it("builds a German review-first script candidate without leaking raw enums", () => {
    const model = buildVoxyBriefingScriptCandidateFromReviewContext(
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
    expect(model?.scriptLanguage).toBe("de");
    expect(model?.scriptFormat).toBe("poll_explainer");
    expect(model?.publicSafeLabel).toBe("Interner Script-Kandidat, noch kein Video");

    const html = renderToStaticMarkup(
      React.createElement(VoxyBriefingScriptCandidatePanel, {
        model,
        dataTestId: "voxy-briefing-script",
      }),
    );

    expect(html).toContain("Voxy-Briefing vorbereiten");
    expect(html).toContain("Script-Kandidat, noch kein Video");
    expect(html).toContain("Script-Segmente");
    expect(html).not.toContain("script_preview");
    expect(html).not.toContain("translation_misread_risk");
  });

  it("marks Turkish to German briefings as multilingual review candidates", () => {
    const model = buildVoxyBriefingScriptCandidateFromReviewContext(
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
    expect(model?.scriptFormat).toBe("multilingual_bridge_note");
    expect(model?.scriptRisks.map((item) => item.id)).toContain("translation_misread_risk");
    expect(model?.readinessSignals.map((item) => item.id)).toContain("multilingual_review_needed");
    expect(model?.translationIsEvidence).toBe(false);
  });

  it("keeps Arabic low-context input internal and shows the rtl hint", () => {
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

    const model = buildVoxyBriefingScriptCandidateFromVoxyDialog(dialog, {
      contributionRef: dialog.contributionRef,
      nextStep: "Beitrag weiter schärfen",
    });

    expect(model).not.toBeNull();
    expect(model?.rtlDisplayHint).toBe(true);
    expect(model?.publicSafeLabel).toBe("Interner Script-Kandidat, noch kein Video");
    expect(model?.readinessSignals.map((item) => item.id)).toContain("multilingual_review_needed");

    const html = renderToStaticMarkup(
      React.createElement(VoxyBriefingScriptCandidatePanel, {
        model,
        dataTestId: "voxy-briefing-script-ar",
      }),
    );

    expect(html).toContain("RTL-Hinweis aktiv");
    expect(html).toContain("Interner Script-Kandidat, noch kein Video");
  });

  it("aligns the script candidate with voxyVideo segments without binding a provider", () => {
    const model = buildVoxyBriefingScriptCandidateFromReviewContext(
      buildReviewContextFixture({
        sourceLanguage: "en",
        readingLanguage: "fr",
        originalText: "Safer school routes need a fair local explanation.",
        summaryText: "Pont multilingue pour le dossier",
        claims: ["Safe school routes need a fair explanation."],
        withBriefing: true,
      }),
      {
        audience: "workspace",
        contributionRef: {
          id: "handoff-en-1",
          title: "Safe school routes",
          href: "/create?resume=handoff-en-1",
        },
      },
    );

    const segments = buildVoxyVideoSegmentsFromScriptCandidate({
      model,
      briefingId: "briefing-aligned-1",
    });

    expect(model).not.toBeNull();
    expect(model?.scriptLanguage).toBe("fr");
    expect(model?.translationIsEvidence).toBe(false);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every((segment) => segment.reviewRequired)).toBe(true);
  });
});
