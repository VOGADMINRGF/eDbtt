import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderTransactionalMail } from "@/utils/mailRenderer";

const ORIGINAL_ENV = { ...process.env };

const mocks = vi.hoisted(() => {
  const transportSendMail = vi.fn();
  return {
    hasSmtpTransportConfig: vi.fn(() => false),
    resolveMailEnvelopeForRuntime: vi.fn(() => ({
      from: "eDebatte <members@edebatte.org>",
      replyTo: "eDebatte Team <members@edebatte.org>",
    })),
    createTransport: vi.fn(() => ({ sendMail: transportSendMail })),
    transportSendMail,
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: (...args: unknown[]) => mocks.createTransport(...args),
  },
}));

vi.mock("@/lib/server/webRuntimeEnv", () => ({
  hasSmtpTransportConfig: (...args: unknown[]) => mocks.hasSmtpTransportConfig(...args),
  resolveMailEnvelopeForRuntime: (...args: unknown[]) =>
    mocks.resolveMailEnvelopeForRuntime(...args),
}));

async function loadMailer() {
  vi.resetModules();
  return import("@/utils/mailer");
}

function buildTestMail(subject = "verify") {
  return renderTransactionalMail({
    subject,
    preheader: subject,
    title: subject,
    blocks: [{ kind: "paragraph", text: "Testnachricht" }],
    reason: "der Mailer-Contract geprüft wird.",
  });
}

describe("mailer security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSmtpTransportConfig.mockReturnValue(false);
    mocks.transportSendMail.mockReset();
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "test" };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("logs only safe metadata when SMTP is unavailable", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendMail } = await loadMailer();

    const result = await sendMail({
      to: "member@edebatte.org",
      subject: "verify",
      html: '<a href="https://edebatte.test/register/verify-email?token=secret-token">verify</a>',
      text: "verify https://edebatte.test/register/verify-email?token=secret-token",
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: false, code: "mail_transport_unavailable" });
    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).not.toContain("secret-token");
    expect(output).not.toContain("https://edebatte.test/register/verify-email");
    expect(output).not.toContain("<a href=");
    expect(output).not.toContain("member@edebatte.org");
    warnSpy.mockRestore();
  });

  it("returns a real failure on SMTP transport errors without leaking raw exception fragments", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockRejectedValueOnce(
      Object.assign(new Error("550 member@gmail.com https://mail.test/?token=secret-token"), {
        code: "ESOCKET",
        response: "RCPT TO:<member@gmail.com> token=secret-token",
        responseCode: 550,
        messageId: "msg-1",
      }),
    );
    const { sendMail } = await loadMailer();
    const mail = buildTestMail("reset");

    const result = await sendMail({
      to: "member@gmail.com",
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "send_password_link",
    });

    expect(result).toMatchObject({ ok: false, code: "mail_transport_error", messageId: "msg-1" });
    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).not.toContain("secret-token");
    expect(output).not.toContain("https://edebatte.test/reset?token=");
    expect(output).not.toContain("member@gmail.com");
    expect(output).not.toContain("RCPT TO");
    warnSpy.mockRestore();
  });

  it("rejects raw unrendered HTML before invoking SMTP", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();

    const result = await sendMail({
      to: "member@gmail.com",
      subject: "raw",
      html: '<p><a href="https://attacker.example">raw</a></p>',
    });

    expect(result).toMatchObject({
      ok: false,
      code: "mail_transport_error",
    });
    expect(mocks.transportSendMail).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "[mailer] delivery_blocked",
      expect.objectContaining({ category: "mail_content_invalid" }),
    );
    warnSpy.mockRestore();
  });

  it("allows member@gmail.com when SMTP is configured", async () => {
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockResolvedValueOnce({ messageId: "msg-gmail" });
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail();

    const result = await sendMail({
      to: "member@gmail.com",
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: true, messageId: "msg-gmail" });
    expect(mocks.createTransport).toHaveBeenCalledTimes(1);
    expect(mocks.transportSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "eDebatte <members@edebatte.org>",
        replyTo: "eDebatte Team <members@edebatte.org>",
        to: "member@gmail.com",
      }),
    );
  });

  it("allows member@company.de when SMTP is configured", async () => {
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockResolvedValueOnce({ messageId: "msg-company" });
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail();

    const result = await sendMail({
      to: "member@company.de",
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: true, messageId: "msg-company" });
    expect(mocks.transportSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "member@company.de" }),
    );
  });

  it.each([
    "member@example.org",
    "member@example.com",
    "member@demo.invalid",
  ])("blocks reserved placeholder recipients: %s", async (recipient) => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail();

    const result = await sendMail({
      to: recipient,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: false, code: "mail_transport_unavailable" });
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.transportSendMail).not.toHaveBeenCalled();
    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).not.toContain(recipient);
    warnSpy.mockRestore();
  });

  it.each([
    "user@sub.example.org",
    "user@mail.example.com",
    "user@qa.example.net",
  ])("blocks reserved placeholder subdomains: %s", async (recipient) => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();

    const result = await sendMail({
      to: recipient,
      subject: "verify",
      html: "<p>verify</p>",
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: false, code: "mail_transport_unavailable" });
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.transportSendMail).not.toHaveBeenCalled();
    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).not.toContain(recipient);
    warnSpy.mockRestore();
  });

  it.each([
    "user@example-company.de",
    "user@myexample.org.de",
  ])("allows legitimate domains containing example: %s", async (recipient) => {
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockResolvedValueOnce({ messageId: `msg:${recipient}` });
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail();

    const result = await sendMail({
      to: recipient,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: true, messageId: `msg:${recipient}` });
    expect(mocks.transportSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: recipient }),
    );
  });

  it("blocks edebatte.test in production and does not invoke the transport", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();

    const result = await sendMail({
      to: "member@edebatte.test",
      subject: "verify",
      html: "<p>verify</p>",
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: false, code: "mail_transport_unavailable" });
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.transportSendMail).not.toHaveBeenCalled();
    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).not.toContain("member@edebatte.test");
    warnSpy.mockRestore();
  });

  it("delivers to two independent recipients without mutual To-header visibility", async () => {
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail
      .mockResolvedValueOnce({ messageId: "msg-alice" })
      .mockResolvedValueOnce({ messageId: "msg-bob" });
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail("separate delivery");

    const result = await sendMail({
      to: ["alice@gmail.com", "bob@company.de"],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "multi_user_test",
    });

    expect(result).toMatchObject({ ok: true, messageId: null });
    expect(mocks.transportSendMail).toHaveBeenCalledTimes(2);
    const firstDelivery = mocks.transportSendMail.mock.calls[0]?.[0];
    const secondDelivery = mocks.transportSendMail.mock.calls[1]?.[0];
    expect(firstDelivery?.to).toBe("alice@gmail.com");
    expect(secondDelivery?.to).toBe("bob@company.de");
    expect(JSON.stringify(firstDelivery)).not.toContain("bob@company.de");
    expect(JSON.stringify(secondDelivery)).not.toContain("alice@gmail.com");
  });

  it("splits comma-separated recipients into separate deliveries", async () => {
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockResolvedValue({ messageId: "msg" });
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail("comma delivery");

    const result = await sendMail({
      to: "alice@gmail.com, bob@company.de",
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    expect(result.ok).toBe(true);
    expect(mocks.transportSendMail.mock.calls.map(([payload]) => payload.to)).toEqual([
      "alice@gmail.com",
      "bob@company.de",
    ]);
  });

  it("normalizes array recipients into one transport call per address", async () => {
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockResolvedValue({ messageId: "msg" });
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail("array delivery");

    await sendMail({
      to: [" Alice@Gmail.com ", "BOB@COMPANY.DE"],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    expect(mocks.transportSendMail.mock.calls.map(([payload]) => payload.to)).toEqual([
      "alice@gmail.com",
      "bob@company.de",
    ]);
  });

  it("fails closed before delivery when one recipient in a list is invalid", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail("invalid recipient");

    const result = await sendMail({
      to: ["alice@gmail.com", "not-an-email", "bob@company.de"],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "mail_transport_unavailable",
    });
    expect(mocks.transportSendMail).not.toHaveBeenCalled();
    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).not.toContain("alice@gmail.com");
    expect(output).not.toContain("bob@company.de");
    warnSpy.mockRestore();
  });

  it("reports a partial failure after attempting each separate delivery", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail
      .mockResolvedValueOnce({ messageId: "msg-alice" })
      .mockRejectedValueOnce(
        Object.assign(new Error("recipient-specific provider failure"), {
          code: "EENVELOPE",
        }),
      );
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail("partial failure");

    const result = await sendMail({
      to: ["alice@gmail.com", "bob@company.de"],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "partial_delivery_test",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "mail_transport_error",
      messageId: null,
    });
    expect(mocks.transportSendMail).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      "[mailer] delivery_blocked",
      expect.objectContaining({
        recipient: "[multiple]",
        recipientCount: 2,
        deliveredCount: 1,
        failedCount: 1,
      }),
    );
    warnSpy.mockRestore();
  });

  it("logs only aggregate metadata for multi-recipient failures", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockRejectedValue(
      Object.assign(
        new Error("alice@gmail.com bob@company.de token=private"),
        { code: "ESOCKET" },
      ),
    );
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();
    const mail = buildTestMail("private body");

    await sendMail({
      to: "alice@gmail.com,bob@company.de",
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "metadata_only_test",
    });

    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).toContain('"recipientCount":2');
    expect(output).toContain('"failedCount":2');
    expect(output).not.toContain("alice@gmail.com");
    expect(output).not.toContain("bob@company.de");
    expect(output).not.toContain("private body");
    expect(output).not.toContain("token=private");
    warnSpy.mockRestore();
  });
});
