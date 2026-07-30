// apps/web/src/app/api/public/updates/confirm/route.ts
// Bestätigt Double-Opt-in und verschickt Willkommensmail.

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { Collection } from "mongodb";
import { coreCol } from "@core/db/triMongo";
import { sendMail } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";
import {
  renderTransactionalMail,
  resolveMailLocale,
} from "@/utils/mailRenderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriberStatus = "pending" | "active" | "unsubscribed";

type SubscriberDoc = {
  _id?: any;
  email: string;
  name: string | null;
  interests: string | null;
  locale: string | null;
  consentVersion: string;
  status: SubscriberStatus;
  confirmTokenHash?: string | null;
  confirmTokenExpiresAt?: Date | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const UPDATES_NOTIFY_TO = process.env.UPDATES_NOTIFY_TO;

function hashConfirmToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getPublicOrigin() {
  return publicOrigin().replace(/\/$/, "");
}

function getMembershipUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/pricing`;
}

function buildWelcomeMail(opts: {
  email: string;
  name?: string | null;
  origin: string;
  locale?: string | null;
}) {
  const { name, origin, locale } = opts;
  const isEnglish = resolveMailLocale(locale) === "en";
  const membershipUrl = getMembershipUrl(origin);
  return renderTransactionalMail({
    locale,
    subject: isEnglish
      ? "Your eDebatte updates are active"
      : "Deine eDebatte-Updates sind aktiv",
    preheader: isEnglish
      ? "Your subscription has been confirmed."
      : "Deine Anmeldung wurde bestätigt.",
    title: isEnglish ? "Updates confirmed" : "Updates bestätigt",
    greeting: name
      ? `${isEnglish ? "Hello" : "Hallo"} ${name},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "Your subscription to eDebatte updates has been confirmed."
          : "Deine Anmeldung für eDebatte-Updates wurde bestätigt.",
      },
      {
        kind: "paragraph",
        text: isEnglish
          ? "We will keep you informed about relevant developments and participation opportunities."
          : "Wir informieren dich über relevante Entwicklungen und Beteiligungsmöglichkeiten.",
      },
      {
        kind: "cta",
        label: isEnglish ? "View packages and support" : "Pakete und Unterstützung ansehen",
        url: membershipUrl,
      },
    ],
    reason: isEnglish
      ? "you confirmed your subscription to eDebatte updates."
      : "du deine Anmeldung für eDebatte-Updates bestätigt hast.",
  });
}

function buildInternalConfirmedMail(opts: { email: string; name?: string | null }) {
  const { email, name } = opts;
  const subject =
    "eDebatte-Updates: Anmeldung bestätigt (Double-Opt-in abgeschlossen)";
  return renderTransactionalMail({
    subject,
    preheader: "Eine Updates-Anmeldung wurde per Double-Opt-in bestätigt.",
    title: "Updates-Anmeldung bestätigt",
    blocks: [
      {
        kind: "details",
        rows: [
          { label: "E-Mail", value: email },
          { label: "Name", value: name || "—" },
          { label: "Status", value: "active" },
        ],
      },
    ],
    reason: "eine Updates-Anmeldung intern bestätigt wurde.",
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();

  if (!token || !email) {
    return NextResponse.json(
      { ok: false, error: "missing_params" },
      { status: 400 },
    );
  }

  const col = (await coreCol("public_updates_subscribers")) as Collection<SubscriberDoc>;
  const tokenHash = hashConfirmToken(token);
  const now = new Date();

  const doc = await col.findOne({
    email,
    confirmTokenHash: tokenHash,
    confirmTokenExpiresAt: { $gte: now },
  });

  if (!doc) {
    return NextResponse.json(
      { ok: false, error: "invalid_or_expired" },
      { status: 400 },
    );
  }

  await col.updateOne(
    { _id: doc._id },
    {
      $set: {
        status: "active" as SubscriberStatus,
        confirmedAt: now,
        updatedAt: now,
      },
      $unset: {
        confirmTokenHash: "",
        confirmTokenExpiresAt: "",
      },
    },
  );

  const origin = getPublicOrigin();

  // Willkommensmail an Abonnent:in
  const welcomeMail = buildWelcomeMail({
    email,
    name: doc.name,
    origin,
    locale: doc.locale,
  });
  await sendMail({
    to: email,
    mail: welcomeMail,
    delivery: "best_effort_delivery",
    tag: "updates_welcome",
  });

  // Info-Mail an updates@
  if (UPDATES_NOTIFY_TO) {
    const internalMail = buildInternalConfirmedMail({
      email,
      name: doc.name,
    });
    await sendMail({
      to: UPDATES_NOTIFY_TO,
      mail: internalMail,
      delivery: "best_effort_delivery",
      tag: "updates_internal_confirmed",
    });
  }

  // Zurück auf die Startseite (optional mit Marker-Query)
  const redirectUrl = `${origin}/?updates=confirmed`;
  return NextResponse.redirect(redirectUrl);
}
