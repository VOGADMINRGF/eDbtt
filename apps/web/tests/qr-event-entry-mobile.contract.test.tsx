import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@features/user/context/UserContext", () => ({
  default: () => ({
    user: null,
    role: "user",
  }),
}));

vi.mock("@features/stream/components/StreamList", () => ({
  default: ({ statusSections }: { statusSections?: boolean }) => (
    <div data-testid="stream-list" data-status-sections={statusSections ? "enabled" : "disabled"}>
      list
    </div>
  ),
}));

import StreamPage from "@/app/stream/page";
import { QuestionSetClient } from "@/app/qr/[qrId]/QuestionSetClient";

describe("qr event mobile entry contract", () => {
  it("renders the QR entry shell with honest fallback copy and route links", () => {
    const html = renderToStaticMarkup(<QuestionSetClient code="qr-berlin" />);

    expect(html).toContain("QR- und Event-Einstieg");
    expect(html).toContain("Fragen werden geladen");
    expect(html).toContain('href="/runden"');
    expect(html).toContain('href="/stream"');
    expect(html).toContain('href="/dossier"');
    expect(html).toContain("es gibt keine stille Offline-Synchronisation");
  });

  it("keeps stream entry mobile-first with honest offline and follow-up hints", () => {
    const html = renderToStaticMarkup(<StreamPage />);

    expect(html).toContain("Event- und QR-Einstieg mobil");
    expect(html).toContain("Fällt die Verbindung aus");
    expect(html).toContain('href="/runden"');
    expect(html).toContain('href="/swipes"');
    expect(html).toContain('href="/dossier"');
    expect(html).toContain("Öffentliche Hinweise bleiben reviewpflichtig.");
  });
});
