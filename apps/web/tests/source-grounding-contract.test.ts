import { describe, expect, it } from "vitest";

import {
  buildSourceGroundingContext,
  finalizeSourceGroundingAudit,
} from "@features/analyze/sourceGroundingContract";

describe("source grounding contract", () => {
  it("marks upload-only entries without text as context-rot high risk", () => {
    const context = buildSourceGroundingContext({
      analysisMode: "analyze",
      evidenceItems: [
        {
          kind: "upload_document",
          fileName: "bericht.pdf",
        },
      ],
    });

    expect(context.auditBaseline.sourceInventory.uploadDocuments).toBe(1);
    expect(context.auditBaseline.documentGroundingPass.required).toBe(true);
    expect(context.auditBaseline.documentGroundingPass.documentsWithText).toBe(0);
    expect(context.auditBaseline.documentGroundingPass.contextRotRisk).toBe("high");
  });

  it("tracks document-grounded synthesis and no-source-bluffing for upload-backed claims", () => {
    const context = buildSourceGroundingContext({
      analysisMode: "media",
      evidenceItems: [
        {
          kind: "upload_document",
          id: "doc-1",
          title: "Mobilitätsbericht",
          documentText:
            "Der mittlere Abschnitt beschreibt einen Mobilitätskonflikt im Quartier sowie offene Fragen zur Umsetzung.",
        },
        {
          kind: "web_reference",
          id: "web-1",
          label: "Aktuelle Meldung",
          text: "Ergänzende Webquelle zur Debatte.",
          url: "https://example.org/debatte",
        },
      ],
    });

    const audit = finalizeSourceGroundingAudit({
      context,
      result: {
        claims: [{ text: "Der Bericht beschreibt einen Mobilitätskonflikt im Quartier." }],
        notes: [{ text: "Möglicher Widerspruch zwischen Bericht und Meldung." }],
        report: { keyConflicts: ["Widerspruch zwischen Quellenlage und Umsetzungspfad."] },
      },
    });

    expect(audit.documentGroundingPass.required).toBe(true);
    expect(audit.documentGroundingPass.middleCoverage).toBe(true);
    expect(audit.synthesis.documentGroundedClaims).toBeGreaterThanOrEqual(1);
    expect(audit.noSourceBluffing.passed).toBe(true);
    expect(audit.contradictionAudit.hasSignal).toBe(true);
    expect(audit.contradictionAudit.contradictionSignals.length).toBeGreaterThan(0);
    expect(audit.requiresManualReview).toBe(false);
  });

  it("flags no-source-bluffing failure when uploads exist but no document-grounded claim survives", () => {
    const context = buildSourceGroundingContext({
      analysisMode: "guided",
      evidenceItems: [
        {
          kind: "upload_document",
          id: "doc-1",
          title: "Sitzungsprotokoll",
          documentText: "Das Protokoll behandelt lokale Beteiligung und Umsetzungsfristen.",
        },
      ],
    });

    const audit = finalizeSourceGroundingAudit({
      context,
      result: {
        claims: [{ text: "Vollständig anderes Thema ohne Überschneidung." }],
        notes: [],
        report: { keyConflicts: [] },
      },
    });

    expect(audit.documentGroundingPass.required).toBe(true);
    expect(audit.noSourceBluffing.passed).toBe(false);
    expect(audit.noSourceBluffing.reason).toBe("uploads_present_but_no_document_grounded_claims");
    expect(audit.requiresManualReview).toBe(true);
  });
});
