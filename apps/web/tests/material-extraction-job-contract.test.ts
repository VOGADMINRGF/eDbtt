import { beforeEach, describe, expect, it } from "vitest";

import {
  createInMemoryMaterialIntakeRepository,
  createMaterialIntakeRecords,
  setMaterialIntakeRepositoryForTests,
} from "@/features/material/materialIntakeRepository";
import {
  createInMemoryMaterialExtractionJobRepository,
  createMaterialExtractionJob,
  setMaterialExtractionJobRepositoryForTests,
} from "@/features/material/materialExtractionJobs";

async function seedMaterial() {
  const created = await createMaterialIntakeRecords({
    actorId: "user-1",
    organizationId: "org-1",
    regionId: "DE:BE",
    workflowState: "review_queue_ready",
    items: [
      {
        id: "mat-1",
        kind: "upload_document",
        label: "Haushaltsprotokoll Mai",
        uploadId: "upload-1",
        fileName: "haushaltsprotokoll-mai.pdf",
        mimeType: "application/pdf",
        url: null,
        text: "Die Verwaltung schlägt neue Öffnungszeiten vor. Welche Auswirkungen hat das auf Familien?",
        pageRef: "S. 3",
        timestampRef: null,
        extractedBy: "manual",
        extractionStatus: "partial",
        sizeBytes: 2048,
      },
    ],
  });
  return created.records[0];
}

describe("material extraction job contract", () => {
  beforeEach(() => {
    setMaterialIntakeRepositoryForTests(createInMemoryMaterialIntakeRepository());
    setMaterialExtractionJobRepositoryForTests(createInMemoryMaterialExtractionJobRepository());
  });

  it("creates a guarded review-first extraction job with dossier handoff", async () => {
    const material = await seedMaterial();

    const { job, persistence } = await createMaterialExtractionJob({
      materialId: material.id,
      submittedBy: "user-1",
      extractionMode: "text_extract",
      dossierId: "dossier-1",
      anlassraumId: "anlass-1",
    });

    expect(job).toEqual(
      expect.objectContaining({
        materialId: material.id,
        sourceType: "meeting_minutes",
        organizationId: "org-1",
        regionId: "DE:BE",
        extractionMode: "text_extract",
        costGuard: "free",
        status: "attached_to_dossier",
        reviewRequired: true,
        noAutoPublish: true,
        noAutoDeepSearch: true,
        noAutoOfficial: true,
      }),
    );
    expect(job.claimDrafts.length).toBeGreaterThan(0);
    expect(job.questionDrafts.length).toBeGreaterThan(0);
    expect(job.dossierHandoff).toEqual(
      expect.objectContaining({
        dossierId: "dossier-1",
        statusLabel: "in Prüfung",
        href: "/dossier/dossier-1",
      }),
    );
    expect(job.anlassraumHandoff).toEqual(
      expect.objectContaining({
        anlassraumId: "anlass-1",
        href: "/runden?anlassraumId=anlass-1",
      }),
    );
    expect(persistence.productionTruth).toBe(false);
  });
});
