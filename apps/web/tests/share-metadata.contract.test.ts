import { describe, expect, it } from "vitest";

import { buildShareMetadata } from "@/features/share/metadata";
import { resolveSeoImageUrl } from "@/lib/seo/publicDiscovery";

describe("share metadata contract", () => {
  it("builds canonical metadata with the default discovery image for local paths", () => {
    const metadata = buildShareMetadata({
      objectType: "dossier",
      pathOrUrl: "/dossier/demo-1",
      title: "Dossier Demo",
    });

    expect(metadata.alternates?.canonical).toBe("/dossier/demo-1");
    expect(metadata.openGraph?.url).toBe("https://www.edebatte.org/dossier/demo-1");
    expect(metadata.openGraph?.title).toBe("Dossier Demo");
    expect(metadata.openGraph?.locale).toBe("de_DE");
    expect(metadata.openGraph?.images?.[0]?.url).toBe(resolveSeoImageUrl());
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(metadata.twitter?.images?.[0]).toBe(resolveSeoImageUrl());
  });

  it("keeps absolute URLs and supports image-based cards", () => {
    const metadata = buildShareMetadata({
      objectType: "factcheck",
      pathOrUrl: "https://www.edebatte.org/factcheck/job_42",
      title: "Factcheck 42",
      description: "Prüfstatus und Evidenzbezug.",
      imageUrl: "https://www.edebatte.org/og/factcheck-42.png",
      ogType: "article",
    });

    expect(metadata.alternates?.canonical).toBe("/factcheck/job_42");
    expect(metadata.openGraph?.url).toBe("https://www.edebatte.org/factcheck/job_42");
    expect(metadata.openGraph?.images?.[0]?.url).toBe("https://www.edebatte.org/og/factcheck-42.png");
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
