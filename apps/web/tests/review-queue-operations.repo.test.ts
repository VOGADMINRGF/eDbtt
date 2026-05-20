import { beforeEach, describe, expect, it } from "vitest";
import {
  applyReviewQueueOperation,
  createInMemoryReviewQueueOperationRepo,
  getReviewQueueOperationPersistenceState,
  getReviewQueueOperationRecord,
  listReviewQueueOperationAuditEvents,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";

describe("review queue operations repository", () => {
  beforeEach(() => {
    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
  });

  it("keeps assign operations available through repository reads", async () => {
    await applyReviewQueueOperation({
      itemId: "region_source_result:source-result-1",
      action: "assign",
      requestedByUserId: "admin-1",
      assignedToUserId: "admin-2",
    });

    const record = await getReviewQueueOperationRecord("region_source_result:source-result-1");

    expect(record).toMatchObject({
      itemId: "region_source_result:source-result-1",
      operationalStatus: "open",
      assignedToUserId: "admin-2",
      assignedByUserId: "admin-1",
    });
  });

  it("keeps notes available through repository reads and audit events", async () => {
    await applyReviewQueueOperation({
      itemId: "region_source_result:source-result-1",
      action: "add_note",
      requestedByUserId: "admin-1",
      note: "Bitte Regionenzuordnung vor Veröffentlichung prüfen.",
    });

    const record = await getReviewQueueOperationRecord("region_source_result:source-result-1");
    const auditEvents = await listReviewQueueOperationAuditEvents(
      "region_source_result:source-result-1",
    );

    expect(record).toMatchObject({
      noteCount: 1,
      latestNote: "Bitte Regionenzuordnung vor Veröffentlichung prüfen.",
    });
    expect(auditEvents[0]).toMatchObject({
      action: "add_note",
      note: "Bitte Regionenzuordnung vor Veröffentlichung prüfen.",
    });
  });

  it("marks in-memory fallback explicitly as non-production truth", () => {
    expect(getReviewQueueOperationPersistenceState()).toMatchObject({
      mode: "in_memory_fallback",
      productionTruth: false,
      restartReconstructable: false,
      deploymentReconstructable: false,
    });
  });
});
