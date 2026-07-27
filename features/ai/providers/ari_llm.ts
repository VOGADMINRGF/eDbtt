// features/ai/providers/ari_llm.ts
/**
 * You.com (ARI) provider adapter
 *
 * Uses: POST https://api.you.com/v1/agents/runs
 * - Express Agent: low-latency, optional 1x web search
 * - Advanced Agent: deeper research/workflows
 *
 * Docs:
 * - Express: https://docs.you.com/api-reference/agents/express-agent/express-agent-runs
 * - Advanced: https://docs.you.com/api-reference/agents/advanced-agent/advanced-agent-runs
 */
export type AriCallArgs = {
  prompt: string;
  signal?: AbortSignal;
  maxOutputTokens?: number;
  model?: string;
  /**
   * If true, we *ask* the agent to output strict JSON.
   * Note: agents are not guaranteed to comply -> caller should still validate.
   */
  asJson?: boolean;
};

export type AriCallResult = {
  text: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costEur?: number;
};

type AriRunResponse = {
  agent?: string;
  output?: Array<any>;
};

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function parseToolsJson(): any[] | undefined {
  const raw = getEnv("ARI_TOOLS_JSON");
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function extractAnswerText(payload: AriRunResponse): string {
  const out = Array.isArray(payload?.output) ? payload.output : [];
  // Prefer the final answer message:
  const msg = out.find((x) => x?.type === "message.answer" && typeof x?.text === "string");
  if (msg?.text) return String(msg.text);
  // Fallback: join any text fields we can find
  const parts: string[] = [];
  for (const item of out) {
    if (typeof item?.text === "string") parts.push(item.text);
    if (typeof item?.content === "string") parts.push(item.content);
  }
  return parts.join("\n\n").trim();
}

export async function callAriLLM(args: AriCallArgs): Promise<AriCallResult> {
  const baseUrl = (getEnv("ARI_BASE_URL") ?? getEnv("ARI_API_URL") ?? "https://api.you.com").replace(/\/+$/, "");
  const apiKey = getEnv("ARI_API_KEY") ?? getEnv("YOUCOM_ARI_API_KEY");
  if (!apiKey) {
    const e: any = new Error("ARI_API_KEY fehlt (oder YOUCOM_ARI_API_KEY).");
    e.status = 500;
    throw e;
  }

  const mode = (getEnv("ARI_MODE") ?? "express").toLowerCase();
  const agent = mode === "advanced" ? "advanced" : "express";

  const tools = parseToolsJson(); // e.g. [{"type":"web_search"}] for express, [{"type":"research"}] for advanced
  const maxTokens = typeof args.maxOutputTokens === "number" ? args.maxOutputTokens : 2400;

  const prompt =
    args.asJson === true
      ? [
          args.prompt,
          "",
          "Return ONLY valid JSON (RFC8259). No Markdown. No commentary. No extra keys. No input echo.",
        ].join("\n")
      : args.prompt;

  const res = await fetch(`${baseUrl}/v1/agents/runs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      agent,
      input: prompt,
      stream: false,
      tools: tools ?? undefined,
      // Note: API does not document max_output_tokens; we keep maxTokens locally for upstream callers.
    }),
    signal: args.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const e: any = new Error(`ARI request failed: ${res.status} ${res.statusText}${text ? ` :: ${text.slice(0, 200)}` : ""}`);
    e.status = res.status;
    throw e;
  }

  const payload = (await res.json()) as AriRunResponse;
  const text = extractAnswerText(payload);

  return {
    text,
    model: args.model ?? payload?.agent ?? agent,
    tokensIn: undefined,
    tokensOut: undefined,
    costEur: undefined,
  };
}
