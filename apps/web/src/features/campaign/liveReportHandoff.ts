import {
  readLiveHostCockpit,
  type LiveHostCockpit,
  type LiveHostCockpitSignal,
} from "@/features/campaign/liveHostCockpit";
import {
  getLiveTrustLabels,
  type LiveTrustLabel,
} from "@/features/campaign/liveTrustLabels";

export type LiveReportHandoffStatus = "draft" | "ready_for_review" | "closed";
export type LiveReportSectionKind =
  | "summary"
  | "open_questions"
  | "source_status"
  | "counterpoints"
  | "next_steps";
export type LiveReportNextActionTarget =
  | "review"
  | "clarification"
  | "factcheck_request"
  | "dossier_draft"
  | "anlassraum_draft";

export type LiveReportHandoff = {
  campaignId: string;
  title: string;
  status: LiveReportHandoffStatus;
  generatedFrom: "live_host_cockpit";
  contextLabel?: string;
  regionLabel?: string;
  organizerLabel?: string;
  sourceLabel?: string;
  fixture: boolean;
  summary: {
    signalCount: number;
    openQuestionsCount: number;
    reviewRecommendedCount: number;
    sourceOpenCount: number;
    counterpointCount: number;
  };
  sections: Array<{
    id: string;
    title: string;
    kind: LiveReportSectionKind;
    body: string;
    trustLabels: LiveTrustLabel[];
  }>;
  recommendedNextActions: Array<{
    id: string;
    label: string;
    description: string;
    target: LiveReportNextActionTarget;
    guarded: true;
  }>;
  guardrails: string[];
};

const DEFAULT_REPORT_GUARDRAILS = [
  "Nur Entwurf",
  "Nicht veröffentlicht",
  "Keine automatische Verifikation",
  "Kein Dossier ohne Review",
  "Kein Anlassraum ohne Review",
  "Kein Graph-Merge ohne Review",
  "Keine Factcheck-Ausführung aus dieser Oberfläche",
];

function buildSignalList(signals: LiveHostCockpitSignal[]) {
  if (signals.length === 0) return "Aktuell liegen keine Einträge für diesen Abschnitt vor.";
  return signals.map((signal) => `• ${signal.title}: ${signal.excerpt}`).join("\n");
}

function buildSections(cockpit: LiveHostCockpit): LiveReportHandoff["sections"] {
  const openQuestions = cockpit.signals.filter((signal) => signal.kind === "question");
  const sourceSignals = cockpit.signals.filter((signal) =>
    signal.trustLabels.some(
      (label) =>
        label.id === "source_open" ||
        label.id === "source_partial" ||
        label.id === "source_checked" ||
        label.id === "source_grounded",
    ),
  );
  const counterpoints = cockpit.signals.filter((signal) => signal.kind === "counterpoint");

  return [
    {
      id: "summary",
      title: "Zusammenfassung",
      kind: "summary",
      body: `Die Live-Kampagne bündelt aktuell ${cockpit.summary.incomingCount} Signale. ${cockpit.summary.reviewRecommendedCount} Einträge brauchen Review-first Einordnung, ${cockpit.summary.sourceOpenCount} bleiben bei offener Quellenlage.`,
      trustLabels: getLiveTrustLabels({
        publicationStatus: "draft",
        reviewRecommended: cockpit.summary.reviewRecommendedCount > 0,
        sourceSupport: cockpit.summary.sourceOpenCount > 0 ? "open" : "partial",
        contributionKind: "contribution",
        origin: "live_campaign",
      }),
    },
    {
      id: "open-questions",
      title: "Offene Fragen",
      kind: "open_questions",
      body: buildSignalList(openQuestions),
      trustLabels: getLiveTrustLabels({
        publicationStatus: "draft",
        reviewRecommended: openQuestions.length > 0,
        sourceSupport: openQuestions.length > 0 ? "open" : "none",
        contributionKind: "question",
        origin: "live_campaign",
      }),
    },
    {
      id: "source-status",
      title: "Quellenlage",
      kind: "source_status",
      body: buildSignalList(sourceSignals),
      trustLabels: getLiveTrustLabels({
        publicationStatus: "draft",
        reviewRecommended: cockpit.summary.sourceOpenCount > 0,
        sourceSupport:
          cockpit.summary.sourceOpenCount > 0
            ? "open"
            : sourceSignals.some((signal) =>
                  signal.trustLabels.some((label) => label.id === "source_checked"),
                )
              ? "sourced"
              : "partial",
        contributionKind: "source",
        origin: "live_campaign",
      }),
    },
    {
      id: "counterpoints",
      title: "Gegenpositionen / Konfliktlinien",
      kind: "counterpoints",
      body: buildSignalList(counterpoints),
      trustLabels: getLiveTrustLabels({
        publicationStatus: "draft",
        reviewRecommended: counterpoints.length > 0,
        sourceSupport: counterpoints.length > 0 ? "open" : "none",
        contributionKind: "contribution",
        origin: "live_campaign",
      }),
    },
    {
      id: "next-steps",
      title: "Empfohlene nächste Schritte",
      kind: "next_steps",
      body:
        "Der Report-Handoff bleibt ein Arbeitsstand. Vor Dossier-, Anlassraum- oder Graph-Schritten ist weiterhin explizite Review-first Prüfung nötig.",
      trustLabels: getLiveTrustLabels({
        publicationStatus: "draft",
        reviewRecommended: true,
        sourceSupport: cockpit.summary.sourceOpenCount > 0 ? "open" : "partial",
        contributionKind: "option",
        origin: "live_campaign",
      }),
    },
  ];
}

function resolveReportStatus(cockpit: LiveHostCockpit): LiveReportHandoffStatus {
  if (cockpit.status === "closed") return "closed";
  if (
    cockpit.summary.reviewRecommendedCount > 0 ||
    cockpit.summary.sourceOpenCount > 0 ||
    cockpit.summary.openQuestionsCount > 0
  ) {
    return "ready_for_review";
  }
  return "draft";
}

function buildRecommendedNextActions(
): LiveReportHandoff["recommendedNextActions"] {
  return [
    {
      id: "review",
      label: "Für Review vormerken",
      description: "Markiert den Report-Entwurf als nächsten review-first Arbeitsstand, ohne Veröffentlichung auszulösen.",
      target: "review",
      guarded: true,
    },
    {
      id: "clarification",
      label: "Rückfrage vorbereiten",
      description: "Nutzt offene Fragen und Gegenpositionen als Basis für eine gezielte Rückfrage, ohne automatische Schreibaktion.",
      target: "clarification",
      guarded: true,
    },
    {
      id: "factcheck",
      label: "Factcheck anfragen",
      description: "Zeigt nur einen konservativen nächsten Schritt für offene Quellenlagen; dieser Slice startet keinen Factcheck.",
      target: "factcheck_request",
      guarded: true,
    },
    {
      id: "dossier",
      label: "Dossier-Entwurf vorbereiten",
      description: "Bleibt guarded und setzt weiterhin einen separaten review-first Pfad voraus.",
      target: "dossier_draft",
      guarded: true,
    },
    {
      id: "anlassraum",
      label: "Anlassraum-Entwurf vorbereiten",
      description: "Bleibt guarded und erzeugt in diesem Slice keinen produktiven Anlassraum.",
      target: "anlassraum_draft",
      guarded: true,
    },
  ];
}

function buildLiveReportHandoff(cockpit: LiveHostCockpit): LiveReportHandoff {
  return {
    campaignId: cockpit.campaignId,
    title: cockpit.title,
    status: resolveReportStatus(cockpit),
    generatedFrom: "live_host_cockpit",
    contextLabel: cockpit.contextLabel,
    regionLabel: cockpit.regionLabel,
    organizerLabel: cockpit.organizerLabel,
    sourceLabel: cockpit.sourceLabel,
    fixture: cockpit.fixture,
    summary: {
      signalCount: cockpit.summary.incomingCount,
      openQuestionsCount: cockpit.summary.openQuestionsCount,
      reviewRecommendedCount: cockpit.summary.reviewRecommendedCount,
      sourceOpenCount: cockpit.summary.sourceOpenCount,
      counterpointCount: cockpit.signals.filter((signal) => signal.kind === "counterpoint").length,
    },
    sections: buildSections(cockpit),
    recommendedNextActions: buildRecommendedNextActions(),
    guardrails:
      cockpit.status === "closed"
        ? [...DEFAULT_REPORT_GUARDRAILS, "Geschlossener Kontext: nur Sichtung und review-first Vorbereitung"]
        : DEFAULT_REPORT_GUARDRAILS,
  };
}

export async function readLiveReportHandoff(
  campaignId: string,
): Promise<LiveReportHandoff | null> {
  const cockpit = await readLiveHostCockpit(campaignId);
  if (!cockpit) return null;
  return buildLiveReportHandoff(cockpit);
}
