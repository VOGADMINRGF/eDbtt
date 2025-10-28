// features/ai/providers/index.ts
export type Opts = {
  timeoutMs?: number;
  maxOutputTokens?: number;
  system?: string;
  json?: boolean;
  forceJsonMode?: boolean;
};

export { callOpenAI } from "./openai";

/** Provider-agnostischer JSON-Caller (aktuell OpenAI, später erweiterbar). */
export async function runLLMJson(prompt: string, opts: Partial<Opts> = {}) {
  const { callOpenAI } = await import("./openai");
  const { text } = await callOpenAI(prompt, { ...opts, forceJsonMode: true });
  return text;
}
