import {
  nowIsoString,
  type ThemenradarItem,
  type ThemenradarLifecycleStatus,
} from "@features/themenradar/contracts";
import {
  generateThemenradarContentPrep,
  type ThemenradarContentPrep,
} from "@features/themenradar/contentPrep";
import {
  buildThemenradarShareDistributionHandoff,
  type ThemenradarShareDistributionHandoff,
} from "@features/themenradar/shareDistribution";

export const THEMENRADAR_EXPORT_FORMATS = [
  "post",
  "carousel",
  "script",
] as const;

export type ThemenradarExportFormat = (typeof THEMENRADAR_EXPORT_FORMATS)[number];

type ThemenradarExportAllowedStatus = Extract<
  ThemenradarLifecycleStatus,
  "review_ready" | "published"
>;

export type ThemenradarManualExportDraft = {
  format: ThemenradarExportFormat;
  generatedAt: string;
  manualReleaseOnly: true;
  reviewRequired: true;
  autoPostEligible: false;
  officialSocialAutoPosting: false;
  distributionHandoff: ThemenradarShareDistributionHandoff;
  source: {
    itemId: string;
    title: string;
    lifecycleStatus: ThemenradarExportAllowedStatus;
    campaignKey: string | null;
    linkedAnlassraumId: string | null;
    linkedDossierId: string | null;
    canonicalPublicTarget: string;
    qrTarget: string;
  };
  payload:
    | {
        kind: "post";
        title: string;
        hook: string;
        caption: string;
        cta: string;
        reviewHint: string;
      }
    | {
        kind: "carousel";
        intro: string;
        slides: Array<{
          index: number;
          title: string;
          message: string;
        }>;
        closingCta: string;
      }
    | {
        kind: "script";
        targetDurationSeconds: number;
        lines: string[];
        voiceover: string[];
        closingCta: string;
      };
};

export function assertThemenradarExportEligibility(item: ThemenradarItem) {
  if (item.lifecycleStatus !== "review_ready" && item.lifecycleStatus !== "published") {
    throw new Error("themenradar_export_requires_review_ready");
  }
  if (!item.shareContractSnapshot) {
    throw new Error("themenradar_export_requires_share_ready");
  }
}

export function buildThemenradarManualExportDraft(input: {
  item: ThemenradarItem;
  contentPrep: ThemenradarContentPrep | null;
  format: ThemenradarExportFormat;
}): ThemenradarManualExportDraft {
  const { item, format } = input;
  assertThemenradarExportEligibility(item);
  const contentPrep = input.contentPrep ?? generateThemenradarContentPrep(item);
  const share = item.shareContractSnapshot!;
  const lifecycleStatus = item.lifecycleStatus as ThemenradarExportAllowedStatus;

  const base = {
    format,
    generatedAt: nowIsoString(),
    manualReleaseOnly: true as const,
    reviewRequired: true as const,
    autoPostEligible: false as const,
    officialSocialAutoPosting: false as const,
    distributionHandoff: buildThemenradarShareDistributionHandoff({
      item,
      format,
      shareReady: share,
    }),
    source: {
      itemId: item.id,
      title: item.title,
      lifecycleStatus,
      campaignKey: item.campaignKey ?? null,
      linkedAnlassraumId: item.linkedAnlassraumId ?? null,
      linkedDossierId: item.linkedDossierId ?? null,
      canonicalPublicTarget: share.canonicalPublicTarget,
      qrTarget: share.qrTarget,
    },
  };

  if (format === "post") {
    return {
      ...base,
      payload: {
        kind: "post",
        title: item.title,
        hook: contentPrep.socialHook,
        caption: contentPrep.captionVariants[0],
        cta: contentPrep.dossierOrAnlassraumCta,
        reviewHint:
          "Manueller Export. Erst nach redaktioneller Pruefung fuer offizielle Kanaele verwenden.",
      },
    };
  }

  if (format === "carousel") {
    return {
      ...base,
      payload: {
        kind: "carousel",
        intro: contentPrep.captionVariants[1],
        slides: contentPrep.carouselOutline.map((slide, index) => ({
          index: index + 1,
          title: slide.title,
          message: slide.message,
        })),
        closingCta: contentPrep.dossierOrAnlassraumCta,
      },
    };
  }

  return {
    ...base,
    payload: {
      kind: "script",
      targetDurationSeconds: contentPrep.shortVideoScript.targetDurationSeconds,
      lines: contentPrep.shortVideoScript.lines,
      voiceover: contentPrep.voiceoverScript,
      closingCta: contentPrep.membershipCta,
    },
  };
}
