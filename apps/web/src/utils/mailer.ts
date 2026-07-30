// apps/web/src/utils/mailer.ts

import nodemailer from "nodemailer";
import {
  hasSmtpTransportConfig,
  resolveMailEnvelopeForRuntime,
} from "@/lib/server/webRuntimeEnv";
import { ensureTransactionalMail } from "@/utils/mailRenderer";

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

type MailFailureCategory =
  | "recipient_invalid"
  | "recipient_placeholder_domain"
  | "recipient_test_domain_blocked"
  | "recipient_domain_not_allowed"
  | "sender_configuration_invalid"
  | "smtp_unconfigured"
  | "smtp_auth_error"
  | "smtp_connection_error"
  | "smtp_timeout"
  | "smtp_response_error"
  | "smtp_unknown_error";

const RESERVED_PLACEHOLDER_DOMAINS = new Set([
  "example.org",
  "example.com",
  "example.net",
]);

const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tag?: string;
  locale?: string | null;
  preheader?: string;
}): Promise<SendMailResult> {
  const recipients = recipientsToArray(opts.to);
  const recipient = recipients[0] ?? "";
  const domain = emailDomain(recipient);
  const wantsSmtp = hasSmtpTransportConfig();

  const logFailure = (
    code: MailFailureCode,
    category: MailFailureCategory,
    messageId?: string | null,
  ) => {
    console.warn("[mailer] delivery_blocked", {
      code,
      category,
      tag: opts.tag ?? "generic",
      recipient: maskEmail(recipient),
      domain,
      recipientCount: recipients.length,
      messageId: messageId ?? null,
    });
    return {
      ok: false,
      transport: code === "mail_transport_unavailable" ? "none" : "smtp",
      code,
      retryable: true,
      messageId: messageId ?? null,
    } as const;
  };

  if (recipients.length === 0) {
    return logFailure("mail_transport_unavailable", "recipient_invalid");
  }

  for (const currentRecipient of recipients) {
    const recipientPolicy = evaluateRecipientPolicy(
      currentRecipient,
      emailDomain(currentRecipient),
      process.env,
    );
    if (recipientPolicy.allowed === false) {
      return logFailure("mail_transport_unavailable", recipientPolicy.category);
    }
  }

  if (!wantsSmtp) {
    return logFailure("mail_transport_unavailable", "smtp_unconfigured");
  }

  try {
    const envelope = resolveMailEnvelopeForRuntime();
    const mail = ensureTransactionalMail({
      locale: opts.locale,
      subject: opts.subject,
      preheader: opts.preheader,
      html: opts.html,
      text: opts.text,
    });

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
      from: envelope.from,
      replyTo: envelope.replyTo,
      to: recipients,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return {
      ok: true,
      transport: "smtp",
      messageId: typeof info?.messageId === "string" ? info.messageId : null,
    };
  } catch (error: unknown) {
    const category =
      error instanceof Error &&
      (error.name === "CriticalProductionWebRuntimeEnvError" ||
        error.message === "mail_cta_url_invalid")
        ? "sender_configuration_invalid"
        : classifyTransportError(error);
    return logFailure(
      "mail_transport_error",
      category,
      typeof (error as { messageId?: unknown })?.messageId === "string"
        ? String((error as { messageId: string }).messageId)
        : null,
    );
  }
}

function recipientsToArray(value: string | string[]) {
  return (Array.isArray(value) ? value : [value])
    .flatMap((entry) => entry.split(","))
    .map(normalizeEmail)
    .filter(Boolean);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function emailDomain(value: string) {
  return normalizeEmail(value).split("@")[1] ?? null;
}

function maskEmail(value: string) {
  const [name, domain] = normalizeEmail(value).split("@");
  if (!name || !domain) return "[invalid-email]";
  const head = name.slice(0, 2);
  return `${head}${name.length > 2 ? "***" : ""}@${domain}`;
}

function evaluateRecipientPolicy(
  recipient: string,
  domain: string | null,
  env: NodeJS.ProcessEnv,
): { allowed: true } | { allowed: false; category: MailFailureCategory } {
  if (!recipient || !EMAIL_PATTERN.test(recipient)) {
    return { allowed: false, category: "recipient_invalid" };
  }

  if (!domain) {
    return { allowed: false, category: "recipient_invalid" };
  }

  if (isReservedPlaceholderDomain(domain) || domain.endsWith(".invalid")) {
    return { allowed: false, category: "recipient_placeholder_domain" };
  }

  if (isBlockedTestDomain(domain, env)) {
    return { allowed: false, category: "recipient_test_domain_blocked" };
  }

  const explicitAllowlist = parseExplicitAllowlist(env.MAIL_ALLOWED_RECIPIENT_DOMAINS);
  if (explicitAllowlist && !explicitAllowlist.has(domain)) {
    return { allowed: false, category: "recipient_domain_not_allowed" };
  }

  return { allowed: true };
}

function isReservedPlaceholderDomain(domain: string) {
  for (const reserved of RESERVED_PLACEHOLDER_DOMAINS) {
    if (domain === reserved || domain.endsWith(`.${reserved}`)) {
      return true;
    }
  }
  return false;
}

function isBlockedTestDomain(domain: string, env: NodeJS.ProcessEnv) {
  const nodeEnv = String(env.NODE_ENV ?? "").toLowerCase();
  const isDevLike = nodeEnv === "test" || nodeEnv === "development";
  if (isDevLike) return false;
  return domain === "edebatte.test" || domain.endsWith(".test");
}

function parseExplicitAllowlist(value: string | undefined) {
  if (typeof value !== "string") return null;
  const entries = value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return entries.length > 0 ? new Set(entries) : null;
}

function classifyTransportError(error: unknown): MailFailureCategory {
  const code =
    typeof (error as { code?: unknown })?.code === "string"
      ? String((error as { code: string }).code).toUpperCase()
      : null;

  switch (code) {
    case "EAUTH":
      return "smtp_auth_error";
    case "ETIMEDOUT":
      return "smtp_timeout";
    case "ECONNECTION":
    case "ECONNREFUSED":
    case "ESOCKET":
    case "ENOTFOUND":
      return "smtp_connection_error";
    case "EENVELOPE":
    case "EMESSAGE":
      return "smtp_response_error";
    default:
      return typeof (error as { responseCode?: unknown })?.responseCode === "number"
        ? "smtp_response_error"
        : "smtp_unknown_error";
  }
}
