import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  aiReaderCol: vi.fn(async () => {
    throw new Error("telemetry_primary_unavailable");
  }),
  coreCol: vi.fn(async () => ({
    insertOne: vi.fn(async () => {
      throw new Error("telemetry_fallback_unavailable");
    }),
  })),
}));

vi.mock("@core/db/triMongo", () => ({
  aiReaderCol: (...args: unknown[]) => mocks.aiReaderCol(...args),
  coreCol: (...args: unknown[]) => mocks.coreCol(...args),
}));

import { logAuthEventBestEffort } from "@core/telemetry/authEvents";

describe("auth event best-effort telemetry", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("contains telemetry rejection without blocking or leaking auth data", async () => {
    expect(() =>
      logAuthEventBestEffort("auth.2fa.success", {
        meta: {
          method: "otp",
          userHash: "hashed-user",
          ipHash: "hashed-ip",
        },
      }),
    ).not.toThrow();

    await vi.waitFor(() => {
      expect(mocks.coreCol).toHaveBeenCalledTimes(1);
    });
  });
});
