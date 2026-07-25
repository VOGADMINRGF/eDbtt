/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
  }),
  usePathname: () => "/",
}));

import { PrivacyGateProvider } from "@/components/privacy/PrivacyGateProvider";

describe("privacy gate dialog contract", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders an accessible dialog with clear primary actions and unchecked optional consent", async () => {
    render(
      <PrivacyGateProvider initialConsent={null} initiallyOpen>
        <button type="button">Hintergrund-CTA</button>
      </PrivacyGateProvider>,
    );

    act(() => {
      vi.runAllTimers();
    });

    const dialog = screen.getByRole("dialog", {
      name: "Bevor du startest: Datenschutz verständlich erklärt",
    });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-describedby")).toBe("privacy-gate-description");
    expect(screen.getByRole("button", { name: "Nur notwendige Funktionen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Auswahl speichern" })).toBeTruthy();

    const requiredConsent = screen.getByRole("checkbox", {
      name: "Ich habe verstanden, wie eDebatte meine Eingabe für den gewünschten Dienst verarbeitet.",
    }) as HTMLInputElement;
    expect(document.activeElement).toBe(requiredConsent);

    act(() => {
      screen.getByRole("button", { name: "Freiwillige Optionen" }).click();
    });

    const analytics = screen.getByRole("checkbox", {
      name: "Anonyme Nutzungsstatistik erlauben",
    }) as HTMLInputElement;
    const comfort = screen.getByRole("checkbox", {
      name: "Komfortfunktionen erlauben",
    }) as HTMLInputElement;
    const externalMedia = screen.getByRole("checkbox", {
      name: "Externe Medien erst nach Freigabe laden",
    }) as HTMLInputElement;
    const productImprovement = screen.getByRole("checkbox", {
      name: "Produktverbesserung mit anonymisierten Signalen erlauben",
    }) as HTMLInputElement;

    expect(comfort.checked).toBe(false);
    expect(analytics.checked).toBe(false);
    expect(externalMedia.checked).toBe(false);
    expect(productImprovement.checked).toBe(false);
  });

  it("keeps the dialog mobile-bounded, scrollable, sticky and guarded from snippets", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/privacy/PrivacyGateProvider.tsx"), "utf8");
    const layoutSource = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
    const cookieBannerSource = readFileSync(
      resolve(process.cwd(), "src/components/privacy/CookieConsentBanner.tsx"),
      "utf8",
    );

    expect(source).toContain("maxHeight: \"calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 1.5rem)\"");
    expect(source).toContain('paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.75rem)"');
    expect(source).toContain("overflow-y-auto overscroll-contain");
    expect(source).toContain("sticky bottom-0 shrink-0");
    expect(source).toContain('data-nosnippet="true"');
    expect(source).toContain("restoreFocusRef.current.focus()");
    expect(source).toContain('if (event.key === "Escape")');
    expect(source).toContain('if (event.key !== "Tab") return;');
    expect(cookieBannerSource).toContain("return null;");
    expect(layoutSource).toContain("<PrivacyGateProvider initialConsent={initialConsent}>");
    expect(layoutSource).toContain('<main data-site-main="true" className="flex-1">');
    expect(layoutSource).not.toContain("CookieConsentBanner");
    expect(layoutSource).not.toContain("data-nosnippet");
  });

  it("does not auto-block public reading until an active action requests the gate", () => {
    render(
      <PrivacyGateProvider initialConsent={null}>
        <button type="button">Hintergrund-CTA</button>
      </PrivacyGateProvider>,
    );

    expect(screen.getByRole("button", { name: "Hintergrund-CTA" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
