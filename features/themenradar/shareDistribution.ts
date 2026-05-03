import { z } from "zod";
import type { ShareReadyAssetContract } from "@features/anlassraum/shareReadyAssetContract";
import type { ThemenradarItem } from "@features/themenradar/contracts";
import type { ThemenradarExportFormat } from "@features/themenradar/exportDraft";

const ThemenradarShareDistributionHandoffSchema = z
  .object({
    source: z
      .object({
        itemId: z.string().trim().min(1),
        campaignKey: z.string().trim().min(1).nullable(),
        linkedAnlassraumId: z.string().trim().min(1).nullable(),
        linkedDossierId: z.string().trim().min(1).nullable(),
      })
      .strict(),
    guardrails: z
      .object({
        manualReleaseOnly: z.literal(true),
        reviewRequired: z.literal(true),
        externalAutopostAllowed: z.literal(false),
        officialSocialNeedsReview: z.literal(true),
        thirdPartyUserIdsAllowed: z.literal(false),
        thirdPartyBeaconsAllowed: z.literal(false),
      })
      .strict(),
    targets: z
      .object({
        themenradarAdmin: z.string().trim().min(1),
        dossierStudio: z.string().trim().min(1).nullable(),
        canonicalPublicTarget: z.string().trim().min(1),
        qrTarget: z.string().trim().min(1),
      })
      .strict(),
    exportRelay: z
      .object({
        route: z.string().trim().min(1),
        format: z.enum(["post", "carousel", "script"]),
        allowedFormats: z.array(z.enum(["post", "carousel", "script"])).length(3),
      })
      .strict(),
    routeFlow: z
      .tuple([
        z.literal("themenradar_admin"),
        z.literal("dossier_studio"),
        z.literal("share_export_manual"),
      ]),
  })
  .strict();

export type ThemenradarShareDistributionHandoff = z.infer<
  typeof ThemenradarShareDistributionHandoffSchema
>;

function assertShareReadyForDistribution(share: ShareReadyAssetContract) {
  if (!share.socialPublication.shareReady) {
    throw new Error("share_distribution_requires_share_ready_contract");
  }
  if (share.socialPublication.autoPostEligible !== false) {
    throw new Error("share_distribution_auto_post_must_stay_false");
  }
  if (share.socialPublication.needsReviewBeforeOfficialSocial !== true) {
    throw new Error("share_distribution_review_guardrail_missing");
  }
}

export function buildThemenradarShareDistributionHandoff(input: {
  item: ThemenradarItem;
  format: ThemenradarExportFormat;
  shareReady: ShareReadyAssetContract;
}): ThemenradarShareDistributionHandoff {
  assertShareReadyForDistribution(input.shareReady);

  const handoff: ThemenradarShareDistributionHandoff = {
    source: {
      itemId: input.item.id,
      campaignKey: input.item.campaignKey ?? null,
      linkedAnlassraumId: input.item.linkedAnlassraumId ?? null,
      linkedDossierId: input.item.linkedDossierId ?? null,
    },
    guardrails: {
      manualReleaseOnly: true,
      reviewRequired: true,
      externalAutopostAllowed: false,
      officialSocialNeedsReview: true,
      thirdPartyUserIdsAllowed: false,
      thirdPartyBeaconsAllowed: false,
    },
    targets: {
      themenradarAdmin: `/admin/themenradar/${encodeURIComponent(input.item.id)}`,
      dossierStudio: input.item.linkedDossierId
        ? `/dossier/${encodeURIComponent(input.item.linkedDossierId)}/studio`
        : null,
      canonicalPublicTarget: input.shareReady.canonicalPublicTarget,
      qrTarget: input.shareReady.qrTarget,
    },
    exportRelay: {
      route: `/api/admin/themenradar/${encodeURIComponent(input.item.id)}/export`,
      format: input.format,
      allowedFormats: ["post", "carousel", "script"],
    },
    routeFlow: ["themenradar_admin", "dossier_studio", "share_export_manual"],
  };

  return ThemenradarShareDistributionHandoffSchema.parse(handoff);
}
