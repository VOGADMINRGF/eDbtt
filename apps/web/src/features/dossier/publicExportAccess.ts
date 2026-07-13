import {
  dossierExportShareStageLabel,
  resolveDossierExportShareStage,
  type DossierExportShareStage,
} from "@/features/review/dossierExportShareTruth";

type PublicationLikeRecord = {
  status: string;
  visibility: string;
  publicAccessMode: string;
  dossierId: string | null;
};

export type DossierPublicExportAccess =
  | {
      allowed: true;
      truthStage: "published";
      truthStageLabel: string;
    }
  | {
      allowed: false;
      error: "dossier_review_only";
      truthStage: DossierExportShareStage;
      truthStageLabel: string;
    };

function isPublishedForPublicExport(
  publication: PublicationLikeRecord | null,
): boolean {
  return (
    publication?.status === "published" &&
    publication.visibility === "public" &&
    publication.publicAccessMode === "public_read_only" &&
    Boolean(publication.dossierId)
  );
}

export function resolveDossierPublicExportAccess(
  publication: PublicationLikeRecord | null,
): DossierPublicExportAccess {
  if (isPublishedForPublicExport(publication)) {
    return {
      allowed: true,
      truthStage: "published",
      truthStageLabel: dossierExportShareStageLabel("published"),
    };
  }

  const truthStage = resolveDossierExportShareStage({
    publicationStatus: publication?.status ?? null,
    visibleToPublic: false,
    officialApprovalGranted: false,
    reviewRequired: publication ? true : false,
  });

  return {
    allowed: false,
    error: "dossier_review_only",
    truthStage,
    truthStageLabel: dossierExportShareStageLabel(truthStage),
  };
}
