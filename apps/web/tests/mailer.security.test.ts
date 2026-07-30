import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

    const result = await sendMail({
      to: "member@gmail.com",
      subject: "reset",
      html: '<a href="https://edebatte.test/reset?token=secret-token">reset</a>',
      text: "member@gmail.com https://edebatte.test/reset?token=secret-token",
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

  it("allows member@gmail.com when SMTP is configured", async () => {
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockResolvedValueOnce({ messageId: "msg-gmail" });
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();

    const result = await sendMail({
      to: "member@gmail.com",
      subject: "verify",
      html: "<p>verify</p>",
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: true, messageId: "msg-gmail" });
    expect(mocks.createTransport).toHaveBeenCalledTimes(1);
    expect(mocks.transportSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "eDebatte <members@edebatte.org>",
        replyTo: "eDebatte Team <members@edebatte.org>",
        to: ["member@gmail.com"],
      }),
    );
  });

  it("allows member@company.de when SMTP is configured", async () => {
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.transportSendMail.mockResolvedValueOnce({ messageId: "msg-company" });
    process.env.NODE_ENV = "production";
    const { sendMail } = await loadMailer();

    const result = await sendMail({
      to: "member@company.de",
      subject: "verify",
      html: "<p>verify</p>",
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: true, messageId: "msg-company" });
    expect(mocks.transportSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["member@company.de"] }),
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

    const result = await sendMail({
      to: recipient,
      subject: "verify",
      html: "<p>verify</p>",
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: true, messageId: `msg:${recipient}` });
    expect(mocks.transportSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: [recipient] }),
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
});
