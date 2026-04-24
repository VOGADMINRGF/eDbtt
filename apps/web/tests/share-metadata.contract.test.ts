import { describe, expect, it } from "vitest";

import { buildShareMetadata } from "@/features/share/metadata";

describe("share metadata contract", () => {
  it("builds canonical and og fallback for local paths", () => {
    const metadata = buildShareMetadata({
      objectType: "dossier",
      pathOrUrl: "/dossier/demo-1",
      title: "Dossier Demo",
    });

    expect(metadata.alternates?.canonical).toBe("/dossier/demo-1");
    expect(metadata.openGraph?.url).toBe("https://edebatte.org/dossier/demo-1");
    expect(metadata.openGraph?.title).toBe("Dossier Demo");
    expect(metadata.twitter?.card).toBe("summary");
  });

  it("keeps absolute URLs and supports image-based cards", () => {
    const metadata = buildShareMetadata({
      objectType: "factcheck",
      pathOrUrl: "https://edebatte.org/factcheck/job_42",
      title: "Factcheck 42",
      description: "Prüfstatus und Evidenzbezug.",
      imageUrl: "https://edebatte.org/og/factcheck-42.png",
      ogType: "article",
    });

    expect(metadata.alternates?.canonical).toBe("/factcheck/job_42");
    expect(metadata.openGraph?.url).toBe("https://edebatte.org/factcheck/job_42");
    expect(metadata.openGraph?.images?.[0]?.url).toBe("https://edebatte.org/og/factcheck-42.png");
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("falls back to object-type description when description is empty", () => {
    const metadata = buildShareMetadata({
      objectType: "stream",
      pathOrUrl: "/stream/demo",
      title: "Stream Demo",
      description: "   ",
    });

    expect(metadata.description).toContain("Stream-Kontext");
  });
});
