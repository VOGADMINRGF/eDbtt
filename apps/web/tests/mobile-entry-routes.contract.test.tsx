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

import LandingStart from "@/app/start/LandingStart";
import { classifyMobileAppShellPath } from "@/features/wrapper/mobileAppShellContract";

describe("mobile entry routes contract", () => {
  const startPageSource = readFileSync(resolve(process.cwd(), "src/app/start/page.tsx"), "utf8");

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
    expect(classifyMobileAppShellPath("/live/demo-pflege-vor-ort/report")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
    expect(classifyMobileAppShellPath("/live/demo-pflege-vor-ort/media-kit")).toMatchObject({
      shellEnabled: true,
      bottomNavEnabled: true,
      reason: "core",
    });
  });

  it("keeps /start as a mobile-first citizen entry without demo dossier fallback", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={[]} />);

    expect(html).toContain("Abstimmen. Verstehen. Gemeinsam weiterkommen.");
    expect(html).toContain("Direkt ausprobieren");
    expect(html).toContain("Eigene Abstimmung kostenlos starten");
    expect(html).toContain('href="/runden/new?gtm=1&amp;source=homepage"');
    expect(html).not.toContain('href="/dossier/demo"');
  });

  it("keeps the start shell on stable mobile viewport units instead of hard h-screen constraints", () => {
    expect(startPageSource).toContain('className="min-h-[100svh]"');
    expect(startPageSource).not.toContain("min-h-screen");
  });

  it("renders the interactive question before secondary homepage sections", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={[]} />);

    expect(html).toContain('data-home-ballot-source="product-example"');
    expect(html.indexOf("Direkt ausprobieren")).toBeLessThan(html.indexOf("Passt zu eurer Gruppe"));
    expect(html).toContain("min-h-12");
  });
});
