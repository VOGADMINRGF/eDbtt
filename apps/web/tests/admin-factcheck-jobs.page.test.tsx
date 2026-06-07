import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminFactcheckJobsSection from "@/app/admin/review/AdminFactcheckJobsSection";

vi.mock("@/app/admin/review/FactcheckJobActions", () => ({
  default: ({ jobId }: { jobId: string }) => (
    <div data-testid={`factcheck-actions:${jobId}`}>Factcheck actions</div>
  ),
}));

describe("AdminFactcheckJobsSection", () => {
  it("renders conservative factcheck working states without auto-publish claims", () => {
    const html = renderToStaticMarkup(
      <AdminFactcheckJobsSection
        factcheckJobs={[
          {
            jobId: "factcheck-1",
            inputText: "Bitte prüft die behauptete Schulsanierung mit den angegebenen Quellen.",
            status: "needs_manual_review",
            requestedAction: "source_check",
            truthStatus: "review_required",
            sourceSupport: "open",
            sourceStatus: "Quellenprüfung offen",
            verificationLabel: "analysiert",
            gate: {
              loginConfirmed: true,
              entitlementConfirmed: true,
              pricingConfirmed: true,
              userConfirmed: true,
              noSilentCost: true,
            },
            providerMatrix: {
              requestedAction: "source_check",
              searchRequested: true,
              deepResearchRequested: false,
              providerRunAllowed: true,
              deepResearchAllowed: false,
              usedProviders: ["search"],
              notes: ["Kein Auto-Publish und kein Auto-Graph-Merge."],
            },
            result: {
              jobId: "factcheck-1",
              claims: [],
              sources: [],
              sourceSupport: "open",
              sourceStatus: "Quellenprüfung offen",
              truthStatus: "review_required",
              verificationLabel: "analysiert",
              researchUsed: "search",
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
          } as any,
        ]}
      />,
    );

    expect(html).toContain("Factcheck-Jobs");
    expect(html).toContain("Bitte prüft die behauptete Schulsanierung");
    expect(html).toContain("Quellenprüfung offen");
    expect(html).toContain("Factcheck actions");
    expect(html).toContain("Gate bestätigt");
    expect(html).toContain("ProviderMatrix: source_check");
    expect(html).toContain("Offene Fragen:");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).not.toContain("direkt veröffentlichen");
    expect(html).not.toContain("GraphCandidate vorbereiten");
  });
});
