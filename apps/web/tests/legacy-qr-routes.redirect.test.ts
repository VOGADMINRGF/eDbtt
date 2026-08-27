import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(`redirect:${href}`);
  },
}));

import QrCodeGeneratorRedirectPage from "@/app/qrcodegenerator/page";
import QrCodeWizardRedirectPage from "@/app/qrcodewizard/page";

describe("legacy qr route redirects", () => {
  it("redirects the legacy generator onto the canonical studio target path", async () => {
    await expect(
      QrCodeGeneratorRedirectPage({
        searchParams: Promise.resolve({
          target: "/dossier/demo-1?view=public",
        }),
      }),
    ).rejects.toThrow(
      "redirect:/studio?caller=legacy_qrcodegenerator&target=%2Fdossier%2Fdemo-1%3Fview%3Dpublic",
    );
  });

  it("blocks unsafe legacy generator targets before redirecting", async () => {
    await expect(
      QrCodeGeneratorRedirectPage({
        searchParams: Promise.resolve({
          target: "data:text/html;base64,WA==",
        }),
      }),
    ).rejects.toThrow(
      "redirect:/studio?caller=legacy_qrcodegenerator&targetState=blocked",
    );
  });

  it("redirects the legacy wizard to studio without inventing a second flow", async () => {
    await expect(
      QrCodeWizardRedirectPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/studio?caller=legacy_qrcodewizard");
  });
});
