import OpenAI from "openai";

export type GeminiRunOptions = {
  json?: boolean;
  timeoutMs?: number;
  youtubeUrl?: string; // wenn gesetzt -> Direct-Video-Path
  model?: string;
};

const BASE_OPENAI_COMPAT = "https://generativelanguage.googleapis.com/v1beta/openai/";

function assertKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY missing");
  return k;
}

export async function runGemini(prompt: string, opts: GeminiRunOptions = {}) {
  const apiKey = assertKey();

  // (A) Spezialfall: direkt mit YouTube-URL arbeiten (Gemini Video Understanding)
  if (opts.youtubeUrl) {
    const model = opts.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort("timeout"), opts.timeoutMs ?? 30000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { video_url: { youtube_url: opts.youtubeUrl } },
                { text: prompt }
              ]
            }]
          })
        }
      );
      const json = await res.json();
      clearTimeout(t);
      if (!res.ok) {
        return { ok: false, text: "", error: `HTTP ${res.status}: ${JSON.stringify(json).slice(0,300)}` };
      }
      const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      return { ok: !!text, text, raw: json };
    } catch (e:any) {
      return { ok:false, text:"", error:String(e) };
    }
  }

  // (B) Normaler Textpfad (OpenAI-kompatibel)
  const client = new OpenAI({ apiKey, baseURL: BASE_OPENAI_COMPAT });
  const model = opts.model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const started = Date.now();
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: opts.json ? { type: "json_object" } : { type: "text" },
    });
    const text = r.choices?.[0]?.message?.content ?? "";
    return { ok: !!text, text, ms: Date.now() - started, raw: r };
  } catch (e:any) {
    return { ok:false, text:"", error:String(e) };
  }
}
