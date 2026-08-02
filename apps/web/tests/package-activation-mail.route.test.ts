import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  userId: "66b0bca9f1b1444b8f635001",
  user: null as Record<string, any> | null,
  updateOne: vi.fn(async () => ({ acknowledged: true })),
  sendMail: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (name === "u_id" ? { value: mocks.userId } : undefined),
  })),
}));

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    ObjectId,
    coreCol: vi.fn(async () => ({
      findOne: vi.fn(async () => mocks.user),
      updateOne: mocks.updateOne,
    })),
  };
});

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

import { POST } from "@/app/api/edebatte/package/route";

const delivered = {
  ok: true,
  status: "delivered",
  transport: "smtp",
  category: null,
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 1,
  failedCount: 0,
  messageId: "package-message",
};

describe("package activation mail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = {
      _id: mocks.userId,
      email: "english-package@example.org",
      displayName: "Alex",
      settings: { preferredLocale: "en-GB" },
      edebatte: { package: null, status: null },
    };
    mocks.sendMail.mockResolvedValue(delivered);
  });

  it("renders an actual English activation mail from the persisted user locale", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/edebatte/package", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ package: "basis", source: "self_service" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      activationMailDelivered: true,
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    const options = mocks.sendMail.mock.calls[0]?.[0];
    expect(options.delivery).toBe("best_effort_delivery");
    expect(options.mail.locale).toBe("en");
    expect(options.mail.subject).toBe("eDebatte Basic activated");
    expect(options.mail.html).toContain('lang="en"');
    expect(options.mail.text).toContain("Your eDebatte Basic package is now active.");
    expect(options.mail.text).not.toContain("Dein Paket");
  });
});
