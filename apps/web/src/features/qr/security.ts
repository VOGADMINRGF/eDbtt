import { BRAND } from "@/lib/brand";
import {
  normalizeInternalRedirectPath,
  type InternalRedirectPath,
} from "@/features/create/finalizeRedirect";
import { publicOrigin } from "@/utils/publicOrigin";

export const STUDIO_PATH = "/studio" as const;
export const LEGACY_QR_STUDIO_PATH = "/qr-studio" as const;
export const PUBLIC_QR_PATH = "/qr" as const;

/**
 * Compatibility export for existing callers. The canonical operator surface is
 * now `/studio`; `/qr-studio` remains a redirect-only legacy route.
 */
export const QR_STUDIO_PATH = STUDIO_PATH;

const BLOCKED_SCHEMES = new Set(["javascript", "data", "file", "vbscript"]);
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
  | { ok: false; message: string };

type ValidateQrTargetOptions = {
  allowLocalHttp?: boolean;
  allowLocalHosts?: boolean;
  extraAllowedHosts?: readonly string[];
};

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeParamName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function defaultAllowedHosts() {
  const hosts = new Set<string>();
  const candidates = [BRAND.baseUrl, `https://${BRAND.domain}`, publicOrigin()];
  for (const candidate of candidates) {
    try {
      hosts.add(new URL(candidate).host.toLowerCase());
    } catch {
      // Ignore malformed environment overrides.
    }
  }
  return hosts;
}

function buildAllowedHosts(extraAllowedHosts?: readonly string[]) {
  const hosts = defaultAllowedHosts();
  for (const host of extraAllowedHosts ?? []) {
    const trimmed = trimString(host).toLowerCase();
    if (trimmed) hosts.add(trimmed);
  }
  return hosts;
}

function looksLikeBlockedEncodedInput(value: string) {
  if (!value.includes("%")) return false;
  try {
    return decodeURIComponent(value) !== value;
  } catch {
    return true;
  }
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

function inspectQuery(searchParams: URLSearchParams) {
  for (const [rawKey, rawValue] of searchParams.entries()) {
    const key = normalizeParamName(rawKey);
    if (REDIRECT_PARAM_NAMES.has(key)) {
      return "Verschachtelte Redirect-Parameter sind im öffentlichen QR-Ziel nicht erlaubt.";
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
      return "QR-Ziele dürfen keine sensiblen Query-Parameter enthalten.";
    }
    if (containsSensitiveValue(rawValue)) {
      return "QR-Ziele dürfen keine sensiblen Identifikatoren oder Token enthalten.";
    }
  }
  return null;
}

function toAbsoluteTarget(target: string) {
  return new URL(target, publicOrigin()).toString();
}

function unwrapCanonicalStudioTarget(value: string): string | null {
  const baseOrigin = publicOrigin();
  const candidates = [value];

  try {
    candidates.push(new URL(value, baseOrigin).toString());
  } catch {
    // Ignore invalid candidates.
  }

  for (const candidate of candidates) {
    try {
      const parsed =
        candidate.startsWith("http://") || candidate.startsWith("https://")
          ? new URL(candidate)
          : new URL(candidate, baseOrigin);
      if (
        parsed.pathname !== STUDIO_PATH &&
        parsed.pathname !== LEGACY_QR_STUDIO_PATH
      ) {
        continue;
      }
      const innerTarget = parsed.searchParams.get("target");
      if (innerTarget) return innerTarget;
    } catch {
      // Ignore invalid wrapper values.
    }
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
  const target = trimString(rawTarget);
  if (!target) {
    return { ok: false, message: "Es wurde kein QR-Ziel übergeben." };
  }
  if (looksLikeBlockedEncodedInput(target)) {
    return {
      ok: false,
      message: "Doppelt oder verschachtelt encodierte QR-Ziele sind nicht erlaubt.",
    };
  }
  if (target.startsWith("//")) {
    return {
      ok: false,
      message: "Protocol-relative URLs sind im öffentlichen QR-Ziel nicht erlaubt.",
    };
  }

  const schemeMatch = target.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (BLOCKED_SCHEMES.has(scheme)) {
      return { ok: false, message: `Das Schema ${scheme}: ist im öffentlichen QR-Ziel gesperrt.` };
    }
  }

  if (target.startsWith("/")) {
    const normalizedInternalPath = normalizeInternalRedirectPath(target);
    if (!normalizedInternalPath) {
      return { ok: false, message: "Interne QR-Ziele müssen mit einem sicheren relativen Pfad beginnen." };
    }

    let parsed: URL;
    try {
      parsed = new URL(normalizedInternalPath, publicOrigin());
    } catch {
      return { ok: false, message: "Das interne QR-Ziel ist nicht lesbar." };
    }

    if (isBlockedPath(parsed.pathname)) {
      return { ok: false, message: "Administrative oder interne Systempfade sind kein erlaubtes QR-Ziel." };
    }

    const queryIssue = inspectQuery(parsed.searchParams);
    if (queryIssue) return { ok: false, message: queryIssue };

    return {
      ok: true,
      value: {
        kind: "internal",
        normalizedTarget: normalizedInternalPath,
        absoluteTarget: toAbsoluteTarget(normalizedInternalPath),
        host: null,
      },
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return { ok: false, message: "Externe QR-Ziele müssen eine vollständige HTTPS-URL sein." };
  }

  const scheme = parsed.protocol.replace(/:$/, "").toLowerCase();
  if (BLOCKED_SCHEMES.has(scheme)) {
    return { ok: false, message: `Das Schema ${scheme}: ist im öffentlichen QR-Ziel gesperrt.` };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, message: "QR-Ziele mit eingebetteten Zugangsdaten sind nicht erlaubt." };
  }
  if (scheme !== "https") {
    if (!(scheme === "http" && options.allowLocalHttp)) {
      return { ok: false, message: "Öffentliche QR-Ziele müssen HTTPS verwenden." };
    }
  }

  const host = parsed.host.toLowerCase();
  if ((isLocalHostname(parsed.hostname) || isPrivateIpv4(parsed.hostname)) && !options.allowLocalHosts) {
    return { ok: false, message: "Lokale Hosts und private IP-Ziele sind im öffentlichen QR-Pfad gesperrt." };
  }

  const allowedHosts = buildAllowedHosts(options.extraAllowedHosts);
  if (!allowedHosts.has(host)) {
    return { ok: false, message: "Dieses externe QR-Ziel ist nicht auf der Allowlist freigegeben." };
  }
  if (isBlockedPath(parsed.pathname)) {
    return { ok: false, message: "Administrative oder interne Systempfade sind kein erlaubtes QR-Ziel." };
  }

  const queryIssue = inspectQuery(parsed.searchParams);
  if (queryIssue) return { ok: false, message: queryIssue };

  return {
    ok: true,
    value: {
      kind: "external",
      normalizedTarget: parsed.toString(),
      absoluteTarget: parsed.toString(),
      host,
    },
  };
}

export function buildPublicQrTargetHref(
  rawTarget: unknown,
  options: ValidateQrTargetOptions = {},
): string | null {
  const innerTarget = trimString(rawTarget);
  const unwrappedTarget = innerTarget ? unwrapCanonicalStudioTarget(innerTarget) : null;
  const validation = validateQrTarget(unwrappedTarget ?? innerTarget, options);
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
  return toAbsoluteTarget(target);
}
