export async function runMistral(
  prompt: string,
  opts: { json?: boolean; model?: string; system?: string; timeoutMs?: number } = {}
) {
  const key = process.env.MISTRAL_API_KEY;
  const model = opts.model || process.env.MISTRAL_MODEL || "mistral-large-latest";
  if (!key) return { ok: false, text: "", skipped: true, error: "MISTRAL_API_KEY missing" };

  const t0 = Date.now();
  const body: any = {
    model,
    messages: [
      ...(opts.system ? [{ role: "system", content: String(opts.system) }] : []),
      { role: "user", content: String(prompt || "") },
    ],
    max_tokens: 1024,
  };
  if (opts.json) {
    body.messages.unshift({
      role: "system",
      content: "Gib ausschließlich gültiges JSON (RFC8259) ohne erklärenden Text zurück.",
    });
  }

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => String(res.status));
    return { ok: false, text: "", error: `Mistral ${res.status} – ${msg}`, ms: Date.now() - t0 };
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  return { ok: true, text: String(text || ""), raw: data, ms: Date.now() - t0 };
}

// compat alias
export { runMistral as callMistral };
