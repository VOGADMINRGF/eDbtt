import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";

async function renderStudio() {
  const element = await DossierOutputStudioPage({
    params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
  });
  return renderToStaticMarkup(element);
}

describe("social-manual-export-fallback.contract", () => {
  it("keeps manual export as the honest fallback when no connector is configured", async () => {
    const html = await renderStudio();

    expect(html).toContain("Connector- und Scheduler-Status");
    expect(html).toContain("manueller Export der Fallback");
    expect(html).toContain("Noch kein persistierter Queue-Eintrag vorhanden");
    expect(html).toContain("Kein Auto-Publish");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });
});
