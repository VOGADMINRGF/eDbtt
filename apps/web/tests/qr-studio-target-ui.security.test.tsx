// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const qrCodeMocks = vi.hoisted(() => ({
  toDataURL: vi.fn(),
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: qrCodeMocks.toDataURL,
  },
}));

import StudioPage from "@/app/studio/page";

describe("studio target rejection UI", () => {
  beforeEach(() => {
    cleanup();
    qrCodeMocks.toDataURL.mockReset();
    qrCodeMocks.toDataURL.mockResolvedValue("data:image/png;base64,safe");
  });

  it.each([
    ["raw origin escape", "/\\evil.example"],
    ["encoded backslash", "/%5Cevil.example"],
    ["double encoded backslash", "/%255Cevil.example"],
    ["control-character origin escape", "/\t/evil.example"],
    ["surrounding whitespace", " /dossier/demo "],
    ["malformed encoding", "/%GG"],
    ["nested target", "/safe?target=/dossier/demo"],
  ])(
    "shows a safe blocked state without QR or target test for %s",
    async (_label, rawTarget) => {
      const tree = await StudioPage({
        searchParams: Promise.resolve({ target: rawTarget }),
      });
      render(tree);

      expect(screen.getByTestId("qr-target-invalid")).toBeTruthy();
      expect(screen.queryByTestId("qr-studio-target-preview")).toBeNull();
      expect(
        screen.queryByRole("link", { name: "Ziel testen" }),
      ).toBeNull();
      expect(qrCodeMocks.toDataURL).not.toHaveBeenCalled();
      expect(document.body.textContent).not.toContain(rawTarget);
    },
  );

  it("generates a QR only after the target passed the shared validator", async () => {
    const tree = await StudioPage({
      searchParams: Promise.resolve({
        target: "/dossier/demo-1?view=public#sources",
      }),
    });
    render(tree);

    expect(screen.getByRole("link", { name: "Ziel testen" })).toBeTruthy();
    await waitFor(() => {
      expect(qrCodeMocks.toDataURL).toHaveBeenCalledWith(
        "https://www.edebatte.org/dossier/demo-1?view=public#sources",
        { width: 240, margin: 1 },
      );
    });
  });
});
