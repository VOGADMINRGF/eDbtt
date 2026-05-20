import { describe, expect, it } from "vitest";
import {
  createInMemoryContentReleaseWorkbenchRepo,
  type ContentReleaseAuditEvent,
  type ContentReleaseTargetRecord,
} from "@features/contentReleaseWorkbench";

const baseRecord: ContentReleaseTargetRecord = {
  id: "content-release-dossier-1",
  sourceKind: "region_source_result",
  sourceResultId: "source-result-1",
  sourceReviewItemId: "region_source_result:source-result-1",
  regionId: "bezirk-berlin-reinickendorf",
  organizationId: "org-reinickendorf-1",
  targetType: "dossier",
  targetId: "dossier-1",
  title: "Berlin Reinickendorf: Schule",
  summary: "Bewusst vorbereiteter veröffentlichbarer Arbeitsstand.",
  previewHref: "/dossier/dossier-1/studio",
  publicHref: "/dossier/dossier-1",
  topicPageData: null,
  visibilityState: "public_unverified",
  createdByUserId: "user-1",
  createdAt: "2026-05-20T08:00:00.000Z",
  updatedByUserId: "user-1",
  updatedAt: "2026-05-20T08:05:00.000Z",
  reviewRequired: true,
  noAutoPublish: true,
  noPublicOfficial: true,
  noSocialPublishing: true,
  noAutomaticOfficialResponse: true,
  noAutoFinalization: true,
  revokable: true,
  archivable: true,
};

const baseAuditEvent: ContentReleaseAuditEvent = {
  id: "content-release-audit-1",
  recordId: "content-release-dossier-1",
  sourceKind: "region_source_result",
  sourceResultId: "source-result-1",
  targetType: "dossier",
  action: "visibility_made_public",
  byUserId: "user-1",
  note: "Bewusst sichtbar gemacht.",
  at: "2026-05-20T08:06:00.000Z",
};

describe("content release repository", () => {
  it("marks the in-memory fallback explicitly as non-production truth", () => {
    const repo = createInMemoryContentReleaseWorkbenchRepo();

    expect(repo.getPersistenceState()).toMatchObject({
      mode: "in_memory_fallback",
      productionTruth: false,
      restartReconstructable: false,
      deploymentReconstructable: false,
      repositoryInterface: "ContentReleaseRepository",
    });
  });

  it("groups persisted visibility events per record", async () => {
    const repo = createInMemoryContentReleaseWorkbenchRepo({
      records: [baseRecord],
      auditEvents: [
        baseAuditEvent,
        {
          ...baseAuditEvent,
          id: "content-release-audit-2",
          action: "archived",
          at: "2026-05-20T08:07:00.000Z",
        },
      ],
    });

    const grouped = await repo.listAuditEventsForRecords([baseRecord.id], 2);

    expect(grouped[baseRecord.id]).toEqual([
      expect.objectContaining({ action: "archived" }),
      expect.objectContaining({ action: "visibility_made_public" }),
    ]);
  });
});
