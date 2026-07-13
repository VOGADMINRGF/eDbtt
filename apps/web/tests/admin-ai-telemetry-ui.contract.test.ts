import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("admin ai telemetry ui contracts", () => {
  it("orchestrator page separates Provider Probe, Runtime Smoke and Full Contract as safe operator summaries", () => {
    const page = read("src/app/admin/telemetry/ai/orchestrator/page.tsx");
    const diag = read("src/features/ai/adminTelemetryDiagnostics.ts");
    expect(page).toContain("Direktprüfung Provider");
    expect(page).toContain("Runtime Smoke");
    expect(page).toContain("Full Analyze Contract Test");
    expect(page).toContain("Sichere Trace-Wahrheit");
    expect(page).toContain("Sichere Orchestrierungszusammenfassung");
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

  it("orchestrator diagnostics keep raw parse, schema, provider and token details out of the UI surface", () => {
    const page = read("src/app/admin/telemetry/ai/orchestrator/page.tsx");
    const diag = read("src/features/ai/adminTelemetryDiagnostics.ts");

    expect(page).not.toContain("providerCode=");
    expect(page).not.toContain("parseError=");
    expect(page).not.toContain("schemaError=");
    expect(page).not.toContain("schemaPath=");
    expect(page).not.toContain("rawExcerpt");
    expect(page).not.toContain("Tokens in/out");
    expect(page).not.toContain("estimatedCost");
    expect(diag).toContain("Schema-Contract und Pflichtfelder pruefen.");
  });

  it("orchestrator page explains review-first routing without leaking raw lane or provider-role internals", () => {
    const page = read("src/app/admin/telemetry/ai/orchestrator/page.tsx");
    const policy = read("src/features/ai/v2OrchestrationPolicy.ts");

    expect(page).not.toContain("normalizedLane=");
    expect(page).not.toContain("Provider Roles");
    expect(page).not.toContain("smokeStatus=");
    expect(page).toContain("Review");
    expect(page).toContain("Kosten und Freigaben");
    expect(policy).toContain("Übersprungen, nicht nötig");
    expect(policy).toContain("Übersprungen, nicht in dieser Lane");
    expect(policy).toContain("Konfiguration fehlt");
  });
});
