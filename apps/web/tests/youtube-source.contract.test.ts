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
    expect(mocks.fetchTranscript).toHaveBeenNthCalledWith(1, "iWO5N3n1DXU", {
      lang: "de",
      fetch: expect.any(Function),
    });
    expect(mocks.fetchTranscript).toHaveBeenNthCalledWith(
      2,
      "iWO5N3n1DXU",
      { lang: "en", fetch: expect.any(Function) },
    );
    expect(result).toEqual({
      id: "iWO5N3n1DXU",
      lang: "en",
      text: "First grounded segment. Second grounded segment.",
      segmentCount: 2,
      failureReason: null,
      transportAttempts: [],
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
      transportAttempts: [],
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
      transportAttempts: [],
    });
  });

  it("records only bounded transport metadata and never upstream URLs or response bodies", async () => {
    mocks.fetchTranscript.mockImplementationOnce(async (_id, config) => {
      const response = await config.fetch("https://www.youtube.com/youtubei/v1/player?secret=query", {
        method: "POST",
      });
      expect(await response.text()).toContain("upstream body must stay private");
      throw Object.assign(new Error("private upstream failure detail"), {
        cause: { code: "UND_ERR_CONNECT_TIMEOUT" },
      });
    });
    mocks.fetchTranscript.mockRejectedValueOnce(new Error("second language failed"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("unusual traffic; upstream body must stay private", {
          status: 429,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      ),
    );

    const result = await fetchYoutubeTranscript("iWO5N3n1DXU");

    expect(result.transportAttempts).toEqual([
      {
        language: "de",
        endpoint: "innertube_player",
        method: "POST",
        status: 429,
        redirected: false,
        responseClass: "html",
        payloadClass: "invalid_payload",
        upstreamState: null,
        errorType: null,
        errorCode: null,
      },
    ]);
    expect(JSON.stringify(result.transportAttempts)).not.toContain("secret");
    expect(JSON.stringify(result.transportAttempts)).not.toContain("upstream body");
    vi.unstubAllGlobals();
  });

  it("classifies successful-but-captionless serverless responses as runtime incompatible", async () => {
    mocks.fetchTranscript.mockImplementation(async (_id, config) => {
      await config.fetch("https://www.youtube.com/youtubei/v1/player", { method: "POST" });
      await config.fetch("https://www.youtube.com/watch?v=iWO5N3n1DXU");
      throw new Error("bundled adapter failure");
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) =>
        input.includes("youtubei")
          ? new Response(JSON.stringify({ playabilityStatus: { status: "LOGIN_REQUIRED" } }), {
              status: 200,
              headers: { "content-type": "application/json" },
            })
          : new Response("<html><body>Sign in to confirm you are not a bot</body></html>", {
              status: 200,
              headers: { "content-type": "text/html" },
            }),
      ),
    );

    const result = await fetchYoutubeTranscript("iWO5N3n1DXU");

    expect(result.failureReason).toBe("runtime_incompatible");
    expect(result.transportAttempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          endpoint: "innertube_player",
          payloadClass: "player_without_captions",
          upstreamState: "LOGIN_REQUIRED",
        }),
        expect.objectContaining({
          endpoint: "watch_html",
          payloadClass: "watch_without_captions",
        }),
      ]),
    );
    vi.unstubAllGlobals();
  });
});
