import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CreateAttachDraftReviewList,
  applyCreateAttachDraftLocalDecision,
} from "@/features/create/reviewQueueUi";

describe("create prepare-attach review UI", () => {
  it("shows explicit empty state when queue has no productive drafts", () => {
    const html = renderToStaticMarkup(
      <CreateAttachDraftReviewList
        items={[]}
        decisionBusyDraftId={null}
        reviewNoteByDraft={{}}
        decisionError={null}
        onReviewNoteChange={() => undefined}
        onReviewDecision={() => undefined}
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
            createdAt: "2026-03-20T10:00:00.000Z",
            updatedAt: "2026-03-20T10:00:00.000Z",
          },
        ]}
        decisionBusyDraftId={null}
        reviewNoteByDraft={{ d1: "" }}
        decisionError={null}
        onReviewNoteChange={() => undefined}
        onReviewDecision={() => undefined}
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
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T12:00:00.000Z",
      },
    });

    const html = renderToStaticMarkup(
      <CreateAttachDraftReviewList
        items={updated}
        decisionBusyDraftId={null}
        reviewNoteByDraft={{ d1: "spaeter manuell applyen" }}
        decisionError={null}
        onReviewNoteChange={vi.fn()}
        onReviewDecision={vi.fn()}
      />,
    );
    expect(html).toContain("accepted_for_apply");
    expect(html).toContain("not_applied");
  });
});
