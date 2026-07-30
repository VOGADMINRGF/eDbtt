import { BRAND } from "@/lib/brand";
import { publicOrigin } from "@/utils/publicOrigin";
import { sendMail as sendCanonicalMail } from "@/utils/mailer";

type Mail = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};
type AlertItem = { name: string; error?: string; ms?: number };
type AlertMail = {
  to: string | string[];
  title: string;
  severity?: "info" | "warn" | "error";
  items?: AlertItem[];
  linkHref?: string; // z.B. "/admin/system"
  linkLabel?: string; // z.B. "Systemübersicht öffnen"
  note?: string; // freie Zusatzzeile
};
const PUBLIC_BASE = publicOrigin() || BRAND.baseUrl || "http://localhost:3000";

/**
 * Backward-compatible facade for the canonical mailer.
 */
export async function sendMail({ to, subject, html, text }: Mail) {
  return sendCanonicalMail({
    to,
    subject,
    html,
    text: text ?? htmlToText(html),
    tag: "legacy_email_facade",
  });
}

/**
 * Kurzer Helper für Alert-Mails (z.B. Monitoring).
 */
export async function sendAlertEmail({
  to,
  title,
  severity = "error",
  items = [],
  linkHref = "/admin/system",
  linkLabel = "Systemübersicht öffnen",
  note,
}: AlertMail) {
  const subject = `[eDebatte Alert] ${title}`;
  const html = renderAlertHtml({
    title,
    severity,
    items,
    linkHref,
    linkLabel,
    note,
  });
  const text = renderAlertText({
    title,
    severity,
    items,
    linkHref,
    linkLabel,
    note,
  });
  return sendMail({ to, subject, html, text });
}

// ---------- Render-Helfer ----------

function badgeColor(sev: "info" | "warn" | "error") {
  switch (sev) {
    case "info":
      return "#2563eb"; // blau
    case "warn":
      return "#d97706"; // orange
    default:
      return "#dc2626"; // rot
  }
}

function renderAlertHtml(params: {
  title: string;
  severity: "info" | "warn" | "error";
  items: AlertItem[];
  linkHref: string;
  linkLabel: string;
  note?: string;
}) {
  const { title, severity, items, linkHref, linkLabel, note } = params;
  const abs = toAbsolute(linkHref);
  const color = badgeColor(severity);

  const rows =
    items.length === 0
      ? `<tr><td style="padding:8px 0;color:#111827;font-size:14px;">(keine Details)</td></tr>`
      : items
          .map(
            (it) => `
            <tr>
              <td style="padding:6px 0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;">
                <strong>${escapeHtml(it.name)}</strong>
                ${it.ms ? `<span style="opacity:.6">(${it.ms} ms)</span>` : ""}
                ${it.error ? `<div style="color:#dc2626;margin-top:2px;">${escapeHtml(it.error)}</div>` : ""}
              </td>
            </tr>`,
          )
          .join("");

  return `
  <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.45;color:#111827;">
    <div style="font-size:16px;">
      <span style="display:inline-block;padding:2px 8px;border-radius:9999px;background:${color};color:#fff;font-weight:600;margin-right:8px;">
        ${severity.toUpperCase()}
      </span>
      <strong>${escapeHtml(title)}</strong>
    </div>
    ${note ? `<p style="margin:12px 0 0;">${escapeHtml(note)}</p>` : ""}
    <table role="presentation" style="margin-top:14px;border-collapse:collapse;">
      ${rows}
    </table>
    <p style="margin-top:16px;">
      <a href="${abs}" style="display:inline-block;padding:8px 12px;background:#111827;color:#fff;border-radius:8px;text-decoration:none;">
        ${escapeHtml(linkLabel)}
      </a>
    </p>
    <p style="margin-top:8px;font-size:12px;opacity:.7;">${abs}</p>
  </div>
  `;
}

function renderAlertText(params: {
  title: string;
  severity: "info" | "warn" | "error";
  items: AlertItem[];
  linkHref: string;
  linkLabel: string;
  note?: string;
}) {
  const { title, severity, items, linkHref, linkLabel, note } = params;
  const abs = toAbsolute(linkHref);

  const lines = [
    `[${severity.toUpperCase()}] ${title}`,
    note ? note : "",
    "",
    ...(items.length
      ? items.map(
          (it) =>
            `- ${it.name}${it.ms ? ` (${it.ms} ms)` : ""}${it.error ? ` — ${it.error}` : ""}`,
        )
      : ["(keine Details)"]),
    "",
    `${linkLabel}: ${abs}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function toAbsolute(href: string) {
  if (!href) return PUBLIC_BASE;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return `${PUBLIC_BASE.replace(/\/+$/, "")}${href.startsWith("/") ? "" : "/"}${href}`;
}

function htmlToText(html: string) {
  // super simpler Fallback – ausreichend für Alerts
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Öffentliche Links für Mails
export function verificationEmailLink(token: string) {
  return `${PUBLIC_BASE}/verify?token=${encodeURIComponent(token)}`;
}

export function resetEmailLink(token: string) {
  return `${PUBLIC_BASE}/reset?token=${encodeURIComponent(token)}`;
}
