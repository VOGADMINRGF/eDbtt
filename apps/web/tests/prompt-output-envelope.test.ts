import { describe, expect, it } from "vitest";
import {
  extractPromptOutputPayload,
  parsePromptOutputJson,
  PROMPT_OUTPUT_CONTRACT_VERSION,
} from "@/features/ai/promptOutputEnvelope";

describe("prompt output envelope helpers", () => {
  it("parses and unwraps a versioned envelope", () => {
    const raw = parsePromptOutputJson(
      JSON.stringify({
        contractVersion: PROMPT_OUTPUT_CONTRACT_VERSION,
        promptVersion: "trace.prompt.v1",
        outputVersion: "trace.output.v1",
        data: { guidance: { concern: "x" } },
      }),
    );

    const extracted = extractPromptOutputPayload<Record<string, unknown>>(raw, {
      fallbackPromptVersion: "fallback.prompt.v1",
      fallbackOutputVersion: "fallback.output.v1",
    });

    expect(extracted.meta.parserMode).toBe("envelope");
    expect(extracted.meta.promptVersion).toBe("trace.prompt.v1");
    expect(extracted.payload).toEqual({ guidance: { concern: "x" } });
  });

  it("falls back to legacy object payload", () => {
    const extracted = extractPromptOutputPayload<Record<string, unknown>>(
      { guidance: { concern: "legacy" } },
      {
        fallbackPromptVersion: "fallback.prompt.v1",
        fallbackOutputVersion: "fallback.output.v1",
      },
    );

    expect(extracted.meta.parserMode).toBe("legacy");
    expect(extracted.payload).toEqual({ guidance: { concern: "legacy" } });
    expect(extracted.meta.promptVersion).toBe("fallback.prompt.v1");
  });

  it("returns null payload for invalid json blobs", () => {
    const raw = parsePromptOutputJson("not-json");
    const extracted = extractPromptOutputPayload<Record<string, unknown>>(raw, {
      fallbackPromptVersion: "fallback.prompt.v1",
      fallbackOutputVersion: "fallback.output.v1",
    });

    expect(raw).toBeNull();
    expect(extracted.meta.parserMode).toBe("invalid");
    expect(extracted.payload).toBeNull();
  });

  it("parses fenced json via bounded fallback", () => {
    const raw = parsePromptOutputJson('```json\n{"x":1}\n```');
    expect(raw).toEqual({ x: 1 });
  });
});
