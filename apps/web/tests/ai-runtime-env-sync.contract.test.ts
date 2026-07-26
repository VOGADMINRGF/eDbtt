import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ai runtime env example sync", () => {
  it("documents every actively read ai runtime policy key", () => {
    const envExample = readFileSync(path.resolve(process.cwd(), ".env.example"), "utf8");
    const requiredKeys = [
      "GOOGLE_API_KEY=",
      "ARI_BASE_URL=",
      "ARI_URL=",
      "ARI_API_URL=",
      "OPENAI_PLANNER_MODEL=",
      "CREATE_PLANNER_TIMEOUT_MS=",
      "OPENAI_SMOKE_MODEL=",
      "OPENAI_SMOKE_TIMEOUT_MS=",
      "OPENAI_SMOKE_MAX_OUTPUT_TOKENS=",
      "OPENAI_FAST_MODEL=",
      "OPENAI_TRACE_MODEL=",
      "ARI_MODEL=",
      "E150_DEEPSEARCH_ENABLED=",
      "E150_DEEPSEARCH_REQUIRE_CONFIRMATION=",
      "OPENAI_DEEPSEARCH_MODEL=",
      "E150_PRESENTATION_PASS_DEFAULT=",
    ];

    for (const key of requiredKeys) {
      expect(envExample).toContain(key);
    }
  });
});
