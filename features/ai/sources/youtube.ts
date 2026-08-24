import { YoutubeTranscript } from "youtube-transcript";

export type YoutubeTranscriptFailureReason =
  | "rate_limited"
  | "video_unavailable"
  | "disabled"
  | "language_unavailable"
  | "unavailable"
  | "fetch_failed";

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
  for (const lang of langs) {
    try {
      const parts = await YoutubeTranscript.fetchTranscript(id, { lang });
      const text = parts.map((part) => part.text).join(" ");
      return { id, lang, text, segmentCount: parts.length, failureReason: null };
    } catch (error) {
      failures.push(classifyTranscriptFailure(error));
    }
  }
  const failureReason = failures.includes("rate_limited")
    ? "rate_limited"
    : failures.at(-1) ?? "fetch_failed";
  return { id, lang: null, text: "", segmentCount: 0, failureReason };
}

export async function bundleYoutubeSources(urls: string[], maxChars = 12000) {
  const arr = await Promise.all(urls.map((url) => fetchYoutubeTranscript(url)));
  const blocks = arr.filter((source) => source.text).map((source) =>
    `### YouTube ${source.id} (${source.lang ?? "?"})\n${source.text}`
  );
  const joined = blocks.join("\n\n");
  return joined.length > maxChars ? joined.slice(0, maxChars) + "\n…[clipped]" : joined;
}
