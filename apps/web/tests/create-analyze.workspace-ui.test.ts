import { describe, expect, it } from "vitest";
import {
  buildCreatePrepareAttachReviewState,
  collectCreateAnalyzeReasons,
  deriveCreateAnalyzeRoutingHint,
} from "@/components/analyze/AnalyzeWorkspace";

describe("create analyze workspace UI helpers", () => {
  it("prioritizes neu_anlegen messaging for no_match", () => {
    const hint = deriveCreateAnalyzeRoutingHint({
      matchType: "no_match",
      suggestedCtas: [
        {
          id: "neu_anlegen",
          label: "Neu anlegen",
          reason: "Kein belastbarer Match.",
        },
      ],
    });

    expect(hint.tone).toBe("info");
    expect(hint.primaryCtaId).toBe("neu_anlegen");
    expect(hint.message).toContain("Kein belastbarer Match");
  });

  it("marks duplicate_risk as warning and keeps manual control wording", () => {
    const hint = deriveCreateAnalyzeRoutingHint({
      matchType: "duplicate_risk",
      suggestedCtas: [
        {
          id: "anders_sehen",
          label: "Anders sehen",
          reason: "Duplikatrisiko manuell pruefen.",
        },
      ],
    });

    expect(hint.tone).toBe("warning");
    expect(hint.primaryCtaId).toBe("anders_sehen");
    expect(hint.message).toContain("kein Silent-Merge");
  });

  it("dedupes and exposes match reasons for UI visibility", () => {
    const reasons = collectCreateAnalyzeReasons({
      reasons: ["Explizit gesetzter Anlassraum-Kontext.", "Explizit gesetzter Anlassraum-Kontext."],
      matches: [
        {
          id: "m1",
          label: "Anlassraum Innenstadt",
          matchType: "same_anlassraum",
          matchEntityType: "anlassraum",
          strength: "high",
          reason: "Explizit gesetzter Anlassraum-Kontext.",
          reasons: [
            "Explizit gesetzter Anlassraum-Kontext.",
            "Kontext wurde im produktiven Anlassraum-Read-Model gefunden.",
          ],
        },
      ],
    } as any);

    expect(reasons).toContain("Explizit gesetzter Anlassraum-Kontext.");
    expect(reasons).toContain("Kontext wurde im produktiven Anlassraum-Read-Model gefunden.");
    expect(reasons.length).toBe(2);
  });

  it("builds explicit prepare-attach review state only after confirmed handoff", () => {
    const review = buildCreatePrepareAttachReviewState({
      createAnalyze: {
        runId: "run-1",
        normalizedInputSummary: "Kurzsummary",
        matchType: "related_claim",
        matchEntityType: "claim",
        reasons: ["Semantische Naehe"],
        matches: [
          {
            id: "m1",
            label: "Claim A",
            matchType: "related_claim",
            matchEntityType: "claim",
            strength: "medium",
            reason: "Semantische Naehe",
            reasons: ["Semantische Naehe"],
            entityId: "claim-1",
            targetRef: "/swipes?statementId=claim-1",
          },
        ],
      } as any,
      handoff: {
        ctaId: "perspektive_anhaengen",
        actionType: "prepare_attach",
        entityType: "claim",
        entityId: "claim-1",
        targetRef: "/swipes?statementId=claim-1",
        requiresConfirm: true,
        noAutoPublish: true,
        noSilentMerge: true,
        summary: "Prepare attach",
        warning: null,
        guardrails: ["Kein Auto-Merge."],
      },
    });

    expect(review).toBeTruthy();
    expect(review?.targets.length).toBe(1);
    expect(review?.selectedTargetKey).toBe("claim:claim-1");
    expect(review?.handoff.ctaId).toBe("perspektive_anhaengen");
  });

  it("returns null review state when no valid attach target exists", () => {
    const review = buildCreatePrepareAttachReviewState({
      createAnalyze: {
        runId: "run-2",
        normalizedInputSummary: "Summary",
        matchType: "no_match",
        matchEntityType: "question",
        reasons: [],
        matches: [],
      } as any,
      handoff: {
        ctaId: "perspektive_anhaengen",
        actionType: "prepare_attach",
        entityType: "question",
        entityId: null,
        targetRef: null,
        requiresConfirm: true,
        noAutoPublish: true,
        noSilentMerge: true,
        summary: "Prepare attach",
        warning: null,
        guardrails: ["Kein Auto-Merge."],
      },
    });

    expect(review).toBeNull();
  });
});
