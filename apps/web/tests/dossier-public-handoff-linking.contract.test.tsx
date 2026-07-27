import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Dossier } from "@features/dossier";

vi.mock("@/components/dossier/DossierWorkspace", () => ({
  default: ({ dossier }: { dossier: Dossier }) => <div>Workspace:{dossier.meta.title}</div>,
}));

import { DossierPagePublicBody } from "@/app/dossier/[id]/ui";

describe("dossier public handoff boundary", () => {
  it("does not turn a browser-local handoff into a second dossier workspace", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="dossier-1"
        handoffDraft={{
          id: "browser-only-handoff",
          resumeHref: "/create?resume=create_handoff",
        }}
        dossier={{
          meta: {
            id: "dossier-1",
            title: "Dossier Schulwegsicherheit",
          },
        } as unknown as Dossier}
        loadState="ready"
      />,
    );

    expect(html).toContain("Workspace:Dossier Schulwegsicherheit");
    expect(html).not.toContain("browser-only-handoff");
    expect(html).not.toContain("resume=create_handoff");
    expect(html).not.toContain("Aus deinem Beitrag vorbereitet");
  });
});
