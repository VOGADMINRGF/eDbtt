import { describe, expect, it } from "vitest";
import {
  buildAiTraceHiddenByPolicyLines,
  formatAiTraceMissingRuntimeLine,
  formatAiTraceTechnicalVisibility,
  getAiTraceSurfaceScopeLine,
} from "@/features/ai/aiTraceSurfaceTruth";

describe("ai trace surface truth", () => {
  it("keeps user-facing scope lines free of provider and debug leak semantics", () => {
    expect(getAiTraceSurfaceScopeLine("user")).toContain("Arbeitsschritte");
    expect(getAiTraceSurfaceScopeLine("user")).not.toContain("Provider");
    expect(getAiTraceSurfaceScopeLine("user")).not.toContain("Tokens");
  });

  it("maps technical visibility into safe user-facing wording", () => {
    expect(
      formatAiTraceTechnicalVisibility({
        audience: "user",
        providerVisibility: "admin_review_only",
        providerKnown: true,
      }),
    ).toContain("außerhalb dieser Oberfläche");
  });

  it("humanizes missing runtime truth without leaking raw request or provider terms", () => {
    const requestGap = formatAiTraceMissingRuntimeLine(
      ["Planner-Request-/Operation-Korrelation wird im aktuellen Frontend-Zustand noch nicht vollstaendig getragen."],
      "user",
    );
    const providerGap = formatAiTraceMissingRuntimeLine(
      ["Feed-Enrichment-Vorschläge sind sichtbar, aber ohne belastbare Provider-/Modelltruth für diesen Lauf."],
      "operator",
    );

    expect(requestGap).not.toContain("Request");
    expect(requestGap).not.toContain("Operation");
    expect(providerGap).not.toContain("Provider");
    expect(providerGap).not.toContain("Modell");
  });

  it("pins operator hidden-by-policy lines against prompt and raw diagnostic leaks", () => {
    const lines = buildAiTraceHiddenByPolicyLines("operator").join(" ");

    expect(lines).toContain("Prompts");
    expect(lines).toContain("Tokens");
    expect(lines).toContain("Rohdiagnostik");
  });
});
