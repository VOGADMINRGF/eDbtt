import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import AdminEditorialQueuePage from "@/app/admin/editorial/queue/page";
import AdminEditorialPublishedPage from "@/app/admin/editorial/published/page";

describe("admin editorial hubs", () => {
  it("renders the queue with an honest initial loading state", () => {
    const html = renderToStaticMarkup(<AdminEditorialQueuePage />);

    expect(html).toContain("Editorial Queue");
    expect(html).toContain("Editorial-Series-Überblick in der Queue");
    expect(html).toContain("Review-ready ist nicht approved_for_export. approved_for_export ist nicht publish_ready oder published.");
    expect(html).toContain("Kein Auto-Publish, kein Social Posting und kein Scheduling.");
    expect(html).toContain("Lädt Queue...");
  });

  it("renders the published list with an honest initial loading state", () => {
    const html = renderToStaticMarkup(<AdminEditorialPublishedPage />);

    expect(html).toContain("Publiziert");
    expect(html).toContain("Lädt...");
  });
});
