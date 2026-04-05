import { afterEach, describe, expect, it, vi } from "vitest";
import { signHumanToken, verifyHumanTokenDetailed } from "@/lib/security/human-token";

describe("human token secret hygiene", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses dev fallback secret outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("HUMAN_CHECK_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");

    const token = await signHumanToken({
      formId: "public-updates",
      timeToSolve: 1200,
      puzzleSeed: "seed-12345678",
    });
    const verified = await verifyHumanTokenDetailed(token);
    expect(verified.ok).toBe(true);
  });

  it("rejects signing in production when no human token secret is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HUMAN_CHECK_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");

    await expect(
      signHumanToken({
        formId: "public-updates",
        timeToSolve: 1200,
        puzzleSeed: "seed-12345678",
      }),
    ).rejects.toThrow("human_token_secret_not_configured");
  });
});
