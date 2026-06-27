import { describe, expect, it } from "vitest";

import {
  createEmptyVoxyCoCreationState,
  getVoxyCocreationNextRequiredSteps,
  getVoxyCocreationOpenQuestions,
  isVoxyCoCreationReadyForExport,
  VOXY_AUTHOR_APPROVAL_STATUSES,
  VOXY_EDITORIAL_REVIEW_STATUSES,
  VoxyCoCreationStateSchema,
} from "@/features/voxy/coCreationState";

describe("voxy co-creation state contract", () => {
  it("keeps author approval and editorial review as separate gates", () => {
    const authorOnlyApproved = {
      ...createEmptyVoxyCoCreationState(),
      authorApprovalStatus: "confirmed" as const,
      editorialReviewStatus: "in_review" as const,
    };

    const editorialOnlyApproved = {
      ...createEmptyVoxyCoCreationState(),
      authorApprovalStatus: "needs_author_confirmation" as const,
      editorialReviewStatus: "approved_for_export" as const,
    };

    expect(isVoxyCoCreationReadyForExport(authorOnlyApproved)).toBe(false);
    expect(isVoxyCoCreationReadyForExport(editorialOnlyApproved)).toBe(false);
  });

  it("requires both gates before export readiness", () => {
    const ready = {
      ...createEmptyVoxyCoCreationState(),
      authorApprovalStatus: "confirmed" as const,
      editorialReviewStatus: "approved_for_export" as const,
    };

    expect(isVoxyCoCreationReadyForExport(ready)).toBe(true);
  });

  it("treats approved_for_export as distinct from publication", () => {
    expect(VOXY_EDITORIAL_REVIEW_STATUSES).toContain("approved_for_export");
    expect(VOXY_EDITORIAL_REVIEW_STATUSES).not.toContain("published");
    expect(VOXY_EDITORIAL_REVIEW_STATUSES).not.toContain("official");
  });

  it("models the required co-creation fields as a typed contract", () => {
    const parsed = VoxyCoCreationStateSchema.parse({
      ...createEmptyVoxyCoCreationState(),
      authorIntent: "Ich will das Problem als faire Reformfrage sichtbar machen.",
      rawObservation: "Viele Bewerber erleben Ghosting nach offiziellen Zusagen.",
      nonNegotiableThesis: "Das Problem ist strukturell, nicht nur individuell.",
      structuralIssue: "Fehlende Verbindlichkeit im Bewerbungsprozess.",
      publicQuestion: "Welche Mindeststandards braucht ein fairer Bewerbungsprozess?",
      verifiedFacts: ["Absagefristen fehlen oft."],
      assumptions: ["Interne Prozesse sind ueberlastet."],
      openQuestions: ["Wie haeufig ist das in kleinen Betrieben?"],
      sensitiveClaims: ["Kein Vorwurf gegen konkrete Firmen ohne Beleg."],
      bothSidesObligations: {
        sideA: ["Arbeitgeber muessen Rueckmeldungen verlässlich machen."],
        sideB: ["Bewerber muessen zugesagte Termine ebenfalls einhalten."],
      },
      reformProposal: "Ein transparenter Mindeststandard fuer Rueckmeldungen.",
      safeguards: ["Keine Namensnennung ohne dossiergebundene Belege."],
      tonePreference: "scharf, aber fair",
      authorApprovalStatus: "confirmed",
      editorialReviewStatus: "needs_review",
    });

    expect(parsed.authorApprovalStatus).toBe("confirmed");
    expect(parsed.editorialReviewStatus).toBe("needs_review");
  });

  it("uses the final issue-aligned status enums", () => {
    expect(VOXY_AUTHOR_APPROVAL_STATUSES).toEqual([
      "draft",
      "needs_author_confirmation",
      "confirmed",
      "rejected",
    ]);
    expect(VOXY_EDITORIAL_REVIEW_STATUSES).toEqual([
      "not_submitted",
      "needs_review",
      "in_review",
      "changes_requested",
      "approved_for_export",
      "rejected",
    ]);
  });

  it("shows author confirmation as a required next step before export preparation", () => {
    const steps = getVoxyCocreationNextRequiredSteps({
      ...createEmptyVoxyCoCreationState(),
      authorApprovalStatus: "needs_author_confirmation",
      editorialReviewStatus: "approved_for_export",
    });

    expect(steps).toContain("request_author_confirmation");
    expect(isVoxyCoCreationReadyForExport({
      ...createEmptyVoxyCoCreationState(),
      authorApprovalStatus: "needs_author_confirmation",
      editorialReviewStatus: "approved_for_export",
    })).toBe(false);
  });

  it("treats sensitive claims as a review boundary and keeps review-first questions visible", () => {
    const state = {
      ...createEmptyVoxyCoCreationState(),
      sensitiveClaims: ["Ein schwerer Vorwurf ohne oeffentlichen Beleg."],
      editorialReviewStatus: "needs_review" as const,
    };

    expect(getVoxyCocreationNextRequiredSteps(state)).toEqual(
      expect.arrayContaining(["review_sensitive_claims", "complete_editorial_review"]),
    );
    expect(getVoxyCocreationOpenQuestions(state)).toEqual(
      expect.arrayContaining([
        "Was ist die eigentliche Beobachtung?",
        "Welche Fakten sind belegt?",
      ]),
    );
  });
});
