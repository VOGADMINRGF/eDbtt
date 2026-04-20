import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAiRouteSmokes } from "@/features/ops/statusReport/collect";
import type { StatusReportConfig } from "@/features/ops/statusReport/config";

describe("ai-route-smoke.contract", () => {
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

  it("marks ai smoke checks green when ping and standard analyze succeed", async () => {
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
    expect(checks).toHaveLength(3);
    expect(checks.every((check) => check.status === "green")).toBe(true);
  });
});
