import { describe, expect, it } from "vitest";

import { buildCreateContributionLedgerEntry } from "@features/create/createContributionLedger";
import type { ContributionPackage } from "@/features/create/createContributionPackageContract";

function buildContributionPackage(): ContributionPackage {
  return {
    id: "package-drafts-1",
    kind: "multi_branch_draft",
    headline: "Mehrthemen-Beitrag als Beitragspaket",
    summary: "Du hast mehrere Themen angesprochen.",
    source: "gpt_planner",
    requiresConfirmation: true,
    createdAt: "2026-06-04T10:00:00.000Z",
    branches: [
      {
        id: "branch-qr",
        title: "Wohnen",
        summary: "Dieser Teil deines Beitrags dreht sich um Wohnen.",
        claimCandidates: [
          {
            id: "claim-qr",
            branchId: "branch-qr",
            text: "Soll mehr bezahlbarer Wohnraum entstehen?",
            kind: "question",
            source: "planner_open_question",
            inferredStance: "pro",
            stanceConfirmationStatus: "confirmed",
          },
        ],
        sensitivityLevel: "standard",
        selectedAction: "prepare_qr_poll",
        status: "prepared",
        existingMatches: [],
      },
      {
        id: "branch-swipe",
        title: "Verkehr",
        summary: "Dieser Teil deines Beitrags dreht sich um Verkehr.",
        claimCandidates: [
          {
            id: "claim-swipe",
            branchId: "branch-swipe",
            text: "Soll der Busverkehr ausgebaut werden?",
            kind: "question",
            source: "planner_open_question",
            inferredStance: "mixed",
            stanceConfirmationStatus: "inferred_only",
          },
        ],
        sensitivityLevel: "civic_sensitive",
        selectedAction: "prepare_swipes",
        status: "prepared",
        existingMatches: [],
      },
      {
        id: "branch-high-risk",
        title: "Strafrecht",
        summary: "Dieser Teil deines Beitrags dreht sich um Strafrecht.",
        claimCandidates: [
          {
            id: "claim-risk",
            branchId: "branch-high-risk",
            text: "Soll das Strafrecht verschärft werden?",
            kind: "question",
            source: "planner_open_question",
            inferredStance: "contra",
            stanceConfirmationStatus: "inferred_only",
          },
        ],
        sensitivityLevel: "high_risk",
        selectedAction: "prepare_swipes",
        status: "prepared",
        existingMatches: [],
      },
      {
        id: "branch-empty",
        title: "Pflege",
        summary: "Dieser Teil deines Beitrags dreht sich um Pflege.",
        claimCandidates: [],
        sensitivityLevel: "standard",
        selectedAction: "prepare_swipes",
        status: "prepared",
        existingMatches: [],
      },
    ],
  };
}

describe("create qr/swipes drafts contract", () => {
  it("creates a QR participation draft with null share fields and strict no-auto guardrails", () => {
    const ledger = buildCreateContributionLedgerEntry({
      ledgerId: "draft-1",
      packageId: "package-drafts-1",
      userId: "user-1",
      sourceText: "Wohnraum und Verkehr.",
      createdAt: "2026-06-04T10:00:00.000Z",
      updatedAt: "2026-06-04T10:05:00.000Z",
      locale: "de",
      contributionPackage: buildContributionPackage(),
      draftSaveStatus: "server_saved",
    });

    expect(ledger.branches[0]?.qrParticipationDraft).toMatchObject({
      title: "Wohnen",
      question: "Soll mehr bezahlbarer Wohnraum entstehen?",
      visibilityIntent: "private_qr",
      status: "ready_for_review",
      shareUrl: null,
      qrCodeUrl: null,
      publishedAt: null,
      guardrails: {
        noAutoPublish: true,
        noAutoVote: true,
        noAutoShare: true,
      },
    });
  });

  it("creates swipe drafts only from branch-local claim candidates and keeps them draft-only", () => {
    const ledger = buildCreateContributionLedgerEntry({
      ledgerId: "draft-1",
      packageId: "package-drafts-1",
      userId: "user-1",
      sourceText: "Wohnraum und Verkehr.",
      createdAt: "2026-06-04T10:00:00.000Z",
      updatedAt: "2026-06-04T10:05:00.000Z",
      locale: "de",
      contributionPackage: buildContributionPackage(),
      draftSaveStatus: "server_saved",
    });

    expect(ledger.branches[1]?.swipeDraft).toMatchObject({
      visibilityIntent: "public_after_review",
      publishedAt: null,
      guardrails: {
        noAutoPublish: true,
        noAutoVote: true,
        noAutoMerge: true,
      },
      statements: [
        expect.objectContaining({
          text: "Soll der Busverkehr ausgebaut werden?",
          sourceClaimId: "claim-swipe",
        }),
      ],
    });
    expect(
      ledger.branches[1]?.swipeDraft?.statements.every((statement) => statement.sourceClaimId === "claim-swipe"),
    ).toBe(true);
  });

  it("keeps high-risk and empty QR/swipe drafts in needs_review without any publish state", () => {
    const ledger = buildCreateContributionLedgerEntry({
      ledgerId: "draft-1",
      packageId: "package-drafts-1",
      userId: "user-1",
      sourceText: "Wohnraum und Verkehr.",
      createdAt: "2026-06-04T10:00:00.000Z",
      updatedAt: "2026-06-04T10:05:00.000Z",
      locale: "de",
      contributionPackage: buildContributionPackage(),
      draftSaveStatus: "server_saved",
    });

    expect(ledger.branches[2]?.swipeDraft?.status).toBe("needs_review");
    expect(ledger.branches[2]?.needsReview).toBe(true);
    expect(ledger.branches[2]?.swipeDraft?.publishedAt).toBeNull();
    expect(ledger.branches[3]?.swipeDraft).toMatchObject({
      status: "needs_review",
      statements: [],
      publishedAt: null,
    });
  });
});
