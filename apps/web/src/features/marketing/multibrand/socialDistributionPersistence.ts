import type { SocialDistributionRepo } from "@features/outputEngine/socialDistributionRuntime";
import type { MarketingContentOperation } from "@/features/marketing/contentOperations/contracts";
import { getMarketingRegistry } from "@/features/marketing/registry/data";
import { buildMarketingSocialDistributionPreparation } from "./socialDistributionPreparation";

export type PersistMarketingSocialDistributionInput = {
  content: MarketingContentOperation;
  organizationId: string;
  actorUserId: string;
  repo: SocialDistributionRepo;
};

export type PersistMarketingSocialDistributionResult =
  | {
      ok: false;
      reason: "distribution_not_ready";
      blockers: string[];
    }
  | {
      ok: false;
      reason: "marketing_source_context_not_supported_yet";
      blockers: ["marketing_campaign_source_context_required"];
    };

/**
 * Intentional fail-closed bridge marker.
 *
 * The preparation contract is already executable, but the canonical SocialDistributionRepo
 * currently accepts only dossier/topic/round/claim source contexts. Until that contract is
 * extended truthfully, this adapter MUST NOT disguise a MarketingCampaign as another source.
 */
export async function persistMarketingSocialDistribution(
  input: PersistMarketingSocialDistributionInput,
): Promise<PersistMarketingSocialDistributionResult> {
  const preparation = buildMarketingSocialDistributionPreparation(input.content);
  if (preparation.status !== "distribution_prepare") {
    return {
      ok: false,
      reason: "distribution_not_ready",
      blockers: preparation.blockers,
    };
  }

  const campaign = getMarketingRegistry().campaigns.find(
    (candidate) => candidate.id === preparation.campaignId,
  );
  if (!campaign) {
    return {
      ok: false,
      reason: "distribution_not_ready",
      blockers: ["campaign_missing"],
    };
  }

  void input.repo;
  void input.organizationId;
  void input.actorUserId;
  void campaign;

  return {
    ok: false,
    reason: "marketing_source_context_not_supported_yet",
    blockers: ["marketing_campaign_source_context_required"],
  };
}
