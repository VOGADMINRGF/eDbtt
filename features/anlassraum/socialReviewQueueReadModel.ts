import type { ShareSocialQualification } from "@features/anlassraum/shareReadyAssetContract";
import {
  listSocialReviewDecisionEventsByEntryIds,
  listSocialReviewDecisionsByEntryIds,
  type SocialReviewDecisionEventRecord,
  type SocialReviewPersistedDecisionRecord,
} from "@features/anlassraum/socialReviewDecisionStore";
import {
  listRundenEntryItems,
  type RundenEntryItem,
  type RundenEntryShareContextKind,
} from "@features/topicRound/entrySource";

export const SOCIAL_REVIEW_QUEUE_BASE_STATUSES = [
  "candidate",
  "review_required",
  "qualified_context",
] as const;

export type SocialReviewQueueBaseStatus =
  (typeof SOCIAL_REVIEW_QUEUE_BASE_STATUSES)[number];

export const SOCIAL_REVIEW_QUEUE_FACTCHECK_STATUSES = [
  "factcheck_optional",
  "factcheck_suggested",
] as const;

export type SocialReviewQueueFactcheckStatus =
  (typeof SOCIAL_REVIEW_QUEUE_FACTCHECK_STATUSES)[number];

export const SOCIAL_REVIEW_QUEUE_DECISIONS = [
  "pending",
  "approved_for_social",
  "held_back",
  "deferred",
  "internal_only",
  "marked_for_rework",
] as const;

export type SocialReviewQueueDecision = (typeof SOCIAL_REVIEW_QUEUE_DECISIONS)[number];

export type SocialReviewQueueItem = {
  id: string;
  entryId: string;
  title: string;
  summary: string;
  canonicalTarget: string;
  qrTarget: string;
  shareTitle: string;
  sharePrompt: string;
  shareSummary: string;
  contextKind: RundenEntryShareContextKind;
  primaryTargetKind: NonNullable<RundenEntryItem["shareActions"]>["primaryTargetKind"];
  baseStatus: SocialReviewQueueBaseStatus;
  factcheckStatus: SocialReviewQueueFactcheckStatus;
  socialCandidate: boolean;
  needsReviewBeforeOfficialSocial: boolean;
  socialQualification: ShareSocialQualification | undefined;
  existingContextHint: string | null;
  hasResultsContext: boolean;
  persistedDecision: SocialReviewQueueDecision;
  persistedDecisionNote: string | null;
  persistedDecisionUpdatedAt: string | null;
  decisionHistory: SocialReviewDecisionEventRecord[];
  updatedAt: string | null;
};

export type SocialReviewQueueReadModel = {
  generatedAt: string;
  totals: {
    candidates: number;
    reviewRequired: number;
    qualifiedContext: number;
    factcheckSuggested: number;
  };
  guardrails: {
    noAutoPostingDefault: true;
    noTruthPrivilege: true;
    noPriorityPrivilege: true;
    curatedOrQualifiedOfficialSocialOnly: true;
  };
  items: SocialReviewQueueItem[];
};

export async function loadSocialReviewQueueReadModel(input: {
  limit?: number;
} = {}): Promise<SocialReviewQueueReadModel> {
  const entries = await listRundenEntryItems({
    limit: input.limit ?? 120,
  });
  const queueItems = mapSocialReviewQueueItems(entries);
  let persisted = new Map<string, SocialReviewPersistedDecisionRecord>();
  let history = new Map<string, SocialReviewDecisionEventRecord[]>();
  try {
    persisted = await listSocialReviewDecisionsByEntryIds(
      queueItems.map((item) => item.entryId),
    );
  } catch {
    persisted = new Map();
  }
  try {
    history = await listSocialReviewDecisionEventsByEntryIds({
      entryIds: queueItems.map((item) => item.entryId),
      limitPerEntry: 3,
    });
  } catch {
    history = new Map();
  }
  const items = hydrateSocialReviewQueueItemsWithPersistedDecisions(
    queueItems,
    persisted,
    history,
  );
  return buildQueueReadModel(items);
}

export function mapSocialReviewQueueItems(
  entries: RundenEntryItem[],
): SocialReviewQueueItem[] {
  return entries
    .filter(
      (entry) =>
        entry.shareActions?.socialCandidate === true &&
        entry.shareActions?.needsReviewBeforeOfficialSocial === true,
    )
    .map((entry) => {
      const share = entry.shareActions;
      if (!share) {
        throw new Error("social_review_queue_item_missing_share_actions");
      }

      const baseStatus = resolveBaseStatus(share.socialQualification);
      const factcheckStatus: SocialReviewQueueFactcheckStatus =
        share.factcheckSuggested === true ? "factcheck_suggested" : "factcheck_optional";

      return {
        id: `social-review:${entry.id}`,
        entryId: entry.id,
        title: entry.title,
        summary: entry.summary,
        canonicalTarget: share.canonicalTarget,
        qrTarget: share.qrTarget,
        shareTitle: share.shareTitle,
        sharePrompt: share.sharePrompt,
        shareSummary: share.shareSummary,
        contextKind: share.contextKind,
        primaryTargetKind: share.primaryTargetKind,
        baseStatus,
        factcheckStatus,
        socialCandidate: share.socialCandidate,
        needsReviewBeforeOfficialSocial: share.needsReviewBeforeOfficialSocial,
        socialQualification: share.socialQualification,
        existingContextHint: share.existingContextHint ?? null,
        hasResultsContext:
          share.primaryTargetKind === "round_results_target" ||
          share.primaryTargetKind === "dossier_public_target",
        persistedDecision: "pending" as const,
        persistedDecisionNote: null,
        persistedDecisionUpdatedAt: null,
        decisionHistory: [],
        updatedAt: entry.updatedAt,
      };
    })
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
}

export function hydrateSocialReviewQueueItemsWithPersistedDecisions(
  items: SocialReviewQueueItem[],
  persisted: Map<string, SocialReviewPersistedDecisionRecord>,
  history: Map<string, SocialReviewDecisionEventRecord[]> = new Map(),
): SocialReviewQueueItem[] {
  return items.map((item) => {
    const record = persisted.get(item.entryId);
    const historyEntries = history.get(item.entryId) ?? [];
    if (!record) {
      return {
        ...item,
        decisionHistory: historyEntries,
      };
    }
    return {
      ...item,
      persistedDecision: record.decision,
      persistedDecisionNote: record.note ?? null,
      persistedDecisionUpdatedAt: record.updatedAt,
      decisionHistory: historyEntries,
    };
  });
}

function buildQueueReadModel(items: SocialReviewQueueItem[]): SocialReviewQueueReadModel {
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      candidates: items.length,
      reviewRequired: items.filter((item) => item.baseStatus === "review_required").length,
      qualifiedContext: items.filter((item) => item.baseStatus === "qualified_context").length,
      factcheckSuggested: items.filter((item) => item.factcheckStatus === "factcheck_suggested")
        .length,
    },
    guardrails: {
      noAutoPostingDefault: true,
      noTruthPrivilege: true,
      noPriorityPrivilege: true,
      curatedOrQualifiedOfficialSocialOnly: true,
    },
    items,
  };
}

function resolveBaseStatus(
  qualification: ShareSocialQualification | undefined,
): SocialReviewQueueBaseStatus {
  if (qualification === "qualified_context") return "qualified_context";
  if (qualification === "review_ready_candidate") return "review_required";
  return "candidate";
}
