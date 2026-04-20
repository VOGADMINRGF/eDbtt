export type WrapperMvpSurfaceBucket = "mvp" | "later" | "excluded" | "unknown";

export type WrapperRuntimeNavigationDecision =
  | {
      kind: "in_app";
      path: string;
      bucket: "mvp";
    }
  | {
      kind: "fallback";
      path: "/start";
      bucket: Exclude<WrapperMvpSurfaceBucket, "mvp">;
    }
  | {
      kind: "external";
      href: string;
      protocol: string;
    }
  | {
      kind: "invalid";
      reason: "empty" | "unsupported_protocol" | "invalid_url";
    };

const EXACT_MVP_PATHS = new Set([
  "/",
  "/start",
  "/login",
  "/logout",
  "/account",
  "/account/payment",
  "/account/security",
  "/create",
  "/swipes",
  "/runden",
  "/anlassraum",
  "/pricing",
  "/vormerken",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/widerrufsbelehrung",
  "/barrierefreiheit",
  "/stream",
  "/sw",
  "/swipe",
]);

const PREFIX_MVP_PATHS = ["/swipes/", "/round/", "/dossier/", "/stream/", "/pricing/"] as const;

const EXACT_LATER_PATHS = new Set(["/atlas", "/atlas/weekly", "/community"]);
const PREFIX_LATER_PATHS = ["/companion/", "/report/"] as const;

const EXACT_EXCLUDED_PATHS = new Set(["/studio", "/atlas/social-review"]);

const PREFIX_EXCLUDED_PATHS = [
  "/admin/",
  "/dashboard/",
  "/demo/",
  "/embed/",
  "/research/",
  "/overlay/",
] as const;

function stripQueryAndHash(input: string): string {
  return input.split("#")[0].split("?")[0] || "/";
}

function trimTrailingSlash(input: string): string {
  if (input.length > 1 && input.endsWith("/")) return input.slice(0, -1);
  return input;
}

function normalizePath(path: string): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return trimTrailingSlash(stripQueryAndHash(path.trim()));
}

export function classifyWrapperMvpPath(path: string): WrapperMvpSurfaceBucket {
  const normalized = normalizePath(path);
  if (!normalized) return "unknown";

  if (
    EXACT_EXCLUDED_PATHS.has(normalized) ||
    PREFIX_EXCLUDED_PATHS.some((prefix) => normalized.startsWith(prefix))
  ) {
    return "excluded";
  }

  if (
    EXACT_MVP_PATHS.has(normalized) ||
    PREFIX_MVP_PATHS.some((prefix) => normalized.startsWith(prefix))
  ) {
    return "mvp";
  }

  if (
    EXACT_LATER_PATHS.has(normalized) ||
    PREFIX_LATER_PATHS.some((prefix) => normalized.startsWith(prefix))
  ) {
    return "later";
  }

  return "unknown";
}

function toInternalPath(input: string, baseOrigin: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) {
    return normalizePath(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.origin !== baseOrigin) return null;
    return normalizePath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch {
    return null;
  }
}

export function classifyWrapperNavigationTarget(
  target: string,
  options?: { baseOrigin?: string },
): WrapperRuntimeNavigationDecision {
  const href = target.trim();
  if (!href) {
    return { kind: "invalid", reason: "empty" };
  }

  const baseOrigin = options?.baseOrigin ?? "https://edebatte.org";
  const internalPath = toInternalPath(href, baseOrigin);
  if (internalPath) {
    const bucket = classifyWrapperMvpPath(internalPath);
    if (bucket === "mvp") {
      return { kind: "in_app", path: internalPath, bucket };
    }
    return { kind: "fallback", path: "/start", bucket };
  }

  try {
    const parsed = new URL(href);
    if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:" || parsed.protocol === "tel:") {
      return { kind: "external", href, protocol: parsed.protocol };
    }
    return { kind: "invalid", reason: "unsupported_protocol" };
  } catch {
    return { kind: "invalid", reason: "invalid_url" };
  }
}
