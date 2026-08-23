import { describe, expect, it } from "vitest";
import {
  evaluateAlpha2TaskEligibility,
  findAlpha2OpenTask,
  listAlpha2EligibleTasks,
  parseAlpha2CanonicalOpenTasks,
} from "@/features/agenticRuntime/alpha2OpenTasksEligibilityContract";

const OPEN_TASKS_FIXTURE = `
# E150 Open Tasks

| ID | Status | Priorität | Abhängigkeiten | Scope | Akzeptanzkriterien |
| --- | --- | --- | --- | --- | --- |
| ALPHA2-RUN-CONTRACT-01 | codex_ready | P0 | none | contract | typed lifecycle |
| ALPHA2-LEDGER-01 | blocked | P0 | RUN | ledger | persistent |
| EXISTING-SLICE-01 | in_progress | P0 | none | code | existing PR |
| REVIEW-SLICE-01 | review | P0 | PR #1 | review | human review |
| MANUAL-SLICE-01 | manual_gate | P0 | provider | prod | human gate |
| DONE-SLICE-01 | done | P1 | none | done | evidence |

## Historisches Archiv

| ID | Status | Priorität | Abhängigkeiten | Scope | Akzeptanzkriterien |
| --- | --- | --- | --- | --- | --- |
| ALPHA2-RUN-CONTRACT-01 | done | P9 | old | archived | stale |
`;

describe("Alpha-Foxtrott 2 OpenTasks eligibility adapter", () => {
  it("uses the first canonical row and ignores later historical duplicates", () => {
    const tasks = parseAlpha2CanonicalOpenTasks(OPEN_TASKS_FIXTURE);
    const runContract = findAlpha2OpenTask(OPEN_TASKS_FIXTURE, "ALPHA2-RUN-CONTRACT-01");

    expect(tasks).toHaveLength(6);
    expect(runContract).toMatchObject({
      status: "codex_ready",
      priority: "P0",
      scope: "contract",
    });
  });

  it("allows a new slice only for codex_ready without existing ownership", () => {
    const task = findAlpha2OpenTask(OPEN_TASKS_FIXTURE, "ALPHA2-RUN-CONTRACT-01");
    expect(task).not.toBeNull();

    expect(evaluateAlpha2TaskEligibility({ task: task! })).toMatchObject({
      newSliceEligible: true,
      continuationEligible: false,
      mustReuseExistingOwner: false,
      requiresHumanDecision: false,
    });
  });

  it("forces existing branch/PR reuse instead of duplicate work", () => {
    const task = findAlpha2OpenTask(OPEN_TASKS_FIXTURE, "ALPHA2-RUN-CONTRACT-01");
    expect(task).not.toBeNull();

    const eligibility = evaluateAlpha2TaskEligibility({
      task: task!,
      ownership: {
        branch: "feat/alpha2-control-plane-contracts-01",
        prNumber: 635,
        exactHead: true,
        ciState: "pending",
        unresolvedReviewThreads: 0,
      },
    });

    expect(eligibility).toMatchObject({
      newSliceEligible: false,
      continuationEligible: true,
      mustReuseExistingOwner: true,
    });
    expect(eligibility.reasonCodes).toContain("existing_owner_must_be_reused");
  });

  it("keeps review and manual gates fail-closed", () => {
    for (const taskId of ["REVIEW-SLICE-01", "MANUAL-SLICE-01"]) {
      const task = findAlpha2OpenTask(OPEN_TASKS_FIXTURE, taskId);
      expect(task).not.toBeNull();
      expect(evaluateAlpha2TaskEligibility({ task: task! })).toMatchObject({
        newSliceEligible: false,
        continuationEligible: false,
        requiresHumanDecision: true,
      });
    }
  });

  it("continues in-progress work only through the existing owner and exact head", () => {
    const task = findAlpha2OpenTask(OPEN_TASKS_FIXTURE, "EXISTING-SLICE-01");
    expect(task).not.toBeNull();

    const exact = evaluateAlpha2TaskEligibility({
      task: task!,
      ownership: { branch: "pr/existing", prNumber: 99, exactHead: true, ciState: "success" },
    });
    const stale = evaluateAlpha2TaskEligibility({
      task: task!,
      ownership: { branch: "pr/existing", prNumber: 99, exactHead: false, ciState: "success" },
    });

    expect(exact.continuationEligible).toBe(true);
    expect(stale.continuationEligible).toBe(false);
    expect(stale.reasonCodes).toContain("owner_not_on_exact_head");
  });

  it("returns only tasks eligible for new work or owned continuation", () => {
    const eligible = listAlpha2EligibleTasks({
      openTasksText: OPEN_TASKS_FIXTURE,
      ownershipByTaskId: {
        "EXISTING-SLICE-01": {
          branch: "pr/existing",
          prNumber: 99,
          exactHead: true,
          ciState: "success",
        },
      },
    });

    expect(eligible.map((task) => task.taskId)).toEqual([
      "ALPHA2-RUN-CONTRACT-01",
      "EXISTING-SLICE-01",
    ]);
  });
});
