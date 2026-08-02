import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  sendMail: vi.fn(),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
  mailFailureMetadata: (result: Record<string, unknown>) => ({
    status: result.status,
    category: result.category,
    retryable: result.retryable,
    attemptedCount: result.attemptedCount,
    deliveredCount: result.deliveredCount,
    failedCount: result.failedCount,
  }),
}));

vi.mock("@/utils/publicOrigin", () => ({
  publicOrigin: () => "https://edebatte.org",
}));

import { POST as REQUEST_QUOTE_LINK } from "@/app/api/edebatte/preorder/quote-download-link/route";
import { GET as DOWNLOAD_QUOTE } from "@/app/api/edebatte/preorder/quote-download/route";

describe("/api/edebatte/preorder/quote-download-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMail.mockResolvedValue({
      ok: true,
      status: "delivered",
      transport: "smtp",
      category: null,
      retryable: false,
      attemptedCount: 1,
      deliveredCount: 1,
      failedCount: 0,
      messageId: "msg-1",
    });
  });

  it("rejects quote-link requests when required recipient data is missing", async () => {
    const req = new NextRequest("http://localhost/api/edebatte/preorder/quote-download-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locale: "de",
        packageId: "b2g_basis",
        packageLabel: "Kommune / Verwaltung Aktivierung",
        packagePriceLabel: "ab 349 € / Monat",
      }),
    });

    const res = await REQUEST_QUOTE_LINK(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "missing_required_fields",
    });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("sends separate quote-link mails to requester and sales after required fields are complete", async () => {
    const req = new NextRequest("http://localhost/api/edebatte/preorder/quote-download-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locale: "de",
        segment: "kommunen",
        packageId: "b2g_basis",
        packageLabel: "Kommune / Verwaltung Aktivierung",
        packagePriceLabel: "ab 349 € / Monat",
        organizationName: "Stadt Beispiel",
        contactPerson: "Max Mustermann",
        phone: "+49 171 123456",
        email: "max@example.org",
        acceptedPrivacy: true,
        acceptedContact: true,
        selectedAddOns: [{ title: "Moderation / Assistenz", priceLabel: "ab 450 € / Monat" }],
        recurringLines: [{ title: "Kommune / Verwaltung Aktivierung", priceLabel: "ab 349 € / Monat" }],
        variableLines: [{ title: "Event-Begleitung", priceLabel: "ab 690 € je Einsatz" }],
        monthlyTotalLabel: "ab 349 €",
      }),
    });

    const res = await REQUEST_QUOTE_LINK(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);

    const requesterMail = mocks.sendMail.mock.calls[0]?.[0];
    expect(requesterMail?.to).toBe("max@example.org");
    expect(String(requesterMail?.mail?.text || "")).toContain(
      "/api/edebatte/preorder/quote-download?",
    );
    expect(requesterMail?.delivery).toBe("required_delivery");
    expect(mocks.sendMail.mock.calls[1]?.[0]?.delivery).toBe(
      "best_effort_delivery",
    );
  });

  it("does not report success when required requester delivery returns ok false", async () => {
    mocks.sendMail.mockResolvedValueOnce({
      ok: false,
      status: "failed",
      transport: "smtp",
      code: "mail_transport_error",
      category: "smtp_timeout",
      retryable: true,
      attemptedCount: 1,
      deliveredCount: 0,
      failedCount: 1,
      messageId: null,
    });
    const req = new NextRequest(
      "http://localhost/api/edebatte/preorder/quote-download-link",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale: "en",
          segment: "organizations",
          packageId: "b2b_basis",
          packageLabel: "Organization",
          packagePriceLabel: "on request",
          organizationName: "Civic Lab",
          contactPerson: "Alex",
          phone: "+49 123",
          email: "alex@company.de",
          acceptedPrivacy: true,
          acceptedContact: true,
        }),
      },
    );

    const res = await REQUEST_QUOTE_LINK(req);
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "mail_failed",
      delivery: {
        status: "failed",
        category: "smtp_timeout",
        retryable: true,
        attemptedCount: 1,
        deliveredCount: 0,
        failedCount: 1,
      },
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });
});

describe("/api/edebatte/preorder/quote-download", () => {
  it("returns quote content as downloadable text attachment", async () => {
    const content = "eDebatte Kostenvoranschlag";
    const encoded = Buffer.from(content, "utf8").toString("base64url");
    const req = new NextRequest(
      `http://localhost/api/edebatte/preorder/quote-download?quote=${encodeURIComponent(encoded)}&name=test-quote`,
      { method: "GET" },
    );

    const res = await DOWNLOAD_QUOTE(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("test-quote.txt");
    await expect(res.text()).resolves.toContain("Kostenvoranschlag");
  });
});
