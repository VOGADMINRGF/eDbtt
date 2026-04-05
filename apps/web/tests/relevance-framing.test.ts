import { describe, expect, it } from "vitest";
import {
  formatOriginTypeLabel,
  formatRelevanceScopePairLabel,
  formatOwnerTypeLabel,
  formatRelevanceScopeLabel,
  formatSourceModeLabel,
  normalizeScopeForFraming,
  resolveRelevanceScopePairForDisplay,
} from "@/features/relevanceFraming";

describe("relevance framing helper", () => {
  it("normalizes canonical and alias scope values", () => {
    expect(normalizeScopeForFraming("local")).toBe("local");
    expect(normalizeScopeForFraming("bundesweit")).toBe("national");
    expect(normalizeScopeForFraming("institutionell")).toBe("national");
    expect(normalizeScopeForFraming("europa")).toBe("eu");
    expect(normalizeScopeForFraming("unknown")).toBeNull();
  });

  it("formats scope labels for broader relevance framing", () => {
    expect(formatRelevanceScopeLabel("regional")).toBe("regional / landesbezogen");
    expect(formatRelevanceScopeLabel("bundesweit")).toBe("bundesweit / gesellschaftlich");
    expect(formatRelevanceScopeLabel("", "offen")).toBe("offen");
  });

  it("keeps scope/decisionScope display pair consistent with scope fallback", () => {
    expect(resolveRelevanceScopePairForDisplay("regional", "invalid")).toEqual({
      scope: "regional",
      decisionScope: "regional",
    });
    expect(formatRelevanceScopePairLabel("regional", "invalid")).toBe(
      "regional / landesbezogen / regional / landesbezogen",
    );
    expect(formatRelevanceScopePairLabel("invalid", null, "offen")).toBe("offen / offen");
  });

  it("formats source, origin and owner labels defensively", () => {
    expect(formatSourceModeLabel("single_source")).toBe("öffentliche Einzelquelle");
    expect(formatOriginTypeLabel("official")).toBe("öffentliche/amtliche Quelle");
    expect(formatOwnerTypeLabel("association")).toBe("Verband");
    expect(formatOwnerTypeLabel("unknown_owner")).toBe("unknown owner");
  });
});
