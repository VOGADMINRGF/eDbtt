// features/utils/ai/askers.ts
type AskInput = { prompt: string; content: string; mode: string; locale: string };
type Provider = {
  enabled(): boolean;
  ask(input: AskInput): Promise<string>;
};

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 20000);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES ?? 2);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  return Promise.race([
    p.finally(() => clearTimeout(t)),
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms))
  ]) as Promise<T>;
}

async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e; await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

function composePrompt({ prompt, content, mode, locale }: AskInput, extraSystem: string = ""): string {
  // Minimale, robuste Kombi
  return [
    extraSystem ? `SYSTEM:\n${extraSystem}` : "",
    prompt.trim(),
    "\n[INPUT]\n",
    content.trim(),
    `\n[MODE=${mode}|LOCALE=${locale}]`
  ].join("\n");
}

/** ---------- OpenAI ---------- */
const openaiBase = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4.1";

async function askOpenAI(input: AskInput): Promise<string> {
  const sys = "You must return ONLY valid JSON (object or array), no prose, no code fences.";
  const body = {
    model: openaiModel,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: composePrompt(input) }
    ],
    // Falls Objekt erzwungen wird – unsere Parser akzeptieren auch Arrays;
    // wenn es hakt, nimm die Zeile raus:
    response_format: { type: "json_object" }
  };
  const res = await withTimeout(retry(async () => {
    const r = await fetch(`${openaiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`OpenAI HTTP ${r.status}`);
    const j = await r.json();
    return j.choices?.[0]?.message?.content ?? "";
  }), TIMEOUT_MS);
  if (!res) throw new Error("OpenAI returned empty response");
  return res;
}

/** ---------- Mistral ---------- */
const mistralModel = process.env.MISTRAL_MODEL || "mistral-large-latest";
async function askMistral(input: AskInput): Promise<string> {
  const sys = "Return ONLY valid JSON (object or array), no prose, no markdown.";
  const body = {
    model: mistralModel,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: composePrompt(input) }
    ]
  };
  const res = await withTimeout(retry(async () => {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`Mistral HTTP ${r.status}`);
    const j = await r.json();
    return j.choices?.[0]?.message?.content ?? "";
  }), TIMEOUT_MS);
  if (!res) throw new Error("Mistral returned empty response");
  return res;
}

/** ---------- Gemini ---------- */
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-pro";
async function askGemini(input: AskInput): Promise<string> {
  const sys = "Return ONLY valid JSON (object or array), no prose, no markdown.";
  const body = {
    contents: [{ role: "user", parts: [{ text: `${sys}\n\n${composePrompt(input)}` }]}]
  };
  const res = await withTimeout(retry(async () => {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
    const j = await r.json();
    const parts = j.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p: any) => p.text).filter(Boolean).join("\n");
    return text;
  }), TIMEOUT_MS);
  if (!res) throw new Error("Gemini returned empty response");
  return res;
}

/** ---------- YOU / ARI ---------- */
const youBase = process.env.YOU_API_BASE || "https://api.ari.yousearch.ai";
const youModel = process.env.YOU_MODEL || "ari-2";
async function askYou(input: AskInput): Promise<string> {
  const sys = "Return ONLY valid JSON (object or array), no prose.";
  const payload = { model: youModel, input: composePrompt(input, sys) };
  const res = await withTimeout(retry(async () => {
    const r = await fetch(`${youBase}/chat`, {
      method: "POST",
      headers: {
        "X-API-Key": process.env.YOU_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(`YOU/ARI HTTP ${r.status}`);
    const j = await r.json();
    // Normalize potential fields
    return j.output?.text ?? j.text ?? j.response ?? JSON.stringify(j);
  }), TIMEOUT_MS);
  if (!res) throw new Error("YOU/ARI returned empty response");
  return res;
}

/** ---------- Registry ---------- */
export const providers: Record<string, Provider> = {
  openai: {
    enabled: () => Boolean(process.env.OPENAI_API_KEY),
    ask: askOpenAI,
  },
  mistral: {
    enabled: () => Boolean(process.env.MISTRAL_API_KEY),
    ask: askMistral,
  },
  gemini: {
    enabled: () => Boolean(process.env.GEMINI_API_KEY),
    ask: askGemini,
  },
  you: {
    enabled: () => Boolean(process.env.YOU_API_KEY),
    ask: askYou,
  },
};
