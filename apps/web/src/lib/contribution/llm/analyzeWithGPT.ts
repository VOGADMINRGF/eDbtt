import { env } from "@/utils/env";
// apps/web/src/lib/contribution/llm/analyzeWithGPT.ts
import { LLMAnalysisZ, type LLMAnalysis } from "@/lib/contribution/schema";

function withTimeout<T>(p: Promise<T>, ms: number) {
  let t: NodeJS.Timeout;
  const killer = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error("timeout")), ms);
  });
  return Promise.race([p, killer]).finally(() => clearTimeout(t!));
}

export async function analyzeWithGPT(input: {
  text: string;
  userRegion?: string;
  userInterests?: string[];
  userRoles?: string[];
}): Promise<LLMAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const sys =
    "You are an expert civic-tech analyzer. Return ONLY valid JSON in German keys. " +
    "Schema: { region?: string|null, topics: [{name:string, confidence:number}], " +
    "statements:[{text:string,type:'ja/nein'|'skala'|'frei',polarity:'niedrig'|'mittel'|'hoch'}], " +
    "suggestions:string[], isNewContext:boolean }. " +
    "confidence in 0..1. Keep statements concise. No explanations.";

  const user = JSON.stringify({
    text: input.text,
    userProfile: {
      region: input.userRegion ?? null,
      interests: input.userInterests ?? [],
      roles: input.userRoles ?? [],
    },
  });

  const r = await withTimeout(
    fetch(env.OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: env.MODEL,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    }),
    env.TIMEOUT_MS,
  );

  if (!r.ok) {
    const msg = await r.text().catch(() => String(r.status));
    throw new Error(`OpenAI ${r.status}: ${msg}`);
  }

  const j = await r.json();
  const raw = j?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  return LLMAnalysisZ.parse(parsed);
}
