import { describe, expect, it } from "vitest";

import {
  buildMaterialIntakeAnalyzeManifest,
  buildMaterialIntakeContract,
  buildMaterialIntakeDashboardSummary,
} from "@/features/material/materialIntakeContract";

describe("material intake production contract", () => {
  it("keeps YouTube intake review-first without automatic extraction or research", () => {
    const manifest = buildMaterialIntakeAnalyzeManifest({
      items: [
        {
          id: "yt-1",
          kind: "youtube_url",
          label: "YouTube-Link",
          url: "https://youtu.be/demo123",
          uploadId: null,
          mimeType: null,
          fileName: null,
          text: null,
          pageRef: null,
          timestampRef: null,
          extractedBy: null,
          extractionStatus: "none",
        },
      ],
    });

    expect(manifest.summary).toContain("keine automatische Extraktion");
    expect(manifest.intake.items[0]).toEqual(
      expect.objectContaining({
        type: "youtube_video",
        status: "extraction_pending",
        reviewRequired: true,
        publicReferenceAllowed: false,
      }),
    );
    expect(manifest.intake.guardrails).toEqual(
      expect.objectContaining({
        noAutoResearch: true,
        noAutoDeepSearch: true,
        noAutoNotebook: true,
        noAutoGemini: true,
        noAutoPublish: true,
        rawMaterialNeverPublic: true,
      }),
    );
    expect(manifest.evidenceItems[0]).toEqual(
      expect.objectContaining({
        kind: "web_reference",
        text: null,
        noAutoResearch: true,
      }),
    );
  });

  it("marks PDF uploads as scan-needed and never public-referenceable by default", () => {
    const intake = buildMaterialIntakeContract({
      items: [
        {
          id: "upload-1",
          kind: "upload_document",
          label: "Haushaltsbericht.pdf",
          url: null,
          uploadId: "upload-1",
          mimeType: "application/pdf",
          fileName: "Haushaltsbericht.pdf",
          text: null,
          pageRef: null,
          timestampRef: null,
          extractedBy: null,
          extractionStatus: "none",
        },
      ],
      productionTruth: false,
    });

    expect(intake.items[0]).toEqual(
      expect.objectContaining({
        type: "pdf",
        status: "scan_needed",
        publicReferenceAllowed: false,
      }),
    );
    expect(intake.riskFlags).toEqual(
      expect.arrayContaining([
        "malware_scan_required",
        "copyright_review_required",
        "authenticity_review_required",
        "raw_material_private",
      ]),
    );
    expect(intake.productionTruth).toBe(false);
    expect(intake.storageMode).toBe("request_metadata_only");
  });

  it("keeps dashboard material workflow limited until verification and entitlement are present", () => {
    expect(
      buildMaterialIntakeDashboardSummary({
        hasVerifiedMembership: false,
        hasProductiveEntitlement: false,
        productionTruth: false,
      }),
    ).toEqual(
      expect.objectContaining({
        currentState: "verification_required",
        productiveWorkflowEnabled: false,
        entitlementRequired: true,
      }),
    );

    expect(
      buildMaterialIntakeDashboardSummary({
        hasVerifiedMembership: true,
        hasProductiveEntitlement: false,
        productionTruth: false,
      }),
    ).toEqual(
      expect.objectContaining({
        currentState: "limited_intake",
        productiveWorkflowEnabled: false,
        entitlementRequired: true,
      }),
    );

    expect(
      buildMaterialIntakeDashboardSummary({
        hasVerifiedMembership: true,
        hasProductiveEntitlement: true,
        productionTruth: false,
      }),
    ).toEqual(
      expect.objectContaining({
        currentState: "ready_for_review",
        productiveWorkflowEnabled: true,
        entitlementRequired: false,
      }),
    );
  });
});
