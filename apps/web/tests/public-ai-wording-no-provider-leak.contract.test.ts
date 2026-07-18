import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const DOCS_ROOT = resolve(process.cwd(), "../../docs/E150");

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function readDoc(fileName: string) {
  return readFileSync(resolve(DOCS_ROOT, fileName), "utf8");
}

describe("public AI wording no-provider-leak contract", () => {
  it("keeps public pricing and create surfaces on generic research wording", () => {
    const publicCorpus = [
      read("src/app/pricing/page.tsx"),
      read("src/app/pricing/institutionen/page.tsx"),
      read("src/app/create/CreateClient.tsx"),
      read("src/features/create/CreateVisualFollowup.tsx"),
      read("src/features/create/CreateLinkIntakeClarification.tsx"),
      read("src/features/create/linkIntake.ts"),
      readDoc("membership_pricing.md"),
      readDoc("Part19_Pricing_Packaging.md"),
    ].join("\n");

    expect(publicCorpus).toContain("Recherche-Kontingent");
    expect(publicCorpus).toContain("Quellenprüfung");
    expect(publicCorpus).toContain("Premium-Recherche");

    expect(publicCorpus).not.toContain("Perplexity Search Credit");
    expect(publicCorpus).not.toContain("ARI Deep Research");
    expect(publicCorpus).not.toContain("Search Credit / Dossier Search");
    expect(publicCorpus).not.toContain("Deep Research Credit");
    expect(publicCorpus).not.toContain("Fact-check / Deep Search");
    expect(publicCorpus).not.toContain("Faktencheck / Deep Search");
  });

  it("keeps docs wired to the new public wording policy", () => {
    const membership = readDoc("membership_pricing.md");
    const part19 = readDoc("Part19_Pricing_Packaging.md");
    const v3Target = readDoc("V3_UX_TARGET_VOXY_CHAT_WORKSPACE_REFERENCE_2026-07-15.md");

    expect(membership).toContain("V3_AI_ORCHESTRATION_AND_RESEARCH_CREDIT_POLICY_2026-07-18.md");
    expect(part19).toContain("V3_AI_ORCHESTRATION_AND_RESEARCH_CREDIT_POLICY_2026-07-18.md");
    expect(v3Target).toContain("V3_AI_ORCHESTRATION_AND_RESEARCH_CREDIT_POLICY_2026-07-18.md");
  });
});
