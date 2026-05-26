import type { Metadata } from "next";
import {
  loadSocialReviewQueueReadModel,
  type SocialReviewQueueReadModel,
} from "@features/anlassraum/socialReviewQueueReadModel";
import {
  buildEmptySocialDistributionQueueReadModel,
  loadSocialDistributionQueueReadModel,
  type SocialDistributionQueueReadModel,
} from "@features/outputEngine";
import SocialReviewQueueClient from "./SocialReviewQueueClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social Review Queue - eDebatte",
  description:
    "Review-first Queue für qualifizierte Social-Kandidaten ohne Auto-Posting.",
};

function emptyQueue(): SocialReviewQueueReadModel {
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      candidates: 0,
      reviewRequired: 0,
      qualifiedContext: 0,
      factcheckSuggested: 0,
    },
    guardrails: {
      noAutoPostingDefault: true,
      noTruthPrivilege: true,
      noPriorityPrivilege: true,
      curatedOrQualifiedOfficialSocialOnly: true,
    },
    items: [],
  };
}

export default async function AtlasSocialReviewPage() {
  let sourceState: "live" | "fallback" = "live";
  let distributionState: "live" | "fallback" = "live";
  const queue = await loadSocialReviewQueueReadModel({ limit: 120 }).catch(() => {
    sourceState = "fallback";
    return emptyQueue();
  });
  const distributionQueue = await loadSocialDistributionQueueReadModel({ limit: 80 }).catch(() => {
    distributionState = "fallback";
    return buildEmptySocialDistributionQueueReadModel();
  });

  return (
    <>
      <h1 className="sr-only">Atlas Social Review</h1>
      <SocialReviewQueueClient
        queue={queue}
        sourceState={sourceState}
        distributionQueue={distributionQueue}
        distributionState={distributionState}
      />
    </>
  );
}
