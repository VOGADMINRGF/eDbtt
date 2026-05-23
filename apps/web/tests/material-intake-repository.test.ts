import { beforeEach, describe, expect, it } from "vitest";

import {
  createInMemoryMaterialIntakeRepository,
  createMaterialIntakeRecords,
  listMaterialIntakeAuditEvents,
  listMaterialIntakeRecords,
  setMaterialIntakeRepositoryForTests,
} from "@/features/material/materialIntakeRepository";

const pdfItem = {
  id: "upload-1",
  kind: "upload_document",
  label: "Haushaltsplan.pdf",
  url: null,
  uploadId: "upload-1",
  mimeType: "application/pdf",
  fileName: "Haushaltsplan.pdf",
  text: null,
  pageRef: null,
  timestampRef: null,
  extractedBy: null,
  extractionStatus: "none" as const,
  sizeBytes: 12_000,
};

beforeEach(() => {
  setMaterialIntakeRepositoryForTests(createInMemoryMaterialIntakeRepository());
});

describe("material intake repository", () => {
  it("keeps metadata, review state and audit separate from raw storage and auto research", async () => {
    const result = await createMaterialIntakeRecords({
      items: [pdfItem],
      actorId: "user-1",
      organizationId: "org-a",
      regionId: "region-a",
      workflowState: "limited_intake",
    });

    expect(result.persistence).toEqual(
      expect.objectContaining({
        mode: "in_memory_fallback",
        productionTruth: false,
        metadataDurable: false,
        rawObjectStorageDurable: false,
        scanProviderConfigured: false,
        extractionProviderConfigured: false,
      }),
    );
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        organizationId: "org-a",
        workflowState: "limited_intake",
        reviewState: "queued",
        scanState: "required",
        extractionState: "pending_external_extraction",
        rawObjectStored: false,
        publicReferenceAllowed: false,
        noAutoResearch: true,
        noAutoPublish: true,
        noAutoPublicOfficial: true,
      }),
    );

    const audit = await listMaterialIntakeAuditEvents(result.records[0]!.id);
    expect(audit.map((event) => event.eventType)).toEqual(
      expect.arrayContaining(["submitted", "review_queued", "scan_required", "extraction_required"]),
    );
  });

  it("lists only material in the requested organization scope", async () => {
    await createMaterialIntakeRecords({
      items: [{ ...pdfItem, id: "org-a-upload", uploadId: "org-a-upload" }],
      actorId: "user-a",
      organizationId: "org-a",
      regionId: "region-a",
      workflowState: "review_queue_ready",
    });
    await createMaterialIntakeRecords({
      items: [{ ...pdfItem, id: "org-b-upload", uploadId: "org-b-upload" }],
      actorId: "user-b",
      organizationId: "org-b",
      regionId: "region-b",
      workflowState: "review_queue_ready",
    });

    const orgARecords = await listMaterialIntakeRecords({ organizationIds: ["org-a"] });

    expect(orgARecords).toHaveLength(1);
    expect(orgARecords[0]).toEqual(
      expect.objectContaining({
        organizationId: "org-a",
        uploadId: "org-a-upload",
      }),
    );
  });
});
