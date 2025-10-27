import OpenAI from "openai";

export type OpenAIOptions = {
  timeoutMs?: number;
  forceJsonMode?: boolean;
  system?: string;
};

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

function toInt(v: any, defVal: number): number {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : defVal;
}

// einfache, direkte Nutzung
export async function callOpenAI(prompt: string, opts: OpenAIOptions = {}): Promise<{ text: string; raw: any }> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
  const timeout = toInt(opts.timeoutMs ?? process.env.OPENAI_TIMEOUT_MS ?? 18000, 18000);
  const body: any = {
    model,
    input: prompt,
    ...(opts.system ? { instructions: String(opts.system) } : {}),
    ...(opts.forceJsonMode ? { text: { format: { type: "json_object" } } } : {}),
  };
  const res = await client.responses.create(body, { timeout });
  const data: any = res;
  let text = "";
  if (typeof data?.text === "string" && data.text.trim()) text = data.text;
  else if (typeof data?.output_text === "string" && data.output_text.trim()) text = data.output_text;
  else if (Array.isArray(data?.output)) {
    const parts = data.output
      .flatMap((it: any) => (Array.isArray(it?.content) ? it.content : []))
      .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
      .filter(Boolean);
    if (parts.length) text = parts.join("\n");
  }
  return { text: text || "", raw: data };
}

// universeller Runner (fetch) für harte Fallbacks
export async function runOpenAI(
  prompt: string,
  opts: { json?: boolean; maxOutputTokens?: number; system?: string; timeoutMs?: number } = {}
): Promise<{ ok: boolean; text: string; raw?: any; usage?: any; ms?: number; error?: string; skipped?: boolean }> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
  if (!key) return { ok: false, text: "", skipped: true, error: "OPENAI_API_KEY missing" };
  const body: any = {
    model,
    input: String(prompt || ""),
    ...(opts.system ? { instructions: String(opts.system) } : {}),
    ...(opts.json ? { text: { format: { type: "json_object" } } } : {}),
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
    const parts = data.output
      .flatMap((it: any) => (Array.isArray(it?.content) ? it.content : []))
      .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
      .filter(Boolean);
    if (parts.length) out = parts.join("\n");
  }
  return { ok: true, text: out || "", raw: data, usage: data?.usage, ms: Date.now() - t0 };
}
