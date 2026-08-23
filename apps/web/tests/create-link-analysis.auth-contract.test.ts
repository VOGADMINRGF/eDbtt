import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

const mocks = vi.hoisted(() => ({
  callOpenAIJson: vi.fn(),
  buildCreateTechnicalFollowup: vi.fn(),
  buildCreateValidatedDocumentFollowup: vi.fn(),
  ensureCreateSupportTicket: vi.fn(),
  enforceCreateMutationSecurity: vi.fn(),
  getSessionUser: vi.fn(),
  resolveCreatePlannerModelCandidates: vi.fn(),
  safeExternalFetch: vi.fn(),
  verifyCreateDraftBinding: vi.fn(),
  fetchYoutubeTranscript: vi.fn(),
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
vi.mock("@features/ai/sources/youtube", () => ({
  fetchYoutubeTranscript: (...args: unknown[]) =>
    mocks.fetchYoutubeTranscript(...args),
}));
vi.mock("@/lib/net/safeExternalFetch", () => ({
  safeExternalFetch: (...args: unknown[]) => mocks.safeExternalFetch(...args),
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

function buildCompressedPdfFixture() {
  const document = new jsPDF({ compress: true });
  document.text(
    "Kommunale Waermewende und bezahlbares Wohnen sind getrennte Programmschwerpunkte.",
    20,
    20,
  );
  document.text("Sichere Mobilitaet erhaelt eigene Ziele, Massnahmen und Zeitraeume.", 20, 30);
  document.text("Die Abschnitte benennen Ausgangslage, Vorschlag und offene Finanzierungsfragen.", 20, 40);
  document.addPage();
  document.text(
    "Die Studie beschreibt Datengrundlage, Unsicherheiten und drei Handlungspfade.",
    20,
    20,
  );
  document.text("Jeder Abschnitt trennt Befund, Annahme und Empfehlung nachvollziehbar.", 20, 30);
  document.text("Quellenhinweise und methodische Grenzen bleiben im Dokument sichtbar.", 20, 40);
  return Buffer.from(document.output("arraybuffer"));
}

function buildModelDocumentAnalysis(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
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
    ...overrides,
  };
}

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
      text: JSON.stringify(buildModelDocumentAnalysis()),
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
    mocks.fetchYoutubeTranscript.mockResolvedValue({
      id: "dQw4w9WgXcQ",
      lang: "de",
      text: "Das Transkript behandelt bezahlbares Wohnen und sichere Mobilität mit getrennten Aussagen. ".repeat(5),
    });
    mocks.safeExternalFetch.mockImplementation(async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`external_source_http_${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) throw new Error("external_source_empty");
      return {
        buffer,
        contentType: response.headers.get("content-type")?.toLowerCase() ?? "",
        finalUrl: url,
        headers: new Headers(response.headers),
        redirectCount: 0,
        status: response.status,
      };
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

  it("analyzes extracted HTML title and body while preserving the source URL", async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(mocks.callOpenAIJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining("source material"),
      }),
    );
    expect(mocks.buildCreateValidatedDocumentFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: validBody.url,
        documentAnalysis: expect.objectContaining({
          documentTitle: "Source",
          documentType: "article",
          topicCount: 1,
        }),
      }),
    );
  });

  it("keeps a multi-section HTML program split into independently validated topics", async () => {
    const programUrl = "https://example.test/kommunalprogramm";
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        `<html><title>Kommunalprogramm 2030</title><body>
          <main>
            <h1>Wohnen</h1><p>${"Bezahlbare Wohnungen und Bodenpolitik. ".repeat(8)}</p>
            <h1>Mobilität</h1><p>${"Sichere Wege und verlässlicher Nahverkehr. ".repeat(8)}</p>
            <h1>Klima</h1><p>${"Kommunale Wärmeplanung und Klimaanpassung. ".repeat(8)}</p>
          </main>
        </body></html>`,
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
      ),
    );
    mocks.callOpenAIJson.mockResolvedValueOnce({
      text: JSON.stringify(
        buildModelDocumentAnalysis({
          documentTitle: "Kommunalprogramm 2030",
          documentType: "party_program",
          topicCount: 3,
          subtopicCount: 3,
          keyStatementCount: 3,
          verifiableClaimCount: 3,
          policyProposalCount: 3,
          subjectBreadth: "broad",
          subjectDepth: "high",
          balanceAssessment: "programmatic",
          summary: "Das Programm behandelt Wohnen, Mobilität und Klima in getrennten Abschnitten.",
          topics: [
            { id: "wohnen", label: "Wohnen", summary: "Bezahlbare Wohnungen und Bodenpolitik.", subtopicCount: 1, keyStatementCount: 1, verifiableClaimCount: 1, policyProposalCount: 1 },
            { id: "mobilitaet", label: "Mobilität", summary: "Sichere Wege und Nahverkehr.", subtopicCount: 1, keyStatementCount: 1, verifiableClaimCount: 1, policyProposalCount: 1 },
            { id: "klima", label: "Klima", summary: "Wärmeplanung und Klimaanpassung.", subtopicCount: 1, keyStatementCount: 1, verifiableClaimCount: 1, policyProposalCount: 1 },
          ],
        }),
      ),
    });

    const response = await POST(request({ ...validBody, url: programUrl }));

    expect(response.status).toBe(200);
    expect(mocks.callOpenAIJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringMatching(/Bezahlbare Wohnungen[\s\S]*Sichere Wege[\s\S]*Wärmeplanung/),
      }),
    );
    expect(mocks.buildCreateValidatedDocumentFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: programUrl,
        documentAnalysis: expect.objectContaining({
          documentTitle: "Kommunalprogramm 2030",
          documentType: "party_program",
          topicCount: 3,
          topics: expect.arrayContaining([
            expect.objectContaining({ id: "wohnen" }),
            expect.objectContaining({ id: "mobilitaet" }),
            expect.objectContaining({ id: "klima" }),
          ]),
        }),
      }),
    );
  });

  it("detects an extensionless PDF by MIME and analyzes extracted document text", async () => {
    const pdf = buildCompressedPdfFixture();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(pdf, {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );
    mocks.callOpenAIJson.mockResolvedValueOnce({
      text: JSON.stringify(
        buildModelDocumentAnalysis({
          documentTitle: "Studie zu kommunalen Handlungspfaden",
          documentType: "study",
          pageCount: 2,
          topicCount: 2,
          subtopicCount: 3,
          keyStatementCount: 3,
          verifiableClaimCount: 2,
          subjectBreadth: "broad",
          subjectDepth: "high",
          balanceAssessment: "mostly_balanced",
          summary: "Die Studie trennt kommunale Programmschwerpunkte und methodische Handlungspfade.",
          topics: [
            { id: "programme", label: "Kommunale Programmschwerpunkte", summary: "Wärme, Wohnen und Mobilität.", subtopicCount: 2, keyStatementCount: 2, verifiableClaimCount: 1, policyProposalCount: 1 },
            { id: "methodik", label: "Methodik und Grenzen", summary: "Datengrundlage und Unsicherheiten.", subtopicCount: 1, keyStatementCount: 1, verifiableClaimCount: 1, policyProposalCount: 0 },
          ],
        }),
      ),
    });

    const response = await POST(
      request({
        ...validBody,
        url: "https://example.test/download?id=study",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.callOpenAIJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringMatching(/Waermewende|Wärmewende/),
      }),
    );
    expect(mocks.buildCreateValidatedDocumentFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: "https://example.test/download?id=study",
        documentAnalysis: expect.objectContaining({
          documentType: "study",
          pageCount: 2,
          topicCount: 2,
        }),
      }),
    );
    expect(mocks.ensureCreateSupportTicket).not.toHaveBeenCalled();
  });

  it("recognizes a direct PDF URL even with a generic MIME and keeps program topics separate", async () => {
    const sourceUrl = "https://example.test/fraktionsprogramm.pdf";
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(buildCompressedPdfFixture(), {
        status: 200,
        headers: { "content-type": "application/octet-stream" },
      }),
    );
    mocks.callOpenAIJson.mockResolvedValueOnce({
      text: JSON.stringify(
        buildModelDocumentAnalysis({
          documentTitle: "Fraktionsprogramm",
          documentType: "party_program",
          pageCount: 2,
          topicCount: 3,
          subtopicCount: 3,
          keyStatementCount: 3,
          verifiableClaimCount: 3,
          policyProposalCount: 3,
          subjectBreadth: "broad",
          subjectDepth: "high",
          balanceAssessment: "programmatic",
          summary: "Das Programm trennt Wärme, Wohnen und Mobilität.",
          topics: [
            { id: "waerme", label: "Wärmewende", summary: "Kommunale Wärmeplanung.", subtopicCount: 1, keyStatementCount: 1, verifiableClaimCount: 1, policyProposalCount: 1 },
            { id: "wohnen", label: "Wohnen", summary: "Bezahlbares Wohnen.", subtopicCount: 1, keyStatementCount: 1, verifiableClaimCount: 1, policyProposalCount: 1 },
            { id: "mobilitaet", label: "Mobilität", summary: "Sichere Mobilität.", subtopicCount: 1, keyStatementCount: 1, verifiableClaimCount: 1, policyProposalCount: 1 },
          ],
        }),
      ),
    });

    const response = await POST(request({ ...validBody, url: sourceUrl }));

    expect(response.status).toBe(200);
    expect(mocks.buildCreateValidatedDocumentFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl,
        documentAnalysis: expect.objectContaining({
          documentType: "party_program",
          pageCount: 2,
          topicCount: 3,
        }),
      }),
    );
    expect(mocks.ensureCreateSupportTicket).not.toHaveBeenCalled();
  });

  it("degrades without semantic output when a PDF has no extractable text", async () => {
    const blankPdf = new jsPDF({ compress: true });
    const pdf = Buffer.from(blankPdf.output("arraybuffer"));
    const sourceUrl = "https://example.test/scanned-study.pdf";
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(pdf, {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );

    const response = await POST(request({ ...validBody, url: sourceUrl }));

    expect(response.status).toBe(200);
    expect(mocks.callOpenAIJson).not.toHaveBeenCalled();
    expect(mocks.buildCreateTechnicalFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisState: "fetch_failed",
        sourceType: "document",
        sourceUrl,
        sourceLoaded: false,
      }),
    );
    expect(mocks.ensureCreateSupportTicket).toHaveBeenCalledTimes(1);
  });

  it("uses the existing transcript source path for YouTube instead of analyzing page HTML", async () => {
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    const response = await POST(
      request({
        ...validBody,
        url: youtubeUrl,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.fetchYoutubeTranscript).toHaveBeenCalledWith(youtubeUrl);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.callOpenAIJson).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.stringContaining("Das Transkript behandelt"),
      }),
    );
    expect(mocks.buildCreateValidatedDocumentFollowup).toHaveBeenCalledWith(
      expect.objectContaining({ sourceUrl: youtubeUrl }),
    );
  });

  it("degrades visibly without provider analysis when a YouTube transcript is unavailable", async () => {
    const youtubeUrl = "https://youtu.be/dQw4w9WgXcQ";
    mocks.fetchYoutubeTranscript.mockResolvedValueOnce({
      id: "dQw4w9WgXcQ",
      lang: null,
      text: "",
    });

    const response = await POST(
      request({
        ...validBody,
        url: youtubeUrl,
      }),
    );

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.callOpenAIJson).not.toHaveBeenCalled();
    expect(mocks.buildCreateTechnicalFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisState: "fetch_failed",
        sourceUrl: youtubeUrl,
        sourceLoaded: false,
      }),
    );
    expect(mocks.ensureCreateSupportTicket).toHaveBeenCalledTimes(1);
  });

  it("returns the existing safe degraded/support contract for an unreachable URL", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network blocked"));

    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(mocks.callOpenAIJson).not.toHaveBeenCalled();
    expect(mocks.buildCreateTechnicalFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisState: "fetch_failed",
        sourceType: "link",
        sourceUrl: validBody.url,
        sourceLoaded: false,
      }),
    );
    expect(mocks.ensureCreateSupportTicket).toHaveBeenCalledTimes(1);
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
