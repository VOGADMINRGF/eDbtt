import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import ParticipationActivationReviewPanel from "@/features/create/ParticipationActivationReviewPanel";
import {
  buildParticipationActivationReviewFromReviewContext,
  buildParticipationActivationReviewFromVoxyDialog,
} from "@/features/create/participationActivationReviewContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
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
    primaryUnifiedItem: null,
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
    socialOutputDrafts: [],
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

describe("participation activation review contract", () => {
  it("suggests a multilingual roundtable for cross-lingual review needs", () => {
    const model = buildParticipationActivationReviewFromReviewContext(
      buildReviewContextFixture({
        sourceLanguage: "tr",
        readingLanguage: "de",
        originalText:
          "Aileler ve kiracılar için güvenli okul yolları gerekiyor, ama hangi çözüm önce gelmeli?",
        openQuestions: ["Familien und Mieter:innen in beiden Sprachen einbeziehen?"],
        claims: ["Sichere Schulwege betreffen Familien und Mieter:innen."],
        participationCandidate: {
          recommendation: "comment_thread",
          title: "Mehrsprachige Beteiligung",
          prompt: "Wie soll die Diskussion sprachübergreifend geführt werden?",
        },
      }),
      {
        audience: "admin",
        contributionRef: {
          id: "handoff-1",
          title: "Schulwege in zwei Sprachen",
          href: "/create?resume=handoff-1",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.suggestedFormat).toBe("multilingual_roundtable");
    expect(model?.sourceLanguage).toBe("tr");
    expect(model?.readingLanguage).toBe("de");
    expect(model?.translationIsEvidence).toBe(false);
    expect(model?.readinessSignals.map((item) => item.id)).toContain(
      "multilingual_review_needed",
    );
    expect(model?.riskFlags.map((item) => item.id)).toContain(
      "multilingual_misread_risk",
    );
  });

  it("keeps low-context Arabic input in guided refinement with rtl hint", () => {
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

    const model = buildParticipationActivationReviewFromVoxyDialog(dialog, {
      contributionRef: {
        id: "local-1",
        title: "Arabischer Entwurf",
        href: "/account",
      },
    });

    expect(model).not.toBeNull();
    expect(model?.rtlDisplayHint).toBe(true);
    expect(model?.suggestedFormat).toBe("voxy_guided_refinement");
    expect(model?.activationStatus).toBe("needs_source_review");
    expect(model?.translationIsEvidence).toBe(false);
  });

  it("derives a source review instead of a poll when claims and sources are still open", () => {
    const model = buildParticipationActivationReviewFromReviewContext(
      buildReviewContextFixture({
        originalText:
          "Die Verwaltung muss jetzt handeln, aber die Ursachen und Folgen sind noch umstritten.",
        openQuestions: [
          "Welche Quelle stützt die Behauptung?",
          "Wie belastbar sind die bisherigen Zahlen?",
        ],
        sourceGaps: ["source_needed", "context_missing"],
        claims: [
          "Die bisherigen Zahlen zur Belastung sind unvollständig.",
          "Ohne Prüfung könnte die Öffentlichkeit den Stand missverstehen.",
        ],
        counterPositions: ["Lieferverkehr und Gewerbezugang müssen mitgedacht werden."],
        participationCandidate: {
          recommendation: "poll",
          title: "Priorität abfragen",
          prompt: "Welche Maßnahme soll zuerst kommen?",
          options: ["Querung", "Tempo 30"],
        },
      }),
      {
        audience: "workspace",
        dossierRef: {
          id: "dossier-1",
          title: "Schulwege und Prioritäten",
          href: "/dossier/dossier-1/studio",
        },
        contributionRef: {
          id: "handoff-2",
          title: "Sichere Schulwege",
          href: "/create?resume=handoff-2",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.suggestedFormat).toBe("source_review");
    expect(model?.activationStatus).toBe("needs_source_review");
    expect(model?.downstreamReadiness.find((item) => item.id === "poll")?.status).toBe(
      "needs_review",
    );

    const html = renderToStaticMarkup(
      React.createElement(ParticipationActivationReviewPanel, {
        model,
        dataTestId: "participation-activation-review",
      }),
    );

    expect(html).toContain("Beteiligungsraum vorbereiten");
    expect(html).toContain("Vorschlag, nicht aktiviert");
    expect(html).toContain("Quellen-Review");
    expect(html).toContain("Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.");
    expect(html).not.toContain("source_review");
    expect(html).not.toContain("poll_preparation");
  });
});
