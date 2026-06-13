import {
  readLiveCampaignEntry,
  type LiveCampaignEntryModel,
  type LiveCampaignEntryStatus,
} from "@/features/campaign/liveCampaignEntry";
import { readLiveReportHandoff } from "@/features/campaign/liveReportHandoff";
import {
  getLiveTrustLabels,
  type LiveTrustLabel,
  type LiveTrustSignal,
} from "@/features/campaign/liveTrustLabels";

export type LiveMediaKit = {
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
  campaignUrl: string;
  qrUrl: string;
  hostUrl: string;
  reportUrl: string;
  trustLabels: LiveTrustLabel[];
  embedPreview: {
    title: string;
    description: string;
    callToAction: string;
    statusLabels: LiveTrustLabel[];
  };
  newsletterSnippet: {
    subject: string;
    body: string;
  };
  socialSnippet: {
    title: string;
    body: string;
  };
  printSnippet: {
    headline: string;
    body: string;
    qrInstruction: string;
  };
  guardrails: string[];
};

const DEFAULT_MEDIA_KIT_GUARDRAILS = [
  "Entwurf / Live-Einstieg / Review-first",
  "Keine automatische Veröffentlichung",
  "Keine Stimme aus Drafts",
  "Keine Drittanbieter-Tracker oder externen Embed-Skripte",
  "Kein Newsletter-Versand, kein Posting und kein externer Connector",
  "Kein Graph-Write, kein Dossier, kein Anlassraum",
  "Keine Factcheck-Ausführung aus dieser Oberfläche",
  "Verifiziert nur bei sealed_verified",
];

function buildCampaignPath(campaignId: string) {
  return `/live/${encodeURIComponent(campaignId)}`;
}

function buildLiveMediaKitTrustSignal(
  campaign: LiveCampaignEntryModel,
  reportSummary:
    | {
        signalCount: number;
        reviewRecommendedCount: number;
        sourceOpenCount: number;
      }
    | undefined,
): LiveTrustSignal {
  const publicationStatus = campaign.status === "closed" ? "closed" : "draft";

  if (!reportSummary) {
    return {
      ...campaign.trustSignal,
      publicationStatus,
      contributionKind: "option",
      origin: "live_campaign",
    };
  }

  return {
    publicationStatus,
    reviewRecommended:
      reportSummary.reviewRecommendedCount > 0 || campaign.status !== "closed",
    reviewStatus:
      reportSummary.reviewRecommendedCount > 0 ? "recommended" : campaign.status === "closed" ? "accepted" : "none",
    sourceSupport:
      reportSummary.sourceOpenCount > 0
        ? "open"
        : reportSummary.signalCount > 0
          ? "partial"
          : (campaign.trustSignal.sourceSupport ?? "none"),
    contributionKind: "option",
    origin: "live_campaign",
  };
}

function buildEmbedDescription(
  campaign: LiveCampaignEntryModel,
  reportSummary:
    | {
        signalCount: number;
        reviewRecommendedCount: number;
        sourceOpenCount: number;
      }
    | undefined,
) {
  if (!reportSummary || reportSummary.signalCount === 0) {
    return `${campaign.title} öffnet einen review-first Live-Einstieg für Hinweise, Fragen und Quellen. Der aktuelle Arbeitsstand bleibt ein Entwurf ohne Veröffentlichung, Vote oder externe Distribution.`;
  }

  return `${campaign.title} bündelt aktuell ${reportSummary.signalCount} Signale im review-first Live-Einstieg. ${reportSummary.reviewRecommendedCount} Einträge brauchen Prüfung, ${reportSummary.sourceOpenCount} bleiben bei offener Quellenlage.`;
}

export async function readLiveMediaKit(
  campaignId: string,
): Promise<LiveMediaKit | null> {
  const campaign = await readLiveCampaignEntry(campaignId);
  if (!campaign) return null;

  const report = await readLiveReportHandoff(campaignId);
  const campaignUrl = buildCampaignPath(campaign.campaignId);
  const qrUrl = `${campaignUrl}?source=qr`;
  const hostUrl = `${campaignUrl}/host`;
  const reportUrl = `${campaignUrl}/report`;
  const trustSignal = buildLiveMediaKitTrustSignal(campaign, report?.summary);
  const trustLabels = getLiveTrustLabels(trustSignal);
  const guardrails =
    campaign.status === "closed"
      ? [...DEFAULT_MEDIA_KIT_GUARDRAILS, "Geschlossener Kampagnenkontext: nur Sichtung und Material-Vorschau"]
      : DEFAULT_MEDIA_KIT_GUARDRAILS;
  const embedDescription = buildEmbedDescription(campaign, report?.summary);

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
    campaignUrl,
    qrUrl,
    hostUrl,
    reportUrl,
    trustLabels,
    embedPreview: {
      title: `${campaign.title} · Live-Einstieg`,
      description: embedDescription,
      callToAction: "Live-Einstieg öffnen",
      statusLabels: trustLabels,
    },
    newsletterSnippet: {
      subject: `Live-Kampagne: ${campaign.title}`,
      body: [
        `Hallo,`,
        ``,
        `hier ist der aktuelle review-first Live-Einstieg zur Kampagne "${campaign.title}".`,
        `Beiträge, Fragen und Quellenhinweise starten dort nur als Entwurf und werden nicht automatisch veröffentlicht.`,
        ``,
        `Live-Einstieg: ${campaignUrl}`,
        `QR-/Kurzlink-Ziel: ${qrUrl}`,
        `Host-Cockpit: ${hostUrl}`,
        `Report-Entwurf: ${reportUrl}`,
        ``,
        `Statushinweise: ${trustLabels.map((label) => label.label).join(" · ")}.`,
      ].join("\n"),
    },
    socialSnippet: {
      title: `${campaign.title} · Live-Einstieg`,
      body: `${embedDescription} Einstieg: ${campaignUrl} · Report-Entwurf: ${reportUrl} · Keine automatische Veröffentlichung.`,
    },
    printSnippet: {
      headline: `${campaign.title} vor Ort sichtbar machen`,
      body: `Der QR-/Kurzlink führt in einen review-first Live-Einstieg für Hinweise, Fragen und Quellen. Beiträge bleiben Entwürfe und werden nicht automatisch veröffentlicht.`,
      qrInstruction: `QR-/Kurzlink als relativen Vorschaupfad ${qrUrl} ausspielen; keine Drittanbieter-Skripte und keine externe Tracking-Abhängigkeit nötig.`,
    },
    guardrails,
  };
}
