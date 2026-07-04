import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("create dossier graph anlassraum handoff boundary", () => {
  it("keeps the graph/anlassraum handoff readmodel client-safe", () => {
    const readModelSource = readFileSync(
      resolve(process.cwd(), "src/features/create/createCandidatePreview.ts"),
      "utf8",
    );
    const panelSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateCandidatePreviewPanel.tsx"),
      "utf8",
    );

    expect(readModelSource).toContain("CreateDossierGraphAnlassraumHandoffReadModel");
    expect(readModelSource).not.toContain("server-only");
    expect(readModelSource).not.toContain("triMongo");
    expect(readModelSource).not.toContain("topicGraphRuntimeServer");
    expect(readModelSource).not.toContain("anlassraumRuntimeServer");
    expect(readModelSource).not.toContain("participationSpaceRuntimeServer");
    expect(panelSource).toContain("Graph- / Anlassraum-Handoff");
    expect(panelSource).not.toContain("server-only");
    expect(panelSource).not.toContain("triMongo");
  });
});
