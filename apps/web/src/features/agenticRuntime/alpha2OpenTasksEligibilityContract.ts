export const ALPHA2_OPEN_TASK_STATUSES = [
  "blocked",
  "codex_ready",
  "in_progress",
  "review",
  "manual_gate",
  "done",
] as const;

export type Alpha2OpenTaskStatus = (typeof ALPHA2_OPEN_TASK_STATUSES)[number];

export type Alpha2OpenTaskRecord = {
  id: string;
  status: Alpha2OpenTaskStatus;
  priority: string;
  dependencies: string;
  scope: string;
  acceptance: string;
};

export type Alpha2TaskOwnershipEvidence = {
  branch?: string | null;
  prNumber?: number | null;
  exactHead?: boolean | null;
  ciState?: "unknown" | "pending" | "success" | "failure";
  unresolvedReviewThreads?: number | null;
};

export type Alpha2TaskEligibility = {
  taskId: string;
  status: Alpha2OpenTaskStatus;
  newSliceEligible: boolean;
  continuationEligible: boolean;
  mustReuseExistingOwner: boolean;
  requiresHumanDecision: boolean;
  reasonCodes: string[];
  ownership: Alpha2TaskOwnershipEvidence;
};

const STATUS_SET = new Set<string>(ALPHA2_OPEN_TASK_STATUSES);

function cleanCell(value: string | undefined) {
  return (value ?? "").trim();
}

/**
 * Parse canonical OpenTasks rows without creating another backlog truth.
 *
 * The operative head is intentionally read top-to-bottom and the first
 * occurrence of an ID wins. This prevents archived/historical duplicates
 * later in OpenTasks.md from silently overriding the current operative head.
 */
export function parseAlpha2CanonicalOpenTasks(text: string): Alpha2OpenTaskRecord[] {
  const records = new Map<string, Alpha2OpenTaskRecord>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("|")) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length < 2) continue;
    const id = cleanCell(cells[0]);
    const status = cleanCell(cells[1]);

    if (!id || id === "ID" || id.startsWith("---")) continue;
    if (!STATUS_SET.has(status)) continue;
    if (records.has(id)) continue;

    records.set(id, {
      id,
      status: status as Alpha2OpenTaskStatus,
      priority: cleanCell(cells[2]),
      dependencies: cleanCell(cells[3]),
      scope: cleanCell(cells[4]),
      acceptance: cleanCell(cells[5]),
    });
  }

  return [...records.values()];
}

export function findAlpha2OpenTask(text: string, taskId: string) {
  return parseAlpha2CanonicalOpenTasks(text).find((task) => task.id === taskId) ?? null;
}

export function evaluateAlpha2TaskEligibility(input: {
  task: Alpha2OpenTaskRecord;
  ownership?: Alpha2TaskOwnershipEvidence;
}): Alpha2TaskEligibility {
  const ownership = input.ownership ?? {};
  const hasOwner = Boolean(ownership.branch || ownership.prNumber);
  const reasonCodes: string[] = [];

  let newSliceEligible = false;
  let continuationEligible = false;
  let mustReuseExistingOwner = false;
  let requiresHumanDecision = false;

  switch (input.task.status) {
    case "codex_ready":
      if (hasOwner) {
        continuationEligible = true;
        mustReuseExistingOwner = true;
        reasonCodes.push("existing_owner_must_be_reused");
      } else {
        newSliceEligible = true;
        reasonCodes.push("codex_ready_without_existing_owner");
      }
      break;
    case "in_progress":
      if (hasOwner) {
        continuationEligible = true;
        mustReuseExistingOwner = true;
        reasonCodes.push("in_progress_reuse_existing_owner");
      } else {
        requiresHumanDecision = true;
        reasonCodes.push("in_progress_missing_owner_evidence");
      }
      break;
    case "review":
      requiresHumanDecision = true;
      reasonCodes.push("review_is_fail_closed");
      break;
    case "manual_gate":
      requiresHumanDecision = true;
      reasonCodes.push("manual_gate_is_fail_closed");
      break;
    case "blocked":
      reasonCodes.push("task_blocked");
      break;
    case "done":
      reasonCodes.push("task_already_done");
      break;
  }

  if (ownership.ciState === "failure") {
    newSliceEligible = false;
    reasonCodes.push("ci_failure_requires_repair_or_review");
  }

  if ((ownership.unresolvedReviewThreads ?? 0) > 0) {
    newSliceEligible = false;
    reasonCodes.push("unresolved_review_threads");
  }

  if (ownership.exactHead === false && hasOwner) {
    continuationEligible = false;
    reasonCodes.push("owner_not_on_exact_head");
  }

  return {
    taskId: input.task.id,
    status: input.task.status,
    newSliceEligible,
    continuationEligible,
    mustReuseExistingOwner,
    requiresHumanDecision,
    reasonCodes,
    ownership,
  };
}

export function listAlpha2EligibleTasks(input: {
  openTasksText: string;
  ownershipByTaskId?: Record<string, Alpha2TaskOwnershipEvidence | undefined>;
}) {
  return parseAlpha2CanonicalOpenTasks(input.openTasksText)
    .map((task) =>
      evaluateAlpha2TaskEligibility({
        task,
        ownership: input.ownershipByTaskId?.[task.id],
      }),
    )
    .filter((result) => result.newSliceEligible || result.continuationEligible);
}
