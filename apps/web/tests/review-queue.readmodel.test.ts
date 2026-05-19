import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionSignalDraftPersistence,
  createInMemoryRegionSourceConnectionRuntimeRepo,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
  setRegionSignalDraftPersistenceForTests,
  setRegionSourceConnectionRuntimeRepoForTests,
} from "@features/region";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier/server/studioPersistence";
import { buildReviewQueueReadModel } from "@features/reviewQueue";

const mocks = vi.hoisted(() => ({
  listCreatePrepareAttachDraftQueue: vi.fn(),
}));

vi.mock("@/features/create/attachDraftReviewQueue", () => ({
  listCreatePrepareAttachDraftQueue: (...args: unknown[]) =>
    mocks.listCreatePrepareAttachDraftQueue(...args),
}));

function participationRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "signal-open-1",
    regionId: "bezirk-berlin-reinickendorf",
    proposedRegionId: null,
    needsRegionReview: false,
    sourceClass: "participation",
    sourceType: "public_question",
    title: "Wie lösen wir die Schulsanierung im Bezirk?",
    summary: "Öffentliche Frage aus dem Anlassraum zur Schulsanierung.",
    publicSafeTitle: "Wie lösen wir die Schulsanierung im Bezirk?",
    publicSafeSummary: "Öffentliche Frage aus dem Anlassraum zur Schulsanierung.",
    detectedTopics: ["Bildung"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: ["anlassraum-1"],
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "needs_review",
    visibilityState: "public_unverified",
    confidence: 0.83,
    provenance: {
      sourceKind: "runtime",
      sourceCollection: "signals",
      sourceRefId: "signal-open-1",
      isFixture: false,
      isPilotFixture: false,
      notRealNews: false,
      notProductionData: false,
      notOfficial: true,
      notRepresentative: true,
    },
    createdAt: "2026-05-17T08:00:00.000Z",
    updatedAt: "2026-05-17T08:00:00.000Z",
    reviewedBy: null,
    reviewedAt: null,
    officialApproval: null,
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    ...overrides,
  };
}

describe("review queue readmodel", () => {
  beforeEach(async () => {
    mocks.listCreatePrepareAttachDraftQueue.mockResolvedValue({
      total: 1,
      items: [
        {
          draftId: "65f000000000000000000011",
          ctaId: "perspektive_anhaengen",
          matchType: "related_claim",
          matchEntityType: "claim",
          attachTargetType: "claim",
          attachTargetId: "claim-1",
          attachTargetLabel: "Create-Handoff Schulsanierung",
          sourceSummary: "Perspektive aus /create wartet auf manuelle Zuordnung.",
          reasons: ["Semantische Nähe"],
          duplicateRisk: false,
          requiresReview: true,
          reviewState: "pending",
          applyState: "not_applied",
          reviewNote: null,
          reviewedAt: null,
          reviewedBy: null,
          appliedAt: null,
          appliedBy: null,
          applyNote: null,
          applyError: null,
          version: 1,
          createdAt: "2026-05-17T11:00:00.000Z",
          updatedAt: "2026-05-17T11:00:00.000Z",
        },
      ],
    });

    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo({
        records: [
          participationRecord(),
          participationRecord({
            id: "signal-official-1",
            sourceType: "public_claim",
            title: "Sanierungsbedarf an Schulen ist bestätigt",
            summary: "Angenommenes Beteiligungssignal mit möglicher amtlicher Freigabe.",
            publicSafeTitle: "Sanierungsbedarf an Schulen ist bestätigt",
            publicSafeSummary: "Angenommenes Beteiligungssignal mit möglicher amtlicher Freigabe.",
            relatedAnlassraumIds: [],
            reviewStatus: "accepted",
            visibilityState: "public_reviewed",
            createdAt: "2026-05-17T09:00:00.000Z",
            updatedAt: "2026-05-17T09:00:00.000Z",
          }),
        ] as any,
      }),
    );

    const draftPersistence = createInMemoryRegionSignalDraftPersistence();
    await draftPersistence.saveRecord({
      id: "draft-record-dossier-1",
      uniqueKey: "region-signal-draft:bezirk-berlin-reinickendorf:dossier:signal-1",
      signalId: "signal-open-1",
      regionId: "bezirk-berlin-reinickendorf",
      draftId: "dossier-draft-1",
      draftType: "dossier",
      title: "Schulsanierung als Dossier-Entwurf",
      summary: "Reviewpflichtiger RegionSignalDraft aus Reinickendorf.",
      reviewStatus: "needs_review",
      createdByUserId: "user-1",
      createdByRole: "participation_officer",
      authoritySource: "verified_membership",
      adminFallback: false,
      relatedSignalIds: ["signal-open-1"],
      relatedTopics: ["Bildung"],
      relatedPlaces: ["Reinickendorf"],
      linkedTopicClusterIds: ["bildung"],
      openQuestions: ["Welche Standorte zuerst?"],
      guardrails: {
        noAutoPublish: true,
        noAutoVote: true,
        noAutoMandate: true,
        noTenderMonitoring: true,
        noProcurementMonitoring: true,
        reviewRequired: true,
      },
      provenance: {
        sourceSignalId: "signal-open-1",
        sourceRegionId: "bezirk-berlin-reinickendorf",
        createdFrom: "region_signal",
        sourceReviewStatus: "accepted",
        pilotFixture: false,
        notProductionData: false,
        notRealNews: false,
      },
      targetStatus: "draft",
      visibilityState: "internal_review",
      backingStore: "dossiers",
      createdAt: "2026-05-17T10:00:00.000Z",
      updatedAt: "2026-05-17T10:00:00.000Z",
    });
    setRegionSignalDraftPersistenceForTests(draftPersistence);

    const workspaceRepo = createInMemoryDossierStudioWorkspaceRepo();
    await workspaceRepo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier-1",
      regionId: "bezirk-berlin-reinickendorf",
      organizationId: "org-reinickendorf-1",
      source: "region_signal_draft",
      title: "Schulsanierung Studio",
      createdBy: "user-1",
      updatedBy: "user-1",
      seed: {
        status: "needs_review",
        audienceNotes: "Workspace für Verwaltung und Öffentlichkeit prüfen.",
        distributionDraft: {
          draftId: "distribution-1",
          dossierId: "dossier-1",
          packageId: "package-1",
          visibilityState: "internal_review",
          savedAt: "2026-05-17T10:30:00.000Z",
          status: "review_requested",
          scheduleMode: "manual",
          selectedChannels: ["website_embed"],
          reviewRequired: true,
          backlinkTarget: "/dossier/dossier-1",
          queue: [
            {
              id: "queue-1",
              channel: "website_embed",
              label: "Website",
              recommendedWindow: "Sobald Review abgeschlossen ist",
              status: "review_required",
              connectorStatus: "disabled_by_policy",
              actionLabel: "Review abschließen",
            },
          ],
          notes: ["Kein externes Posting."],
          externalPublish: false,
        },
      },
    });
    setDossierStudioWorkspaceRepoForTests(workspaceRepo);
    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo({
        results: [
          {
            id: "source-result-1",
            connectionId: "source-1",
            regionId: "bezirk-berlin-reinickendorf",
            connectionLabel: "Bezirksamt Reinickendorf News",
            sourceType: "municipal_news",
            adapterId: "productive_regional_source",
            resultMode: "dry_run",
            title: "Bezirksamt Reinickendorf News · Dry Run",
            summary: "Explizite URL vorbereitet und reviewpflichtig ausgewertet.",
            configuredUrl: "https://reinickendorf.example/aktuelles",
            detectedTopics: ["Schule", "Verkehr"],
            visibilityState: "internal_review",
            visibilityLabel: "reviewpflichtig",
            reviewStatus: "needs_review",
            confidence: 0.68,
            sourceSnapshotStatus: "fetched",
            sourceSnapshotTitle: "Schulsanierung in Reinickendorf",
            sourceSnapshotSummary: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit und Sanierungsbedarf.",
            sourceSnapshotExcerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
            possibleClaims: [
              {
                text: "Schulsanierung in Reinickendorf",
                confidence: 0.74,
                basisLabel: "Titel",
                excerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
                reviewRequired: true,
              },
            ],
            topicClusters: [
              {
                clusterKey: "bildung-schule",
                label: "Schule Reinickendorf",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                suggestedAction: "ask_clarifying_question",
                reviewStatus: "needs_review",
              },
            ],
            dossierSuggestions: [
              {
                title: "Berlin Reinickendorf: Schule",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                reviewStatus: "needs_review",
              },
            ],
            anlassraumSuggestions: [
              {
                title: "Schule Berlin Reinickendorf",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                reviewStatus: "needs_review",
              },
            ],
            evidenceReferences: [
              {
                label: "Seitenauszug · Schulsanierung in Reinickendorf",
                url: "https://reinickendorf.example/aktuelles",
                excerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
              },
            ],
            openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            affectedScope: {
              regionName: "Berlin Reinickendorf",
              detectedPlaces: ["Berlin Reinickendorf"],
              ortsteilHints: [],
              fachbereichHints: ["Schule/Bildung", "Schule", "Verkehr"],
            },
            reviewSuggestions: [
              {
                id: "region-intelligence-dossier-schule-reinickendorf",
                suggestionType: "dossier_suggestion",
                title: "Berlin Reinickendorf: Schule",
                summary: "1 Signal spricht für einen reviewpflichtigen Dossier-Vorschlag.",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                confidence: 0.68,
                reviewStatus: "needs_review",
                visibilityState: "internal_review",
                sourceCategories: ["productive"],
                sourceLabels: ["Bezirksamt Reinickendorf News"],
                sourceStatusLabel: "1 produktive Quelle verbunden",
              },
            ],
            reviewTaskSummary: {
              claimCount: 1,
              topicClusterCount: 1,
              dossierSuggestionCount: 1,
              anlassraumSuggestionCount: 1,
              openQuestionCount: 1,
              evidenceCount: 1,
              label: "1 mögliche Aussagen · 1 Themencluster · 1 Dossier-Vorschläge · 1 Anlassraum-Vorschläge · 1 offene Fragen",
            },
            createdAt: "2026-05-17T10:40:00.000Z",
            updatedAt: "2026-05-17T10:40:00.000Z",
            testedBy: "admin-1",
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
          },
        ],
      }),
    );
  });

  it("aggregates the existing review domains for the global operator queue", async () => {
    const readModel = await buildReviewQueueReadModel({
      mode: "global_operator",
      userId: "admin-1",
      isAdmin: true,
      visibleRegionIds: [],
      organizationIds: [],
      canApproveOfficial: true,
      governanceActor: {
        userId: "admin-1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: ["admin-1"],
        scopedEntityIds: ["admin-1"],
        personTrust: null,
      },
    });

    expect(readModel.summary.total).toBeGreaterThanOrEqual(6);
    expect(readModel.summary.byDomain).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ domain: "anlassraum_public_input" }),
        expect.objectContaining({ domain: "region_intelligence_suggestion" }),
        expect.objectContaining({ domain: "region_source_result" }),
        expect.objectContaining({ domain: "region_signal_draft" }),
        expect.objectContaining({ domain: "dossier_workspace" }),
        expect.objectContaining({ domain: "output_artifact" }),
        expect.objectContaining({ domain: "create_handoff" }),
        expect.objectContaining({ domain: "public_official_approval" }),
      ]),
    );
    expect(readModel.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "create_handoff",
          title: "Create-Handoff Schulsanierung",
        }),
        expect.objectContaining({
          domain: "public_official_approval",
          reviewAuthorityLabel: "Nur Publikationsfreigabe oder Admin-Fallback",
        }),
        expect.objectContaining({
          domain: "region_intelligence_suggestion",
          visibilityState: "internal_review",
        }),
        expect.objectContaining({
          domain: "region_source_result",
          title: "Bezirksamt Reinickendorf News · Dry Run",
          summary: expect.stringContaining("1 mögliche Aussagen"),
          contentReleaseWorkbench: expect.objectContaining({
            intro: expect.stringContaining("veröffentlichbare Inhalte"),
            targets: expect.arrayContaining([
              expect.objectContaining({
                targetType: "dossier",
                prepared: false,
                statusLabel: "Arbeitsstand",
              }),
              expect.objectContaining({
                targetType: "anlassraum",
                prepared: false,
                statusLabel: "Arbeitsstand",
              }),
            ]),
          }),
        }),
      ]),
    );
  });

  it("filters the queue to visible organization scope and excludes unscoped create handoffs", async () => {
    const readModel = await buildReviewQueueReadModel({
      mode: "organization",
      userId: "user-1",
      isAdmin: false,
      visibleRegionIds: ["bezirk-berlin-reinickendorf"],
      organizationIds: ["org-reinickendorf-1"],
      canApproveOfficial: false,
    });

    expect(readModel.items.some((item) => item.domain === "create_handoff")).toBe(false);
    expect(readModel.items.some((item) => item.domain === "public_official_approval")).toBe(false);
    expect(readModel.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "anlassraum_public_input",
          regionName: "Berlin Reinickendorf",
        }),
        expect.objectContaining({
          domain: "output_artifact",
          title: "Schulsanierung Studio · Distribution",
        }),
      ]),
    );
  });
});
