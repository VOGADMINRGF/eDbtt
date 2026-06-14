import { describe, expect, it } from "vitest";

import {
  hasCompletedContributionPackageSelection,
  resolveStableActiveBranchId,
  type BranchActionIntent,
  type ContributionPackageFoundation,
  type MultibranchFoundationBranch,
} from "@/features/create/createMultibranchFoundation";

type TestBranch = MultibranchFoundationBranch & {
  localOrder: number;
};

function buildBranch(
  id: string,
  selectedAction: BranchActionIntent | null,
  localOrder: number,
): TestBranch {
  return {
    id,
    title: `Themenast ${localOrder}`,
    summary: `Zusammenfassung ${localOrder}`,
    selectedAction,
    status: selectedAction ? "prepared" : "draft",
    localOrder,
  };
}

function buildContributionPackage(
  branches: TestBranch[],
): ContributionPackageFoundation<TestBranch> {
  return {
    id: "package-1",
    kind: "multi_branch_draft",
    headline: "Mehrthemen-Beitrag als Paket",
    summary: "Die Themenäste bleiben einzeln auswählbar.",
    branches,
    source: "gpt_planner",
    requiresConfirmation: true,
    createdAt: "2026-06-09T10:00:00.000Z",
  };
}

describe("create multibranch foundation", () => {
  it("keeps the currently selected branch when it still exists", () => {
    const branches = [
      buildBranch("wohnen", "prepare_qr_poll", 1),
      buildBranch("verkehr", null, 2),
      buildBranch("pflege", "save_only", 3),
    ];

    expect(resolveStableActiveBranchId("verkehr", branches)).toBe("verkehr");
  });

  it("falls back to the first branch when the current branch vanished", () => {
    const branches = [
      buildBranch("wohnen", "prepare_qr_poll", 1),
      buildBranch("verkehr", null, 2),
      buildBranch("pflege", "save_only", 3),
    ];

    expect(resolveStableActiveBranchId("nicht-mehr-da", branches)).toBe("wohnen");
    expect(resolveStableActiveBranchId("", branches)).toBe("wohnen");
    expect(resolveStableActiveBranchId(undefined, branches)).toBe("wohnen");
  });

  it("returns an empty branch id when no branch exists", () => {
    expect(resolveStableActiveBranchId("egal", [])).toBe("");
  });

  it("treats unfinished branch selections as incomplete", () => {
    const contributionPackage = buildContributionPackage([
      buildBranch("wohnen", "prepare_qr_poll", 1),
      buildBranch("verkehr", null, 2),
      buildBranch("pflege", "save_only", 3),
    ]);

    expect(hasCompletedContributionPackageSelection(contributionPackage)).toBe(false);
  });

  it("treats a package as complete once every branch has an explicit action", () => {
    const contributionPackage = buildContributionPackage([
      buildBranch("wohnen", "prepare_qr_poll", 1),
      buildBranch("verkehr", "request_review_or_sources", 2),
      buildBranch("pflege", "save_only", 3),
    ]);

    expect(hasCompletedContributionPackageSelection(contributionPackage)).toBe(true);
  });
});
