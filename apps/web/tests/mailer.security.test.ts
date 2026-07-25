import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const sendMail = vi.fn();
  return {
    hasSmtpTransportConfig: vi.fn(() => false),
    resolveMailFromForRuntime: vi.fn(() => "noreply@edebatte.test"),
    createTransport: vi.fn(() => ({ sendMail })),
    sendMail,
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: (...args: unknown[]) => mocks.createTransport(...args),
  },
}));

vi.mock("@/lib/server/webRuntimeEnv", () => ({
  hasSmtpTransportConfig: (...args: unknown[]) => mocks.hasSmtpTransportConfig(...args),
  resolveMailFromForRuntime: (...args: unknown[]) => mocks.resolveMailFromForRuntime(...args),
}));

describe("mailer security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasSmtpTransportConfig.mockReturnValue(false);
    mocks.sendMail.mockReset();
  });

  it("logs only safe metadata when SMTP is unavailable", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendMail } = await import("@/utils/mailer");

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
    warnSpy.mockRestore();
  });

  it("returns a real failure on SMTP transport errors without leaking URLs", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    mocks.sendMail.mockRejectedValueOnce(new Error("550 https://mail.test/?token=secret-token"));
    vi.resetModules();
    const { sendMail } = await import("@/utils/mailer");

    const result = await sendMail({
      to: "member@edebatte.org",
      subject: "reset",
      html: '<a href="https://edebatte.test/reset?token=secret-token">reset</a>',
      tag: "send_password_link",
    });

    expect(result).toMatchObject({ ok: false, code: "mail_transport_error" });
    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).not.toContain("secret-token");
    expect(output).not.toContain("https://edebatte.test/reset?token=");
    expect(output).not.toContain("<a href=");
    warnSpy.mockRestore();
  });

  it("blocks recipients outside the approved eDebatte domains", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.hasSmtpTransportConfig.mockReturnValue(true);
    vi.resetModules();
    const { sendMail } = await import("@/utils/mailer");

    const result = await sendMail({
      to: "member@example.org",
      subject: "verify",
      html: "<p>verify</p>",
      tag: "resend_verification",
    });

    expect(result).toMatchObject({ ok: false, code: "mail_transport_unavailable" });
    expect(mocks.createTransport).not.toHaveBeenCalled();
    const output = JSON.stringify(warnSpy.mock.calls);
    expect(output).not.toContain("member@example.org");
    warnSpy.mockRestore();
  });
});
