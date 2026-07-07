import type {
  AccountContributionHandoffCorrelation,
  AccountContributionHandoffCorrelationBasis,
  AccountContributionSourceRef,
  AccountPersistedHandoffCorrelationRef,
  AccountPersistedHandoffReverseCorrelation,
} from "./contributionHandoffCorrelationTypes";
import type {
  AccountUserScopedRuntimeLinkage,
  AccountUserScopedRuntimeTruthLevel,
} from "./userScopedRuntimeLinkageTypes";
import type { CreateContributionLedgerEntry } from "@features/create/createContributionLedger";

type RuntimeLinkageWithHandoff = AccountUserScopedRuntimeLinkage & {
  persistedHandoffRef: AccountPersistedHandoffCorrelationRef;
};

type CandidateMatch = {
  contributionRef: AccountContributionSourceRef;
  linkage: RuntimeLinkageWithHandoff;
  strength: AccountContributionHandoffCorrelation["correlationStrength"];
  basis: AccountContributionHandoffCorrelationBasis;
  reason: string;
  score: number;
};

function unique(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function actionHintsForContribution(ref: AccountContributionSourceRef) {
  const selectedActionHint = String(ref.selectedActionHint ?? "").trim();
  const branchHint = selectedActionHint.toLowerCase();
  const hints = new Set<string>();

  if (branchHint === "review_or_sources") hints.add("request_review");
  if (branchHint === "qr_poll_prepare") hints.add("prepare_anlassraum");
  if (branchHint === "public_swipes_prepare") hints.add("prepare_participation_space");
  if (branchHint === "attach_existing" || branchHint === "count_position_in_existing") {
    hints.add("append_to_dossier");
  }
  if (branchHint === "save_branch_only") hints.add("submit_draft");

  if (selectedActionHint) hints.add(selectedActionHint);
  return hints;
}

function defaultTruthLevelForContribution(
  ref: AccountContributionSourceRef,
): AccountUserScopedRuntimeTruthLevel {
  if (ref.kind === "local_start_draft") return "local_draft";
  if (ref.kind === "persisted_handoff_only") return "review_readmodel";
  return "ledger";
}

function contributionIdPool(ref: AccountContributionSourceRef) {
  return unique([
    ref.localDraftId,
    ref.startDraftId,
    ref.ledgerId,
    ref.packageId,
    ref.branchId,
    ref.ledgerBranchId,
    ref.contributionId,
    ...(ref.sharedIds ?? []),
  ]);
}

function handoffIdPool(ref: AccountPersistedHandoffCorrelationRef) {
  return unique([
    ref.handoffId,
    ref.createHandoffId,
    ref.reviewItemId,
    ref.workspaceId,
    ref.participationSpaceId,
    ref.outputArtifactId,
    ref.voxyBriefingId,
    ref.provenance?.sourceDraftId,
    ref.provenance?.sourceHandoffId,
    ...(ref.sharedIds ?? []),
  ]);
}

function scoreCandidate(
  contributionRef: AccountContributionSourceRef,
  linkage: RuntimeLinkageWithHandoff,
): CandidateMatch | null {
  const handoffRef = linkage.persistedHandoffRef;
  const sharedIds = contributionIdPool(contributionRef).filter((id) =>
    handoffIdPool(handoffRef).includes(id),
  );

  if (sharedIds.length > 0) {
    return {
      contributionRef,
      linkage,
      strength: "exact",
      basis: "shared_id",
      reason: `Beitrag und persisted Handoff teilen dieselbe Kennung: ${sharedIds[0]}.`,
      score: 600,
    };
  }

  if (
    contributionRef.sourceHandoffId &&
    contributionRef.sourceHandoffId === handoffRef.handoffId
  ) {
    return {
      contributionRef,
      linkage,
      strength: "strong",
      basis: "source_handoff_id",
      reason: "Der Beitrag verweist bereits explizit auf diesen persisted Handoff.",
      score: 550,
    };
  }

  if (
    contributionRef.sourceDraftId &&
    [handoffRef.sourceDraftId, handoffRef.provenance?.sourceDraftId, handoffRef.handoffId].includes(
      contributionRef.sourceDraftId,
    )
  ) {
    return {
      contributionRef,
      linkage,
      strength: "strong",
      basis: "source_draft_id",
      reason: "Eine bestehende Source-Draft-ID verbindet Beitrag und persisted Handoff.",
      score: 520,
    };
  }

  if (
    contributionRef.ledgerBranchId &&
    handoffRef.sourceBranchId &&
    contributionRef.ledgerBranchId === handoffRef.sourceBranchId
  ) {
    return {
      contributionRef,
      linkage,
      strength: "strong",
      basis: "ledger_branch_id",
      reason: "Ledger-Branch und persisted Handoff nutzen dieselbe Branch-ID.",
      score: 500,
    };
  }

  const contributionActionHints = actionHintsForContribution(contributionRef);
  const actionCompatible =
    contributionActionHints.size === 0 ||
    contributionActionHints.has(handoffRef.selectedAction) ||
    (contributionActionHints.has("append_to_dossier") &&
      handoffRef.selectedAction === "create_dossier");
  const sameAuthor =
    contributionRef.userId &&
    handoffRef.createdByUserId &&
    contributionRef.userId === handoffRef.createdByUserId;
  const sameDossier =
    contributionRef.dossierId &&
    handoffRef.dossierId &&
    contributionRef.dossierId === handoffRef.dossierId;
  const runtimeBacked =
    linkage.runtimeTruthLevel !== "review_readmodel" &&
    linkage.runtimeTruthLevel !== "ledger" &&
    linkage.runtimeTruthLevel !== "local_draft";

  if (sameAuthor && sameDossier && actionCompatible && runtimeBacked) {
    return {
      contributionRef,
      linkage,
      strength: "partial",
      basis: "existing_runtime_readmodel",
      reason:
        "Beitrag und persisted Handoff laufen in denselben Dossier-/Runtime-Kontext, aber ohne direkte Ursprungs-ID.",
      score: 350,
    };
  }

  if (sameAuthor && sameDossier && actionCompatible) {
    return {
      contributionRef,
      linkage,
      strength: "partial",
      basis: "created_by_and_dossier_id",
      reason:
        "Beitrag und persisted Handoff teilen Dossier-Kontext und denselben Nutzer, aber keine harte Rück-ID.",
      score: 300,
    };
  }

  const sameText =
    normalizeText(contributionRef.sourceText) !== "" &&
    normalizeText(contributionRef.sourceText) === normalizeText(handoffRef.sourceText);

  if (sameText && actionCompatible) {
    return {
      contributionRef,
      linkage,
      strength: "suggested",
      basis: "text_similarity_suggestion",
      reason:
        "Text und Arbeitsmodus ähneln sich, aber ohne bestehende ID-Brücke bleibt die Zuordnung unbestätigt.",
      score: 120,
    };
  }

  if (sameText) {
    return {
      contributionRef,
      linkage,
      strength: "suggested",
      basis: "text_similarity_suggestion",
      reason:
        "Der Text ähnelt stark, reicht ohne bestehende ID-Brücke aber nur als mögliche Verbindung.",
      score: 100,
    };
  }

  return null;
}

function userVisibleLabelFor(input: {
  strength: AccountContributionHandoffCorrelation["correlationStrength"];
  basis: AccountContributionHandoffCorrelationBasis;
}) {
  if (input.strength === "exact") return "Persisted Handoff exakt verbunden";
  if (input.strength === "strong") return "Persisted Handoff stark verbunden";
  if (input.strength === "partial") return "Persisted Handoff teilweise verbunden";
  if (input.strength === "suggested") {
    return input.basis === "text_similarity_suggestion"
      ? "Persisted Handoff nur als mögliche Verbindung sichtbar"
      : "Persisted Handoff noch nicht belastbar bestätigt";
  }
  if (input.strength === "blocked") return "Persisted Handoff bleibt blockiert";
  return "Noch kein belastbarer persisted Handoff";
}

function nextStepForCorrelation(
  correlation: CandidateMatch | null,
  contributionRef: AccountContributionSourceRef,
) {
  if (!correlation) {
    return contributionRef.kind === "local_start_draft"
      ? "Arbeitsstand erst bewusst an /create oder einen Review-Pfad übergeben."
      : "Beitrag weiterbearbeiten oder bewusst in einen Review-/Create-Handoff überführen.";
  }
  if (correlation.strength === "suggested") {
    return "Verbindung nur nach manueller Prüfung übernehmen; Textähnlichkeit bleibt unzureichend.";
  }
  if (correlation.strength === "partial") {
    return "Dossier-, Review- oder Runtime-Kontext prüfen; ohne harte Ursprungs-ID bleibt die Verbindung vorläufig.";
  }
  return correlation.linkage.nextStep;
}

export function buildAccountContributionHandoffCorrelation(input: {
  contributionRef: AccountContributionSourceRef;
  runtimeLinkages: AccountUserScopedRuntimeLinkage[];
}): AccountContributionHandoffCorrelation {
  const eligibleLinkages = input.runtimeLinkages.filter(
    (linkage): linkage is RuntimeLinkageWithHandoff => Boolean(linkage.persistedHandoffRef),
  );
  const bestCandidate =
    eligibleLinkages
      .map((linkage) => scoreCandidate(input.contributionRef, linkage))
      .filter((candidate): candidate is CandidateMatch => Boolean(candidate))
      .sort((left, right) => right.score - left.score)[0] ?? null;

  if (!bestCandidate) {
    return {
      contributionRef: input.contributionRef,
      persistedHandoffRef: null,
      reviewQueueRef: null,
      dossierWorkspaceRef: null,
      participationRef: null,
      outputDraftRef: null,
      voxyBriefingRef: null,
      correlationStrength: "missing",
      correlationBasis: "none",
      userVisibleLabel: "Noch kein belastbarer persisted Handoff",
      adminReason:
        "Im aktuellen Bestand existiert keine harte ID-Brücke zwischen Draft-/Ledger-Ursprung und persisted Create-Handoff.",
      needsReview: true,
      runtimeTruthLevel: defaultTruthLevelForContribution(input.contributionRef),
      nextStep: nextStepForCorrelation(null, input.contributionRef),
      publicActivationAllowed: false,
      publishActionEnabled: false,
    };
  }

  return {
    contributionRef: input.contributionRef,
    persistedHandoffRef: bestCandidate.linkage.persistedHandoffRef,
    reviewQueueRef: bestCandidate.linkage.reviewQueueRef,
    dossierWorkspaceRef: bestCandidate.linkage.dossierWorkspaceRef,
    participationRef: bestCandidate.linkage.participationRef,
    outputDraftRef: bestCandidate.linkage.outputDraftRef,
    voxyBriefingRef: bestCandidate.linkage.voxyBriefingRef,
    correlationStrength: bestCandidate.strength,
    correlationBasis: bestCandidate.basis,
    userVisibleLabel: userVisibleLabelFor({
      strength: bestCandidate.strength,
      basis: bestCandidate.basis,
    }),
    adminReason: bestCandidate.reason,
    needsReview:
      bestCandidate.strength !== "exact" &&
      bestCandidate.strength !== "strong",
    runtimeTruthLevel: bestCandidate.linkage.runtimeTruthLevel,
    nextStep: nextStepForCorrelation(bestCandidate, input.contributionRef),
    publicActivationAllowed: false,
    publishActionEnabled: false,
  };
}

export function buildPersistedHandoffReverseCorrelation(input: {
  persistedHandoffRef: AccountPersistedHandoffCorrelationRef;
  contributionRefs: AccountContributionSourceRef[];
  runtimeTruthLevel?: AccountUserScopedRuntimeTruthLevel;
}): AccountPersistedHandoffReverseCorrelation {
  const syntheticLinkage: RuntimeLinkageWithHandoff = {
    contributionRef: {
      handoffId: input.persistedHandoffRef.handoffId,
      title: input.persistedHandoffRef.title,
      summary: input.persistedHandoffRef.summary,
      href: input.persistedHandoffRef.href,
      selectedAction: input.persistedHandoffRef.selectedAction,
      reviewState: input.persistedHandoffRef.reviewState,
      createdAt: input.persistedHandoffRef.createdAt,
      updatedAt: input.persistedHandoffRef.updatedAt,
    },
    persistedHandoffRef: input.persistedHandoffRef,
    reviewQueueRef: null,
    dossierWorkspaceRef: null,
    participationRef: null,
    outputDraftRef: null,
    voxyBriefingRef: null,
    surfaces: [],
    linkageStatus: "missing_linkage",
    userVisibleStatus: "",
    adminReason: null,
    nextStep: "",
    reviewRequired: true,
    publicActivationAllowed: false,
    publishActionEnabled: false,
    runtimeTruthLevel: input.runtimeTruthLevel ?? "review_readmodel",
    linkageGaps: [],
    v3ReviewContext: {
      primaryUnifiedItem: null,
      unifiedItems: [],
      sourcePack: null,
      languageBridge: null,
      multilingualThread: null,
      multilingualEvidence: null,
      participationCandidates: [],
      crossLingualSuggestions: [],
      socialOutputDrafts: [],
      dossierWorkspaceSurface: null,
      voxyBriefing: null,
      voxyScriptSegments: [],
      voxyReviewState: null,
      voxyRenderJob: null,
      voxyPublishDraft: null,
    },
  };

  const best =
    input.contributionRefs
      .map((contributionRef) => scoreCandidate(contributionRef, syntheticLinkage))
      .filter((candidate): candidate is CandidateMatch => Boolean(candidate))
      .sort((left, right) => right.score - left.score)[0] ?? null;

  if (!best) {
    return {
      contributionRef: null,
      persistedHandoffRef: input.persistedHandoffRef,
      correlationStrength: "missing",
      correlationBasis: "none",
      userVisibleLabel: "Rückverknüpfung zum ursprünglichen Beitrag noch offen",
      adminReason:
        "Der persisted Handoff ist vorhanden, aber im aktuellen Bestand fehlt die harte Rück-ID zum ursprünglichen Draft-/Ledger-Ursprung.",
      needsReview: true,
    };
  }

  return {
    contributionRef: best.linkage
      ? best.contributionRef
      : null,
    persistedHandoffRef: input.persistedHandoffRef,
    correlationStrength: best.strength,
    correlationBasis: best.basis,
    userVisibleLabel: userVisibleLabelFor({
      strength: best.strength,
      basis: best.basis,
    }),
    adminReason: best.reason,
    needsReview: best.strength !== "exact" && best.strength !== "strong",
  };
}

export function buildLedgerContributionSourceRefs(
  entries: readonly CreateContributionLedgerEntry[],
): AccountContributionSourceRef[] {
  const refs: AccountContributionSourceRef[] = [];

  for (const entry of entries) {
    for (const branch of entry.branches) {
      refs.push({
        id: `${entry.packageId}-${branch.branchId}`,
        kind: "ledger_branch",
        title: branch.title,
        summary: branch.summary,
        href: branch.handoffTargetUrl,
        sourceText: entry.sourceText,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        userId: entry.userId ?? null,
        ledgerId: entry.ledgerId,
        packageId: entry.packageId,
        branchId: branch.branchId,
        ledgerBranchId: `${entry.packageId}:${branch.branchId}`,
        contributionId: entry.ledgerId,
        dossierId: branch.targetReference?.type === "dossier" ? branch.targetReference.id : null,
        selectedActionHint: branch.selectedAction,
      });
    }
  }

  return refs;
}
