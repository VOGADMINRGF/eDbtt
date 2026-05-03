import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createCommunityContribution: vi.fn(),
  listCommunityContributions: vi.fn(),
  runContentTranslationProduction: vi.fn(),
}));

vi.mock("@core/communityContributions", () => ({
  createCommunityContribution: (...args: unknown[]) =>
    mocks.createCommunityContribution(...args),
  listCommunityContributions: (...args: unknown[]) =>
    mocks.listCommunityContributions(...args),
}));

vi.mock("@/features/i18n/contentTranslationProduction", () => ({
  runContentTranslationProduction: (...args: unknown[]) =>
    mocks.runContentTranslationProduction(...args),
}));

import { POST as contributionsPOST } from "@/app/api/community/contributions/route";

describe("community contributions actor-trust route contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCommunityContribution.mockResolvedValue({ id: "c-2", status: "proposed" });
    mocks.runContentTranslationProduction.mockResolvedValue({
      content: null,
      targetLocales: [],
      missingLocales: [],
      attemptedLocales: [],
      producedLocales: [],
      failedLocales: [],
    });
  });

  it("stores anonymous public contribution without author name", async () => {
    const req = new NextRequest("http://localhost/api/community/contributions", {
      method: "POST",
      body: JSON.stringify({
        type: "question",
        topicId: "mobilitaet",
        body: "Wie wird Nachtlogistik berücksichtigt?",
        authorVisibility: "anonymous",
        authorName: "Soll ignoriert werden",
        hostedRoomScope: "closed_hosted",
        confidentialHint: true,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await contributionsPOST(req);
    expect(res.status).toBe(200);

    const payload = mocks.createCommunityContribution.mock.calls[0]?.[0];
    expect(payload.authorVisibility).toBe("anonymous");
    expect(payload.authorName).toBeNull();
    expect(payload.hostedRoomScope).toBe("closed_hosted");
    expect(payload.confidentialHint).toBe(true);
  });

  it("requires author name for nickname visibility", async () => {
    const req = new NextRequest("http://localhost/api/community/contributions", {
      method: "POST",
      body: JSON.stringify({
        type: "option",
        topicId: "energie",
        title: "Option A",
        body: "Optionstext",
        authorVisibility: "nickname",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await contributionsPOST(req);
    expect(res.status).toBe(400);
    expect(mocks.createCommunityContribution).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          authorName: expect.arrayContaining(["author_name_required_for_visibility"]),
        }),
      }),
    });
  });
});
