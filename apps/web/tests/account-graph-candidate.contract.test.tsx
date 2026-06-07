import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AccountGraphMergeCandidateSection from "@/app/account/AccountGraphMergeCandidateSection";

describe("account graph candidate section", () => {
  it("shows graph candidates as working state and not as published", () => {
    const html = renderToStaticMarkup(
      <AccountGraphMergeCandidateSection
        candidates={[
          {
            id: "graph-1",
            sourceType: "create_analysis",
            sourceId: "draft-1",
            reviewRequestId: "editorial-1",
            userId: "user-1",
            text: "Schulwegsicherheit im Kiez soll als Claim weiter geprüft werden.",
            normalizedText: "schulwegsicherheit im kiez soll als claim weiter geprüft werden",
            candidateKind: "claim",
            proposedTitle: "Schulwegsicherheit im Kiez",
            proposedSummary: "Claim-Kandidat aus Analyse und Review.",
            proposedClaims: ["Schulwegsicherheit im Kiez soll als Claim weiter geprüft werden."],
            proposedTopics: [],
            proposedSources: ["https://example.org/quelle"],
            truthStatus: "review_required",
            sourceSupport: "partial",
            sourceStatus: "Prüfung empfohlen",
            verificationLabel: "analysiert",
            reviewRecommended: true,
            reviewStatus: "accepted_for_staging",
            mergeStatus: "duplicate_suspected",
            duplicateCandidates: [
              {
                id: "graph-2",
                label: "Schulwegsicherheit im Kiez Nord",
                matchType: "title_similarity",
                sourceType: "create_analysis",
                candidateKind: "claim",
                reviewStatus: "needs_review",
                mergeStatus: "not_started",
              },
            ],
            createdAt: "2026-06-06T12:00:00.000Z",
            updatedAt: "2026-06-06T12:00:00.000Z",
            noTruthPromotion: true,
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            requiresEditorialConfirmation: true,
          },
        ]}
      />,
    );

    expect(html).toContain("Graph-Kandidaten");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).toContain("Noch nicht zusammengeführt");
    expect(html).toContain("Graph-Merge in Prüfung");
    expect(html).toContain("Nur nach redaktioneller Bestätigung");
    expect(html).toContain("Möglicherweise bereits vorhanden");
    expect(html).toContain("Truth-Status: review_required");
    expect(html).toContain("Quellenlage: partial");
    expect(html).not.toContain("Veröffentlicht");
    expect(html).not.toContain("gemerged");
    expect(html).not.toContain("im Graph");
  });
});
