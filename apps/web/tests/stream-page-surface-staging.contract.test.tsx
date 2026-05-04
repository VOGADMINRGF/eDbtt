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

describe("stream page surface staging", () => {
  it("shows calm hints and enforces live/upcoming/replay sectioning", () => {
    const html = renderToStaticMarkup(<StreamPage />);

    expect(html).toContain("Live ansehen ist offen, für Beiträge brauchst du ein Konto.");
    expect(html).toContain("Live-Votes nur mit Verifizierung.");
    expect(html).toContain("Live");
    expect(html).toContain("Kommend");
    expect(html).toContain("Replay");
    expect(html).toContain("Themen folgen");
    expect(html).toContain("Aktuell läuft keine Live-Runde?");
    expect(html).toContain("overflow-x-clip");
    expect(html).toContain("min-w-0 overflow-hidden");
    expect(html).toContain("data-status-sections=\"enabled\"");
    expect(html).not.toContain("Abstimmungen erfordern Verifizierung");
  });
});
