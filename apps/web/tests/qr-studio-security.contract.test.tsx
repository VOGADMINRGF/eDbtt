import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import QrStudioPage from "@/app/qr-studio/page";
import RundenShareActions from "@/app/runden/RundenShareActions";
import {
  buildQrStudioTargetHref,
  validateQrTarget,
} from "@/features/qr/security";

describe("qr studio security contract", () => {
  it("allows a safe internal relative path", () => {
    const result = validateQrTarget("/round/mobilitaet?anlassraumId=65f000000000000000000401");
    expect(result.ok).toBe(true);
  });

  it("allows an explicitly allowlisted HTTPS target", () => {
    const result = validateQrTarget("https://www.edebatte.org/stream/stadtwerke-live-berlin");
    expect(result.ok).toBe(true);
  });

  it("blocks javascript urls", () => {
    expect(validateQrTarget("javascript:alert(1)").ok).toBe(false);
  });

  it("blocks data urls", () => {
    expect(validateQrTarget("data:text/html,boom").ok).toBe(false);
  });

  it("blocks protocol-relative urls", () => {
    expect(validateQrTarget("//evil.example/redirect").ok).toBe(false);
  });

  it("blocks urls with embedded credentials", () => {
    expect(validateQrTarget("https://user:pass@www.edebatte.org/stream/demo").ok).toBe(false);
  });

  it("blocks foreign hosts", () => {
    expect(validateQrTarget("https://evil.example/stream/demo").ok).toBe(false);
  });

  it("blocks double-encoded redirect tricks", () => {
    expect(validateQrTarget("%2F%2Fevil.example%2Fjump").ok).toBe(false);
  });

  it("blocks token parameters", () => {
    expect(validateQrTarget("/account?token=secret").ok).toBe(false);
  });

  it("blocks password parameters", () => {
    expect(validateQrTarget("/login?password=hunter2").ok).toBe(false);
  });

  it("renders the canonical /qr-studio entry for code-based qr flows", async () => {
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

    const tree = await QrStudioPage({
      searchParams: Promise.resolve({ code: "pflege-berlin" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="qr-campaign-landing"');
    expect(html).toContain("Pflege vor Ort 2026");
    expect(html).toContain("Live-Einstieg öffnen");
  });

  it("fails closed for invalid targets and does not render an opening CTA", async () => {
    const tree = await QrStudioPage({
      searchParams: Promise.resolve({ target: "javascript:alert(1)" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="qr-target-invalid"');
    expect(html).toContain("QR-Ziel blockiert");
    expect(html).not.toContain("Öffentlichen Pfad öffnen");
  });

  it("keeps the share and print contract intact without starting camera access", () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia },
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    const html = renderToStaticMarkup(
      <RundenShareActions
        share={{
          contextKind: "runde",
          primaryTargetKind: "round_operating_target",
          canonicalTarget: "/round/mobilitaet?anlassraumId=65f000000000000000000401",
          qrTarget:
            buildQrStudioTargetHref(
              "/round/mobilitaet?anlassraumId=65f000000000000000000401",
            ) ?? "/qr-studio",
          shareTitle: "Mobilität Innenstadt",
          sharePrompt: "Laufenden Anlass teilen",
          shareSummary: "Zusammenfassung",
          socialCandidate: false,
          needsReviewBeforeOfficialSocial: true,
        }}
      />,
    );

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(html).toContain("QR drucken");
    expect(html).toContain("Ohne Kamera bleibt der sichere Link sichtbar");
  });
});
