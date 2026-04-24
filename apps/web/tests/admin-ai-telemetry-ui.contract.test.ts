import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("admin ai telemetry ui contracts", () => {
  it("orchestrator page separates Provider Probe, Runtime Smoke and Full Contract", () => {
    const page = read("src/app/admin/telemetry/ai/orchestrator/page.tsx");
    const diag = read("src/features/ai/adminTelemetryDiagnostics.ts");
    expect(page).toContain("Direktprüfung Provider");
    expect(page).toContain("Runtime Smoke");
    expect(page).toContain("Full Analyze Contract Test");
    expect(diag).toContain('return "GPT / OpenAI"');
    expect(diag).toContain("Provider erreichbar; Analyze-/JSON-Contract pruefen.");
  });

  it("dashboard pages expose grouped recent runs with root cause and next action", () => {
    const hubPage = read("src/app/admin/telemetry/ai/page.tsx");
    const dashboardPage = read("src/app/admin/telemetry/ai/dashboard/page.tsx");

    expect(hubPage).toContain("Recent Runs");
    expect(hubPage).toContain("Root Cause");
    expect(hubPage).toContain("Next Action");
    expect(hubPage).toContain("ARI status");

    expect(dashboardPage).toContain("Grouped by runId");
    expect(dashboardPage).toContain("correlationId=");
    expect(dashboardPage).toContain("Provider-Details anzeigen");
  });

  it("orchestrator diagnostics expose parse and schema details separately", () => {
    const page = read("src/app/admin/telemetry/ai/orchestrator/page.tsx");
    const diag = read("src/features/ai/adminTelemetryDiagnostics.ts");

    expect(page).toContain("providerCode=");
    expect(page).toContain("parseError=");
    expect(page).toContain("schemaError=");
    expect(page).toContain("schemaPath=");
    expect(diag).toContain("Schema-Contract und Pflichtfelder pruefen.");
  });
});
