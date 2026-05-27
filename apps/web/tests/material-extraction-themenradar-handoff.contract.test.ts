import { beforeEach, describe, expect, it } from "vitest";

import {
  createInMemoryMaterialIntakeRepository,
  createMaterialIntakeRecords,
  setMaterialIntakeRepositoryForTests,
} from "@/features/material/materialIntakeRepository";
import {
  createInMemoryMaterialExtractionJobRepository,
  createMaterialExtractionJob,
  listMaterialExtractionThemenradarSeeds,
  setMaterialExtractionJobRepositoryForTests,
} from "@/features/material/materialExtractionJobs";

describe("material extraction themenradar handoff", () => {
  beforeEach(() => {
    setMaterialIntakeRepositoryForTests(createInMemoryMaterialIntakeRepository());
    setMaterialExtractionJobRepositoryForTests(createInMemoryMaterialExtractionJobRepository());
  });

  it("hands extracted material hints to the themenradar seed layer", async () => {
    const created = await createMaterialIntakeRecords({
      actorId: "user-1",
      organizationId: "org-1",
      regionId: "DE:BE",
      workflowState: "review_queue_ready",
      items: [
        {
          id: "mat-topic",
          kind: "upload_document",
          label: "Schulwege Bericht",
          uploadId: "upload-99",
          fileName: "schulwege-bericht.pdf",
          mimeType: "application/pdf",
          url: null,
          text: "Viele Kinder haben unsichere Schulwege. Welche Maßnahmen priorisieren wir?",
          pageRef: "S. 2",
          timestampRef: null,
          extractedBy: "manual",
          extractionStatus: "partial",
        },
      ],
    });

    await createMaterialExtractionJob({
      materialId: created.records[0]!.id,
      submittedBy: "user-1",
      extractionMode: "text_extract",
    });

    const seeds = await listMaterialExtractionThemenradarSeeds({
      organizationIds: ["org-1"],
      viewerRegionIds: ["DE:BE"],
      adminContext: true,
    });

    expect(
      seeds.some(
        (item) =>
          item.sourceType === "material" &&
          item.topicLabel.includes("Schulwege") &&
          item.regionId === "DE:BE" &&
          item.organizationId === "org-1",
      ),
    ).toBe(true);
  });
});
