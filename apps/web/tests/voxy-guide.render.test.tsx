import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, fill: _fill, onError: _onError, priority: _priority, ...rest } = props;
    return <img alt={typeof alt === "string" ? alt : ""} {...rest} />;
  },
}));

import VoxyGuide from "@/components/voxy/VoxyGuide";

describe("VoxyGuide render contract", () => {
  it("renders with the neutral variant and panel appearance by default", () => {
    const html = renderToStaticMarkup(
      <VoxyGuide title="Voxy Hinweis">
        <p>Neutraler Hinweis.</p>
      </VoxyGuide>,
    );

    expect(html).toContain('data-voxy-appearance="panel"');
    expect(html).toContain('data-voxy-variant="neutral"');
    expect(html).toContain('src="/brand/voxy/voxy-neutral.webp"');
    expect(html).toContain('alt="Voxy als ruhiger Guide"');
    expect(html).toContain("Neutraler Hinweis.");
  });

  it("falls back to neutral when the variant is unknown", () => {
    const html = renderToStaticMarkup(
      <VoxyGuide title="Fallback" variant={"unknown-variant"}>
        <p>Fallback-Hinweis.</p>
      </VoxyGuide>,
    );

    expect(html).toContain('data-voxy-variant="neutral"');
    expect(html).toContain('src="/brand/voxy/voxy-neutral.webp"');
    expect(html).toContain('alt="Voxy als ruhiger Guide"');
    expect(html).toContain("Fallback-Hinweis.");
  });

  it("supports hero appearance for prominent guide placements", () => {
    const html = renderToStaticMarkup(
      <VoxyGuide appearance="hero" title="Voxy begleitet" variant="welcome">
        <p>Sichtbarer Guide.</p>
      </VoxyGuide>,
    );

    expect(html).toContain('data-voxy-appearance="hero"');
    expect(html).toContain('data-voxy-variant="welcome"');
    expect(html).toContain("Sichtbarer Guide.");
  });

  it("keeps voxy guide token-based without hardcoded dark-only surface classes", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/voxy/VoxyGuide.tsx"), "utf8");

    expect(source).toContain("rgb(var(--bg))");
    expect(source).toContain("rgb(var(--card))");
    expect(source).toContain("rgb(var(--fg))");
    expect(source).toContain("rgb(var(--muted))");
    expect(source).toContain("rgb(var(--border))");
    expect(source).not.toContain("bg-slate-");
    expect(source).not.toContain("dark:bg-");
  });
});
