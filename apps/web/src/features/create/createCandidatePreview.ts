import type { RunReceipt } from "@features/analyze/schemas";
import type { CreateAnalyzeResponse } from "@/features/create/analyzeContract";
import {
  buildCreateHandoffDraft,
  type CreateHandoffDraft,
} from "@/features/create/createHandoff";
import { buildDossierRuntimeDraftFromHandoff } from "@/features/create/dossierRuntime";
import {
  PERSISTED_CREATE_HANDOFF_SCHEMA_VERSION,
  type PersistedCreateHandoffRecord,
} from "@/features/create/createHandoffPersistenceContract";
import { classifyCreateHandoffDraft } from "@/features/create/inputClassification";
import type { CreateIntakeContext } from "@/features/create/intakeContext";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
import type { NormalizedMaterialItem } from "@/features/create/materialRouting";

export type CreateCandidateKind =
  | "claim"
  | "counter_position"
  | "question"
  | "poll";

export type CreateCandidateInputOrigin = "human_input" | "server_draft";

export type CreateCandidateSourceProvenance =
  | "missing_source_provenance"
  | "input_reference_only"
  | "runtime_source_reference";

export type CreateCandidateDerivedBy =
  | "planner_followup"
  | "create_analyze"
  | "planner_plus_analyze";

export type CreateCandidateGraphTarget =
  | "dossier_candidate"
  | "participation_space_candidate";

export type CreateCandidateGraphTargetState = "candidate_only";

export type CreateCandidateReviewState = "review_required";
export type CreateCandidatePublishState = "not_published";

export type CreateCandidateReviewHandoffTargetCarrier =
  | "create_handoff_review_queue"
  | "dossier_runtime_record"
  | "participation_space_runtime_record";

export type CreateCandidateReviewHandoffTargetState =
  | "review_draft"
  | "candidate_only"
  | "planned_handoff"
  | "persisted_review_record"
  | "missing_persistence_truth";

export type CreateCandidatePreviewItem = {
  id: string;
  kind: CreateCandidateKind;
  title: string;
  summary: string;
  inputRef: string;
  inputOrigin: CreateCandidateInputOrigin;
  sourceProvenance: CreateCandidateSourceProvenance;
  derivedBy: CreateCandidateDerivedBy;
  sourceRefs: string[];
  evidenceRefs: string[];
  provider: string | null;
  model: string | null;
  providerRuntimeTruth: "present" | "missing_runtime_truth";
  reviewState: CreateCandidateReviewState;
  publishState: CreateCandidatePublishState;
  graphTarget: CreateCandidateGraphTarget;
  graphTargetState: CreateCandidateGraphTargetState;
};

export type CreateCandidatePreviewSection = {
  kind: CreateCandidateKind;
  label: string;
  emptyLabel: string;
  items: CreateCandidatePreviewItem[];
};

export type CreateCandidateReviewHandoffItem = {
  candidateId: string;
  candidateType: CreateCandidateKind;
  title: string;
  text: string;
  inputRef: string;
  inputOrigin: CreateCandidateInputOrigin;
  sourceProvenance: CreateCandidateSourceProvenance;
  evidenceRefs: string[];
  derivedBy: CreateCandidateDerivedBy;
  provider: string | null;
  model: string | null;
  targetCarrier: CreateCandidateReviewHandoffTargetCarrier;
  targetState: CreateCandidateReviewHandoffTargetState;
  targetRuntimeCarrier: Extract<
    CreateCandidateReviewHandoffTargetCarrier,
    "dossier_runtime_record" | "participation_space_runtime_record"
  >;
  reviewState: CreateCandidateReviewState;
  publishState: CreateCandidatePublishState;
  graphTargetState: CreateCandidateGraphTargetState;
  missingRuntimeTruth: string[];
};

export type CreateCandidateReviewHandoffReadModel = {
  title: string;
  summary: string;
  hasPreparedHandoff: boolean;
  targetCarrier: "create_handoff_review_queue";
  targetState: "review_draft";
  persistenceTruth: "missing_persistence_truth";
  carriesPersistentWrite: false;
  items: CreateCandidateReviewHandoffItem[];
};

export type CreateClaimToDossierPipelineTargetState =
  | "review_draft"
  | "dossier_candidate"
  | "dossier_handoff_prepared"
  | "persisted_review_record"
  | "participation_candidate"
  | "missing_persistence_truth"
  | "planned_handoff";

export type CreateClaimToDossierPipelineRecordType =
  | "dossier_runtime_draft"
  | "participation_space_runtime_draft";

export type CreateClaimToDossierPipelineItem = {
  handoffId: string;
  sourceCandidateId: string;
  candidateType: CreateCandidateKind;
  targetCarrier:
    | "dossier_runtime_record"
    | "participation_space_runtime_record";
  targetRecordType: CreateClaimToDossierPipelineRecordType;
  targetRecordId: string | null;
  targetState: CreateClaimToDossierPipelineTargetState;
  dossierTargetState: Exclude<
    CreateClaimToDossierPipelineTargetState,
    "participation_candidate"
  > | null;
  participationTargetState: Extract<
    CreateClaimToDossierPipelineTargetState,
    "participation_candidate" | "planned_handoff" | "persisted_review_record" | "missing_persistence_truth"
  > | null;
  inputRef: string;
  inputOrigin: CreateCandidateInputOrigin;
  sourceProvenance: CreateCandidateSourceProvenance;
  evidenceRefs: string[];
  derivedBy: CreateCandidateDerivedBy;
  provider: string | null;
  model: string | null;
  reviewState: CreateCandidateReviewState;
  publishState: CreateCandidatePublishState;
  graphTargetState: CreateCandidateGraphTargetState;
  persistenceState: "runtime_path_available" | "missing_persistence_truth";
  missingRuntimeTruth: string[];
};

export type CreateClaimToDossierPipelineReadModel = {
  title: string;
  summary: string;
  hasPreparedPipeline: boolean;
  handoffId: string | null;
  dossierRuntimeTruth: "persistent_runtime_available";
  participationRuntimeTruth: "persistent_runtime_available";
  carriesPersistentWrite: false;
  dossierDraftPreview: {
    title: string;
    summary: string;
    openQuestions: string[];
    visibility: string;
  } | null;
  items: CreateClaimToDossierPipelineItem[];
};

export type CreateCandidatePreviewReadModel = {
  title: string;
  summary: string;
  hasPreview: boolean;
  persistence: "preview_only";
  reviewState: CreateCandidateReviewState;
  publishState: CreateCandidatePublishState;
  graphTargetState: CreateCandidateGraphTargetState;
  provider: string | null;
  model: string | null;
  providerRuntimeTruth: "present" | "missing_runtime_truth";
  sections: CreateCandidatePreviewSection[];
  reviewHandoff: CreateCandidateReviewHandoffReadModel;
  claimToDossierPipeline: CreateClaimToDossierPipelineReadModel;
  totalCount: number;
  carriesPersistentWrite: false;
  persistentCarrierTruth: {
    claimsAndQuestions: "dossier_runtime_record";
    polls: "participation_space_runtime_record";
  };
};

type BuildCreateCandidatePreviewInput = {
  followup: CreateIntelligentFollowupResult | null;
  createAnalyze?: CreateAnalyzeResponse | null;
  runReceipt?: RunReceipt | null;
  intakeContext?: CreateIntakeContext | null;
  draftId?: string | null;
  sourceUrls?: string[] | null;
  materialItems?: NormalizedMaterialItem[] | null;
};

type CandidateProviderContext = {
  provider: string | null;
  model: string | null;
  runtimeTruth: "present" | "missing_runtime_truth";
};

type AnalyzeTextRecord = {
  text: string;
  id: string | null;
  sourceRefs: string[];
  rationale: string | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function hasText(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean)),
  );
}

function uniqueByTitle(items: CreateCandidatePreviewItem[]): CreateCandidatePreviewItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function targetRuntimeCarrierForItem(
  item: CreateCandidatePreviewItem,
): CreateCandidateReviewHandoffItem["targetRuntimeCarrier"] {
  return item.graphTarget === "participation_space_candidate"
    ? "participation_space_runtime_record"
    : "dossier_runtime_record";
}

function canPrepareCandidateReviewHandoff(item: CreateCandidatePreviewItem): boolean {
  return (
    hasText(item.title) &&
    hasText(item.summary) &&
    hasText(item.inputRef) &&
    item.reviewState === "review_required" &&
    item.publishState === "not_published" &&
    item.graphTargetState === "candidate_only"
  );
}

function buildCandidateReviewHandoff(
  sections: CreateCandidatePreviewSection[],
): CreateCandidateReviewHandoffReadModel {
  const items = sections
    .flatMap((section) => section.items)
    .filter(canPrepareCandidateReviewHandoff)
    .map((item) => ({
      candidateId: item.id,
      candidateType: item.kind,
      title: item.title,
      text: item.summary,
      inputRef: item.inputRef,
      inputOrigin: item.inputOrigin,
      sourceProvenance: item.sourceProvenance,
      evidenceRefs: item.evidenceRefs,
      derivedBy: item.derivedBy,
      provider: item.provider,
      model: item.model,
      targetCarrier: "create_handoff_review_queue" as const,
      targetState: "review_draft" as const,
      targetRuntimeCarrier: targetRuntimeCarrierForItem(item),
      reviewState: item.reviewState,
      publishState: item.publishState,
      graphTargetState: item.graphTargetState,
      missingRuntimeTruth: [
        ...(item.providerRuntimeTruth === "missing_runtime_truth"
          ? ["provider_model_missing_runtime_truth"]
          : []),
        ...(item.sourceProvenance === "missing_source_provenance"
          ? ["source_provenance_missing_runtime_truth"]
          : []),
      ],
    }));

  return {
    title: "Review-Handoff vorbereiten",
    summary: items.length > 0
      ? "Die Kandidaten werden nur als typed Handoff-Envelope für den bestehenden review-first Create-Handoff-Kontext vorbereitet. Es gibt dabei keine bestätigte Persistenz, keinen Auto-Publish und keinen Graph-Write."
      : "Ohne belastbare Kandidaten bleibt auch der Review-Handoff bewusst leer.",
    hasPreparedHandoff: items.length > 0,
    targetCarrier: "create_handoff_review_queue",
    targetState: "review_draft",
    persistenceTruth: "missing_persistence_truth",
    carriesPersistentWrite: false,
    items,
  };
}

function buildClaimToDossierPipelineSyntheticRecord(params: {
  handoff: CreateHandoffDraft | null;
  reviewHandoff: CreateCandidateReviewHandoffReadModel;
}): PersistedCreateHandoffRecord | null {
  const handoff = params.handoff;
  if (!handoff) return null;

  const dossierItems = params.reviewHandoff.items.filter((item) => item.candidateType !== "poll");
  if (dossierItems.length === 0) return null;

  const matchedClaims = new Map(
    handoff.claims.map((claim) => [normalizeText(claim.text), claim] as const),
  );
  const matchedArguments = new Map(
    handoff.arguments.map((argument) => [normalizeText(argument.text), argument] as const),
  );
  const matchedQuestions = new Map(
    handoff.openQuestions.map((question) => [normalizeText(question.question), question] as const),
  );

  const claims = dossierItems
    .filter((item) => item.candidateType === "claim")
    .map((item, index) => {
      const matched = matchedClaims.get(normalizeText(item.title));
      return (
        matched ?? {
          id: `claim-preview-${index + 1}`,
          text: item.title,
          kind: "factual_claim" as const,
          factcheckEligible: false,
          sourceRefs: item.evidenceRefs,
        }
      );
    });

  const claimIds = claims.slice(0, 2).map((claim) => claim.id);
  const argumentsDrafts = dossierItems
    .filter((item) => item.candidateType === "counter_position")
    .map((item, index) => {
      const matched = matchedArguments.get(normalizeText(item.title));
      return (
        matched ?? {
          id: `counter-preview-${index + 1}`,
          text: item.title,
          stance: "contra" as const,
          supportsClaimIds: claimIds,
        }
      );
    });

  const openQuestions = dossierItems
    .filter((item) => item.candidateType === "question")
    .map((item, index) => {
      const matched = matchedQuestions.get(normalizeText(item.title));
      return (
        matched ?? {
          id: `question-preview-${index + 1}`,
          question: item.title,
          requiredBeforePublish: true,
        }
      );
    });

  return {
    schemaVersion: PERSISTED_CREATE_HANDOFF_SCHEMA_VERSION,
    id: `claim-to-dossier:${handoff.id}`,
    source: "create",
    sourceText: handoff.sourceText,
    plannerResult: handoff.plannerResult,
    graphMatches: handoff.graphMatches,
    selectedAction: "create_dossier",
    claims,
    arguments: argumentsDrafts,
    openQuestions,
    sourceGrounding: handoff.sourceGrounding,
    topicSeed: handoff.topicSeed,
    resumeHref: handoff.resumeHref,
    reviewState: handoff.reviewState,
    visibilityState: handoff.visibilityState ?? "internal_review",
    requiresConfirmation: true,
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    noAutomaticOfficialResponse: true,
    noAutoFinalization: true,
    intakeClassification: classifyCreateHandoffDraft(handoff),
    createdByUserId: "missing_runtime_truth",
    regionId: null,
    organizationId: null,
    dossierId: null,
    anlassraumId: null,
    requestScope: null,
    accessDecision: null,
    createdAt: handoff.createdAt,
    updatedAt: handoff.createdAt,
  };
}

function buildClaimToDossierPipeline(params: {
  handoff: CreateHandoffDraft | null;
  reviewHandoff: CreateCandidateReviewHandoffReadModel;
}): CreateClaimToDossierPipelineReadModel {
  const syntheticRecord = buildClaimToDossierPipelineSyntheticRecord(params);
  const dossierDraftPreview = syntheticRecord
    ? buildDossierRuntimeDraftFromHandoff(syntheticRecord, {
        status: "queued_for_review",
      })
    : null;
  const items = params.reviewHandoff.items.map((item) => {
    const sharedMissingReasons = uniqueStrings([
      "candidate_handoff_not_persisted",
      ...item.missingRuntimeTruth,
      ...(params.handoff ? [] : ["create_handoff_metadata_missing"]),
    ]);

    if (item.candidateType === "poll") {
      return {
        handoffId: params.handoff?.id ?? "missing_runtime_truth",
        sourceCandidateId: item.candidateId,
        candidateType: item.candidateType,
        targetCarrier: "participation_space_runtime_record" as const,
        targetRecordType: "participation_space_runtime_draft" as const,
        targetRecordId: null,
        targetState: "planned_handoff" as const,
        dossierTargetState: null,
        participationTargetState: "planned_handoff" as const,
        inputRef: item.inputRef,
        inputOrigin: item.inputOrigin,
        sourceProvenance: item.sourceProvenance,
        evidenceRefs: item.evidenceRefs,
        derivedBy: item.derivedBy,
        provider: item.provider,
        model: item.model,
        reviewState: item.reviewState,
        publishState: item.publishState,
        graphTargetState: item.graphTargetState,
        persistenceState: "missing_persistence_truth" as const,
        missingRuntimeTruth: uniqueStrings([
          ...sharedMissingReasons,
          "participation_runtime_handoff_not_persisted",
        ]),
      };
    }

    return {
      handoffId: params.handoff?.id ?? "missing_runtime_truth",
      sourceCandidateId: item.candidateId,
      candidateType: item.candidateType,
      targetCarrier: "dossier_runtime_record" as const,
      targetRecordType: "dossier_runtime_draft" as const,
      targetRecordId: null,
      targetState: "dossier_handoff_prepared" as const,
      dossierTargetState: "dossier_handoff_prepared" as const,
      participationTargetState: null,
      inputRef: item.inputRef,
      inputOrigin: item.inputOrigin,
      sourceProvenance: item.sourceProvenance,
      evidenceRefs: item.evidenceRefs,
      derivedBy: item.derivedBy,
      provider: item.provider,
      model: item.model,
      reviewState: item.reviewState,
      publishState: item.publishState,
      graphTargetState: item.graphTargetState,
      persistenceState: "missing_persistence_truth" as const,
      missingRuntimeTruth: sharedMissingReasons,
    };
  });

  const hasPreparedPipeline = items.length > 0;

  return {
    title: "Claim-to-Dossier-Pipeline vorbereiten",
    summary: hasPreparedPipeline
      ? dossierDraftPreview
        ? "Claims, Gegenpositionen und Fragen werden als review-first Dossier-Handoff auf den bestehenden `dossier_runtime_record`-Pfad ausgerichtet. Die Persistenz dieses Candidate-Handoffs fehlt weiterhin; Umfragen bleiben nur als geplanter Beteiligungsraum-Folgepfad sichtbar."
        : "Die Zielstruktur fuer Dossier- und Beteiligungsraum-Folgepfade ist sichtbar, aber ohne belastbaren Create-Handoff-Kontext bleibt sie bei fehlender Persistenz- und Runtime-Truth."
      : "Ohne belastbare Kandidaten bleibt auch die Claim-to-Dossier-Pipeline bewusst leer.",
    hasPreparedPipeline,
    handoffId: params.handoff?.id ?? null,
    dossierRuntimeTruth: "persistent_runtime_available",
    participationRuntimeTruth: "persistent_runtime_available",
    carriesPersistentWrite: false,
    dossierDraftPreview: dossierDraftPreview
      ? {
          title: dossierDraftPreview.title,
          summary: dossierDraftPreview.summary,
          openQuestions: dossierDraftPreview.openQuestions,
          visibility: dossierDraftPreview.visibility,
        }
      : null,
    items,
  };
}

function resolveInputOrigin(
  draftId: string | null | undefined,
  intakeContext?: CreateIntakeContext | null,
): CreateCandidateInputOrigin {
  return hasText(draftId ?? intakeContext?.draftId) ? "server_draft" : "human_input";
}

function resolveInputRef(params: {
  draftId?: string | null;
  intakeContext?: CreateIntakeContext | null;
  createAnalyze?: CreateAnalyzeResponse | null;
}): string {
  if (hasText(params.draftId)) return normalizeText(params.draftId);
  if (hasText(params.intakeContext?.draftId)) return normalizeText(params.intakeContext?.draftId);
  if (hasText(params.createAnalyze?.inputRef)) return normalizeText(params.createAnalyze?.inputRef);
  if (hasText(params.createAnalyze?.runId)) return normalizeText(params.createAnalyze?.runId);
  return "create-intake";
}

function resolveDerivedBy(params: {
  followup: CreateIntelligentFollowupResult | null;
  createAnalyze?: CreateAnalyzeResponse | null;
}): CreateCandidateDerivedBy {
  if (params.followup && params.createAnalyze) return "planner_plus_analyze";
  if (params.createAnalyze) return "create_analyze";
  return "planner_followup";
}

function resolveProviderContext(params: {
  followup: CreateIntelligentFollowupResult | null;
  createAnalyze?: CreateAnalyzeResponse | null;
  runReceipt?: RunReceipt | null;
}): CandidateProviderContext {
  const analyzeProvider = normalizeText(params.runReceipt?.provider);
  const analyzeModel = normalizeText(params.runReceipt?.model);
  if (analyzeProvider || analyzeModel) {
    return {
      provider: analyzeProvider || null,
      model: analyzeModel || null,
      runtimeTruth: "present",
    };
  }

  const planner = params.followup?.meta?.planner;
  if (
    planner?.providerCallSucceeded &&
    hasText(planner.plannerProvider) &&
    planner.plannerProvider !== "none"
  ) {
    return {
      provider: planner.plannerProvider,
      model: null,
      runtimeTruth: "present",
    };
  }

  return {
    provider: null,
    model: null,
    runtimeTruth: "missing_runtime_truth",
  };
}

function buildFallbackHandoff(
  input: BuildCreateCandidatePreviewInput,
): CreateHandoffDraft | null {
  if (!input.followup) return null;
  return buildCreateHandoffDraft({
    result: input.followup,
    selectedAction: "request_review",
    sourceUrls: input.sourceUrls ?? [],
    materialItems: input.materialItems ?? [],
  });
}

function buildInputRefs(input: BuildCreateCandidatePreviewInput, handoff: CreateHandoffDraft | null) {
  return uniqueStrings([
    ...(input.sourceUrls ?? []),
    ...(input.materialItems ?? []).map((item) => item.url ?? item.uploadId ?? item.id),
    ...(handoff?.sourceGrounding ?? []).map((item) =>
      item.status === "link_reference" ? item.detail ?? item.label : null,
    ),
  ]);
}

function buildEvidenceRefs(input: BuildCreateCandidatePreviewInput, inputRefs: string[]): string[] {
  return uniqueStrings([
    input.createAnalyze?.runId,
    input.createAnalyze?.inputRef,
    input.runReceipt?.id,
    input.runReceipt?.snapshotId,
    ...inputRefs,
    ...(input.runReceipt?.sourceSet ?? []).map((item) => item.canonicalUrl),
  ]);
}

function resolveSourceProvenance(params: {
  inputRefs: string[];
  runReceipt?: RunReceipt | null;
  itemSourceRefs: string[];
}): CreateCandidateSourceProvenance {
  const hasRuntimeSources = Boolean((params.runReceipt?.sourceSet ?? []).length);
  if (hasRuntimeSources) return "runtime_source_reference";
  if (params.inputRefs.length > 0 || params.itemSourceRefs.length > 0) {
    return "input_reference_only";
  }
  return "missing_source_provenance";
}

function describeSourceProvenance(value: CreateCandidateSourceProvenance): string {
  switch (value) {
    case "runtime_source_reference":
      return "Analyze-/Quellenkontext vorhanden";
    case "input_reference_only":
      return "Input-/Draft-Referenz vorhanden";
    case "missing_source_provenance":
      return "Keine externe Quelle behauptet";
  }
}

function mapAnalyzeTextRecords(value: unknown, rationaleFallback?: string): AnalyzeTextRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      const record = (entry ?? {}) as Record<string, unknown>;
      const text = normalizeText(record.text ?? record.question ?? record.title);
      if (!text) return null;
      const sourceRefs = Array.isArray(record.sourceRefs)
        ? record.sourceRefs.map((item) => normalizeText(item)).filter(Boolean)
        : [];
      return {
        text,
        id: hasText(record.id) ? normalizeText(record.id) : `candidate-${index + 1}`,
        sourceRefs,
        rationale: hasText(record.rationale)
          ? normalizeText(record.rationale)
          : rationaleFallback ?? null,
      };
    })
    .filter((entry): entry is AnalyzeTextRecord => Boolean(entry));
}

function buildClaimItems(params: {
  input: BuildCreateCandidatePreviewInput;
  handoff: CreateHandoffDraft | null;
  inputOrigin: CreateCandidateInputOrigin;
  inputRef: string;
  derivedBy: CreateCandidateDerivedBy;
  providerContext: CandidateProviderContext;
  inputRefs: string[];
  evidenceRefs: string[];
}): CreateCandidatePreviewItem[] {
  const fromAnalyze = mapAnalyzeTextRecords(
    params.input.createAnalyze?.claims,
    "Als Claim-Kandidat aus dem Analyze-Ergebnis übernommen.",
  ).map((entry, index) => ({
    id: `claim-analyze-${entry.id ?? index + 1}`,
    title: entry.text,
    summary: entry.rationale ?? "Als Claim-Kandidat aus dem Analyze-Ergebnis übernommen.",
    sourceRefs: uniqueStrings([...params.inputRefs, ...entry.sourceRefs]),
  }));

  const fromHandoff = (params.handoff?.claims ?? []).map((entry, index) => ({
    id: `claim-followup-${entry.id || index + 1}`,
    title: entry.text,
    summary:
      entry.kind === "factual_claim"
        ? "Als prüfbarer Claim aus Planner-/Follow-up-Struktur übernommen."
        : entry.kind === "policy_claim"
          ? "Als policy-naher Claim aus Planner-/Follow-up-Struktur übernommen."
          : "Als normativer Claim aus Planner-/Follow-up-Struktur übernommen.",
    sourceRefs: uniqueStrings([...params.inputRefs, ...entry.sourceRefs]),
  }));

  return uniqueByTitle(
    [...fromAnalyze, ...fromHandoff].slice(0, 6).map((entry, index) => {
      const sourceProvenance = resolveSourceProvenance({
        inputRefs: params.inputRefs,
        runReceipt: params.input.runReceipt,
        itemSourceRefs: entry.sourceRefs,
      });
      return {
        id: entry.id,
        kind: "claim" as const,
        title: entry.title,
        summary: `${entry.summary} ${describeSourceProvenance(sourceProvenance)}.`,
        inputRef: params.inputRef,
        inputOrigin: params.inputOrigin,
        sourceProvenance,
        derivedBy: params.derivedBy,
        sourceRefs: entry.sourceRefs,
        evidenceRefs: params.evidenceRefs,
        provider: params.providerContext.provider,
        model: params.providerContext.model,
        providerRuntimeTruth: params.providerContext.runtimeTruth,
        reviewState: "review_required",
        publishState: "not_published",
        graphTarget: "dossier_candidate",
        graphTargetState: "candidate_only",
      };
    }),
  );
}

function buildCounterPositionItems(params: {
  input: BuildCreateCandidatePreviewInput;
  handoff: CreateHandoffDraft | null;
  inputOrigin: CreateCandidateInputOrigin;
  inputRef: string;
  derivedBy: CreateCandidateDerivedBy;
  providerContext: CandidateProviderContext;
  inputRefs: string[];
  evidenceRefs: string[];
}): CreateCandidatePreviewItem[] {
  const fromAnalyze = mapAnalyzeTextRecords(
    params.input.createAnalyze?.missingPerspectives,
    "Als fehlende oder unterrepräsentierte Perspektive aus Analyze markiert.",
  ).map((entry, index) => ({
    id: `counter-analyze-${entry.id ?? index + 1}`,
    title: entry.text,
    summary: entry.rationale ?? "Als fehlende oder unterrepräsentierte Perspektive aus Analyze markiert.",
    sourceRefs: uniqueStrings([...params.inputRefs, ...entry.sourceRefs]),
  }));

  const fromArguments = (params.handoff?.arguments ?? [])
    .filter((entry) => entry.stance === "contra" || entry.stance === "mixed")
    .map((entry, index) => ({
      id: `counter-followup-${entry.id || index + 1}`,
      title: entry.text,
      summary:
        entry.stance === "contra"
          ? "Als Gegenposition aus Planner-/Follow-up-Argumentation übernommen."
          : "Als abwägende Gegenposition aus Planner-/Follow-up-Argumentation übernommen.",
      sourceRefs: [...params.inputRefs],
    }));

  return uniqueByTitle(
    [...fromAnalyze, ...fromArguments].slice(0, 4).map((entry) => {
      const sourceProvenance = resolveSourceProvenance({
        inputRefs: params.inputRefs,
        runReceipt: params.input.runReceipt,
        itemSourceRefs: entry.sourceRefs,
      });
      return {
        id: entry.id,
        kind: "counter_position" as const,
        title: entry.title,
        summary: `${entry.summary} ${describeSourceProvenance(sourceProvenance)}.`,
        inputRef: params.inputRef,
        inputOrigin: params.inputOrigin,
        sourceProvenance,
        derivedBy: params.derivedBy,
        sourceRefs: entry.sourceRefs,
        evidenceRefs: params.evidenceRefs,
        provider: params.providerContext.provider,
        model: params.providerContext.model,
        providerRuntimeTruth: params.providerContext.runtimeTruth,
        reviewState: "review_required",
        publishState: "not_published",
        graphTarget: "dossier_candidate",
        graphTargetState: "candidate_only",
      };
    }),
  );
}

function buildQuestionItems(params: {
  input: BuildCreateCandidatePreviewInput;
  handoff: CreateHandoffDraft | null;
  inputOrigin: CreateCandidateInputOrigin;
  inputRef: string;
  derivedBy: CreateCandidateDerivedBy;
  providerContext: CandidateProviderContext;
  inputRefs: string[];
  evidenceRefs: string[];
}): CreateCandidatePreviewItem[] {
  const fromAnalyze = mapAnalyzeTextRecords(
    params.input.createAnalyze?.questions,
    "Als offene Frage aus Analyze übernommen.",
  ).map((entry, index) => ({
    id: `question-analyze-${entry.id ?? index + 1}`,
    title: entry.text,
    summary: entry.rationale ?? "Als offene Frage aus Analyze übernommen.",
    sourceRefs: uniqueStrings([...params.inputRefs, ...entry.sourceRefs]),
  }));

  const fromHandoff = (params.handoff?.openQuestions ?? []).map((entry, index) => ({
    id: `question-followup-${entry.id || index + 1}`,
    title: entry.question,
    summary: entry.requiredBeforePublish
      ? "Als vor Veröffentlichung zu klärende Frage aus Planner-/Follow-up übernommen."
      : "Als offene Frage aus Planner-/Follow-up übernommen.",
    sourceRefs: [...params.inputRefs],
  }));

  return uniqueByTitle(
    [...fromAnalyze, ...fromHandoff].slice(0, 6).map((entry) => {
      const sourceProvenance = resolveSourceProvenance({
        inputRefs: params.inputRefs,
        runReceipt: params.input.runReceipt,
        itemSourceRefs: entry.sourceRefs,
      });
      return {
        id: entry.id,
        kind: "question" as const,
        title: entry.title,
        summary: `${entry.summary} ${describeSourceProvenance(sourceProvenance)}.`,
        inputRef: params.inputRef,
        inputOrigin: params.inputOrigin,
        sourceProvenance,
        derivedBy: params.derivedBy,
        sourceRefs: entry.sourceRefs,
        evidenceRefs: params.evidenceRefs,
        provider: params.providerContext.provider,
        model: params.providerContext.model,
        providerRuntimeTruth: params.providerContext.runtimeTruth,
        reviewState: "review_required",
        publishState: "not_published",
        graphTarget: "dossier_candidate",
        graphTargetState: "candidate_only",
      };
    }),
  );
}

function buildPollItems(params: {
  input: BuildCreateCandidatePreviewInput;
  handoff: CreateHandoffDraft | null;
  inputOrigin: CreateCandidateInputOrigin;
  inputRef: string;
  derivedBy: CreateCandidateDerivedBy;
  providerContext: CandidateProviderContext;
  inputRefs: string[];
  evidenceRefs: string[];
}): CreateCandidatePreviewItem[] {
  const fromAnalyze = mapAnalyzeTextRecords(
    params.input.createAnalyze?.participationCandidates,
    "Als möglicher Beteiligungs- oder Umfrageansatz aus Analyze übernommen.",
  ).map((entry, index) => ({
    id: `poll-analyze-${entry.id ?? index + 1}`,
    title: entry.text,
    summary: entry.rationale ?? "Als möglicher Beteiligungs- oder Umfrageansatz aus Analyze übernommen.",
    sourceRefs: uniqueStrings([...params.inputRefs, ...entry.sourceRefs]),
  }));

  const fromSuggestions = (params.input.followup?.suggestions ?? [])
    .filter((entry) => entry.kind === "vote")
    .map((entry, index) => ({
      id: `poll-followup-${entry.id || index + 1}`,
      title: entry.title,
      summary: "Als mögliche Umfrage-/Beteiligungsfrage aus dem Follow-up übernommen.",
      sourceRefs: [...params.inputRefs],
    }));

  return uniqueByTitle(
    [...fromAnalyze, ...fromSuggestions].slice(0, 4).map((entry) => {
      const sourceProvenance = resolveSourceProvenance({
        inputRefs: params.inputRefs,
        runReceipt: params.input.runReceipt,
        itemSourceRefs: entry.sourceRefs,
      });
      return {
        id: entry.id,
        kind: "poll" as const,
        title: entry.title,
        summary: `${entry.summary} ${describeSourceProvenance(sourceProvenance)}.`,
        inputRef: params.inputRef,
        inputOrigin: params.inputOrigin,
        sourceProvenance,
        derivedBy: params.derivedBy,
        sourceRefs: entry.sourceRefs,
        evidenceRefs: params.evidenceRefs,
        provider: params.providerContext.provider,
        model: params.providerContext.model,
        providerRuntimeTruth: params.providerContext.runtimeTruth,
        reviewState: "review_required",
        publishState: "not_published",
        graphTarget: "participation_space_candidate",
        graphTargetState: "candidate_only",
      };
    }),
  );
}

export function buildCreateCandidatePreviewReadModel(
  input: BuildCreateCandidatePreviewInput,
): CreateCandidatePreviewReadModel {
  const handoff = buildFallbackHandoff(input);
  const inputOrigin = resolveInputOrigin(input.draftId ?? null, input.intakeContext);
  const inputRef = resolveInputRef({
    draftId: input.draftId ?? null,
    intakeContext: input.intakeContext,
    createAnalyze: input.createAnalyze ?? null,
  });
  const derivedBy = resolveDerivedBy({
    followup: input.followup,
    createAnalyze: input.createAnalyze ?? null,
  });
  const providerContext = resolveProviderContext({
    followup: input.followup,
    createAnalyze: input.createAnalyze ?? null,
    runReceipt: input.runReceipt ?? null,
  });
  const inputRefs = buildInputRefs(input, handoff);
  const evidenceRefs = buildEvidenceRefs(input, inputRefs);

  const sections: CreateCandidatePreviewSection[] = [
    {
      kind: "claim",
      label: "Claim-Kandidaten",
      emptyLabel: "Noch kein belastbarer Claim-Kandidat ohne zusätzliche Analyse oder Review.",
      items: buildClaimItems({
        input,
        handoff,
        inputOrigin,
        inputRef,
        derivedBy,
        providerContext,
        inputRefs,
        evidenceRefs,
      }),
    },
    {
      kind: "counter_position",
      label: "Gegenpositions-Kandidaten",
      emptyLabel:
        "Noch keine belastbare Gegenposition ableitbar, ohne eine neue Perspektive zu erfinden.",
      items: buildCounterPositionItems({
        input,
        handoff,
        inputOrigin,
        inputRef,
        derivedBy,
        providerContext,
        inputRefs,
        evidenceRefs,
      }),
    },
    {
      kind: "question",
      label: "Fragen-Kandidaten",
      emptyLabel: "Noch keine zusätzliche Review-Frage sichtbar.",
      items: buildQuestionItems({
        input,
        handoff,
        inputOrigin,
        inputRef,
        derivedBy,
        providerContext,
        inputRefs,
        evidenceRefs,
      }),
    },
    {
      kind: "poll",
      label: "Umfrage-Kandidaten",
      emptyLabel:
        "Noch keine belastbare Umfrage-Idee ableitbar, ohne Optionen oder Ergebnisse vorzutäuschen.",
      items: buildPollItems({
        input,
        handoff,
        inputOrigin,
        inputRef,
        derivedBy,
        providerContext,
        inputRefs,
        evidenceRefs,
      }),
    },
  ];

  const reviewHandoff = buildCandidateReviewHandoff(sections);
  const claimToDossierPipeline = buildClaimToDossierPipeline({
    handoff,
    reviewHandoff,
  });
  const totalCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const hasPreview = totalCount > 0;

  return {
    title: "Review-first Kandidaten aus Draft, Planner und Analyze",
    summary: hasPreview
      ? "Die Kandidaten bleiben eine Vorschau. Sie werden hier weder persistiert noch veröffentlicht und schreiben nichts automatisch in Dossier, Beteiligungsraum oder Graph."
      : "Ohne belastbare Strukturhinweise bleibt dieser Schritt bewusst leer, statt Claims, Gegenpositionen, Fragen oder Umfragen zu erfinden.",
    hasPreview,
    persistence: "preview_only",
    reviewState: "review_required",
    publishState: "not_published",
    graphTargetState: "candidate_only",
    provider: providerContext.provider,
    model: providerContext.model,
    providerRuntimeTruth: providerContext.runtimeTruth,
    sections,
    reviewHandoff,
    claimToDossierPipeline,
    totalCount,
    carriesPersistentWrite: false,
    persistentCarrierTruth: {
      claimsAndQuestions: "dossier_runtime_record",
      polls: "participation_space_runtime_record",
    },
  };
}
