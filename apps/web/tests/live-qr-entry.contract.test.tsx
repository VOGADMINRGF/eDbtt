import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(`redirect:${href}`);
  },
}));

import PublicQrEntryPage from "@/app/qr/[qrId]/page";

describe("live qr entry contract", () => {
  it("opens a campaign session directly instead of routing through the operator studio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            targetType: "campaign_session",
            targetIds: ["demo-pflege-vor-ort", "session-berlin-01"],
            title: "Pflege vor Ort 2026",
          },
        }),
      }),
    );

    const tree = await PublicQrEntryPage({
      params: Promise.resolve({ qrId: "pflege-berlin" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="qr-campaign-landing"');
    expect(html).toContain("Pflege vor Ort 2026");
    expect(html).toContain('href="/live/demo-pflege-vor-ort?source=qr&amp;session=session-berlin-01"');
    expect(html).not.toContain("/studio?code=");
    expect(html).not.toContain("/qr-studio?code=");
  });

  it("shows the guarded public fallback for unknown qr ids", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ success: false, data: null }),
      }),
    );

    const tree = await PublicQrEntryPage({
      params: Promise.resolve({ qrId: "unknown-live-qr" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("QR-Code nicht verfügbar");
    expect(html).toContain("unknown-live-qr");
    expect(html).toContain('href="/start"');
    expect(html).toContain('href="/stream"');
    expect(html).toContain("kein Auto-Publish");
  });
});
