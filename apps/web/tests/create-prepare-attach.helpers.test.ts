import { describe, expect, it } from "vitest";
import type { CreateCtaHandoff } from "@/features/create/ctaHandoff";
import {
  buildCreatePrepareAttachDraftInput,
  canCreatePrepareAttachDraftFromHandoff,
  derivePrepareAttachTargetOptions,
  resolveInitialPrepareAttachTargetKey,
} from "@/features/create/prepareAttachDraft";

function handoffFixture(overrides?: Partial<CreateCtaHandoff>): CreateCtaHandoff {
  return {
    ctaId: "perspektive_anhaengen",
    matchType: "related_claim",
    matchEntityType: "claim",
    entityType: "claim",
    entityId: "claim-1",
    targetRef: "/swipes?statementId=claim-1",
    requiresConfirm: true,
    actionType: "prepare_attach",
    noAutoPublish: true,
    noSilentMerge: true,
    summary: "Prepare attach",
    warning: null,
    guardrails: ["Kein Auto-Merge."],
    ...overrides,
  };
}

describe("prepare attach helpers", () => {
  it("creates prepare-attach options from productive match items", () => {
    const options = derivePrepareAttachTargetOptions([
      {
        id: "m1",
        matchType: "related_claim",
        matchEntityType: "claim",
        strength: "medium",
        label: "Claim A",
        reason: "reason",
        reasons: ["reason"],
        entityId: "claim-1",
        targetRef: "/swipes?statementId=claim-1",
      },
      {
        id: "m2",
        matchType: "same_anlassraum",
        matchEntityType: "anlassraum",
        strength: "high",
        label: "Room A",
        reason: "reason",
        reasons: ["reason"],
        entityId: "65f000000000000000000011",
        targetRef: "/create?anlassraumId=65f000000000000000000011",
      },
    ]);

    expect(options).toHaveLength(2);
    expect(options.map((entry) => entry.attachTargetType)).toEqual(["claim", "anlassraum"]);
  });

  it("requires explicit target selection when multiple options exist", () => {
    const options = derivePrepareAttachTargetOptions([
      {
        id: "m1",
        matchType: "related_claim",
        matchEntityType: "claim",
        strength: "medium",
        label: "Claim A",
        reason: "reason",
        reasons: ["reason"],
        entityId: "claim-1",
        targetRef: "/swipes?statementId=claim-1",
      },
      {
        id: "m2",
        matchType: "related_dossier",
        matchEntityType: "dossier",
        strength: "medium",
        label: "Dossier A",
        reason: "reason",
        reasons: ["reason"],
        entityId: "dossier-1",
        targetRef: "/dossier/dossier-1",
      },
    ]);
    const key = resolveInitialPrepareAttachTargetKey({
      options,
      handoff: handoffFixture({ entityType: "dossier", entityId: "dossier-1" }),
    });
    expect(key).toBeNull();
  });

  it("flags duplicate risk as review-safe and still allows prepare draft", () => {
    const handoff = handoffFixture({
      warning: "Moegliches Duplikat erkannt. Kein Auto-Attach; bitte manuell pruefen.",
    });
    expect(canCreatePrepareAttachDraftFromHandoff(handoff)).toBe(true);

    const payload = buildCreatePrepareAttachDraftInput({
      sourceRunId: "run-1",
      sourceSummary: "Summary",
      sourceLanguage: "de",
      contentLanguage: "de",
      uiLocale: "de",
      reasons: ["Semantische Naehe"],
      userConfirmedAt: "2026-03-20T10:00:00.000Z",
      handoff,
      selectedTarget: {
        key: "claim:claim-1",
        attachTargetType: "claim",
        attachTargetId: "claim-1",
        attachTargetRef: "/swipes?statementId=claim-1",
        title: "Claim A",
        matchType: "duplicate_risk",
        matchEntityType: "claim",
        reasons: ["Duplikatrisiko"],
      },
      selectedReason: "Manuelle Pruefung noetig",
    });

    expect(payload.schemaVersion).toBe("create_prepare_attach_draft.v1");
    expect(payload.ctaId).toBe("perspektive_anhaengen");
    expect(payload.matchType).toBe("duplicate_risk");
    expect(payload.matchEntityType).toBe("claim");
    expect(payload.requiresReview).toBe(true);
    expect(payload.noAutoPublish).toBe(true);
    expect(payload.noSilentMerge).toBe(true);
    expect(payload.originPreserved).toBe(true);
    expect(payload.duplicateRisk).toBe(true);
  });

  it("does not create prepare-attach input for neu_anlegen handoff", () => {
    expect(canCreatePrepareAttachDraftFromHandoff(handoffFixture({
      ctaId: "neu_anlegen",
      actionType: "prepare_new",
    }))).toBe(false);
  });
});
