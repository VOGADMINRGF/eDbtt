import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import V3VoxyCocreationDialog from "@/features/create/V3VoxyCocreationDialogPanel";
import {
  buildVoxyCocreationDialog,
  buildVoxyCocreationDialogFromReviewContext,
} from "@/features/create/voxyCocreationDialogContract";

describe("voxy cocreation dialog contract", () => {
  it("builds respectful multilingual prompts for a Turkish original with German reading mode", () => {
    const model = buildVoxyCocreationDialog({
      contributionRef: {
        id: "contribution-1",
        title: "Okul yolu güvenliği",
      },
      sourceLanguage: "tr",
      readingLanguage: "de",
      uiLocale: "de",
      originalText: "Okul yolunda çocuklar için güvenli geçiş istiyoruz.",
      translationText: "Wir wollen sichere Querungen für Kinder auf dem Schulweg.",
      summaryText: "Sicherer Schulweg",
      sourcePresent: false,
      openQuestions: ["Welcher Ort zeigt das Problem am deutlichsten?"],
      uncertaintyNotes: ["source_needed"],
      claimCount: 1,
      maxCards: 5,
      surface: "create",
    });

    expect(model).toMatchObject({
      sourceLanguage: "tr",
      readingLanguage: "de",
      translationAvailable: true,
      originalPreserved: true,
      noManipulation: true,
    });
    expect(model?.cards.some((card) => card.userVisibleQuestion.includes("deutsche Lesefassung"))).toBe(true);
    expect(model?.cards.every((card) => card.originalPreserved)).toBe(true);
  });

  it("marks rtl contexts without replacing the Arabic original", () => {
    const model = buildVoxyCocreationDialog({
      sourceLanguage: "ar",
      readingLanguage: "de",
      uiLocale: "de",
      originalText: "نحتاج إلى معابر آمنة للأطفال قرب المدرسة.",
      translationText: "Wir brauchen sichere Querungen für Kinder nahe der Schule.",
      sourcePresent: false,
      uncertaintyNotes: ["translation_uncertain", "source_needed"],
      claimCount: 1,
      surface: "create",
    });

    expect(model).toMatchObject({
      rtl: true,
      sourceLanguage: "ar",
      readingLanguage: "de",
      translationAvailable: true,
      originalPreserved: true,
    });
    expect(model?.cards[0]?.languageDisplay).toContain("RTL-Hinweis aktiv");
    expect(model?.cards.some((card) => card.translationDisplay.includes("Lesehilfe"))).toBe(true);
  });

  it("keeps blocked briefing follow-ups honest in review-context projections", () => {
    const model = buildVoxyCocreationDialogFromReviewContext(
      {
        primaryUnifiedItem: null,
        unifiedItems: [],
        sourcePack: {
          sourcePackId: "source-pack-1",
          sources: [],
          openGaps: ["source_needed"],
          reviewState: "review_required",
          reviewRequired: true,
          autoPublish: false,
        },
        languageBridge: {
          languageContext: {
            sourceLanguage: "fr",
            contentLanguage: "de",
            uiLocale: "de",
          },
          original: {
            language: "fr",
            text: "Il faut une meilleure explication pour les familles concernées.",
            preserved: true,
          },
          translation: {
            language: "de",
            text: "Es braucht eine bessere Erklärung für betroffene Familien.",
            state: "available",
            replacesOriginal: false,
            rtl: false,
          },
          summary: {
            language: "de",
            text: "Bessere Erklärung für betroffene Familien",
            replacesOriginal: false,
            replacesSource: false,
          },
          voxyClassification: {
            language: "de",
            text: "Familien / Erklärung",
            reviewRequired: true,
          },
          sourceGrounding: {
            trustState: "source_needed",
            sourcePresent: false,
            summaryReplacesSource: false,
          },
          openQuestions: ["Welche Quelle oder Beobachtung liegt zugrunde?"],
          uncertaintyNotes: ["source_needed"],
          reviewRequired: true,
          autoPublish: false,
        },
        multilingualThread: null,
        multilingualEvidence: null,
        participationCandidates: [],
        crossLingualSuggestions: [],
        socialOutputDrafts: [],
        dossierWorkspaceSurface: {
          dossierId: "dossier-1",
          title: "Familienhilfe",
          state: "review",
          preparationStatus: "review_ready",
          publishGuard: {
            autoPublish: false,
            reviewRequired: true,
            publicOutputAllowed: false,
            publishActionEnabled: false,
            externalSocialApiTriggered: false,
          },
          guardrails: {
            noAutoPublish: true,
            noAutoDossierFinal: true,
            noAutoSocialPosting: true,
            reviewRequired: true,
          },
          sections: {
            claims: ["Familien brauchen bessere Erklärungen."],
            counterPositions: [],
            openQuestions: ["Welche Quelle oder Beobachtung liegt zugrunde?"],
            formatRecommendations: [],
            participationCandidates: [],
            socialOutputDrafts: [],
            voxyBriefingCandidates: [],
          },
          sourcePack: {
            sourcePackId: null,
            sourceCount: 0,
            reviewState: "review_required",
          },
          trustLayer: {
            trustState: "source_needed",
            visibleAsAdvice: true,
          },
          reviewQueueItems: [],
        },
        voxyBriefing: {
          briefingId: "briefing-1",
          sourceContextKind: "dossier",
          sourceContextId: "dossier-1",
          title: "Briefing",
          summary: "Nur Kandidat",
          languageBridge: null,
          sourcePack: null,
          trustState: "source_needed",
          reviewRequired: true,
          autoPublish: false,
        } as any,
        voxyScriptSegments: [],
        voxyReviewState: null,
        voxyRenderJob: {
          briefingId: "briefing-1",
          status: "blocked_by_runtime_truth",
          provider: null,
          providerJobId: null,
          renderUrl: null,
          reviewRequired: true,
          autoPublish: false,
          missingRuntimeTruth: ["runtime_missing"],
        } as any,
        voxyPublishDraft: null,
      },
      {
        contributionRef: {
          id: "review-item-1",
          title: "Familienhilfe",
        },
        surface: "admin",
      },
    );

    expect(model?.status).toBe("needs_user_input");
    expect(model?.cards.some((card) => card.status === "blocked_by_runtime_truth")).toBe(true);
    expect(model?.cards.some((card) => card.userVisibleReason.includes("kein Chat"))).toBe(true);
  });

  it("renders user-facing labels instead of raw status enums", () => {
    const model = buildVoxyCocreationDialog({
      sourceLanguage: "de",
      readingLanguage: "de",
      uiLocale: "de",
      originalText: "Wir brauchen sichere Schulwege.",
      sourcePresent: false,
      uncertaintyNotes: ["source_needed"],
      claimCount: 1,
      surface: "account",
    });

    const html = renderToStaticMarkup(
      React.createElement(V3VoxyCocreationDialog, {
        model,
        dataTestId: "voxy-cocreation-contract",
      }),
    );

    expect(html).toContain('data-testid="voxy-cocreation-contract"');
    expect(html).toContain("Mit Voxy weiterdenken");
    expect(html).toContain("Menschliche Ergänzung offen");
    expect(html).toContain("Noch nicht beantwortet");
    expect(html).toContain("Welche Quelle, Erfahrung oder Beobachtung stützt deine Einschätzung?");
    expect(html).toContain("Kein Auto-Publish");
  });
});
