export const DOSSIER_EXPORT_SHARE_STAGES = [
  "draft",
  "review_ready",
  "approved_for_export",
  "publish_ready",
  "published",
] as const;

export type DossierExportShareStage =
  (typeof DOSSIER_EXPORT_SHARE_STAGES)[number];

export const DOSSIER_EXPORT_SHARE_SEMANTICS = {
  draftNotPublished: "Entwurf ist nicht veröffentlicht.",
  reviewReadyNotApprovedForExport:
    "Review-ready ist nicht approved_for_export.",
  approvedForExportNotPublished:
    "approved_for_export ist nicht publish_ready oder published.",
  publishReadyNotPublished: "publish_ready ist nicht published.",
  sharePreviewNotPublicPublish:
    "Share-Vorschau ist keine öffentliche Veröffentlichung.",
  exportManualOnly:
    "Export bleibt manuell und löst keinen Publish-Schritt aus.",
} as const;

export const DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES = [
  "Freigabe bedeutet Veröffentlichung, nicht Wahrheitszertifikat.",
  "Quellen bleiben prüfbare Belege und Kontext, keine automatische Verifikation.",
  DOSSIER_EXPORT_SHARE_SEMANTICS.sharePreviewNotPublicPublish,
  DOSSIER_EXPORT_SHARE_SEMANTICS.exportManualOnly,
  "Dossier-Veröffentlichung erzeugt keinen Graph Merge und keinen Anlassraum.",
] as const;

export function dossierExportShareStageLabel(
  value: DossierExportShareStage,
): string {
  if (value === "draft") return "Entwurf";
  if (value === "review_ready") return "Review-ready";
  if (value === "approved_for_export") return "Für Export freigegeben";
  if (value === "publish_ready") return "Publish-ready";
  return "Veröffentlicht";
}

export function resolveDossierExportShareStage(input: {
  publicationStatus?: string | null;
  visibleToPublic?: boolean;
  officialApprovalGranted?: boolean;
  reviewRequired?: boolean;
}): DossierExportShareStage {
  if (input.visibleToPublic || input.publicationStatus === "published") {
    return "published";
  }
  if (
    input.publicationStatus === "ready_for_publication_review" ||
    input.publicationStatus === "approved_for_publication"
  ) {
    return "publish_ready";
  }
  if (input.officialApprovalGranted) {
    return "approved_for_export";
  }
  if (input.reviewRequired || input.publicationStatus === "review_only") {
    return "review_ready";
  }
  return "draft";
}

export function buildDossierExportShareSemanticsLines(
  stage: DossierExportShareStage,
): string[] {
  const lines: string[] = [];
  if (stage === "draft") {
    lines.push(DOSSIER_EXPORT_SHARE_SEMANTICS.draftNotPublished);
  }
  if (stage !== "draft") {
    lines.push(
      DOSSIER_EXPORT_SHARE_SEMANTICS.reviewReadyNotApprovedForExport,
    );
  }
  if (
    stage === "approved_for_export" ||
    stage === "publish_ready" ||
    stage === "published"
  ) {
    lines.push(DOSSIER_EXPORT_SHARE_SEMANTICS.approvedForExportNotPublished);
  }
  if (stage === "publish_ready" || stage === "published") {
    lines.push(DOSSIER_EXPORT_SHARE_SEMANTICS.publishReadyNotPublished);
  }
  lines.push(DOSSIER_EXPORT_SHARE_SEMANTICS.sharePreviewNotPublicPublish);
  lines.push(DOSSIER_EXPORT_SHARE_SEMANTICS.exportManualOnly);
  return lines;
}
