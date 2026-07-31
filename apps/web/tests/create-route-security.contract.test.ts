import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  getCreateContributionDraftForResumeRecord: vi.fn(),
}));

vi.mock("@/utils/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => mocks.rateLimit(...args),
}));

vi.mock("@/server/serverDrafts", () => ({
  getCreateContributionDraftForResumeRecord: (...args: unknown[]) =>
    mocks.getCreateContributionDraftForResumeRecord(...args),
}));

import {
  enforceCreateMutationSecurity,
  verifyCreateDraftBinding,
} from "@/features/create/createRouteSecurity";

function request(
  headers: Record<string, string> = {},
  body = JSON.stringify({ draftId: "draft-1" }),
) {
  return new NextRequest("http://localhost/api/create/intelligent-followup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      "x-edebatte-create-csrf": "create-mutation-v1",
      ...headers,
    },
    body,
  });
}

function ownDraft(overrides: Record<string, unknown> = {}) {
  return {
    id: "draft-1",
    storage: "drafts",
    status: "draft",
    userId: "user-1",
    locale: "de",
    anlassraumId: null,
    text: "Eigener gespeicherter Beitrag",
    textOriginal: null,
    textPrepared: null,
    analysis: {
      draftWriteRuntime: {
        payloadHash: "payload-hash-1",
      },
    },
    updatedAt: new Date("2026-07-30T12:00:00.000Z"),
    ...overrides,
  };
}

describe("authenticated create mutation security contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({
      ok: true,
      remaining: 10,
      retryIn: 0,
    });
    mocks.getCreateContributionDraftForResumeRecord.mockResolvedValue(
      ownDraft(),
    );
  });

  it.each([
    [{ origin: "https://attacker.example" }, "foreign origin"],
    [{ "sec-fetch-site": "cross-site" }, "cross-site fetch"],
    [{ "sec-fetch-site": "" }, "missing Sec-Fetch-Site"],
    [{ "x-edebatte-create-csrf": "" }, "missing CSRF intent"],
    [{ "x-edebatte-create-csrf": "wrong" }, "wrong CSRF intent"],
  ])("rejects %s before a create mutation", async (headers) => {
    const response = await enforceCreateMutationSecurity({
      req: request(headers),
      scope: "create_intelligent_followup",
      actorKey: "user:user-1",
    });

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      ok: false,
      errorCode: "CREATE_REQUEST_REJECTED",
    });
    expect(mocks.rateLimit).not.toHaveBeenCalled();
  });

  it("applies independent authenticated-user and IP limits", async () => {
    const response = await enforceCreateMutationSecurity({
      req: request({ "x-forwarded-for": "203.0.113.42" }),
      scope: "create_link_analysis",
      actorKey: "user:user-1",
    });

    expect(response).toBeNull();
    expect(mocks.rateLimit).toHaveBeenCalledTimes(2);
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      "create_link_analysis:actor:user:user-1",
      12,
      600_000,
      { salt: "create-route-security-v1" },
    );
    expect(mocks.rateLimit.mock.calls[1]?.[0]).toMatch(
      /^create_link_analysis:ip:/,
    );
  });

  it("returns a controlled rate limit and fails closed if either limiter is unavailable", async () => {
    mocks.rateLimit
      .mockResolvedValueOnce({ ok: false, remaining: 0, retryIn: 5_000 })
      .mockResolvedValueOnce({ ok: true, remaining: 1, retryIn: 0 });
    const limited = await enforceCreateMutationSecurity({
      req: request(),
      scope: "create_intelligent_followup",
      actorKey: "user:user-1",
    });
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get("retry-after")).toBe("5");

    mocks.rateLimit.mockReset();
    mocks.rateLimit.mockRejectedValue(new Error("limiter unavailable"));
    const unavailable = await enforceCreateMutationSecurity({
      req: request(),
      scope: "create_intelligent_followup",
      actorKey: "user:user-1",
    });
    expect(unavailable?.status).toBe(503);
    await expect(unavailable?.json()).resolves.toMatchObject({
      errorCode: "CREATE_RATE_LIMIT_UNAVAILABLE",
    });
  });

  it("accepts only an active canonical draft owned by the authenticated user", async () => {
    const binding = await verifyCreateDraftBinding({
      draftId: "draft-1",
      userId: "user-1",
      text: "Eigener gespeicherter Beitrag",
      locale: "de",
    });

    expect(binding).toMatchObject({
      draftId: "draft-1",
      userId: "user-1",
      payloadHash: "payload-hash-1",
      inputHash: expect.any(String),
    });
    expect(mocks.getCreateContributionDraftForResumeRecord).toHaveBeenCalledWith(
      "draft-1",
      "user-1",
    );
  });

  it.each([
    [null, "invented or deleted"],
    [ownDraft({ userId: "user-2" }), "foreign"],
    [ownDraft({ status: "finalized" }), "finalized"],
    [ownDraft({ storage: "contribution_drafts_legacy" }), "legacy"],
    [ownDraft({ text: "Different stored input" }), "payload input mismatch"],
    [ownDraft({ analysis: {} }), "missing stored payload hash"],
  ])("rejects a %s draft without returning draft details", async (draft) => {
    mocks.getCreateContributionDraftForResumeRecord.mockResolvedValue(draft);

    await expect(
      verifyCreateDraftBinding({
        draftId: "draft-1",
        userId: "user-1",
        text: "Eigener gespeicherter Beitrag",
        locale: "de",
      }),
    ).resolves.toBeNull();
  });
});
