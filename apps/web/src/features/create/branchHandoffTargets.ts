import type {
  ClaimCandidate,
  ClaimInferredStance,
  ClaimStanceConfirmationStatus,
  ExistingMatch,
} from "@/features/create/createContributionPackageContract";

export type CreateBranchHandoffTargetType =
  | "dossier_review"
  | "factcheck_review"
  | "qr_participation"
  | "swipe_review"
  | "ledger_detail"
  | "place_clarification";

export type CreateBranchHandoffStatus = "prepared" | "route_missing" | "opened";

export type CreateBranchReviewPreparationDraft = {
  openQuestions: string[];
  searchTerms: string[];
  sourceNeeds: string[];
  autoStartBlocked: true;
};

export type CreateBranchHandoffTarget = {
  handoffStatus: CreateBranchHandoffStatus;
  handoffTargetType: CreateBranchHandoffTargetType;
  handoffTargetUrl: string | null;
  label: string;
  description: string;
  nextWorkspaceLabel: string;
  reviewPreparationDraft?: CreateBranchReviewPreparationDraft;
};

export type CreateContributionPackageHandoffItem = {
  branchId: string;
  title: string;
  handoff: CreateBranchHandoffTarget;
};

type HandoffBranchLike = {
  branchId: string;
  title: string;
  summary: string;
  selectedAction:
    | "qr_poll_prepare"
    | "public_swipes_prepare"
    | "review_or_sources"
    | "save_branch_only"
    | "attach_existing"
    | "count_position_in_existing"
    | "count_opposition_in_existing"
    | "add_nuance_to_existing"
    | "keep_separate"
    | null;
  claimCandidates: ClaimCandidate[];
  placeCandidates?: string[];
  localIssueCandidates?: string[];
  needsPlaceClarification?: boolean;
  placeClarificationStatus?: "pending" | "answered" | "skipped";
  placeClarificationQuestion?: string | null;
  sensitivityLevel?: "standard" | "civic_sensitive" | "high_risk" | "legal_sensitive";
  existingMatches?: ExistingMatch[];
  inferredStance?: ClaimInferredStance;
  stanceConfirmationStatus?: ClaimStanceConfirmationStatus;
};

type ResolveBranchHandoffTargetInput = {
  packageId: string;
  branch: HandoffBranchLike;
  ledgerId?: string | null;
  accountAnchorId?: string | null;
  allowPlaceClarificationRoute?: boolean;
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ");
}

export function buildLedgerBranchAnchorId(packageId: string, branchId: string): string {
  return `create-ledger-${packageId}-${branchId}`;
}

export function buildLedgerDetailHref(packageId: string, branchId: string): string {
  return `/account#${encodeURIComponent(buildLedgerBranchAnchorId(packageId, branchId))}`;
}

export function deriveLedgerSimilaritySignature(branches: readonly Pick<HandoffBranchLike, "title" | "placeCandidates" | "localIssueCandidates">[]): string {
  const titlePart = branches
    .map((branch) => normalizeKey(branch.title))
    .filter(Boolean)
    .sort()
    .join("|");
  const placePart = branches
    .flatMap((branch) => branch.placeCandidates ?? [])
    .map(normalizeKey)
    .filter(Boolean)
    .sort()
    .join("|");
  const localIssuePart = branches
    .flatMap((branch) => branch.localIssueCandidates ?? [])
    .map(normalizeKey)
    .filter(Boolean)
    .sort()
    .join("|");
  return [titlePart, placePart, localIssuePart].filter(Boolean).join("::");
}

export function buildLedgerSimilarityGroupCounts<
  T extends {
    packageId: string;
    branches: readonly Pick<HandoffBranchLike, "title" | "placeCandidates" | "localIssueCandidates">[];
  },
>(entries: readonly T[]): Map<string, number> {
  const signatureBuckets = new Map<string, string[]>();
  for (const entry of entries) {
    const signature = deriveLedgerSimilaritySignature(entry.branches);
    if (!signature) continue;
    const bucket = signatureBuckets.get(signature) ?? [];
    bucket.push(entry.packageId);
    signatureBuckets.set(signature, bucket);
  }
  const counts = new Map<string, number>();
  for (const packageIds of signatureBuckets.values()) {
    if (packageIds.length < 2) continue;
    for (const packageId of packageIds) counts.set(packageId, packageIds.length);
  }
  return counts;
}

function buildReviewPreparationDraft(branch: HandoffBranchLike): CreateBranchReviewPreparationDraft {
  const questionTexts = branch.claimCandidates
    .filter((candidate) => candidate.kind === "question")
    .map((candidate) => candidate.text.trim())
    .filter(Boolean);
  const openQuestions = [
    ...(branch.placeClarificationQuestion ? [branch.placeClarificationQuestion] : []),
    ...questionTexts,
  ].filter((value, index, items) => items.indexOf(value) === index);
  const searchTerms = [
    branch.title,
    ...(branch.localIssueCandidates ?? []),
    ...(branch.placeCandidates ?? []),
    ...branch.claimCandidates.slice(0, 3).map((candidate) => candidate.text),
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, items) => items.indexOf(value) === index);
  const sourceNeeds = [
    branch.needsPlaceClarification ? "Ort oder Zuständigkeit verifizieren" : null,
    branch.claimCandidates.length > 0 ? "Belege zur Kernfrage sammeln" : "Aussage oder Fragestellung schärfen",
    branch.sensitivityLevel === "high_risk" || branch.sensitivityLevel === "legal_sensitive"
      ? "Rechtliche oder sensible Formulierung prüfen"
      : "Quellenlage und Gegenargumente sammeln",
  ].filter((value): value is string => Boolean(value));

  return {
    openQuestions,
    searchTerms,
    sourceNeeds,
    autoStartBlocked: true,
  };
}

export function resolveBranchHandoffTarget(
  input: ResolveBranchHandoffTargetInput,
): CreateBranchHandoffTarget {
  const ledgerDetailHref = buildLedgerDetailHref(input.packageId, input.branch.branchId);
  const needsPlaceClarification =
    input.branch.needsPlaceClarification === true &&
    input.branch.placeClarificationStatus !== "answered";

  if (needsPlaceClarification) {
    return {
      handoffStatus: input.allowPlaceClarificationRoute && input.ledgerId ? "prepared" : "route_missing",
      handoffTargetType: "place_clarification",
      handoffTargetUrl:
        input.allowPlaceClarificationRoute && input.ledgerId
          ? `/create?draftId=${encodeURIComponent(input.ledgerId)}&branchId=${encodeURIComponent(input.branch.branchId)}`
          : null,
      label: "Ort ergänzen",
      description: "Erst Ort/Straße klären, danach Beteiligung oder Prüfung vorbereiten.",
      nextWorkspaceLabel: "Ortsklärung",
    };
  }

  if (input.branch.selectedAction === "review_or_sources") {
    return {
      handoffStatus: "prepared",
      handoffTargetType: "factcheck_review",
      handoffTargetUrl: `/factcheck?from=create&packageId=${encodeURIComponent(input.packageId)}&branchId=${encodeURIComponent(input.branch.branchId)}`,
      label: "Prüfung und Quellen öffnen",
      description:
        "Erste Quellen, offene Fragen und Prüfbedarf werden vorbereitet. Recherche startet erst nach deiner Bestätigung.",
      nextWorkspaceLabel: "Prüfung / Quellen",
      reviewPreparationDraft: buildReviewPreparationDraft(input.branch),
    };
  }

  if (input.branch.selectedAction === "qr_poll_prepare") {
    return {
      handoffStatus: "prepared",
      handoffTargetType: "qr_participation",
      handoffTargetUrl: `/runden?from=create&packageId=${encodeURIComponent(input.packageId)}&branchId=${encodeURIComponent(input.branch.branchId)}`,
      label: "QR-Beteiligung öffnen",
      description:
        "Ein Beteiligungsentwurf mit Frage, Pro/Contra und möglichen Folgen. Noch kein QR-Link, nicht veröffentlicht.",
      nextWorkspaceLabel: "QR-Beteiligung",
    };
  }

  if (input.branch.selectedAction === "public_swipes_prepare") {
    return {
      handoffStatus: "prepared",
      handoffTargetType: "swipe_review",
      handoffTargetUrl: `/swipes?from=create&packageId=${encodeURIComponent(input.packageId)}&branchId=${encodeURIComponent(input.branch.branchId)}`,
      label: "Swipe-Aussagen prüfen",
      description:
        "Aussagen für schnelle Abstimmungen in der eDebatte-Community. Noch nicht öffentlich und nicht gezählt.",
      nextWorkspaceLabel: "Swipe-Review",
    };
  }

  return {
    handoffStatus: "prepared",
    handoffTargetType: "ledger_detail",
    handoffTargetUrl: ledgerDetailHref,
    label: "Entwurf ansehen",
    description: "Dieser Themenast bleibt nur gespeichert.",
    nextWorkspaceLabel: "Ledger-Detail",
  };
}

export function buildContributionPackageHandoffItems(
  input: {
    packageId: string;
    ledgerId?: string | null;
    branches: readonly HandoffBranchLike[];
    allowPlaceClarificationRoute?: boolean;
  },
): CreateContributionPackageHandoffItem[] {
  return input.branches.map((branch) => ({
    branchId: branch.branchId,
    title: branch.title,
    handoff: resolveBranchHandoffTarget({
      packageId: input.packageId,
      ledgerId: input.ledgerId,
      branch,
      allowPlaceClarificationRoute: input.allowPlaceClarificationRoute,
    }),
  }));
}
