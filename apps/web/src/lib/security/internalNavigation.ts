export type InternalRedirectPath = `/${string}`;

export const MAX_INTERNAL_NAVIGATION_TARGET_LENGTH = 1000;
export const MAX_INTERNAL_NAVIGATION_DECODE_DEPTH = 2;

const INTERNAL_REDIRECT_ORIGIN = "https://internal-redirect.invalid";
const ENCODED_OCTET_RE = /%[0-9a-f]{2}/i;

export type InternalNavigationFailureReason =
  | "invalid_type"
  | "empty"
  | "surrounding_whitespace"
  | "too_long"
  | "unsafe_character"
  | "network_path_not_allowed"
  | "malformed_encoding"
  | "encoding_depth_exceeded"
  | "not_internal_path"
  | "invalid_origin"
  | "invalid_url"
  | "origin_not_allowed"
  | "non_canonical"
  | "unsafe_scheme"
  | "credentials_not_allowed";

type NavigationTargetSyntaxResult =
  | {
      ok: true;
      value: {
        rawValue: string;
        decodedLayers: readonly string[];
      };
    }
  | {
      ok: false;
      reason: InternalNavigationFailureReason;
    };

export type SameOriginNavigationValidationResult =
  | {
      ok: true;
      value: {
        kind: "internal" | "absolute";
        normalizedTarget: InternalRedirectPath | string;
        absoluteHref: string;
        expectedOrigin: string;
        resolvedOrigin: string;
        protocol: string;
        host: string;
        hostname: string;
        decodedLayers: readonly string[];
      };
    }
  | {
      ok: false;
      reason: InternalNavigationFailureReason;
    };

type NavigationSyntaxOptions = {
  maxLength?: number;
  maxDecodeDepth?: number;
};

type SameOriginNavigationOptions = NavigationSyntaxOptions & {
  expectedOrigin?: string;
  allowAbsolute?: boolean;
};

function hasUnsafeRawCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (character === "\\" || codePoint <= 0x1f || codePoint === 0x7f) {
      return true;
    }
  }
  return false;
}

function isNetworkPath(value: string): boolean {
  return value.startsWith("//");
}

function normalizeExpectedOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function validateNavigationTargetSyntax(
  value: unknown,
  options: NavigationSyntaxOptions = {},
): NavigationTargetSyntaxResult {
  if (typeof value !== "string") {
    return { ok: false, reason: "invalid_type" };
  }
  if (!value) {
    return { ok: false, reason: "empty" };
  }
  if (value !== value.trim()) {
    return { ok: false, reason: "surrounding_whitespace" };
  }

  const maxLength = options.maxLength ?? MAX_INTERNAL_NAVIGATION_TARGET_LENGTH;
  if (value.length > maxLength) {
    return { ok: false, reason: "too_long" };
  }

  const maxDecodeDepth =
    options.maxDecodeDepth ?? MAX_INTERNAL_NAVIGATION_DECODE_DEPTH;
  const decodedLayers: string[] = [];
  let current = value;

  for (let depth = 0; depth <= maxDecodeDepth; depth += 1) {
    decodedLayers.push(current);

    if (hasUnsafeRawCharacter(current)) {
      return { ok: false, reason: "unsafe_character" };
    }
    if (isNetworkPath(current)) {
      return { ok: false, reason: "network_path_not_allowed" };
    }
    if (!current.includes("%")) {
      return { ok: true, value: { rawValue: value, decodedLayers } };
    }
    if (!ENCODED_OCTET_RE.test(current)) {
      return { ok: false, reason: "malformed_encoding" };
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return { ok: false, reason: "malformed_encoding" };
    }
    if (decoded === current) {
      return { ok: true, value: { rawValue: value, decodedLayers } };
    }
    if (depth === maxDecodeDepth) {
      return { ok: false, reason: "encoding_depth_exceeded" };
    }
    current = decoded;
  }

  return { ok: false, reason: "encoding_depth_exceeded" };
}

export function validateSameOriginNavigationTarget(
  value: unknown,
  options: SameOriginNavigationOptions = {},
): SameOriginNavigationValidationResult {
  const syntax = validateNavigationTargetSyntax(value, options);
  if ("reason" in syntax) {
    return { ok: false, reason: syntax.reason };
  }

  const rawValue = syntax.value.rawValue;
  const isInternal = rawValue.startsWith("/");
  if (!isInternal && !options.allowAbsolute) {
    return { ok: false, reason: "not_internal_path" };
  }

  const expectedOrigin = normalizeExpectedOrigin(
    options.expectedOrigin ?? INTERNAL_REDIRECT_ORIGIN,
  );
  if (!expectedOrigin) {
    return { ok: false, reason: "invalid_origin" };
  }

  let parsed: URL;
  try {
    parsed = isInternal
      ? new URL(rawValue, expectedOrigin)
      : new URL(rawValue);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: "unsafe_scheme" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "credentials_not_allowed" };
  }
  if (parsed.origin !== expectedOrigin) {
    return { ok: false, reason: "origin_not_allowed" };
  }

  const browserTarget = isInternal
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : parsed.toString();
  if (browserTarget !== rawValue) {
    return { ok: false, reason: "non_canonical" };
  }

  return {
    ok: true,
    value: {
      kind: isInternal ? "internal" : "absolute",
      normalizedTarget: isInternal
        ? (rawValue as InternalRedirectPath)
        : rawValue,
      absoluteHref: parsed.toString(),
      expectedOrigin,
      resolvedOrigin: parsed.origin,
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      decodedLayers: syntax.value.decodedLayers,
    },
  };
}

export function normalizeInternalRedirectPath(value: unknown): InternalRedirectPath | null {
  const result = validateSameOriginNavigationTarget(value);
  return result.ok && result.value.kind === "internal"
    ? (result.value.normalizedTarget as InternalRedirectPath)
    : null;
}
