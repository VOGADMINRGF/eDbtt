import { beforeEach, describe, expect, it } from "vitest";
import {
  archiveVisibleContent,
  createInMemoryContentReleaseWorkbenchRepo,
  getContentReleaseTargetRecord,
  makeContentVisible,
  prepareContentReleaseTargetFromSourceResult,
  setContentReleaseWorkbenchRepoForTests,
} from "@features/contentReleaseWorkbench";
import {
  applyReviewQueueOperation,
  createInMemoryReviewQueueOperationRepo,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";
import {
  getUnifiedAuditTrailForItem,
  getUnifiedAuditTrailForOrganization,
  listUnifiedAuditEvents,
} from "@features/unifiedAuditReadside";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionSourceConnectionRuntimeRepo,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
  setRegionSourceConnectionRuntimeRepoForTests,
} from "@features/region";
import { buildRegionScopeContext } from "@features/region/scope";

function sourceResult(overrides: Record<string, unknown> = {}) {
  return {
    id: "source-result-1",
    connectionId: "source-1",
    regionId: "bezirk-berlin-reinickendorf",
    organizationId: "org-reinickendorf-1",
    connectionLabel: "Bezirksamt Reinickendorf News",
    sourceType: "municipal_news",
    adapterId: "productive_regional_source",
    resultMode: "dry_run",
    title: "Bezirksamt Reinickendorf News · Dry Run",
    summary: "Explizite URL vorbereitet und reviewpflichtig ausgewertet.",
    configuredUrl: "https://reinickendorf.example/aktuelles",
    detectedTopics: ["Schule"],
    visibilityState: "internal_review",
    visibilityLabel: "reviewpflichtig",
    reviewStatus: "needs_review",
    confidence: 0.68,
    sourceSnapshotStatus: "fetched",
    sourceSnapshotTitle: "Schulsanierung in Reinickendorf",
    sourceSnapshotSummary: "Quelle mit reviewpflichtigem Inhalt.",
    sourceSnapshotExcerpt: "Quelle mit reviewpflichtigem Inhalt.",
    sourceSnapshotTemplate: null,
    possibleClaims: [],
    topicClusters: [],
    dossierSuggestions: [],
    anlassraumSuggestions: [],
    evidenceReferences: [],
    openQuestions: ["Welche Standorte zuerst?"],
    affectedScope: {
      regionName: "Berlin Reinickendorf",
      detectedPlaces: ["Berlin Reinickendorf"],
      ortsteilHints: [],
      fachbereichHints: ["Bildung"],
    },
    reviewSuggestions: [],
    reviewTaskSummary: {
      claimCount: 0,
      topicClusterCount: 0,
      dossierSuggestionCount: 0,
      anlassraumSuggestionCount: 0,
      openQuestionCount: 1,
      evidenceCount: 0,
      label: "1 offene Frage",
    },
    createdAt: "2026-05-18T08:00:00.000Z",
    updatedAt: "2026-05-18T08:00:00.000Z",
    testedBy: "admin-1",
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    ...overrides,
  } as const;
}

function participationRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "signal-official-1",
    regionId: "bezirk-berlin-reinickendorf",
    proposedRegionId: null,
    needsRegionReview: false,
    sourceClass: "participation",
    sourceType: "public_claim",
    title: "Sanierungsbedarf an Schulen ist bestätigt",
    summary: "Angenommenes Beteiligungssignal mit möglicher amtlicher Freigabe.",
    publicSafeTitle: "Sanierungsbedarf an Schulen ist bestätigt",
    publicSafeSummary: "Angenommenes Beteiligungssignal mit möglicher amtlicher Freigabe.",
    detectedTopics: ["Bildung"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: [],
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "accepted",
    visibilityState: "public_reviewed",
    confidence: 0.83,
    provenance: {
      sourceKind: "runtime",
      sourceCollection: "signals",
      sourceRefId: "signal-official-1",
      isFixture: false,
      isPilotFixture: false,
      notRealNews: false,
      notProductionData: false,
      notOfficial: true,
      notRepresentative: true,
    },
    createdAt: "2026-05-17T09:00:00.000Z",
    updatedAt: "2026-05-17T09:00:00.000Z",
    reviewedBy: "admin-1",
    reviewedAt: "2026-05-17T09:10:00.000Z",
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
  } as const;
}

describe("unified audit readside", () => {
  beforeEach(() => {
    setContentReleaseWorkbenchRepoForTests(createInMemoryContentReleaseWorkbenchRepo());
    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo({
        results: [
          sourceResult(),
          sourceResult({
            id: "source-result-foreign-1",
            organizationId: "org-fremd-1",
            title: "Fremde Quelle",
          }),
        ] as any,
      }),
    );
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo({
        records: [participationRecord()] as any,
      }),
    );
  });

  it("aggregates review operations and content release events for one item", async () => {
    await prepareContentReleaseTargetFromSourceResult({
      sourceKind: "region_source_result",
      sourceResultId: "source-result-1",
      targetType: "topic_page",
      requestedBy: "admin-1",
      organizationId: "org-reinickendorf-1",
    });
    await makeContentVisible({
      sourceKind: "region_source_result",
      sourceResultId: "source-result-1",
      targetType: "topic_page",
      requestedBy: "admin-1",
      note: "Für die öffentliche Sichtbarkeit freigegeben.",
    });
    await applyReviewQueueOperation({
      itemId: "region_source_result:source-result-1",
      action: "assign",
      requestedByUserId: "admin-1",
      assignedToUserId: "admin-2",
    });

    const trail = await getUnifiedAuditTrailForItem({
      itemId: "region_source_result:source-result-1",
      scope: buildRegionScopeContext({ isAdmin: true }),
      limit: 10,
    });

    expect(trail.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "source_result_created",
        "review_operation_applied",
        "content_release_prepared",
        "visibility_made_public",
      ]),
    );
  });

  it("returns item trails in chronological order", async () => {
    await prepareContentReleaseTargetFromSourceResult({
      sourceKind: "region_source_result",
      sourceResultId: "source-result-1",
      targetType: "topic_page",
      requestedBy: "admin-1",
      organizationId: "org-reinickendorf-1",
    });
    await applyReviewQueueOperation({
      itemId: "region_source_result:source-result-1",
      action: "add_note",
      requestedByUserId: "admin-1",
      note: "Bitte Faktenlage prüfen.",
    });
    await archiveVisibleContent({
      sourceKind: "region_source_result",
      sourceResultId: "source-result-1",
      targetType: "topic_page",
      requestedBy: "admin-1",
      note: "Archiviert nach Review.",
    }).catch(() => null);

    const trail = await getUnifiedAuditTrailForItem({
      itemId: "region_source_result:source-result-1",
      scope: buildRegionScopeContext({ isAdmin: true }),
      limit: 10,
    });

    expect(trail.length).toBeGreaterThan(1);
    expect(
      trail.every((event, index) => index === 0 || trail[index - 1]!.at <= event.at),
    ).toBe(true);
  });

  it("shows only the own organization scope", async () => {
    const trail = await getUnifiedAuditTrailForOrganization({
      organizationId: "org-reinickendorf-1",
      scope: buildRegionScopeContext({
        userId: "user-1",
        isAdmin: false,
        organizationIds: ["org-reinickendorf-1"],
        primaryOrganizationId: "org-reinickendorf-1",
        status: "verified_membership",
      }),
      limit: 10,
    });

    expect(trail.length).toBeGreaterThan(0);
    expect(trail.every((event) => event.organizationId === "org-reinickendorf-1")).toBe(true);
  });

  it("keeps foreign pending or unverified audit data hidden", async () => {
    const readModel = await listUnifiedAuditEvents({
      scope: buildRegionScopeContext({
        userId: "user-1",
        isAdmin: false,
        organizationIds: ["org-reinickendorf-1"],
        primaryOrganizationId: "org-reinickendorf-1",
        status: "pending_or_unverified",
      }),
      limit: 20,
    });

    expect(
      readModel.events.some((event) => event.organizationId === "org-fremd-1"),
    ).toBe(false);
  });

  it("detects official release events without generating them automatically", async () => {
    const repo = createInMemoryParticipationSignalReviewRuntimeRepo({
      records: [participationRecord()] as any,
    });
    setParticipationSignalReviewRuntimeRepoForTests(repo);

    const before = await getUnifiedAuditTrailForItem({
      itemId: "public_official_approval:signal:signal-official-1",
      scope: buildRegionScopeContext({ isAdmin: true }),
      limit: 10,
    });

    expect(before.some((event) => event.type === "official_release_granted")).toBe(false);

    await repo.approveParticipationSignalOfficialPublication({
      signalId: "signal-official-1",
      approvedBy: "admin-1",
      authority: "publication_approved",
      note: "Explizit bestätigt.",
    });

    const after = await getUnifiedAuditTrailForItem({
      itemId: "public_official_approval:signal:signal-official-1",
      scope: buildRegionScopeContext({ isAdmin: true }),
      limit: 10,
    });

    expect(after.some((event) => event.type === "official_release_granted")).toBe(true);
  });

  it("never sets public_official while reading unified audit state", async () => {
    await prepareContentReleaseTargetFromSourceResult({
      sourceKind: "region_source_result",
      sourceResultId: "source-result-1",
      targetType: "topic_page",
      requestedBy: "admin-1",
      organizationId: "org-reinickendorf-1",
    });
    await makeContentVisible({
      sourceKind: "region_source_result",
      sourceResultId: "source-result-1",
      targetType: "topic_page",
      requestedBy: "admin-1",
      note: "Nur public_reviewed, kein Official Release.",
    });

    await listUnifiedAuditEvents({
      scope: buildRegionScopeContext({ isAdmin: true }),
      itemIds: ["region_source_result:source-result-1"],
      limit: 10,
    });

    const record = await getContentReleaseTargetRecord(
      "region_source_result",
      "source-result-1",
      "topic_page",
    );

    expect(record?.visibilityState).not.toBe("public_official");
  });
});
