import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

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
  });

  it("keeps /start as a mobile-first citizen entry without demo dossier fallback", () => {
    const html = renderToStaticMarkup(<LandingStart blocks={[]} />);

    expect(html).toContain("Mobil starten");
    expect(html).toContain('href="/swipes"');
    expect(html).toContain('href="/runden"');
    expect(html).toContain('href="/stream"');
    expect(html).toContain('href="/dossier"');
    expect(html).toContain("werden erst mit stabiler Verbindung übertragen");
    expect(html).not.toContain('href="/dossier/demo"');
  });
});
