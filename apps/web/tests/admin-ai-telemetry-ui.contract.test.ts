import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("admin ai telemetry ui contracts", () => {
  it("orchestrator page separates Create Planner, Provider Probe, Runtime Smoke and Full Contract", () => {
    const page = read("src/app/admin/telemetry/ai/orchestrator/page.tsx");
    const diag = read("src/features/ai/adminTelemetryDiagnostics.ts");
    expect(page).toContain("Create Planner Live Smoke");
    expect(page).toContain("/api/admin/ai/create-planner-smoke");
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

  it("restores safe admin diagnostics while keeping prompts and raw provider payloads hidden", () => {
    const page = read("src/app/admin/telemetry/ai/orchestrator/page.tsx");
    const diag = read("src/features/ai/adminTelemetryDiagnostics.ts");

    expect(page).toContain("Technische Details");
    expect(page).toContain("Run-ID");
    expect(page).toContain("Korrelations-ID");
    expect(page).toContain("Provider-Code");
    expect(page).toContain("Konfiguriertes Modell");
    expect(page).toContain("Timeout");
    expect(page).toContain("Dauer");
    expect(page).toContain("Parse / Schema");
    expect(page).toContain("Schema-Pfad");
    expect(page).toContain("Tokens in / out");
    expect(page).toContain("Geschätzte Kosten");
    expect(page).not.toContain("rawExcerpt");
    expect(page).not.toContain("providerErrorMessage");
    expect(page).not.toContain("bestRawText");
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
