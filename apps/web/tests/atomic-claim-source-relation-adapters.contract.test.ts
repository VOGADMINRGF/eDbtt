import { describe, expect, it } from "vitest";

import {
  ATOMIC_CLAIM_EVIDENCE_HANDOFF_VERSION,
  buildAtomicClaimEvidenceHandoff,
} from "@features/analyze/atomicClaimSourceRelationAdapter";
import { buildDossierAtomicEvidenceProjection } from "@features/dossier/atomicEvidenceHandoff";
import { buildCreateAnalyzeAtomicEvidenceProjection } from "@/features/create/atomicEvidenceHandoff";

const analyze = {
  language: "de",
  claims: [
    {
      id: "claim-fact",
      text: "Die Maßnahme trat 2026 in Kraft.",
      statementType: "fact" as const,
    },
    {
      id: "claim-interpretation",
      text: "Das könnte einen Strukturwandel anzeigen.",
      statementType: "interpretation" as const,
    },
    {
      id: "claim-value",
      text: "Die Regelung sollte gerechter ausgestaltet werden.",
      statementType: "value" as const,
    },
    {
      id: "claim-question",
      text: "Welche Daten fehlen noch?",
      statementType: "question" as const,
    },
    {
      id: "claim-untyped",
      text: "Nicht näher klassifizierte Legacy-Aussage.",
      statementType: null,
    },
  ],
};

describe("atomic claim/source relation adapters", () => {
  it("projects legacy Analyze claims without inventing evidence relations", () => {
    const handoff = buildAtomicClaimEvidenceHandoff(analyze as any);

    expect(handoff.schemaVersion).toBe(ATOMIC_CLAIM_EVIDENCE_HANDOFF_VERSION);
    expect(handoff.atomicClaims.map((claim) => [claim.id, claim.type])).toEqual([
      ["claim-fact", "factual_claim"],
      ["claim-interpretation", "interpretation"],
      ["claim-value", "normative_position"],
      ["claim-untyped", "non_checkable_opinion"],
    ]);
    expect(handoff.unmappedAnalyzeClaimIds).toEqual(["claim-question"]);
    expect(handoff.sourceSegmentIds).toEqual([]);
    expect(handoff.relationIds).toEqual([]);
    expect(handoff.sourceFamilyIds).toEqual([]);
    expect(handoff.relationState).toBe("unbound_requires_review");
    expect(handoff.requiresHumanReview).toBe(true);
    expect(handoff.noTruthPromotion).toBe(true);
    expect(handoff.noAutoGraphPromotion).toBe(true);
    expect(handoff.noAutoPublish).toBe(true);
  });

  it("keeps unknown legacy claim scope empty instead of inferring facts", () => {
    const handoff = buildAtomicClaimEvidenceHandoff(analyze as any);
    const legacy = handoff.atomicClaims.find((claim) => claim.id === "claim-untyped");

    expect(legacy?.type).toBe("non_checkable_opinion");
    expect(legacy?.scope).toEqual({
      subject: null,
      predicate: null,
      object: null,
      timeScope: null,
      jurisdictionScope: null,
      populationScope: null,
      quantification: null,
    });
  });

  it("exposes the same fail-closed handoff to Create without mutating CreateAnalyzeResponse", () => {
    const projection = buildCreateAnalyzeAtomicEvidenceProjection({
      createAnalyze: {
        runId: "run-1",
        inputRef: "run-1",
      },
      analyze: analyze as any,
    });

    expect(projection.runId).toBe("run-1");
    expect(projection.inputRef).toBe("run-1");
    expect(projection.evidence.atomicClaims.map((claim) => claim.id)).toEqual([
      "claim-fact",
      "claim-interpretation",
      "claim-value",
      "claim-untyped",
    ]);
    expect(projection.evidence.relationState).toBe("unbound_requires_review");
    expect(projection.noTruthPromotion).toBe(true);
    expect(projection.noAutoGraphPromotion).toBe(true);
    expect(projection.noAutoPublish).toBe(true);
  });

  it("exposes only canonical evidence IDs to Dossier and requires no persistence mutation", () => {
    const projection = buildDossierAtomicEvidenceProjection({
      meta: { id: "dossier-1" },
      analyze,
    } as any);

    expect(projection.dossierId).toBe("dossier-1");
    expect(projection.evidence.atomicClaimIds).toEqual([
      "claim-fact",
      "claim-interpretation",
      "claim-value",
      "claim-untyped",
    ]);
    expect(projection.evidence.sourceSegmentIds).toEqual([]);
    expect(projection.evidence.relationIds).toEqual([]);
    expect(projection.evidence.relationState).toBe("unbound_requires_review");
    expect(projection.persistenceMutationRequired).toBe(false);
    expect(projection.noTruthPromotion).toBe(true);
    expect(projection.noAutoGraphPromotion).toBe(true);
    expect(projection.noAutoPublish).toBe(true);
  });

  it("returns no-claims instead of fabricating claims from an empty analyze result", () => {
    const handoff = buildAtomicClaimEvidenceHandoff({
      language: "de",
      claims: [],
    } as any);

    expect(handoff.atomicClaims).toEqual([]);
    expect(handoff.relationState).toBe("no_claims");
    expect(handoff.requiresHumanReview).toBe(true);
  });
});
