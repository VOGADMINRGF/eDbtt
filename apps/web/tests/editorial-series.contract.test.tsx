import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import {
  buildDossierWorkspaceReviewSurface,
} from "@/features/create/dossierWorkspaceReviewSurfaceContract";
import {
  buildUnifiedReviewQueueItemFromSocialOutputDraft,
} from "@/features/create/unifiedReviewQueueContract";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import EditorialSeriesPanel from "@/features/editorialSeries/EditorialSeriesPanel";
import {
  buildEditorialSeriesFromEditorialQueue,
  buildEditorialSeriesFromReviewContext,
  buildEditorialSeriesFromThemenradar,
  describeEditorialQueueSeriesStatus,
} from "@/features/editorialSeries/editorialSeriesContract";
import {
  generateThemenradarContentPrep,
} from "@features/themenradar/contentPrep";
import { resolveThemenradarMembershipEntry } from "@features/themenradar/membershipCta";

function buildThemenradarItem() {
  return {
    id: "thema_77",
    title: "Schulwege und Quartier",
    rawSignal: "Mehrere Hinweise aus Elternschaft, Bezirk und Kiezrat.",
    sourceType: "community" as const,
    heatScore: 74,
    everydayRelevanceScore: 78,
    polarizationScore: 48,
    membershipPotentialScore: 66,
    jurisdiction: "kommune" as const,
    lifecycleStatus: "review_ready" as const,
    linkedAnlassraumId: "anlass_77",
    linkedDossierId: "dossier_77",
    campaignKey: "schulwege-quartier",
    shareContractSnapshot: {
      canonicalPublicTarget: "/themen/schulwege",
      qrTarget: "/campaign/schulwege",
      socialPublication: {
        autoPostEligible: false as const,
        needsReviewBeforeOfficialSocial: true as const,
        shareReady: true,
        qualification: "review_ready_candidate",
      },
      shareMeta: {
        shareTitle: "Schulwege",
        sharePrompt: "Was ist jetzt zu prüfen?",
        shareSummary: "Review-first Hinweis",
      },
    } as any,
    telemetrySnapshot: null,
    reviewRequired: true as const,
    autoPostEligible: false as const,
    officialSocialRequiresReview: true as const,
    createdBy: "admin-1",
    updatedBy: "admin-1",
    lastReviewedBy: "admin-1",
    lastReviewedAt: "2026-07-12T08:00:00.000Z",
    reviewNotes: [],
    auditVersion: 2,
    archivedAt: null,
    archivedBy: null,
    createdAt: "2026-07-12T07:30:00.000Z",
    updatedAt: "2026-07-12T08:00:00.000Z",
  };
}

function buildReviewContext(): V3ReviewQueueWiringContext {
  const sourcePack = buildCanonicalSourcePack({
    sourcePackId: "sp-1",
    sources: [
      { sourceId: "s-1", title: "Bezirksausschuss", evidenceState: "supported" },
      { sourceId: "s-2", title: "Elternvertretung", evidenceState: "partial" },
    ],
    openGaps: ["Welche Schulwege wurden bereits geprüft?"],
  });
  const socialDraft = buildDossierSocialOutputDraft({
    draftId: "draft-1",
    dossierId: "dossier-1",
    kind: "newsletter_draft",
    title: "Newsletter Entwurf",
    summary: "Wöchentlicher Review-Export für das Dossier.",
    sourcePack,
    trustState: "supported",
    preparationStatus: "publish_ready",
  });
  const unified = buildUnifiedReviewQueueItemFromSocialOutputDraft(socialDraft);

  return {
    primaryUnifiedItem: unified,
    unifiedItems: [unified],
    sourcePack,
    languageBridge: null,
    multilingualThread: null,
    multilingualEvidence: null,
    participationCandidates: [],
    crossLingualSuggestions: [],
    socialOutputDrafts: [socialDraft],
    dossierWorkspaceSurface: buildDossierWorkspaceReviewSurface({
      dossierId: "dossier-1",
      title: "Schulwege und Prioritäten",
      state: "publish_ready",
      approvalGranted: true,
      claims: ["Sichere Schulwege priorisieren."],
      counterPositions: ["Lieferverkehr braucht ebenfalls Platz."],
      openQuestions: ["Welche Kreuzungen sind zuerst kritisch?"],
      socialOutputDrafts: ["Newsletter Entwurf"],
      sourcePack,
      trustState: "supported",
      reviewQueueItems: [unified],
    }),
    voxyBriefing: null,
    voxyScriptSegments: [],
    voxyReviewState: null,
    voxyRenderJob: null,
    voxyPublishDraft: null,
  };
}

describe("editorial series contract", () => {
  it("builds a review-first Themenradar series without publication claims", () => {
    const item = buildThemenradarItem();
    const contentPrep = generateThemenradarContentPrep(item as any);
    const membershipEntry = resolveThemenradarMembershipEntry({
      id: item.id,
      title: item.title,
      membershipPotentialScore: item.membershipPotentialScore,
    });

    const model = buildEditorialSeriesFromThemenradar({
      item: item as any,
      contentPrep,
      membershipEntry,
    });

    expect(model.currentStage).toBe("review_ready");
    expect(model.noAutoPublish).toBe(true);
    expect(model.noTracking).toBe(true);
    expect(model.routeHints).toContain("/admin/themenradar/thema_77");
    expect(model.reviewGates).toContain(
      "Kein Auto-Publish, kein Tracking und kein Social Posting.",
    );

    const html = renderToStaticMarkup(
      React.createElement(EditorialSeriesPanel, {
        model,
        dataTestId: "editorial-series",
      }),
    );

    expect(html).toContain("Review-ready ist nicht approved_for_export. approved_for_export ist nicht publish_ready oder published.");
    expect(html).toContain("Kampagnenkontext: schulwege-quartier");
  });

  it("maps dossier review/export context to an approved but still non-published series stage", () => {
    const model = buildEditorialSeriesFromReviewContext(buildReviewContext(), {
      audience: "workspace",
      dossierRef: {
        id: "dossier-1",
        title: "Schulwege und Prioritäten",
        href: "/dossier/dossier-1/studio",
      },
    });

    expect(model).not.toBeNull();
    expect(model?.currentStage).toBe("approved");
    expect(model?.exportFormats).toContain("Newsletter");
    expect(model?.routeHints).toContain("/dossier/dossier-1/studio");
    expect(model?.episodes[1]?.focus).toContain("Sichere Schulwege priorisieren.");

    const html = renderToStaticMarkup(
      React.createElement(EditorialSeriesPanel, {
        model,
        title: "Editorial-Series-Arbeitsstand im Studio",
        dataTestId: "editorial-series-studio",
      }),
    );

    expect(html).toContain("Editorial-Series-Arbeitsstand im Studio");
    expect(html).toContain("Freigabe und Veröffentlichung bleiben getrennte Schritte.");
    expect(html).toContain("Newsletter");
  });

  it("maps editorial queue statuses onto the same review-first series semantics", () => {
    const ready = describeEditorialQueueSeriesStatus("ready");
    const review = describeEditorialQueueSeriesStatus("review");
    const archived = describeEditorialQueueSeriesStatus("archived");

    expect(review.label).toBe("Review-ready");
    expect(ready.label).toBe("Approved");
    expect(archived.label).toBe("Archiviert");

    const model = buildEditorialSeriesFromEditorialQueue({
      statusFilter: "ready",
      items: [
        {
          id: "item-1",
          status: "ready",
          title: "Schulwege",
          summary: "Bereit für bewusste Freigabe.",
          topicKey: "mobilitaet",
          ownerUserId: "owner-1",
          updatedAt: "2026-07-12T10:00:00.000Z",
        },
      ],
    });

    expect(model.currentStage).toBe("approved");
    expect(model.reviewGates).toContain(
      "Kein Auto-Publish, kein Social Posting und kein Scheduling.",
    );
    expect(model.routeHints).toContain("/admin/editorial/queue");
  });
});
