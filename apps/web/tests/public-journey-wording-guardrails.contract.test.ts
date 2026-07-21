import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CORE_PUBLIC_JOURNEY_FILES = [
  "src/app/start/LandingStart.tsx",
  "src/app/(components)/SiteHeader.tsx",
  "src/components/mobile/MobileAppShellChrome.tsx",
  "src/app/themen/page.tsx",
  "src/app/swipes/SwipesClient.tsx",
  "src/components/dossier/DossierViewer.tsx",
  "src/app/stream/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/register/identity/page.tsx",
  "src/app/account/page.tsx",
  "src/app/account/AccountClient.tsx",
  "src/app/community/contributions/page.tsx",
  "src/app/kontakt/KontaktForm.tsx",
  "src/features/create/createSurfaceConfig.ts",
] as const;

const PUBLIC_UI_LEGACY_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: "Beteiligungstool", pattern: /\bBeteiligungstool\b/ },
  { label: "Parteienbuch", pattern: /\bParteienbuch\b/ },
  { label: "Lager", pattern: /\bLager\b/ },
  { label: "Eventualitäten", pattern: /\bEventualitäten\b/ },
  { label: "Evidenz", pattern: /\bEvidenz\b/ },
  { label: "Legitimitätsübersicht", pattern: /\bLegitimitätsübersicht\b/ },
  { label: "Einordnungsfluss", pattern: /\bEinordnungsfluss\b/ },
];

describe("public journey wording guardrails", () => {
  it("keeps legacy terms out of core public/member journey UI files", () => {
    const joined = CORE_PUBLIC_JOURNEY_FILES.map((file) =>
      readFileSync(resolve(process.cwd(), file), "utf8"),
    ).join("\n");

    PUBLIC_UI_LEGACY_PATTERNS.forEach(({ label, pattern }) => {
      expect(joined, `legacy public UI wording found: ${label}`).not.toMatch(pattern);
    });
  });
});
