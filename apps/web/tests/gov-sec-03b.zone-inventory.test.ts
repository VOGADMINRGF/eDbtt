import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type ZoneStatus = "klar" | "gemischt" | "unklar";

type SourceAnchor = {
  file: string;
  contains: string[];
};

type ZoneEntry = {
  id: string;
  routePathGroup: string[];
  centralStoresCollections: string[];
  logsAuditTelemetrySinks: string[];
  hasAiProviderTransition: boolean;
  zoneAssignment: string[];
  status: ZoneStatus;
  statusNote: string;
  sourceAnchors: SourceAnchor[];
};

type ZoneInventory = {
  id: string;
  version: string;
  derivedFrom: string;
  statusLegend: ZoneStatus[];
  zones: string[];
  entries: ZoneEntry[];
};

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const INVENTORY_PATH = path.join(
  REPO_ROOT,
  "docs",
  "E150",
  "GOV-SEC-03B_ZONE_INVENTORY_2026-03-27.json",
);

function readInventory(): ZoneInventory {
  const raw = readFileSync(INVENTORY_PATH, "utf8");
  return JSON.parse(raw) as ZoneInventory;
}

function assertContains(haystack: string, needle: string, context: string) {
  if (!haystack.includes(needle)) {
    throw new Error(`${context} missing anchor: ${needle}`);
  }
}

describe("GOV-SEC-03B zone inventory drift contract", () => {
  it("keeps high-impact groups machine-readable", () => {
    const inventory = readInventory();

    expect(inventory.id).toBe("GOV-SEC-03B");
    expect(inventory.derivedFrom).toBe("docs/E150/GOV-SEC-03A_ZONE_MATRIX_2026-03-27.md");
    expect(inventory.statusLegend).toEqual(["klar", "gemischt", "unklar"]);

    const ids = inventory.entries.map((entry) => entry.id).sort();
    expect(ids).toEqual(
      [
        "analyze_orchestrator_path",
        "auth_core_pii_log_sink",
        "direct_ai_diag_paths",
        "factcheck_enqueue_status_paths",
        "finalize_dossier_audit_path",
        "finding_upsert_cross_store_path",
        "swipes_votes_usage_split",
      ].sort(),
    );

    for (const entry of inventory.entries) {
      expect(entry.routePathGroup.length).toBeGreaterThan(0);
      expect(entry.centralStoresCollections.length).toBeGreaterThan(0);
      expect(entry.logsAuditTelemetrySinks.length).toBeGreaterThan(0);
      expect(entry.zoneAssignment.length).toBeGreaterThan(0);
      expect(entry.sourceAnchors.length).toBeGreaterThan(0);
      expect(inventory.statusLegend).toContain(entry.status);
    }
  });

  it("keeps source anchors aligned with the documented high-impact subset", () => {
    const inventory = readInventory();

    for (const entry of inventory.entries) {
      for (const anchor of entry.sourceAnchors) {
        const absolutePath = path.join(REPO_ROOT, anchor.file);
        if (!existsSync(absolutePath)) {
          throw new Error(`${entry.id} references missing file: ${anchor.file}`);
        }
        const content = readFileSync(absolutePath, "utf8");
        for (const needle of anchor.contains) {
          assertContains(content, needle, `${entry.id} (${anchor.file})`);
        }
      }
    }
  });
});
