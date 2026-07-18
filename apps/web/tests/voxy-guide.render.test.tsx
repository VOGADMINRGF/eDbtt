import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  VOXY_PUBLIC_ROUTE_ASSETS,
  resolveVoxyAsset,
  resolveVoxyPublicRouteVariant,
} from "@/features/voxy/voxyAssets";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, fill: _fill, onError: _onError, priority: _priority, ...rest } = props;
    return <img alt={typeof alt === "string" ? alt : ""} {...rest} />;
  },
}));

import VoxyGuide from "@/components/voxy/VoxyGuide";

describe("VoxyGuide render contract", () => {
  it("keeps explicit public light and dark route mappings", () => {
    expect(VOXY_PUBLIC_ROUTE_ASSETS.startLight).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.startDark).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.createLight).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.createDark).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.dossierLight).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.dossierDark).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.rundenLight).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.rundenDark).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.swipesLight).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.swipesDark).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.miniLight).toBeTruthy();
    expect(VOXY_PUBLIC_ROUTE_ASSETS.miniDark).toBeTruthy();
  });

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

    expect(source).toContain("VOXY_EXPERIENCE_LAYOUT_GUARD");
    expect(source).toContain("public-voxy-stage");
    expect(source).toContain("public-voxy-image");
    expect(source).toContain("public-voxy-aura");
    expect(source).toContain("avatarContainerClassName");
    expect(source).toContain("safeHeightClassName");
    expect(source).toContain("rgb(var(--fg))");
    expect(source).toContain("rgb(var(--muted))");
    expect(source).not.toContain("bg-slate-");
    expect(source).not.toContain("dark:bg-");
    expect(source).not.toContain("shadow-");
    expect(source).not.toContain("bg-white");
  });

  it("keeps the create workspace on the canonical presenting asset instead of thumbnail guides", () => {
    const shellSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateWorkspaceShell.tsx"),
      "utf8",
    );
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const presentingAsset = resolveVoxyAsset("presenting");

    expect(resolveVoxyPublicRouteVariant("createLight")).toBe("presenting");
    expect(presentingAsset.png).toBe("/brand/voxy/voxy-presenting.png");
    expect(presentingAsset.webp).toBe("/brand/voxy/voxy-presenting.webp");

    expect(shellSource).toContain('variant="presenting"');
    expect(clientSource).toContain('variant="presenting"');
    expect(followupSource).toContain('variant="presenting"');

    expect(shellSource).not.toContain('variant="createGuideLight"');
    expect(clientSource).not.toContain('variant="createGuideLight"');
    expect(followupSource).not.toContain('variant="createGuideLight"');
  });

  it("keeps create avatars on the canonical high-resolution asset with contain sizing", () => {
    const guideSource = readFileSync(resolve(process.cwd(), "src/components/voxy/VoxyGuide.tsx"), "utf8");
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const shellSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateWorkspaceShell.tsx"),
      "utf8",
    );

    expect(guideSource).toContain("object-contain");
    expect(guideSource).toContain("sizes={");
    expect(guideSource).not.toContain("object-cover");

    expect(clientSource).toContain('variant="presenting"');
    expect(shellSource).toContain('variant="presenting"');
    expect(followupSource).toContain('variant="presenting"');

    expect(clientSource).not.toContain('variant="miniAvatar"');
    expect(shellSource).not.toContain('variant="miniAvatar"');
    expect(followupSource).not.toContain('variant="miniAvatar"');
    expect(clientSource).not.toContain('variant="createGuideDark"');
    expect(shellSource).not.toContain('variant="createGuideDark"');
    expect(followupSource).not.toContain('variant="createGuideDark"');
  });
});
