import { describe, expect, it } from "vitest";
import {
  buildFundingSupportDisclosure,
  parseFundingSupportContract,
} from "@/lib/server/funding/fundingSupportContract";

function baseVisibility() {
  return {
    providerVisible: true,
    roleVisible: true,
    purposeVisible: true,
    conditionsVisible: true,
    expectedImpactVisible: true,
  } as const;
}

function baseGuardrails() {
  return {
    separatesFromSignal: true,
    separatesFromFactStatus: true,
    separatesFromVoting: true,
    noLegitimationReplacement: true,
  } as const;
}

describe("funding support contract", () => {
  it("accepts monetary funding for a concrete anlassraum", () => {
    const parsed = parseFundingSupportContract({
      supportType: "money",
      supportScope: "anlassraum",
      matchingFrame: "none",
      bindingType: "earmarked",
      providerRole: "initiative",
      providerLabel: "Buergerinitiative Nord",
      anlassraumId: "anlass_42",
      dossierId: null,
      purpose: "Anschubfinanzierung fuer barrierearme Wegefuehrung.",
      conditions: "Verwendungsnachweis nach Projektabschluss.",
      expectedImpact: "Schnellere Umsetzungsfaehigkeit fuer den Anlassraum.",
      amountCents: 250000,
      currency: "EUR",
      resourceDescription: null,
      contextVisible: true,
      openQuestionsVisible: true,
      viabilityVisible: true,
      transparency: baseVisibility(),
      captureGuardrails: baseGuardrails(),
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const disclosure = buildFundingSupportDisclosure(parsed.value);
    expect(disclosure).toMatchObject({
      supportType: "money",
      supportScope: "anlassraum",
      targetAnlassraumId: "anlass_42",
      amountCents: 250000,
    });
  });

  it("accepts non-monetary know-how contribution with resource description", () => {
    const parsed = parseFundingSupportContract({
      supportType: "know_how",
      supportScope: "anlassraum",
      matchingFrame: "community_contributions",
      bindingType: "open_use",
      providerRole: "media_creator",
      providerLabel: "Redaktion West",
      anlassraumId: "anlass_43",
      dossierId: null,
      purpose: "Unterstuetzung der oeffentlichen Aufbereitung und Einordnung.",
      conditions: null,
      expectedImpact: "Bessere Verstaendlichkeit fuer Beteiligte.",
      amountCents: null,
      currency: null,
      resourceDescription: "Moderierte Themenaufbereitung und Quellenstruktur.",
      contextVisible: true,
      openQuestionsVisible: true,
      viabilityVisible: true,
      transparency: baseVisibility(),
      captureGuardrails: baseGuardrails(),
    });

    expect(parsed.ok).toBe(true);
  });

  it("requires dossierId for dossier-adjacent support", () => {
    const parsed = parseFundingSupportContract({
      supportType: "planning_service",
      supportScope: "dossier_adjacent",
      matchingFrame: "none",
      bindingType: "earmarked",
      providerRole: "organization",
      providerLabel: "Planungsbuero Sued",
      anlassraumId: null,
      dossierId: null,
      purpose: "Machbarkeitsvorbereitung im Dossierkontext.",
      conditions: null,
      expectedImpact: null,
      amountCents: null,
      currency: null,
      resourceDescription: "Vorpruefung und Planungsbegleitung.",
      contextVisible: true,
      openQuestionsVisible: true,
      viabilityVisible: true,
      transparency: baseVisibility(),
      captureGuardrails: baseGuardrails(),
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual(
      expect.arrayContaining([expect.stringContaining("dossierId:dossier_adjacent_scope_requires_dossier_id")]),
    );
  });

  it("enforces non-monetary and matching guardrails", () => {
    const parsed = parseFundingSupportContract({
      supportType: "volunteer_support",
      supportScope: "dossier_adjacent",
      matchingFrame: "enabling_fund",
      bindingType: "open_use",
      providerRole: "citizen",
      providerLabel: "Lokales Helfernetz",
      anlassraumId: null,
      dossierId: "dossier_11",
      purpose: "Ehrenamtliche Unterstuetzung fuer Umsetzungsbegleitung.",
      conditions: null,
      expectedImpact: null,
      amountCents: null,
      currency: null,
      resourceDescription: null,
      contextVisible: true,
      openQuestionsVisible: true,
      viabilityVisible: true,
      transparency: baseVisibility(),
      captureGuardrails: baseGuardrails(),
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "resourceDescription:non_monetary_support_requires_resource_description",
        ),
        expect.stringContaining("matchingFrame:matching_frame_requires_anlassraum_scope"),
      ]),
    );
  });

  it("rejects unknown reward-like fields by strict contract parsing", () => {
    const parsed = parseFundingSupportContract({
      supportType: "money",
      supportScope: "anlassraum",
      matchingFrame: "none",
      bindingType: "earmarked",
      providerRole: "company",
      providerLabel: "Werkhof Ost",
      anlassraumId: "anlass_51",
      dossierId: null,
      purpose: "Sachkostenanteil fuer Umsetzungsschritt.",
      conditions: null,
      expectedImpact: null,
      amountCents: 50000,
      currency: "EUR",
      resourceDescription: null,
      contextVisible: true,
      openQuestionsVisible: true,
      viabilityVisible: true,
      transparency: baseVisibility(),
      captureGuardrails: baseGuardrails(),
      engagementCredits: 120,
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.some((issue) => issue.includes("Unrecognized key"))).toBe(true);
  });
});
