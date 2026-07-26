export const ACCOUNT_DRAFT_SSOT_SOURCES = [
  "local_start_draft",
  "manual_anlassraum_server_draft",
  "create_contribution_ledger",
  "persisted_create_handoff",
  "user_scoped_runtime_linkage",
  "legacy_draft_store",
  "create_contribution_draft_resume",
] as const;

export type AccountDraftSsotSource = (typeof ACCOUNT_DRAFT_SSOT_SOURCES)[number];

export type AccountDraftSsotTruthBand =
  | "browser_local"
  | "server_user_scoped"
  | "review_runtime"
  | "legacy_resume_only";

export type AccountDraftSsotPolicy = {
  source: AccountDraftSsotSource;
  label: string;
  summary: string;
  truthBand: AccountDraftSsotTruthBand;
  precedence: number;
  accountVisible: boolean;
  createResumeVisible: boolean;
};

const ACCOUNT_DRAFT_SSOT_POLICY_MAP = {
  local_start_draft: {
    source: "local_start_draft",
    label: "Lokaler Browser-Entwurf",
    summary:
      "Bleibt eine lokale UX-Stütze im Browser. Kein serverseitiger Review-, Publish- oder Runtime-Stand.",
    truthBand: "browser_local",
    precedence: 10,
    accountVisible: true,
    createResumeVisible: true,
  },
  manual_anlassraum_server_draft: {
    source: "manual_anlassraum_server_draft",
    label: "Serverseitiger Anlassraum-Entwurf",
    summary:
      "User-gebundener Draft aus `/runden/new` im authentifizierten `/api/drafts/save`-Pfad. Review-first, kein Auto-Start.",
    truthBand: "server_user_scoped",
    precedence: 40,
    accountVisible: true,
    createResumeVisible: true,
  },
  create_contribution_ledger: {
    source: "create_contribution_ledger",
    label: "Create-Ledger",
    summary:
      "Serverseitiger Contribution-Draft mit Branch-/Handoff-Readmodel. Bleibt Arbeitsstand und nicht Veröffentlichung.",
    truthBand: "server_user_scoped",
    precedence: 50,
    accountVisible: true,
    createResumeVisible: false,
  },
  persisted_create_handoff: {
    source: "persisted_create_handoff",
    label: "Persisted Review-Handoff",
    summary:
      "Persistierter Create-Handoff als review-first Übergabewahrheit. Sichtbarkeit und Runtime bleiben getrennte Schritte.",
    truthBand: "review_runtime",
    precedence: 70,
    accountVisible: true,
    createResumeVisible: true,
  },
  user_scoped_runtime_linkage: {
    source: "user_scoped_runtime_linkage",
    label: "Verknüpfte Review-/Runtime-Wahrheit",
    summary:
      "Nutzergebundene Review-, Dossier-, Participation- oder Output-Verknüpfung aus bestehenden Runtime-Readmodels.",
    truthBand: "review_runtime",
    precedence: 80,
    accountVisible: true,
    createResumeVisible: false,
  },
  legacy_draft_store: {
    source: "legacy_draft_store",
    label: "Legacy Draft-Store",
    summary:
      "Älterer `/api/drafts`-Pfad mit abweichender ID-/Schema-Logik. Nur für alte String-IDs, nicht als kanonische Account-Wahrheit.",
    truthBand: "legacy_resume_only",
    precedence: 20,
    accountVisible: false,
    createResumeVisible: true,
  },
  create_contribution_draft_resume: {
    source: "create_contribution_draft_resume",
    label: "Create-Draft-Resume",
    summary:
      "User-gebundener Resume-Lookup aus der kanonischen `drafts`-Wahrheit mit normalisiertem Legacy-Fallback für alte `contribution_drafts`-Records.",
    truthBand: "server_user_scoped",
    precedence: 30,
    accountVisible: false,
    createResumeVisible: true,
  },
} as const satisfies Record<AccountDraftSsotSource, AccountDraftSsotPolicy>;

export function getAccountDraftSsotPolicy(
  source: AccountDraftSsotSource,
): AccountDraftSsotPolicy {
  return ACCOUNT_DRAFT_SSOT_POLICY_MAP[source];
}

export function normalizeDraftSsotSourceText(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/gu, " ");
}

export function draftSsotTextsMatch(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const normalizedLeft = normalizeDraftSsotSourceText(left);
  const normalizedRight = normalizeDraftSsotSourceText(right);
  return Boolean(normalizedLeft) && normalizedLeft === normalizedRight;
}

export function buildCreateDraftResumeLookupOrder(params: {
  draftId: string | null | undefined;
  isObjectIdLike: boolean;
  preferManualAnlassraumServerDraft?: boolean;
}) {
  const draftId = String(params.draftId ?? "").trim();
  if (!draftId) return [] as AccountDraftSsotSource[];

  const ordered: AccountDraftSsotSource[] = [];
  if (params.preferManualAnlassraumServerDraft !== false) {
    ordered.push("manual_anlassraum_server_draft");
  }
  if (params.isObjectIdLike) {
    ordered.push("create_contribution_draft_resume");
    return ordered;
  }
  ordered.push("legacy_draft_store");
  return ordered;
}
