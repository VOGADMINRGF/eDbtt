export type MistralOptions = {
  model?: string;
  timeoutMs?: number;
};

export async function callMistral(prompt: string, opts: MistralOptions = {}) {
  const apiKey = process.env.MISTRAL_API_KEY as string | undefined;
if (!apiKey) throw new Error("MISTRAL_API_KEY missing");

  const model = opts.model || process.env.MISTRAL_MODEL || "mistral-large-latest";

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort("timeout"), opts.timeoutMs ?? 18000);

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: "Return valid RFC8259 JSON only. No markdown. No prose." },
          { role: "user", content: prompt },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(()=>"");
      throw new Error(`Mistral ${res.status}: ${t}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return { text, raw: data };
  } finally {
    clearTimeout(id);
  }
}
