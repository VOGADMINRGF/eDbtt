import {
  createStartDraftContext,
  type StartDraftContext,
  type StartDraftOrigin,
} from "@/features/start/startDraftContext";
import type { LiveTrustSignal } from "@/features/campaign/liveTrustLabels";

export type LiveCampaignEntryStatus = "draft" | "live" | "closed";

export type LiveCampaignEntryModel = {
  campaignId: string;
  title: string;
  description: string;
  contextLabel?: string;
  regionLabel?: string;
  organizerLabel?: string;
  sourceLabel?: string;
  defaultPrompt?: string;
  status: LiveCampaignEntryStatus;
  statusLabel: string;
  statusNote: string;
  fixture: boolean;
  trustSignal: LiveTrustSignal;
};

export function createLiveCampaignStartDraft(
  campaign: LiveCampaignEntryModel,
  mode: "contribution" | "question",
  origin: StartDraftOrigin = "live_campaign",
): StartDraftContext | null {
  const text =
    campaign.defaultPrompt ??
    (mode === "question"
      ? `Zu ${campaign.title} möchte ich folgende Frage klären: …`
      : `Zu ${campaign.title} möchte ich folgenden Beitrag einbringen: …`);

  return createStartDraftContext({
    text,
    origin,
    intent: mode === "question" ? "question" : "contribution",
    targetHint: mode === "question" ? "themes" : "create",
    preview: {
      contributionType: mode === "question" ? "Frage" : "Beitrag",
      possibleTopics: [campaign.contextLabel ?? campaign.title].filter(Boolean),
      openQuestions:
        mode === "question"
          ? ["Was ist noch offen, bevor daraus ein nächster Schritt wird?"]
          : ["Was sollte zuerst geklärt oder ergänzt werden?"],
      suggestedNextSteps:
        mode === "question"
          ? ["Passende Themen finden", "Später im Konto weiterarbeiten"]
          : ["Beitrag ausarbeiten", "Später im Konto weiterarbeiten"],
      relevance: "public_relevant",
    },
    campaign: {
      campaignId: campaign.campaignId,
      title: campaign.title,
      contextLabel: campaign.contextLabel,
      regionLabel: campaign.regionLabel,
      organizerLabel: campaign.organizerLabel,
      sourceLabel: campaign.sourceLabel,
    },
  });
}
