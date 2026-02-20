import type { WorkflowState } from "./types";

const allowedTransitions: Record<WorkflowState, WorkflowState[]> = {
  draft: ["in_review"],
  in_review: ["approved", "draft"],
  approved: ["published"],
  published: ["archived"],
  archived: [],
};

export function canTransition(current: WorkflowState, next: WorkflowState): boolean {
  return allowedTransitions[current]?.includes(next) ?? false;
}
