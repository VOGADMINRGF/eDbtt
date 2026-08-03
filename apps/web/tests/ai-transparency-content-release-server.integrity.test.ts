import { beforeEach, describe, expect, it } from "vitest";
import {
  contentReleaseArtifactIdForRecord,
  contentReleaseReviewItemIdForSource,
  createInMemoryContentReleaseWorkbenchRepo,
  getContentReleaseTargetRecord,
  listContentReleaseAuditEvents,
  setContentReleaseWorkbenchRepoForTests,
  type ContentReleaseAiClassification,
  type ContentReleaseTargetRecord,
} from "@features/contentReleaseWorkbench";
import {
  applyReviewQueueOperation,
  createInMemoryReviewQueueOperationRepo,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";
import {
  executeServerAuthoritativeContentReleaseAction,
  validateContentReleaseAiTransparencyBinding,
} from "@/features/ai/aiTransparencyContentReleaseServer";

const SOURCE_KIND = "create_handoff" as const;
const SOURCE_ID = "handoff-integrity-1";
const TARGET_TYPE = "topic_page" as const;
const TARGET_ID = "topic-integrity-1";
const RECORD_ID = "content-release-integrity-1";
const REVIEW_ITEM_ID = contentReleaseReviewItemIdForSource(
  SOURCE_KIND,
  SOURCE_ID,
);

function buildTarget(
  overrides: Partial<ContentReleaseTargetRecord> = {},
): ContentReleaseTargetRecord {
  return {
    id: RECORD_ID,
    sourceKind: SOURCE_KIND,
    sourceResultId: SOURCE_ID,
    sourceReviewItemId: REVIEW_ITEM_ID,
    regionId: "bezirk-berlin-reinickendorf",
    organizationId: "org-1",
    targetType: TARGET_TYPE,
    targetId: TARGET_ID,
    title: "Integritätsgebundene Themenseite",
    summary: "Serverseitig gebundener Content-Release-Arbeitsstand.",
    previewHref: `/topic/${TARGET_ID}?previewTopicPage=1`,
    publicHref: `/topic/${TARGET_ID}`,
    topicPageData: null,
    visibilityState: "internal_review",
    createdByUserId: "author-1",
    createdAt: "2026-08-03T10:00:00.000Z",
    updatedByUserId: "author-1",
    updatedAt: "2026-08-03T10:00:00.000Z",
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    noSocialPublishing: true,
    noAutomaticOfficialResponse: true,
    noAutoFinalization: true,
    aiTransparency: null,
    revokable: true,
    archivable: true,
    ...overrides,
  };
}

async function seedReleaseTruth(options: { reviewReady?: boolean } = {}) {
  const target = buildTarget();
  const contentReleaseRepo = createInMemoryContentReleaseWorkbenchRepo({
    records: [target],
    auditEvents: [
      {
        id: "content-release-prepared-integrity-1",
        recordId: RECORD_ID,
        sourceKind: SOURCE_KIND,
        sourceResultId: SOURCE_ID,
        targetType: TARGET_TYPE,
        action: "prepared",
        byUserId: "author-1",
        note: "Target bewusst vorbereitet.",
        at: "2026-08-03T10:00:00.000Z",
      },
    ],
  });
  setContentReleaseWorkbenchRepoForTests(contentReleaseRepo);
  setReviewQueueOperationRepoForTests(
    createInMemoryReviewQueueOperationRepo(),
  );
  if (options.reviewReady !== false) {
    await applyReviewQueueOperation({
      itemId: REVIEW_ITEM_ID,
      action: "mark_ready",
      requestedByUserId: "reviewer-1",
    });
  }
  return target;
}

async function execute(
  classification: ContentReleaseAiClassification,
  action: "make_visible" | "prepare_publication" = "make_visible",
) {
  return executeServerAuthoritativeContentReleaseAction({
    sourceKind: SOURCE_KIND,
    sourceId: SOURCE_ID,
    targetType: TARGET_TYPE,
    action,
    classification,
    actor: {
      userId: "publisher-1",
      responsibleRole: "institutional_actor",
    },
    now: () => "2026-08-03T11:00:00.000Z",
  });
}

describe("server-authoritative content release AI transparency", () => {
  beforeEach(async () => {
    await seedReleaseTruth();
  });

  it.each([
    ["human_only", null],
    ["ai_assisted", "ai_assisted_editorially_reviewed"],
    ["ai_generated_reviewed", "ai_generated_editorially_reviewed"],
  ] as const)(
    "publishes %s only from real review and server approval truth",
    async (classification, expectedLabel) => {
      const result = await execute(classification);

      expect(result.allowed).toBe(true);
      expect(result.target.visibilityState).toBe("public_unverified");
      expect(result.aiTransparency).toMatchObject({
        status: classification,
        visibleLabelKey: expectedLabel,
        humanReview: {
          completed: true,
          auditRef: expect.stringMatching(/^review-queue-audit-/),
        },
        editorialApproval: {
          approved: true,
          responsibleRole: "institutional_actor",
          auditRef: expect.stringMatching(/^content-release-audit-/),
        },
        integrityBinding: {
          sourceKind: SOURCE_KIND,
          sourceId: SOURCE_ID,
          targetKind: TARGET_TYPE,
          targetId: TARGET_ID,
          contentReleaseRecordId: RECORD_ID,
          actorUserId: "publisher-1",
          actorRole: "institutional_actor",
        },
      });
      if (classification === "human_only") {
        expect(result.aiTransparency?.visibleLabelKey).toBeNull();
      }

      const approvalRef = result.aiTransparency?.editorialApproval.auditRef;
      const events = await listContentReleaseAuditEvents(RECORD_ID);
      expect(events.find((event) => event.id === approvalRef)).toMatchObject({
        recordId: RECORD_ID,
        sourceResultId: SOURCE_ID,
        targetType: TARGET_TYPE,
        targetId: TARGET_ID,
        artifactId: contentReleaseArtifactIdForRecord(result.target),
        byUserId: "publisher-1",
        actorRole: "institutional_actor",
        aiTransparencyStatus: classification,
      });
    },
  );

  it("uses prepare_publication as a real server-recorded approval without public_official", async () => {
    const result = await execute("ai_generated_reviewed", "prepare_publication");
    expect(result.allowed).toBe(true);
    expect(result.target.visibilityState).toBe("public_reviewed");
    expect(result.target.noPublicOfficial).toBe(true);
  });

  it("blocks when no real mark_ready review event exists", async () => {
    await seedReleaseTruth({ reviewReady: false });
    const result = await execute("human_only");
    expect(result.allowed).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "human_review_event_missing",
        "human_review_state_not_ready",
      ]),
    );
    expect(
      await getContentReleaseTargetRecord(SOURCE_KIND, SOURCE_ID, TARGET_TYPE),
    ).toMatchObject({ visibilityState: "internal_review", aiTransparency: null });
  });

  it.each([
    ["other-source", TARGET_TYPE, "content_release_target_missing"],
    [SOURCE_ID, "dossier", "content_release_target_missing"],
  ] as const)(
    "blocks reuse against source %s and target %s",
    async (sourceId, targetType, expectedBlocker) => {
      const result = await executeServerAuthoritativeContentReleaseAction({
        sourceKind: SOURCE_KIND,
        sourceId,
        targetType,
        action: "make_visible",
        classification: "human_only",
        actor: {
          userId: "publisher-1",
          responsibleRole: "institutional_actor",
        },
      });
      expect(result.allowed).toBe(false);
      expect(result.blockers).toContain(expectedBlocker);
    },
  );

  it("detects foreign artifact, source, target, actor, and audit reuse", async () => {
    const result = await execute("ai_assisted");
    expect(result.allowed).toBe(true);
    const aiTransparency = result.aiTransparency!;
    const reviewAuditRef = aiTransparency.humanReview.auditRef!;
    const approvalAuditRef = aiTransparency.editorialApproval.auditRef!;

    const mutations = [
      { integrityBinding: { ...aiTransparency.integrityBinding!, sourceId: "foreign-source" } },
      { integrityBinding: { ...aiTransparency.integrityBinding!, targetId: "foreign-target" } },
      { artifactId: "foreign-artifact" },
      { integrityBinding: { ...aiTransparency.integrityBinding!, actorUserId: "foreign-actor" } },
      { humanReview: { ...aiTransparency.humanReview, auditRef: "forged-review" } },
      { editorialApproval: { ...aiTransparency.editorialApproval, auditRef: "forged-approval" } },
    ];

    for (const mutation of mutations) {
      const blockers = validateContentReleaseAiTransparencyBinding({
        record: { ...aiTransparency, ...mutation },
        target: result.target,
        actorUserId: "publisher-1",
        actorRole: "institutional_actor",
        reviewAuditRef,
        approvalAuditRef,
      });
      expect(blockers.length).toBeGreaterThan(0);
    }
  });

  it("blocks missing, unknown, and unreviewed classifications", async () => {
    const missing = await executeServerAuthoritativeContentReleaseAction({
      sourceKind: SOURCE_KIND,
      sourceId: SOURCE_ID,
      targetType: TARGET_TYPE,
      action: "make_visible",
      actor: { userId: "publisher-1", responsibleRole: "institutional_actor" },
    });
    expect(missing.allowed).toBe(false);
    expect(missing.blockers).toContain("classification_required");

    for (const classification of ["unknown", "ai_generated_unreviewed"] as const) {
      const result = await executeServerAuthoritativeContentReleaseAction({
        sourceKind: SOURCE_KIND,
        sourceId: SOURCE_ID,
        targetType: TARGET_TYPE,
        action: "make_visible",
        classification: classification as ContentReleaseAiClassification,
        actor: { userId: "publisher-1", responsibleRole: "institutional_actor" },
      });
      expect(result.allowed).toBe(false);
      expect(result.blockers).toContain("classification_unknown");
    }
  });

  it("keeps retract and archive actions available without client classification", async () => {
    const visible = await execute("human_only");
    expect(visible.allowed).toBe(true);

    const retracted = await executeServerAuthoritativeContentReleaseAction({
      sourceKind: SOURCE_KIND,
      sourceId: SOURCE_ID,
      targetType: TARGET_TYPE,
      action: "retract_visibility",
      actor: { userId: "publisher-1", responsibleRole: "institutional_actor" },
    });
    expect(retracted.allowed).toBe(true);
    expect(retracted.target.visibilityState).toBe("internal_review");

    const archived = await executeServerAuthoritativeContentReleaseAction({
      sourceKind: SOURCE_KIND,
      sourceId: SOURCE_ID,
      targetType: TARGET_TYPE,
      action: "archive_target",
      actor: { userId: "publisher-1", responsibleRole: "institutional_actor" },
    });
    expect(archived.allowed).toBe(true);
    expect(archived.target.visibilityState).toBe("archived");
  });
});
