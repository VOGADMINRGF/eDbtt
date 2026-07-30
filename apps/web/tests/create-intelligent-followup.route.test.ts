import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  buildCreateIntelligentFollowup: vi.fn(),
  ensureCreateSupportTicket: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/features/create/intelligentFollowup", () => ({
  buildCreateIntelligentFollowup: (...args: unknown[]) => mocks.buildCreateIntelligentFollowup(...args),
}));
vi.mock("@/features/support/createSupportTickets", () => ({
  ensureCreateSupportTicket: (...args: unknown[]) => mocks.ensureCreateSupportTicket(...args),
}));
vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

import { POST } from "@/app/api/create/intelligent-followup/route";

describe("/api/create/intelligent-followup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue(null);
    mocks.ensureCreateSupportTicket.mockResolvedValue({
      ticketNumber: "EDB-20260729-ROUTE001",
      status: "open",
      safeUserMessage: "Dein Beitrag ist gespeichert.",
      viewHref: "/account?ticket=EDB-20260729-ROUTE001#support-tickets",
      notificationLinked: true,
    });
  });

  it("creates a user-safe support handoff for a degraded planner result", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toString: () => "user-1" },
    });
    mocks.buildCreateIntelligentFollowup.mockResolvedValue({
      sourceText: "Input",
      meta: {
        analysis: { state: "ai_failed" },
        planner: {
          degradedReason: "timeout",
          providerAttemptCount: 2,
          plannerDebug: {
            attemptedProvider: "anthropic",
            providerErrorCode: "TIMEOUT",
          },
        },
      },
    });

    const response = await POST(
      new NextRequest("http://localhost/api/create/intelligent-followup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: "Input",
          locale: "de",
          correlationId: "correlation-route-1",
          draftId: "draft-route-1",
        }),
      }),
    );
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.supportHandoff).toMatchObject({
      status: "created",
      ticket: { ticketNumber: "EDB-20260729-ROUTE001" },
    });
    expect(mocks.ensureCreateSupportTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        affectedUserId: "user-1",
        correlationId: "correlation-route-1",
        draftId: "draft-route-1",
        attemptCount: 2,
      }),
    );
  });

  it("returns 400 on empty text", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/create/intelligent-followup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "   " }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errorCode: "TEXT_REQUIRED",
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
      new NextRequest("http://localhost/api/create/intelligent-followup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Input", locale: "de", intent: "contribute", dossierId: "dossier-1" }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.result.understanding.summary).toBe("Kurzfassung");
    expect(body.trace).toMatchObject({
      requestId: expect.any(String),
      operationId: expect.any(String),
      operationType: "create_intelligent_followup_planner",
      userScope: "missing_runtime_truth",
    });
    expect(mocks.buildCreateIntelligentFollowup).toHaveBeenCalledTimes(1);
    expect(mocks.buildCreateIntelligentFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: expect.any(String),
        operationId: expect.any(String),
        operationType: "create_intelligent_followup_planner",
        userId: null,
        dossierId: "dossier-1",
      }),
    );
  });

  it("converts a final unhandled orchestration error into one safe support handoff", async () => {
    mocks.buildCreateIntelligentFollowup.mockRejectedValue(
      new Error("raw upstream planner failure"),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/create/intelligent-followup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: "Please preserve this contribution.",
          locale: "en",
          correlationId: "correlation-final-error",
          draftId: "draft-final-error",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      result: {
        sourceText: "Please preserve this contribution.",
        meta: {
          analysis: {
            state: "ai_failed",
            validationStatus: "failed",
          },
        },
      },
      supportHandoff: {
        status: "created",
        ticket: {
          ticketNumber: "EDB-20260729-ROUTE001",
        },
      },
      trace: {
        requestId: "correlation-final-error",
      },
    });
    expect(mocks.ensureCreateSupportTicket).toHaveBeenCalledTimes(1);
    expect(mocks.ensureCreateSupportTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: "correlation-final-error",
        technicalErrorCode: "CREATE_FOLLOWUP_FAILED",
        reason: "unhandled_orchestration_error",
        draftId: "draft-final-error",
        locale: "en",
      }),
    );
    expect(JSON.stringify(body)).not.toContain("raw upstream planner failure");
  });
});
