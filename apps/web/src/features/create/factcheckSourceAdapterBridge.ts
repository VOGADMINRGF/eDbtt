import {
  buildCreateHandoffDraft,
  type CreateClaimDraft,
  type CreateHandoffDraft,
} from "@/features/create/createHandoff";
import type { CreateHandoffReviewQueueItem } from "@/features/create/createHandoffReviewQueue";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
import type { NormalizedMaterialItem } from "@/features/create/materialRouting";
import type { RequestScopeSummary } from "@/lib/server/auth/requestScope";

export const FACTCHECK_SOURCE_ADAPTER_BLOCKERS = [
  "missing_review_queue_item",
  "unsupported_queue_target",
  "unsafe_auto_create_flag",
  "unsafe_auto_publish_flag",
  "missing_followup_source_text",
  "missing_followup_planner",
  "missing_followup_graph_match",
  "missing_factcheck_runtime",
] as const;

export type FactcheckSourceAdapterBlocker =
  (typeof FACTCHECK_SOURCE_ADAPTER_BLOCKERS)[number];

export type FactcheckSourceReviewStatus =
  | "queued"
  | "requested"
  | "needs_source";

export type FactcheckSourceReviewRequestContext = {
  item: CreateHandoffReviewQueueItem | null | undefined;
  result: CreateIntelligentFollowupResult;
  sourceUrls?: string[];
  materialItems?: NormalizedMaterialItem[];
};

export type FactcheckSourceReviewInput = {
  sourceType: "factcheck_request";
  sourceId: string;
  draftId: string;
  handoffId: string;
  text: string;
  language: string;
  requestedAction: "factcheck";
  claims: Array<{
    id: string;
    text: string;
    kind?: CreateClaimDraft["kind"];
    sourceRefs?: string[];
  }>;
  sourceRefs: string[];
  materialRefs: string[];
  withSerp: false;
  deepSearch: false;
  researchConfirmed: false;
};

type FactcheckSourceReviewSuccess = {
  ok: true;
  jobId: string;
  status: string | null;
  requestScope?: RequestScopeSummary | null;
  requestedAction?: string | null;
  sourceRefCount?: number | null;
};

type FactcheckSourceReviewFailure = {
  ok: false;
  status?: number;
  code?: string | null;
  message?: string | null;
  requestScope?: RequestScopeSummary | null;
};

export type SubmitFactcheckSourceReviewRequestResult =
  | {
      ok: true;
      status: FactcheckSourceReviewStatus;
      message: string;
      jobId: string;
      requestScope: RequestScopeSummary | null;
      input: FactcheckSourceReviewInput;
    }
  | {
      ok: false;
      blocked: true;
      blockers: FactcheckSourceAdapterBlocker[];
      error: "blocked_unwired" | "runtime_access_denied";
      message: string;
    }
  | {
      ok: false;
      blocked: false;
      blockers: [];
      error: "runtime_submit_failed";
      message: string;
    };

export type FactcheckSourceReviewSubmit = (
  input: FactcheckSourceReviewInput,
) => Promise<FactcheckSourceReviewSuccess | FactcheckSourceReviewFailure>;

function hasHttpLikePrefix(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("http://") || normalized.startsWith("https://");
}

function normalizeStringArray(values: readonly string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function isCreateHandoffDraft(
  value: CreateClaimDraft | CreateHandoffDraft,
): value is CreateHandoffDraft {
  return "source" in value && "sourceText" in value;
}

function toFactcheckStatus(
  status: string | null | undefined,
): FactcheckSourceReviewStatus {
  if (status === "needs_source") return "needs_source";
  if (status === "requested") return "requested";
  return "queued";
}

function buildBlockedMessage(
  detail?: string | null,
): string {
  const base = "Quellenprüfung vorgemerkt – direkte Übergabe ist noch nicht verfügbar.";
  const normalizedDetail = String(detail ?? "").trim();
  if (!normalizedDetail) return base;
  return `${base} ${normalizedDetail}`;
}

function buildRuntimeDraft(
  context: FactcheckSourceReviewRequestContext,
): CreateHandoffDraft {
  return buildCreateHandoffDraft({
    result: context.result,
    selectedAction: "request_factcheck",
    id: context.item?.sourceDraftId,
    createdAt: context.item?.createdAt,
    sourceUrls: context.sourceUrls,
    materialItems: context.materialItems,
  });
}

export function mapCreateClaimToFactcheckReviewInput(
  claimOrHandoff: CreateClaimDraft | CreateHandoffDraft,
): Pick<
  FactcheckSourceReviewInput,
  "text" | "requestedAction" | "claims" | "sourceRefs" | "materialRefs"
> {
  if (!isCreateHandoffDraft(claimOrHandoff)) {
    return {
      text: claimOrHandoff.text,
      requestedAction: "factcheck",
      claims: [
        {
          id: claimOrHandoff.id,
          text: claimOrHandoff.text,
          kind: claimOrHandoff.kind,
          sourceRefs: [...claimOrHandoff.sourceRefs],
        },
      ],
      sourceRefs: normalizeStringArray(
        claimOrHandoff.sourceRefs.filter(hasHttpLikePrefix),
      ),
      materialRefs: [],
    };
  }

  const claimText = normalizeStringArray(
    claimOrHandoff.claims.map((claim) => claim.text),
  ).join("\n");
  const sourceRefs = normalizeStringArray(
    claimOrHandoff.sourceGrounding
      .filter((entry) => entry.status === "link_reference")
      .map((entry) => entry.detail ?? entry.label)
      .filter(hasHttpLikePrefix),
  );
  const materialRefs = normalizeStringArray(
    claimOrHandoff.sourceGrounding
      .filter((entry) => entry.id.startsWith("material-reference-"))
      .map((entry) => entry.detail ?? entry.label),
  );

  return {
    text: claimText || claimOrHandoff.sourceText,
    requestedAction: "factcheck",
    claims: claimOrHandoff.claims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      kind: claim.kind,
      sourceRefs: [...claim.sourceRefs],
    })),
    sourceRefs,
    materialRefs,
  };
}

async function submitFactcheckReviewInput(
  input: FactcheckSourceReviewInput,
): Promise<FactcheckSourceReviewSuccess | FactcheckSourceReviewFailure> {
  const response = await fetch("/api/factcheck/enqueue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        jobId?: string;
        status?: string;
        code?: string;
        message?: string;
        requestScope?: RequestScopeSummary | null;
        requestedAction?: string | null;
        sourceRefCount?: number | null;
      }
    | null;

  if (!response.ok || !body?.ok || !body.jobId) {
    return {
      ok: false,
      status: response.status,
      code: body?.code ?? null,
      message: body?.message ?? null,
      requestScope: body?.requestScope ?? null,
    };
  }

  return {
    ok: true,
    jobId: body.jobId,
    status: body.status ?? null,
    requestScope: body.requestScope ?? null,
    requestedAction: body.requestedAction ?? null,
    sourceRefCount: body.sourceRefCount ?? null,
  };
}

export function getFactcheckSourceAdapterBlockers(
  context: FactcheckSourceReviewRequestContext,
): FactcheckSourceAdapterBlocker[] {
  const blockers: FactcheckSourceAdapterBlocker[] = [];
  const item = context.item ?? null;

  if (!item) blockers.push("missing_review_queue_item");
  if (item && item.target !== "factcheck_request") {
    blockers.push("unsupported_queue_target");
  }
  if (item?.autoCreate !== false) blockers.push("unsafe_auto_create_flag");
  if (item?.autoPublish !== false) blockers.push("unsafe_auto_publish_flag");
  if (!String(context.result.sourceText ?? "").trim()) {
    blockers.push("missing_followup_source_text");
  }
  if (!context.result.meta?.planner) blockers.push("missing_followup_planner");
  if (!context.result.meta?.graphMatch) blockers.push("missing_followup_graph_match");
  if (typeof fetch !== "function") blockers.push("missing_factcheck_runtime");

  return blockers;
}

export function canCreateFactcheckSourceReviewRequest(
  context: FactcheckSourceReviewRequestContext,
): boolean {
  return getFactcheckSourceAdapterBlockers(context).length === 0;
}

export async function submitFactcheckSourceReviewRequest(
  context: FactcheckSourceReviewRequestContext,
  options: {
    submit?: FactcheckSourceReviewSubmit;
  } = {},
): Promise<SubmitFactcheckSourceReviewRequestResult> {
  const blockers = getFactcheckSourceAdapterBlockers(context);
  if (blockers.length > 0) {
    return {
      ok: false,
      blocked: true,
      blockers,
      error: "blocked_unwired",
      message: buildBlockedMessage(),
    };
  }

  const draft = buildRuntimeDraft(context);
  const mapped = mapCreateClaimToFactcheckReviewInput(draft);
  const input: FactcheckSourceReviewInput = {
    sourceType: "factcheck_request",
    sourceId: context.item?.id ?? draft.id,
    draftId: draft.id,
    handoffId: draft.id,
    text: mapped.text,
    language: "de",
    requestedAction: mapped.requestedAction,
    claims: mapped.claims,
    sourceRefs: mapped.sourceRefs,
    materialRefs: mapped.materialRefs,
    withSerp: false,
    deepSearch: false,
    researchConfirmed: false,
  };

  const submit = options.submit ?? submitFactcheckReviewInput;

  try {
    const response = await submit(input);
    if (response.ok === false) {
      const message = buildBlockedMessage(response.message);
      if ((response.status ?? 500) < 500) {
        return {
          ok: false,
          blocked: true,
          blockers: [],
          error: "runtime_access_denied",
          message,
        };
      }
      return {
        ok: false,
        blocked: false,
        blockers: [],
        error: "runtime_submit_failed",
        message:
          "Quellenprüfung konnte nicht übergeben werden. Bitte erneut versuchen.",
      };
    }

    return {
      ok: true,
      status: toFactcheckStatus(response.status),
      message:
        "Die Aussage wurde zur Prüfung vorgemerkt. Es wurde noch keine Wahrheit bestätigt und keine Quelle automatisch bewertet.",
      jobId: response.jobId,
      requestScope: response.requestScope ?? null,
      input,
    };
  } catch {
    return {
      ok: false,
      blocked: false,
      blockers: [],
      error: "runtime_submit_failed",
      message:
        "Quellenprüfung konnte nicht übergeben werden. Bitte erneut versuchen.",
    };
  }
}
