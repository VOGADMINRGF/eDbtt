import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/uploads/route";

describe("/api/uploads material intake route", () => {
  it("returns local pending material intake metadata without claiming storage or extraction", async () => {
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
    expect(body.message).toContain("keine KI-Recherche");
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
