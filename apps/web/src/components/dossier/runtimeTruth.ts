import { shouldAllowDemoDossierFallback } from "@/features/runtimeDataGuardrails";

type StorageLike = Pick<Storage, "setItem">;

export type DossierVoteRuntimeMode = "demo" | "runtime";

export type DossierVoteRuntime = {
  mode: DossierVoteRuntimeMode;
  endpoint: string | null;
  usesLocalPersistence: boolean;
  unavailableMessage: string;
};

export type DossierVotePersistResult =
  | {
      ok: true;
      savedAt: string;
      payload: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
    };

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAnchor(value: unknown): string | null {
  const anchor = normalizeText(value);
  if (!anchor) return null;
  return anchor.replace(/^#/, "");
}

export function buildCanonicalDossierHref(
  dossierId: unknown,
  options?: {
    anchor?: string | null;
    allowIndexFallback?: boolean;
  },
) {
  const normalizedId = normalizeText(dossierId);
  const normalizedAnchor = normalizeAnchor(options?.anchor);
  const anchorSuffix = normalizedAnchor ? `#${encodeURIComponent(normalizedAnchor)}` : "";

  if (normalizedId) {
    return `/dossier/${encodeURIComponent(normalizedId)}${anchorSuffix}`;
  }

  if (options?.allowIndexFallback) {
    return `/dossier${anchorSuffix}`;
  }

  return null;
}

export function buildCanonicalDossierEmbedSnippet(dossierId: unknown) {
  const href = buildCanonicalDossierHref(dossierId);
  if (!href) return null;
  return `<iframe src="${href}" title="Dossier Embed" style="width:100%;height:720px;border:0;"></iframe>`;
}

export function resolveDossierVoteRuntime(
  dossierId: unknown,
  explicitMode?: DossierVoteRuntimeMode,
): DossierVoteRuntime {
  const normalizedId = normalizeText(dossierId);
  const mode =
    explicitMode ??
    (shouldAllowDemoDossierFallback(normalizedId) ? "demo" : "runtime");

  if (!normalizedId) {
    return {
      mode,
      endpoint: null,
      usesLocalPersistence: false,
      unavailableMessage:
        mode === "demo"
          ? "Demo-Abstimmung nur mit explizitem Demo-Dossier verfügbar."
          : "Für dieses Dossier ist keine sichere Abstimmungsroute verfügbar.",
    };
  }

  return {
    mode,
    endpoint:
      mode === "demo"
        ? "/api/demo/vote"
        : `/api/dossier/${encodeURIComponent(normalizedId)}/vote`,
    usesLocalPersistence: mode === "demo",
    unavailableMessage:
      mode === "demo"
        ? "Demo-Abstimmung derzeit nicht verfügbar."
        : "Die Abstimmungsruntime für dieses Dossier ist aktuell nicht verfügbar.",
  };
}

function extractVoteErrorMessage(
  payload: Record<string, unknown> | null,
  runtime: DossierVoteRuntime,
) {
  const message = normalizeText(payload?.message) ?? normalizeText(payload?.error);
  return message ?? runtime.unavailableMessage;
}

export async function persistDossierVoteSelection(params: {
  dossierId: string;
  optionId: string;
  runtime: DossierVoteRuntime;
  fetchImpl: typeof fetch;
  now?: () => string;
  storage?: StorageLike | null;
  storageKey?: string;
  timeKey?: string;
}): Promise<DossierVotePersistResult> {
  if (!params.runtime.endpoint) {
    return {
      ok: false,
      error: params.runtime.unavailableMessage,
    };
  }

  const body =
    params.runtime.mode === "demo"
      ? {
          dossierId: params.dossierId,
          optionId: params.optionId,
          runtimeContext: "demo",
        }
      : {
          optionId: params.optionId,
        };

  try {
    const response = await params.fetchImpl(params.runtime.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: extractVoteErrorMessage(payload, params.runtime),
      };
    }

    const savedAt = normalizeText(payload.updatedAt) ?? params.now?.() ?? new Date().toISOString();

    if (
      params.runtime.usesLocalPersistence &&
      params.storage &&
      params.storageKey &&
      params.timeKey
    ) {
      params.storage.setItem(params.storageKey, params.optionId);
      params.storage.setItem(params.timeKey, savedAt);
    }

    return {
      ok: true,
      savedAt,
      payload,
    };
  } catch {
    return {
      ok: false,
      error: params.runtime.unavailableMessage,
    };
  }
}
