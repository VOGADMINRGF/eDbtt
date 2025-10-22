import { runOpenAI } from "./providers/openai";
import { runAnthropic } from "./providers/anthropic";
import { runMistral } from "./providers/mistral";
import { runGemini } from "./providers/gemini";
import { bundleYoutubeSources } from "./sources/youtube";

export type OrchestratorRun = {
  provider: "openai" | "gemini" | "anthropic" | "mistral";
  ok: boolean;
  text: string;
  ms?: number;
  error?: string;
  skipped?: boolean;
  raw?: any;
};

export async function orchestrateContribution(
  prompt: string,
  opts: { json?: boolean; youtubeUrls?: string[] } = {}
): Promise<{ runs: OrchestratorRun[]; best: OrchestratorRun | null }> {
  const runs: OrchestratorRun[] = [];

  // (1) Quellen vorziehen: YouTube-Transkripte bündeln (vendor-neutral)
  let enrichedPrompt = prompt;
  if (opts.youtubeUrls?.length) {
    const bundle = await bundleYoutubeSources(opts.youtubeUrls);
    if (bundle) {
      enrichedPrompt = `${prompt}\n\n---\nSOURCES (YouTube transcripts)\n${bundle}`;
    }
  }

  // (2) GPT-first, danach Anthropic/Mistral
  runs.push({ provider: "openai", ...(await runOpenAI(enrichedPrompt, { json: !!opts.json, timeoutMs: 30000 })) });
  runs.push({ provider: "anthropic", ...(await runAnthropic(enrichedPrompt, { json: !!opts.json, timeoutMs: 30000 })) });
  runs.push({ provider: "mistral", ...(await runMistral(enrichedPrompt, { json: !!opts.json, timeoutMs: 30000 })) });

  // (3) Gemini (Textpfad) – profitiert ebenfalls vom angereicherten Prompt
  if (process.env.GEMINI_API_KEY) {
    runs.push({ provider: "gemini", ...(await runGemini(enrichedPrompt, { json: !!opts.json, timeoutMs: 30000 })) });
  }

  // (4) OPTIONAL: Extra-Run „Gemini Direct YouTube“ (nur wenn URL + Key vorhanden)
  if (process.env.GEMINI_API_KEY && opts.youtubeUrls?.[0]) {
    const directPrompt =
      "Analysiere das Video: extrahiere Kernaussagen mit Zeitstempeln, prüfe Quellenbehauptungen, markiere offene Fragen.";
    const r = await runGemini(directPrompt, { youtubeUrl: opts.youtubeUrls[0], timeoutMs: 45000 });
    runs.push({ provider: "gemini", ...r }); // raw.mode === 'video' kannst du in runGemini setzen, wenn du magst
  }

  const success = runs.find((r) => r.ok && r.text);
  const best = success || runs.sort((a, b) => (b.text?.length || 0) - (a.text?.length || 0))[0] || null;

  return { runs, best };
}
