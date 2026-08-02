import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  callOpenAIJson: vi.fn(),
  buildCreateTechnicalFollowup: vi.fn(),
  buildCreateValidatedDocumentFollowup: vi.fn(),
  ensureCreateSupportTicket: vi.fn(),
  enforceCreateMutationSecurity: vi.fn(),
  getSessionUser: vi.fn(),
  resolveCreatePlannerModelCandidates: vi.fn(),
  verifyCreateDraftBinding: vi.fn(),
}));

vi.mock("@features/ai", () => ({
  callOpenAIJson: (...args: unknown[]) => mocks.callOpenAIJson(...args),
}));
vi.mock("@/features/create/intelligentFollowupResults", () => ({
  buildCreateTechnicalFollowup: (...args: unknown[]) =>
    mocks.buildCreateTechnicalFollowup(...args),
  buildCreateValidatedDocumentFollowup: (...args: unknown[]) =>
    mocks.buildCreateValidatedDocumentFollowup(...args),
}));
vi.mock("@/features/create/createPlanner", () => ({
  resolveCreatePlannerModelCandidates: (...args: unknown[]) =>
    mocks.resolveCreatePlannerModelCandidates(...args),
}));
vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));
vi.mock("@/features/create/createRouteSecurity", () => ({
  enforceCreateMutationSecurity: (...args: unknown[]) =>
    mocks.enforceCreateMutationSecurity(...args),
  verifyCreateDraftBinding: (...args: unknown[]) =>
    mocks.verifyCreateDraftBinding(...args),
}));
vi.mock("@/features/support/createSupportTickets", () => ({
  ensureCreateSupportTicket: (...args: unknown[]) =>
    mocks.ensureCreateSupportTicket(...args),
}));

import { POST } from "@/app/api/create/link-analysis/route";

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/create/link-analysis", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      "x-edebatte-create-csrf": "create-mutation-v1",
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  text: "A contribution that is bound to the saved draft.",
  url: "https://example.test/source",
  locale: "en",
  correlationId: "correlation-link-auth",
  draftId: "65f000000000000000000001",
};

describe("/api/create/link-analysis authenticated draft contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({
      _id: { toString: () => "user-1" },
      sessionValid: true,
    });
    mocks.enforceCreateMutationSecurity.mockResolvedValue(null);
    mocks.verifyCreateDraftBinding.mockResolvedValue({
      draftId: validBody.draftId,
      userId: "user-1",
      payloadHash: "payload-hash",
      inputHash: "input-hash",
    });
    mocks.resolveCreatePlannerModelCandidates.mockReturnValue(["gpt-test"]);
    mocks.callOpenAIJson.mockResolvedValue({
      text: JSON.stringify({
        documentTitle: "Source",
        documentType: "article",
        pageCount: null,
        wordCount: 220,
        topicCount: 1,
        subtopicCount: 1,
        keyStatementCount: 1,
        verifiableClaimCount: 1,
        policyProposalCount: 0,
        subjectBreadth: "narrow",
        subjectDepth: "medium",
        balanceAssessment: "unclear",
        sourceSpecificity: "specific",
        sourceVerificationStatus: "not_started",
        counterpositionCoverage: "unclear",
        summary: "A bounded source summary.",
        topics: [
          {
            id: "topic-1",
            label: "Topic",
            subtopicCount: 1,
            keyStatementCount: 1,
            verifiableClaimCount: 1,
            policyProposalCount: 0,
            summary: "Topic summary",
          },
        ],
      }),
    });
    mocks.buildCreateValidatedDocumentFollowup.mockReturnValue({
      meta: { analysis: { state: "validated" } },
    });
    mocks.buildCreateTechnicalFollowup.mockReturnValue({
      meta: { analysis: { state: "fetch_failed" } },
    });
    mocks.ensureCreateSupportTicket.mockResolvedValue({
      ticketNumber: "EDB-20260730-LINK0001",
      safeUserMessage: "Your contribution is saved.",
      viewHref: "/account?ticket=EDB-20260730-LINK0001#support-tickets",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          `<html><title>Source</title><body>${"source material ".repeat(30)}</body></html>`,
          {
            status: 200,
            headers: { "content-type": "text/html" },
          },
        ),
      ),
    );
  });

  it("rejects a guest before parsing malformed JSON and before every side effect", async () => {
    mocks.getSessionUser.mockResolvedValue(null);
    const response = await POST(
      new NextRequest("http://localhost/api/create/link-analysis", {
        method: "POST",
        body: "{malformed-json",
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(mocks.enforceCreateMutationSecurity).not.toHaveBeenCalled();
    expect(mocks.verifyCreateDraftBinding).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.callOpenAIJson).not.toHaveBeenCalled();
    expect(mocks.ensureCreateSupportTicket).not.toHaveBeenCalled();
  });

  it("stops before body and draft work when origin, CSRF or limiter checks fail", async () => {
    mocks.enforceCreateMutationSecurity.mockResolvedValue(
      NextResponse.json(
        { ok: false, errorCode: "CREATE_REQUEST_REJECTED" },
        { status: 403 },
      ),
    );

    const response = await POST(request(validBody));
    expect(response.status).toBe(403);
    expect(mocks.verifyCreateDraftBinding).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.callOpenAIJson).not.toHaveBeenCalled();
    expect(mocks.ensureCreateSupportTicket).not.toHaveBeenCalled();
  });

  it.each(["foreign", "invented", "deleted"])(
    "rejects a %s draft with the same generic response and no downstream work",
    async () => {
      mocks.verifyCreateDraftBinding.mockResolvedValue(null);

      const response = await POST(request(validBody));
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        ok: false,
        errorCode: "CREATE_REQUEST_NOT_ALLOWED",
      });
      expect(fetch).not.toHaveBeenCalled();
      expect(mocks.callOpenAIJson).not.toHaveBeenCalled();
      expect(mocks.ensureCreateSupportTicket).not.toHaveBeenCalled();
    },
  );

  it("runs source and provider analysis only for the authenticated user's verified draft", async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(mocks.verifyCreateDraftBinding).toHaveBeenCalledWith({
      draftId: validBody.draftId,
      userId: "user-1",
      text: validBody.text,
      locale: "en",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.callOpenAIJson).toHaveBeenCalledTimes(1);
    expect(mocks.ensureCreateSupportTicket).not.toHaveBeenCalled();
  });

  it("never starts a third model attempt after two controlled failures", async () => {
    mocks.resolveCreatePlannerModelCandidates.mockReturnValue([
      "model-one",
      "model-two",
      "model-three",
    ]);
    mocks.callOpenAIJson.mockRejectedValue(
      Object.assign(new Error("model not found"), { status: 404 }),
    );

    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(mocks.callOpenAIJson).toHaveBeenCalledTimes(2);
    expect(mocks.callOpenAIJson).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: "model-one" }),
    );
    expect(mocks.callOpenAIJson).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: "model-two" }),
    );
    expect(JSON.stringify(mocks.callOpenAIJson.mock.calls)).not.toContain(
      "model-three",
    );
    expect(mocks.ensureCreateSupportTicket).toHaveBeenCalledTimes(1);
  });
});
