import { describe, expect, it } from "vitest";
import {
  mapWorkbenchItemToOperationsItem,
  summarizePublicModerationOperations,
} from "@/features/create/communitySourceReviewWorkbench";

function buildOperationsInput(overrides: Partial<{
  id: string;
  kind:
    | "source_suggestion"
    | "counter_source"
    | "context_note"
    | "lived_experience"
    | "unclear_claim"
    | "wording_clarification"
    | "escalation_request";
  status:
    | "new"
    | "queued_for_moderation"
    | "needs_source_review"
    | "needs_editorial_review"
    | "escalated"
    | "allowed_as_hint"
    | "hidden"
    | "rejected"
    | "archived";
  priority: "low" | "normal" | "high" | "urgent";
  staleHours: number;
  lastUpdatedAt: string;
  ownerUserId: string | null;
  ownerAssignedAt: string | null;
  ownerAssignmentMode: "manual" | "system" | null;
}>) {
  return {
    id: "public-moderation-item",
    kind: "source_suggestion" as const,
    status: "new" as const,
    priority: "normal" as const,
    staleHours: 4,
    lastUpdatedAt: "2026-07-01T08:00:00.000Z",
    latestAudit: null,
    ownerUserId: null,
    ownerAssignedAt: null,
    ownerAssignmentMode: null,
    ...overrides,
  };
}

describe("public moderation operations", () => {
  it("maps queue, SLA, owner and escalation signals without turning them into truth or publication", () => {
    const fresh = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "fresh",
        staleHours: 2,
      }),
    );
    const escalated = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "escalated",
        kind: "escalation_request",
        status: "escalated",
        priority: "urgent",
        staleHours: 6,
      }),
    );
    const sourceReview = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "source-review",
        status: "needs_source_review",
        staleHours: 84,
      }),
    );
    const editorialReview = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "editorial-review",
        status: "needs_editorial_review",
        staleHours: 30,
      }),
    );
    const stale = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "stale",
        status: "new",
        staleHours: 90,
      }),
    );
    const overdue = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "overdue",
        status: "new",
        staleHours: 140,
      }),
    );
    const hidden = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "hidden",
        status: "hidden",
        staleHours: 12,
      }),
    );
    const rejected = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "rejected",
        status: "rejected",
        staleHours: 10,
      }),
    );
    const archived = mapWorkbenchItemToOperationsItem(
      buildOperationsInput({
        id: "archived",
        status: "archived",
        staleHours: 8,
      }),
    );

    const summary = summarizePublicModerationOperations({
      items: [
        fresh,
        escalated,
        sourceReview,
        editorialReview,
        stale,
        overdue,
        hidden,
        rejected,
        archived,
      ],
    });

    expect(summary.totalActive).toBe(6);
    expect(summary.needsOwnerCount).toBe(6);
    expect(summary.escalatedCount).toBe(1);
    expect(summary.staleOrOverdueCount).toBe(3);
    expect(summary.needsSourceReviewCount).toBe(1);
    expect(summary.needsEditorialReviewCount).toBe(1);
    expect(summary.blockedOrRejectedCount).toBe(2);
    expect(summary.archivedCount).toBe(1);

    expect(fresh.ownerState).toBe("needs_owner");
    expect(fresh.queueBucket).toBe("new");
    expect(fresh.slaState).toBe("on_track");

    expect(escalated.queueBucket).toBe("escalated");
    expect(escalated.slaState).toBe("escalated");
    expect(escalated.priority).toBe("urgent");

    expect(sourceReview.queueBucket).toBe("needs_source_review");
    expect(sourceReview.slaState).toBe("stale");

    expect(editorialReview.queueBucket).toBe("needs_editorial_review");
    expect(editorialReview.slaState).toBe("aging");

    expect(stale.queueBucket).toBe("stale");
    expect(stale.slaState).toBe("stale");

    expect(overdue.queueBucket).toBe("overdue");
    expect(overdue.slaState).toBe("overdue");

    expect(hidden.activeInOperations).toBe(false);
    expect(hidden.queueBucket).toBe("blocked_or_rejected");
    expect(rejected.activeInOperations).toBe(false);
    expect(rejected.queueBucket).toBe("blocked_or_rejected");
    expect(archived.activeInOperations).toBe(false);
    expect(archived.queueBucket).toBe("archived");

    const operationsCopy = escalated.operationalFlagLabels.join(" · ");
    expect(operationsCopy).toContain("Eskaliert");
    expect(operationsCopy).toContain("Owner nötig");
    expect(operationsCopy).not.toContain("Publish");
    expect(operationsCopy).not.toContain("Activation");
    expect(operationsCopy).not.toContain("Graph");
    expect(operationsCopy).not.toContain("Merge");
  });
});
