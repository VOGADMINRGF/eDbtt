import { describe, expect, it } from "vitest";
import {
  buildContributionPackageHandoffItems,
  buildLedgerSimilarityGroupCounts,
} from "@/features/create/branchHandoffTargets";

function buildBranches() {
  return [
    {
      branchId: "branch-place",
      title: "Radweg / Clara-Pankower Allee",
      summary: "Lokales Anliegen zum Radweg.",
      selectedAction: "qr_poll_prepare" as const,
      claimCandidates: [],
      placeCandidates: ["Clara-Pankower Allee"],
      localIssueCandidates: ["Radweg"],
      needsPlaceClarification: true,
      placeClarificationStatus: "pending" as const,
      placeClarificationQuestion: "In welcher Stadt oder welchem Bezirk liegt die Clara-Pankower Allee?",
      sensitivityLevel: "standard" as const,
      existingMatches: [],
    },
    {
      branchId: "branch-review",
      title: "Haftbedingungen",
      summary: "Prüfbedürftiger Themenast.",
      selectedAction: "review_or_sources" as const,
      claimCandidates: [
        {
          id: "claim-review",
          branchId: "branch-review",
          text: "Welche Haftbedingungen sollen überprüft werden?",
          kind: "question" as const,
          source: "planner_open_question" as const,
          inferredStance: "mixed" as const,
          stanceConfirmationStatus: "inferred_only" as const,
        },
      ],
      placeCandidates: [],
      localIssueCandidates: [],
      needsPlaceClarification: false,
      placeClarificationStatus: "answered" as const,
      placeClarificationQuestion: null,
      sensitivityLevel: "legal_sensitive" as const,
      existingMatches: [],
    },
    {
      branchId: "branch-qr",
      title: "Renteneintrittsalter",
      summary: "QR-Beteiligung vorbereiten.",
      selectedAction: "qr_poll_prepare" as const,
      claimCandidates: [],
      placeCandidates: [],
      localIssueCandidates: [],
      needsPlaceClarification: false,
      placeClarificationStatus: "answered" as const,
      placeClarificationQuestion: null,
      sensitivityLevel: "standard" as const,
      existingMatches: [],
    },
    {
      branchId: "branch-swipe",
      title: "Politikertransparenz",
      summary: "Swipe-Aussagen vorbereiten.",
      selectedAction: "public_swipes_prepare" as const,
      claimCandidates: [],
      placeCandidates: [],
      localIssueCandidates: [],
      needsPlaceClarification: false,
      placeClarificationStatus: "answered" as const,
      placeClarificationQuestion: null,
      sensitivityLevel: "civic_sensitive" as const,
      existingMatches: [],
    },
    {
      branchId: "branch-save",
      title: "Schwere Straftaten",
      summary: "Nur als Entwurf speichern.",
      selectedAction: "save_branch_only" as const,
      claimCandidates: [],
      placeCandidates: [],
      localIssueCandidates: [],
      needsPlaceClarification: false,
      placeClarificationStatus: "answered" as const,
      placeClarificationQuestion: null,
      sensitivityLevel: "high_risk" as const,
      existingMatches: [],
    },
  ];
}

describe("create branch handoff workbench contract", () => {
  it("maps branch actions to the expected next workspaces without publish or merge semantics", () => {
    const items = buildContributionPackageHandoffItems({
      packageId: "package-1",
      branches: buildBranches(),
    });

    expect(items.find((item) => item.branchId === "branch-place")?.handoff).toMatchObject({
      handoffTargetType: "place_clarification",
      handoffStatus: "route_missing",
      label: "Ort ergänzen",
    });
    expect(items.find((item) => item.branchId === "branch-review")?.handoff).toMatchObject({
      handoffTargetType: "factcheck_review",
      handoffStatus: "prepared",
      label: "Prüfung und Quellen öffnen",
    });
    expect(items.find((item) => item.branchId === "branch-qr")?.handoff).toMatchObject({
      handoffTargetType: "qr_participation",
      handoffStatus: "prepared",
      label: "QR-Beteiligung öffnen",
    });
    expect(items.find((item) => item.branchId === "branch-swipe")?.handoff).toMatchObject({
      handoffTargetType: "swipe_review",
      handoffStatus: "prepared",
      label: "Swipe-Aussagen prüfen",
    });
    expect(items.find((item) => item.branchId === "branch-save")?.handoff).toMatchObject({
      handoffTargetType: "ledger_detail",
      handoffStatus: "prepared",
      label: "Entwurf ansehen",
    });
    expect(items.find((item) => item.branchId === "branch-review")?.handoff.reviewPreparationDraft).toMatchObject({
      autoStartBlocked: true,
    });
    expect(JSON.stringify(items)).not.toContain("publish");
    expect(JSON.stringify(items)).not.toContain("merged");
    expect(JSON.stringify(items)).not.toContain("voted");
  });

  it("groups semantically similar package signatures without merging them", () => {
    const counts = buildLedgerSimilarityGroupCounts([
      {
        packageId: "package-a",
        branches: [
          { title: "Radweg / Clara-Pankower Allee", placeCandidates: ["Clara-Pankower Allee"], localIssueCandidates: ["Radweg"] },
        ],
      },
      {
        packageId: "package-b",
        branches: [
          { title: "Radweg / Clara-Pankower Allee", placeCandidates: ["Clara-Pankower Allee"], localIssueCandidates: ["Radweg"] },
        ],
      },
      {
        packageId: "package-c",
        branches: [{ title: "Pflege", placeCandidates: [], localIssueCandidates: [] }],
      },
    ]);

    expect(counts.get("package-a")).toBe(2);
    expect(counts.get("package-b")).toBe(2);
    expect(counts.has("package-c")).toBe(false);
  });
});
