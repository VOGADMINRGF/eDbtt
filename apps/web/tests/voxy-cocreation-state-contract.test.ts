import { describe, expect, it } from "vitest";

import {
  createEmptyVoxyCoCreationState,
  isVoxyCoCreationReadyForExport,
  VOXY_EDITORIAL_REVIEW_STATUSES,
  VoxyCoCreationStateSchema,
} from "@/features/voxy/coCreationState";

describe("voxy co-creation state contract", () => {
  it("keeps author approval and editorial review as separate gates", () => {
    const authorOnlyApproved = {
      ...createEmptyVoxyCoCreationState(),
      authorApprovalStatus: "author_confirmed" as const,
      editorialReviewStatus: "submitted" as const,
    };

    const editorialOnlyApproved = {
      ...createEmptyVoxyCoCreationState(),
      authorApprovalStatus: "needs_author_input" as const,
      editorialReviewStatus: "approved_for_export" as const,
    };

    expect(isVoxyCoCreationReadyForExport(authorOnlyApproved)).toBe(false);
    expect(isVoxyCoCreationReadyForExport(editorialOnlyApproved)).toBe(false);
  });

  it("requires both gates before export readiness", () => {
    const ready = {
      ...createEmptyVoxyCoCreationState(),
      authorApprovalStatus: "author_confirmed" as const,
      editorialReviewStatus: "approved_for_export" as const,
    };

    expect(isVoxyCoCreationReadyForExport(ready)).toBe(true);
  });

  it("treats approved_for_export as distinct from publication", () => {
    expect(VOXY_EDITORIAL_REVIEW_STATUSES).toContain("approved_for_export");
    expect(VOXY_EDITORIAL_REVIEW_STATUSES).not.toContain("published");
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
      authorApprovalStatus: "author_confirmed",
      editorialReviewStatus: "submitted",
    });

    expect(parsed.authorApprovalStatus).toBe("author_confirmed");
    expect(parsed.editorialReviewStatus).toBe("submitted");
  });
});
