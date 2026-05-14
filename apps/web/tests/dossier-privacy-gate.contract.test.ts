import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("dossier privacy gate contract", () => {
  it("guards active dossier actions before participation or clarification requests", () => {
    const viewerSource = readFileSync(resolve(process.cwd(), "src/components/dossier/DossierViewer.tsx"), "utf8");
    const companionSource = readFileSync(
      resolve(process.cwd(), "src/components/ai/RouteBoundCompanionPanel.tsx"),
      "utf8",
    );

    expect(viewerSource).toContain('ensureActiveProcessingAllowed("dossier-vote")');
    expect(viewerSource).toContain('ensureActiveProcessingAllowed("dossier-watchlist")');
    expect(viewerSource).toContain('ensureActiveProcessingAllowed("dossier-clarification")');
    expect(companionSource).toContain('ensureActiveProcessingAllowed("dossier-companion")');
  });
});
