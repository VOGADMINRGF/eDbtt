import { describe, expect, it } from "vitest";
import {
  createInMemoryContentReleaseWorkbenchRepo,
  type ContentReleaseTargetRecord,
} from "@features/contentReleaseWorkbench";
import {
  buildHonestMetadataCapabilities,
  type AiTransparencyRecord,
} from "@features/ai/aiTransparencyContract";

function buildTransparencyRecord(): AiTransparencyRecord {
  return {
    artifactId: "content-release-dossier-1",
    contentKind: "text",
    createdAt: "2026-08-03T08:00:00.000Z",
    modifiedAt: null,
    status: "ai_generated_reviewed",
    humanReview: {
      completed: true,
      completedAt: "2026-08-03T09:00:00.000Z",
      auditRef: "review:content-release-dossier-1",
    },
    editorialApproval: {
      approved: true,
      approvedAt: "2026-08-03T09:15:00.000Z",
      auditRef: "approval:content-release-dossier-1",
      responsibleRole: "editorial_actor",
    },
    intendedPublic: true,
    publicInterest: true,
    visibleLabelKey: "ai_generated_editorially_reviewed",
    labelAccessible: true,
    originalContentRef: "source-result-1",
    derivativeContentRef: "content-release-dossier-1",
    deepfakeDisclosureApplied: false,
    provenance: {
      traceRefs: ["safe-trace:content-release-dossier-1"],
      inputOrigin: "ai_derivation",
      providerMetadataPresent: false,
      capabilities: buildHonestMetadataCapabilities({
        safeTraceVerificationRef: "safe-trace:content-release-dossier-1",
      }),
    },
  };
}

function buildTarget(
  aiTransparency: AiTransparencyRecord | null,
): ContentReleaseTargetRecord {
  return {
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
    visibilityState: "public_reviewed",
    createdByUserId: "user-1",
    createdAt: "2026-08-03T08:00:00.000Z",
    updatedByUserId: "user-1",
    updatedAt: "2026-08-03T09:15:00.000Z",
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    noSocialPublishing: true,
    noAutomaticOfficialResponse: true,
    noAutoFinalization: true,
    aiTransparency,
    revokable: true,
    archivable: true,
  };
}

describe("content release AI transparency persistence", () => {
  it("preserves reviewed AI status, label, review role, and provenance with the release record", async () => {
    const record = buildTarget(buildTransparencyRecord());
    const repo = createInMemoryContentReleaseWorkbenchRepo({ records: [record] });

    const persisted = await repo.getTargetRecord(
      record.sourceKind,
      record.sourceResultId,
      record.targetType,
    );

    expect(persisted?.aiTransparency).toMatchObject({
      status: "ai_generated_reviewed",
      visibleLabelKey: "ai_generated_editorially_reviewed",
      editorialApproval: {
        responsibleRole: "editorial_actor",
      },
      provenance: {
        providerMetadataPresent: false,
      },
    });
    expect(persisted?.noAutoPublish).toBe(true);
  });

  it("rejects unsupported positive metadata claims without a verification reference", () => {
    const invalid = buildTransparencyRecord();
    invalid.provenance.capabilities = invalid.provenance.capabilities.map((entry) =>
      entry.standard === "c2pa"
        ? {
            ...entry,
            capability: "supported",
            preservation: "preserved",
            verificationRef: null,
          }
        : entry,
    );

    expect(() =>
      createInMemoryContentReleaseWorkbenchRepo({
        records: [buildTarget(invalid)],
      }),
    ).toThrow();
  });
});
