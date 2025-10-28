// features/ai/providers/openai.ts
import OpenAI from "openai";

export type Opts = {
  timeoutMs?: number;
  maxOutputTokens?: number;
  system?: string;
  model?: string;
  json?: boolean;          // alias
  forceJsonMode?: boolean; // alias
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOpenAI(prompt: string, opts: Opts = {}) {
  const useJson = opts.forceJsonMode ?? opts.json ?? false;

  const res = await client.chat.completions.create({
    model: opts.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0,
    max_tokens: opts.maxOutputTokens ?? 800,
    messages: [
      ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
      { role: "user" as const, content: prompt },
    ],
    ...(useJson ? { response_format: { type: "json_object" as const } } : {}),
  });

  const text = res.choices?.[0]?.message?.content ?? "";
  return { text, raw: res };
}

// Back-compat für ältere Aufrufe:
export async function runOpenAI(prompt: string, opts: Opts = {}) {
  return callOpenAI(prompt, opts);
}
