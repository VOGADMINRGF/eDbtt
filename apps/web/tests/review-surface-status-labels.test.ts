import { describe, expect, it } from "vitest";
import {
  createHandoffReviewStateLabel,
  dossierReviewStatusLabel,
  dossierWorkspaceDecisionStatusLabel,
  preparationStatusLabel,
  reviewQueueStateLabel,
  REVIEW_SURFACE_GUARDRAILS,
  sourceFactcheckEnrichmentStatusLabel,
} from "@/features/review/reviewSurfaceStatusLabels";

describe("review surface status labels", () => {
  it("keeps queue and preparation states semantically separated", () => {
    expect(reviewQueueStateLabel("review_ready")).toBe("Bereit für Prüfung");
    expect(reviewQueueStateLabel("publish_ready")).toBe("Bereit für Freigabe");
    expect(preparationStatusLabel("active_or_published")).toBe("Sichtbar oder historisch veröffentlicht");
  });

  it("keeps source and dossier review states on the same public wording", () => {
    expect(sourceFactcheckEnrichmentStatusLabel("needs_source_review")).toBe("Quellenprüfung offen");
    expect(sourceFactcheckEnrichmentStatusLabel("needs_factcheck_review")).toBe("Factcheck-Fragen offen");
    expect(dossierWorkspaceDecisionStatusLabel("needs_source_review")).toBe("Quellenprüfung offen");
    expect(dossierWorkspaceDecisionStatusLabel("needs_factcheck_review")).toBe("Factcheck-Fragen offen");
  });

  it("keeps create, dossier and factcheck guardrails review-first", () => {
    expect(createHandoffReviewStateLabel("factcheck_candidate")).toBe("Für Factcheck vorbereitet");
    expect(dossierReviewStatusLabel("needs_review")).toBe("Review erforderlich");
    expect(REVIEW_SURFACE_GUARDRAILS.reviewReadyNotApproved).toContain("review_ready");
    expect(REVIEW_SURFACE_GUARDRAILS.publishReadyNotPublished).toContain("publish_ready");
    expect(REVIEW_SURFACE_GUARDRAILS.factcheckNoAutoRun).toContain("Kein Factcheck-Siegel");
  });
});
