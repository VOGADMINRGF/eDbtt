import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(`redirect:${href}`);
  },
}));

import QRScanPage from "@/app/qr/[qrId]/page";

describe("live qr entry contract", () => {
  it("redirects the legacy /qr entry exactly once into the canonical /qr-studio entry", async () => {
    await expect(
      QRScanPage({
        params: Promise.resolve({ qrId: "pflege-berlin" }),
      }),
    ).rejects.toThrow("redirect:/qr-studio?code=pflege-berlin");
  });

  it("keeps the legacy redirect relative and same-origin", async () => {
    await expect(
      QRScanPage({
        params: Promise.resolve({ qrId: "session-berlin-01" }),
      }),
    ).rejects.toThrow("redirect:/qr-studio?code=session-berlin-01");
  });
});
