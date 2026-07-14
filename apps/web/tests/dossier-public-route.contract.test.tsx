import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Dossier } from "@features/dossier";

vi.mock("@/components/dossier/DossierViewer", () => ({
  DossierViewer: ({ dossier }: { dossier: Dossier }) => <div>DossierViewer:{dossier.meta?.title}</div>,
}));

vi.mock("@/components/ai/RouteBoundCompanionPanel", () => ({
  default: () => <div>RouteBoundCompanionPanel</div>,
}));

vi.mock("@/components/mobile/ShareDeepLinkActions", () => ({
  default: () => <div>ShareDeepLinkActions</div>,
}));

vi.mock("@/components/share/SocialOutputPreviewPanel", () => ({
  default: () => <div>SocialOutputPreviewPanel</div>,
}));

vi.mock("@/features/create/CreateHandoffPanel", () => ({
  CreateHandoffPanel: () => <div>CreateHandoffPanel</div>,
}));

import { DossierPagePublicBody } from "@/app/dossier/[id]/ui";

function buildDossier(title: string): Dossier {
  return {
    meta: {
      id: "dossier-1",
      title,
      region: "Berlin",
    },
    analyze: {
      summary: "Öffentlicher Dossierstand.",
      claims: [{ title: "Erste Aussage" }],
    },
  } as unknown as Dossier;
}

describe("dossier public route contract", () => {
  it("shows public reading copy and share surfaces only for readable dossier states", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="dossier-1"
        handoffDraft={null}
        dossier={buildDossier("Dossier Mobilität")}
        loadState="ready"
      />,
    );

    expect(html).toContain("Öffentlich lesbarer Dossierstand");
    expect(html).toContain("Sichtbar heißt nicht automatisch geprüft oder amtlich.");
    expect(html).toContain("Amtlich freigegeben bleibt ausschließlich der Official-Release-Pfad.");
    expect(html).toContain("Öffentlich lesbare Debattenstände bleiben frei zugänglich.");
    expect(html).toContain("Personalisierung blendet weder starke Gegenargumente noch Quellen- oder Evidenzgrenzen aus.");
    expect(html).toContain("Ein B2G-Cockpit ändert nichts an der freien öffentlichen Lesbarkeit");
    expect(html).toContain(
      "Read-only Lesen, Teilen und QR für bereits sichtbare öffentliche Stände verbrauchen keinen GOV-light-Slot",
    );
    expect(html).toContain("ShareDeepLinkActions");
    expect(html).toContain("SocialOutputPreviewPanel");
    expect(html).toContain("RouteBoundCompanionPanel");
    expect(html).toContain("DossierViewer:Dossier Mobilität");
  });

  it("keeps review-only dossier drafts free of public link and share surfaces", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="dossier-draft-001"
        handoffDraft={null}
        dossier={null}
        loadState="review_only"
      />,
    );

    expect(html).toContain("Reviewpflichtiger Dossier-Draft");
    expect(html).toContain("Öffentlicher Link, Share-Fläche und QR bleiben aus");
    expect(html).toContain("Öffentlich lesbare Debattenstände bleiben frei zugänglich.");
    expect(html).toContain("Ein B2G-Cockpit ändert nichts an der freien öffentlichen Lesbarkeit");
    expect(html).toContain(
      "Read-only Lesen, Teilen und QR für bereits sichtbare öffentliche Stände verbrauchen keinen GOV-light-Slot",
    );
    expect(html).not.toContain("ShareDeepLinkActions");
    expect(html).not.toContain("SocialOutputPreviewPanel");
    expect(html).not.toContain("RouteBoundCompanionPanel");
  });
});
