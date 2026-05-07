import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("create curated dialog workspace contract", () => {
  it("keeps composer and curated dialog follow-up in a single flow", () => {
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );

    expect(clientSource).toContain("SharedCreateComposer");
    expect(clientSource).toContain("CreateVisualFollowup");
    expect(followupSource).toContain("UserContributionBubble");
    expect(followupSource).toContain("AssistantUnderstandingBubble");
    expect(followupSource).toContain("StructuredWorkstateBlock");
    expect(followupSource).toContain("FollowupActionRail");
    expect(followupSource).toContain("DetailsAccordion");
  });

  it("renders dialog roles and keeps primary action explicit", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );

    expect(followupSource).toContain("Du");
    expect(followupSource).toContain("eDebatte");
    expect(followupSource).toContain("Vorgeschlagener Arbeitsstand");
    expect(followupSource).toContain("Ja, Struktur übernehmen");
    expect(followupSource).toContain("Keine automatische Stimme");
    expect(followupSource).toContain("Keine automatische Veröffentlichung");
    expect(followupSource).toContain("Keine automatische Kostenbuchung");
  });

  it("keeps details progressively disclosed after the core workstate", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );

    const coreIndex = followupSource.indexOf(">Vorgeschlagener Arbeitsstand</p>");
    const confirmIndex = followupSource.indexOf("Du kannst bestätigen, einzelne Punkte ändern");
    const detailsIndex = followupSource.indexOf("Details zum Originaltext");
    const impactIndex = followupSource.lastIndexOf("CREATE_VISUAL_FOLLOWUP_COPY.impactTitle");

    expect(coreIndex).toBeGreaterThan(-1);
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(detailsIndex).toBeGreaterThan(-1);
    expect(impactIndex).toBeGreaterThan(-1);
    expect(coreIndex).toBeLessThan(confirmIndex);
    expect(confirmIndex).toBeLessThan(detailsIndex);
    expect(detailsIndex).toBeLessThan(impactIndex);
    expect(followupSource).toContain("summary className=\"cursor-pointer");
  });
});
