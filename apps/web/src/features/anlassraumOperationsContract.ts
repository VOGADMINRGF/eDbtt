import {
  ANLASSRAUM_LIFECYCLE_STATUSES,
  ANLASSRAUM_SCOPES,
  LEGACY_ANLASSRAUM_STATUSES,
  type AnlassraumScope,
  type AnlassraumStatus,
} from "@features/anlassraum/types";

const KNOWN_STATUS = [...ANLASSRAUM_LIFECYCLE_STATUSES, ...LEGACY_ANLASSRAUM_STATUSES] as const;
const KNOWN_SCOPE = [...ANLASSRAUM_SCOPES] as const;

export const ANLASSRAUM_OPERATIONS_DEFAULT_LIMIT = 24;
export const ANLASSRAUM_OPERATIONS_MAX_LIMIT = 100;

export type AnlassraumOperationsStatusFilter = "all" | AnlassraumStatus;
export type AnlassraumOperationsScopeFilter = "all" | AnlassraumScope;

export type AnlassraumOperationsQuery = {
  q: string;
  status: AnlassraumOperationsStatusFilter;
  scope: AnlassraumOperationsScopeFilter;
  page: number;
  limit: number;
};

export function normalizeAnlassraumOperationsQuery(
  params: URLSearchParams | Record<string, unknown>,
): AnlassraumOperationsQuery {
  const read = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    const value = params[key];
    if (value == null) return null;
    return String(value);
  };

  const q = normalizeQueryText(read("q"));
  const statusRaw = String(read("status") || "all").trim().toLowerCase();
  const scopeRaw = String(read("scope") || "all").trim().toLowerCase();

  if (statusRaw !== "all" && !KNOWN_STATUS.includes(statusRaw as AnlassraumStatus)) {
    throw new Error("invalid_anlassraum_operations_status");
  }
  if (scopeRaw !== "all" && !KNOWN_SCOPE.includes(scopeRaw as AnlassraumScope)) {
    throw new Error("invalid_anlassraum_operations_scope");
  }

  return {
    q,
    status: statusRaw as AnlassraumOperationsStatusFilter,
    scope: scopeRaw as AnlassraumOperationsScopeFilter,
    page: normalizePositiveInt(read("page"), 1, 1_000),
    limit: normalizePositiveInt(
      read("limit"),
      ANLASSRAUM_OPERATIONS_DEFAULT_LIMIT,
      ANLASSRAUM_OPERATIONS_MAX_LIMIT,
    ),
  };
}

function normalizeQueryText(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function normalizePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  if (rounded <= 0) return fallback;
  return Math.min(max, rounded);
}
