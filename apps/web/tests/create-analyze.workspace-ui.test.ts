import { describe, expect, it } from "vitest";
import {
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
});
