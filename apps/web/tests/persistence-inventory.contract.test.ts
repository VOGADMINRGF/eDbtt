import { describe, expect, it, vi } from "vitest";

async function importInventoryWithFallback(fallbackActive: boolean) {
  vi.resetModules();
  vi.doMock("@core/db/triMongo", async () => {
    const actual = await vi.importActual<typeof import("@core/db/triMongo")>(
      "@core/db/triMongo",
    );
    return {
      ...actual,
      shouldUseInMemoryMongoFallback: () => fallbackActive,
    };
  });
  return import("@features/persistenceInventory");
}

describe("persistence inventory contract", () => {
  it("marks repo-backed surfaces as persistent when runtime fallback is disabled", async () => {
    const inventoryModule = await importInventoryWithFallback(false);
    const inventory = inventoryModule.buildPersistenceInventory();
    const handoffs = inventory.entries.find((entry) => entry.surface === "create_handoffs");
    const reviewQueue = inventory.entries.find((entry) => entry.surface === "review_queue_items");
    const topicPages = inventory.entries.find((entry) => entry.surface === "topic_pages");

    expect(inventory.summary.fallbackActive).toBe(false);
    expect(handoffs?.effectiveMode).toBe("persistent");
    expect(handoffs?.productionCandidateReady).toBe(true);
    expect(reviewQueue?.effectiveMode).toBe("derived");
    expect(topicPages?.effectiveMode).toBe("derived");
    expect(topicPages?.repositoryInterfaces).toContain("PublicTopicPageRepository");
  });

  it("marks repo-backed surfaces as in-memory when runtime fallback is active", async () => {
    const inventoryModule = await importInventoryWithFallback(true);
    const inventory = inventoryModule.buildPersistenceInventory();
    const sourceResults = inventory.entries.find((entry) => entry.surface === "source_results");
    const workbench = inventory.entries.find(
      (entry) => entry.surface === "content_release_workbench",
    );

    expect(inventory.summary.fallbackActive).toBe(true);
    expect(sourceResults?.effectiveMode).toBe("in_memory");
    expect(sourceResults?.restartRisk).toBe("critical");
    expect(workbench?.effectiveMode).toBe("in_memory");
    expect(workbench?.productionCandidateReady).toBe(false);
  });

  it("exposes a stable repository registry and audit repository contract", async () => {
    const inventoryModule = await importInventoryWithFallback(true);
    const registry = inventoryModule.getPersistenceRepositoryRegistry();

    expect(typeof registry.createHandoffs.get).toBe("function");
    expect(typeof registry.createHandoffs.save).toBe("function");
    expect(typeof registry.reviewQueueOperations.getRecord).toBe("function");
    expect(typeof registry.reviewQueueOperations.appendAuditEvent).toBe("function");
    expect(typeof registry.reviewQueueOperations.getPersistenceState).toBe("function");
    expect(typeof registry.reviewQueueOperations.listAuditEventsForItems).toBe("function");
    expect(typeof registry.sourceConnections.listConnections).toBe("function");
    expect(typeof registry.contentRelease.getTargetRecord).toBe("function");
    expect(typeof registry.contentRelease.listAuditEventsForRecords).toBe("function");
    expect(typeof registry.contentRelease.getPersistenceState).toBe("function");
    expect(typeof registry.publicTopicPages.getVisibleBySlug).toBe("function");
    expect(typeof registry.publicTopicPages.getPersistenceState).toBe("function");
    expect(typeof registry.auditEvents.listContentReleaseEvents).toBe("function");
    expect(typeof registry.auditEvents.listReviewQueueOperationEvents).toBe("function");
  });
});
