import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderMediaStorageTruthPanel from "@/features/create/VoxyRenderMediaStorageTruthPanel";
import {
  buildVoxyRenderMediaStorageTruthCommandFromReadmodels,
  buildVoxyRenderMediaStorageTruthPanelModel,
  deriveVoxyRenderMediaStorageTruthStatus,
} from "@/features/create/voxyRenderMediaStorageTruthContract";

function buildPreviewFlow(overrides?: Record<string, unknown>) {
  return {
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    rtlRequired: false,
    createdAt: "2026-07-11T10:00:00.000Z",
    previewStatus: "no_preview_available",
    topBlockers: ["Noch kein Preview verfügbar."],
    ...overrides,
  } as any;
}

function buildApprovalRecord(overrides?: Record<string, unknown>) {
  return {
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: { id: "admin-1", title: "Admin", href: null },
    createdAt: "2026-07-11T10:10:00.000Z",
    updatedAt: "2026-07-11T10:10:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    approvalStatus: "approval_required",
    ...overrides,
  } as any;
}

describe("voxy render media storage truth contract", () => {
  it("blocks when approval semantics are missing", () => {
    expect(
      deriveVoxyRenderMediaStorageTruthStatus({
        approvalSemanticsId: null,
        approvalStatusHint: null,
        previewReviewFlowStatusHint: "no_preview_available",
        mediaCandidateStatus: "no_file",
        storageTargetStatus: "policy_needed",
      }),
    ).toBe("blocked_by_missing_approval_semantics");
  });

  it("keeps script-only flows free of media truth claims", () => {
    const command = buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow: buildPreviewFlow({ previewStatus: "keep_as_script_only" }),
      latestApprovalSemanticsRecord: buildApprovalRecord({ approvalStatus: "keep_as_script_only" }),
    });

    expect(command).toMatchObject({
      mediaStorageTruthStatus: "keep_as_script_only",
      mediaCandidate: {
        status: "no_file",
        publicUrl: null,
        signedUrl: null,
        storagePath: null,
        rendered: false,
        uploaded: false,
      },
      storageTarget: {
        status: "requirement_only",
        writeAllowed: false,
        publicAccessAllowed: false,
      },
      mediaSemantics: {
        mediaFileAvailable: false,
        previewFileAvailable: false,
      },
      executionFlags: {
        createsMediaFile: false,
        storageWriteAllowed: false,
        uploadAllowed: false,
        publishAllowed: false,
      },
      nextStep: "keep_as_script_only",
    });
  });

  it("keeps missing preview files separate from media candidates", () => {
    const command = buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow: buildPreviewFlow({ previewStatus: "no_preview_available" }),
      latestApprovalSemanticsRecord: buildApprovalRecord({ approvalStatus: "approval_required" }),
    });

    expect(command).toMatchObject({
      mediaStorageTruthStatus: "blocked_by_missing_preview_file",
      mediaCandidate: {
        status: "no_file",
        mediaKind: "preview_video",
        mimeType: null,
        fileSizeBytes: null,
        durationSeconds: null,
        checksum: null,
        publicUrl: null,
        signedUrl: null,
        storagePath: null,
      },
      storageTarget: {
        status: "policy_needed",
        provider: "requirement_only",
      },
      executionFlags: {
        providerExecutionAllowed: false,
        queueAllowed: false,
        workerAllowed: false,
        secretsAccessed: false,
      },
    });
  });

  it("surfaces storage and metadata policy gaps without fake urls", () => {
    const command = buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow: buildPreviewFlow({ previewStatus: "preview_review_flow_only" }),
      latestApprovalSemanticsRecord: buildApprovalRecord({ approvalStatus: "approval_required" }),
      storagePolicyDefined: true,
      storageProviderConfigured: true,
      metadataPolicyDefined: false,
    });

    expect(command).toMatchObject({
      mediaStorageTruthStatus: "metadata_policy_needed",
      nextStep: "define_metadata_policy",
      mediaCandidate: {
        status: "metadata_needed",
        publicUrl: null,
        signedUrl: null,
        storagePath: null,
      },
      storageTarget: {
        status: "requirement_only",
      },
    });
  });

  it("renders the panel with explicit non-goals and no raw urls", () => {
    const model = buildVoxyRenderMediaStorageTruthPanelModel({
      previewFlow: buildPreviewFlow(),
      latestApprovalSemanticsRecord: buildApprovalRecord(),
    });
    const html = renderToStaticMarkup(
      <VoxyRenderMediaStorageTruthPanel model={model} dataTestId="media-storage-truth" />,
    );

    expect(html).toContain("Media &amp; Storage");
    expect(html).toContain("Noch keine Medien-Datei");
    expect(html).toContain("Kein Storage-Write");
    expect(html).toContain("Keine Preview-URL");
    expect(html).toContain("Storage Target");
    expect(html).toContain("Media Candidate");
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
  });
});
