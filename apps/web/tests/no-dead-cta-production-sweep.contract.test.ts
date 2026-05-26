import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const REPO_ROOT = path.resolve(APP_ROOT, "..", "..");

function readSource(relativePath: string, scope: "app" | "repo" = "app") {
  const root = scope === "app" ? APP_ROOT : REPO_ROOT;
  return readFileSync(path.resolve(root, relativePath), "utf8");
}

describe("no dead CTA production sweep", () => {
  it("keeps central public V1 surfaces free of placeholder hrefs", () => {
    [
      "src/app/start/page.tsx",
      "src/app/start/LandingStart.tsx",
      "src/app/runden/page.tsx",
      "src/app/stream/page.tsx",
      "src/app/swipes/SwipesClient.tsx",
      "src/app/dossier/[id]/ui.tsx",
    ].forEach((relativePath) => {
      expect(readSource(relativePath)).not.toContain('href="#"');
    });
  });

  it("keeps the legacy stream/report components aligned with productive V1 routes", () => {
    const streamCardSource = readSource("features/stream/components/StreamCard.tsx", "repo");
    const reportSidebarSource = readSource("features/report/components/LeftSidebar.tsx", "repo");

    expect(streamCardSource).not.toContain('href="#"');
    expect(streamCardSource).not.toContain("/beitrag/");
    expect(streamCardSource).not.toContain("/dummy/");
    expect(streamCardSource).not.toContain("dummy1.jpg");
    expect(streamCardSource).toContain("/stream/");
    expect(streamCardSource).toContain("Event-Kontext");

    expect(reportSidebarSource).not.toContain('href="#"');
    expect(reportSidebarSource).toContain('href="/report"');
  });
});
