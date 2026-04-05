export const PROMPT_OUTPUT_CONTRACT_VERSION = "prompt_output.v1" as const;

export type PromptOutputEnvelope<TPayload extends Record<string, unknown>> = {
  contractVersion: string;
  promptVersion: string;
  outputVersion: string;
  data: TPayload;
};

export type PromptOutputParserMode = "envelope" | "legacy" | "invalid";

export type PromptOutputMeta = {
  contractVersion: string;
  promptVersion: string;
  outputVersion: string;
  parserMode: PromptOutputParserMode;
};

type ExtractOptions = {
  fallbackPromptVersion: string;
  fallbackOutputVersion: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasEnvelopeShape(value: unknown): value is PromptOutputEnvelope<Record<string, unknown>> {
  if (!isRecord(value)) return false;
  return (
    typeof value.contractVersion === "string" &&
    typeof value.promptVersion === "string" &&
    typeof value.outputVersion === "string" &&
    isRecord(value.data)
  );
}

function parseDirectJson(text: string): unknown {
  return JSON.parse(text);
}

function parseBoundedJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("invalid_json_bounds");
  return JSON.parse(trimmed.slice(start, end + 1));
}

export function parsePromptOutputJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return parseDirectJson(trimmed);
  } catch {
    // ignore
  }

  try {
    return parseBoundedJson(trimmed);
  } catch {
    return null;
  }
}

export function extractPromptOutputPayload<TPayload extends Record<string, unknown>>(
  raw: unknown,
  options: ExtractOptions,
): {
  payload: TPayload | null;
  meta: PromptOutputMeta;
} {
  const baseMeta: PromptOutputMeta = {
    contractVersion: PROMPT_OUTPUT_CONTRACT_VERSION,
    promptVersion: options.fallbackPromptVersion,
    outputVersion: options.fallbackOutputVersion,
    parserMode: "invalid",
  };

  if (hasEnvelopeShape(raw)) {
    return {
      payload: raw.data as TPayload,
      meta: {
        contractVersion: raw.contractVersion || PROMPT_OUTPUT_CONTRACT_VERSION,
        promptVersion: raw.promptVersion || options.fallbackPromptVersion,
        outputVersion: raw.outputVersion || options.fallbackOutputVersion,
        parserMode: "envelope",
      },
    };
  }

  if (isRecord(raw)) {
    return {
      payload: raw as TPayload,
      meta: {
        ...baseMeta,
        parserMode: "legacy",
      },
    };
  }

  return {
    payload: null,
    meta: baseMeta,
  };
}
