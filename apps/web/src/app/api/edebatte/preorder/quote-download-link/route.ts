import { NextRequest, NextResponse } from "next/server";
import { normalizePricingLocale } from "@features/pricing";
import { mailFailureMetadata, sendMail } from "@/utils/mailer";
import { renderTransactionalMail } from "@/utils/mailRenderer";
import { publicOrigin } from "@/utils/publicOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SALES_EMAIL = "sales@edebatte.org";

function firstString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isTrue(value: unknown) {
  return value === true;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeFilePart(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "quote";
}

type QuoteLine = {
  title: string;
  priceLabel: string;
};

function toQuoteLines(value: unknown): QuoteLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const title = firstString((entry as Record<string, unknown>).title);
      const priceLabel = firstString((entry as Record<string, unknown>).priceLabel);
      if (!title || !priceLabel) return null;
      return { title, priceLabel };
    })
    .filter((entry): entry is QuoteLine => Boolean(entry));
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const payload = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;

  const locale = normalizePricingLocale(firstString(payload.locale));
  const isEnglish = locale === "en";
  const segment = firstString(payload.segment);
  const packageId = firstString(payload.packageId);
  const packageLabel = firstString(payload.packageLabel);
  const packagePriceLabel = firstString(payload.packagePriceLabel);

  const organizationName = firstString(payload.organizationName);
  const contactPerson = firstString(payload.contactPerson);
  const phone = firstString(payload.phone);
  const email = firstString(payload.email).toLowerCase();

  const acceptedPrivacy = isTrue(payload.acceptedPrivacy);
  const acceptedContact = isTrue(payload.acceptedContact);

  if (!organizationName || !contactPerson || !phone || !email || !isEmail(email) || !acceptedPrivacy || !acceptedContact) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_required_fields",
        message: isEnglish
          ? "Required details or consents are still missing."
          : "Pflichtangaben oder Zustimmungen fehlen noch.",
      },
      { status: 400 },
    );
  }

  if (!packageId || !packageLabel || !packagePriceLabel) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_quote_payload",
        message: isEnglish ? "Quote payload is incomplete." : "Kostenvoranschlag-Daten sind unvollständig.",
      },
      { status: 400 },
    );
  }

  const selectedAddOns = toQuoteLines(payload.selectedAddOns);
  const recurringLines = toQuoteLines(payload.recurringLines);
  const variableLines = toQuoteLines(payload.variableLines);
  const monthlyTotalLabel = firstString(payload.monthlyTotalLabel) || (isEnglish ? "on request" : "auf Anfrage");

  const quoteLines = [
    isEnglish ? "eDebatte cost estimate (rough orientation)" : "eDebatte Kostenvoranschlag (grobe Orientierung)",
    "",
    `${isEnglish ? "Package" : "Paket"}: ${packageLabel}`,
    `${isEnglish ? "Price" : "Preis"}: ${packagePriceLabel}`,
    `${isEnglish ? "Segment" : "Segment"}: ${segment || (isEnglish ? "not specified" : "nicht angegeben")}`,
    "",
    `${isEnglish ? "Selected add-ons" : "Ausgewählte Add-ons"}:`,
    ...(selectedAddOns.length
      ? selectedAddOns.map((entry) => `- ${entry.title} (${entry.priceLabel})`)
      : [isEnglish ? "- none selected" : "- keine ausgewählt"]),
    "",
    `${isEnglish ? "Recurring positions" : "Monatlich planbare Positionen"}:`,
    ...(recurringLines.length
      ? recurringLines.map((entry) => `- ${entry.title}: ${entry.priceLabel}`)
      : [isEnglish ? "- none selected" : "- keine ausgewählt"]),
    "",
    `${isEnglish ? "Variable positions" : "Variable Positionen"}:`,
    ...(variableLines.length
      ? variableLines.map((entry) => `- ${entry.title}: ${entry.priceLabel}`)
      : [isEnglish ? "- none selected" : "- keine ausgewählt"]),
    "",
    `${isEnglish ? "Monthly total" : "Monatliche Summe"}: ${monthlyTotalLabel}`,
  ];

  const quoteText = quoteLines.join("\n");
  const encoded = Buffer.from(quoteText, "utf8").toString("base64url");
  if (encoded.length > 24_000) {
    return NextResponse.json(
      {
        ok: false,
        error: "quote_too_large",
        message: isEnglish ? "Quote output is too large." : "Kostenvoranschlag ist zu umfangreich.",
      },
      { status: 400 },
    );
  }

  const datePart = new Date().toISOString().slice(0, 10);
  const fileName = `edebatte-kostenvoranschlag-${sanitizeFilePart(packageId)}-${datePart}.txt`;
  const origin = publicOrigin().replace(/\/$/, "");
  const downloadLink = `${origin}/api/edebatte/preorder/quote-download?quote=${encodeURIComponent(encoded)}&name=${encodeURIComponent(fileName)}`;

  const userSubject = isEnglish
    ? "eDebatte – your cost estimate download link"
    : "eDebatte – dein Downloadlink zum Kostenvoranschlag";
  const userMail = renderTransactionalMail({
    locale,
    subject: userSubject,
    preheader: isEnglish
      ? "Your configured cost estimate is ready."
      : "Dein konfigurierter Kostenvoranschlag ist bereit.",
    title: isEnglish ? "Cost estimate ready" : "Kostenvoranschlag bereit",
    greeting: `${isEnglish ? "Hello" : "Hallo"} ${contactPerson},`,
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "Here is your download link for the configured cost estimate."
          : "Hier ist dein Downloadlink für den konfigurierten Kostenvoranschlag.",
      },
      {
        kind: "cta",
        label: isEnglish ? "Download cost estimate" : "Kostenvoranschlag herunterladen",
        url: downloadLink,
      },
      {
        kind: "notice",
        text: isEnglish
          ? "If your setup changes, create a new request from the order flow."
          : "Wenn sich euer Einsatzrahmen ändert, fordere bitte einen neuen Link im Bestellfluss an.",
      },
    ],
    reason: isEnglish
      ? "you requested a configured cost estimate."
      : "du einen konfigurierten Kostenvoranschlag angefordert hast.",
  });

  const internalSubject = isEnglish
    ? `Quote download link requested (${organizationName})`
    : `Downloadlink für Kostenvoranschlag angefordert (${organizationName})`;
  const internalMail = renderTransactionalMail({
    locale,
    subject: internalSubject,
    preheader: isEnglish
      ? "A cost estimate download link was requested."
      : "Ein Downloadlink für einen Kostenvoranschlag wurde angefordert.",
    title: isEnglish
      ? "Cost estimate link requested"
      : "Kostenvoranschlag-Link angefordert",
    blocks: [
      {
        kind: "details",
        rows: [
          {
            label: isEnglish ? "Organization" : "Organisation",
            value: organizationName,
          },
          {
            label: isEnglish ? "Contact person" : "Ansprechpartner",
            value: contactPerson,
          },
          { label: isEnglish ? "Phone" : "Telefon", value: phone },
          { label: "E-Mail", value: email },
          {
            label: isEnglish ? "Package" : "Paket",
            value: `${packageLabel} (${packagePriceLabel})`,
          },
          { label: "Segment", value: segment || "-" },
        ],
      },
      {
        kind: "cta",
        label: isEnglish ? "Open user download" : "Nutzer-Download öffnen",
        url: downloadLink,
      },
    ],
    reason: isEnglish
      ? "a cost estimate download link was requested."
      : "ein Downloadlink für einen Kostenvoranschlag angefordert wurde.",
  });

  const requesterDelivery = await sendMail({
    to: email,
    mail: userMail,
    delivery: "required_delivery",
    tag: "institutional_quote_download",
  });
  if (!requesterDelivery.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "mail_failed",
        delivery: mailFailureMetadata(requesterDelivery),
        message: isEnglish
          ? "Download link mail could not be sent."
          : "Downloadlink konnte per E-Mail nicht versendet werden.",
      },
      { status: 502 },
    );
  }

  await sendMail({
    to: SALES_EMAIL,
    mail: internalMail,
    delivery: "best_effort_delivery",
    tag: "institutional_quote_download_internal",
  });

  return NextResponse.json({
    ok: true,
    delivery: {
      status: requesterDelivery.status,
      attemptedCount: requesterDelivery.attemptedCount,
      deliveredCount: requesterDelivery.deliveredCount,
      failedCount: requesterDelivery.failedCount,
    },
    message: isEnglish
      ? "Download link requested. The email is sent separately."
      : "Downloadlink angefordert. Die E-Mail wird separat versendet.",
  });
}
