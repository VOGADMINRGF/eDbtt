import { YoutubeTranscript } from "youtube-transcript";

export type YoutubeTranscriptFailureReason =
  | "rate_limited"
  | "video_unavailable"
  | "disabled"
  | "language_unavailable"
  | "unavailable"
  | "fetch_failed";

export type YoutubeTranscriptTransportAttempt = {
  language: string;
  endpoint: "innertube_player" | "watch_html" | "caption_timedtext" | "youtube_other";
  method: "GET" | "POST";
  status: number | null;
  redirected: boolean | null;
  responseClass: "json" | "xml" | "html" | "text" | "other" | null;
  errorType: string | null;
  errorCode: string | null;
};

function classifyYoutubeEndpoint(url: URL): YoutubeTranscriptTransportAttempt["endpoint"] {
  if (url.pathname.startsWith("/youtubei/v1/player")) return "innertube_player";
  if (url.pathname === "/watch") return "watch_html";
  if (url.pathname.includes("/api/timedtext")) return "caption_timedtext";
  return "youtube_other";
}

function classifyResponse(contentType: string | null): YoutubeTranscriptTransportAttempt["responseClass"] {
  const normalized = contentType?.toLowerCase() ?? "";
  if (normalized.includes("json")) return "json";
  if (normalized.includes("xml")) return "xml";
  if (normalized.includes("html")) return "html";
  if (normalized.startsWith("text/")) return "text";
  return "other";
}

function safeErrorToken(value: unknown): string | null {
  const token = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 80);
  return token || null;
}

function buildTracedYoutubeFetch(
  language: string,
  attempts: YoutubeTranscriptTransportAttempt[],
): typeof fetch {
  return async (input, init) => {
    let endpoint: YoutubeTranscriptTransportAttempt["endpoint"] = "youtube_other";
    try {
      const rawUrl =
        typeof input === "string" || input instanceof URL ? input.toString() : input.url;
      endpoint = classifyYoutubeEndpoint(new URL(rawUrl));
    } catch {
      // Keep the trace bounded to an endpoint class; never expose an upstream URL.
    }
    const method = String(init?.method ?? "GET").toUpperCase() === "POST" ? "POST" : "GET";
    try {
      const response = await fetch(input, init);
      attempts.push({
        language,
        endpoint,
        method,
        status: response.status,
        redirected: response.redirected,
        responseClass: classifyResponse(response.headers.get("content-type")),
        errorType: null,
        errorCode: null,
      });
      return response;
    } catch (error) {
      const cause =
        error instanceof Error && "cause" in error
          ? (error.cause as { code?: unknown } | null)
          : null;
      attempts.push({
        language,
        endpoint,
        method,
        status: null,
        redirected: null,
        responseClass: null,
        errorType: safeErrorToken(error instanceof Error ? error.name : typeof error),
        errorCode: safeErrorToken(cause?.code),
      });
      throw error;
    }
  };
}

function classifyTranscriptFailure(
  error: unknown,
): YoutubeTranscriptFailureReason {
  if (!(error instanceof Error)) return "fetch_failed";
  const errorType = `${error.name} ${error.constructor.name}`;
  if (errorType.includes("TooManyRequest")) return "rate_limited";
  if (errorType.includes("VideoUnavailable")) return "video_unavailable";
  if (errorType.includes("Disabled")) return "disabled";
  if (errorType.includes("NotAvailableLanguage")) return "language_unavailable";
  if (errorType.includes("NotAvailable")) return "unavailable";
  return "fetch_failed";
}

export function getYoutubeId(urlOrId: string) {
  const m = urlOrId.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : urlOrId;
}

export async function fetchYoutubeTranscript(
  urlOrId: string,
  langs = ["de", "en"],
) {
  const id = getYoutubeId(urlOrId);
  const failures: YoutubeTranscriptFailureReason[] = [];
  const transportAttempts: YoutubeTranscriptTransportAttempt[] = [];
  for (const lang of langs) {
    try {
      const parts = await YoutubeTranscript.fetchTranscript(id, {
        lang,
        fetch: buildTracedYoutubeFetch(lang, transportAttempts),
      });
      const text = parts.map((part) => part.text).join(" ");
      return {
        id,
        lang,
        text,
        segmentCount: parts.length,
        failureReason: null,
        transportAttempts,
      };
    } catch (error) {
      failures.push(classifyTranscriptFailure(error));
    }
  }
  const failureReason = failures.includes("rate_limited")
    ? "rate_limited"
    : failures.at(-1) ?? "fetch_failed";
  return {
    id,
    lang: null,
    text: "",
    segmentCount: 0,
    failureReason,
    transportAttempts,
  };
}

export async function bundleYoutubeSources(urls: string[], maxChars = 12000) {
  const arr = await Promise.all(urls.map((url) => fetchYoutubeTranscript(url)));
  const blocks = arr.filter((source) => source.text).map((source) =>
    `### YouTube ${source.id} (${source.lang ?? "?"})\n${source.text}`
  );
  const joined = blocks.join("\n\n");
  return joined.length > maxChars ? joined.slice(0, maxChars) + "\n…[clipped]" : joined;
}
