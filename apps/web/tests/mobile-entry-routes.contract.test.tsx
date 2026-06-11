import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

vi.mock("@/context/LocaleContext", () => ({
  useLocale: () => ({ locale: "de" }),
}));

vi.mock("@/components/landing/ExamplesMarqueeRows", () => ({
  ExamplesMarqueeRows: () => <div>ExamplesMarqueeRows</div>,
}));

vi.mock("@/components/quickActions/TaskFirstQuickActionCenter", () => ({
  default: () => <div>TaskFirstQuickActionCenter</div>,
}));

import LandingStart from "@/app/start/LandingStart";
import { classifyMobileAppShellPath } from "@/features/wrapper/mobileAppShellContract";

describe("mobile entry routes contract", () => {
  const startPageSource = readFileSync(resolve(process.cwd(), "src/app/start/page.tsx"), "utf8");
  const globalStylesSource = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

  it("keeps start, swipes, event, dossier and QR entry inside the mobile core shell", () => {
    expect(classifyMobileAppShellPath("/start")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/swipes")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/runden")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/anlassraum")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/dossier")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/dossier/dossier-123")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/stream")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/stream/event-berlin")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/qr/event-berlin")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/live/demo-pflege-vor-ort")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/live/demo-pflege-vor-ort/host")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
  });

  it("keeps /start as a mobile-first citizen entry without demo dossier fallback", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={[]} />);

    expect(html).toContain('data-testid="start-create-light-entry"');
    expect(html).toContain("Beitrag eingeben");
    expect(html).toContain("Beispiele zum Ausprobieren");
    expect(html).toContain('href="/dossier"');
    expect(html).not.toContain('href="/dossier/demo"');
  });

  it("keeps the start shell on stable mobile viewport units instead of hard h-screen constraints", () => {
    expect(startPageSource).toContain('className="min-h-[100svh]"');
    expect(startPageSource).not.toContain("min-h-screen");
    expect(globalStylesSource).toContain("min-height: 100svh;");
    expect(globalStylesSource).toContain("overscroll-behavior-y: contain;");
  });

  it("reserves space for the voxy guide artwork so the hero does not jump on load", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={[]} />);

    expect(html).toContain('data-voxy-avatar=""');
    expect(html).toContain("aspect-ratio:");
  });
});
