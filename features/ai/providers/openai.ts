import OpenAI from "openai";

export type OpenAIOptions = {
  timeoutMs?: number;
  json?: boolean;
  system?: string;
  maxOutputTokens?: number;
};

function toInt(v: any, def: number) {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function runOpenAI(
  prompt: string,
  opts: OpenAIOptions = {}
): Promise<{
  ok: boolean;
  text: string;
  raw?: any;
  usage?: any;
  ms?: number;
  error?: string;
  skipped?: boolean;
}> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
  if (!key) return { ok: false, text: "", skipped: true, error: "OPENAI_API_KEY missing" };

  const body: any = {
    model,
    input: String(prompt || ""),
    ...(opts.system ? { instructions: String(opts.system) } : {}),
    ...(opts.json ? { text: { format: { type: "json_object" } } } : {}),
    ...(opts.maxOutputTokens ? { max_output_tokens: toInt(opts.maxOutputTokens, 0) } : {}),
  };

  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => String(res.status));
    return { ok: false, text: "", error: `OpenAI ${res.status} – ${msg}`, ms: Date.now() - t0 };
  }

  const data = await res.json();
  let out = "";
  if (typeof data?.text === "string") out = data.text;
  else if (Array.isArray(data?.output)) {
    out = data.output
      .flatMap((it: any) => (Array.isArray(it?.content) ? it.content : []))
      .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
      .filter(Boolean)
      .join("\n");
  }
  return { ok: true, text: out || "", raw: data, usage: data?.usage, ms: Date.now() - t0 };
}
