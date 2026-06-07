import { describe, expect, it } from "vitest";

import {
  buildRouteBoundCompanionAnswer,
  resolveRouteBoundCompanionContext,
  runRouteBoundCompanionPresentationPass,
} from "@features/ai/e150/routeBoundCompanion";

describe("route-bound companion contract", () => {
  it("reuses media journey profile for dossier context", () => {
    const resolved = resolveRouteBoundCompanionContext({
      kind: "dossier",
      title: "Haushaltsdossier",
    });

    expect(resolved.journeyProfile).toBe("media");
    expect(resolved.lane).toBe("standard");
    expect(resolved.verificationMode).toBe("precheck");
    expect(resolved.researchUsed).toBe("none");
    expect(resolved.sealEligible).toBe(false);
    expect(resolved.sealGranted).toBe(false);
    expect(resolved.verificationLabel).toBe("analysiert");
    expect(resolved.verificationLabelDisplay).toBe("Analyse-Entwurf");
  });

  it("keeps standard-lane guardrails even when parent status is inconsistent", () => {
    const resolved = resolveRouteBoundCompanionContext({
      kind: "guided_workspace",
      parentStatus: {
        lane: "sealed_factcheck",
        verificationMode: "sealed",
        researchUsed: "deep_search",
        sealEligible: true,
        sealGranted: true,
      },
    });

    expect(resolved.journeyProfile).toBe("guided");
    expect(resolved.lane).toBe("standard");
    expect(resolved.verificationMode).toBe("precheck");
    expect(resolved.researchUsed).toBe("none");
    expect(resolved.sealEligible).toBe(false);
    expect(resolved.sealGranted).toBe(false);
    expect(resolved.verificationLabel).toBe("analysiert");
    expect(resolved.verificationLabelDisplay).toBe("Analyse-Entwurf");
  });

  it("keeps sealed_factcheck lane with search defaults", () => {
    const resolved = resolveRouteBoundCompanionContext({
      kind: "factcheck",
    });

    expect(resolved.journeyProfile).toBe("sealed_factcheck");
    expect(resolved.lane).toBe("sealed_factcheck");
    expect(resolved.verificationMode).toBe("sealed");
    expect(resolved.researchUsed).toBe("search");
    expect(resolved.sealEligible).toBe(true);
    expect(resolved.sealGranted).toBe(false);
    expect(resolved.verificationLabel).toBe("analysiert");
    expect(resolved.verificationLabelDisplay).toBe("Quellenprüfung angefragt");
  });

  it("marks factcheck companion as verifiziert only when sealGranted is true", () => {
    const resolved = resolveRouteBoundCompanionContext({
      kind: "factcheck",
      parentStatus: {
        status: "completed",
        verificationMode: "sealed",
        researchUsed: "deep_search",
        sealEligible: true,
        sealGranted: true,
      },
    });

    expect(resolved.lane).toBe("sealed_factcheck");
    expect(resolved.verificationLabel).toBe("verifiziert");
    expect(resolved.verificationLabelDisplay).toBe("Verifiziert");
    expect(resolved.sealGranted).toBe(true);

    const answer = buildRouteBoundCompanionAnswer({
      context: { kind: "factcheck" },
      userMessage: "Bitte Ergebnis knapp zusammenfassen.",
      resolved,
    });

    expect(answer.text).toContain("kein Wahrheits- oder Siegelsystem");
    expect(answer.disclaimers).toContain("Kein Siegel außerhalb sealed_factcheck.");
  });

  it("applies optional non-mutative presentation pass to companion text only", () => {
    const resolved = resolveRouteBoundCompanionContext({
      kind: "factcheck",
      parentStatus: {
        status: "queued",
      },
    });

    const answer = buildRouteBoundCompanionAnswer({
      context: { kind: "factcheck" },
      userMessage: "Bitte kurz zusammenfassen!!!",
      resolved,
    });

    const pass = runRouteBoundCompanionPresentationPass({
      resolved,
      answer,
      enabled: true,
    });

    expect(pass.meta.reason === "applied" || pass.meta.reason === "no_change").toBe(true);
    expect(pass.meta.nonMutativeGuardPassed).toBe(true);
    expect(pass.answer.text).toContain("zusammenfassen!");
    expect(resolved.verificationMode).toBe("sealed");
    expect(resolved.researchUsed).toBe("search");
    expect(resolved.sealEligible).toBe(true);
    expect(resolved.sealGranted).toBe(false);
  });
});
