import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROUTE_SECURITY_INVENTORY,
  getRouteSecurityEntry,
  listRouteSecurityEntriesByClassification,
} from "@/features/security/routeSecurityInventory";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");

function assertContains(haystack: string, needle: string, context: string) {
  if (!haystack.includes(needle)) {
    throw new Error(`${context} missing anchor: ${needle}`);
  }
}

describe("route security inventory", () => {
  it("covers the current rollout with all required access classes", () => {
    expect(ROUTE_SECURITY_INVENTORY.id).toBe("GOV-SEC-02");
    expect(ROUTE_SECURITY_INVENTORY.version).toBe("2026-05-21");

    expect(listRouteSecurityEntriesByClassification("public").length).toBeGreaterThan(0);
    expect(listRouteSecurityEntriesByClassification("authenticated").length).toBeGreaterThan(0);
    expect(listRouteSecurityEntriesByClassification("organization_scoped").length).toBeGreaterThan(0);
    expect(listRouteSecurityEntriesByClassification("operator_only").length).toBeGreaterThan(0);
    expect(listRouteSecurityEntriesByClassification("internal_system").length).toBeGreaterThan(0);
    expect(listRouteSecurityEntriesByClassification("preview_review_only").length).toBeGreaterThan(0);
  });

  it("classifies the highest-risk rollout routes with the expected guards", () => {
    expect(getRouteSecurityEntry("public_contribution_analyze")).toMatchObject({
      primaryClassification: "public",
      aiGuard: {
        deepSearch: "explicit_opt_in",
        automaticResearchCosts: false,
      },
      publicationGuard: {
        noAutoPublish: true,
        noAutomaticPublicOfficial: true,
      },
    });

    expect(getRouteSecurityEntry("authenticated_contribution_save")).toMatchObject({
      primaryClassification: "authenticated",
      requiresValidSession: true,
      usesRequestScopeContext: true,
    });

    expect(getRouteSecurityEntry("scoped_create_handoff_persist")).toMatchObject({
      primaryClassification: "organization_scoped",
      operatorFallback: "forbidden",
      orgIsolation: "enforced",
    });

    expect(getRouteSecurityEntry("organization_review_item_ops")).toMatchObject({
      primaryClassification: "organization_scoped",
      pendingOrUnverifiedModerationBlocked: true,
      operatorFallback: "forbidden",
      auditCoverage: {
        unifiedAuditReadsideVisible: true,
        unifiedAuditSources: ["review_operations"],
      },
    });

    expect(getRouteSecurityEntry("operator_review_item_ops")).toMatchObject({
      primaryClassification: "operator_only",
      operatorModeExplicit: true,
      requiresValidSession: true,
    });

    expect(getRouteSecurityEntry("review_only_region_official_release")).toMatchObject({
      primaryClassification: "preview_review_only",
      publicationGuard: {
        noAutomaticPublicOfficial: true,
      },
      auditCoverage: {
        unifiedAuditReadsideVisible: true,
        unifiedAuditSources: ["official_release"],
      },
    });

    expect(getRouteSecurityEntry("public_dossier_read")).toMatchObject({
      primaryClassification: "public",
      publicationGuard: {
        reviewOnlyStaysInternal: true,
        publicLinksRequireVisibleState: true,
      },
    });

    expect(getRouteSecurityEntry("operator_review_surface")).toMatchObject({
      primaryClassification: "operator_only",
      auditCoverage: {
        unifiedAuditReadsideVisible: true,
        unifiedAuditSources: [
          "review_operations",
          "content_release",
          "official_release",
          "source_results",
        ],
      },
    });

    expect(getRouteSecurityEntry("internal_status_report_scheduler")).toMatchObject({
      primaryClassification: "internal_system",
      requiresValidSession: false,
      operatorFallback: "not_applicable",
    });
  });

  it("keeps its source anchors aligned with the documented route guards", () => {
    for (const entry of ROUTE_SECURITY_INVENTORY.entries) {
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
