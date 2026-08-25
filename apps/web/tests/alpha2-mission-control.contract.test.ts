import { describe, expect, it, vi } from "vitest";

vi.mock("@core/db/mongoose", () => ({
  mongo: vi.fn(),
  mongoose: {
    connection: {
      collection: vi.fn(),
    },
  },
}));

vi.mock("@/features/agenticRuntime/alpha2MongoLearningStore", () => ({
  getAlpha2MongoLearningStore: vi.fn(() => ({
    listEvals: vi.fn(async () => []),
    listAcceptedLessons: vi.fn(async () => []),
  })),
}));

import { summarizeAlpha2MissionRuns } from "@/features/agenticRuntime/alpha2MissionControlReadModel";
import { encodeAlpha2ContinuationCursor } from "@/features/agenticRuntime/alpha2ContinuousDispatchContract";
import {
  appendAlpha2Checkpoint,
  createAlpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";
import type { Alpha2RunRecord } from "@/features/agenticRuntime/alpha2RunLifecycleContract";

function payload(input: {
  runId: string;
  status: "queued" | "running" | "waiting" | "review" | "human_gate" | "failed" | "completed";
  resumeAt?: string;
  continuation?: { state: "dispatched" | "human_gate" | "idle" | "complete"; detail?: string };
}) {
  const base = createAlpha2RunRecord({
    runId: input.runId,
    idempotencyKey: `idem-${input.runId}`,
    taskId: `task-${input.runId}`,
    kind: "mission",
    primaryRole: "alpha_orchestrator",
    riskClass: "yellow",
    route: { mode: "automatic", capabilityClass: "orchestration" },
    now: "2026-08-23T21:00:00.000Z",
  });
  let run: Alpha2RunRecord = {
    ...base,
    status: input.status,
    resumeAt: input.resumeAt,
    humanGate:
      input.status === "human_gate"
        ? { state: "pending" as const, reason: "human_decision_required" }
        : base.humanGate,
    finishedAt:
      input.status === "completed" ? "2026-08-23T21:01:00.000Z" : undefined,
    updatedAt: "2026-08-23T21:01:00.000Z",
  };
  if (input.continuation) {
    run = appendAlpha2Checkpoint(run, {
      checkpointId: `continuation-${input.runId}`,
      createdAt: "2026-08-23T21:01:00.000Z",
      status: input.status,
      cursor: encodeAlpha2ContinuationCursor(input.continuation),
      evidenceRefs: [],
      artifactRefs: [],
    });
  }
  return run;
}

describe("Alpha-Foxtrott 2 Mission Control", () => {
  it("summarizes active, human and scheduled work from safe run metadata", () => {
    const result = summarizeAlpha2MissionRuns({
      totalRuns: 7,
      statusRows: [
        { _id: "queued", count: 1 },
        { _id: "running", count: 1 },
        { _id: "waiting", count: 1 },
        { _id: "review", count: 1 },
        { _id: "human_gate", count: 1 },
        { _id: "failed", count: 1 },
        { _id: "completed", count: 1 },
      ],
      recentRows: [
        {
          payload: payload({
            runId: "wait",
            status: "waiting",
            resumeAt: "2026-08-23T22:00:00.000Z",
          }),
          version: 2,
          leaseOwner: null,
          leaseExpiresAt: null,
        },
        {
          payload: payload({ runId: "running", status: "running" }),
          version: 1,
          leaseOwner: "worker-1",
          leaseExpiresAt: new Date("2026-08-23T21:30:00.000Z"),
        },
      ],
      now: "2026-08-23T21:10:00.000Z",
    });

    expect(result.totalRuns).toBe(7);
    expect(result.activeRuns).toBe(4);
    expect(result.humanInbox).toBe(2);
    expect(result.failedRuns).toBe(1);
    expect(result.scheduledRuns).toBe(1);
    expect(result.leasedRuns).toBe(1);
    expect(result.nextEligibleAction).toEqual({
      runId: "running",
      taskId: "task-running",
      status: "running",
    });
    expect(result.recentRuns).toHaveLength(2);
  });

  it("surfaces last autonomous continuation, human gate reason and idle reason", () => {
    const result = summarizeAlpha2MissionRuns({
      totalRuns: 3,
      statusRows: [
        { _id: "completed", count: 2 },
        { _id: "human_gate", count: 1 },
      ],
      recentRows: [
        {
          payload: payload({ runId: "gate", status: "human_gate" }),
          version: 1,
        },
        {
          payload: payload({
            runId: "idle-parent",
            status: "completed",
            continuation: { state: "idle", detail: "no_eligible_task" },
          }),
          version: 2,
        },
        {
          payload: payload({
            runId: "parent",
            status: "completed",
            continuation: { state: "dispatched", detail: "child-run" },
          }),
          version: 3,
        },
      ],
      now: "2026-08-23T21:10:00.000Z",
    });

    expect(result.lastAutonomousContinuation).toEqual({
      runId: "parent",
      nextRunId: "child-run",
      updatedAt: "2026-08-23T21:01:00.000Z",
    });
    expect(result.humanGateReason).toBe("human_decision_required");
    expect(result.idleReason).toBe("no_eligible_task");
  });

  it("drops malformed payloads instead of inventing operator state", () => {
    const result = summarizeAlpha2MissionRuns({
      totalRuns: 1,
      statusRows: [{ _id: "running", count: 1 }],
      recentRows: [{ payload: { invalid: true }, version: 0 }],
      now: "2026-08-23T21:10:00.000Z",
    });

    expect(result.statusCounts.running).toBe(1);
    expect(result.recentRuns).toEqual([]);
    expect(result.nextEligibleAction).toBeNull();
  });
});
