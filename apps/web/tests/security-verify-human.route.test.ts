import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  incrementRateLimit: vi.fn(),
  validatePuzzleAnswer: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  incrementRateLimit: (...args: unknown[]) => mocks.incrementRateLimit(...args),
}));

vi.mock("@/lib/security/human-puzzle", () => ({
  validatePuzzleAnswer: (...args: unknown[]) => mocks.validatePuzzleAnswer(...args),
}));

import { POST as verifyHumanPOST } from "@/app/api/security/verify-human/route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/security/verify-human", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/security/verify-human", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.incrementRateLimit.mockResolvedValue(1);
    mocks.validatePuzzleAnswer.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns explicit 503 when production secret is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HUMAN_CHECK_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");

    const res = await verifyHumanPOST(
      req({
        puzzleSeed: "seed-12345678",
        puzzleAnswer: 12,
        timeToSolve: 1200,
        formId: "register",
      }),
    );

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      code: "human_token_secret_not_configured",
    });
  });
});
