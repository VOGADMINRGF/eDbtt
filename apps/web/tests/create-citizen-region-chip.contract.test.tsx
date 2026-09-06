import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import SharedCreateComposer from "@/features/create/SharedCreateComposer";
import { resolveCreateCitizenIntakeContext } from "@/features/create/createCitizenIntakeContext";
import {
  getCreateComposerTexts,
  getCreateContextAnchorDefinitions,
  getCreateHelperLinks,
  getCreateSurfaceModeDefinitions,
} from "@/features/create/createSurfaceConfig";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

describe("Create citizen region chip", () => {
  it("shows a profile location only as an editable suggestion in plain citizen language", () => {
    const definitions = getCreateSurfaceModeDefinitions("de");
    const citizenContext = resolveCreateCitizenIntakeContext({
      text: "Mehr sichere Schulwege wären wichtig.",
      profileRegion: "Berlin",
    });
    const html = renderToStaticMarkup(
      <SharedCreateComposer
        badge="Beitragen"
        subline="Ein Satz reicht."
        texts={getCreateComposerTexts("de")}
        modeOrder={["analyze", "media", "guided"]}
        modeDefinitions={definitions}
        activeMode="analyze"
        onModeChange={() => {}}
        helperText={definitions.analyze.helperText}
        inputId="create-primary-intake"
        inputValue="Mehr sichere Schulwege wären wichtig."
        inputPlaceholder="Was sollte sich ändern?"
        onInputChange={() => {}}
        onStart={() => {}}
        startLabel="Einordnen"
        secondaryAction={{ href: "/account", label: "" }}
        contextAnchors={getCreateContextAnchorDefinitions("de")}
        activeContextAnchorId={null}
        onContextAnchorSelect={() => {}}
        helperLinks={getCreateHelperLinks("de")}
        experienceVariant="workspace_shell"
        citizenContext={citizenContext}
      />,
    );

    expect(html).toContain("Berlin · aus Profil vorgeschlagen");
    expect(html).toContain('data-create-region-context="profile_suggestion"');
    expect(html).toContain("Region bearbeiten");
    expect(html).not.toContain("JurisdictionCandidate");
    expect(html).not.toContain("CommunitySignal");
    expect(html).not.toContain("Anlassraum");
  });
});
