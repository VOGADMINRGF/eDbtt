import type { RunReceipt } from "@features/analyze/schemas";
import type { CreateAnalyzeResponse } from "@/features/create/analyzeContract";
import {
  buildCreateHandoffDraft,
  type CreateHandoffDraft,
} from "@/features/create/createHandoff";
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
    totalCount,
    carriesPersistentWrite: false,
    persistentCarrierTruth: {
      claimsAndQuestions: "dossier_runtime_record",
      polls: "participation_space_runtime_record",
    },
  };
}
