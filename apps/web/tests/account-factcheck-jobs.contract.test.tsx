import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AccountFactcheckJobSection from "@/app/account/AccountFactcheckJobSection";

describe("account factcheck job section", () => {
  it("shows factcheck jobs as unpublished review-first work states", () => {
    const html = renderToStaticMarkup(
      <AccountFactcheckJobSection
        jobs={[
          {
            jobId: "factcheck-1",
            sourceType: "factcheck_request",
            sourceId: "contribution-1",
            requestedAction: "source_check",
            inputText: "Bitte prüft die Schulsanierung mit belastbaren Quellen.",
            status: "queued",
            truthStatus: "factcheck_requested",
            sourceSupport: "open",
            sourceStatus: "Quellenprüfung angefragt",
            verificationLabel: "analysiert",
            verdict: "UNDETERMINED",
            confidenceScore: 0,
            claims: [{ id: "1", text: "Schulsanierung ist bestätigt." } as any],
            sourceRefs: [],
            materialRefs: [],
            factcheckVerificationMode: "intake_only",
            factcheckResearchMode: "provider_assisted",
            factcheckSealEligibility: "needs_review",
            factcheckSealDecision: "none",
            publicSealVisible: false,
            limitations: ["Kein automatischer DeepSearch-Lauf."],
            auditEvents: [],
            createdAt: new Date("2026-06-06T09:00:00.000Z"),
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
          {
            jobId: "factcheck-2",
            sourceType: "factcheck_request",
            sourceId: "contribution-2",
            requestedAction: "deep_research",
            inputText: "Bitte mit Quellen klären, ob der Radweg zugesagt wurde.",
            status: "needs_manual_review",
            truthStatus: "review_required",
            sourceSupport: "open",
            sourceStatus: "Quellenprüfung offen",
            verificationLabel: "analysiert",
            verdict: "UNDETERMINED",
            confidenceScore: 0.31,
            claims: [{ id: "1", text: "Der Radweg wurde zugesagt." } as any],
            sourceRefs: [],
            materialRefs: [],
            factcheckVerificationMode: "manual_review",
            factcheckResearchMode: "deep_research_requested",
            factcheckSealEligibility: "needs_review",
            factcheckSealDecision: "none",
            publicSealVisible: false,
            limitations: ["Kein automatischer DeepSearch-Lauf."],
            result: {
              jobId: "factcheck-2",
              claims: [],
              sources: [],
              sourceSupport: "open",
              sourceStatus: "Quellenprüfung offen",
              truthStatus: "review_required",
              verificationLabel: "analysiert",
              researchUsed: "deep_search",
              providerMatrix: null,
              disagreement: null,
              confidence: { score: 0.31, bucket: "low", reasons: ["missing_sources"] },
              reviewRecommended: true,
              summary: "Quellenprüfung als Arbeitsstand angelegt. Belastbare Quellen fehlen noch.",
              openQuestions: ["Welche belastbaren Quellen oder Dokumente stützen den Beitrag?"],
              limitations: ["Kein automatischer DeepSearch-Lauf."],
              noTruthPromotion: true,
              noAutoGraphPromotion: true,
            },
            auditEvents: [],
            createdAt: new Date("2026-06-06T09:10:00.000Z"),
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
        ]}
      />,
    );

    expect(html).toContain("Quellenprüfung &amp; Faktencheck");
    expect(html).toContain("Quellenprüfung angefragt");
    expect(html).toContain("Manuelle Prüfung erforderlich");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).toContain("Quellenprüfung als Arbeitsstand angelegt");
    expect(html).not.toContain("Verifiziert");
    expect(html).not.toContain("im Graph");
  });
});
