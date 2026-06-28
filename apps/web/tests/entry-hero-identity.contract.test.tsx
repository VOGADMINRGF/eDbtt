import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import EntryHeroHeading from "@/components/surfaces/EntryHeroHeading";
import { resolveSharedEntryHeroIdentity } from "@/features/surfaces/entryHeroIdentity";

describe("entry hero identity contract", () => {
  it("keeps shared headline identity between default and create", () => {
    const landing = resolveSharedEntryHeroIdentity({ locale: "de", surface: "default" });
    const create = resolveSharedEntryHeroIdentity({ locale: "de", surface: "create" });

    expect(landing.headline).toEqual(create.headline);
    expect(landing.subline).not.toBe(create.subline);
  });

  it("renders lively and calm tone with distinct rhythm classes", () => {
    const identity = resolveSharedEntryHeroIdentity({ locale: "de", surface: "create" });

    const livelyHtml = renderToStaticMarkup(
      <EntryHeroHeading
        badge={identity.badge}
        headline={identity.headline}
        subline={identity.subline}
        tone="lively"
      />,
    );
    const calmHtml = renderToStaticMarkup(
      <EntryHeroHeading
        badge={identity.badge}
        headline={identity.headline}
        subline={identity.subline}
        tone="calm"
      />,
    );

    expect(livelyHtml).toContain("text-3xl");
    expect(calmHtml).toContain("text-2xl");
    expect(livelyHtml).toContain("was geklärt werden soll");
    expect(calmHtml).toContain("was geklärt werden soll");
  });
});
