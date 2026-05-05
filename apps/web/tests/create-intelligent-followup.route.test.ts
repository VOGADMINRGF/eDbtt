import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildCreateIntelligentFollowup: vi.fn(),
}));

vi.mock("@/features/create/intelligentFollowup", () => ({
  buildCreateIntelligentFollowup: (...args: unknown[]) => mocks.buildCreateIntelligentFollowup(...args),
}));

import { POST } from "@/app/api/create/intelligent-followup/route";

describe("/api/create/intelligent-followup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on empty text", async () => {
    const response = await POST(
      new Request("http://localhost/api/create/intelligent-followup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "   " }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errorCode: "BAD_INPUT",
    });
  });

  it("returns ok result for valid input", async () => {
    mocks.buildCreateIntelligentFollowup.mockResolvedValue({
      understanding: {
        summary: "Kurzfassung",
        categories: [{ id: "hint", label: "Hinweis", confidence: "medium" }],
        topics: [{ id: "topic-1", label: "Mobilität", confidence: "medium" }],
        statements: [
          {
            id: "s1",
            text: "Mehr Schulwegsicherheit",
            kind: "demand",
            stance: "pro",
            confidence: "medium",
          },
        ],
        scopes: ["district"],
        openQuestion: null,
        confidence: "medium",
      },
      suggestions: [
        {
          id: "topic:1",
          kind: "topic",
          title: "Thema: Mobilität",
          reason: "Themennähe erkannt.",
          confidence: "medium",
          requiresConfirmation: true,
        },
      ],
      sourceText: "Input",
      generatedAt: "2026-05-05T10:00:00.000Z",
      degraded: false,
      degradedReason: null,
    });

    const response = await POST(
      new Request("http://localhost/api/create/intelligent-followup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Input", locale: "de", intent: "contribute" }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.result.understanding.summary).toBe("Kurzfassung");
    expect(mocks.buildCreateIntelligentFollowup).toHaveBeenCalledTimes(1);
  });
});
