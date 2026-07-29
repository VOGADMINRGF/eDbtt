import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  afterCallbacks: [] as Array<() => void | Promise<void>>,
  afterError: null as Error | null,
  aiReaderCol: vi.fn(async () => {
    throw new Error("telemetry_primary_unavailable");
  }),
  coreCol: vi.fn(async () => ({
    insertOne: vi.fn(async () => {
      throw new Error("telemetry_fallback_unavailable");
    }),
  })),
}));

vi.mock("next/server", () => ({
  after: vi.fn((callback: () => void | Promise<void>) => {
    if (mocks.afterError) throw mocks.afterError;
    mocks.afterCallbacks.push(callback);
  }),
}));

vi.mock("@core/db/triMongo", () => ({
  aiReaderCol: (...args: unknown[]) => mocks.aiReaderCol(...args),
  coreCol: (...args: unknown[]) => mocks.coreCol(...args),
}));

import { scheduleAuthEvent } from "@/app/api/auth/authEventScheduling";

describe("auth event best-effort telemetry", () => {
  afterEach(() => {
    mocks.afterCallbacks.length = 0;
    mocks.afterError = null;
    vi.clearAllMocks();
  });

  it("binds telemetry to after() without blocking and contains persistence failures", async () => {
    expect(() =>
      scheduleAuthEvent("auth.2fa.success", {
        meta: {
          method: "otp",
          userHash: "hashed-user",
          ipHash: "hashed-ip",
        },
      }),
    ).not.toThrow();

    expect(mocks.aiReaderCol).not.toHaveBeenCalled();
    expect(mocks.coreCol).not.toHaveBeenCalled();
    expect(mocks.afterCallbacks).toHaveLength(1);

    await expect(mocks.afterCallbacks[0]()).resolves.toBeUndefined();
    expect(mocks.aiReaderCol).toHaveBeenCalledTimes(1);
    expect(mocks.coreCol).toHaveBeenCalledTimes(1);
  });

  it("does not change the auth outcome when after() cannot register work", () => {
    mocks.afterError = new Error("request_lifetime_unavailable");

    expect(() =>
      scheduleAuthEvent("auth.login.success", {
        meta: { userHash: "hashed-user" },
      }),
    ).not.toThrow();
    expect(mocks.afterCallbacks).toHaveLength(0);
    expect(mocks.aiReaderCol).not.toHaveBeenCalled();
  });
});
