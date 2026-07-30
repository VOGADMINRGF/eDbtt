import { BRAND } from "@/lib/brand";
import { publicOrigin } from "@/utils/publicOrigin";
import { sendMail as sendCanonicalMail } from "@/utils/mailer";
import { renderTransactionalMail } from "@/utils/mailRenderer";

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
  const mail = renderTransactionalMail({
    subject,
    preheader: `${severity.toUpperCase()}: ${title}`,
    title: "Systemhinweis",
    blocks: [
      {
        kind: "notice",
        title: `${severity.toUpperCase()}: ${title}`,
        text: note || "Ein interner Systemhinweis wurde ausgelöst.",
      },
      {
        kind: "details",
        rows:
          items.length > 0
            ? items.map((item) => ({
                label: item.name,
                value: [
                  typeof item.ms === "number" ? `${item.ms} ms` : "",
                  item.error || "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "ohne Details",
              }))
            : [{ label: "Details", value: "keine Details" }],
      },
      {
        kind: "cta",
        label: linkLabel,
        url: toAbsolute(linkHref),
      },
    ],
    reason: "ein interner eDebatte-Systemhinweis ausgelöst wurde.",
  });
  return sendCanonicalMail({
    to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    tag: "admin_alert",
  });
}

function toAbsolute(href: string) {
  if (!href) return PUBLIC_BASE;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return `${PUBLIC_BASE.replace(/\/+$/, "")}${href.startsWith("/") ? "" : "/"}${href}`;
}

// Öffentliche Links für Mails
export function verificationEmailLink(token: string) {
  return `${PUBLIC_BASE}/verify?token=${encodeURIComponent(token)}`;
}

export function resetEmailLink(token: string) {
  return `${PUBLIC_BASE}/reset?token=${encodeURIComponent(token)}`;
}
