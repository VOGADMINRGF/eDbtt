export async function runAnthropic(
  prompt: string,
  opts: { json?: boolean; model?: string; system?: string; timeoutMs?: number } = {}
) {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = opts.model || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";
  if (!key) return { ok: false, text: "", skipped: true, error: "ANTHROPIC_API_KEY missing" };

  const body: any = {
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: String(prompt || "") }],
    ...(opts.system ? { system: String(opts.system) } : {}),
  };
  if (opts.json) {
    body.system = `${opts.system ?? ""}\n\nDu MUSST ausschließlich gültiges JSON (RFC8259) ohne Fließtext zurückgeben.`;
  }

  const t0 = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
  });

  if (!res.ok) {
    const msgText = await res.text().catch(()=>String(res.status));
    // Wenn Kontostand zu niedrig → als „skipped“ behandeln, kein harter Fehler
    const skipped = /credit balance is too low/i.test(msgText) || res.status === 402 || res.status === 403 || res.status === 400;
    return { ok:false, text:"", error:`Anthropic ${res.status} – ${msgText}`, ms: Date.now()-t0, skipped };
  }

  const data = await res.json();
  const text = Array.isArray(data?.content) ? data.content.find((c: any) => c?.type === "text")?.text || "" : "";
  return { ok: true, text: text || "", raw: data, ms: Date.now() - t0 };
}

// compat alias
export { runAnthropic as callAnthropic };
