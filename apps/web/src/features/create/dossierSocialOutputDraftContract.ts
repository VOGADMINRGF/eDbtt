import type {
  CanonicalPreparationStatus,
} from "@/features/create/canonicalPreparationStatusContract";
import type {
  CanonicalSourcePack,
} from "@/features/create/canonicalSourcePackContract";
import type {
  CanonicalTrustState,
} from "@/features/create/languageBridgeTrustFormatContract";
import type {
  OutputFormat,
} from "@features/outputEngine/contracts";
import type {
  SocialDistributionChannel,
} from "@features/outputEngine/socialDistribution";

export const DOSSIER_SOCIAL_OUTPUT_DRAFT_KINDS = [
  "website_update_draft",
  "linkedin_draft",
  "newsletter_draft",
  "short_video_script_draft",
  "carousel_draft",
  "press_note_draft",
] as const;

export type DossierSocialOutputDraftKind =
  (typeof DOSSIER_SOCIAL_OUTPUT_DRAFT_KINDS)[number];

export type DossierSocialOutputDraft = {
  draftId: string;
  dossierId: string;
  kind: DossierSocialOutputDraftKind;
  title: string;
  summary: string;
  outputFormat: OutputFormat;
  distributionChannels: SocialDistributionChannel[];
  preparationStatus: CanonicalPreparationStatus;
  sourcePack: CanonicalSourcePack | null;
  trustState: CanonicalTrustState | null;
  reviewRequired: true;
  autoPublish: false;
  externalApiTriggered: false;
  publishReadyIsPublished: false;
};

export type BuildDossierSocialOutputDraftInput = {
  draftId: string;
  dossierId: string;
  kind: DossierSocialOutputDraftKind;
  title: string;
  summary: string;
  sourcePack?: CanonicalSourcePack | null;
  trustState?: CanonicalTrustState | null;
  preparationStatus?: CanonicalPreparationStatus;
};

function resolveOutputFormat(
  kind: DossierSocialOutputDraftKind,
): OutputFormat {
  if (kind === "website_update_draft") return "web_article";
  if (kind === "carousel_draft") return "social_carousel";
  if (kind === "short_video_script_draft") return "reel_script";
  if (kind === "press_note_draft") return "administrative_note";
  return "short_briefing";
}

function resolveDistributionChannels(
  kind: DossierSocialOutputDraftKind,
): SocialDistributionChannel[] {
  if (kind === "website_update_draft") return ["website_update"];
  if (kind === "linkedin_draft") return ["linkedin_draft"];
  if (kind === "newsletter_draft") return ["newsletter_draft"];
  if (kind === "carousel_draft") return ["instagram_asset"];
  if (kind === "press_note_draft") return ["press_note"];
  return [];
}

export function buildDossierSocialOutputDraft(
  input: BuildDossierSocialOutputDraftInput,
): DossierSocialOutputDraft {
  return {
    draftId: input.draftId.trim(),
    dossierId: input.dossierId.trim(),
    kind: input.kind,
    title: input.title.trim(),
    summary: input.summary.trim(),
    outputFormat: resolveOutputFormat(input.kind),
    distributionChannels: resolveDistributionChannels(input.kind),
    preparationStatus: input.preparationStatus ?? "review_ready",
    sourcePack: input.sourcePack ?? null,
    trustState: input.trustState ?? null,
    reviewRequired: true,
    autoPublish: false,
    externalApiTriggered: false,
    publishReadyIsPublished: false,
  };
}
