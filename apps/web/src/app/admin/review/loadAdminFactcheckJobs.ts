import { getFactcheckWorkflowRepo, type FactcheckJobDoc } from "@features/factcheck/db";

export async function loadAdminFactcheckJobs(): Promise<FactcheckJobDoc[]> {
  return (await getFactcheckWorkflowRepo().list().catch(() => [] as FactcheckJobDoc[]))
    .filter((job) =>
      [
        "queued",
        "running",
        "completed",
        "failed",
        "cancelled",
        "needs_manual_review",
        "seal_review_required",
        "sealed",
      ].includes(job.status),
    )
    .sort(
      (left, right) =>
        new Date(String(right.updatedAt ?? right.createdAt)).getTime() -
        new Date(String(left.updatedAt ?? left.createdAt)).getTime(),
    )
    .slice(0, 80);
}
