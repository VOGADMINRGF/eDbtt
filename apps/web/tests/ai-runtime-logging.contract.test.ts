import { describe, expect, it } from "vitest";
import { sanitizeAiLogText, sanitizeAiUsageEvent } from "@core/telemetry/aiLogSanitization";

describe("ai runtime logging contract", () => {
  it("redacts credentials, cookies and session data from diagnostics", () => {
    const text = sanitizeAiLogText(
      [
        "Authorization: Bearer sk-123456789012345678901234",
        "api_key=test-key",
        "cookie=session_token=abc123; u_id=42",
      ].join("\n"),
    );

    expect(text).toContain("Authorization: [redacted]");
    expect(text).toContain("api_key=[redacted]");
    expect(text).toContain("cookie=[redacted]");
    expect(text).not.toContain("session_token=abc123");
    expect(text).not.toContain("u_id=42");
  });

  it("stores metadata-only ai usage records", () => {
    const event = sanitizeAiUsageEvent({
      createdAt: new Date("2026-07-24T10:00:00.000Z"),
      provider: "openai",
      model: "gpt-5",
      pipeline: "other",
      tokensInput: 12,
      tokensOutput: 34,
      costEur: 0,
      durationMs: 456,
      success: false,
      errorKind: "UNAUTHORIZED",
      promptSnippet: "full prompt",
      responseSnippet: "full response",
      rawError: "Authorization: Bearer sk-123456789012345678901234",
    });

    expect(event.promptSnippet).toBeNull();
    expect(event.responseSnippet).toBeNull();
    expect(event.rawError).toContain("Authorization: [redacted]");
  });
});
