import { anlassraumCol } from "@features/anlassraum/db";
import {
  feedAnlassraumClusterCandidatesCol,
  feedStatementsCol,
  statementCandidatesCol,
  voteDraftsCol,
} from "./db";
import {
  buildFeedRadarPublicHandoffs,
  type FeedRadarPublicHandoff,
} from "./publicHandoff";
import {
  getFeedRadarStatusCopy,
  resolveFeedRadarStatusFromSource,
  type FeedRadarRuntimeStatus,
} from "./statusContract";
import { listRecentFeedRuntimeRuns, type FeedRuntimeRunDoc } from "./runtimeLog";

export type FeedRadarRuntimeNextAction =
  | "run_pull"
  | "run_analyze"
  | "review_drafts"
  | "review_clusters"
  | "check_errors"
  | "publish_public_updates"
  | "monitor";

export type FeedRadarRuntimeMetric = {
  key: string;
  label: string;
  value: number;
  status: FeedRadarRuntimeStatus;
  description: string;
};

export type FeedRadarRuntimeRunSummary = {
  runType: FeedRuntimeRunDoc["runType"];
  status: FeedRuntimeRunDoc["status"];
  requestedAt: string | null;
  completedAt: string | null;
  label: string;
  detail: string;
  error: string | null;
};

export type FeedRadarRuntimeReadModel = {
  sourceStatus: {
    status: FeedRadarRuntimeStatus;
    label: string;
    description: string;
  };
  metrics: {
    candidates: FeedRadarRuntimeMetric;
    analyzing: FeedRadarRuntimeMetric;
    drafts: FeedRadarRuntimeMetric;
    review: FeedRadarRuntimeMetric;
    clusters: FeedRadarRuntimeMetric;
    published: FeedRadarRuntimeMetric;
    errors: FeedRadarRuntimeMetric;
  };
  runs: FeedRadarRuntimeRunSummary[];
  nextAction: {
    action: FeedRadarRuntimeNextAction;
    label: string;
    description: string;
    href: string;
  };
  publicHandoffs: FeedRadarPublicHandoff[];
  queue: {
    queuedDrafts: number;
    clusteredCandidates: number;
    attachedAnlassraum: number;
    attachedDossier: number;
  };
};

export async function buildFeedRadarRuntimeReadModel(): Promise<FeedRadarRuntimeReadModel> {
  const [
    candidateCol,
    draftCol,
    clusterCol,
    statementCol,
    roomCol,
    runs,
  ] = await Promise.all([
    statementCandidatesCol(),
    voteDraftsCol(),
    feedAnlassraumClusterCandidatesCol(),
    feedStatementsCol(),
    anlassraumCol(),
    listRecentFeedRuntimeRuns(12),
  ]);

  const [
    candidateTotal,
    analyzingCount,
    analyzedCount,
    candidateErrorCount,
    draftTotal,
    queuedDrafts,
    reviewDrafts,
    publishedDrafts,
    ignoredDrafts,
    weakSignalDrafts,
    attachedDrafts,
    candidateCreatedDrafts,
    clusterCandidateCount,
    publishedStatements,
    dossierLinkedRooms,
  ] = await Promise.all([
    candidateCol.countDocuments({}),
    candidateCol.countDocuments({ analyzeStatus: "processing" }),
    candidateCol.countDocuments({ analyzeStatus: "success" }),
    candidateCol.countDocuments({ analyzeStatus: "error" }),
    draftCol.countDocuments({}),
    draftCol.countDocuments({ feedReviewState: "queued" }),
    draftCol.countDocuments({ status: "review" }),
    draftCol.countDocuments({ status: "published" }),
    draftCol.countDocuments({ feedReviewState: "ignored" }),
    draftCol.countDocuments({ feedReviewState: "weak_signal" }),
    draftCol.countDocuments({ feedReviewState: "attached" }),
    draftCol.countDocuments({ feedReviewState: "candidate_created" }),
    clusterCol.countDocuments({}),
    statementCol.countDocuments({ status: "readyForLive" }),
    roomCol.countDocuments({ dossierId: { $exists: true, $ne: null } }),
  ]);

  const latestPullRun = runs.find((run) => run.runType === "pull") ?? null;
  const latestErrorRun = runs.find((run) => run.status === "error") ?? null;

  const sourceStatus = resolveFeedRadarStatusFromSource({
    hasRecentPull: Boolean(latestPullRun),
    hasError: Boolean(latestErrorRun),
  });
  const sourceCopy = getFeedRadarStatusCopy(sourceStatus);

  const attachedToAnlassraum = attachedDrafts + candidateCreatedDrafts;
  const attachedToDossier = Math.min(attachedToAnlassraum, dossierLinkedRooms);

  const metrics = {
    candidates: buildMetric(
      "candidates",
      "Kandidaten",
      candidateTotal,
      candidateTotal > 0 ? "candidate_created" : sourceStatus,
      "Erfasste Hinweise aus Pull oder Import.",
    ),
    analyzing: buildMetric(
      "analyzing",
      "Analyse",
      analyzingCount + analyzedCount,
      candidateErrorCount > 0 ? "error" : analyzingCount > 0 ? "analyzing" : analyzedCount > 0 ? "analyzed" : "candidate_created",
      "Laufende und abgeschlossene Analysen.",
    ),
    drafts: buildMetric(
      "drafts",
      "Vorschläge",
      draftTotal,
      draftTotal > 0 ? "draft_created" : "analyzed",
      "Reviewbare Folge-Vorschläge für Swipes, Anlassraum oder Dossier.",
    ),
    review: buildMetric(
      "review",
      "In Prüfung",
      queuedDrafts + reviewDrafts + weakSignalDrafts,
      queuedDrafts + reviewDrafts + weakSignalDrafts > 0 ? "needs_review" : "accepted",
      "Offene Review-Entscheidungen ohne automatische Veröffentlichung.",
    ),
    clusters: buildMetric(
      "clusters",
      "Cluster-Kandidaten",
      clusterCandidateCount,
      clusterCandidateCount > 0 ? "clustered" : "draft_created",
      "Gebündelte Themenkandidaten für den Anlassraum.",
    ),
    published: buildMetric(
      "published",
      "Öffentliche Updates",
      publishedStatements,
      publishedStatements > 0 ? "published_update" : "accepted",
      "Bewusst freigegebene Update-Statements für Folgeflächen.",
    ),
    errors: buildMetric(
      "errors",
      "Fehler",
      candidateErrorCount + (latestErrorRun ? 1 : 0),
      candidateErrorCount + (latestErrorRun ? 1 : 0) > 0 ? "error" : "accepted",
      "Fehler aus Abruf, Analyse oder Cluster-Lauf.",
    ),
  } satisfies FeedRadarRuntimeReadModel["metrics"];

  const nextAction = resolveNextAction({
    candidateErrorCount,
    queuedDrafts,
    reviewDrafts,
    clusterCandidateCount,
    candidateTotal,
    analyzingCount,
    publishedStatements,
    latestPullRun,
  });

  return {
    sourceStatus: {
      status: sourceStatus,
      label: sourceCopy.label,
      description: sourceCopy.description,
    },
    metrics,
    runs: runs.map(toRunSummary),
    nextAction,
    publicHandoffs: buildFeedRadarPublicHandoffs({
      hasSwipeStatements: publishedStatements > 0 || publishedDrafts > 0,
      hasAnlassraumUpdates: attachedToAnlassraum > 0 || clusterCandidateCount > 0,
      hasDossierLinks: attachedToDossier > 0,
    }),
    queue: {
      queuedDrafts: queuedDrafts + reviewDrafts + weakSignalDrafts,
      clusteredCandidates: clusterCandidateCount,
      attachedAnlassraum: attachedToAnlassraum,
      attachedDossier: attachedToDossier,
    },
  };
}

function buildMetric(
  key: string,
  label: string,
  value: number,
  status: FeedRadarRuntimeStatus,
  description: string,
): FeedRadarRuntimeMetric {
  return { key, label, value, status, description };
}

function toRunSummary(run: FeedRuntimeRunDoc): FeedRadarRuntimeRunSummary {
  const counts = run.counts ?? {};
  const detailParts = [
    counts.inserted ? `${counts.inserted} neu` : null,
    counts.fetchedItems ? `${counts.fetchedItems} Einträge` : null,
    counts.analyzed ? `${counts.analyzed} analysiert` : null,
    counts.totalClusters ? `${counts.totalClusters} Cluster` : null,
    counts.errors ? `${counts.errors} Fehler` : null,
  ].filter((value): value is string => Boolean(value));

  return {
    runType: run.runType,
    status: run.status,
    requestedAt: run.requestedAt?.toISOString?.() ?? null,
    completedAt: run.completedAt?.toISOString?.() ?? null,
    label: labelForRunType(run.runType),
    detail: detailParts.join(" · ") || "Ohne Zählerdetails protokolliert.",
    error: run.error ?? null,
  };
}

function labelForRunType(runType: FeedRuntimeRunDoc["runType"]): string {
  if (runType === "pull") return "Abruf";
  if (runType === "batch_import") return "Import";
  if (runType === "analyze") return "Analyse";
  return "Cluster";
}

function resolveNextAction(input: {
  candidateErrorCount: number;
  queuedDrafts: number;
  reviewDrafts: number;
  clusterCandidateCount: number;
  candidateTotal: number;
  analyzingCount: number;
  publishedStatements: number;
  latestPullRun: FeedRuntimeRunDoc | null;
}) {
  if (input.candidateErrorCount > 0) {
    return {
      action: "check_errors" as const,
      label: "Fehler prüfen",
      description: "Mindestens ein Lauf oder eine Analyse ist fehlgeschlagen.",
      href: "/admin/feeds/drafts",
    };
  }
  if (!input.latestPullRun) {
    return {
      action: "run_pull" as const,
      label: "Quellen abrufen",
      description: "Die verbundenen Quellen wurden in dieser Runtime noch nicht sichtbar abgerufen.",
      href: "/admin/feeds",
    };
  }
  if (input.candidateTotal > 0 && input.analyzingCount === 0 && input.queuedDrafts === 0 && input.reviewDrafts === 0 && input.clusterCandidateCount === 0) {
    return {
      action: "run_analyze" as const,
      label: "Analyse starten",
      description: "Es liegen Hinweise vor, aber noch keine reviewbaren Vorschläge.",
      href: "/admin/feeds",
    };
  }
  if (input.queuedDrafts + input.reviewDrafts > 0) {
    return {
      action: "review_drafts" as const,
      label: "Review-Warteschlange öffnen",
      description: "Neue Statement-, Swipe- oder Anlassraum-Vorschläge warten auf eine bewusste Entscheidung.",
      href: "/admin/feeds/drafts",
    };
  }
  if (input.clusterCandidateCount > 0) {
    return {
      action: "review_clusters" as const,
      label: "Cluster prüfen",
      description: "Gebündelte Themenkandidaten können jetzt in Anlassräume überführt werden.",
      href: "/admin/feeds/anlassraum?sourceMode=cluster",
    };
  }
  if (input.publishedStatements > 0) {
    return {
      action: "publish_public_updates" as const,
      label: "B2C-Anschluss prüfen",
      description: "Freigegebene Updates sollten auf Swipes, Anlassraum und Dossier nachvollziehbar andocken.",
      href: "/swipes",
    };
  }
  return {
    action: "monitor" as const,
    label: "Leitstand beobachten",
    description: "Der Feed-Radar ist ohne offene Blocker in einem stabilen Zwischenstand.",
    href: "/admin/feeds",
  };
}
