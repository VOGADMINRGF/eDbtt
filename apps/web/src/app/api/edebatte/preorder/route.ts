import { NextRequest, NextResponse } from "next/server";
import { createPreorderLead } from "@features/pricing/usecases/createPreorderLead";
import {
  normalizePackageId,
  normalizePricingLocale,
  resolvePricingSegmentForPackage,
  type PricingLocale,
  type PricingSegmentId,
} from "@features/pricing";
import { ObjectId, coreCol, piiCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";
import { sendMail as sendMailInternal } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";
import { buildEdebatePreorderMail } from "@/utils/emailTemplates";
import { incrementRateLimit } from "@/lib/security/rate-limit";
import { verifyHumanTokenDetailed } from "@/lib/security/human-token";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes
const MIN_FILL_MS = 2000;
const MAX_FILL_MS = 2 * 60 * 60 * 1000;

type IdentitySnapshot = {
  emailVerified: boolean;
  birthDate: string | null;
  ageYears: number | null;
  bankVerified: boolean;
  microTransferAttempts: number;
  paymentHolderName: string | null;
  totpEnabled: boolean;
};

function firstString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isAccepted(value: unknown) {
  return value === true;
}

function hashedClientKey(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ua = req.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

function parseBirthDate(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateAgeYears(birthDateIso?: string | null) {
  const birthDate = parseBirthDate(birthDateIso);
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

function sanitizeInternalRoute(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

function buildContinueRoute(args: {
  segment: PricingSegmentId | null;
  packageId: string | null;
  locale: PricingLocale;
}) {
  const params = new URLSearchParams();
  if (args.segment) params.set("segment", args.segment);
  if (args.packageId) params.set("paket", args.packageId);
  if (args.locale === "en") params.set("lang", "en");
  const query = params.toString();
  return query ? `/order?${query}` : "/order";
}

function buildRouteWithNext(path: string, nextRoute: string) {
  const safePath = sanitizeInternalRoute(path) || path;
  const params = new URLSearchParams({ next: nextRoute });
  const sep = safePath.includes("?") ? "&" : "?";
  return `${safePath}${sep}${params.toString()}`;
}

function normalizeCompareName(value?: string | null) {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9äöüß ]/gi, "");
}

function mapGateErrorToStatus(error: string) {
  if (error === "account_required") return 401;
  if (error === "totp_required") return 428;
  if (error === "rate_limited") return 429;
  if (error === "invalid_input") return 400;
  return 409;
}

async function loadIdentitySnapshot(userId: string): Promise<IdentitySnapshot | null> {
  if (!ObjectId.isValid(userId)) return null;
  const oid = new ObjectId(userId);

  const [userDoc, piiProfileDoc, paymentProfileDoc, credentialsDoc] = await Promise.all([
    coreCol("users").then((Users) =>
      Users.findOne(
        { _id: oid },
        { projection: { verifiedEmail: 1, emailVerified: 1, verification: 1 } },
      ),
    ),
    piiCol("user_profiles").then((Profiles) =>
      Profiles.findOne({ userId: oid }, { projection: { "personal.birthDate": 1 } }),
    ),
    piiCol("user_payment_profiles").then((Profiles) =>
      Profiles.findOne(
        { userId: oid },
        { projection: { microTransferVerifiedAt: 1, microTransferAttempts: 1, holderName: 1, billingName: 1 } },
      ),
    ),
    piiCol("user_credentials").then((Credentials) =>
      Credentials.findOne(
        { coreUserId: oid },
        { projection: { twoFactorEnabled: 1, otpSecret: 1, twoFactorMethod: 1 } },
      ),
    ),
  ]);

  if (!userDoc) return null;

  const birthDate = firstString((piiProfileDoc as any)?.personal?.birthDate);
  const ageYears = calculateAgeYears(birthDate);
  const bankVerified = Boolean((paymentProfileDoc as any)?.microTransferVerifiedAt);
  const microTransferAttempts = Number((paymentProfileDoc as any)?.microTransferAttempts ?? 0) || 0;
  const paymentHolderName =
    firstString((paymentProfileDoc as any)?.holderName) || firstString((paymentProfileDoc as any)?.billingName);
  const totpEnabled =
    Boolean((credentialsDoc as any)?.twoFactorEnabled) ||
    Boolean((credentialsDoc as any)?.otpSecret) ||
    Boolean((userDoc as any)?.verification?.twoFA?.enabled);

  return {
    emailVerified: Boolean((userDoc as any)?.verifiedEmail ?? (userDoc as any)?.emailVerified),
    birthDate: birthDate || null,
    ageYears,
    bankVerified,
    microTransferAttempts,
    paymentHolderName: paymentHolderName || null,
    totpEnabled,
  };
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const payload = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  const session = await readSession();
  const locale = normalizePricingLocale(firstString(payload.locale));

  const packageInput = firstString(payload.packageId) || firstString(payload.package);
  const normalizedPackage = normalizePackageId(packageInput);
  const segment = normalizedPackage ? resolvePricingSegmentForPackage(normalizedPackage) : null;
  const continueRoute = buildContinueRoute({
    segment,
    packageId: normalizedPackage,
    locale,
  });

  const honeypot = firstString(payload.hp_preorder);
  if (honeypot && honeypot.trim().length > 0) {
    return NextResponse.json({ ok: false, error: "invalid_input", status: "human_review_required" }, { status: 400 });
  }

  const formStartedAt = Number(payload.formStartedAt ?? 0);
  if (Number.isFinite(formStartedAt) && formStartedAt > 0) {
    const durationMs = Date.now() - formStartedAt;
    if (durationMs < MIN_FILL_MS || durationMs > MAX_FILL_MS) {
      return NextResponse.json({ ok: false, error: "invalid_input", status: "human_review_required" }, { status: 400 });
    }
  }

  const rateAttempts = await incrementRateLimit(`pricing-preorder:${hashedClientKey(req)}`, RATE_LIMIT_WINDOW);
  if (rateAttempts > RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        status: "human_review_required",
        message:
          locale === "en"
            ? "Too many attempts from this context. Please try again later."
            : "Zu viele Versuche aus diesem Kontext. Bitte später erneut versuchen.",
      },
      { status: 429 },
    );
  }

  const humanToken = firstString(payload.humanToken);
  if (!humanToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "human_token_invalid",
        status: "human_review_required",
        message:
          locale === "en"
            ? "Please complete the security confirmation before submitting an order."
            : "Bitte den Sicherheitscheck vor dem Absenden bestätigen.",
      },
      { status: 400 },
    );
  }

  const humanCheck = await verifyHumanTokenDetailed(humanToken);
  if (!humanCheck.ok) {
    const code = "code" in humanCheck ? humanCheck.code : "invalid";
    return NextResponse.json(
      {
        ok: false,
        error: code === "expired" ? "human_token_expired" : "human_token_invalid",
        status: "human_review_required",
        message:
          locale === "en"
            ? code === "expired"
              ? "Security confirmation expired. Please confirm again."
              : "Security confirmation invalid. Please confirm again."
            : code === "expired"
              ? "Sicherheitscheck abgelaufen. Bitte erneut bestätigen."
              : "Sicherheitscheck ungültig. Bitte erneut bestätigen.",
      },
      { status: 400 },
    );
  }
  if (humanCheck.payload.formId !== "edebatte-preorder") {
    const code = "invalid";
    return NextResponse.json(
      {
        ok: false,
        error: "human_token_invalid",
        status: "human_review_required",
        message:
          locale === "en"
            ? "Security confirmation invalid. Please confirm again."
            : "Sicherheitscheck ungültig. Bitte erneut bestätigen.",
      },
      { status: 400 },
    );
  }

  const acceptedPrivacy = isAccepted(payload.acceptedPrivacy);
  const acceptedTerms = isAccepted(payload.acceptedTerms);
  const acceptedContact = isAccepted(payload.acceptedContact);
  if (!acceptedPrivacy || !acceptedTerms || !acceptedContact) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_input",
        status: "human_review_required",
        message:
          locale === "en"
            ? "Please confirm privacy, terms and contact consent before submitting."
            : "Bitte Datenschutz, AGB und Kontaktzustimmung vor dem Absenden bestätigen.",
      },
      { status: 400 },
    );
  }

  const userId = session?.uid ?? null;
  if (!userId) {
    const registryRoute = buildRouteWithNext(locale === "en" ? "/registry?lang=en" : "/registry", continueRoute);
    return NextResponse.json(
      {
        ok: false,
        error: "account_required",
        status: "account_required",
        message:
          locale === "en"
            ? "To submit an order, complete account and registry first."
            : "Für eine Bestellung bitte zuerst Konto und Registry abschließen.",
        nextStep: {
          route: registryRoute,
          label: locale === "en" ? "Complete registry" : "Registry vervollständigen",
        },
      },
      { status: 401 },
    );
  }

  const snapshot = await loadIdentitySnapshot(userId);
  if (!snapshot?.emailVerified) {
    const identityRoute = buildRouteWithNext(
      locale === "en" ? "/register/identity?lang=en" : "/register/identity",
      continueRoute,
    );
    return NextResponse.json(
      {
        ok: false,
        error: "registry_incomplete",
        status: "registry_incomplete",
        message:
          locale === "en"
            ? "Please complete identity confirmation before submitting this order."
            : "Bitte Identitätsbestätigung vor der Bestellung abschließen.",
        nextStep: {
          route: identityRoute,
          label: locale === "en" ? "Complete verification" : "Verifikation abschließen",
        },
      },
      { status: 409 },
    );
  }

  if (!normalizedPackage || !segment) {
    return NextResponse.json({ ok: false, error: "unknown_plan", status: "package_selected" }, { status: 400 });
  }

  const isB2C = segment === "privat" || segment === "journalismus";
  if (isB2C && !snapshot.birthDate) {
    const registryRoute = buildRouteWithNext(locale === "en" ? "/registry?lang=en" : "/registry", continueRoute);
    return NextResponse.json(
      {
        ok: false,
        error: "registry_incomplete",
        status: "registry_incomplete",
        message:
          locale === "en"
            ? "Birth date is required before age-based pricing can be finalized."
            : "Geburtsdatum ist Pflicht, bevor altersbasierte Tarife final gelten.",
        nextStep: {
          route: registryRoute,
          label: locale === "en" ? "Complete registry data" : "Registry-Daten ergänzen",
        },
      },
      { status: 409 },
    );
  }

  if (isB2C && snapshot.ageYears !== null && snapshot.ageYears < 14) {
    return NextResponse.json(
      {
        ok: false,
        error: "human_review_required",
        status: "human_review_required",
        message:
          locale === "en"
            ? "This order requires manual review before it can continue."
            : "Diese Bestellung benötigt eine manuelle Prüfung, bevor sie fortgeführt werden kann.",
      },
      { status: 409 },
    );
  }

  if (isB2C && !snapshot.bankVerified) {
    const paymentRoute = buildRouteWithNext(locale === "en" ? "/account/payment?lang=en" : "/account/payment", continueRoute);
    return NextResponse.json(
      {
        ok: false,
        error: "bank_verification_pending",
        status: "bank_verification_pending",
        message:
          locale === "en"
            ? "Bank verification is required before B2C order activation."
            : "Bankverifikation ist vor B2C-Aktivierung verpflichtend.",
        nextStep: {
          route: paymentRoute,
          label: locale === "en" ? "Verify bank account" : "Bankkonto verifizieren",
        },
      },
      { status: 409 },
    );
  }

  const requiresTotp = segment === "organisationen" || segment === "kommunen" || isB2C;
  if (requiresTotp && !snapshot.totpEnabled) {
    const identityRoute = buildRouteWithNext(
      locale === "en" ? "/register/identity?lang=en" : "/register/identity",
      continueRoute,
    );
    return NextResponse.json(
      {
        ok: false,
        error: "totp_required",
        status: "totp_required",
        message:
          locale === "en"
            ? "Authenticator verification (TOTP) is required before activation."
            : "Authenticator-Verifikation (TOTP) ist vor Aktivierung erforderlich.",
        nextStep: {
          route: identityRoute,
          label: locale === "en" ? "Set up authenticator" : "Authenticator einrichten",
        },
      },
      { status: 428 },
    );
  }

  const reviewReasons: string[] = [];
  if (snapshot.ageYears !== null && snapshot.ageYears >= 14 && snapshot.ageYears <= 17) {
    reviewReasons.push(
      locale === "en"
        ? "Minor account (14-17): activation is internally reviewed."
        : "Minderjähriges Konto (14-17): Aktivierung wird intern geprüft.",
    );
  }
  if (snapshot.microTransferAttempts >= 3) {
    reviewReasons.push(
      locale === "en"
        ? "Multiple failed bank verification attempts: activation is internally reviewed."
        : "Mehrfache Fehlversuche bei der Bankverifikation: Aktivierung wird intern geprüft.",
    );
  }
  const providedName = normalizeCompareName(firstString(payload.name));
  const holderName = normalizeCompareName(snapshot.paymentHolderName);
  if (providedName && holderName && providedName !== holderName) {
    reviewReasons.push(
      locale === "en"
        ? "Payer identity mismatch: activation is internally reviewed."
        : "Abweichender Kontoinhaber: Aktivierung wird intern geprüft.",
    );
  }
  if (rateAttempts >= RATE_LIMIT_MAX - 1) {
    reviewReasons.push(
      locale === "en"
        ? "High request frequency: activation is internally reviewed."
        : "Auffällige Anfragehäufung: Aktivierung wird intern geprüft.",
    );
  }

  const forceInternalReview = reviewReasons.length > 0;

  const result = await createPreorderLead(
    json ?? {},
    {
      userId,
      initialStatusOverride: forceInternalReview ? "under_review" : null,
      publicSummaryNotes: reviewReasons,
      internalReviewNote: forceInternalReview ? reviewReasons.join(" | ") : null,
    },
    {
      sendMail: async ({ to, subject, html, text }) => {
        await sendMailInternal({ to, subject, html, text });
      },
      publicOrigin,
      buildConfirmationMail: buildEdebatePreorderMail,
    },
  );

  if (!result.ok) {
    const error = "error" in result ? result.error : "invalid_input";
    return NextResponse.json({ ok: false, error, status: error }, { status: mapGateErrorToStatus(error) });
  }

  return NextResponse.json({
    ok: true,
    mailSent: result.mailSent,
    orderId: result.orderId,
    status: result.status,
    requiresReview: result.requiresReview,
    progressStatus: forceInternalReview ? "human_review_required" : "order_submitted",
  });
}
