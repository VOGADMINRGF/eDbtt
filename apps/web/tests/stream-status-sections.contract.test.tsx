import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StreamList from "@features/stream/components/StreamList";

describe("stream status sections contract", () => {
  it("groups stream items into live, upcoming and replay sections when enabled", () => {
    const html = renderToStaticMarkup(
      <StreamList
        showToolbar={false}
        disableInfiniteScroll
        statusSections
        initialItems={[
          {
            id: "stream-live-1",
            title: "Live-Session",
            status: "Live",
            createdAt: "2026-04-24T10:00:00.000Z",
          },
          {
            id: "stream-upcoming-1",
            title: "Kommende Session",
            status: "Geplant",
            createdAt: "2026-04-25T10:00:00.000Z",
          },
          {
            id: "stream-replay-1",
            title: "Replay-Session",
            status: "Replay",
            createdAt: "2026-04-20T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(html).toContain("Live");
    expect(html).toContain("Kommend");
    expect(html).toContain("Replay &amp; Highlights");
    expect(html).toContain("Live-Session");
    expect(html).toContain("Kommende Session");
    expect(html).toContain("Replay-Session");
  });
});
