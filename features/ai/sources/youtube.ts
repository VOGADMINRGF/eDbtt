import { YoutubeTranscript } from "youtube-transcript";

export function getYoutubeId(urlOrId: string) {
  const m = urlOrId.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : urlOrId;
}

export async function fetchYoutubeTranscript(urlOrId: string, langs = ["de","en"]) {
  const id = getYoutubeId(urlOrId);
  for (const lang of langs) {
    try {
      const parts = await YoutubeTranscript.fetchTranscript(id, { lang });
      const text = parts.map(p => p.text).join(" ");
      return { id, lang, text };
    } catch {/* try next lang */}
  }
  return { id, lang: null, text: "" };
}

export async function bundleYoutubeSources(urls: string[], maxChars = 12000) {
  const arr = await Promise.all(urls.map(u => fetchYoutubeTranscript(u)));
  const blocks = arr.filter(x => x.text).map(x =>
    `### YouTube ${x.id} (${x.lang ?? "?"})\n${x.text}`
  );
  const joined = blocks.join("\n\n");
  return joined.length > maxChars ? joined.slice(0, maxChars) + "\n…[clipped]" : joined;
}
