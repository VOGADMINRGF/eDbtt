import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const VISUAL_LOCK_SOURCES = [
  "src/app/start/LandingStart.tsx",
  "src/app/runden/page.tsx",
  "src/app/runden/new/page.tsx",
  "src/app/runden/new/AnlassraumSetupForm.tsx",
  "src/app/create/CreateClient.tsx",
  "src/features/create/SharedCreateComposer.tsx",
  "src/components/voxy/VoxyGuide.tsx",
];

describe("visual system lock contract", () => {
  it("keeps the polished surfaces free of raw light/dark utility regressions", () => {
    const sources = VISUAL_LOCK_SOURCES.map((path) =>
      readFileSync(resolve(process.cwd(), path), "utf8"),
    );

    for (const source of sources) {
      expect(source).not.toContain("bg-white");
      expect(source).not.toContain("text-black");
      expect(source).not.toContain("bg-slate-950");
      expect(source).not.toContain("text-white");
      expect(source).not.toContain("Developer-Hinweis");
    }
  });
});
