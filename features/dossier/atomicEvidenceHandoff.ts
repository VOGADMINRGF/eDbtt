import {
  buildAtomicClaimEvidenceHandoff,
  summarizeAtomicClaimEvidenceHandoff,
  type AtomicClaimEvidenceHandoffSummary,
} from "@features/analyze/atomicClaimSourceRelationAdapter";
import type { Dossier } from "@features/dossier/schemas";

export type DossierAtomicEvidenceProjection = {
  dossierId: string;
  evidence: AtomicClaimEvidenceHandoffSummary;
  persistenceMutationRequired: false;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
  noAutoPublish: true;
};

/**
 * Additive dossier projection. Existing DossierSchema and persistence remain
 * untouched; the projection only references canonical claim/evidence IDs.
 */
export function buildDossierAtomicEvidenceProjection(
  dossier: Pick<Dossier, "meta" | "analyze">,
): DossierAtomicEvidenceProjection {
  const handoff = buildAtomicClaimEvidenceHandoff(dossier.analyze);

  return {
    dossierId: dossier.meta.id,
    evidence: summarizeAtomicClaimEvidenceHandoff(handoff),
    persistenceMutationRequired: false,
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
    noAutoPublish: true,
  };
}
