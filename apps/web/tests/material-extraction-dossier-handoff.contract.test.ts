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

describe("material extraction dossier handoff", () => {
  beforeEach(() => {
    setMaterialIntakeRepositoryForTests(createInMemoryMaterialIntakeRepository());
    setMaterialExtractionJobRepositoryForTests(createInMemoryMaterialExtractionJobRepository());
  });

  it("keeps dossier updates as in-pruefung handoffs instead of live publication", async () => {
    const created = await createMaterialIntakeRecords({
      actorId: "editor-2",
      workflowState: "review_queue_ready",
      items: [
        {
          id: "mat-dossier",
          kind: "web_document",
          label: "Dokument zur Bürgerbeteiligung",
          uploadId: null,
          fileName: null,
          mimeType: "text/html",
          url: "https://example.org/dokument",
          text: "Der Bericht ergänzt offene Fragen zur Bürgerbeteiligung.",
          pageRef: null,
          timestampRef: null,
          extractedBy: "manual",
          extractionStatus: "partial",
        },
      ],
    });

    const { job } = await createMaterialExtractionJob({
      materialId: created.records[0]!.id,
      submittedBy: "editor-2",
      extractionMode: "text_extract",
      dossierId: "dossier-42",
    });

    expect(job.status).toBe("attached_to_dossier");
    expect(job.dossierHandoff).toEqual(
      expect.objectContaining({
        dossierId: "dossier-42",
        statusLabel: "in Prüfung",
        href: "/dossier/dossier-42",
      }),
    );
    expect(job.nextSuggestedAction.label).toContain("Dossier");
  });
});
