import type {
  AnalyzeStatus,
  FeedReviewState,
  VoteDraftDoc,
  VoteDraftStatus,
} from "./types";

export const FEED_RADAR_RUNTIME_STATUSES = [
  "source_registered",
  "pulled",
  "candidate_created",
  "analyzing",
  "analyzed",
  "draft_created",
  "clustered",
  "needs_review",
  "accepted",
  "attached_to_anlassraum",
  "attached_to_dossier",
  "published_update",
  "rejected",
  "error",
] as const;

export type FeedRadarRuntimeStatus = (typeof FEED_RADAR_RUNTIME_STATUSES)[number];

export type FeedRadarStatusCopy = {
  label: string;
  description: string;
  tone: "neutral" | "accent" | "success" | "warning" | "danger";
};

const STATUS_COPY: Record<FeedRadarRuntimeStatus, FeedRadarStatusCopy> = {
  source_registered: {
    label: "Quelle verbunden",
    description: "Die Quelle ist registriert, aber noch nicht erneut abgerufen worden.",
    tone: "neutral",
  },
  pulled: {
    label: "Abgerufen",
    description: "Neue Signale wurden aus der Quelle geholt und stehen für die Einordnung bereit.",
    tone: "accent",
  },
  candidate_created: {
    label: "Als Hinweis erfasst",
    description: "Aus dem Abruf wurde ein neuer Hinweis für die weitere Prüfung angelegt.",
    tone: "accent",
  },
  analyzing: {
    label: "In Analyse",
    description: "Der Hinweis wird gerade strukturiert und für weitere Schritte vorbereitet.",
    tone: "accent",
  },
  analyzed: {
    label: "Analysiert",
    description: "Claims, Fragen und Einordnungen sind vorhanden, aber noch nicht reviewt.",
    tone: "accent",
  },
  draft_created: {
    label: "Als Vorschlag vorbereitet",
    description: "Aus der Analyse wurde ein reviewbarer Vorschlag für Folgeflächen erstellt.",
    tone: "accent",
  },
  clustered: {
    label: "Zu Themen gebündelt",
    description: "Mehrere Vorschläge wurden zu einem Anlassraum-Kandidaten verdichtet.",
    tone: "accent",
  },
  needs_review: {
    label: "In Prüfung",
    description: "Der Vorschlag wartet auf eine bewusste Review- oder Freigabeentscheidung.",
    tone: "warning",
  },
  accepted: {
    label: "Angenommen",
    description: "Der Vorschlag ist angenommen und kann in bestehende Flächen weitergeführt werden.",
    tone: "success",
  },
  attached_to_anlassraum: {
    label: "An Anlassraum angehängt",
    description: "Der Vorschlag ist an einen öffentlichen Themenraum angebunden.",
    tone: "success",
  },
  attached_to_dossier: {
    label: "Im Dossier-Kontext",
    description: "Der Vorschlag ist an Quellenlage, offene Fragen und Perspektiven eines Dossiers gekoppelt.",
    tone: "success",
  },
  published_update: {
    label: "Als Update sichtbar",
    description: "Ein bewusst freigegebenes Update ist für Folgeflächen nutzbar.",
    tone: "success",
  },
  rejected: {
    label: "Abgelehnt / verworfen",
    description: "Der Vorschlag wurde bewusst nicht weitergeführt.",
    tone: "danger",
  },
  error: {
    label: "Fehler",
    description: "Der Lauf oder die Analyse ist fehlgeschlagen und braucht menschliche Prüfung.",
    tone: "danger",
  },
};

export function getFeedRadarStatusCopy(status: FeedRadarRuntimeStatus): FeedRadarStatusCopy {
  return STATUS_COPY[status];
}

export function resolveFeedRadarStatusFromAnalyzeStatus(
  status: AnalyzeStatus,
): FeedRadarRuntimeStatus {
  if (status === "processing") return "analyzing";
  if (status === "success") return "analyzed";
  if (status === "error") return "error";
  return "candidate_created";
}

export function resolveFeedRadarStatusFromDraft(params: {
  draftStatus: VoteDraftStatus;
  feedReviewState?: FeedReviewState | null;
  hasClusterCandidate?: boolean;
  hasAnlassraum?: boolean;
  hasDossier?: boolean;
  hasPublishedStatement?: boolean;
  hasAnalyzeError?: boolean;
}): FeedRadarRuntimeStatus {
  if (params.hasAnalyzeError) return "error";
  if (params.draftStatus === "discarded" || params.feedReviewState === "ignored") {
    return "rejected";
  }
  if (params.hasPublishedStatement || params.draftStatus === "published") {
    return "published_update";
  }
  if (params.hasDossier) {
    return "attached_to_dossier";
  }
  if (params.hasAnlassraum || params.feedReviewState === "attached") {
    return "attached_to_anlassraum";
  }
  if (params.feedReviewState === "candidate_created") {
    return "accepted";
  }
  if (params.hasClusterCandidate) {
    return "clustered";
  }
  if (
    params.draftStatus === "review" ||
    params.feedReviewState === "queued" ||
    params.feedReviewState === "weak_signal"
  ) {
    return "needs_review";
  }
  return "draft_created";
}

export function resolveFeedRadarStatusFromSource(params: {
  hasRecentPull: boolean;
  hasError?: boolean;
}): FeedRadarRuntimeStatus {
  if (params.hasError) return "error";
  return params.hasRecentPull ? "pulled" : "source_registered";
}

export function resolveFeedRadarStatusFromDraftDoc(params: {
  draft: Pick<VoteDraftDoc, "status" | "feedReviewState" | "anlassraumId">;
  hasClusterCandidate?: boolean;
  hasDossier?: boolean;
  hasPublishedStatement?: boolean;
  hasAnalyzeError?: boolean;
}): FeedRadarRuntimeStatus {
  return resolveFeedRadarStatusFromDraft({
    draftStatus: params.draft.status,
    feedReviewState: params.draft.feedReviewState ?? null,
    hasClusterCandidate: params.hasClusterCandidate,
    hasAnlassraum: Boolean(params.draft.anlassraumId),
    hasDossier: params.hasDossier,
    hasPublishedStatement: params.hasPublishedStatement,
    hasAnalyzeError: params.hasAnalyzeError,
  });
}
