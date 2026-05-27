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

describe("material extraction no autopublish contract", () => {
  beforeEach(() => {
    setMaterialIntakeRepositoryForTests(createInMemoryMaterialIntakeRepository());
    setMaterialExtractionJobRepositoryForTests(createInMemoryMaterialExtractionJobRepository());
  });

  it("never frames extracted material as published, official or auto-live", async () => {
    const created = await createMaterialIntakeRecords({
      actorId: "user-3",
      workflowState: "review_queue_ready",
      items: [
        {
          id: "mat-safe",
          kind: "upload_document",
          label: "Pressemappe Wasser",
          uploadId: "upload-safe",
          fileName: "pressemappe-wasser.pdf",
          mimeType: "application/pdf",
          url: null,
          text: "Die Unterlagen nennen mehrere Maßnahmen. Welche Fragen bleiben offen?",
          pageRef: "S. 1",
          timestampRef: null,
          extractedBy: "manual",
          extractionStatus: "partial",
        },
      ],
    });

    await createMaterialExtractionJob({
      materialId: created.records[0]!.id,
      submittedBy: "user-3",
      extractionMode: "text_extract",
    });

    const readModel = await buildMaterialExtractionJobReadModel();
    const [job] = readModel.items;

    expect(job).toBeDefined();
    expect(job?.noAutoPublish).toBe(true);
    expect(job?.noAutoOfficial).toBe(true);
    expect(job?.status).not.toBe("published");
    expect(job?.statusLabel.toLowerCase()).not.toContain("veröffentlicht");
    expect(job?.nextSuggestedAction.description).not.toContain("automatisch");
  });
});
