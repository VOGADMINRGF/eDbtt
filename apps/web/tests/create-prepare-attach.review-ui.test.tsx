import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CreateAttachDraftReviewList,
  applyCreateAttachDraftLocalDecision,
  canApplyCreateAttachDraft,
} from "@/features/create/reviewQueueUi";

describe("create prepare-attach review UI", () => {
  it("shows explicit empty state when queue has no productive drafts", () => {
    const html = renderToStaticMarkup(
      <CreateAttachDraftReviewList
        items={[]}
        decisionBusyDraftId={null}
        applyBusyDraftId={null}
        reviewNoteByDraft={{}}
        applyNoteByDraft={{}}
        decisionError={null}
        applyError={null}
        onReviewNoteChange={() => undefined}
        onApplyNoteChange={() => undefined}
        onReviewDecision={() => undefined}
        onApply={() => undefined}
      />,
    );
    expect(html).toContain("Keine Prepare-Attach Drafts");
  });

  it("renders draft metadata, duplicate warning, guardrails and review actions", () => {
    const html = renderToStaticMarkup(
      <CreateAttachDraftReviewList
        items={[
          {
            draftId: "d1",
            ctaId: "perspektive_anhaengen",
            matchType: "duplicate_risk",
            matchEntityType: "claim",
            attachTargetType: "claim",
            attachTargetId: "claim-1",
            attachTargetLabel: "Claim A",
            sourceSummary: "Summary",
            reasons: ["Semantische Naehe"],
            duplicateRisk: true,
            requiresReview: true,
            reviewState: "pending",
            applyState: "not_applied",
            reviewNote: null,
            reviewedAt: null,
            reviewedBy: null,
            appliedAt: null,
            appliedBy: null,
            applyNote: null,
            applyError: null,
            createdAt: "2026-03-20T10:00:00.000Z",
            updatedAt: "2026-03-20T10:00:00.000Z",
          },
        ]}
        decisionBusyDraftId={null}
        applyBusyDraftId={null}
        reviewNoteByDraft={{ d1: "" }}
        applyNoteByDraft={{ d1: "" }}
        decisionError={null}
        applyError={null}
        onReviewNoteChange={() => undefined}
        onApplyNoteChange={() => undefined}
        onReviewDecision={() => undefined}
        onApply={() => undefined}
      />,
    );

    expect(html).toContain("Draft");
    expect(html).toContain("duplicate_risk");
    expect(html).toContain("Duplicate-Risk");
    expect(html).toContain("Noch kein Apply auf Live-Objekte");
    expect(html).toContain("Akzeptieren fuer spaeteren Apply");
    expect(html).toContain("Ablehnen");
    expect(html).toContain("Parken");
  });

  it("shows updated review state after manual decision", () => {
    const updated = applyCreateAttachDraftLocalDecision({
      items: [
        {
          draftId: "d1",
          ctaId: "perspektive_anhaengen",
          matchType: "related_claim",
          matchEntityType: "claim",
          attachTargetType: "claim",
          attachTargetId: "claim-1",
          attachTargetLabel: "Claim A",
          sourceSummary: "Summary",
          reasons: ["Semantische Naehe"],
          duplicateRisk: false,
          requiresReview: true,
          reviewState: "pending",
          applyState: "not_applied",
          reviewNote: null,
          reviewedAt: null,
          reviewedBy: null,
          appliedAt: null,
          appliedBy: null,
          applyNote: null,
          applyError: null,
          createdAt: "2026-03-20T10:00:00.000Z",
          updatedAt: "2026-03-20T10:00:00.000Z",
        },
      ],
      updated: {
        draftId: "d1",
        ctaId: "perspektive_anhaengen",
        matchType: "related_claim",
        matchEntityType: "claim",
        attachTargetType: "claim",
        attachTargetId: "claim-1",
        attachTargetLabel: "Claim A",
        sourceSummary: "Summary",
        reasons: ["Semantische Naehe"],
        duplicateRisk: false,
        requiresReview: true,
        reviewState: "accepted_for_apply",
        applyState: "not_applied",
        reviewNote: "spaeter manuell applyen",
        reviewedAt: "2026-03-20T12:00:00.000Z",
        reviewedBy: "u-review",
        appliedAt: null,
        appliedBy: null,
        applyNote: null,
        applyError: null,
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T12:00:00.000Z",
      },
    });

    const html = renderToStaticMarkup(
      <CreateAttachDraftReviewList
        items={updated}
        decisionBusyDraftId={null}
        applyBusyDraftId={null}
        reviewNoteByDraft={{ d1: "spaeter manuell applyen" }}
        applyNoteByDraft={{ d1: "manual apply" }}
        decisionError={null}
        applyError={null}
        onReviewNoteChange={vi.fn()}
        onApplyNoteChange={vi.fn()}
        onReviewDecision={vi.fn()}
        onApply={vi.fn()}
      />,
    );
    expect(html).toContain("accepted_for_apply");
    expect(html).toContain("not_applied");
    expect(html).toContain("Manuell applyen");
  });

  it("exposes apply eligibility only for accepted_for_apply and non-applied items", () => {
    expect(
      canApplyCreateAttachDraft({
        draftId: "d1",
        ctaId: "perspektive_anhaengen",
        matchType: "related_claim",
        matchEntityType: "claim",
        attachTargetType: "claim",
        attachTargetId: "claim-1",
        attachTargetLabel: "Claim A",
        sourceSummary: "Summary",
        reasons: ["Semantische Naehe"],
        duplicateRisk: false,
        requiresReview: true,
        reviewState: "accepted_for_apply",
        applyState: "not_applied",
        reviewNote: null,
        reviewedAt: null,
        reviewedBy: null,
        appliedAt: null,
        appliedBy: null,
        applyNote: null,
        applyError: null,
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T10:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      canApplyCreateAttachDraft({
        draftId: "d2",
        ctaId: "perspektive_anhaengen",
        matchType: "related_claim",
        matchEntityType: "claim",
        attachTargetType: "claim",
        attachTargetId: "claim-2",
        attachTargetLabel: "Claim B",
        sourceSummary: "Summary",
        reasons: ["Semantische Naehe"],
        duplicateRisk: false,
        requiresReview: true,
        reviewState: "pending",
        applyState: "not_applied",
        reviewNote: null,
        reviewedAt: null,
        reviewedBy: null,
        appliedAt: null,
        appliedBy: null,
        applyNote: null,
        applyError: null,
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T10:00:00.000Z",
      }),
    ).toBe(false);
  });
});
