export type InternalRedirectPath = `/${string}`;

function trimString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeInternalRedirectPath(value: unknown): InternalRedirectPath | null {
  const trimmed = trimString(value);
  if (!trimmed) return null;
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  return trimmed as InternalRedirectPath;
}

export function buildFinalizeRedirectPath(params: {
  draftId: string;
  dossierId?: string | null;
}): InternalRedirectPath {
  const dossierId = trimString(params.dossierId);
  if (dossierId) {
    return `/dossier/${encodeURIComponent(dossierId)}` as InternalRedirectPath;
  }
  return `/swipes?fromDraft=${encodeURIComponent(params.draftId)}` as InternalRedirectPath;
}

export function buildFinalizeFallbackPath(params: {
  dossierId?: string | null;
}): InternalRedirectPath {
  const dossierId = trimString(params.dossierId);
  if (dossierId) {
    return `/dossier/${encodeURIComponent(dossierId)}` as InternalRedirectPath;
  }
  return "/swipes";
}

export function resolveFinalizeRedirectTarget(params: {
  apiRedirectTo?: unknown;
  fallbackRedirectTo?: unknown;
}): InternalRedirectPath | null {
  return (
    normalizeInternalRedirectPath(params.apiRedirectTo) ??
    normalizeInternalRedirectPath(params.fallbackRedirectTo)
  );
}

export function resolveAndNavigateAfterFinalize(params: {
  apiRedirectTo?: unknown;
  fallbackRedirectTo?: unknown;
  navigate: (target: InternalRedirectPath) => void;
}): InternalRedirectPath | null {
  const target = resolveFinalizeRedirectTarget(params);
  if (target) {
    params.navigate(target);
  }
  return target;
}
