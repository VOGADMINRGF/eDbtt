import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicCommunitySourceSubmissionForm } from "@/features/participation/PublicCommunitySourceSubmissionForm";

describe("community source review public submission ui", () => {
  it("renders a minimal review-first form for published public participation spaces", () => {
    const html = renderToStaticMarkup(
      <PublicCommunitySourceSubmissionForm
        participationSpaceId="space-1"
        participationSpaceSlug="sichere-schulwege"
        participationSpaceTitle="Sichere Schulwege"
      />,
    );

    expect(html).toContain("Hinweise zu diesem Raum einreichen");
    expect(html).toContain("Quellenvorschlag");
    expect(html).toContain("Gegenquelle");
    expect(html).toContain("Kontextnotiz");
    expect(html).toContain("Erfahrungsbericht");
    expect(html).toContain("Unklarer Claim");
    expect(html).toContain("Begriffsklärung");
    expect(html).toContain("Eskalationshinweis");
    expect(html).toContain("Der Hinweis bestätigt keine Wahrheit");
    expect(html).toContain("Hinweis einreichen");
    expect(html).toContain("Nicht ausfüllen");
  });

  it("keeps internal automation and publication promises out of the public form copy", () => {
    const html = renderToStaticMarkup(
      <PublicCommunitySourceSubmissionForm
        participationSpaceId="space-1"
        participationSpaceSlug="sichere-schulwege"
        participationSpaceTitle="Sichere Schulwege"
      />,
    );

    expect(html).not.toContain("Auto-Publish");
    expect(html).not.toContain("Auto-Graph");
    expect(html).not.toContain("verified");
    expect(html).not.toContain("accepted_as_fact");
  });
});
