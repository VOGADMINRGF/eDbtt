import { YoutubeTranscript } from "youtube-transcript";

export type YoutubeTranscriptFailureReason =
  | "rate_limited"
  | "video_unavailable"
  | "disabled"
  | "language_unavailable"
  | "unavailable"
  | "runtime_incompatible"
  | "fetch_failed";

export type YoutubeTranscriptTransportAttempt = {
  language: string;
  endpoint: "innertube_player" | "watch_html" | "caption_timedtext" | "youtube_other";
  method: "GET" | "POST";
  status: number | null;
  redirected: boolean | null;
  responseClass: "json" | "xml" | "html" | "text" | "other" | null;
  payloadClass:
    | "captions_present"
    | "player_without_captions"
    | "watch_with_captions"
    | "watch_without_captions"
    | "consent_interstitial"
    | "recaptcha"
    | "challenge"
    | "invalid_payload"
    | "not_inspected";
  upstreamState: string | null;
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

async function classifyYoutubePayload(
  endpoint: YoutubeTranscriptTransportAttempt["endpoint"],
  response: Response,
): Promise<Pick<YoutubeTranscriptTransportAttempt, "payloadClass" | "upstreamState">> {
  try {
    if (endpoint === "innertube_player") {
      const data = (await response.clone().json()) as {
        captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: unknown[] } };
        playabilityStatus?: { status?: unknown };
      };
      const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      return {
        payloadClass:
          Array.isArray(captionTracks) && captionTracks.length > 0
            ? "captions_present"
            : "player_without_captions",
        upstreamState: safeErrorToken(data.playabilityStatus?.status),
      };
    }
    if (endpoint === "watch_html") {
      const html = await response.clone().text();
      if (/class=["']g-recaptcha|recaptcha/i.test(html)) {
        return { payloadClass: "recaptcha", upstreamState: null };
      }
      if (/consent\.youtube\.com|consent\.google\.com|consent-bump/i.test(html)) {
        return { payloadClass: "consent_interstitial", upstreamState: null };
      }
      if (/unusual traffic|automated quer(?:y|ies)|botguard|challenge/i.test(html)) {
        return { payloadClass: "challenge", upstreamState: null };
      }
      const status = html.match(
        /"playabilityStatus"\s*:\s*\{\s*"status"\s*:\s*"([A-Z_]+)"/,
      )?.[1];
      return {
        payloadClass: html.includes('"captionTracks":')
          ? "watch_with_captions"
          : "watch_without_captions",
        upstreamState: safeErrorToken(status),
      };
    }
  } catch {
    return { payloadClass: "invalid_payload", upstreamState: null };
  }
  return { payloadClass: "not_inspected", upstreamState: null };
}

function isRuntimeIncompatibleTrace(
  failures: YoutubeTranscriptFailureReason[],
  attempts: YoutubeTranscriptTransportAttempt[],
): boolean {
  if (failures.length === 0 || failures.some((failure) => failure !== "fetch_failed")) {
    return false;
  }
  return (
    attempts.some(
      (attempt) =>
        attempt.endpoint === "innertube_player" &&
        attempt.status === 200 &&
        attempt.payloadClass === "player_without_captions",
    ) &&
    attempts.some(
      (attempt) =>
        attempt.endpoint === "watch_html" &&
        attempt.status === 200 &&
        attempt.payloadClass !== "watch_with_captions",
    ) &&
    !attempts.some((attempt) => attempt.endpoint === "caption_timedtext")
  );
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
      const payload = await classifyYoutubePayload(endpoint, response);
      attempts.push({
        language,
        endpoint,
        method,
        status: response.status,
        redirected: response.redirected,
        responseClass: classifyResponse(response.headers.get("content-type")),
        ...payload,
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
        payloadClass: "not_inspected",
        upstreamState: null,
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
  const failureReason = isRuntimeIncompatibleTrace(failures, transportAttempts)
    ? "runtime_incompatible"
    : failures.includes("rate_limited")
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
