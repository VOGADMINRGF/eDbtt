export const CONSENT_COOKIE_NAME = "edb_consent";
export const LEGACY_CONSENT_COOKIE_NAME = "vog_consent";
export const CONSENT_LOCALSTORAGE_KEY = "edb_consent_choice";
export const PRIVACY_NOTICE_VERSION = "2026-05-privacy-v1";

const SIX_MONTHS_IN_SECONDS = 60 * 60 * 24 * 30 * 6;

export type PrivacyOptionalConsent = {
  comfort: boolean;
  analytics: boolean;
  externalMedia: boolean;
  productImprovement: boolean;
};

export type Consent = {
  privacyNoticeVersion: string;
  requiredNoticeAcknowledged: boolean;
  optional: PrivacyOptionalConsent;
  timestamp: string;
  source: string;
};

type LegacyConsent = {
  essential?: true;
  analytics?: boolean;
};

export function buildDefaultOptionalConsent(): PrivacyOptionalConsent {
  return {
    comfort: false,
    analytics: false,
    externalMedia: false,
    productImprovement: false,
  };
}

export function buildDefaultConsent(overrides?: Partial<Consent>): Consent {
  const base = {
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    requiredNoticeAcknowledged: false,
    timestamp: "",
    source: "privacy-gate",
    ...overrides,
  };

  return {
    privacyNoticeVersion: base.privacyNoticeVersion,
    requiredNoticeAcknowledged: base.requiredNoticeAcknowledged,
    timestamp: base.timestamp,
    source: base.source,
    optional: {
      ...buildDefaultOptionalConsent(),
      ...(overrides?.optional ?? {}),
    },
  };
}

function looksLikeCurrentConsent(value: unknown): value is Consent {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const optional = record.optional as Record<string, unknown> | undefined;
  return (
    typeof record.privacyNoticeVersion === "string" &&
    typeof record.requiredNoticeAcknowledged === "boolean" &&
    typeof record.timestamp === "string" &&
    typeof record.source === "string" &&
    typeof optional?.comfort === "boolean" &&
    typeof optional?.analytics === "boolean" &&
    typeof optional?.externalMedia === "boolean" &&
    typeof optional?.productImprovement === "boolean"
  );
}

function looksLikeLegacyConsent(value: unknown): value is LegacyConsent {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.analytics === "boolean";
}

export function normalizeConsent(value: unknown): Consent | null {
  if (looksLikeCurrentConsent(value)) {
    return buildDefaultConsent({
      privacyNoticeVersion: value.privacyNoticeVersion || PRIVACY_NOTICE_VERSION,
      requiredNoticeAcknowledged: value.requiredNoticeAcknowledged,
      optional: value.optional,
      timestamp: value.timestamp,
      source: value.source || "privacy-gate",
    });
  }

  if (looksLikeLegacyConsent(value)) {
    return buildDefaultConsent({
      optional: {
        ...buildDefaultOptionalConsent(),
        analytics: Boolean(value.analytics),
      },
      source: "cookie-banner-migrated",
    });
  }

  return null;
}

export function parseConsentCookie(rawValue?: string | null): Consent | null {
  if (!rawValue) return null;
  try {
    const decoded = decodeURIComponent(rawValue);
    return normalizeConsent(JSON.parse(decoded));
  } catch {
    return null;
  }
}

export function serializeConsent(consent: Consent): string {
  return encodeURIComponent(
    JSON.stringify({
      privacyNoticeVersion: consent.privacyNoticeVersion,
      requiredNoticeAcknowledged: consent.requiredNoticeAcknowledged,
      optional: {
        comfort: consent.optional.comfort,
        analytics: consent.optional.analytics,
        externalMedia: consent.optional.externalMedia,
        productImprovement: consent.optional.productImprovement,
      },
      timestamp: consent.timestamp,
      source: consent.source,
    }),
  );
}

export function buildConsentCookie(consent: Consent) {
  const value = serializeConsent(consent);
  const secure = typeof location !== "undefined" ? location.protocol === "https:" : true;
  return `${CONSENT_COOKIE_NAME}=${value}; Path=/; Max-Age=${SIX_MONTHS_IN_SECONDS}; SameSite=Lax;${
    secure ? " Secure" : ""
  }`;
}

export function hasRequiredPrivacyAcknowledgement(consent: Consent | null | undefined): boolean {
  if (!consent) return false;
  if (!consent.requiredNoticeAcknowledged) return false;
  return consent.privacyNoticeVersion === PRIVACY_NOTICE_VERSION;
}
