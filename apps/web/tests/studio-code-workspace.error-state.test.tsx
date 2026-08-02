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

import StudioCodeWorkspaceClient from "@/app/studio/StudioCodeWorkspaceClient";

describe("studio code workspace error state", () => {
  beforeEach(() => {
    cleanup();
    qrCodeMocks.toDataURL.mockReset();
    qrCodeMocks.toDataURL.mockResolvedValue("data:image/png;base64,should-not-render");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ ok: false, error: "not_found" }),
      }),
    );
  });

  it("keeps a missing code fail-closed and labels the alternate-code field", async () => {
    render(<StudioCodeWorkspaceClient code="missing-code" />);

    expect(
      screen.getByRole("textbox", { name: "Code für eine andere Auswertung" }),
    ).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("nicht verfügbar")).toBeTruthy();
    });

    expect(document.body.textContent).toContain(
      "Zu diesem Code wurde keine freigegebene Beteiligung gefunden.",
    );
    expect(
      screen.getByText("QR-Code ist erst nach erfolgreicher Zielprüfung verfügbar."),
    ).toBeTruthy();
    expect(screen.queryByRole("img", { name: "QR-Code zur direkten Beteiligung" })).toBeNull();
    expect(screen.queryByRole("link", { name: "QR-Code speichern" })).toBeNull();
    expect(qrCodeMocks.toDataURL).not.toHaveBeenCalled();
  });

  it("generates the canonical public QR only after an active code was resolved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          set: { code: "active-code", title: "Aktive Runde", status: "active" },
          totalVotes: 0,
          questions: [],
        }),
      }),
    );

    render(<StudioCodeWorkspaceClient code="active-code" />);

    await waitFor(() => {
      expect(qrCodeMocks.toDataURL).toHaveBeenCalledWith(
        expect.stringMatching(/\/qr\/active-code$/),
        { width: 320, margin: 1, errorCorrectionLevel: "M" },
      );
    });
    expect(await screen.findByRole("img", { name: "QR-Code zur direkten Beteiligung" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "QR-Code speichern" })).toBeTruthy();
  });
});
