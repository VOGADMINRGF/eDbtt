import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/uploads/route";
import {
  createInMemoryMaterialIntakeRepository,
  setMaterialIntakeRepositoryForTests,
} from "@/features/material/materialIntakeRepository";

describe("/api/uploads material intake route", () => {
  beforeEach(() => {
    setMaterialIntakeRepositoryForTests(createInMemoryMaterialIntakeRepository());
  });

  it("registers upload metadata as review-first without claiming raw storage, scan or extraction", async () => {
    const form = new FormData();
    form.append("files", new File(["demo"], "protokoll.pdf", { type: "application/pdf" }));

    const res = await POST(
      new NextRequest("http://localhost/api/uploads", {
        method: "POST",
        body: form,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.storageMode).toBe("local_pending");
    expect(body.productionTruth).toBe(false);
    expect(body.rawObjectStorageProductionTruth).toBe(false);
    expect(body.scanProviderConfigured).toBe(false);
    expect(body.extractionProviderConfigured).toBe(false);
    expect(body.message).toContain("keine KI-Recherche");
    expect(body.materialRegistry.workflowState).toBe("verification_required");
    expect(body.materialRegistry.persistence).toEqual(
      expect.objectContaining({
        productionTruth: false,
        rawObjectStorageDurable: false,
        scanProviderConfigured: false,
        extractionProviderConfigured: false,
      }),
    );
    expect(body.materialRegistry.records[0]).toEqual(
      expect.objectContaining({
        reviewState: "queued",
        scanState: "required",
        extractionState: "pending_external_extraction",
        rawObjectStored: false,
        noAutoResearch: true,
        noAutoPublish: true,
        noAutoPublicOfficial: true,
      }),
    );
    expect(body.materialIntake.items[0]).toEqual(
      expect.objectContaining({
        type: "pdf",
        status: "scan_needed",
        publicReferenceAllowed: false,
      }),
    );
    expect(body.materialIntake.guardrails).toEqual(
      expect.objectContaining({
        noAutoResearch: true,
        noAutoPublish: true,
        rawMaterialNeverPublic: true,
      }),
    );
  });
});
