export type OpenAIOptions = {
  model?: string;
  timeoutMs?: number;
  forceJsonMode?: boolean;     // setzt response_format, wenn möglich
  system?: string;             // optional eigenes Systemprompt
  baseUrl?: string;            // optional eigenes Base-URL
};

export async function callOpenAI(prompt: string, opts: OpenAIOptions = {}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const baseUrl = opts.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = opts.model || process.env.OPENAI_MODEL || "gpt-4.1";
  const system = opts.system || "Return valid RFC8259 JSON only. No markdown. No prose.";

  const body: Record<string, any> = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ],
    temperature: 0
  };

  // JSON-Mode nur setzen, wenn explizit gewünscht/erlaubt
  if (opts.forceJsonMode || String(process.env.OPENAI_JSON_MODE).toLowerCase() === "true") {
    body.response_format = { type: "json_object" };
  }

  // Neue optionale Steuerungen – werden nur übergeben, wenn gesetzt
  if (process.env.OPENAI_REASONING_EFFORT) body.reasoning_effort = process.env.OPENAI_REASONING_EFFORT; // z.B. "minimal" | "medium" | "high"
  if (process.env.OPENAI_VERBOSITY)        body.verbosity        = process.env.OPENAI_VERBOSITY;        // z.B. "low" | "medium" | "high"

  // Timeout via AbortController
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 20_000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });

    const txt = await res.text(); // erst Text, dann ggf. JSON
    if (!res.ok) {
      // versuche sinnvolle Fehlermeldung zu extrahieren
      let msg = `OpenAI ${res.status}`;
      try { const j = JSON.parse(txt); msg += `: ${j.error?.message ?? txt}`; } catch { msg += `: ${txt}`; }
      throw new Error(msg);
    }

    // normaler Erfolgsfall
    let data: any;
    try { data = JSON.parse(txt); } catch { throw new Error("OpenAI: invalid JSON response"); }
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("OpenAI returned empty content");
    return content;
  } finally {
    clearTimeout(t);
  }
}