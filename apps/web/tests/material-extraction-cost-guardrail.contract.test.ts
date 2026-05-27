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

describe("material extraction cost guardrail", () => {
  beforeEach(() => {
    setMaterialIntakeRepositoryForTests(createInMemoryMaterialIntakeRepository());
    setMaterialExtractionJobRepositoryForTests(createInMemoryMaterialExtractionJobRepository());
  });

  it("blocks transcript extraction until an explicit approval exists", async () => {
    const created = await createMaterialIntakeRecords({
      actorId: "user-1",
      workflowState: "verification_required",
      items: [
        {
          id: "mat-yt",
          kind: "youtube_url",
          label: "Stadtrat Livestream",
          uploadId: null,
          fileName: null,
          mimeType: null,
          url: "https://youtu.be/demo123",
          text: null,
          pageRef: null,
          timestampRef: "00:12:00",
          extractedBy: null,
          extractionStatus: "none",
        },
      ],
    });

    const { job } = await createMaterialExtractionJob({
      materialId: created.records[0]!.id,
      submittedBy: "user-1",
      extractionMode: "transcript_extract",
    });

    expect(job.costGuard).toBe("requires_approval");
    expect(job.status).toBe("blocked");
    expect(job.error).toContain("Kosten");
    expect(job.nextSuggestedAction.label).toContain("Kostenfreigabe");
  });
});
