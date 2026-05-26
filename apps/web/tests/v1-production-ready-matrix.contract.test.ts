import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MATRIX_PATH = resolve(process.cwd(), "../../docs/E150/ProductionReadinessMatrix.md");
const matrixSource = readFileSync(MATRIX_PATH, "utf8");

function sectionBetween(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from === -1 || to === -1) {
    throw new Error(`section not found: ${start} -> ${end}`);
  }
  return source.slice(from, to);
}

describe("v1 production ready matrix contract", () => {
  it("marks every current V1 promise category as production_ready", () => {
    const promiseSection = sectionBetween(
      matrixSource,
      "## V1-Produktversprechen (hart)",
      "## V1-Produktionsstand 2026-05-26",
    );

    [
      "Create / Intake",
      "Swipes",
      "Anlassraum / Runden / QR / Share",
      "Dossier public",
      "Dossier Update / Suggestions / Review",
      "Feed Radar Runtime",
      "Social Distribution Queue",
      "Stream Public Runtime",
      "Review Queue / Moderation / Audit",
      "Org-/Region-Scope fuer V1",
      "Public Routes",
      "Pricing / Membership fuer V1",
    ].forEach((label) => {
      expect(promiseSection).toContain(`| ${label} | production_ready |`);
    });
  });

  it("does not keep the current V1 status block on candidate, pilot or blocked language", () => {
    const v1StatusSection = sectionBetween(
      matrixSource,
      "## V1-Produktionsstand 2026-05-26",
      "## Kategorische Lesart (2026-05-26)",
    );

    expect(v1StatusSection).not.toMatch(/\bproduction_candidate\b/);
    expect(v1StatusSection).not.toMatch(/\bpilot_ready\b/);
    expect(v1StatusSection).not.toMatch(/\bfoundation\b/);
    expect(v1StatusSection).not.toMatch(/\bblocked\b/);
  });

  it("keeps the hardened dossier, review, feed and pricing rows on production_ready", () => {
    [
      "| 11 | Dossier Datenmodell / Collections |",
      "| 12 | Dossier Viewer oeffentlich |",
      "| 13 | Dossier Admin-/Review-Workflow |",
      "| 15 | Regionales Verwaltungscockpit |",
      "| 20 | Region-/Org-/Tenant-Isolation |",
      "| 22 | Review-/Freigabeprozess |",
      "| 27 | Output Studio Master-Post Workspace |",
      "| 29 | Output Studio Persistenz |",
      "| 30 | Pricing / Order / Vormerken |",
      "| 37 | Meta-Layer / Provenance / Audit |",
    ].forEach((prefix) => {
      expect(matrixSource).toContain(`${prefix}`);
      expect(matrixSource).toContain(`${prefix.replace(/ \|$/, "")}`);
    });

    expect(matrixSource).toMatch(/\| 11 \| Dossier Datenmodell \/ Collections \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 12 \| Dossier Viewer oeffentlich \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 13 \| Dossier Admin-\/Review-Workflow \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 15 \| Regionales Verwaltungscockpit \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 20 \| Region-\/Org-\/Tenant-Isolation \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 22 \| Review-\/Freigabeprozess \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 27 \| Output Studio Master-Post Workspace \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 29 \| Output Studio Persistenz \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 30 \| Pricing \/ Order \/ Vormerken \|[\s\S]*?\| production_ready \|/);
    expect(matrixSource).toMatch(/\| 37 \| Meta-Layer \/ Provenance \/ Audit \|[\s\S]*?\| production_ready \|/);
  });

  it("keeps explicit post-v1 exclusions instead of smuggling them into the V1 promise", () => {
    expect(matrixSource).toContain("- externe Social-Live-Connectoren");
    expect(matrixSource).toContain("- echtes Streaming-Encoding/WebRTC");
    expect(matrixSource).toContain("- Self-Service-Billing/Checkout");
    expect(matrixSource).toContain("- breite externe Quellenautomatisierung ohne Operator-Gates");
  });
});
