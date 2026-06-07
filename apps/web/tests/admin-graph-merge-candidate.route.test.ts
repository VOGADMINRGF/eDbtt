import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  applyGraphMergeCandidateAction,
  createInMemoryGraphMergeCandidatesRepository,
  prepareGraphMergeCandidateFromReviewRequest,
  setGraphMergeCandidatesRepoForTests,
} from "@features/graphMergeCandidates";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

import { POST } from "@/app/api/admin/graph-merge-candidates/[candidateId]/route";

describe("/api/admin/graph-merge-candidates/[candidateId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGraphMergeCandidatesRepoForTests(createInMemoryGraphMergeCandidatesRepository());
    mocks.requireAdminOrResponse.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      roles: ["admin"],
      sessionValid: true,
    });
  });

  it("accepts a candidate for staging without publishing it", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-1",
      sourceType: "create_analysis",
      sourceId: "draft-1",
      userId: "user-1",
      originalText: "Die Schulwegsicherheit im Kiez ist unzureichend belegt.",
      normalizedText: "die schulwegsicherheit im kiez ist unzureichend belegt",
      truthStatus: "factcheck_passed",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "accept_for_staging",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      candidate: {
        reviewStatus: "accepted_for_staging",
        mergeStatus: "staged",
        noAutoPublish: true,
        noAutoGraphPromotion: true,
      },
    });
  });

  it("blocks administrative candidate actions for non-admin callers", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-1b",
      sourceType: "create_analysis",
      sourceId: "draft-1b",
      userId: "user-1",
      originalText: "Der Gehweg ist zu schmal und braucht eine redaktionelle Prüfung.",
      normalizedText: "der gehweg ist zu schmal und braucht eine redaktionelle prüfung",
      truthStatus: "review_required",
      sourceSupport: "partial",
      sourceStatus: "Prüfung empfohlen",
      verificationLabel: "analysiert",
      reviewRecommended: true,
    });

    mocks.requireAdminOrResponse.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403 }),
    );

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "accept_for_staging",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(response.status).toBe(403);
  });

  it("requires a reason for reject and clarification", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-2",
      sourceType: "theme_suggestion",
      sourceId: "theme-1",
      userId: "user-1",
      originalText: "Radweg vor der Grundschule als Thema weiterführen.",
      normalizedText: "radweg vor der grundschule als thema weiterführen",
      truthStatus: "review_required",
      sourceSupport: "open",
      sourceStatus: "Prüfung empfohlen",
      verificationLabel: "analysiert",
      reviewRecommended: true,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reject",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "graph_merge_candidate_note_required",
    });
  });

  it("blocks staging when sourceSupport is open", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-3",
      sourceType: "create_analysis",
      sourceId: "draft-3",
      userId: "user-1",
      originalText: "Bitte erst Quellen klären, bevor daraus ein Kandidat fürs Staging wird.",
      normalizedText: "bitte erst quellen klären bevor daraus ein kandidat fürs staging wird",
      truthStatus: "source_open",
      sourceSupport: "open",
      sourceStatus: "Quellenlage offen",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "accept_for_staging",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "graph_merge_candidate_staging_blocked_by_source_support",
    });
  });

  it("rejects duplicate accept_for_staging once a candidate is already accepted", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-4",
      sourceType: "create_analysis",
      sourceId: "draft-4",
      userId: "user-1",
      originalText: "Dieser Kandidat ist bereits fürs Staging entschieden.",
      normalizedText: "dieser kandidat ist bereits fürs staging entschieden",
      truthStatus: "factcheck_passed",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "accept_for_staging",
      requestedByUserId: "admin-1",
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "accept_for_staging",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "graph_merge_candidate_invalid_transition",
    });
  });

  it("confirms productive merge only for admins and writes audit entries", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-5",
      sourceType: "create_analysis",
      sourceId: "draft-5",
      userId: "user-1",
      originalText: "Belastbarer Claim für den produktiven Merge.",
      normalizedText: "belastbarer claim für den produktiven merge",
      truthStatus: "sealed_verified",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "accept_for_staging",
      requestedByUserId: "admin-1",
    });

    await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "prepare_productive_merge",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "confirm_productive_merge",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      candidate: {
        reviewStatus: "merged",
        mergeStatus: "merged",
      },
      auditEntries: [expect.objectContaining({ action: "merge_confirmed" })],
    });
  });

  it("blocks productive merge confirmation for accepted_for_staging until merge is prepared", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-6",
      sourceType: "create_analysis",
      sourceId: "draft-6",
      userId: "user-1",
      originalText: "Noch nicht fertig vorbereiteter Claim.",
      normalizedText: "noch nicht fertig vorbereiteter claim",
      truthStatus: "sealed_verified",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "accept_for_staging",
      requestedByUserId: "admin-1",
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "confirm_productive_merge",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "graph_merge_candidate_blocked_review_required",
    });
  });

  it("requires an override reason when reviewRecommended is true", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-7",
      sourceType: "create_analysis",
      sourceId: "draft-7",
      userId: "user-1",
      originalText: "Claim mit Review-Hinweis.",
      normalizedText: "claim mit review-hinweis",
      truthStatus: "factcheck_passed",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: true,
    });

    await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "accept_for_staging",
      requestedByUserId: "admin-1",
    });
    await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "prepare_productive_merge",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    const blocked = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "confirm_productive_merge",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(blocked.status).toBe(409);
    await expect(blocked.json()).resolves.toMatchObject({
      ok: false,
      error: "graph_merge_candidate_override_required",
    });

    const confirmed = await POST(
      new NextRequest(`http://localhost/api/admin/graph-merge-candidates/${candidate.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "confirm_productive_merge",
          note: "Explizite Override-Begründung dokumentiert.",
        }),
      }),
      {
        params: Promise.resolve({ candidateId: candidate.id }),
      },
    );

    expect(confirmed.status).toBe(200);
    await expect(confirmed.json()).resolves.toMatchObject({
      ok: true,
      auditEntries: expect.arrayContaining([
        expect.objectContaining({ action: "override_confirmed" }),
        expect.objectContaining({ action: "merge_confirmed" }),
      ]),
    });
  });
});
