import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";

describe("rate-limit loader fail-closed contract", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("never turns a null loader result into allow-all", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");

    await expect(
      rateLimitOrThrow("loader-null", 3, 600_000),
    ).rejects.toMatchObject({
      name: "RateLimiterUnavailableError",
      message: "rate_limiter_unavailable",
    });
  });
});
