import { fetchYoutubeTranscript } from "../sources/youtube";
import type { PipelineCtx, SendFn } from "../types";

export async function step_fetch_youtube(ctx: PipelineCtx, send: SendFn, url: string){
  const t = await fetchYoutubeTranscript(url);
  ctx.data.sources = ctx.data.sources || [];
  ctx.data.sources.push({
    kind: "youtube", url, videoId: t.id, transcript: t.text, lang: t.lang, fetchedAt: new Date().toISOString()
  });
  send("source", { kind: "youtube", url, videoId: t.id, hasTranscript: !!t.text });
}
