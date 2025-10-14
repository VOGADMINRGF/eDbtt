
export type GeminiOptions = {
  model?: string;
  timeoutMs?: number;
};

export async function callGemini(prompt: string, opts: GeminiOptions = {}) {
  const apiKey = process.env.GEMINI_API_KEY as string | undefined;
if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const model = opts.model || process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort("timeout"), opts.timeoutMs ?? 18000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json"
        }
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(()=>"");
      throw new Error(`Gemini ${res.status}: ${t}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { text, raw: data };
  } finally {
    clearTimeout(id);
  }
}
