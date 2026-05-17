import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  getParticipationSignalReviewRuntimeRepo,
  listOperationalRegions,
  listParticipationSignalsForDashboard,
  REGION_PARTICIPATION_SIGNAL_FIXTURES,
  serializeParticipationSignalForDashboard,
  setParticipationSignalReviewRuntimeRepoForTests,
  syncParticipationSignalRecords,
} from "@features/region";

describe("participation signal review runtime", () => {
  beforeEach(() => {
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );
  });

  it("creates persistent public claim and swipe records with privacy guardrails", async () => {
    const regions = await listOperationalRegions();
    const records = await syncParticipationSignalRecords(regions);

    const claim = records.find((record) => record.sourceType === "public_claim");
    const swipe = records.find((record) => record.sourceType === "swipe_interest");

    expect(claim).toMatchObject({
      reviewStatus: "needs_review",
      visibilityState: "internal_review",
      noPersonalProfiling: true,
      noPoliticalScoring: true,
      noRepresentativeClaim: true,
    });
    expect(swipe).toMatchObject({
      aggregationMode: "anonymized_count",
      privacyMode: "anonymized",
      visibilityState: "public_unverified",
      noPersonalProfiling: true,
    });
  });

  it("keeps uncertain region mappings in needsRegionReview until the region is confirmed", async () => {
    const regions = await listOperationalRegions();
    await syncParticipationSignalRecords(regions);
    const repo = getParticipationSignalReviewRuntimeRepo();

    const uncertain = await repo.getParticipationSignalRecordById(
      "region-participation-needs-region-review-001",
    );
    expect(uncertain).toMatchObject({
      regionId: null,
      proposedRegionId: "bezirk-berlin-reinickendorf",
      needsRegionReview: true,
      reviewStatus: "needs_region_review",
      visibilityState: "internal_review",
    });

    const confirmed = await repo.confirmParticipationSignalRegion(
      "region-participation-needs-region-review-001",
      "bezirk-berlin-reinickendorf",
      "admin-1",
    );
    expect(confirmed).toMatchObject({
      ok: true,
      record: expect.objectContaining({
        regionId: "bezirk-berlin-reinickendorf",
        needsRegionReview: false,
        reviewStatus: "needs_review",
        visibilityState: "internal_review",
      }),
    });
  });

  it("blocks acceptance without confirmed region or without public-safe summary on review-restricted signals", async () => {
    const regions = await listOperationalRegions();
    await syncParticipationSignalRecords(regions);
    const repo = getParticipationSignalReviewRuntimeRepo();

    await expect(
      repo.reviewParticipationSignal({
        signalId: "region-participation-needs-region-review-001",
        decision: "accept",
        reviewedBy: "admin-1",
      }),
    ).resolves.toMatchObject({
      ok: false,
      blockedReason: "public_signal_region_unconfirmed",
    });

    await expect(
      repo.reviewParticipationSignal({
        signalId: "region-participation-reinickendorf-source-hint-001",
        decision: "accept",
        reviewedBy: "admin-1",
      }),
    ).resolves.toMatchObject({
      ok: false,
      blockedReason: "public_signal_privacy_restricted",
    });
  });

  it("surfaces low-risk questions publicly while keeping risky claims in internal review", async () => {
    const regions = await listOperationalRegions();
    await syncParticipationSignalRecords(regions);
    const repo = getParticipationSignalReviewRuntimeRepo();

    await repo.reviewParticipationSignal({
      signalId: "region-participation-reinickendorf-claim-001",
      decision: "accept",
      reviewedBy: "admin-1",
    });

    const dashboard = await listParticipationSignalsForDashboard({
      regions,
      regionId: "bezirk-berlin-reinickendorf",
    });

    expect(
      dashboard.activeSignals.find(
        (signal) => signal.id === "region-participation-reinickendorf-question-001",
      ),
    ).toMatchObject({
      visibilityState: "public_unverified",
    });
    expect(
      dashboard.activeSignals.find(
        (signal) => signal.id === "region-participation-reinickendorf-claim-001",
      ),
    ).toMatchObject({
      visibilityState: "public_reviewed",
    });
  });

  it("keeps rejected, archived and internal-review-only records out of the active dashboard payload and strips person-level data", async () => {
    const regions = await listOperationalRegions();
    await syncParticipationSignalRecords(regions);
    const repo = getParticipationSignalReviewRuntimeRepo();

    await repo.reviewParticipationSignal({
      signalId: "region-participation-reinickendorf-claim-001",
      decision: "reject",
      reviewedBy: "admin-1",
    });
    await repo.reviewParticipationSignal({
      signalId: "region-participation-reinickendorf-question-accepted-001",
      decision: "archive",
      reviewedBy: "admin-1",
    });

    const dashboard = await listParticipationSignalsForDashboard({
      regions,
      regionId: "bezirk-berlin-reinickendorf",
    });
    const serialized = JSON.stringify(dashboard);

    expect(
      dashboard.activeSignals.some(
        (signal) => signal.id === "region-participation-reinickendorf-claim-001",
      ),
    ).toBe(false);
    expect(
      dashboard.activeSignals.some(
        (signal) => signal.id === "region-participation-reinickendorf-question-accepted-001",
      ),
    ).toBe(false);
    expect(
      dashboard.activeSignals.some(
        (signal) => signal.id === "region-participation-reinickendorf-source-hint-001",
      ),
    ).toBe(false);
    expect(dashboard.needsRegionReviewSignals.length).toBeGreaterThan(0);
    expect(serialized).not.toContain("userId");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("displayName");

    const fixtureQuestion = REGION_PARTICIPATION_SIGNAL_FIXTURES.find(
      (signal) => signal.id === "region-participation-reinickendorf-question-001",
    );
    const safeSignal = fixtureQuestion ? serializeParticipationSignalForDashboard({
      id: fixtureQuestion.id,
      regionId: fixtureQuestion.regionId,
      proposedRegionId: fixtureQuestion.regionId,
      needsRegionReview: false,
      sourceClass: "participation",
      sourceType: fixtureQuestion.sourceType,
      title: fixtureQuestion.title,
      summary: fixtureQuestion.summary,
      publicSafeTitle: fixtureQuestion.title,
      publicSafeSummary: fixtureQuestion.summary,
      detectedTopics: fixtureQuestion.detectedTopics,
      detectedPlaces: fixtureQuestion.detectedPlaces,
      matchedPlaces: fixtureQuestion.matchedPlaces,
      matchedRegionIds: fixtureQuestion.matchedRegionIds,
      relatedClaimIds: fixtureQuestion.relatedClaimIds,
      relatedContributionIds: fixtureQuestion.relatedContributionIds,
      relatedStatementIds: fixtureQuestion.relatedStatementIds,
      relatedDossierIds: fixtureQuestion.relatedDossierIds,
      relatedAnlassraumIds: fixtureQuestion.relatedAnlassraumIds,
      aggregationMode: fixtureQuestion.aggregationMode,
      privacyMode: fixtureQuestion.privacyMode,
      reviewStatus: "accepted",
      visibilityState: "public_unverified",
      confidence: fixtureQuestion.confidence,
      provenance: fixtureQuestion.source,
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
      reviewedBy: null,
      reviewedAt: null,
      noAutoPublish: true,
      noAutoCreateDossier: true,
      noAutoCreateAnlassraum: true,
      noPersonalProfiling: true,
      noPoliticalScoring: true,
      noRepresentativeClaim: true,
      noTenderMonitoring: true,
      noProcurementMonitoring: true,
    }) : null;
    expect(JSON.stringify(safeSignal)).not.toContain("userId");
  });
});
