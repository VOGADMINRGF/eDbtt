import { normalizeInternalRedirectPath, type InternalRedirectPath } from "@/features/create/finalizeRedirect";

export type QrPublicEntryTarget =
  | {
      kind: "internal";
      target: InternalRedirectPath;
    }
  | {
      kind: "external_https";
      target: string;
    };

function trimString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function containsControlCharacters(value: string) {
  return /[\u0000-\u001f\u007f]/.test(value);
}

export function validateQrPublicEntryTarget(value: unknown): QrPublicEntryTarget | null {
  const trimmed = trimString(value);
  if (!trimmed || containsControlCharacters(trimmed)) return null;

  const internalTarget = normalizeInternalRedirectPath(trimmed);
  if (internalTarget) {
    return {
      kind: "internal",
      target: internalTarget,
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return null;
    return {
      kind: "external_https",
      target: parsed.toString(),
    };
  } catch {
    return null;
  }
}

export function buildQrStudioEntryHref(params?: {
  target?: unknown;
  source?: string | null;
  invalidTarget?: boolean;
}) {
  const searchParams = new URLSearchParams();
  const target = validateQrPublicEntryTarget(params?.target);
  const source = trimString(params?.source);

  if (target) {
    searchParams.set("target", target.target);
  }
  if (source) {
    searchParams.set("source", source);
  }
  if (params?.invalidTarget) {
    searchParams.set("invalidTarget", "1");
  }

  const query = searchParams.toString();
  return query ? `/qr-studio?${query}` : "/qr-studio";
}

export function buildQrStudioRuntimeTargetHref(
  target: QrPublicEntryTarget,
  origin: string | null | undefined,
) {
  if (target.kind === "external_https") {
    return target.target;
  }

  const normalizedOrigin = trimString(origin);
  if (!normalizedOrigin) return null;

  try {
    return new URL(target.target, normalizedOrigin).toString();
  } catch {
    return null;
  }
}
