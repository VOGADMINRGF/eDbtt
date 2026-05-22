import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONTENT_ZONE_INVENTORY,
  getContentZoneEntry,
  listContentZoneEntriesByAiZone,
  listContentZoneEntriesByContentZone,
  listContentZoneEntriesByPiiZone,
  listHighImpactContentZoneEntries,
} from "@/features/security/contentZoneInventory";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");

function assertContains(haystack: string, needle: string, context: string) {
  if (!haystack.includes(needle)) {
    throw new Error(`${context} missing anchor: ${needle}`);
  }
}

describe("content zone inventory", () => {
  it("covers the rollout surfaces for create, review, publish, public and audit zones", () => {
    expect(CONTENT_ZONE_INVENTORY.id).toBe("GOV-SEC-03");
    expect(CONTENT_ZONE_INVENTORY.version).toBe("2026-05-21");

    expect(CONTENT_ZONE_INVENTORY.entries.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        "create_input_surface",
        "create_save_surface",
        "persisted_create_handoff_surface",
        "review_queue_surface",
        "source_result_surface",
        "content_release_workbench_surface",
        "public_topic_page_surface",
        "public_dossier_surface",
        "public_runden_surface",
        "public_link_qr_share_surface",
        "unified_audit_trail_surface",
      ]),
    );

    expect(listContentZoneEntriesByContentZone("public_content").length).toBeGreaterThan(0);
    expect(listContentZoneEntriesByContentZone("review_only").length).toBeGreaterThan(0);
    expect(listContentZoneEntriesByContentZone("organization_private").length).toBeGreaterThan(0);
    expect(listContentZoneEntriesByContentZone("operator_only").length).toBeGreaterThan(0);
    expect(listContentZoneEntriesByContentZone("source_material").length).toBeGreaterThan(0);
    expect(listContentZoneEntriesByPiiZone("pii_possible").length).toBeGreaterThan(0);
    expect(listContentZoneEntriesByAiZone("ai_processing_allowed").length).toBeGreaterThan(0);
    expect(listContentZoneEntriesByAiZone("ai_processing_restricted").length).toBeGreaterThan(0);
    expect(listHighImpactContentZoneEntries().length).toBeGreaterThan(0);
  });

  it("marks the highest-risk surfaces with the expected publication, PII and AI guardrails", () => {
    expect(getContentZoneEntry("create_input_surface")).toMatchObject({
      piiZone: "pii_possible",
      contentZones: expect.arrayContaining(["review_only", "source_material"]),
      aiZone: "ai_processing_allowed",
      publicationGuard: {
        noAutoPublish: true,
        noAutomaticPublicOfficial: true,
        noPublicPiiLeakage: true,
      },
      aiGuard: {
        deepSearchResearchExplicitOnly: true,
        automaticResearchCosts: false,
      },
      auditCoverage: {
        requirement: "high_impact_requires_audit",
      },
    });

    expect(getContentZoneEntry("persisted_create_handoff_surface")).toMatchObject({
      contentZones: expect.arrayContaining(["review_only", "organization_private"]),
      publicationGuard: {
        reviewOnlyStaysInternal: true,
        publicLinksRequireVisibleState: true,
      },
      auditCoverage: {
        unifiedAuditReadsideVisible: true,
        unifiedAuditSources: ["create_handoff"],
      },
    });

    expect(getContentZoneEntry("content_release_workbench_surface")).toMatchObject({
      contentZones: expect.arrayContaining(["review_only", "public_content"]),
      publicationGuard: {
        noAutomaticPublicOfficial: true,
        publicLinksRequireVisibleState: true,
      },
      auditCoverage: {
        requirement: "high_impact_requires_audit",
        unifiedAuditReadsideVisible: true,
      },
    });

    expect(getContentZoneEntry("public_link_qr_share_surface")).toMatchObject({
      contentZones: expect.arrayContaining(["public_content", "review_only"]),
      publicationGuard: {
        publicLinksRequireVisibleState: true,
        reviewOnlyStaysInternal: true,
      },
    });

    expect(getContentZoneEntry("public_topic_page_surface")).toMatchObject({
      publicationGuard: {
        noAutomaticPublicOfficial: true,
        publicLinksRequireVisibleState: true,
      },
    });

    expect(getContentZoneEntry("public_dossier_surface")).toMatchObject({
      publicationGuard: {
        reviewOnlyStaysInternal: true,
      },
    });

    expect(getContentZoneEntry("public_runden_surface")).toMatchObject({
      publicationGuard: {
        publicLinksRequireVisibleState: true,
      },
    });

    expect(getContentZoneEntry("unified_audit_trail_surface")).toMatchObject({
      contentZones: expect.arrayContaining(["operator_only", "review_only"]),
      auditCoverage: {
        requirement: "high_impact_requires_audit",
        unifiedAuditReadsideVisible: true,
        unifiedAuditSources: expect.arrayContaining([
          "review_operations",
          "content_release",
          "official_release",
        ]),
      },
    });
  });

  it("keeps source anchors aligned with the rollout zone guardrails", () => {
    for (const entry of CONTENT_ZONE_INVENTORY.entries) {
      expect(entry.sourceAnchors.length).toBeGreaterThan(0);
      for (const anchor of entry.sourceAnchors) {
        const absolutePath = path.join(REPO_ROOT, anchor.file);
        if (!existsSync(absolutePath)) {
          throw new Error(`${entry.id} references missing file: ${anchor.file}`);
        }
        const source = readFileSync(absolutePath, "utf8");
        for (const needle of anchor.contains) {
          assertContains(source, needle, `${entry.id} (${anchor.file})`);
        }
      }
    }
  });
});
