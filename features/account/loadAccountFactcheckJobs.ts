import { getFactcheckWorkflowRepo } from "@features/factcheck/db";

export async function loadAccountFactcheckJobs(userId: string, limit = 8) {
  return getFactcheckWorkflowRepo().listByUserId(userId, limit);
}
