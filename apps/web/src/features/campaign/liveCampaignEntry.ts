import { ObjectId } from "@core/db/triMongo";
import { campaignsCol } from "@features/campaign/db";
import type { CampaignDoc, CampaignStatus } from "@features/campaign/types";
import type {
  LiveCampaignEntryModel,
  LiveCampaignEntryStatus,
} from "@/features/campaign/liveCampaignEntryClient";
import type { LiveTrustSignal } from "@/features/campaign/liveTrustLabels";
export type { LiveCampaignEntryModel, LiveCampaignEntryStatus } from "@/features/campaign/liveCampaignEntryClient";

const LIVE_CAMPAIGN_FIXTURES: Record<string, LiveCampaignEntryModel> = {
  "demo-pflege-vor-ort": {
    campaignId: "demo-pflege-vor-ort",
    title: "Pflege vor Ort 2026",
    description:
      "Ein offener Kampagneneinstieg für Hinweise, Fragen und Erfahrungswissen zur Versorgung im Stadtteil.",
    contextLabel: "Pflege und Versorgung im Stadtteil",
    regionLabel: "Berlin · Pankow",
    organizerLabel: "eDebatte Demo-Kampagne",
    sourceLabel: "QR / Kampagnenlink",
    defaultPrompt:
      "Ich möchte zur Versorgungslage vor Ort etwas einbringen: Was fehlt, was funktioniert schon und was sollte zuerst geklärt werden?",
    status: "live",
    statusLabel: "Live-Einstieg",
    statusNote: "Beiträge starten als Entwurf und werden nicht automatisch veröffentlicht.",
    fixture: true,
    trustSignal: {
      publicationStatus: "draft",
      sourceSupport: "none",
      reviewRecommended: true,
      origin: "live_campaign",
    },
  },
  "demo-schulweg-sicherheit": {
    campaignId: "demo-schulweg-sicherheit",
    title: "Sichere Schulwege im Kiez",
    description:
      "Ein mobiler Einstieg für Hinweise und Fragen rund um sichere Wege, Querungen und Sichtbarkeit vor Schulen.",
    contextLabel: "Mobilität und öffentlicher Raum",
    regionLabel: "Berlin · Friedrichshain-Kreuzberg",
    organizerLabel: "eDebatte Demo-Kampagne",
    sourceLabel: "Print / QR",
    defaultPrompt:
      "Ich möchte zum Schulweg im Kiez etwas beitragen: Wo gibt es Unsicherheiten, Engstellen oder offene Fragen?",
    status: "live",
    statusLabel: "Live-Einstieg",
    statusNote: "Fragen und Hinweise bleiben Entwürfe, bis ein nächster Schritt bewusst bestätigt wird.",
    fixture: true,
    trustSignal: {
      publicationStatus: "draft",
      sourceSupport: "none",
      reviewRecommended: true,
      origin: "live_campaign",
    },
  },
};

function resolveLiveCampaignStatus(status: CampaignStatus): LiveCampaignEntryStatus {
  if (status === "active") return "live";
  if (status === "ended") return "closed";
  return "draft";
}

function resolveStatusLabel(status: LiveCampaignEntryStatus) {
  switch (status) {
    case "live":
      return "Live-Einstieg";
    case "closed":
      return "Geschlossener Kontext";
    default:
      return "In Vorbereitung";
  }
}

function resolveStatusNote(status: LiveCampaignEntryStatus) {
  switch (status) {
    case "live":
      return "Beiträge starten als Entwurf und werden nicht automatisch veröffentlicht.";
    case "closed":
      return "Diese Kampagne ist abgeschlossen. Du kannst den Kontext ansehen, aber keinen neuen Draft starten.";
    default:
      return "Der Kontext ist vorbereitet, aber noch nicht als produktive Live-Kampagne geöffnet.";
  }
}

function buildDefaultPrompt(title: string, contextLabel?: string | null) {
  if (contextLabel) {
    return `Ich möchte zu ${title} etwas beitragen. Besonders wichtig finde ich ${contextLabel}, weil …`;
  }
  return `Ich möchte zu ${title} etwas beitragen. Was aus meiner Sicht geklärt oder verbessert werden sollte: …`;
}

function mapCampaignDoc(doc: CampaignDoc): LiveCampaignEntryModel {
  const status = resolveLiveCampaignStatus(doc.status);
  const contextLabel = doc.topicKey?.trim() || undefined;
  const regionLabel = doc.regionCode?.trim() || undefined;
  return {
    campaignId: doc._id?.toString() ?? "",
    title: doc.title,
    description: doc.description?.trim() || "Diese Kampagne öffnet einen review-first Einstieg für Hinweise, Fragen und Beiträge.",
    contextLabel,
    regionLabel,
    sourceLabel: "Kampagnenlink / QR",
    defaultPrompt: buildDefaultPrompt(doc.title, contextLabel),
    status,
    statusLabel: resolveStatusLabel(status),
    statusNote: resolveStatusNote(status),
    fixture: false,
    trustSignal: {
      publicationStatus: status === "closed" ? "closed" : "draft",
      sourceSupport: "none",
      reviewRecommended: status !== "closed",
      origin: "live_campaign",
    },
  };
}

export async function readLiveCampaignEntry(
  campaignId: string,
): Promise<LiveCampaignEntryModel | null> {
  const fixture = LIVE_CAMPAIGN_FIXTURES[campaignId];
  if (fixture) return fixture;

  if (!ObjectId.isValid(campaignId)) return null;

  const col = await campaignsCol();
  const campaign = await col.findOne({ _id: new ObjectId(campaignId) });
  if (!campaign) return null;
  return mapCampaignDoc(campaign);
}
