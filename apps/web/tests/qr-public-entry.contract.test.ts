import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

import QrCodeGeneratorPage from "@/app/qrcodegenerator/page";
import QrCodeWizardPage from "@/app/qrcodewizard/page";
import {
  buildQrStudioEntryHref,
  buildQrStudioRuntimeTargetHref,
  validateQrPublicEntryTarget,
} from "@features/qr";

describe("qr public entry contract", () => {
  it("accepts internal public targets and resolves them against the active origin", () => {
    const target = validateQrPublicEntryTarget("/topic/verkehr?modus=karte");

    expect(target).toEqual({
      kind: "internal",
      target: "/topic/verkehr?modus=karte",
    });
    expect(buildQrStudioRuntimeTargetHref(target!, "https://edebatte.org")).toBe(
      "https://edebatte.org/topic/verkehr?modus=karte",
    );
  });

  it("accepts https targets unchanged", () => {
    const target = validateQrPublicEntryTarget("https://example.org/aktion?ref=qr");

    expect(target).toEqual({
      kind: "external_https",
      target: "https://example.org/aktion?ref=qr",
    });
    expect(buildQrStudioRuntimeTargetHref(target!, "https://edebatte.org")).toBe(
      "https://example.org/aktion?ref=qr",
    );
  });

  it("rejects dangerous and malformed target schemes", () => {
    expect(validateQrPublicEntryTarget("javascript:alert(1)")).toBeNull();
    expect(validateQrPublicEntryTarget("data:text/html;base64,SGVsbG8=")).toBeNull();
    expect(validateQrPublicEntryTarget("http://example.org/offen")).toBeNull();
    expect(validateQrPublicEntryTarget("//evil.example/path")).toBeNull();
    expect(validateQrPublicEntryTarget("topic/verkehr")).toBeNull();
  });

  it("encodes validated targets for the canonical studio entry", () => {
    expect(
      buildQrStudioEntryHref({
        target: "/topic/verkehr?modus=karte&tag=bus",
      }),
    ).toBe("/qr-studio?target=%2Ftopic%2Fverkehr%3Fmodus%3Dkarte%26tag%3Dbus");
  });

  it("redirects qrcodegenerator to qr-studio with a validated internal target", async () => {
    await expect(
      QrCodeGeneratorPage({
        searchParams: {
          target: "/topic/verkehr?modus=karte",
        },
      }),
    ).rejects.toThrow(
      "REDIRECT:/qr-studio?target=%2Ftopic%2Fverkehr%3Fmodus%3Dkarte&source=qrcodegenerator",
    );
  });

  it("redirects qrcodegenerator to qr-studio with a validated https target", async () => {
    await expect(
      QrCodeGeneratorPage({
        searchParams: {
          target: "https://example.org/aktion?ref=qr",
        },
      }),
    ).rejects.toThrow(
      "REDIRECT:/qr-studio?target=https%3A%2F%2Fexample.org%2Faktion%3Fref%3Dqr&source=qrcodegenerator",
    );
  });

  it("redirects invalid qrcodegenerator targets to the canonical error state", async () => {
    await expect(
      QrCodeGeneratorPage({
        searchParams: {
          target: "javascript:alert(1)",
        },
      }),
    ).rejects.toThrow("REDIRECT:/qr-studio?source=qrcodegenerator&invalidTarget=1");
  });

  it("redirects qrcodewizard to the canonical studio and preserves safe targets", async () => {
    await expect(
      QrCodeWizardPage({
        searchParams: {
          target: "/dossier/dossier-123",
        },
      }),
    ).rejects.toThrow(
      "REDIRECT:/qr-studio?target=%2Fdossier%2Fdossier-123&source=qrcodewizard",
    );
  });
});
