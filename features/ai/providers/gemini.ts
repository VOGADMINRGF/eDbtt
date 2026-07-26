// features/ai/providers/gemini.ts
import { withMetrics } from "../orchestrator_health";

const API_BASE =
  process.env.GOOGLE_GENAI_BASE_URL || "https://generativelanguage.googleapis.com";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODEL =
  process.env.GEMINI_MODEL_FALLBACK || "gemini-2.5-flash";

export type AskArgs = {
  prompt: string;
  model?: string;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  expectJson?: boolean;
};

export type AskResult = {
  text: string;
  raw: any;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
};

function extractText(data: any): string {
  try {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const text = parts
        .map((part: any) =>
          typeof part?.text === "string" ? part.text : null,
        )
        .filter((value): value is string => Boolean(value));
      if (text.length) return text.join("").trim();
    }
  } catch {
    // ignore
  }
  return "";
}

function normalizeModelName(modelName: string): string {
  return modelName.replace(/^models\//, "");
}

async function post(
  body: Record<string, unknown>,
  signal: AbortSignal | undefined,
  modelName: string,
) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY or GEMINI_API_KEY");
  }

  const resolvedModel = normalizeModelName(modelName);
  const url = `${API_BASE}/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data);
    const err: any = new Error(`Gemini error ${res.status}: ${msg}`);
    err.status = res.status;
    err.payload = data;
    err.code =
      data?.error?.status ??
      (typeof data?.error?.code === "string" ? data.error.code : null) ??
      null;
    err.meta = {
      model: resolvedModel,
      code: err.code,
      messageShort: typeof msg === "string" ? msg.slice(0, 200) : null,
    };
    throw err;
  }
  return data;
}

async function askGemini({
  prompt,
  model,
  maxOutputTokens = 2_000,
  signal,
  expectJson = true,
}: AskArgs): Promise<AskResult> {
  if (!prompt) throw new Error("prompt darf nicht leer sein");

  const baseBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${prompt}\n\nReturn only valid JSON (RFC8259).`,
          },
        ],
      },
    ],
  } as const;

  const requestModel = async (modelName: string) => {
    const generationConfig: Record<string, unknown> = {
      temperature: 0.25,
      maxOutputTokens,
    };
    if (expectJson) {
      generationConfig.responseMimeType = "application/json";
    }
    try {
      return await post({ ...baseBody, generationConfig }, signal, modelName);
    } catch (err: any) {
      if (expectJson && err?.status === 400) {
        return post(
          {
            ...baseBody,
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens,
            },
          },
          signal,
          modelName,
        );
      }
      throw err;
    }
  };

  let selectedModel = model ?? MODEL;
  let data;
  try {
    data = await requestModel(selectedModel);
  } catch (err: any) {
    const canFallbackModel =
      err?.status === 404 &&
      typeof FALLBACK_MODEL === "string" &&
      FALLBACK_MODEL.length > 0 &&
      normalizeModelName(FALLBACK_MODEL) !== normalizeModelName(selectedModel);
    if (!canFallbackModel) throw err;
    selectedModel = FALLBACK_MODEL;
    data = await requestModel(selectedModel);
  }

  return {
    text: extractText(data),
    raw: data,
    model: data?.model ?? normalizeModelName(selectedModel),
    tokensIn: data?.usageMetadata?.promptTokenCount,
    tokensOut: data?.usageMetadata?.candidatesTokenCount,
  };
}

function jsonOk(result: AskResult) {
  if (!result?.text) return false;
  try {
    JSON.parse(result.text);
    return true;
  } catch {
    return false;
  }
}

export const callGemini = withMetrics<Parameters<typeof askGemini>, AskResult>(
  "gemini",
  askGemini,
  { jsonOk },
);

export default callGemini;
