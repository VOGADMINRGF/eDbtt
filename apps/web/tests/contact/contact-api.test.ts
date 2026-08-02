import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
vi.mock("server-only", () => ({}));
import { POST } from "@/app/api/contact/route";
import { sendMail } from "@/utils/mailer";

vi.mock("@/utils/mailer", () => ({
  sendMail: vi.fn(async () => ({
    ok: true,
    status: "delivered",
    transport: "smtp",
    category: null,
    retryable: false,
    attemptedCount: 1,
    deliveredCount: 1,
    failedCount: 0,
    messageId: "msg-1",
  })),
  mailFailureMetadata: (result: Record<string, unknown>) => ({
    status: result.status,
    category: result.category,
    retryable: result.retryable,
    attemptedCount: result.attemptedCount,
    deliveredCount: result.deliveredCount,
    failedCount: result.failedCount,
  }),
}));
const sendMailMock = sendMail as unknown as Mock;

function buildForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const defaults = {
    category: "presse",
    name: "Test Nutzer",
    email: "test@example.com",
    phone: "",
    subject: "Frage",
    message: "Dies ist eine ganz normale Nachricht ohne Spam.",
    locale: "de",
    newsletterOptIn: "",
    website: "",
    hp_contact: "",
    formStartedAt: String(Date.now() - 5000),
    turnstileToken: "",
    humanChallengeId: "farbe",
    humanAnswer: "blau",
    humanShape: "kreis",
  };
  const entries = { ...defaults, ...overrides };
  Object.entries(entries).forEach(([key, value]) => form.set(key, value));
  return form;
}

async function callContact(form: FormData, ip = "1.1.1.1") {
  const req = new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "x-forwarded-for": ip,
    },
    body: form,
  });
  return POST(req as any);
}

describe("contact API spam protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a normal request", async () => {
    const res = await callContact(
      buildForm({ email: "normal@example.com", formStartedAt: String(Date.now() - 7000) }),
      "10.0.0.1",
    );
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.classification).toBe("ham");
    expect(sendMailMock.mock.calls.length).toBe(2);
  });

  it("renders the acknowledgement in the submitted English locale", async () => {
    const res = await callContact(
      buildForm({
        email: "english@example.com",
        locale: "en-GB",
        formStartedAt: String(Date.now() - 7000),
      }),
      "10.0.0.11",
    );

    expect(res.status).toBe(200);
    const acknowledgementCall = sendMailMock.mock.calls[1]?.[0];
    expect(acknowledgementCall.delivery).toBe("best_effort_delivery");
    expect(acknowledgementCall.mail.locale).toBe("en");
    expect(acknowledgementCall.mail.subject).toBe("We received your message");
    expect(acknowledgementCall.mail.html).toContain('lang="en"');
    expect(acknowledgementCall.mail.html).not.toContain(
      "Wir haben deine Nachricht erhalten",
    );
  });

  it("returns a delivery failure when the required inbox mail resolves ok false", async () => {
    sendMailMock.mockResolvedValueOnce({
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

    const res = await callContact(
      buildForm({
        email: "failed@example.com",
        formStartedAt: String(Date.now() - 7000),
      }),
      "10.0.0.12",
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "mail_delivery_failed",
      delivery: {
        retryable: true,
        attemptedCount: 1,
        deliveredCount: 0,
        failedCount: 1,
      },
    });
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it("logs message metadata without message content", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const secretText = "Vertraulicher Freitext Alpha-4711";

    const res = await callContact(
      buildForm({
        email: "privacy@example.com",
        message: secretText,
        formStartedAt: String(Date.now() - 7000),
      }),
      "10.0.0.13",
    );

    expect(res.status).toBe(200);
    const loggedMetadata = JSON.parse(String(infoSpy.mock.calls.at(-1)?.[0]));
    expect(loggedMetadata.messageLength).toBe(secretText.length);
    expect(loggedMetadata).not.toHaveProperty("messagePreview");
    expect(JSON.stringify(loggedMetadata)).not.toContain(secretText);
    infoSpy.mockRestore();
  });

  it("drops honeypot submissions silently", async () => {
    const res = await callContact(
      buildForm({ email: "honeypot@example.com", hp_contact: "bot" }),
      "10.0.0.2",
    );
    const body = await res.json();
    expect(body.classification).toBe("spam");
    expect(sendMailMock.mock.calls.length).toBe(0);
  });

  it("flags forms filled too fast", async () => {
    const res = await callContact(
      buildForm({ email: "toofast@example.com", formStartedAt: String(Date.now()) }),
      "10.0.0.3",
    );
    const body = await res.json();
    expect(body.classification).toBe("spam");
    expect(sendMailMock.mock.calls.length).toBe(0);
  });

  it("detects keyword spam", async () => {
    const res = await callContact(
      buildForm({
        email: "keyword@example.com",
        formStartedAt: String(Date.now() - 7000),
        message: "Tolles webdesign angebot mit backlinks und Domain Authority 90.",
      }),
      "10.0.0.4",
    );
    const body = await res.json();
    expect(body.classification).toBe("spam");
    expect(body.spamScore).toBeGreaterThanOrEqual(2);
    expect(sendMailMock.mock.calls.length).toBe(0);
  });

  it("flags messages with many links", async () => {
    const links = Array.from({ length: 6 })
      .map((_, i) => `https://spam-${i}.example.com`)
      .join(" ");
    const res = await callContact(
      buildForm({
        email: "links@example.com",
        formStartedAt: String(Date.now() - 7000),
        message: `Hier sind viele Links: ${links}`,
      }),
      "10.0.0.5",
    );
    const body = await res.json();
    expect(body.classification).toBe("spam");
    expect(body.spamScore).toBeGreaterThanOrEqual(2);
    expect(sendMailMock.mock.calls.length).toBe(0);
  });

  it("rate limits after multiple hits from same ip", async () => {
    let lastRes: Response | null = null;
    for (let i = 0; i < 6; i++) {
      lastRes = await callContact(
        buildForm({
          email: `ratelimit-${i}@example.com`,
          subject: `Req ${i}`,
          formStartedAt: String(Date.now() - 7000),
        }),
        "20.0.0.9",
      );
    }
    const body = await (lastRes as Response).json();
    expect((lastRes as Response).status).toBe(429);
    expect(body.error).toBe("rate_limited");
  });
});
