import {
  parseShareReadyAssetContract,
  resolveShareReadyAssetContract,
  validateShareReadyAssetConsistency,
  type ShareReadyAssetContract,
} from "@features/anlassraum/shareReadyAssetContract";
import type { ThemenradarItem } from "@features/themenradar/contracts";

export type ThemenradarShareReadyResult =
  | {
      ok: true;
      shareReady: ShareReadyAssetContract;
      issues: string[];
    }
  | {
      ok: false;
      error: string;
      issues: string[];
    };

export function createThemenradarShareReadyCandidate(
  item: ThemenradarItem,
): ThemenradarShareReadyResult {
  const shareReady = resolveShareReadyAssetContract({
    anlassraumId: item.linkedAnlassraumId ?? null,
    dossierId: item.linkedDossierId ?? null,
    title: item.title,
    summary: item.rawSignal,
    lifecycleStatus: item.lifecycleStatus,
    outputStatus:
      item.lifecycleStatus === "review_ready" || item.lifecycleStatus === "published"
        ? "review"
        : "draft",
    isPublic: true,
    existingContextHint:
      item.linkedAnlassraumId || item.linkedDossierId
        ? "Bestehender Kontext ist bereits verknüpft."
        : "Kontextverknüpfung kann vor Freigabe ergänzt werden.",
    factcheckSuggested:
      item.polarizationScore >= 60 || item.heatScore >= 70,
  });

  const parsed = parseShareReadyAssetContract(shareReady);
  if (!parsed.ok) {
    const failed = parsed as { ok: false; error: string; issues: string[] };
    return {
      ok: false,
      error: failed.error,
      issues: failed.issues,
    };
  }

  const success = parsed as {
    ok: true;
    value: ShareReadyAssetContract;
  };

  const consistency = validateShareReadyAssetConsistency({
    contract: success.value,
  });

  const issues = [...consistency.issues];

  if (success.value.socialPublication.autoPostEligible !== false) {
    issues.push("auto_post_eligible_must_stay_false");
  }
  if (success.value.socialPublication.needsReviewBeforeOfficialSocial !== true) {
    issues.push("official_social_requires_review_must_stay_true");
  }

  if (issues.length > 0) {
    return {
      ok: false,
      error: "themenradar_share_ready_guardrails_failed",
      issues,
    };
  }

  return {
    ok: true,
    shareReady: success.value,
    issues: [],
  };
}
