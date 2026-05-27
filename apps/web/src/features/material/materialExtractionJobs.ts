import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { normalizeGermanSearchText, normalizeGermanSlug } from "@features/common/utils/textNormalization";
import type { AutonomousThemenradarScope } from "@features/themenradar/autonomousSupply";
import { resolveAiFlowIntegration } from "@/features/ai/v2OrchestrationPolicy";
import {
  getMaterialIntakePersistenceState,
  getMaterialIntakeRecord,
  type MaterialIntakePersistenceState,
  type MaterialIntakeRecord,
} from "./materialIntakeRepository";

export const MATERIAL_EXTRACTION_SOURCE_TYPES = [
  "pdf",
  "youtube",
  "document_url",
  "press_release",
  "meeting_minutes",
  "manual_file",
  "other",
] as const;

export type MaterialExtractionSourceType = (typeof MATERIAL_EXTRACTION_SOURCE_TYPES)[number];

export const MATERIAL_EXTRACTION_JOB_STATUSES = [
  "queued",
  "metadata_ready",
  "extraction_pending",
  "extracting",
  "extracted",
  "needs_review",
  "attached_to_dossier",
  "attached_to_themenradar",
  "failed",
  "blocked",
] as const;

export type MaterialExtractionJobStatus = (typeof MATERIAL_EXTRACTION_JOB_STATUSES)[number];

export const MATERIAL_EXTRACTION_MODES = [
  "metadata_only",
  "text_extract",
  "transcript_extract",
  "manual_review",
] as const;

export type MaterialExtractionMode = (typeof MATERIAL_EXTRACTION_MODES)[number];

export const MATERIAL_EXTRACTION_COST_GUARDS = ["free", "requires_approval", "blocked"] as const;
export type MaterialExtractionCostGuard = (typeof MATERIAL_EXTRACTION_COST_GUARDS)[number];

export type MaterialExtractionDraft = {
  text: string;
  reviewState: "draft";
};

export type MaterialExtractionDossierHandoff = {
  dossierId: string;
  title: string;
  section: "sources" | "claims" | "questions" | "updates";
  statusLabel: "in Prüfung";
  href: string;
};

export type MaterialExtractionAnlassraumHandoff = {
  anlassraumId: string;
  title: string;
  statusLabel: "in Prüfung";
  href: string;
};

export type MaterialExtractionThemenradarHandoff = {
  topicCandidateId: string;
  topicLabel: string;
  clusterTopicKey: string;
  urgencyScore: number;
  relevanceScore: number;
  regionalityScore: number;
  participationPotential: number;
  reviewState: "needs_review";
  nextSuggestedAction: {
    label: string;
    description: string;
    href: string;
  };
};

export type MaterialExtractionJob = {
  id: string;
  materialId: string;
  materialLabel: string;
  sourceType: MaterialExtractionSourceType;
  submittedBy: string;
  organizationId: string | null;
  regionId: string | null;
  dossierId: string | null;
  anlassraumId: string | null;
  status: MaterialExtractionJobStatus;
  statusLabel: string;
  extractionMode: MaterialExtractionMode;
  costGuard: MaterialExtractionCostGuard;
  costGuardLabel: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  reviewRequired: true;
  noAutoPublish: true;
  noAutoDeepSearch: true;
  noAutoOfficial: true;
  sourceHints: string[];
  claimDrafts: MaterialExtractionDraft[];
  questionDrafts: MaterialExtractionDraft[];
  optionDrafts: MaterialExtractionDraft[];
  evidenceHints: string[];
  dossierHandoff: MaterialExtractionDossierHandoff | null;
  anlassraumHandoff: MaterialExtractionAnlassraumHandoff | null;
  themenradarHandoff: MaterialExtractionThemenradarHandoff | null;
  aiOrchestration: {
    lane: string;
    laneLabel: string;
    outputLabel: string;
    reviewRequired: true;
    draftOnly: true;
    publicOutputAllowed: false;
    costApprovalRequired: boolean;
    researchAllowed: boolean;
  };
  nextSuggestedAction: {
    label: string;
    description: string;
    href: string;
  };
};

export type MaterialExtractionJobPersistenceState = {
  mode: "persistent_primary" | "in_memory_fallback";
  label: string;
  summary: string;
  repositoryInterface: "MaterialExtractionJobRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  jobsDurable: boolean;
  derivedOutputsDurable: boolean;
  noAutoPublish: true;
};

export type MaterialExtractionJobReadModel = {
  generatedAt: string;
  items: MaterialExtractionJob[];
  summary: {
    totalJobs: number;
    waitingJobs: number;
    failedJobs: number;
    blockedJobs: number;
    approvalRequiredJobs: number;
    reviewReadyJobs: number;
    dossierHandoffs: number;
    themenradarHandoffs: number;
    nextAction: {
      label: string;
      description: string;
      href: string;
    };
  };
  persistence: MaterialExtractionJobPersistenceState;
  intakePersistence: MaterialIntakePersistenceState;
};

export type MaterialExtractionThemenradarSeed = {
  sourceId: string;
  sourceType: "material";
  title: string;
  topicLabel: string;
  clusterTopicKey: string;
  regionId: string | null;
  organizationId: string | null;
  claims: string[];
  questions: string[];
  options: string[];
  evidenceHints: string[];
  reviewRequired: true;
  weakEvidence: boolean;
  createdAt: string | null;
  sourceHref: string | null;
  swipesHref: string | null;
  dossierHref: string | null;
  anlassraumHref: string | null;
  priorityBoost: number;
};

export type CreateMaterialExtractionJobInput = {
  materialId: string;
  submittedBy: string;
  extractionMode: MaterialExtractionMode;
  dossierId?: string | null;
  anlassraumId?: string | null;
  approveCost?: boolean;
};

export type MaterialExtractionJobRepository = {
  createJob(input: CreateMaterialExtractionJobInput): Promise<{
    job: MaterialExtractionJob;
    persistence: MaterialExtractionJobPersistenceState;
  }>;
  listJobs(query?: {
    organizationIds?: string[];
    regionIds?: string[];
    statuses?: MaterialExtractionJobStatus[];
    limit?: number;
  }): Promise<MaterialExtractionJob[]>;
  getJob(jobId: string): Promise<MaterialExtractionJob | null>;
  getPersistenceState(): MaterialExtractionJobPersistenceState;
};

const MATERIAL_EXTRACTION_COLLECTION = "edebatte_material_extraction_jobs";
let repoSingleton: MaterialExtractionJobRepository | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function normalizeLimit(value: unknown, fallback = 50) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.max(1, Math.min(200, Math.floor(numeric)));
}

function persistenceState(mode: MaterialExtractionJobPersistenceState["mode"]): MaterialExtractionJobPersistenceState {
  const persistent = mode === "persistent_primary";
  return {
    mode,
    label: persistent ? "Persistente Material-Extraktionsjobs" : "In-Memory-Extraktionsjob-Fallback",
    summary: persistent
      ? "Extraktionsjobs, Guardrails und abgeleitete Review-Handoffs liegen dauerhaft in Core-Collections. Daraus wird keine automatische Veröffentlichung oder Wahrheit abgeleitet."
      : "Nur Dev-/Test-/Build-Fallback: Extraktionsjobs leben pro Prozess und sind keine Produktionswahrheit.",
    repositoryInterface: "MaterialExtractionJobRepository",
    storeKind: persistent ? "mongo_collection" : "in_memory",
    productionTruth: persistent,
    jobsDurable: persistent,
    derivedOutputsDurable: persistent,
    noAutoPublish: true,
  };
}

function sourceTypeFromRecord(record: MaterialIntakeRecord): MaterialExtractionSourceType {
  const label = [record.label, record.fileName, record.url, record.mimeType, record.intakeItem.type]
    .map((value) => String(value ?? "").toLowerCase())
    .join(" ");
  if (label.includes("youtube") || label.includes("youtu.be")) return "youtube";
  if (label.includes("press") || label.includes("presse")) return "press_release";
  if (label.includes("meeting") || label.includes("protokoll") || label.includes("minutes")) return "meeting_minutes";
  if (record.intakeItem.type === "pdf") return "pdf";
  if (record.intakeItem.type === "document_url" || record.url) return "document_url";
  if (record.intakeItem.type === "upload" || record.fileName) return "manual_file";
  return "other";
}

function costGuardFor(input: {
  sourceType: MaterialExtractionSourceType;
  extractionMode: MaterialExtractionMode;
  record: MaterialIntakeRecord;
}): MaterialExtractionCostGuard {
  if (input.extractionMode === "metadata_only" || input.extractionMode === "manual_review") return "free";
  if (input.extractionMode === "transcript_extract") {
    return input.sourceType === "youtube" ? "requires_approval" : "blocked";
  }
  if (input.extractionMode === "text_extract") {
    if (input.sourceType === "youtube") return "requires_approval";
    return "free";
  }
  return "blocked";
}

function statusLabel(status: MaterialExtractionJobStatus) {
  switch (status) {
    case "queued":
      return "In Warteschlange";
    case "metadata_ready":
      return "Metadaten bereit";
    case "extraction_pending":
      return "Extraktion vorbereitet";
    case "extracting":
      return "Extraktion läuft";
    case "extracted":
      return "Extraktion vorhanden";
    case "needs_review":
      return "In Prüfung";
    case "attached_to_dossier":
      return "Im Dossier-Kontext";
    case "attached_to_themenradar":
      return "Im Themenradar-Kontext";
    case "failed":
      return "Fehlgeschlagen";
    case "blocked":
    default:
      return "Blockiert";
  }
}

function costGuardLabel(value: MaterialExtractionCostGuard) {
  switch (value) {
    case "free":
      return "Kostenfrei im vorhandenen Pfad";
    case "requires_approval":
      return "Nur mit Kostenfreigabe";
    case "blocked":
    default:
      return "Derzeit blockiert";
  }
}

function splitSentences(value: string) {
  return value
    .split(/[\n\r]+|(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function dedupeTexts(values: Array<string | null | undefined>) {
  const seen = new Map<string, string>();
  for (const value of values) {
    const normalized = normalizeString(value);
    if (!normalized) continue;
    const key = normalizeGermanSearchText(normalized);
    if (!key || seen.has(key)) continue;
    seen.set(key, normalized);
  }
  return Array.from(seen.values());
}

function materialTexts(record: MaterialIntakeRecord) {
  const base = dedupeTexts([
    record.label,
    record.fileName,
    record.url,
    record.textPreview,
  ]);
  const sentenceSource = normalizeString(record.textPreview) ?? normalizeString(record.label) ?? normalizeString(record.fileName) ?? "";
  return {
    hints: base,
    sentences: splitSentences(sentenceSource),
  };
}

function deriveClaimDrafts(record: MaterialIntakeRecord) {
  const texts = materialTexts(record);
  const claims = texts.sentences.filter((sentence) => !sentence.endsWith("?")).slice(0, 3);
  return dedupeTexts(claims.length > 0 ? claims : texts.hints.slice(0, 2)).map((text) => ({
    text,
    reviewState: "draft" as const,
  }));
}

function deriveQuestionDrafts(record: MaterialIntakeRecord) {
  const texts = materialTexts(record);
  const questions = texts.sentences.filter((sentence) => sentence.endsWith("?")).slice(0, 3);
  return dedupeTexts(questions).map((text) => ({ text, reviewState: "draft" as const }));
}

function deriveOptionDrafts(record: MaterialIntakeRecord) {
  const texts = materialTexts(record);
  const options = texts.sentences.filter((sentence) => /^(-|Option|Variante|Alternativ)/i.test(sentence)).slice(0, 3);
  return dedupeTexts(options).map((text) => ({ text, reviewState: "draft" as const }));
}

function deriveEvidenceHints(record: MaterialIntakeRecord) {
  return dedupeTexts([
    record.url,
    record.fileName,
    record.mimeType,
    record.pageRef,
    record.timestampRef,
  ]);
}

function canDeriveReviewHints(record: MaterialIntakeRecord) {
  return (
    deriveClaimDrafts(record).length > 0 ||
    deriveQuestionDrafts(record).length > 0 ||
    deriveOptionDrafts(record).length > 0 ||
    deriveEvidenceHints(record).length > 0
  );
}

function buildTopicLabel(record: MaterialIntakeRecord) {
  return normalizeString(record.label) ?? normalizeString(record.fileName) ?? "Material-Hinweis";
}

function buildThemenradarHandoff(input: {
  jobId: string;
  record: MaterialIntakeRecord;
  claims: MaterialExtractionDraft[];
  questions: MaterialExtractionDraft[];
  options: MaterialExtractionDraft[];
  evidenceHints: string[];
}): MaterialExtractionThemenradarHandoff | null {
  const topicLabel = buildTopicLabel(input.record);
  const clusterTopicKey = normalizeGermanSlug(topicLabel, { maxLength: 48, fallback: "material-hinweis" });
  const urgencyScore = Math.min(100, 28 + input.claims.length * 14 + input.questions.length * 10);
  const relevanceScore = Math.min(100, 24 + input.evidenceHints.length * 16 + input.claims.length * 10);
  const regionalityScore = input.record.organizationId ? 100 : input.record.regionId ? 78 : 30;
  const participationPotential = Math.min(100, 18 + input.questions.length * 18 + input.options.length * 12);
  return {
    topicCandidateId: `material-topic:${input.jobId}`,
    topicLabel,
    clusterTopicKey,
    urgencyScore,
    relevanceScore,
    regionalityScore,
    participationPotential,
    reviewState: "needs_review",
    nextSuggestedAction: {
      label: "Themenradar prüfen",
      description: "Extrahierte Hinweise bleiben Entwürfe und werden erst im Themenradar-Review weitergeführt.",
      href: "/admin/themenradar",
    },
  };
}

function buildDossierHandoff(input: {
  record: MaterialIntakeRecord;
  dossierId: string | null;
  claimDrafts: MaterialExtractionDraft[];
  questionDrafts: MaterialExtractionDraft[];
  evidenceHints: string[];
}): MaterialExtractionDossierHandoff | null {
  const dossierId = normalizeString(input.dossierId);
  if (!dossierId) return null;
  const section = input.claimDrafts.length > 0
    ? "claims"
    : input.questionDrafts.length > 0
      ? "questions"
      : input.evidenceHints.length > 0
        ? "sources"
        : "updates";
  return {
    dossierId,
    title: buildTopicLabel(input.record),
    section,
    statusLabel: "in Prüfung",
    href: `/dossier/${encodeURIComponent(dossierId)}`,
  };
}

function buildAnlassraumHandoff(input: {
  record: MaterialIntakeRecord;
  anlassraumId: string | null;
}): MaterialExtractionAnlassraumHandoff | null {
  const anlassraumId = normalizeString(input.anlassraumId);
  if (!anlassraumId) return null;
  return {
    anlassraumId,
    title: buildTopicLabel(input.record),
    statusLabel: "in Prüfung",
    href: `/runden?anlassraumId=${encodeURIComponent(anlassraumId)}`,
  };
}

function resolveStatus(input: {
  extractionMode: MaterialExtractionMode;
  costGuard: MaterialExtractionCostGuard;
  approveCost: boolean;
  canDeriveReviewHints: boolean;
  dossierHandoff: MaterialExtractionDossierHandoff | null;
  themenradarHandoff: MaterialExtractionThemenradarHandoff | null;
}): { status: MaterialExtractionJobStatus; error: string | null } {
  if (input.costGuard === "blocked") {
    return {
      status: "blocked",
      error: "Diese Extraktionsart ist im aktuellen Guardrail-Pfad nicht freigegeben.",
    };
  }
  if (input.costGuard === "requires_approval" && !input.approveCost) {
    return {
      status: "blocked",
      error: "Kosten- oder Provider-Freigabe fehlt. Es wurde kein externer Extraktionslauf gestartet.",
    };
  }
  if (input.extractionMode === "metadata_only") return { status: "metadata_ready", error: null };
  if (!input.canDeriveReviewHints && input.extractionMode !== "manual_review") {
    return {
      status: "extraction_pending",
      error: "Es liegt noch keine belastbare Text- oder Transkriptgrundlage vor. Job bleibt review-first vorbereitet.",
    };
  }
  if (input.dossierHandoff) return { status: "attached_to_dossier", error: null };
  if (input.themenradarHandoff) return { status: "attached_to_themenradar", error: null };
  return { status: "needs_review", error: null };
}

function nextActionForJob(job: Pick<MaterialExtractionJob, "status" | "costGuard" | "dossierHandoff" | "themenradarHandoff">) {
  if (job.costGuard === "requires_approval" && job.status === "blocked") {
    return {
      label: "Kostenfreigabe prüfen",
      description: "Externe Extraktion bleibt aus, bis ein Mensch die Kosten bewusst freigibt.",
      href: "/admin/feeds#material-extraction-jobs",
    };
  }
  if (job.status === "failed" || job.status === "blocked") {
    return {
      label: "Job prüfen",
      description: "Blocker oder Fehler erst prüfen, dann bewusst neu starten.",
      href: "/admin/feeds#material-extraction-jobs",
    };
  }
  if (job.dossierHandoff) {
    return {
      label: "Dossier-Vorschlag prüfen",
      description: "Extrahierte Hinweise bleiben als Dossier-Vorschlag in Prüfung.",
      href: job.dossierHandoff.href,
    };
  }
  if (job.themenradarHandoff) {
    return {
      label: "Themenradar-Cluster prüfen",
      description: "Extrahierte Hinweise bleiben Entwürfe und gehen erst review-first ins Themenradar.",
      href: job.themenradarHandoff.nextSuggestedAction.href,
    };
  }
  return {
    label: "Review öffnen",
    description: "Extrahierte Hinweise bleiben intern, bis ein Mensch den nächsten Schritt entscheidet.",
    href: "/admin/review?domain=material_extraction",
  };
}

function buildJob(input: CreateMaterialExtractionJobInput & { record: MaterialIntakeRecord; persistence: MaterialExtractionJobPersistenceState }) {
  const aiIntegration = resolveAiFlowIntegration("material_extraction");
  const createdAt = nowIso();
  const sourceType = sourceTypeFromRecord(input.record);
  const claimDrafts = deriveClaimDrafts(input.record);
  const questionDrafts = deriveQuestionDrafts(input.record);
  const optionDrafts = deriveOptionDrafts(input.record);
  const evidenceHints = deriveEvidenceHints(input.record);
  const dossierHandoff = buildDossierHandoff({
    record: input.record,
    dossierId: input.dossierId ?? null,
    claimDrafts,
    questionDrafts,
    evidenceHints,
  });
  const themenradarHandoff = buildThemenradarHandoff({
    jobId: `material-job:${input.materialId}:${input.extractionMode}`,
    record: input.record,
    claims: claimDrafts,
    questions: questionDrafts,
    options: optionDrafts,
    evidenceHints,
  });
  const anlassraumHandoff = buildAnlassraumHandoff({
    record: input.record,
    anlassraumId: input.anlassraumId ?? null,
  });
  const costGuard = costGuardFor({
    sourceType,
    extractionMode: input.extractionMode,
    record: input.record,
  });
  const resolved = resolveStatus({
    extractionMode: input.extractionMode,
    costGuard,
    approveCost: input.approveCost === true,
    canDeriveReviewHints: canDeriveReviewHints(input.record),
    dossierHandoff,
    themenradarHandoff,
  });
  const seed = [
    input.materialId,
    input.record.organizationId ?? "",
    input.record.regionId ?? "",
    input.extractionMode,
    input.dossierId ?? "",
    input.anlassraumId ?? "",
  ].join(":");
  const id = `material-job-${stableHash(seed).slice(0, 20)}`;

  const job: MaterialExtractionJob = {
    id,
    materialId: input.materialId,
    materialLabel: input.record.label,
    sourceType,
    submittedBy: input.submittedBy,
    organizationId: input.record.organizationId,
    regionId: input.record.regionId,
    dossierId: normalizeString(input.dossierId),
    anlassraumId: normalizeString(input.anlassraumId),
    status: resolved.status,
    statusLabel: statusLabel(resolved.status),
    extractionMode: input.extractionMode,
    costGuard,
    costGuardLabel: costGuardLabel(costGuard),
    error: resolved.error,
    createdAt,
    updatedAt: createdAt,
    reviewRequired: true,
    noAutoPublish: true,
    noAutoDeepSearch: true,
    noAutoOfficial: true,
    sourceHints: materialTexts(input.record).hints,
    claimDrafts,
    questionDrafts,
    optionDrafts,
    evidenceHints,
    dossierHandoff,
    anlassraumHandoff,
    themenradarHandoff,
    aiOrchestration: {
      lane: aiIntegration.lane,
      laneLabel: aiIntegration.laneLabel,
      outputLabel: aiIntegration.outputLabel,
      reviewRequired: true,
      draftOnly: true,
      publicOutputAllowed: false,
      costApprovalRequired: aiIntegration.costApprovalRequired,
      researchAllowed: aiIntegration.researchAllowed,
    },
    nextSuggestedAction: {
      label: "Review öffnen",
      description: "Extrahierte Hinweise bleiben intern, bis ein Mensch den nächsten Schritt entscheidet.",
      href: "/admin/review?domain=material_extraction",
    },
  };
  job.nextSuggestedAction = nextActionForJob(job);
  return job;
}

function jobDoc(job: MaterialExtractionJob) {
  return {
    _id: job.id,
    job: clone(job),
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
  };
}

async function ensureIndexes() {
  if (indexesReady) return;
  const col = await coreCol<any>(MATERIAL_EXTRACTION_COLLECTION);
  await Promise.all([
    col.createIndex({ "job.materialId": 1, updatedAt: -1 }),
    col.createIndex({ "job.organizationId": 1, updatedAt: -1 }),
    col.createIndex({ "job.regionId": 1, updatedAt: -1 }),
    col.createIndex({ "job.status": 1, updatedAt: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepo(): MaterialExtractionJobRepository {
  const persistence = persistenceState("persistent_primary");
  return {
    async createJob(input) {
      await ensureIndexes();
      const record = await getMaterialIntakeRecord(input.materialId);
      if (!record) {
        throw new Error("material_not_found");
      }
      const job = buildJob({ ...input, record, persistence });
      const col = await coreCol<any>(MATERIAL_EXTRACTION_COLLECTION);
      await col.updateOne({ _id: job.id }, { $set: jobDoc(job) }, { upsert: true });
      return { job, persistence };
    },
    async listJobs(query = {}) {
      await ensureIndexes();
      const col = await coreCol<any>(MATERIAL_EXTRACTION_COLLECTION);
      const organizationIds = uniqueNonEmpty(query.organizationIds ?? []);
      const regionIds = uniqueNonEmpty(query.regionIds ?? []);
      const statuses = uniqueNonEmpty(query.statuses ?? []) as MaterialExtractionJobStatus[];
      const mongoQuery: Record<string, unknown> = {};
      if (organizationIds.length > 0) mongoQuery["job.organizationId"] = { $in: organizationIds };
      if (regionIds.length > 0) mongoQuery["job.regionId"] = { $in: regionIds };
      if (statuses.length > 0) mongoQuery["job.status"] = { $in: statuses };
      const docs = await col
        .find(mongoQuery)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(normalizeLimit(query.limit))
        .toArray();
      return docs
        .map((doc) => doc?.job)
        .filter((job): job is MaterialExtractionJob => Boolean(job))
        .map((job) => clone(job));
    },
    async getJob(jobId) {
      await ensureIndexes();
      const normalized = String(jobId ?? "").trim();
      if (!normalized) return null;
      const col = await coreCol<any>(MATERIAL_EXTRACTION_COLLECTION);
      const doc = await col.findOne({ _id: normalized });
      return doc?.job ? clone(doc.job as MaterialExtractionJob) : null;
    },
    getPersistenceState() {
      return persistence;
    },
  };
}

export function createInMemoryMaterialExtractionJobRepository(seed?: {
  jobs?: MaterialExtractionJob[];
}): MaterialExtractionJobRepository {
  const persistence = persistenceState("in_memory_fallback");
  const jobs = new Map<string, MaterialExtractionJob>();
  for (const job of seed?.jobs ?? []) jobs.set(job.id, clone(job));
  return {
    async createJob(input) {
      const record = await getMaterialIntakeRecord(input.materialId);
      if (!record) {
        throw new Error("material_not_found");
      }
      const job = buildJob({ ...input, record, persistence });
      jobs.set(job.id, clone(job));
      return { job, persistence };
    },
    async listJobs(query = {}) {
      const organizationIds = new Set(uniqueNonEmpty(query.organizationIds ?? []));
      const regionIds = new Set(uniqueNonEmpty(query.regionIds ?? []));
      const statuses = new Set(uniqueNonEmpty(query.statuses ?? []));
      return Array.from(jobs.values())
        .filter((job) => {
          if (organizationIds.size > 0 && !organizationIds.has(job.organizationId ?? "")) return false;
          if (regionIds.size > 0 && !regionIds.has(job.regionId ?? "")) return false;
          if (statuses.size > 0 && !statuses.has(job.status)) return false;
          return true;
        })
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
        .slice(0, normalizeLimit(query.limit))
        .map((job) => clone(job));
    },
    async getJob(jobId) {
      const normalized = String(jobId ?? "").trim();
      if (!normalized) return null;
      const job = jobs.get(normalized);
      return job ? clone(job) : null;
    },
    getPersistenceState() {
      return persistence;
    },
  };
}

function getRepo() {
  if (shouldUseInMemoryMongoFallback()) {
    if (!repoSingleton) repoSingleton = createInMemoryMaterialExtractionJobRepository();
    return repoSingleton;
  }
  if (!repoSingleton) repoSingleton = createMongoRepo();
  return repoSingleton;
}

export function getMaterialExtractionJobRepository() {
  return getRepo();
}

export function setMaterialExtractionJobRepositoryForTests(repo: MaterialExtractionJobRepository | null) {
  repoSingleton = repo;
  indexesReady = false;
}

export async function createMaterialExtractionJob(input: CreateMaterialExtractionJobInput) {
  return getRepo().createJob(input);
}

export async function listMaterialExtractionJobs(query?: Parameters<MaterialExtractionJobRepository["listJobs"]>[0]) {
  return getRepo().listJobs(query);
}

export async function buildMaterialExtractionJobReadModel(input?: {
  organizationIds?: string[];
  regionIds?: string[];
  limit?: number;
}) : Promise<MaterialExtractionJobReadModel> {
  const jobs = await listMaterialExtractionJobs({
    organizationIds: input?.organizationIds,
    regionIds: input?.regionIds,
    limit: input?.limit ?? 24,
  });
  const summary = {
    totalJobs: jobs.length,
    waitingJobs: jobs.filter((job) => ["queued", "metadata_ready", "extraction_pending", "extracting"].includes(job.status)).length,
    failedJobs: jobs.filter((job) => job.status === "failed").length,
    blockedJobs: jobs.filter((job) => job.status === "blocked").length,
    approvalRequiredJobs: jobs.filter((job) => job.costGuard === "requires_approval").length,
    reviewReadyJobs: jobs.filter((job) => ["needs_review", "attached_to_dossier", "attached_to_themenradar"].includes(job.status)).length,
    dossierHandoffs: jobs.filter((job) => Boolean(job.dossierHandoff)).length,
    themenradarHandoffs: jobs.filter((job) => Boolean(job.themenradarHandoff)).length,
    nextAction:
      jobs.find((job) => job.status === "blocked")?.nextSuggestedAction ??
      jobs.find((job) => job.status === "needs_review")?.nextSuggestedAction ?? {
        label: "Material-Jobs beobachten",
        description: "Noch keine Extraktionsjobs vorhanden. Das ist ein ehrlicher Leerzustand ohne Auto-Extraktion.",
        href: "/admin/feeds#material-extraction-jobs",
      },
  };
  return {
    generatedAt: new Date().toISOString(),
    items: jobs,
    summary,
    persistence: getRepo().getPersistenceState(),
    intakePersistence: getMaterialIntakePersistenceState(),
  };
}

function matchesScope(input: {
  regionId?: string | null;
  organizationId?: string | null;
  scope?: AutonomousThemenradarScope;
}) {
  const viewerRegionIds = uniqueNonEmpty(input.scope?.viewerRegionIds ?? []);
  const organizationIds = uniqueNonEmpty(input.scope?.organizationIds ?? []);
  const adminContext = input.scope?.adminContext === true;
  const organizationId = normalizeString(input.organizationId);
  if (organizationId) {
    if (organizationIds.length === 0) return adminContext;
    return organizationIds.includes(organizationId);
  }
  const regionId = normalizeString(input.regionId);
  if (regionId) {
    if (viewerRegionIds.length === 0) return true;
    return viewerRegionIds.includes(regionId);
  }
  return true;
}

export async function listMaterialExtractionThemenradarSeeds(scope?: AutonomousThemenradarScope): Promise<MaterialExtractionThemenradarSeed[]> {
  const jobs = await listMaterialExtractionJobs({ limit: 80 });
  return jobs
    .filter((job) =>
      ["needs_review", "attached_to_dossier", "attached_to_themenradar"].includes(job.status) &&
      job.themenradarHandoff,
    )
    .filter((job) => matchesScope({ regionId: job.regionId, organizationId: job.organizationId, scope }))
    .map((job) => ({
      sourceId: job.id,
      sourceType: "material" as const,
      title: job.materialLabel,
      topicLabel: job.themenradarHandoff?.topicLabel ?? job.materialLabel,
      clusterTopicKey: job.themenradarHandoff?.clusterTopicKey ?? normalizeGermanSlug(job.materialLabel, {
        maxLength: 48,
        fallback: "material-hinweis",
      }),
      regionId: job.regionId,
      organizationId: job.organizationId,
      claims: job.claimDrafts.map((entry) => entry.text),
      questions: job.questionDrafts.map((entry) => entry.text),
      options: job.optionDrafts.map((entry) => entry.text),
      evidenceHints: [...job.evidenceHints, ...job.sourceHints],
      reviewRequired: true,
      weakEvidence: job.evidenceHints.length === 0,
      createdAt: job.createdAt,
      sourceHref: null,
      swipesHref: `/swipes?topic=${encodeURIComponent(job.themenradarHandoff?.topicLabel ?? job.materialLabel)}`,
      dossierHref: job.dossierHandoff?.href ?? null,
      anlassraumHref: job.anlassraumHandoff?.href ?? null,
      priorityBoost: job.themenradarHandoff
        ? Math.min(24, Math.floor((job.themenradarHandoff.urgencyScore + job.themenradarHandoff.relevanceScore) / 10))
        : 8,
    }));
}
