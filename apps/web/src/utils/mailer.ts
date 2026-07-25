// apps/web/src/utils/mailer.ts

import nodemailer from "nodemailer";
import { BRAND } from "@/lib/brand";
import {
  hasSmtpTransportConfig,
  resolveMailFromForRuntime,
} from "@/lib/server/webRuntimeEnv";

let transporter: nodemailer.Transporter | null = null;

export type SendMailResult =
  | {
      ok: true;
      transport: "smtp";
      messageId: string | null;
    }
  | {
      ok: false;
      transport: "none" | "smtp";
      code: "mail_transport_unavailable" | "mail_transport_error";
      retryable: boolean;
      messageId: string | null;
    };

type MailFailureCode = Extract<SendMailResult, { ok: false }>["code"];

const DEFAULT_ALLOWED_MAIL_DOMAINS = [
  BRAND.domain,
  "edebatte.test",
  "voiceopengov.org",
  "voiceopengov.de",
] as const;

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tag?: string;
}): Promise<SendMailResult> {
  const { to, subject, html, text } = opts;
  const recipient = normalizeEmail(to);
  const domain = emailDomain(recipient);

  const from = resolveMailFromForRuntime();
  const wantsSmtp = hasSmtpTransportConfig();

  const logFailure = (code: MailFailureCode, reason?: string, messageId?: string | null) => {
    console.warn("[mailer] delivery_blocked", {
      code,
      tag: opts.tag ?? "generic",
      recipient: maskEmail(to),
      domain: emailDomain(to),
      messageId: messageId ?? null,
      reason: reason ? sanitizeReason(reason) : null,
    });
    return {
      ok: false,
      transport: code === "mail_transport_unavailable" ? "none" : "smtp",
      code,
      retryable: true,
      messageId: messageId ?? null,
    } as const;
  };

  if (!recipient || !domain || !isAllowedMailDomain(domain)) {
    return logFailure("mail_transport_unavailable", "recipient_domain_not_allowed");
  }

  if (!wantsSmtp) {
    return logFailure("mail_transport_unavailable");
  }

  try {
    if (!transporter) {
      transporter = process.env.SMTP_URL
        ? nodemailer.createTransport(process.env.SMTP_URL as string)
        : nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure:
              String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
            auth: process.env.SMTP_USER
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
          });
    }

    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, ""),
    });

    return {
      ok: true,
      transport: "smtp",
      messageId: typeof info?.messageId === "string" ? info.messageId : null,
    };
  } catch (e: any) {
    return logFailure(
      "mail_transport_error",
      e?.code || e?.message || String(e),
      typeof e?.messageId === "string" ? e.messageId : null,
    );
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function maskEmail(value: string) {
  const [name, domain] = normalizeEmail(value).split("@");
  if (!domain) return value.trim().toLowerCase();
  const head = name.slice(0, 2);
  return `${head}${name.length > 2 ? "***" : ""}@${domain}`;
}

function emailDomain(value: string) {
  return normalizeEmail(value).split("@")[1] ?? null;
}

function isAllowedMailDomain(domain: string) {
  return DEFAULT_ALLOWED_MAIL_DOMAINS.includes(domain as (typeof DEFAULT_ALLOWED_MAIL_DOMAINS)[number]);
}

function sanitizeReason(value: string) {
  return value.replace(/https?:\/\/\S+/gi, "[redacted-url]");
}
