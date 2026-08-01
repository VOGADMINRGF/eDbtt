import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const originalNextRuntime = process.env.NEXT_RUNTIME;
const mocks = vi.hoisted(() => ({
  consumePersistentRateLimit: vi.fn(),
  getCreateContributionDraftForResumeRecord: vi.fn(),
}));

vi.mock("@/utils/persistentRateLimit", () => ({
  consumePersistentRateLimit: (input: unknown) =>
    mocks.consumePersistentRateLimit(input),
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
    delete process.env.NEXT_RUNTIME;
    mocks.consumePersistentRateLimit.mockResolvedValue({
      ok: true,
      remaining: 10,
      limit: 12,
      resetAt: Date.now() + 60_000,
      retryIn: 0,
    });
    mocks.getCreateContributionDraftForResumeRecord.mockResolvedValue(
      ownDraft(),
    );
  });

  afterEach(() => {
    if (originalNextRuntime === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = originalNextRuntime;
    }
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
    expect(mocks.consumePersistentRateLimit).not.toHaveBeenCalled();
  });

  it("applies shared persistent authenticated-user and IP limits with hashed subjects", async () => {
    const response = await enforceCreateMutationSecurity({
      req: request({ "x-forwarded-for": "203.0.113.42" }),
      scope: "create_link_analysis",
      actorKey: "user:user-1",
    });

    expect(response).toBeNull();
    expect(mocks.consumePersistentRateLimit).toHaveBeenCalledTimes(2);
    expect(mocks.consumePersistentRateLimit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        namespace: "create:create_link_analysis:actor",
        subjectHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        limit: 12,
        windowMs: 600_000,
      }),
    );
    expect(mocks.consumePersistentRateLimit).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        namespace: "create:create_link_analysis:ip",
        subjectHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        limit: 30,
        windowMs: 600_000,
      }),
    );
    expect(mocks.consumePersistentRateLimit.mock.calls[0]?.[0].subjectHash).not.toBe(
      mocks.consumePersistentRateLimit.mock.calls[1]?.[0].subjectHash,
    );
  });

  it("returns a controlled rate limit and fails closed if storage is unavailable", async () => {
    mocks.consumePersistentRateLimit
      .mockResolvedValueOnce({
        ok: false,
        remaining: 0,
        limit: 12,
        resetAt: Date.now() + 5_000,
        retryIn: 5_000,
      })
      .mockResolvedValueOnce({
        ok: true,
        remaining: 1,
        limit: 30,
        resetAt: Date.now() + 5_000,
        retryIn: 0,
      });
    const limited = await enforceCreateMutationSecurity({
      req: request(),
      scope: "create_intelligent_followup",
      actorKey: "user:user-1",
    });
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get("retry-after")).toBe("5");

    mocks.consumePersistentRateLimit.mockReset();
    mocks.consumePersistentRateLimit.mockRejectedValue(
      new Error("limiter unavailable"),
    );
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

  it("fails closed when the persistent loader is unavailable in an unsupported runtime", async () => {
    process.env.NEXT_RUNTIME = "edge";
    const response = await enforceCreateMutationSecurity({
      req: request(),
      scope: "create_save",
      actorKey: "user:user-1",
    });

    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toMatchObject({
      errorCode: "CREATE_RATE_LIMIT_UNAVAILABLE",
    });
    expect(mocks.consumePersistentRateLimit).not.toHaveBeenCalled();
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
