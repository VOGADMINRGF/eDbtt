import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAiRouteSmokes } from "@/features/ops/statusReport/collect";
import type { StatusReportConfig } from "@/features/ops/statusReport/config";

describe("ai-route-fallback-status.contract", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const payload = JSON.parse(String(init?.body ?? "{}"));
        if (payload?.test === "ping") {
          return new Response(JSON.stringify({ ok: true, result: { ping: "pong" } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            ok: true,
            fallback: true,
            result: { claims: [], questions: [], knots: [] },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks standard analyze as yellow when fallback mode is active", async () => {
    const config: StatusReportConfig = {
      enabled: true,
      recipients: ["ops@example.org"],
      timezone: "Europe/Berlin",
      subjectPrefix: "",
      includeAiSmokes: true,
      baseUrl: "http://localhost:3000",
      slotGraceMinutes: 20,
      scheduleSlots: ["05:00", "17:00"],
    };

    const checks = await runAiRouteSmokes(config);
    const fullCheck = checks.find((check) => check.key === "ai_contributions_full");
    expect(fullCheck?.status).toBe("yellow");
  });
});
