import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const VISUAL_LOCK_SOURCES = [
  "src/app/start/LandingStart.tsx",
  "src/components/quickActions/TaskFirstQuickActionCenter.tsx",
  "src/app/create/CreateClient.tsx",
  "src/features/create/SharedCreateComposer.tsx",
  "src/app/runden/page.tsx",
  "src/app/runden/new/page.tsx",
  "src/app/runden/new/AnlassraumSetupForm.tsx",
  "src/app/dossier/ui.tsx",
  "src/app/dossier/[id]/ui.tsx",
  "src/app/swipes/SwipesClient.tsx",
  "src/features/surfaces/swipes/SwipesSurface.tsx",
  "src/components/voxy/VoxyGuide.tsx",
];

describe("visual system lock contract", () => {
  it("keeps the public surfaces free of card-wall utility regressions", () => {
    const sources = VISUAL_LOCK_SOURCES.map((path) => ({
      path,
      source: readFileSync(resolve(process.cwd(), path), "utf8"),
    }));

    const forbiddenTokens = [
      "shadow-",
      "drop-shadow",
      "bg-white",
      "bg-black",
      "bg-slate-",
      "bg-zinc-",
      "bg-neutral-",
      "border-slate-",
      "border-zinc-",
      "ring-1",
    ];

    for (const { path, source } of sources) {
      for (const token of forbiddenTokens) {
        expect(source, `${path} should not contain ${token}`).not.toContain(token);
      }
      expect(source).not.toContain("Developer-Hinweis");
      expect(source).not.toContain("text-black");
      expect(source).not.toContain("text-white");
      expect(source).not.toContain("bg-slate-950");
    }
  });

  it("keeps the shared public canvas layer available in globals", () => {
    const globalsSource = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(globalsSource).toContain(".public-canvas");
    expect(globalsSource).toContain(".public-shell");
    expect(globalsSource).toContain(".public-hero-grid");
    expect(globalsSource).toContain(".public-reader-grid");
    expect(globalsSource).toContain(".public-voxy-rail");
    expect(globalsSource).toContain(".public-dialog-area");
    expect(globalsSource).toContain(".public-dialog-surface");
    expect(globalsSource).toContain(".public-voxy-stage");
    expect(globalsSource).toContain(".public-voxy-image");
    expect(globalsSource).toContain(".public-voxy-aura");
    expect(globalsSource).toContain(".public-voxy-marker");
  });
});
