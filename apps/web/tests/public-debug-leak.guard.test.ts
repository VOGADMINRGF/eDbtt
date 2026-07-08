import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const PUBLIC_SURFACE_FILES = [
  "src/app/start/LandingStart.tsx",
  "src/app/runden/new/page.tsx",
  "src/app/runden/new/AnlassraumSetupForm.tsx",
  "src/app/runden/new/AnlassraumSupportSettings.tsx",
  "src/app/runden/new/AnlassraumPrePublishCheck.tsx",
  "src/app/dossier/ui.tsx",
  "src/app/themen/page.tsx",
  "src/features/home/HomeSplitVoxyLanding.tsx",
] as const;

const FORBIDDEN_PUBLIC_DEBUG_TERMS = [
  "AI-Usage-Event",
  "drafts-Collection",
  "runtime truth",
  "Runtime truth",
  "Missing runtime truth",
  "serverseitiger Draft",
  "serverseitiger Draft-Record",
  "serverseitig gespeicherter Entwurf",
  "KI-Lauf",
  "kein KI-Lauf",
] as const;

const FORBIDDEN_REPLACED_PUBLIC_TERMS = [
  "Themen-Zusammenfassung",
  "Themenüberblick",
] as const;

function readPublicSurfaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("public debug leak guard", () => {
  it("keeps high-confidence internal runtime/debug wording out of public entry surfaces", () => {
    const leaks: string[] = [];

    for (const file of PUBLIC_SURFACE_FILES) {
      const source = readPublicSurfaceFile(file);

      for (const term of FORBIDDEN_PUBLIC_DEBUG_TERMS) {
        if (source.includes(term)) {
          leaks.push(`${file}: ${term}`);
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it("keeps replaced public terminology off the aligned entry surfaces", () => {
    const leaks: string[] = [];

    for (const file of PUBLIC_SURFACE_FILES) {
      const source = readPublicSurfaceFile(file);

      for (const term of FORBIDDEN_REPLACED_PUBLIC_TERMS) {
        if (source.includes(term)) {
          leaks.push(`${file}: ${term}`);
        }
      }
    }

    expect(leaks).toEqual([]);
  });
});
