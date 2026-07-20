import { describe, expect, it } from "vitest";

import { POST as postContributionDrafts } from "@/app/api/contributions/drafts/route";
import { POST as postContributionIngest } from "@/app/api/contributions/ingest/route";

describe("legacy contribution fake-success routes", () => {
  it("decommissions /api/contributions/drafts with a structured 410 instead of fake success", async () => {
    const res = await postContributionDrafts();

    expect(res.status).toBe(410);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "route_gone",
      route: "/api/contributions/drafts",
      canonicalEndpoint: "/api/contributions/save",
    });
  });

  it("decommissions /api/contributions/ingest with a structured 410 instead of saved:true", async () => {
    const res = await postContributionIngest();

    expect(res.status).toBe(410);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "route_gone",
      route: "/api/contributions/ingest",
      canonicalEndpoint: "/api/contributions/save",
    });
  });
});
