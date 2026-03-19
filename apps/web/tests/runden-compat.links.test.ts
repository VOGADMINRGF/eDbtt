import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(relPath: string) {
  return readFileSync(path.join(process.cwd(), "src", relPath), "utf8");
}

describe("runden backward-compat links", () => {
  it("Scenario B: legacy UI links are updated to canonical /runden", () => {
    const demoStudio = read("app/demo/page.tsx");
    const demoNav = read("app/demo/DemoNavClient.tsx");

    expect(demoStudio).toContain('href: "/runden"');
    expect(demoStudio).not.toContain('href: "/demo/runden"');

    expect(demoNav).toContain('{ href: "/runden", label: "Runden (produktiv)" }');
    expect(demoNav).not.toContain('{ href: "/demo/runden", label: "Runden" }');
  });

  it("Scenario C: retired demo path does not depend on seeded topicRound data", () => {
    const compatPage = read("app/demo/runden/page.tsx");

    expect(compatPage).toContain("redirect(");
    expect(compatPage).not.toContain("@features/topicRound");
    expect(compatPage).not.toContain("listRoundsByTopicSlug");
    expect(compatPage).not.toContain("listTopics");
  });
});
