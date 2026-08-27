import { describe, expect, it } from "vitest";
import {
  createAlpha2ResolvingExecutor,
  runAlpha2DurableStep,
} from "@/features/agenticRuntime/alpha2DurableOrchestrator";
import type {
  Alpha2ExecutionDispatch,
  Alpha2ExecutionDispatcher,
} from "@/features/agenticRuntime/alpha2BullmqExecutionQueue";
import {
  isAlpha2HumanStoppedRun,
  isAlpha2TerminalRun,
  type Alpha2RunLedger,
  type Alpha2VersionedRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";
import {
  createAlpha2RunRecord,
  type Alpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";

const NOW = "2026-08-27T09:00:00.000Z";
const HEAD = "1111111111111111111111111111111111111111";
const AUTHORIZED_OPENTASKS = `
## Kanonischer Operativteil
| ID | Status | Priorität | Abhängigkeiten | Scope / Ziel | Akzeptanzkriterien / Evidence |
| --- | --- | --- | --- | --- | --- |
| ALPHA2-TEST-01 | in_progress | P0 |  | Test | Test |
## Historischer Katalog und Evidenz
`;

class PersistenceLedger implements Alpha2RunLedger {
  private record: Alpha2VersionedRun | null = null;
  transientCompletedWrites = 0;
  completedWriteAttempts = 0;

  seed(run: Alpha2RunRecord) {
    this.record = { run, version: 0, lease: null };
  }

  async createOrGet(run: Alpha2RunRecord) {
    if (this.record) return { record: this.record, created: false };
    this.seed(run);
    return { record: this.record!, created: true };
  }

  async getByRunId(runId: string) {
    return this.record?.run.runId === runId ? this.record : null;
  }

  async getByIdempotencyKey(idempotencyKey: string) {
    return this.record?.run.idempotencyKey === idempotencyKey ? this.record : null;
  }

  async compareAndSwap(input: {
    run: Alpha2RunRecord;
    expectedVersion: number;
    lease?: { owner: string; now: string };
    resumeAfterMs?: number;
    initializeWallClock?: { maxWallClockMs?: number };
    stampCheckpointId?: string;
  }) {
    const current = this.record;
    if (!current || current.version !== input.expectedVersion) {
      throw new Error("alpha2_ledger_version_conflict");
    }
    if (input.lease && current.lease?.owner !== input.lease.owner) {
      throw new Error("alpha2_ledger_lease_lost");
    }
    if (input.run.status === "completed") {
      this.completedWriteAttempts += 1;
      if (this.transientCompletedWrites > 0) {
        this.transientCompletedWrites -= 1;
        const error = new Error("simulated transient mongo write");
        error.name = "MongoNetworkError";
        throw error;
      }
    }
    const next = {
      run: input.run,
      version: current.version + 1,
      lease: current.lease,
    } satisfies Alpha2VersionedRun;
    this.record = next;
    return next;
  }

  async tryAcquireLease(input: {
    runId: string;
    owner: string;
    now: string;
    leaseMs: number;
  }) {
    const current = this.record;
    if (!current || current.run.runId !== input.runId) return null;
    if (isAlpha2TerminalRun(current.run) || isAlpha2HumanStoppedRun(current.run)) return null;
    const next = {
      ...current,
      lease: {
        owner: input.owner,
        expiresAt: new Date(Date.parse(NOW) + input.leaseMs).toISOString(),
      },
    } satisfies Alpha2VersionedRun;
    this.record = next;
    return next;
  }

  async renewLease(input: {
    runId: string;
    owner: string;
    now: string;
    leaseMs: number;
  }) {
    const current = this.record;
    if (!current || current.run.runId !== input.runId || current.lease?.owner !== input.owner) {
      return null;
    }
    const next = {
      ...current,
      lease: {
        owner: input.owner,
        expiresAt: new Date(Date.parse(NOW) + input.leaseMs).toISOString(),
      },
    } satisfies Alpha2VersionedRun;
    this.record = next;
    return next;
  }

  async isRunDue(input: { runId: string; now: string }) {
    const current = this.record;
    return Boolean(
      current &&
        current.run.runId === input.runId &&
        !isAlpha2TerminalRun(current.run) &&
        !isAlpha2HumanStoppedRun(current.run),
    );
  }

  async releaseLease(input: { runId: string; owner: string }) {
    const current = this.record;
    if (!current || current.run.runId !== input.runId || current.lease?.owner !== input.owner) {
      return;
    }
    this.record = { ...current, lease: null };
  }

  async listRecoverable(_input: { now: string; limit?: number }) {
    return [];
  }
}

class NoopDispatcher implements Alpha2ExecutionDispatcher {
  jobs: Alpha2ExecutionDispatch[] = [];

  async dispatch(input: Alpha2ExecutionDispatch) {
    this.jobs.push(input);
    return { jobId: `job-${this.jobs.length}` };
  }
}

function testRun(id: string) {
  return createAlpha2RunRecord({
    runId: id,
    idempotencyKey: `idem-${id}`,
    taskId: "ALPHA2-TEST-01",
    kind: "engineering_slice",
    primaryRole: "governance_compliance",
    riskClass: "green",
    route: { mode: "automatic", capabilityClass: "test" },
    budget: { maxAttempts: 1 },
    now: NOW,
  });
}

function authorization() {
  return {
    observedHeadSha: HEAD,
    observedAt: NOW,
    openTasksText: AUTHORIZED_OPENTASKS,
    ownership: {
      branch: "feat/alpha2-test",
      prNumber: 637,
      exactHead: true,
      ciState: "success" as const,
      unresolvedReviewThreads: 0,
    },
    action: {
      actionKind: "read_only" as const,
      riskClass: "green" as const,
      confidence: "high" as const,
      reversible: true,
      evidenceRefs: ["test:alpha2-outcome-persistence"],
    },
  };
}

describe("Alpha2 outcome persistence hardening", () => {
  it("retries a transient completed-outcome CAS while retaining the active lease", async () => {
    const ledger = new PersistenceLedger();
    const dispatcher = new NoopDispatcher();
    ledger.seed(testRun("run-transient-outcome"));
    ledger.transientCompletedWrites = 1;
    let executions = 0;

    const result = await runAlpha2DurableStep({
      runId: "run-transient-outcome",
      workerId: "worker-transient-outcome",
      ledger,
      dispatcher,
      executor: {
        async execute() {
          executions += 1;
          return { type: "completed", checkpointId: "completed-once" };
        },
      },
      currentHeadSha: HEAD,
      authorization: authorization(),
      now: NOW,
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("completed");
    expect(result.run.attempt).toBe(1);
    expect(executions).toBe(1);
    expect(ledger.completedWriteAttempts).toBe(2);
  });

  it("persists the structured resolver timeout code instead of the generic Error name", async () => {
    const ledger = new PersistenceLedger();
    const dispatcher = new NoopDispatcher();
    ledger.seed(testRun("run-resolver-timeout-code"));

    const executor = createAlpha2ResolvingExecutor({
      resolver: {
        resolve: () => new Promise<never>(() => undefined),
      },
      resolutionTimeoutMs: 1,
    });

    const result = await runAlpha2DurableStep({
      runId: "run-resolver-timeout-code",
      workerId: "worker-resolver-timeout-code",
      ledger,
      dispatcher,
      executor,
      currentHeadSha: HEAD,
      authorization: authorization(),
      now: NOW,
    });

    expect(result.state).toBe("executed");
    if (result.state !== "executed") throw new Error("unexpected state");
    expect(result.run.status).toBe("failed");
    expect(result.run.lastErrorCode).toBe("alpha2_executor_resolution_timeout");
  });
});
