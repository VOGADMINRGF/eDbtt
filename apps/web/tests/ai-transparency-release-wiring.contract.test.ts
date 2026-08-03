import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTES = [
  "src/app/api/admin/review/content-release/route.ts",
  "src/app/api/account/organization/review/content-release/route.ts",
] as const;

describe("AI transparency release wiring", () => {
  it.each(ROUTES)("guards public release before persistence in %s", (route) => {
    const source = readFileSync(resolve(process.cwd(), route), "utf8");
    const gateCall = source.indexOf("resolveContentReleaseAiTransparencyGate({");
    const blockedResponse = source.indexOf('error: "ai_transparency_guard_blocked"');
    const updateCall = source.indexOf("updateContentReleaseTargetFromSourceResult({");

    expect(gateCall).toBeGreaterThan(-1);
    expect(blockedResponse).toBeGreaterThan(gateCall);
    expect(updateCall).toBeGreaterThan(blockedResponse);
    expect(source).toContain(
      "aiTransparency: parseAiTransparencyRecord(body.aiTransparency)",
    );
  });
});
