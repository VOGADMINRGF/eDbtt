import sanitizeHtml from "sanitize-html";

export const DEFAULT_MAIL_LOCALE = "de";

export type MailLocale = "de" | "en";

const LEGACY_MAIL_HTML_TOKEN = Symbol("legacy-mail-html");

export type LegacyMailHtml = {
  readonly value: string;
  readonly [LEGACY_MAIL_HTML_TOKEN]: true;
};

export type TransactionalMail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  locale: MailLocale;
};

export type MailContentBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "details"; rows: Array<{ label: string; value: string }> }
  | { kind: "list"; items: string[] }
  | { kind: "code"; label?: string; value: string }
  | { kind: "cta"; label: string; url: string; fallbackLabel?: string }
  | { kind: "notice"; title?: string; text: string };

type TransactionalMailInput = {
  locale?: string | null;
  subject: string;
  preheader: string;
  title: string;
  greeting?: string | null;
  blocks: MailContentBlock[];
  reason: string;
};

type LegacyTransactionalMailInput = {
  locale?: string | null;
  subject: string;
  preheader?: string;
  html: LegacyMailHtml;
  text?: string;
  reason?: string;
};

type EnsuredTransactionalMailInput = Omit<
  LegacyTransactionalMailInput,
  "html"
> & {
  html: string;
};

const COPY = {
  de: {
    contact: "Fragen? Antworte einfach auf diese E-Mail oder schreibe an members@edebatte.org.",
    fallbackUrl: "Falls der Button nicht funktioniert, öffne diesen Link:",
    reasonPrefix: "Du erhältst diese Nachricht, weil",
    defaultReason: "ein Vorgang in deinem eDebatte-Konto eine Systemnachricht ausgelöst hat.",
  },
  en: {
    contact: "Questions? Reply to this email or write to members@edebatte.org.",
    fallbackUrl: "If the button does not work, open this link:",
    reasonPrefix: "You are receiving this message because",
    defaultReason: "an action in your eDebatte account triggered a system message.",
  },
} satisfies Record<MailLocale, Record<string, string>>;

const LEGACY_ALLOWED_TAGS = [
  "a",
  "br",
  "div",
  "h1",
  "h2",
  "h3",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
];

const LEGACY_ALLOWED_ATTRIBUTES = {
  "*": ["aria-label", "align", "style"],
  a: ["href", "rel", "target"],
  table: ["border", "cellpadding", "cellspacing", "role", "width"],
  td: ["colspan", "rowspan", "valign", "width"],
  th: ["colspan", "rowspan", "scope", "valign", "width"],
};

export function resolveMailLocale(locale?: string | null): MailLocale {
  const normalized = String(locale ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-");
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  return DEFAULT_MAIL_LOCALE;
}

export function mailLocaleFromUser(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const record = user as {
    locale?: unknown;
    preferredLocale?: unknown;
    profile?: { locale?: unknown } | null;
    settings?: {
      uiLocale?: unknown;
      preferredLocale?: unknown;
      readingLocale?: unknown;
    } | null;
  };
  const candidates = [
    record.settings?.uiLocale,
    record.settings?.preferredLocale,
    record.profile?.locale,
    record.preferredLocale,
    record.locale,
    record.settings?.readingLocale,
  ];
  const locale = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0,
  );
  return locale?.trim() ?? null;
}

export function escapeMailHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function legacyMailHtml(
  strings: TemplateStringsArray,
  ...values: unknown[]
): LegacyMailHtml {
  const value = strings.reduce((result, fragment, index) => {
    const interpolation =
      index < values.length ? renderLegacyMailInterpolation(values[index]) : "";
    return `${result}${fragment}${interpolation}`;
  }, "");

  return {
    value,
    [LEGACY_MAIL_HTML_TOKEN]: true,
  };
}

export function renderTransactionalMail(input: TransactionalMailInput): TransactionalMail {
  const locale = resolveMailLocale(input.locale);
  const copy = COPY[locale];
  const subject = normalizeMailHeader(input.subject);
  const preheader = normalizePlainText(input.preheader);
  const title = normalizePlainText(input.title);
  const greeting = normalizePlainText(input.greeting ?? "");
  const reason = normalizePlainText(input.reason);
  const renderedBlocks = input.blocks.map((block) => renderBlock(block, copy));

  const html = renderFrame({
    locale,
    preheader,
    title,
    greeting,
    bodyHtml: renderedBlocks.map((block) => block.html).join(""),
    reason,
  });
  const text = [
    greeting,
    title,
    ...renderedBlocks.map((block) => block.text),
    `${copy.reasonPrefix} ${reason}`,
    copy.contact,
    "eDebatte",
  ]
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { subject, preheader, html, text, locale };
}

export function renderLegacyTransactionalMail(
  input: LegacyTransactionalMailInput,
): TransactionalMail {
  const locale = resolveMailLocale(input.locale);
  const copy = COPY[locale];
  const subject = normalizeMailHeader(input.subject);
  const preheader = normalizePlainText(input.preheader ?? subject);
  const sanitizedFragment = sanitizeHtml(input.html.value, {
    allowedTags: LEGACY_ALLOWED_TAGS,
    allowedAttributes: LEGACY_ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (_tagName, attribs) => {
        const href = normalizeLegacyLink(attribs.href);
        if (!href) {
          return { tagName: "span", attribs: {} };
        }
        return {
          tagName: "a",
          attribs: {
            href,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        };
      },
    },
  });
  const reason = normalizePlainText(input.reason ?? copy.defaultReason);
  const text = normalizePlainText(input.text ?? htmlFragmentToText(sanitizedFragment));

  return {
    subject,
    preheader,
    locale,
    html: renderFrame({
      locale,
      preheader,
      title: subject,
      greeting: "",
      bodyHtml: sanitizedFragment,
      reason,
    }),
    text: [
      text,
      `${copy.reasonPrefix} ${reason}`,
      copy.contact,
      "eDebatte",
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim(),
  };
}

export function ensureTransactionalMail(
  input: EnsuredTransactionalMailInput,
): TransactionalMail {
  if (/<body\s+data-edebatte-mail="transactional"/i.test(input.html)) {
    return {
      subject: normalizeMailHeader(input.subject),
      preheader: normalizePlainText(input.preheader ?? input.subject),
      html: input.html,
      text: normalizePlainText(input.text ?? htmlFragmentToText(input.html)),
      locale: resolveMailLocale(input.locale),
    };
  }
  throw new Error("mail_html_not_transactional");
}

function renderBlock(
  block: MailContentBlock,
  copy: (typeof COPY)[MailLocale],
): { html: string; text: string } {
  switch (block.kind) {
    case "paragraph": {
      const text = normalizePlainText(block.text);
      return {
        html: `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#243247;">${escapeMailHtml(text)}</p>`,
        text,
      };
    }
    case "details": {
      const rows = block.rows.map(({ label, value }) => ({
        label: normalizePlainText(label),
        value: normalizePlainText(value),
      }));
      return {
        html: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 18px;border:1px solid #dbe4ee;border-radius:14px;background:#f7fafc;">${rows
          .map(
            ({ label, value }) =>
              `<tr><th scope="row" align="left" style="padding:10px 14px;font-size:13px;font-weight:600;color:#5b6b7f;border-bottom:1px solid #e8eef4;">${escapeMailHtml(label)}</th><td align="right" style="padding:10px 14px;font-size:14px;font-weight:600;color:#17243a;border-bottom:1px solid #e8eef4;">${escapeMailHtml(value)}</td></tr>`,
          )
          .join("")}</table>`,
        text: rows.map(({ label, value }) => `${label}: ${value}`).join("\n"),
      };
    }
    case "list": {
      const items = block.items.map(normalizePlainText);
      return {
        html: `<ul style="margin:0 0 18px;padding-left:22px;font-size:15px;line-height:1.6;color:#243247;">${items
          .map((item) => `<li style="margin:0 0 6px;">${escapeMailHtml(item)}</li>`)
          .join("")}</ul>`,
        text: items.map((item) => `- ${item}`).join("\n"),
      };
    }
    case "code": {
      const label = normalizePlainText(block.label ?? "");
      const value = normalizePlainText(block.value);
      return {
        html: `${label ? `<p style="margin:0 0 8px;font-size:14px;color:#5b6b7f;">${escapeMailHtml(label)}</p>` : ""}<div role="text" style="margin:0 0 18px;padding:16px;border:1px solid #b9d6ee;border-radius:12px;background:#eef8ff;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:28px;font-weight:700;letter-spacing:4px;color:#10233e;">${escapeMailHtml(value)}</div>`,
        text: label ? `${label}\n${value}` : value,
      };
    }
    case "cta": {
      const label = normalizePlainText(block.label);
      const fallbackLabel = normalizePlainText(block.fallbackLabel ?? copy.fallbackUrl);
      const url = normalizeHttpUrl(block.url);
      return {
        html: `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:4px 0 18px;"><tr><td style="border-radius:10px;background:#0c6ea8;"><a href="${escapeMailHtml(url)}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;">${escapeMailHtml(label)}</a></td></tr></table><p style="margin:0 0 18px;font-size:12px;line-height:1.5;color:#68788d;">${escapeMailHtml(fallbackLabel)}<br><a href="${escapeMailHtml(url)}" style="color:#0c6ea8;text-decoration:underline;">${escapeMailHtml(safeDisplayUrl(url))}</a></p>`,
        text: `${label}: ${url}`,
      };
    }
    case "notice": {
      const title = normalizePlainText(block.title ?? "");
      const text = normalizePlainText(block.text);
      return {
        html: `<div style="margin:0 0 18px;padding:14px 16px;border-left:4px solid #df9b27;background:#fff8e8;color:#3f3523;">${title ? `<p style="margin:0 0 4px;font-size:14px;font-weight:700;">${escapeMailHtml(title)}</p>` : ""}<p style="margin:0;font-size:14px;line-height:1.55;">${escapeMailHtml(text)}</p></div>`,
        text: title ? `${title}: ${text}` : text,
      };
    }
  }
}

function renderFrame(input: {
  locale: MailLocale;
  preheader: string;
  title: string;
  greeting: string;
  bodyHtml: string;
  reason: string;
}) {
  const copy = COPY[input.locale];
  return `<!doctype html>
<html lang="${input.locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${escapeMailHtml(input.title)}</title>
  </head>
  <body data-edebatte-mail="transactional" style="margin:0;padding:0;background:#eef3f7;color:#17243a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeMailHtml(input.preheader)}</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#eef3f7;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="620" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:620px;border:1px solid #dbe4ee;border-radius:18px;background:#ffffff;overflow:hidden;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
            <tr>
              <td style="padding:24px 28px;background:#10233e;color:#ffffff;">
                <div style="font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#9ed5f2;">eDebatte</div>
                <div style="margin-top:7px;font-size:22px;font-weight:700;line-height:1.25;color:#ffffff;">${escapeMailHtml(input.title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${input.greeting ? `<p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#17243a;">${escapeMailHtml(input.greeting)}</p>` : ""}
                ${input.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid #dbe4ee;background:#f7fafc;font-size:12px;line-height:1.55;color:#5b6b7f;">
                <p style="margin:0 0 8px;">${escapeMailHtml(copy.reasonPrefix)} ${escapeMailHtml(input.reason)}</p>
                <p style="margin:0 0 8px;">${escapeMailHtml(copy.contact)}</p>
                <p style="margin:0;font-weight:700;color:#17243a;">eDebatte · members@edebatte.org</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderLegacyMailInterpolation(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    LEGACY_MAIL_HTML_TOKEN in value &&
    (value as LegacyMailHtml)[LEGACY_MAIL_HTML_TOKEN] === true
  ) {
    return (value as LegacyMailHtml).value;
  }
  if (Array.isArray(value)) {
    return value.map(renderLegacyMailInterpolation).join("");
  }
  if (value === null || value === undefined || value === false) {
    return "";
  }
  return escapeMailHtml(value);
}

function normalizeLegacyLink(value: string | undefined): string | null {
  const href = String(value ?? "").trim();
  if (!href || href.startsWith("//")) return null;

  if (href.toLowerCase().startsWith("mailto:")) {
    const address = href.slice("mailto:".length);
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)
      ? `mailto:${address}`
      : null;
  }

  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeMailHeader(value: string) {
  return normalizePlainText(value).replace(/[\r\n]+/g, " ").slice(0, 300);
}

function normalizePlainText(value: string) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replaceAll(String.fromCharCode(0), "")
    .trim();
}

function normalizeHttpUrl(value: string) {
  const url = new URL(String(value).trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("mail_cta_url_invalid");
  }
  return url.toString();
}

function safeDisplayUrl(value: string) {
  const url = new URL(value);
  return `${url.origin}${url.pathname}`;
}

function htmlFragmentToText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .trim();
}
