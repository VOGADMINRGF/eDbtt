import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import SharedCreateComposer from "@/features/create/SharedCreateComposer";
import { getCreateComposerTexts, getCreateSurfaceModeDefinitions } from "@/features/create/createSurfaceConfig";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

function renderHeadline(locale: "de" | "en") {
  const modeDefinitions = getCreateSurfaceModeDefinitions(locale);
  return renderToStaticMarkup(
    <SharedCreateComposer
      badge="entry"
      subline="subline"
      texts={getCreateComposerTexts(locale)}
      modeOrder={["analyze", "media", "guided"]}
      modeDefinitions={modeDefinitions}
      activeMode="analyze"
      onModeChange={() => {}}
      helperText={modeDefinitions.analyze.helperText}
      inputId="entry"
      inputValue=""
      inputPlaceholder={modeDefinitions.analyze.placeholder}
      onInputChange={() => {}}
      onStart={() => {}}
      startLabel={modeDefinitions.analyze.ctaLabel}
      secondaryAction={{ href: "/runden", label: "Open" }}
      contextAnchors={[]}
      activeContextAnchorId={null}
      onContextAnchorSelect={() => {}}
      helperLinks={[]}
    />, 
  );
}

describe("gradient headline i18n render", () => {
  it("renders DE gradient-target words", () => {
    const html = renderHeadline("de");
    expect(html).toContain("Beschreibe,");
    expect(html).toContain("was geklärt werden soll");
  });

  it("renders EN gradient-target words", () => {
    const html = renderHeadline("en");
    expect(html).toContain("opinion");
    expect(html).toContain("voice");
    expect(html).toContain("weight");
  });
});
