import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  handleAttachDraftSave: vi.fn(),
}));

vi.mock("@/app/api/contributions/attach-drafts/route", () => ({
  POST: (...args: unknown[]) => mocks.handleAttachDraftSave(...args),
}));

import { POST as createAttachDraftPOST } from "@/app/api/create/attach-drafts/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/create/attach-drafts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/create/attach-drafts route", () => {
  it("delegates to /api/contributions/attach-drafts unchanged", async () => {
    const upstreamResponse = Response.json({
      ok: true,
      draftId: "draft-1",
      status: "draft_intent",
      requiresReview: true,
      noAutoPublish: true,
      noSilentMerge: true,
    });
    mocks.handleAttachDraftSave.mockResolvedValue(upstreamResponse);

    const request = req({
      sourceRunId: "run-1",
      ctaId: "perspektive_anhaengen",
      attachTargetType: "claim",
      attachTargetId: "claim-1",
      sourceSummary: "Kurzsummary",
    });
    const response = await createAttachDraftPOST(request);

    expect(mocks.handleAttachDraftSave).toHaveBeenCalledTimes(1);
    expect(mocks.handleAttachDraftSave).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("draft_intent");
    expect(body.noAutoPublish).toBe(true);
    expect(body.noSilentMerge).toBe(true);
  });
});
