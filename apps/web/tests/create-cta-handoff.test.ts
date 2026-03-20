import { describe, expect, it } from "vitest";
import {
  buildCreateCtaHandoff,
  confirmCreateCtaHandoff,
  createInitialCreateCtaHandoffState,
  resolveCreateCtaConfirmAction,
  selectCreateCtaHandoff,
} from "@/features/create/ctaHandoff";

describe("create CTA handoff helper", () => {
  it("maps same_anlassraum to anlassraum_oeffnen with explicit confirm", () => {
    const handoff = buildCreateCtaHandoff({
      ctaId: "anlassraum_oeffnen",
      createAnalyze: {
        matchType: "same_anlassraum",
        matchEntityType: "anlassraum",
        matches: [
          {
            id: "m1",
            matchType: "same_anlassraum",
            matchEntityType: "anlassraum",
            strength: "high",
            label: "Anlassraum Innenstadt",
            reason: "Expliziter Kontext",
            reasons: ["Expliziter Kontext"],
            entityId: "65f000000000000000000011",
            targetRef: "/create?anlassraumId=65f000000000000000000011",
          },
        ],
      },
    });

    expect(handoff.ctaId).toBe("anlassraum_oeffnen");
    expect(handoff.actionType).toBe("open");
    expect(handoff.requiresConfirm).toBe(true);
    expect(handoff.entityType).toBe("anlassraum");
    expect(handoff.targetRef).toContain("anlassraumId=");
    expect(handoff.noAutoPublish).toBe(true);
    expect(handoff.noSilentMerge).toBe(true);
  });

  it("maps related_dossier to dossier_oeffnen with explicit confirm", () => {
    const handoff = buildCreateCtaHandoff({
      ctaId: "dossier_oeffnen",
      createAnalyze: {
        matchType: "related_dossier",
        matchEntityType: "dossier",
        matches: [
          {
            id: "dossier-1",
            matchType: "related_dossier",
            matchEntityType: "dossier",
            strength: "medium",
            label: "Dossier Verkehr",
            reason: "Dossier-Naehe",
            reasons: ["Dossier-Naehe"],
            entityId: "dossier-1",
            targetRef: "/dossier/dossier-1",
          },
        ],
      },
    });

    expect(handoff.ctaId).toBe("dossier_oeffnen");
    expect(handoff.actionType).toBe("open");
    expect(handoff.targetRef).toBe("/dossier/dossier-1");
    expect(handoff.requiresConfirm).toBe(true);
  });

  it("maps no_match to neu_anlegen with prepare_new and no target mutation", () => {
    const handoff = buildCreateCtaHandoff({
      ctaId: "neu_anlegen",
      createAnalyze: {
        matchType: "no_match",
        matchEntityType: "question",
        matches: [],
      },
    });

    expect(handoff.ctaId).toBe("neu_anlegen");
    expect(handoff.actionType).toBe("prepare_new");
    expect(handoff.targetRef ?? null).toBeNull();
    expect(handoff.summary).toContain("Neuen Strang");
  });

  it("keeps duplicate_risk warning and never auto-attaches", () => {
    const handoff = buildCreateCtaHandoff({
      ctaId: "perspektive_anhaengen",
      createAnalyze: {
        matchType: "duplicate_risk",
        matchEntityType: "claim",
        matches: [
          {
            id: "c1",
            matchType: "duplicate_risk",
            matchEntityType: "claim",
            strength: "high",
            label: "Claim",
            reason: "Duplikatrisiko",
            reasons: ["Duplikatrisiko"],
            entityId: "claim-1",
            targetRef: "/swipes?statementId=claim-1",
          },
        ],
      },
    });

    expect(handoff.actionType).toBe("prepare_attach");
    expect(handoff.warning).toContain("Duplikat");
    expect(handoff.guardrails.some((entry) => /Kein Auto-Merge/i.test(entry))).toBe(true);
    expect(resolveCreateCtaConfirmAction(handoff)).toEqual({ type: "none" });
  });

  it("keeps click -> confirm as explicit state transition before any navigation command", () => {
    const handoff = buildCreateCtaHandoff({
      ctaId: "anlassraum_oeffnen",
      createAnalyze: {
        matchType: "same_anlassraum",
        matchEntityType: "anlassraum",
        matches: [
          {
            id: "m1",
            matchType: "same_anlassraum",
            matchEntityType: "anlassraum",
            strength: "high",
            label: "Anlassraum",
            reason: "Kontext",
            reasons: ["Kontext"],
            entityId: "65f000000000000000000011",
            targetRef: "/create?anlassraumId=65f000000000000000000011",
          },
        ],
      },
    });

    const selected = selectCreateCtaHandoff(createInitialCreateCtaHandoffState(), handoff);
    expect(selected.pending?.ctaId).toBe("anlassraum_oeffnen");
    expect(selected.confirmAction).toEqual({ type: "none" });

    const confirmed = confirmCreateCtaHandoff(selected);
    expect(confirmed.pending).toBeNull();
    expect(confirmed.confirmed?.ctaId).toBe("anlassraum_oeffnen");
    expect(confirmed.confirmAction).toEqual({
      type: "navigate",
      targetRef: "/create?anlassraumId=65f000000000000000000011",
    });
  });
});
