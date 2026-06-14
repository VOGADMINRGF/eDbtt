export type BranchActionIntent =
  | "prepare_qr_poll"
  | "prepare_swipes"
  | "request_review_or_sources"
  | "save_only";

export type BranchDecisionStatus = "draft" | "prepared";

export type MultibranchFoundationBranch = {
  id: string;
  title: string;
  summary: string;
  selectedAction: BranchActionIntent | null;
  status: BranchDecisionStatus;
};

export type ContributionPackageFoundation<TBranch extends MultibranchFoundationBranch> = {
  id: string;
  kind: "multi_branch_draft";
  headline: string;
  summary: string;
  branches: TBranch[];
  source: "gpt_planner";
  requiresConfirmation: true;
  createdAt: string;
};

export function resolveStableActiveBranchId<T extends { id: string }>(
  currentBranchId: string | null | undefined,
  branches: readonly T[],
): string {
  if (currentBranchId && branches.some((branch) => branch.id === currentBranchId)) {
    return currentBranchId;
  }
  return branches[0]?.id ?? "";
}

export function hasCompletedContributionPackageSelection<T extends { selectedAction: BranchActionIntent | null }>(
  contributionPackage: { branches: readonly T[] } | null | undefined,
): boolean {
  const branches = contributionPackage?.branches ?? [];
  return branches.length > 0 && branches.every((branch) => branch.selectedAction !== null);
}
