import { describe, expect, it } from "vitest";
import {
  RATHAUS_DEMO_PROCEDURE_DEADLINE_ISO,
  getRathausDemoGraphSeedPreview,
} from "@features/region/rathausDemoSeed";

describe("reinickendorf rathaus demo graph seed contract", () => {
  it("recognizes the official source and exposes a closed archived review-first seed", () => {
    const preview = getRathausDemoGraphSeedPreview({
      urls: [
        "https://www.berlin.de/ba-reinickendorf/service/buergerbeteiligung/investitions-haushaltsplanung/",
      ],
      roles: ["admin"],
    });

    expect(preview).not.toBeNull();
    expect(preview?.source.isOfficialRegionalSource).toBe(true);
    expect(preview?.procedureStatus).toBe("closed");
    expect(preview?.archiveStatus).toBe("archived");
    expect(preview?.deadlineIso).toBe(RATHAUS_DEMO_PROCEDURE_DEADLINE_ISO);
    expect(preview?.deadlinePassed).toBe(true);
    expect(preview?.counts.publicClusters).toBe(3);
    expect(preview?.counts.dossiers).toBeGreaterThanOrEqual(2);
    expect(preview?.counts.anlassraeume).toBeGreaterThanOrEqual(15);
    expect(preview?.counts.claims).toBeGreaterThanOrEqual(45);
    expect(preview?.guardrails.noAutoPublish).toBe(true);
    expect(preview?.guardrails.noAutoOfficialApproval).toBe(true);
    expect(preview?.guardrails.noAutoDossierFinalization).toBe(true);
    expect(preview?.guardrails.noAutoAnlassraumFinalization).toBe(true);
    expect(preview?.guardrails.noSilentGraphMerge).toBe(true);
  });
});
