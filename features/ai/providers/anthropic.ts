export type AnthropicOptions = {
  model?: string;
  timeoutMs?: number;
};

export async function callAnthropic(prompt: string, opts: AnthropicOptions = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY as string | undefined;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const model = opts.model || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort("timeout"), opts.timeoutMs ?? 22000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        system: "Return valid RFC8259 JSON only. No markdown. No prose.",
        max_tokens: 4000,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(()=>"");
      throw new Error(`Anthropic ${res.status}: ${t}`);
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? data?.content?.[0]?.content ?? "";
    return { text, raw: data };
  } finally {
    clearTimeout(id);
  }
}
