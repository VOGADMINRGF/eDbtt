import { describe, expect, it } from "vitest";
import { evaluateCreateClaimSafety } from "@/features/create/safety/createClaimSafety";
import {
  evaluateCreateInputSafety,
  type CreateInputSafetyDecision,
  type CreateInputSafetyResult,
} from "@/features/create/safety/createInputSafety";
import type { CreateClaimPublicationStatus } from "@/features/create/safety/createClaimSafety";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

const DECISION_RANK: Record<CreateInputSafetyDecision, number> = {
  allow: 0,
  revise_required: 1,
  factcheck_required: 2,
  graph_review_required: 3,
  editorial_review_required: 4,
  moderation_required: 5,
  blocked: 6,
};

const PUBLICATION_RANK: Record<CreateClaimPublicationStatus, number> = {
  publishable: 0,
  publishable_as_question: 1,
  publishable_as_opinion: 1,
  needs_rewrite: 2,
  factcheck_required: 3,
  graph_review_required: 4,
  moderation_required: 5,
  blocked: 6,
};

type SimulatedScenario = {
  name:
    | "deterministic_gate"
    | "standard_analyze_output"
    | "sealed_factcheck_output"
    | "presentation_pass_output"
    | "degraded_fallback_output";
  decision: CreateInputSafetyDecision;
  publicationStatus: CreateClaimPublicationStatus;
  qualityGate: Partial<CreateInputSafetyResult["qualityGate"]>;
  redactedText: string;
};

function mergeParity(
  base: CreateInputSafetyResult,
  basePublicationStatus: CreateClaimPublicationStatus,
  scenario: SimulatedScenario,
) {
  return {
    finalDecision:
      DECISION_RANK[scenario.decision] >= DECISION_RANK[base.decision]
        ? scenario.decision
        : base.decision,
    finalPublicationStatus:
      PUBLICATION_RANK[scenario.publicationStatus] >= PUBLICATION_RANK[basePublicationStatus]
        ? scenario.publicationStatus
        : basePublicationStatus,
    qualityGate: {
      ...scenario.qualityGate,
      missingPlace: base.qualityGate.missingPlace || scenario.qualityGate.missingPlace || false,
      missingSource: base.qualityGate.missingSource || scenario.qualityGate.missingSource || false,
      editorialReviewRequested:
        base.qualityGate.editorialReviewRequested ||
        scenario.qualityGate.editorialReviewRequested ||
        false,
      privateAddressRisk:
        base.qualityGate.privateAddressRisk || scenario.qualityGate.privateAddressRisk || false,
    },
    redactedText: /\[ADRESSE ENTFERNT\]|\[TELEFON ENTFERNT\]/.test(base.redactedText)
      ? base.redactedText
      : scenario.redactedText,
  };
}

describe("create safety model parity contract", () => {
  it("keeps missing-place and privacy signals across simulated provider outputs", () => {
    const base = evaluateCreateInputSafety({
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.vagueOwnStreet,
      locale: "de",
      routeStage: "analyze",
    });
    const claim = evaluateCreateClaimSafety({
      claimId: "c-place",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.vagueOwnStreet,
      locale: "de",
    });

    const scenarios: SimulatedScenario[] = [
      {
        name: "deterministic_gate",
        decision: base.decision,
        publicationStatus: claim.publicationStatus,
        qualityGate: base.qualityGate,
        redactedText: base.redactedText,
      },
      {
        name: "standard_analyze_output",
        decision: "allow",
        publicationStatus: "publishable",
        qualityGate: {},
        redactedText: "In meiner Straße ist dauernd Lärm.",
      },
      {
        name: "presentation_pass_output",
        decision: "allow",
        publicationStatus: "publishable",
        qualityGate: {},
        redactedText: "Kurze Präsentationsfassung.",
      },
      {
        name: "degraded_fallback_output",
        decision: "revise_required",
        publicationStatus: "needs_rewrite",
        qualityGate: { privateAddressRisk: true },
        redactedText: base.redactedText,
      },
      {
        name: "sealed_factcheck_output",
        decision: "graph_review_required",
        publicationStatus: "graph_review_required",
        qualityGate: { missingPlace: true },
        redactedText: base.redactedText,
      },
    ];

    for (const scenario of scenarios) {
      const merged = mergeParity(base, claim.publicationStatus, scenario);
      expect(DECISION_RANK[merged.finalDecision]).toBeGreaterThanOrEqual(DECISION_RANK[base.decision]);
      expect(PUBLICATION_RANK[merged.finalPublicationStatus]).toBeGreaterThanOrEqual(
        PUBLICATION_RANK[claim.publicationStatus],
      );
      expect(merged.qualityGate.missingPlace).toBe(true);
      expect(merged.qualityGate.privateAddressRisk).toBe(true);
      expect(merged.redactedText).not.toContain("Musterstraße");
    }
  });

  it("keeps editorial review and source/factcheck signals across simulated outputs", () => {
    const editorialReviewWithUnsupportedClaim =
      "Ich möchte, dass das ein Mensch gegenliest. Der Unternehmer hat absichtlich Zahlen manipuliert.";
    const base = evaluateCreateInputSafety({
      text: editorialReviewWithUnsupportedClaim,
      locale: "de",
      routeStage: "analyze",
    });
    const claim = evaluateCreateClaimSafety({
      claimId: "c-review",
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.allegationWithoutSource,
      locale: "de",
    });

    const scenarios: SimulatedScenario[] = [
      {
        name: "deterministic_gate",
        decision: base.decision,
        publicationStatus: claim.publicationStatus,
        qualityGate: base.qualityGate,
        redactedText: base.redactedText,
      },
      {
        name: "standard_analyze_output",
        decision: "allow",
        publicationStatus: "publishable",
        qualityGate: {},
        redactedText: "Verdichtete Fassung ohne Review-Hinweis.",
      },
      {
        name: "presentation_pass_output",
        decision: "revise_required",
        publicationStatus: "needs_rewrite",
        qualityGate: {},
        redactedText: "Kurzfassung.",
      },
      {
        name: "degraded_fallback_output",
        decision: "editorial_review_required",
        publicationStatus: "needs_rewrite",
        qualityGate: { editorialReviewRequested: true },
        redactedText: base.redactedText,
      },
      {
        name: "sealed_factcheck_output",
        decision: "factcheck_required",
        publicationStatus: "factcheck_required",
        qualityGate: { missingSource: true },
        redactedText: base.redactedText,
      },
    ];

    for (const scenario of scenarios) {
      const merged = mergeParity(base, claim.publicationStatus, scenario);
      expect(merged.qualityGate.editorialReviewRequested).toBe(true);
      expect(merged.qualityGate.missingSource).toBe(true);
      expect(DECISION_RANK[merged.finalDecision]).toBeGreaterThanOrEqual(
        DECISION_RANK[base.decision],
      );
      expect(PUBLICATION_RANK[merged.finalPublicationStatus]).toBeGreaterThanOrEqual(
        PUBLICATION_RANK[claim.publicationStatus],
      );
    }
  });
});
