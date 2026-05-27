import { beforeEach, describe, expect, it } from "vitest";

import {
  createInMemoryMaterialIntakeRepository,
  createMaterialIntakeRecords,
  setMaterialIntakeRepositoryForTests,
} from "@/features/material/materialIntakeRepository";
import {
  buildMaterialExtractionJobReadModel,
  createInMemoryMaterialExtractionJobRepository,
  createMaterialExtractionJob,
  setMaterialExtractionJobRepositoryForTests,
} from "@/features/material/materialExtractionJobs";

describe("material extraction review-first", () => {
  beforeEach(() => {
    setMaterialIntakeRepositoryForTests(createInMemoryMaterialIntakeRepository());
    setMaterialExtractionJobRepositoryForTests(createInMemoryMaterialExtractionJobRepository());
  });

  it("keeps extracted outputs as drafts and review-only hints", async () => {
    const created = await createMaterialIntakeRecords({
      actorId: "editor-1",
      workflowState: "review_queue_ready",
      items: [
        {
          id: "mat-press",
          kind: "web_document",
          label: "Pressemitteilung Verkehr",
          uploadId: null,
          fileName: null,
          mimeType: "text/html",
          url: "https://example.org/presse/verkehr",
          text: "Die Stadt plant neue Radwege. Welche Kosten entstehen? Option A priorisiert Schulen.",
          pageRef: null,
          timestampRef: null,
          extractedBy: "manual",
          extractionStatus: "partial",
        },
      ],
    });

    const { job } = await createMaterialExtractionJob({
      materialId: created.records[0]!.id,
      submittedBy: "editor-1",
      extractionMode: "text_extract",
    });
    const readModel = await buildMaterialExtractionJobReadModel();

    expect(job.status).toBe("attached_to_themenradar");
    expect(job.claimDrafts.every((draft) => draft.reviewState === "draft")).toBe(true);
    expect(job.reviewRequired).toBe(true);
    expect(job.noAutoPublish).toBe(true);
    expect(job.noAutoOfficial).toBe(true);
    expect(job.nextSuggestedAction.description).toContain("review");
    expect(readModel.summary.reviewReadyJobs).toBeGreaterThan(0);
  });
});
