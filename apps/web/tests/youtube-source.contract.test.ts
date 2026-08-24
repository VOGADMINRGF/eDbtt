import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchTranscript: vi.fn(),
}));

vi.mock("youtube-transcript", () => ({
  YoutubeTranscript: {
    fetchTranscript: (...args: unknown[]) => mocks.fetchTranscript(...args),
  },
}));

import {
  fetchYoutubeTranscript,
  getYoutubeId,
} from "@features/ai/sources/youtube";

describe("YouTube transcript source contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("extracts the exact preview-smoke video ID and reports grounded segment metadata", async () => {
    mocks.fetchTranscript
      .mockRejectedValueOnce(new Error("de transcript unavailable"))
      .mockResolvedValueOnce([
        { text: "First grounded segment." },
        { text: "Second grounded segment." },
      ]);
    const url = "https://www.youtube.com/watch?v=iWO5N3n1DXU";

    const result = await fetchYoutubeTranscript(url);

    expect(getYoutubeId(url)).toBe("iWO5N3n1DXU");
    expect(mocks.fetchTranscript).toHaveBeenNthCalledWith(
      1,
      "iWO5N3n1DXU",
      { lang: "de" },
    );
    expect(mocks.fetchTranscript).toHaveBeenNthCalledWith(
      2,
      "iWO5N3n1DXU",
      { lang: "en" },
    );
    expect(result).toEqual({
      id: "iWO5N3n1DXU",
      lang: "en",
      text: "First grounded segment. Second grounded segment.",
      segmentCount: 2,
      failureReason: null,
    });
  });

  it("degrades without invented transcript text", async () => {
    mocks.fetchTranscript.mockRejectedValue(new Error("transcript unavailable"));

    await expect(fetchYoutubeTranscript("iWO5N3n1DXU")).resolves.toEqual({
      id: "iWO5N3n1DXU",
      lang: null,
      text: "",
      segmentCount: 0,
      failureReason: "fetch_failed",
    });
  });

  it("reports a safe rate-limit reason without exposing the upstream error", async () => {
    const error = new Error("upstream detail must not leave the adapter");
    error.name = "YoutubeTranscriptTooManyRequestError";
    mocks.fetchTranscript.mockRejectedValue(error);

    await expect(fetchYoutubeTranscript("iWO5N3n1DXU")).resolves.toEqual({
      id: "iWO5N3n1DXU",
      lang: null,
      text: "",
      segmentCount: 0,
      failureReason: "rate_limited",
    });
  });
});
