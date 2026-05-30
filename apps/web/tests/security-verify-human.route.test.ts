import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  incrementRateLimit: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  incrementRateLimit: (...args: unknown[]) => mocks.incrementRateLimit(...args),
}));

import { POST as verifyHumanPOST } from "@/app/api/security/verify-human/route";
import { derivePuzzle } from "@/lib/security/human-puzzle";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/security/verify-human", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const THREE_PLUS_THREE_SEED = "seed-0034-41";

describe("/api/security/verify-human", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.incrementRateLimit.mockResolvedValue(1);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the correct captcha answer for a deterministic 3 + 3 challenge", async () => {
    expect(derivePuzzle(THREE_PLUS_THREE_SEED)).toMatchObject({
      first: 3,
      second: 3,
      expected: 6,
    });

    const res = await verifyHumanPOST(
      req({
        puzzleSeed: THREE_PLUS_THREE_SEED,
        puzzleAnswer: "6",
        timeToSolve: 0,
        formId: "register",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      verified: true,
      humanToken: expect.any(String),
    });
  });

  it("rejects a wrong captcha answer for the same 3 + 3 challenge", async () => {
    const res = await verifyHumanPOST(
      req({
        puzzleSeed: THREE_PLUS_THREE_SEED,
        puzzleAnswer: "7",
        timeToSolve: 0,
        formId: "register",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      verified: false,
      code: "puzzle",
    });
  });

  it("rejects a filled honeypot without leaking public details", async () => {
    const res = await verifyHumanPOST(
      req({
        honeypotValue: "bot-filled",
        puzzleSeed: THREE_PLUS_THREE_SEED,
        puzzleAnswer: "6",
        timeToSolve: 0,
        formId: "register",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      verified: false,
      code: "honeypot",
    });
  });

  it("returns explicit 503 when production secret is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HUMAN_CHECK_SECRET", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");

    const res = await verifyHumanPOST(
      req({
        puzzleSeed: THREE_PLUS_THREE_SEED,
        puzzleAnswer: "6",
        timeToSolve: 0,
        formId: "register",
      }),
    );

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      verified: false,
      code: "human_token_secret_not_configured",
    });
  });
});
