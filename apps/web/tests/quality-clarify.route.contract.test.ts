import { describe, expect, it } from "vitest";
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
});
