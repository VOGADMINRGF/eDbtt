import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StudioPage from "@/app/studio/page";
import LegacyQrStudioPage from "@/app/qr-studio/page";
import PublicQrEntryPage from "@/app/qr/[qrId]/page";
import RundenShareActions from "@/app/runden/RundenShareActions";
import {
  buildPublicQrTargetHref,
  buildStudioCodeHref,
  buildStudioTargetHref,
  validateQrTarget,
} from "@/features/qr/security";

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(`redirect:${href}`);
  },
}));

describe("studio and qr security contract", () => {
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

  it("separates operator studio links from direct public qr links", () => {
    expect(buildStudioCodeHref("pflege-berlin")).toBe("/studio?code=pflege-berlin");
    expect(buildStudioTargetHref("/runden/demo")).toBe(
      "/studio?target=%2Frunden%2Fdemo",
    );
    expect(buildPublicQrTargetHref("/runden/demo")).toBe("/runden/demo");
  });

  it("renders the canonical studio operator workspace for code-based flows", async () => {
    const tree = await StudioPage({
      searchParams: Promise.resolve({ code: "pflege-berlin" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Studio · verteilen, einladen und live begleiten");
    expect(html).toContain("Code: pflege-berlin");
    expect(html).toContain("Direkt teilnehmen – ohne zweite Eingabe");
    expect(html).toContain("/qr/[code]");
  });

  it("keeps /qr/[code] as the direct public participation entry", async () => {
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
    expect(html).toContain("Live-Einstieg öffnen");
  });

  it("preserves the existing statement, contribution and stream qr handoffs", async () => {
    for (const [targetType, targetId, expectedHref] of [
      ["statement", "statement-1", "/statements/statement-1"],
      ["contribution", "contribution-1", "/contribute?source=qr&target=contribution-1"],
      ["stream", "stream-1", "/stream/stream-1"],
    ] as const) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          json: async () => ({
            success: true,
            data: {
              targetType,
              targetIds: [targetId],
            },
          }),
        }),
      );

      await expect(
        PublicQrEntryPage({
          params: Promise.resolve({ qrId: `code-${targetType}` }),
        }),
      ).rejects.toThrow(`redirect:${expectedHref}`);
    }
  });

  it("redirects the former qr-studio route into the canonical studio", async () => {
    await expect(
      LegacyQrStudioPage({
        searchParams: Promise.resolve({
          code: "pflege-berlin",
          caller: "organization_dashboard",
        }),
      }),
    ).rejects.toThrow(
      "redirect:/studio?code=pflege-berlin&caller=organization_dashboard",
    );
  });

  it("fails closed for invalid studio targets and does not render an opening CTA", async () => {
    const tree = await StudioPage({
      searchParams: Promise.resolve({ target: "javascript:alert(1)" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="qr-target-invalid"');
    expect(html).toContain("Ziel wurde blockiert");
    expect(html).not.toContain("Ziel testen");
  });

  it("keeps caller context and public qr preview on valid studio targets", async () => {
    const tree = await StudioPage({
      searchParams: Promise.resolve({
        target: "/dossier/demo-1?view=public",
        caller: "content_release_workbench",
      }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-testid="qr-target-gateway"');
    expect(html).toContain('data-testid="studio-target-workspace"');
    expect(html).toContain('data-testid="qr-studio-target-preview"');
    expect(html).toContain("Aufrufer: Review-to-Publish Workspace");
    expect(html).toContain("Ziel testen");
    expect(html).toContain("keine erneute Inhaltseingabe");
  });

  it("keeps the share and print contract direct without starting camera access", () => {
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
            buildPublicQrTargetHref(
              "/round/mobilitaet?anlassraumId=65f000000000000000000401",
            ) ?? "/runden",
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
    expect(html).toContain("/round/mobilitaet");
  });
});
