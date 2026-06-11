import {
  readLiveCampaignEntry,
  type LiveCampaignEntryModel,
  type LiveCampaignEntryStatus,
} from "@/features/campaign/liveCampaignEntry";
import {
  getLiveTrustLabels,
  type LiveTrustLabel,
  type LiveTrustSignal,
} from "@/features/campaign/liveTrustLabels";

export type LiveHostSignalKind = "question" | "contribution" | "source" | "counterpoint";
export type LiveHostSignalStatus =
  | "draft"
  | "review_pending"
  | "needs_clarification"
  | "ready_for_review";
export type LiveHostSuggestedAction =
  | "review"
  | "bundle"
  | "ask_clarification"
  | "prepare_report"
  | "watch";

export type LiveHostCockpitSignal = {
  id: string;
  kind: LiveHostSignalKind;
  title: string;
  excerpt: string;
  status: LiveHostSignalStatus;
  trustLabels: LiveTrustLabel[];
  suggestedAction: LiveHostSuggestedAction;
};

export type LiveHostCockpit = {
  campaignId: string;
  title: string;
  description: string;
  status: LiveCampaignEntryStatus;
  statusLabel: string;
  contextLabel?: string;
  regionLabel?: string;
  organizerLabel?: string;
  sourceLabel?: string;
  fixture: boolean;
  summary: {
    incomingCount: number;
    reviewRecommendedCount: number;
    openQuestionsCount: number;
    sourceOpenCount: number;
  };
  signals: LiveHostCockpitSignal[];
  guardrails: string[];
};

type LiveHostSignalSeed = {
  id: string;
  kind: LiveHostSignalKind;
  title: string;
  excerpt: string;
  status: LiveHostSignalStatus;
  trustSignal: LiveTrustSignal;
  suggestedAction: LiveHostSuggestedAction;
};

const LIVE_HOST_FIXTURE_SIGNALS: Record<string, LiveHostSignalSeed[]> = {
  "demo-pflege-vor-ort": [
    {
      id: "pflege-signal-frage-01",
      kind: "question",
      title: "Welche Versorgungslücke betrifft den Stadtteil zuerst?",
      excerpt:
        "Mehrere Rückmeldungen fragen nach erreichbaren Beratungsstellen und klaren Anlaufpunkten für pflegende Angehörige.",
      status: "ready_for_review",
      trustSignal: {
        publicationStatus: "draft",
        reviewStatus: "recommended",
        sourceSupport: "open",
        reviewRecommended: true,
      },
      suggestedAction: "bundle",
    },
    {
      id: "pflege-signal-beitrag-02",
      kind: "contribution",
      title: "Beitrag zu fehlenden Kurzzeitpflegeplätzen",
      excerpt:
        "Ein Community-Beitrag schildert Engpässe bei Kurzzeitpflege und verweist auf offene Rückfragen zur regionalen Verfügbarkeit.",
      status: "review_pending",
      trustSignal: {
        publicationStatus: "review_pending",
        reviewStatus: "pending",
        sourceSupport: "partial",
        reviewRecommended: true,
      },
      suggestedAction: "review",
    },
    {
      id: "pflege-signal-gegenposition-03",
      kind: "counterpoint",
      title: "Gegenposition zur Bewertung vorhandener Hilfsangebote",
      excerpt:
        "Eine Gegenposition widerspricht der Einschätzung, dass bestehende Angebote ausreichen, und markiert offene Klärungspunkte.",
      status: "needs_clarification",
      trustSignal: {
        publicationStatus: "draft",
        sourceSupport: "open",
        reviewRecommended: true,
      },
      suggestedAction: "ask_clarification",
    },
    {
      id: "pflege-signal-quelle-04",
      kind: "source",
      title: "Quellenpaket zur örtlichen Pflegestruktur",
      excerpt:
        "Ein vorhandenes Quellenpaket strukturiert Zuständigkeiten und Zahlen, ohne daraus automatisch Veröffentlichung oder Verifikation abzuleiten.",
      status: "ready_for_review",
      trustSignal: {
        publicationStatus: "draft",
        sourceSupport: "sourced",
        truthStatus: "factcheck_passed",
        verificationLabel: "geprueft",
        verificationMode: "precheck",
        reviewRecommended: false,
      },
      suggestedAction: "prepare_report",
    },
  ],
  "demo-schulweg-sicherheit": [
    {
      id: "schulweg-signal-frage-01",
      kind: "question",
      title: "Welche Querung sollte zuerst geprüft werden?",
      excerpt:
        "Mehrere Hinweise nennen dieselbe Querung vor der Grundschule, aber die genauen Stoßzeiten bleiben offen.",
      status: "draft",
      trustSignal: {
        publicationStatus: "draft",
        sourceSupport: "open",
        reviewRecommended: true,
      },
      suggestedAction: "bundle",
    },
    {
      id: "schulweg-signal-beitrag-02",
      kind: "contribution",
      title: "Beitrag zu parkenden Lieferfahrzeugen vor dem Schultor",
      excerpt:
        "Ein lokaler Erfahrungsbericht benennt konkrete Zeitfenster, braucht aber noch redaktionelle Prüfung und Gegenprüfung der Quellenlage.",
      status: "review_pending",
      trustSignal: {
        publicationStatus: "review_pending",
        reviewStatus: "pending",
        sourceSupport: "partial",
        reviewRecommended: true,
      },
      suggestedAction: "review",
    },
    {
      id: "schulweg-signal-quelle-03",
      kind: "source",
      title: "Schulweg-Quellenhinweis mit Ortsskizze",
      excerpt:
        "Ein Quellenhinweis mit Ortsskizze liegt vor und hilft beim Einordnen, ohne eine versiegelte Verifikation zu behaupten.",
      status: "ready_for_review",
      trustSignal: {
        publicationStatus: "draft",
        sourceSupport: "sourced",
        truthStatus: "source_grounded",
        verificationLabel: "geprueft",
        verificationMode: "precheck",
        reviewRecommended: false,
      },
      suggestedAction: "watch",
    },
  ],
};

const DEFAULT_HOST_GUARDRAILS = [
  "Keine automatische Veröffentlichung",
  "Keine Stimme aus dem Cockpit",
  "Kein Graph-Write, kein Dossier, kein Anlassraum",
  "Keine Factcheck-Ausführung aus dieser Oberfläche",
  "Verifiziert nur bei sealed_verified",
];

function mapSignalKindToContributionKind(
  kind: LiveHostSignalKind,
): LiveTrustSignal["contributionKind"] {
  switch (kind) {
    case "question":
      return "question";
    case "source":
      return "source";
    default:
      return "contribution";
  }
}

function buildLiveHostSignal(seed: LiveHostSignalSeed): LiveHostCockpitSignal {
  return {
    id: seed.id,
    kind: seed.kind,
    title: seed.title,
    excerpt: seed.excerpt,
    status: seed.status,
    trustLabels: getLiveTrustLabels({
      ...seed.trustSignal,
      contributionKind: mapSignalKindToContributionKind(seed.kind),
      origin: "live_campaign",
    }),
    suggestedAction: seed.suggestedAction,
  };
}

function buildLiveHostCockpit(
  campaign: LiveCampaignEntryModel,
  seeds: LiveHostSignalSeed[],
): LiveHostCockpit {
  const signals = seeds.map(buildLiveHostSignal);
  return {
    campaignId: campaign.campaignId,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    statusLabel: campaign.statusLabel,
    contextLabel: campaign.contextLabel,
    regionLabel: campaign.regionLabel,
    organizerLabel: campaign.organizerLabel,
    sourceLabel: campaign.sourceLabel,
    fixture: campaign.fixture,
    summary: {
      incomingCount: signals.length,
      reviewRecommendedCount: signals.filter((signal) =>
        signal.trustLabels.some(
          (label) => label.id === "review_recommended" || label.id === "review_pending",
        ),
      ).length,
      openQuestionsCount: signals.filter((signal) => signal.kind === "question").length,
      sourceOpenCount: signals.filter((signal) =>
        signal.trustLabels.some((label) => label.id === "source_open"),
      ).length,
    },
    signals,
    guardrails:
      campaign.status === "closed"
        ? [...DEFAULT_HOST_GUARDRAILS, "Geschlossener Kampagnenkontext: nur Sichtung, kein neuer Live-Beitragspfad"]
        : DEFAULT_HOST_GUARDRAILS,
  };
}

export async function readLiveHostCockpit(
  campaignId: string,
): Promise<LiveHostCockpit | null> {
  const campaign = await readLiveCampaignEntry(campaignId);
  if (!campaign) return null;
  const seeds = LIVE_HOST_FIXTURE_SIGNALS[campaign.campaignId] ?? [];
  return buildLiveHostCockpit(campaign, seeds);
}
