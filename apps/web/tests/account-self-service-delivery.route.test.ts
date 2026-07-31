import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  userId: "66b0bca9f1b1444b8f635301",
  user: null as Record<string, any> | null,
  applicationMutationCount: 0,
  sendMail: vi.fn(),
  clearSession: vi.fn(async () => {}),
  verifyPassword: vi.fn(async () => true),
}));

function setPath(target: Record<string, any>, path: string, value: unknown) {
  const parts = path.split(".");
  let current = target;
  for (const part of parts.slice(0, -1)) {
    current[part] ??= {};
    current = current[part];
  }
  current[parts.at(-1)!] = value;
}

function applyUpdate(target: Record<string, any>, update: Record<string, any>) {
  for (const [path, value] of Object.entries(update.$set ?? {})) {
    setPath(target, path, value);
  }
}

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  const users = {
    findOne: vi.fn(async () => mocks.user),
    findOneAndUpdate: vi.fn(
      async (query: Record<string, any>, update: Record<string, any>) => {
        if (!mocks.user) return null;
        const deletion = mocks.user.accountDeletion;
        if (query["accountDeletion.status"]?.$exists === false && deletion) {
          return null;
        }
        if (
          query["accountDeletion.status"] === "requested" &&
          deletion?.deliveryClaimId
        ) {
          return null;
        }
        applyUpdate(mocks.user, update);
        return mocks.user;
      },
    ),
    updateOne: vi.fn(
      async (query: Record<string, any>, update: Record<string, any>) => {
        if (
          query["accountDeletion.deliveryClaimId"] &&
          query["accountDeletion.deliveryClaimId"] !==
            mocks.user?.accountDeletion?.deliveryClaimId
        ) {
          return { modifiedCount: 0 };
        }
        applyUpdate(mocks.user!, update);
        return { modifiedCount: 1 };
      },
    ),
  };
  const applications = {
    updateMany: vi.fn(async () => {
      mocks.applicationMutationCount += 1;
      return { modifiedCount: 1 };
    }),
  };
  return {
    ObjectId,
    coreCol: vi.fn(async (name: string) =>
      name === "users" ? users : applications,
    ),
  };
});

vi.mock("@core/db/db/triMongo", () => ({
  piiCol: vi.fn(async () => ({
    findOne: vi.fn(async () => ({ passwordHash: "stored-hash" })),
  })),
}));

vi.mock("@/utils/session", () => ({
  readSession: vi.fn(async () => ({ uid: mocks.userId })),
  clearSession: (...args: unknown[]) => mocks.clearSession(...args),
}));

vi.mock("@/utils/password", () => ({
  verifyPassword: (...args: unknown[]) => mocks.verifyPassword(...args),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
  mailFailureMetadata: (result: Record<string, unknown>) => ({
    status: result.status,
    category: result.category,
    retryable: result.retryable,
    attemptedCount: result.attemptedCount,
    deliveredCount: result.deliveredCount,
    failedCount: result.failedCount,
  }),
}));

import { POST } from "@/app/api/account/self-service/route";

const transientFailure = {
  ok: false,
  status: "failed",
  transport: "smtp",
  code: "mail_transport_error",
  category: "smtp_timeout",
  retryable: true,
  attemptedCount: 1,
  deliveredCount: 0,
  failedCount: 1,
  messageId: null,
};

const delivered = {
  ok: true,
  status: "delivered",
  transport: "smtp",
  category: null,
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 1,
  failedCount: 0,
  messageId: "delete-message",
};

function deletionRequest(note = "Bitte löschen") {
  return new NextRequest("http://localhost/api/account/self-service", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "delete_account",
      note,
      password: "correct-password",
    }),
  });
}

describe("account deletion required-delivery workflow", () => {
  beforeEach(async () => {
    const { ObjectId } = await import("mongodb");
    vi.clearAllMocks();
    mocks.applicationMutationCount = 0;
    mocks.user = {
      _id: new ObjectId(mocks.userId),
      email: "member@company.de",
      name: "Member",
      membership: { status: "active" },
    };
    mocks.sendMail
      .mockResolvedValueOnce(transientFailure)
      .mockResolvedValueOnce(delivered);
  });

  it("keeps the session after mail failure and retries the same persisted deletion request", async () => {
    const first = await POST(deletionRequest("Erster Grund"));
    const requestId = mocks.user?.accountDeletion?.requestId;

    expect(first.status).toBe(502);
    await expect(first.json()).resolves.toMatchObject({
      ok: false,
      partial: true,
      mutationPersisted: true,
      action: "delete_account",
      delivery: { category: "smtp_timeout", retryable: true },
    });
    expect(requestId).toEqual(expect.any(String));
    expect(mocks.user?.accountDeletion).toMatchObject({
      status: "requested",
      reason: "Erster Grund",
      deliveryStatus: "failed",
      deliveryRetryable: true,
    });
    expect(mocks.clearSession).not.toHaveBeenCalled();
    expect(mocks.applicationMutationCount).toBe(1);

    const second = await POST(deletionRequest("Anderer Grund"));

    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({
      ok: true,
      action: "delete_account",
      next: "/logout",
    });
    expect(mocks.user?.accountDeletion).toMatchObject({
      requestId,
      status: "notified",
      reason: "Erster Grund",
      deliveryStatus: "delivered",
    });
    expect(mocks.applicationMutationCount).toBe(1);
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
    expect(mocks.sendMail.mock.calls[1]?.[0]?.mail.text).toContain(
      "Erster Grund",
    );
    expect(mocks.sendMail.mock.calls[1]?.[0]?.mail.text).not.toContain(
      "Anderer Grund",
    );
    expect(mocks.clearSession).toHaveBeenCalledTimes(1);
  });
});
