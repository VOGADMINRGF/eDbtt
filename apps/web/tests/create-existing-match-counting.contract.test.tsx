import { describe, expect, it } from "vitest";

import {
  buildCreateContributionLedgerEntry,
  dedupeCreateContributionLedgerEntries,
} from "@features/create/createContributionLedger";
import type { ContributionPackage } from "@/features/create/createContributionPackageContract";

function buildContributionPackage(
  userDecision: NonNullable<ContributionPackage["branches"][number]["existingMatches"][number]["userDecision"]>,
  overrides?: Partial<ContributionPackage["branches"][number]["existingMatches"][number]>,
): ContributionPackage {
  return {
    id: "package-match-1",
    kind: "multi_branch_draft",
    headline: "Mehrthemen-Beitrag als Beitragspaket",
    summary: "Du hast mehrere Themen angesprochen.",
    source: "gpt_planner",
    requiresConfirmation: true,
    createdAt: "2026-06-04T09:00:00.000Z",
    branches: [
      {
        id: "branch-match-1",
        title: "Wohnen und Mieten",
        summary: "Dieser Teil deines Beitrags dreht sich um Wohnen und Mieten.",
        claimCandidates: [
          {
            id: "claim-1",
            branchId: "branch-match-1",
            text: "Soll bezahlbarer Wohnraum Vorrang vor Einzelprojekten bekommen?",
            kind: "question",
            source: "planner_open_question",
            inferredStance: "pro",
            stanceConfirmationStatus: "inferred_only",
          },
        ],
        sensitivityLevel: "standard",
        selectedAction: null,
        status: "prepared",
        existingMatches: [
          {
            id: "match-1",
            title: "Mehr bezahlbarer Wohnraum",
            targetType: "claim",
            matchedClaimText: "Mehr bezahlbarer Wohnraum",
            currentSupportCount: 5,
            currentOpposeCount: 2,
            currentNeutralCount: 1,
            matchConfidence: 0.91,
            whyMatched: "Ähnliche wohnungspolitische Forderung.",
            userDecision,
            differenceReason: overrides?.differenceReason ?? null,
            userNuanceText: overrides?.userNuanceText ?? null,
            requiresConfirmation: true,
            recordedAsDraftOnly: true,
            confirmedAt: null,
            countedAt: null,
            mergedAt: null,
            ...overrides,
          },
        ],
      },
    ],
  };
}

describe("create existing match counting contract", () => {
  it("persists count_my_position as draft-only without counting or merge timestamps", () => {
    const ledger = buildCreateContributionLedgerEntry({
      ledgerId: "draft-1",
      packageId: "package-match-1",
      userId: "user-1",
      sourceText: "Ich will mehr bezahlbaren Wohnraum.",
      createdAt: "2026-06-04T09:00:00.000Z",
      updatedAt: "2026-06-04T09:05:00.000Z",
      locale: "de",
      contributionPackage: buildContributionPackage("count_my_position"),
      draftSaveStatus: "server_saved",
    });

    expect(ledger.branches[0]?.existingMatchDecision).toMatchObject({
      matchId: "match-1",
      targetType: "claim",
      targetTitle: "Mehr bezahlbarer Wohnraum",
      matchedClaimText: "Mehr bezahlbarer Wohnraum",
      currentSupportCount: 5,
      currentOpposeCount: 2,
      currentNeutralCount: 1,
      matchConfidence: 0.91,
      whyMatched: "Ähnliche wohnungspolitische Forderung.",
      userDecision: "count_my_position",
      recordedAsDraftOnly: true,
      confirmedAt: null,
      countedAt: null,
      mergedAt: null,
    });
  });

  it("persists nuance and keep-separate differentiation fields as draft-only", () => {
    const ledger = buildCreateContributionLedgerEntry({
      ledgerId: "draft-1",
      packageId: "package-match-1",
      userId: "user-1",
      sourceText: "Ich will mehr bezahlbaren Wohnraum, aber mit einer anderen Begründung.",
      createdAt: "2026-06-04T09:00:00.000Z",
      updatedAt: "2026-06-04T09:05:00.000Z",
      locale: "de",
      contributionPackage: buildContributionPackage("add_as_nuance", {
        differenceReason: "other_reasoning",
        userNuanceText: "Der Schwerpunkt liegt bei Familienwohnungen statt Einzelprojekten.",
      }),
      draftSaveStatus: "server_saved",
    });

    expect(ledger.branches[0]?.existingMatchDecision).toMatchObject({
      userDecision: "add_as_nuance",
      differenceReason: "other_reasoning",
      userNuanceText: "Der Schwerpunkt liegt bei Familienwohnungen statt Einzelprojekten.",
      recordedAsDraftOnly: true,
      countedAt: null,
      mergedAt: null,
    });
  });

  it("deduplicates the same packageId and keeps the newest match decision snapshot", () => {
    const older = buildCreateContributionLedgerEntry({
      ledgerId: "draft-1",
      packageId: "package-match-1",
      userId: "user-1",
      sourceText: "Älterer Stand.",
      createdAt: "2026-06-04T09:00:00.000Z",
      updatedAt: "2026-06-04T09:05:00.000Z",
      locale: "de",
      contributionPackage: buildContributionPackage("count_my_position"),
      draftSaveStatus: "server_saved",
    });
    const newer = buildCreateContributionLedgerEntry({
      ledgerId: "draft-2",
      packageId: "package-match-1",
      userId: "user-1",
      sourceText: "Neuerer Stand.",
      createdAt: "2026-06-04T09:00:00.000Z",
      updatedAt: "2026-06-04T09:10:00.000Z",
      locale: "de",
      contributionPackage: buildContributionPackage("keep_separate", {
        differenceReason: "other_scope",
      }),
      draftSaveStatus: "server_saved",
    });

    const deduped = dedupeCreateContributionLedgerEntries([older, newer]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.packageId).toBe("package-match-1");
    expect(deduped[0]?.branches[0]?.existingMatchDecision).toMatchObject({
      userDecision: "keep_separate",
      differenceReason: "other_scope",
      recordedAsDraftOnly: true,
    });
  });
});
