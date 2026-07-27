import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Dossier } from "@features/dossier";

vi.mock("@/components/dossier/DossierWorkspace", () => ({
  default: ({ dossier, demo }: { dossier: Dossier; demo?: boolean }) => (
    <div>
      DossierWorkspace:{dossier.meta.title}:{demo ? "demo" : "runtime"}
    </div>
  ),
}));

import { DossierPagePublicBody } from "@/app/dossier/[id]/ui";

function buildDossier(title: string): Dossier {
  return {
    meta: {
      id: "dossier-1",
      title,
      jurisdiction: "municipal",
      status: "published",
      createdAt: "2026-07-20T10:00:00.000Z",
    },
  } as unknown as Dossier;
}

describe("dossier public route contract", () => {
  it("renders the focused canonical workspace for readable runtime dossiers", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="dossier-1"
        dossier={buildDossier("Dossier Mobilität")}
        loadState="ready"
      />,
    );

    expect(html).toContain("DossierWorkspace:Dossier Mobilität:runtime");
    expect(html).not.toContain("SocialOutputPreviewPanel");
    expect(html).not.toContain("RouteBoundCompanionPanel");
    expect(html).not.toContain("ShareDeepLinkActions");
  });

  it("keeps review-only drafts out of the public workspace without demo fallback", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="dossier-draft-001"
        dossier={null}
        loadState="review_only"
      />,
    );

    expect(html).toContain("Reviewpflichtiger Dossier-Entwurf");
    expect(html).toContain("kein Demo-Dossier als Ersatz");
    expect(html).not.toContain("DossierWorkspace");
  });

  it("marks the explicit demo exception", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="demo"
        dossier={buildDossier("Demo")}
        loadState="ready"
        demo
      />,
    );

    expect(html).toContain("DossierWorkspace:Demo:demo");
  });
});
