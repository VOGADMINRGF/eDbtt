import {
  MAX_INTERNAL_NAVIGATION_TARGET_LENGTH,
  validateSameOriginNavigationTarget,
  type InternalNavigationFailureReason,
  type InternalRedirectPath,
} from "@/lib/security/internalNavigation";
import { publicOrigin } from "@/utils/publicOrigin";

export const STUDIO_PATH = "/studio" as const;
export const LEGACY_QR_STUDIO_PATH = "/qr-studio" as const;
export const PUBLIC_QR_PATH = "/qr" as const;
export const MAX_QR_TARGET_LENGTH = MAX_INTERNAL_NAVIGATION_TARGET_LENGTH;

/**
 * Compatibility export for existing callers. The canonical operator surface is
 * now `/studio`; `/qr-studio` remains a redirect-only legacy route.
 */
export const QR_STUDIO_PATH = STUDIO_PATH;

const BLOCKED_PATH_PREFIXES = ["/admin", "/api", "/_next"] as const;
const REDIRECT_PARAM_NAMES = new Set([
  "redirect",
  "redirectto",
  "target",
  "destination",
  "returnto",
  "next",
  "shareurl",
]);
const SENSITIVE_PARAM_NAMES = new Set([
  "password",
  "passwd",
  "passcode",
  "token",
  "resettoken",
  "verifytoken",
  "verificationtoken",
  "session",
  "sessionid",
  "sid",
  "jwt",
  "secret",
  "apikey",
  "apikeyid",
  "accesskey",
  "email",
  "mail",
  "iban",
  "bic",
  "cardnumber",
  "paymentintent",
  "preview",
  "previewsecret",
]);
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu;
const JWT_RE = /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/;
const QR_CODE_RE = /^[A-Za-z0-9:_-]{1,160}$/;

export type QrTargetKind = "internal" | "external";

export type ValidatedQrTarget = {
  kind: QrTargetKind;
  normalizedTarget: string;
  absoluteTarget: string;
  host: string | null;
};

export type QrTargetValidationResult =
  | { ok: true; value: ValidatedQrTarget }
  | {
      ok: false;
      reason: QrTargetValidationFailureReason;
      message: string;
    };

export type QrTargetValidationFailureReason =
  | InternalNavigationFailureReason
  | "local_target_not_allowed"
  | "blocked_path"
  | "nested_redirect_parameter"
  | "sensitive_query_parameter";

type ValidateQrTargetOptions = {
  expectedOrigin?: string;
  allowLocalHttp?: boolean;
  allowLocalHosts?: boolean;
};

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeParamName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isLocalHostname(host: string) {
  const normalized = host.toLowerCase();
  return normalized === "localhost" || normalized.endsWith(".local");
}

function isPrivateIpv4(host: string) {
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) return false;
  if (octets[0] === 10 || octets[0] === 127 || octets[0] === 0) return true;
  if (octets[0] === 169 && octets[1] === 254) return true;
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
  if (octets[0] === 192 && octets[1] === 168) return true;
  return false;
}

function containsSensitiveValue(value: string) {
  return EMAIL_RE.test(value) || JWT_RE.test(value);
}

function isBlockedPath(pathname: string) {
  return BLOCKED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function inspectQuery(
  searchParams: URLSearchParams,
): { reason: QrTargetValidationFailureReason; message: string } | null {
  for (const [rawKey, rawValue] of searchParams.entries()) {
    const key = normalizeParamName(rawKey);
    if (REDIRECT_PARAM_NAMES.has(key)) {
      return {
        reason: "nested_redirect_parameter",
        message: "Verschachtelte Redirect-Parameter sind im öffentlichen QR-Ziel nicht erlaubt.",
      };
    }
    if (
      SENSITIVE_PARAM_NAMES.has(key) ||
      key.endsWith("token") ||
      key.endsWith("secret") ||
      key.endsWith("password") ||
      key.endsWith("session") ||
      key.endsWith("jwt") ||
      key.endsWith("email")
    ) {
      return {
        reason: "sensitive_query_parameter",
        message: "QR-Ziele dürfen keine sensiblen Query-Parameter enthalten.",
      };
    }
    if (containsSensitiveValue(rawValue)) {
      return {
        reason: "sensitive_query_parameter",
        message: "QR-Ziele dürfen keine sensiblen Identifikatoren oder Token enthalten.",
      };
    }
  }
  return null;
}

function failure(
  reason: QrTargetValidationFailureReason,
  message: string,
): QrTargetValidationResult {
  return { ok: false, reason, message };
}

function resolveExpectedOrigin(value?: string): string | null {
  try {
    const parsed = new URL(value ?? publicOrigin());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function internalFailureMessage(reason: InternalNavigationFailureReason): string {
  switch (reason) {
    case "empty":
    case "invalid_type":
      return "Es wurde kein QR-Ziel übergeben.";
    case "too_long":
      return "Das QR-Ziel überschreitet die erlaubte Länge.";
    case "unsafe_character":
      return "Das QR-Ziel enthält nicht erlaubte Steuer- oder Trennzeichen.";
    case "network_path_not_allowed":
      return "Protocol-relative Netzwerkpfade sind im QR-Ziel nicht erlaubt.";
    case "malformed_encoding":
    case "encoding_depth_exceeded":
      return "Das QR-Ziel enthält keine zulässige eindeutige Encodierung.";
    case "origin_not_allowed":
      return "Das QR-Ziel verlässt die erwartete öffentliche Origin.";
    case "unsafe_scheme":
      return "Das Schema des QR-Ziels ist nicht erlaubt.";
    case "credentials_not_allowed":
      return "QR-Ziele mit eingebetteten Zugangsdaten sind nicht erlaubt.";
    case "surrounding_whitespace":
    case "not_internal_path":
    case "invalid_origin":
    case "invalid_url":
    case "non_canonical":
      return "Das QR-Ziel ist kein unveränderter sicherer Navigationspfad.";
  }
}

function inspectDecodedLayers(
  decodedLayers: readonly string[],
  expectedOrigin: string,
): { reason: QrTargetValidationFailureReason; message: string } | null {
  for (const layer of decodedLayers) {
    let parsed: URL;
    try {
      parsed = layer.startsWith("/")
        ? new URL(layer, expectedOrigin)
        : new URL(layer);
    } catch {
      return {
        reason: "invalid_url",
        message: "Das QR-Ziel ist nach der Sicherheitsprüfung nicht eindeutig lesbar.",
      };
    }
    if (parsed.origin !== expectedOrigin) {
      return {
        reason: "origin_not_allowed",
        message: "Das QR-Ziel verlässt die erwartete öffentliche Origin.",
      };
    }
    if (isBlockedPath(parsed.pathname)) {
      return {
        reason: "blocked_path",
        message: "Administrative oder interne Systempfade sind kein erlaubtes QR-Ziel.",
      };
    }
    const queryIssue = inspectQuery(parsed.searchParams);
    if (queryIssue) return queryIssue;
  }
  return null;
}

export function validateQrCodeValue(value: unknown): string | null {
  const trimmed = trimString(value);
  if (!trimmed || !QR_CODE_RE.test(trimmed)) return null;
  return trimmed;
}

export function buildPublicQrCodeHref(code: unknown): string | null {
  const normalizedCode = validateQrCodeValue(code);
  if (!normalizedCode) return null;
  return `${PUBLIC_QR_PATH}/${encodeURIComponent(normalizedCode)}`;
}

export function buildStudioCodeHref(code: unknown): string | null {
  const normalizedCode = validateQrCodeValue(code);
  if (!normalizedCode) return null;
  return `${STUDIO_PATH}?code=${encodeURIComponent(normalizedCode)}`;
}

export const buildQrStudioCodeHref = buildStudioCodeHref;

export function validateQrTarget(
  rawTarget: unknown,
  options: ValidateQrTargetOptions = {},
): QrTargetValidationResult {
  const expectedOrigin = resolveExpectedOrigin(options.expectedOrigin);
  if (!expectedOrigin) {
    return failure("invalid_origin", "Die erwartete öffentliche Origin ist nicht gültig.");
  }

  const navigationTarget = validateSameOriginNavigationTarget(rawTarget, {
    expectedOrigin,
    allowAbsolute: true,
    maxLength: MAX_QR_TARGET_LENGTH,
  });
  if ("reason" in navigationTarget) {
    return failure(
      navigationTarget.reason,
      internalFailureMessage(navigationTarget.reason),
    );
  }
  const target = navigationTarget.value;

  if (target.kind === "internal") {
    const layerIssue = inspectDecodedLayers(
      target.decodedLayers,
      expectedOrigin,
    );
    if (layerIssue) return failure(layerIssue.reason, layerIssue.message);

    return {
      ok: true,
      value: {
        kind: "internal",
        normalizedTarget: target.normalizedTarget,
        absoluteTarget: target.absoluteHref,
        host: null,
      },
    };
  }

  if (target.protocol !== "https:") {
    if (!(target.protocol === "http:" && options.allowLocalHttp)) {
      return failure("unsafe_scheme", "Öffentliche QR-Ziele müssen HTTPS verwenden.");
    }
  }

  const host = target.host.toLowerCase();
  if (
    (isLocalHostname(target.hostname) || isPrivateIpv4(target.hostname)) &&
    !options.allowLocalHosts
  ) {
    return failure(
      "local_target_not_allowed",
      "Lokale Hosts und private IP-Ziele sind im öffentlichen QR-Pfad gesperrt.",
    );
  }

  const layerIssue = inspectDecodedLayers(target.decodedLayers, expectedOrigin);
  if (layerIssue) return failure(layerIssue.reason, layerIssue.message);

  return {
    ok: true,
    value: {
      kind: "external",
      normalizedTarget: target.normalizedTarget,
      absoluteTarget: target.absoluteHref,
      host,
    },
  };
}

export function buildPublicQrTargetHref(
  rawTarget: unknown,
  options: ValidateQrTargetOptions = {},
): string | null {
  const validation = validateQrTarget(rawTarget, options);
  if (!validation.ok) return null;
  return validation.value.kind === "internal"
    ? validation.value.normalizedTarget
    : validation.value.absoluteTarget;
}

export function requirePublicQrTargetHref(
  rawTarget: unknown,
  options: ValidateQrTargetOptions = {},
): string {
  const href = buildPublicQrTargetHref(rawTarget, options);
  if (!href) {
    throw new Error("invalid_qr_target");
  }
  return href;
}

export function buildStudioTargetHref(
  rawTarget: unknown,
  options: ValidateQrTargetOptions = {},
): string | null {
  const publicTarget = buildPublicQrTargetHref(rawTarget, options);
  if (!publicTarget) return null;
  return `${STUDIO_PATH}?target=${encodeURIComponent(publicTarget)}`;
}

export const buildQrStudioTargetHref = buildStudioTargetHref;

/**
 * Compatibility alias used by existing share/runtime contracts. QR artefacts
 * must open the public target directly; the operator Studio is a separate
 * preparation and distribution surface.
 */
export function requireQrStudioTargetHref(
  rawTarget: unknown,
  options: ValidateQrTargetOptions = {},
): string {
  return requirePublicQrTargetHref(rawTarget, options);
}

export function toAbsolutePublicTarget(target: InternalRedirectPath | string): string {
  const validation = validateQrTarget(target);
  if (!validation.ok) {
    throw new Error("invalid_qr_target");
  }
  return validation.value.absoluteTarget;
}
