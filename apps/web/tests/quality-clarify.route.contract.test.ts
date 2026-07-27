import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST as clarifyPOST } from "@/app/api/quality/clarify/route";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/quality/clarify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/quality/clarify route contract", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns route classification meta and marks path as not canonical legacy exception", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    try {
      const res = await clarifyPOST(makeRequest({ text: "Bitte den Claim klarer formulieren." }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body?.ok).toBe(true);
      expect(body?.meta?.routeClassification?.routePath).toBe("/api/quality/clarify");
      expect(body?.meta?.routeClassification?.canonical).toBe(false);
      expect(body?.meta?.routeClassification?.legacyExceptionPath).toBe(true);
      expect(body?.meta?.routeClassification?.directProviderPath).toBe(true);
    } finally {
      process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("marks heuristic fallback honestly when no provider key is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    const res = await clarifyPOST(makeRequest({ text: "Bitte den Claim klarer formulieren 1." }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.source).toBe("heuristic");
    expect(body?.degraded).toBe(true);
    expect(body?.reason).toBe("MISSING_PROVIDER_KEY");
    expect(body?.providerAttempted).toBe(false);
    expect(body?.providerSucceeded).toBe(false);
  });

  it("marks provider JSON failures as degraded heuristic fallback", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ output_text: "not-json" }),
      }),
    );

    const res = await clarifyPOST(makeRequest({ text: "Bitte den Claim klarer formulieren 2." }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.source).toBe("heuristic");
    expect(body?.degraded).toBe(true);
    expect(body?.reason).toBe("BAD_JSON");
    expect(body?.providerAttempted).toBe(true);
    expect(body?.providerSucceeded).toBe(false);
  });
});
