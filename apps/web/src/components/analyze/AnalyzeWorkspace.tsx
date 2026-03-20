"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HighlightedTextarea } from "@/app/(components)/HighlightedTextarea";
import { normalizeClaim, type NormalizedClaim } from "@/app/(components)/normalizeClaim";
import { labelDomain } from "@features/analyze/domainLabels";
import StatementCard from "@/components/statements/StatementCard";
import AnalyzeProgress from "@/components/contributions/AnalyzeProgress";
import { ImpactSection, ResponsibilitySection } from "@/components/contributions/ImpactResponsibilitySection";
import {
  ConsequencesPreviewCard,
  ResponsibilityPreviewCard,
} from "@features/statement/components/StatementImpactPreview";
import type {
  AnalyzeResult,
  ConsequenceRecord,
  ResponsibilityRecord,
  ResponsibilityPath,
  DecisionTree,
  EventualityNode,
  ImpactAndResponsibility,
  EditorialAudit,
  EvidenceGraph,
  RunReceipt,
} from "@features/analyze/schemas";
import { useLocale } from "@/context/LocaleContext";
import { selectE150Questions } from "@features/e150/questions/catalog";
import { VERIFICATION_REQUIREMENTS, meetsVerificationLevel } from "@features/auth/verificationRules";
import type { VerificationLevel } from "@core/auth/verificationTypes";
import VogVoteButtons, { type VoteValue } from "@features/vote/components/VogVoteButtons";
import SerpResultsList from "@/features/research/SerpResultsList";
import EditorialAuditPanel from "@/components/analyze/EditorialAuditPanel";
import EvidenceGraphPanel from "@/components/analyze/EvidenceGraphPanel";
import RunReceiptPanel from "@/components/analyze/RunReceiptPanel";
import ContentLanguageSelect from "@/components/ContentLanguageSelect";
import { useContentLang } from "@/lib/i18n/contentLanguage";
import { DEFAULT_BASE_LANG, LANGUAGE_CODES, type LanguageCode } from "@features/i18n/languages";
import type { CreateMode } from "@/features/create/intents";
import type { CreateAnalyzeResponse } from "@/features/create/analyzeContract";
import {
  buildCreateCtaHandoff,
  cancelCreateCtaHandoff,
  confirmCreateCtaHandoff,
  createInitialCreateCtaHandoffState,
  selectCreateCtaHandoff,
  type CreateCtaHandoff,
  type CreateCtaHandoffUiState,
} from "@/features/create/ctaHandoff";

const MAX_LEVEL1_STATEMENTS = 3;

const TRACE_MODE_STYLE: Record<
  TraceAttribution["mode"],
  { label: string; chipClass: string; markClass: string }
> = {
  verbatim: {
    label: "Wörtlich",
    chipClass:
      "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/30",
    markClass:
      "bg-sky-100 text-[rgb(var(--fg))] ring-sky-200/60 dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/30",
  },
  paraphrase: {
    label: "Paraphrase",
    chipClass:
      "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
    markClass:
      "bg-amber-100 text-[rgb(var(--fg))] ring-amber-200/60 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/30",
  },
  inference: {
    label: "Ableitung",
    chipClass:
      "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30",
    markClass:
      "bg-rose-100 text-[rgb(var(--fg))] ring-rose-200/60 dark:bg-rose-500/20 dark:text-rose-100 dark:ring-rose-400/30",
  },
};

function TinyPill({
  children,
  className = "ring-[rgb(var(--border))] text-[rgb(var(--muted))]",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

const FLOW_OPTIONS = [
  {
    id: "express",
    label: "Express",
    description: "Schnell zu Kernaussagen und einer klaren Grundstruktur.",
    defaultLevel: 1 as 1 | 2 | 3 | 4,
    maxClaims: 3,
    openPanels: {
      notes: false,
      questions: false,
      knots: false,
      eventualities: false,
      consequences: false,
      report: false,
    },
    allowTrace: false,
    allowResearch: false,
  },
  {
    id: "guided",
    label: "Guided",
    description: "Kontext, Fragen und ein Pruefplan als klare Leitplanke.",
    defaultLevel: 2 as 1 | 2 | 3 | 4,
    maxClaims: 8,
    openPanels: {
      notes: true,
      questions: true,
      knots: false,
      eventualities: false,
      consequences: false,
      report: false,
    },
    allowTrace: true,
    allowResearch: true,
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Tiefe Einordnung, Wirkung, Knoten und fertige Redaktion.",
    defaultLevel: 4 as 1 | 2 | 3 | 4,
    maxClaims: 30,
    openPanels: {
      notes: true,
      questions: true,
      knots: true,
      eventualities: true,
      consequences: true,
      report: true,
    },
    allowTrace: true,
    allowResearch: true,
  },
] as const;

type FlowId = (typeof FLOW_OPTIONS)[number]["id"];
type PanelKey = keyof (typeof FLOW_OPTIONS)[number]["openPanels"];

const analyzeButtonTexts = {
  running: "Analyse läuft …",
  retry: "Erneut versuchen",
  start: "Analyse starten",
};

const SOURCE_HINTS: Record<string, string> = {
  "Amtliche Veröffentlichungen":
    "Gesetze, Verordnungen, Ministerien/Behörden, Amtsblätter, offizielle Mitteilungen.",
  Parlamentsdokumente: "Drucksachen, Protokolle, Ausschussberichte, Anfragen/Antworten.",
  Fachverbände: "Positionspapiere, Stellungnahmen, Studien/Reports von Verbänden.",
  Qualitätspresse: "Einordnung/Chronologie; mehrere Quellen vergleichen; keine 1:1-Übernahme.",
  "Wissenschaftliche Datenbanken": "Peer-reviewed Papers, Preprints, Metastudien; Methodik prüfen.",
};

type NoteSection = { id: string; title: string; body: string };

type QuestionCard = {
  id: string;
  label: string;
  category: string;
  body: string;
};

type KnotCard = { id: string; title: string; category: string; body: string };

type TranslationItem = { key: string; text: string };

type TraceAttribution = {
  mode: "verbatim" | "paraphrase" | "inference";
  quotes: string[];
  why: string;
};

type TraceGuidance = {
  concern: string;
  scopeHints: { levels: string[]; why: string };
  istStandChecklist: { society: string[]; media: string[]; politics: string[] };
  proFrames: { frame: string; stakeholders: string[] }[];
  contraFrames: { frame: string; stakeholders: string[] }[];
  alternatives: string[];
  searchQueries: string[];
  sourceTypes: string[];
};

type TraceResult = {
  attribution: Record<string, TraceAttribution>;
  guidance: TraceGuidance | null;
};

type ResearchGuidance = {
  focus: string[];
  stakeholders: string[];
  sources: string[];
  queries: string[];
  feeds: string[];
  risks: string[];
};

type CreateAnalyzeRoutingHint = {
  tone: "info" | "warning";
  message: string;
  primaryCtaId: string | null;
  primaryCtaLabel: string | null;
};

export function deriveCreateAnalyzeRoutingHint(
  snapshot: Pick<CreateAnalyzeResponse, "matchType" | "suggestedCtas">,
): CreateAnalyzeRoutingHint {
  const primary = snapshot.suggestedCtas?.[0];
  const base: CreateAnalyzeRoutingHint = {
    tone: "info",
    message: "Match ist ein Vorschlag. Handoff bleibt immer manuell.",
    primaryCtaId: primary?.id ?? null,
    primaryCtaLabel: primary?.label ?? null,
  };

  if (snapshot.matchType === "no_match") {
    return {
      ...base,
      message: "Kein belastbarer Match. CTA 'Neu anlegen' bleibt der kanonische Pfad.",
    };
  }
  if (snapshot.matchType === "same_anlassraum") {
    return {
      ...base,
      message:
        "Anlassraum-Kontext erkannt. Oeffnen/Anhaengen bleibt manuell zu bestaetigen; kein Auto-Attach.",
    };
  }
  if (snapshot.matchType === "duplicate_risk") {
    return {
      ...base,
      tone: "warning",
      message: "Moegliches Duplikat. Manuell pruefen, kein Silent-Merge.",
    };
  }
  if (snapshot.matchType === "related_dossier") {
    return {
      ...base,
      message: "Dossier-Naehe erkannt. Erst manuell einlesen, dann bewusst weiterfuehren.",
    };
  }

  return base;
}

export function collectCreateAnalyzeReasons(
  snapshot: Pick<CreateAnalyzeResponse, "reasons" | "matches">,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value !== "string") return;
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  };

  for (const reason of snapshot.reasons ?? []) push(reason);
  for (const match of snapshot.matches ?? []) {
    for (const reason of match?.reasons ?? []) push(reason);
    push(match?.reason);
  }
  return out;
}

function parseCreateAnalyzeResponse(value: unknown): CreateAnalyzeResponse | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CreateAnalyzeResponse>;
  if (typeof candidate.schemaVersion !== "string") return null;
  if (typeof candidate.runId !== "string") return null;
  if (typeof candidate.confidence !== "number" || Number.isNaN(candidate.confidence)) return null;
  if (!Array.isArray(candidate.languages)) return null;
  if (!Array.isArray(candidate.claims)) return null;
  if (!Array.isArray(candidate.evidenceNeeds)) return null;
  if (!Array.isArray(candidate.uncertainties)) return null;
  if (!Array.isArray(candidate.matches)) return null;
  if (!Array.isArray(candidate.reasons)) return null;
  if (!Array.isArray(candidate.suggestedCtas)) return null;
  if (candidate.matchSourceState !== "ok" && candidate.matchSourceState !== "degraded") return null;
  if (!Array.isArray(candidate.matchSourceErrors)) return null;
  return candidate as CreateAnalyzeResponse;
}

type StatementEntry = NormalizedClaim & {
  stance?: "pro" | "contra" | "neutral" | string | null;
  importance?: number | null;
  quality?: {
    precision: number;
    testability: number;
    readability: number;
    balance: number;
  };
  vote?: VoteValue | null;
  locallyEdited?: boolean;
  flagged?: boolean;
  tags?: string[];
};

type AnalyzeStepState = {
  key: "context" | "claims" | "questions" | "consequences" | "responsibility";
  label: string;
  state: "running" | "done" | "empty" | "failed";
  reason?: string | null;
};

type ProviderMatrixEntry = {
  provider: string;
  state: "queued" | "running" | "ok" | "failed" | "cancelled" | "skipped" | "disabled";
  attempt?: number | null;
  errorKind?: string | null;
  status?: number | null;
  durationMs?: number | null;
  model?: string | null;
  reason?: string | null;
};

export type UseCaseId = "civic" | "journalism" | "agenda";

export type UseCaseAccess = {
  allowed: UseCaseId[];
  note?: string;
  lockLabels?: Partial<Record<UseCaseId, string>>;
  ctaHref?: string;
  ctaLabel?: string;
};

type AnalyzeWorkspaceProps = {
  mode: "contribution" | "statement";
  createMode?: CreateMode;
  selectedAnlassraumId?: string | null;
  defaultLevel?: 1 | 2 | 3 | 4;
  storageKey: string;
  analyzeEndpoint: string;
  saveEndpoint: string;
  finalizeEndpoint: string;
  afterFinalizeNavigateTo?: string;
  dossierId?: string | null;
  verificationLevel?: VerificationLevel;
  verificationStatus?: "loading" | "ok" | "login_required" | "error";
  initialText?: string;
  authorName?: string | null;
  useCaseAccess?: UseCaseAccess;
  maxClaimsCap?: number;
  maxFinalizeClaims?: number;
};

const BASE_STEPS: AnalyzeStepState[] = [
  { key: "context", label: "Kontext", state: "empty" },
  { key: "claims", label: "Kernaussagen", state: "empty" },
  { key: "questions", label: "Fragen", state: "empty" },
  { key: "consequences", label: "Wirkung", state: "empty" },
  { key: "responsibility", label: "Zuständigkeit", state: "empty" },
];

type DraftStorage = {
  text?: string;
  draftId?: string | null;
  localDraftId?: string | null;
  savedAt?: string | null;
  evidenceInput?: string | null;
  authorName?: string | null;
  useCase?: UseCaseId;
};

function mapAiNoteToSection(raw: any, idx: number): NoteSection | null {
  if (!raw || typeof raw.text !== "string") return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : `note-${idx + 1}`;
  const kind = typeof raw.kind === "string" ? raw.kind : null;

  return {
    id,
    title: kind ? kind.toUpperCase() : `Abschnitt ${idx + 1}`,
    body: raw.text,
  };
}

function mapAiQuestionToCard(raw: any, idx: number): QuestionCard | null {
  if (!raw || typeof raw.text !== "string") return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : `q-${idx + 1}`;
  const dimension = typeof raw.dimension === "string" && raw.dimension ? raw.dimension : null;

  return {
    id,
    label: dimension ? dimension.toUpperCase() : "FRAGE",
    category: dimension ?? "",
    body: raw.text,
  };
}

function mapAiKnotToCard(raw: any, idx: number): KnotCard | null {
  if (!raw || typeof raw.description !== "string") return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : `k-${idx + 1}`;
  const label = typeof raw.label === "string" && raw.label.trim() ? raw.label : `Knoten ${idx + 1}`;

  return {
    id,
    title: label,
    category: "Themenschwerpunkt",
    body: raw.description,
  };
}

function mapAiClaimToStatement(raw: any, idx: number): StatementEntry | null {
  const normalized = normalizeClaim(raw, idx);
  if (!normalized) return null;

  const meta = raw && typeof raw.meta === "object" && raw.meta !== null ? raw.meta : {};
  const quality = meta && typeof meta === "object" && meta.quality ? (meta.quality as StatementEntry["quality"]) : undefined;
  const tags = buildStatementTags(normalized);

  return {
    ...normalized,
    stance: typeof raw?.stance === "string" ? raw.stance : null,
    importance: typeof raw?.importance === "number" ? raw.importance : null,
    quality,
    tags,
    vote: null,
    locallyEdited: false,
    flagged: false,
  };
}

function buildStatementTags(claim: NormalizedClaim): string[] {
  const tags = new Set<string>();
  if (claim.topic) tags.add(claim.topic);
  if (claim.responsibility) tags.add(claim.responsibility);
  if (Array.isArray(claim.domains)) {
    claim.domains.forEach((d) => {
      if (typeof d === "string" && d.trim()) {
        const lbl = labelDomain(d.trim());
        tags.add(lbl || d.trim());
      }
    });
  } else if (claim.domain && claim.domain.trim()) {
    const lbl = labelDomain(claim.domain.trim());
    tags.add(lbl || claim.domain.trim());
  }
  return Array.from(tags);
}

function deriveTagsFromAnalysis(statements: StatementEntry[], knots: KnotCard[]): string[] {
  const tags = new Set<string>();
  statements.forEach((s) => {
    if (s.topic) tags.add(s.topic.toLowerCase());
    if (s.responsibility) tags.add(s.responsibility.toLowerCase());
    if (Array.isArray(s.domains)) {
      s.domains.forEach((d) => {
        if (typeof d === "string" && d.trim()) tags.add(labelDomain(d.trim()).toLowerCase());
      });
    } else if (s.domain && s.domain.trim()) {
      tags.add(labelDomain(s.domain.trim()).toLowerCase());
    }
  });
  knots.forEach((k) => {
    if (k.category) tags.add(k.category.toLowerCase());
  });
  return Array.from(tags);
}

function dedupeQuestions(qs: QuestionCard[]): QuestionCard[] {
  const seen = new Set<string>();
  const out: QuestionCard[] = [];
  for (const q of qs) {
    const key = q.body.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

function normalizeStatementKey(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeStatements(items: StatementEntry[]): StatementEntry[] {
  const seen = new Set<string>();
  const out: StatementEntry[] = [];
  for (const item of items) {
    const key = normalizeStatementKey(item.text || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function computeStepStatesFromData(params: {
  notes: NoteSection[];
  statements: StatementEntry[];
  questions: QuestionCard[];
  consequences: ConsequenceRecord[];
  responsibilities: ResponsibilityRecord[];
  impactAndResponsibility: ImpactAndResponsibility;
  degradedReason?: string | null;
  failedReason?: string | null;
}): AnalyzeStepState[] {
  const { notes, statements, questions, consequences, responsibilities, impactAndResponsibility, degradedReason, failedReason } = params;

  if (degradedReason) {
    return BASE_STEPS.map((s, i) => ({ ...s, state: "failed", reason: i === 0 ? degradedReason : null }));
  }
  if (failedReason) {
    return BASE_STEPS.map((s, i) => ({ ...s, state: "failed", reason: i === 0 ? failedReason : null }));
  }

  const hasContext = notes.length > 0;
  const hasClaims = statements.length > 0;
  const hasQuestions = questions.length > 0;
  const hasConsequences = consequences.length > 0;
  const hasResponsibility =
    responsibilities.length > 0 || (impactAndResponsibility.responsibleActors?.length ?? 0) > 0;

  return BASE_STEPS.map((s) => {
    if (s.key === "context") return { ...s, state: hasContext ? "done" : "empty" };
    if (s.key === "claims") return { ...s, state: hasClaims ? "done" : "empty" };
    if (s.key === "questions") return { ...s, state: hasQuestions ? "done" : "empty" };
    if (s.key === "consequences") return { ...s, state: hasConsequences ? "done" : "empty" };
    if (s.key === "responsibility") return { ...s, state: hasResponsibility ? "done" : "empty" };
    return s;
  });
}

function buildDraftLabel(draftId?: string | null, localDraftId?: string | null) {
  if (draftId) return draftId;
  if (localDraftId) return `${localDraftId} (lokal)`;
  return "lokal";
}

function formatDateLabel(value?: string | null) {
  if (!value) return "noch nicht gespeichert";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function prepareText(raw: string): { original: string; prepared: string; ratio: number } {
  const original = raw ?? "";
  let prepared = original.replace(/\r\n/g, "\n");
  prepared = prepared.replace(/[ \t]+/g, " ");
  prepared = prepared.replace(/\n{3,}/g, "\n\n").trim();
  const ratio =
    original.length > 0 ? Math.max(0, Math.round(((original.length - prepared.length) / original.length) * 100)) : 0;
  return { original, prepared, ratio };
}

function buildArticleDraft(params: {
  preparedText: string;
  report: any;
  statements: StatementEntry[];
  questions: QuestionCard[];
  knots: KnotCard[];
}) {
  const hasReportSummary =
    params.report && typeof params.report.summary === "string" && params.report.summary.trim();
  if (!params.preparedText.trim() && !params.statements.length && !hasReportSummary) {
    return "";
  }
  const lines: string[] = [];
  const headlineCandidate =
    (hasReportSummary ? params.report.summary.trim() : "") ||
    params.statements[0]?.title ||
    params.statements[0]?.text ||
    "Artikel-Entwurf";
  const headline = headlineCandidate.replace(/\s+/g, " ").trim();
  const trimmedHeadline = headline.length > 110 ? `${headline.slice(0, 110).trim()}...` : headline;
  lines.push(`Titel: ${trimmedHeadline}`);
  lines.push("");

  const summary =
    params.report && typeof params.report.summary === "string" && params.report.summary.trim()
      ? params.report.summary.trim()
      : "";
  if (summary) {
    lines.push("Kurzfassung:");
    lines.push(summary);
    lines.push("");
  } else if (params.preparedText.trim()) {
    lines.push("Kurzfassung:");
    lines.push(params.preparedText.trim().slice(0, 240));
    lines.push("");
  }

  if (params.statements.length) {
    lines.push("Kernaussagen:");
    params.statements.slice(0, 5).forEach((s, idx) => {
      lines.push(`${idx + 1}. ${s.text}`);
    });
    lines.push("");
  }

  if (params.knots.length) {
    lines.push("Kontext:");
    params.knots.slice(0, 4).forEach((k) => {
      const label = k.title?.trim() || k.body?.trim();
      if (label) lines.push(`- ${label}`);
    });
    lines.push("");
  }

  if (params.questions.length) {
    lines.push("Offene Fragen:");
    params.questions.slice(0, 4).forEach((q) => {
      if (q.body?.trim()) lines.push(`- ${q.body.trim()}`);
    });
    lines.push("");
  }

  return lines.join("\n").trim();
}

function defaultFlowForLevel(level?: number): FlowId {
  if (!level || level <= 1) return "express";
  if (level === 2) return "guided";
  return "editorial";
}

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function countSentences(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 0;
}

function inferFlowFromText(preparedText: string): FlowId {
  const trimmed = preparedText.trim();
  if (!trimmed) return "express";
  const words = countWords(trimmed);
  const sentences = countSentences(trimmed);
  if (words >= 220 || sentences >= 10) return "editorial";
  if (words >= 80 || sentences >= 4) return "guided";
  return "express";
}

function hashLocalDraft(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(31, hash) + text.charCodeAt(i);
  }
  const digest = Math.abs(hash >>> 0).toString(36).slice(0, 6);
  return `local-${digest}`;
}

function InlineEditableText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [isEditing, value]);

  if (!isEditing) {
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--border))]"
        >
          Statement bearbeiten
        </button>
      </div>
    );
  }

  const save = () => {
    setIsEditing(false);
    if (draft.trim() && draft.trim() !== value) onChange(draft.trim());
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full rounded-lg border border-sky-200 bg-[rgb(var(--card))] px-3 py-2 text-sm leading-relaxed text-[rgb(var(--fg))] shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="flex items-center justify-between text-[11px] text-[rgb(var(--muted))]">
        <span>Änderungen werden beim Speichern übernommen.</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setIsEditing(false)} className="hover:underline">
            Abbrechen
          </button>
          <button type="button" onClick={save} className="font-semibold text-sky-700 hover:underline">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzeWorkspace({
  mode,
  createMode,
  selectedAnlassraumId,
  defaultLevel = 2,
  storageKey,
  analyzeEndpoint,
  saveEndpoint,
  finalizeEndpoint,
  afterFinalizeNavigateTo,
  dossierId,
  verificationLevel,
  verificationStatus,
  initialText,
  authorName: initialAuthorName,
  useCaseAccess,
}: AnalyzeWorkspaceProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { lang: contentLang, setLang: setContentLang } = useContentLang();
  const baseLang = React.useMemo(() => {
    const short = (locale || "").slice(0, 2).toLowerCase();
    return LANGUAGE_CODES.includes(short as LanguageCode) ? (short as LanguageCode) : DEFAULT_BASE_LANG;
  }, [locale]);
  const initialFlow = defaultFlowForLevel(defaultLevel);
  const initialFlowConfig = FLOW_OPTIONS.find((opt) => opt.id === initialFlow) ?? FLOW_OPTIONS[0];
  const [flow, setFlow] = React.useState<FlowId>(initialFlowConfig.id);
  const [viewLevel, setViewLevel] = React.useState<1 | 2 | 3 | 4>(defaultLevel ?? initialFlowConfig.defaultLevel);
  const [maxClaims, setMaxClaims] = React.useState<number>(initialFlowConfig.maxClaims);
  const [openPanels, setOpenPanels] = React.useState<Record<PanelKey, boolean>>(initialFlowConfig.openPanels);
  const [text, setText] = React.useState(initialText ?? "");
  const allowedUseCases = React.useMemo<UseCaseId[]>(() => {
    const allowed = useCaseAccess?.allowed;
    if (Array.isArray(allowed) && allowed.length > 0) return allowed;
    return mode === "statement" ? ["journalism"] : ["civic", "journalism", "agenda"];
  }, [useCaseAccess?.allowed, mode]);
  const defaultUseCase: UseCaseId = mode === "statement" ? "journalism" : "civic";
  const resolvedCreateMode: CreateMode = createMode ?? (mode === "statement" ? "manual" : "source");
  const resolvedDefaultUseCase = allowedUseCases.includes(defaultUseCase)
    ? defaultUseCase
    : allowedUseCases[0] ?? defaultUseCase;
  const [useCase, setUseCase] = React.useState<UseCaseId>(resolvedDefaultUseCase);
  const [authorName, setAuthorName] = React.useState(initialAuthorName ?? "");
  const [confirmUnderstanding, setConfirmUnderstanding] = React.useState(false);
  const [deepResearchInfo, setDeepResearchInfo] = React.useState<string | null>(null);
  const [deepResearchBusy, setDeepResearchBusy] = React.useState(false);
  const [evidenceInput, setEvidenceInput] = React.useState("");
  const [notes, setNotes] = React.useState<NoteSection[]>([]);
  const [questions, setQuestions] = React.useState<QuestionCard[]>([]);
  const [knots, setKnots] = React.useState<KnotCard[]>([]);
  const [statements, setStatements] = React.useState<StatementEntry[]>([]);
  const [consequences, setConsequences] = React.useState<ConsequenceRecord[]>([]);
  const [responsibilities, setResponsibilities] = React.useState<ResponsibilityRecord[]>([]);
  const [responsibilityPaths, setResponsibilityPaths] = React.useState<ResponsibilityPath[]>([]);
  const [eventualities, setEventualities] = React.useState<EventualityNode[]>([]);
  const [decisionTrees, setDecisionTrees] = React.useState<DecisionTree[]>([]);
  const [impactAndResponsibility, setImpactAndResponsibility] = React.useState<ImpactAndResponsibility>({
    impacts: [],
    responsibleActors: [],
  });
  const [report, setReport] = React.useState<any>(null);
  const [editorialAudit, setEditorialAudit] = React.useState<EditorialAudit | null>(null);
  const [evidenceGraph, setEvidenceGraph] = React.useState<EvidenceGraph | null>(null);
  const [runReceipt, setRunReceipt] = React.useState<RunReceipt | null>(null);
  const [providerMatrix, setProviderMatrix] = React.useState<ProviderMatrixEntry[]>([]);
  const [createAnalyze, setCreateAnalyze] = React.useState<CreateAnalyzeResponse | null>(null);
  const [ctaHandoffState, setCtaHandoffState] = React.useState<CreateCtaHandoffUiState>(
    () => createInitialCreateCtaHandoffState(),
  );
  const [steps, setSteps] = React.useState<AnalyzeStepState[]>(BASE_STEPS);
  const [analysisStatus, setAnalysisStatus] = React.useState<"idle" | "running" | "success" | "empty" | "error">("idle");
  const analyzing = analysisStatus === "running";
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [saveInfo, setSaveInfo] = React.useState<string | null>(null);
  const [draftId, setDraftId] = React.useState<string | null>(null);
  const [localDraftId, setLocalDraftId] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [finalizeInfo, setFinalizeInfo] = React.useState<string | null>(null);
  const [finalizeRedirectTo, setFinalizeRedirectTo] = React.useState<string | null>(null);
  const [selectedClaimIds, setSelectedClaimIds] = React.useState<string[]>([]);
  const [hasManualSelection, setHasManualSelection] = React.useState(false);
  const [traceResult, setTraceResult] = React.useState<TraceResult | null>(null);
  const [traceError, setTraceError] = React.useState<string | null>(null);
  const [isTracing, setIsTracing] = React.useState(false);
  const [researchGuidance, setResearchGuidance] = React.useState<ResearchGuidance | null>(null);
  const [researchError, setResearchError] = React.useState<string | null>(null);
  const [isResearching, setIsResearching] = React.useState(false);
  const [insightTab, setInsightTab] = React.useState<"input" | "recherche">("input");
  const [researchView, setResearchView] = React.useState<"serp" | "cards">("serp");
  const [translations, setTranslations] = React.useState<Record<string, string>>({});
  const [flowInfo, setFlowInfo] = React.useState<string | null>(null);
  const [articleDraft, setArticleDraft] = React.useState<string>("");
  const [articleDraftEdited, setArticleDraftEdited] = React.useState(false);

  const flowConfig = FLOW_OPTIONS.find((opt) => opt.id === flow) ?? FLOW_OPTIONS[0];
  const allowTrace = flowConfig.allowTrace;
  const allowResearch = flowConfig.allowResearch;
  const flowIsLite = !allowTrace && !allowResearch;
  const isJournalism = useCase === "journalism";
  const isAgenda = useCase === "agenda";
  const textLocked = isJournalism && analysisStatus !== "idle";
  const authorLabel = authorName.trim();
  const useCaseLabel =
    useCase === "journalism"
      ? "Medien/Agenturen"
      : useCase === "agenda"
        ? "Verwaltung/Agenda"
        : "Buerger & Projekte";
  const useCaseLockLabels = useCaseAccess?.lockLabels ?? {};
  const defaultUseCaseNote =
    allowedUseCases.length >= 3
      ? ""
      : "Dein Bereich ist festgelegt. Fuer andere Use Cases brauchst du das passende Paket.";
  const useCaseNote = useCaseAccess?.note ?? defaultUseCaseNote;
  const useCaseCtaHref = useCaseAccess?.ctaHref ?? "/pricing";
  const useCaseCtaLabel = useCaseAccess?.ctaLabel ?? "Paket waehlen";
  const isUseCaseAllowed = (id: UseCaseId) => allowedUseCases.includes(id);
  const lockLabelFor = (id: UseCaseId) =>
    useCaseLockLabels[id] ?? "Nur mit passendem Paket.";
  const useCaseOptions: Array<{ id: UseCaseId; title: string; text: string }> = [
    {
      id: "civic",
      title: "Buerger & Projekte",
      text: "Einfacher Einstieg: Kernaussagen, Fragen und Wirkung.",
    },
    {
      id: "journalism",
      title: "Medien & Agenturen",
      text: "Mit Herkunft/Pruefplan, Draft und redaktionellem Audit.",
    },
    {
      id: "agenda",
      title: "Verwaltung & Agenda",
      text: "Zustaendigkeiten, Folgen und Umsetzungslogik.",
    },
  ];
  const contextCount = notes.length + (report?.summary ? 1 : 0);
  const responsibilityCount =
    responsibilities.length +
    responsibilityPaths.length +
    (impactAndResponsibility.responsibleActors?.length ?? 0);
  const consequenceCount =
    consequences.length + (impactAndResponsibility.impacts?.length ?? 0);
  const authorBadge = authorLabel ? `Verfasser: ${authorLabel}` : undefined;

  const translationItems = React.useMemo<TranslationItem[]>(() => {
    if (contentLang === baseLang) return [];
    const items: TranslationItem[] = [];
    const seen = new Set<string>();
    const add = (key: string, text: string | null | undefined) => {
      if (items.length >= 120) return;
      if (seen.has(key)) return;
      if (typeof text !== "string") return;
      const trimmed = text.trim();
      if (!trimmed) return;
      seen.add(key);
      items.push({ key, text: trimmed });
    };

    statements.forEach((s, idx) => {
      const key = s.id ?? String(s.index ?? idx);
      add(`statement:${key}:title`, s.title ?? "");
      add(`statement:${key}:text`, s.text);
    });

    notes.forEach((note, idx) => {
      const key = note.id ?? `note-${idx}`;
      add(`note:${key}:title`, note.title);
      add(`note:${key}:body`, note.body);
    });

    questions.forEach((q, idx) => {
      const key = q.id ?? `q-${idx}`;
      add(`question:${key}:label`, q.label);
      add(`question:${key}:body`, q.body);
    });

    knots.forEach((k, idx) => {
      const key = k.id ?? `k-${idx}`;
      add(`knot:${key}:title`, k.title);
      add(`knot:${key}:body`, k.body);
    });

    eventualities.forEach((e, idx) => {
      const key = e.id ?? `ev-${idx}`;
      add(`eventuality:${key}:text`, e.narrative || e.label || "");
    });

    (impactAndResponsibility.impacts ?? []).forEach((impact, idx) => {
      add(`impact:${idx}:type`, impact.type);
      add(`impact:${idx}:desc`, impact.description);
    });

    (impactAndResponsibility.responsibleActors ?? []).forEach((actor, idx) => {
      add(`actor:${idx}:level`, actor.level);
      add(`actor:${idx}:hint`, actor.hint);
    });

    if (report) {
      add("report:summary", report.summary);
      (report.keyConflicts ?? []).forEach((c: string, idx: number) => add(`report:key:${idx}`, c));
      (report?.facts?.local ?? []).forEach((f: string, idx: number) => add(`report:fact:local:${idx}`, f));
      (report?.facts?.international ?? []).forEach((f: string, idx: number) =>
        add(`report:fact:intl:${idx}`, f),
      );
      (report.takeaways ?? []).forEach((t: string, idx: number) => add(`report:takeaway:${idx}`, t));
    }

    return items;
  }, [contentLang, baseLang, statements, notes, questions, knots, eventualities, impactAndResponsibility, report]);

  const translateQueueRef = React.useRef<TranslationItem[]>([]);
  const translatePendingKeysRef = React.useRef(new Set<string>());
  const translateInFlightRef = React.useRef(false);
  const translateAbortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    setTranslations({});
    translateQueueRef.current = [];
    translatePendingKeysRef.current.clear();
    translateInFlightRef.current = false;
    translateAbortRef.current?.abort();
  }, [contentLang, baseLang]);

  React.useEffect(() => {
    if (contentLang === baseLang) return;
    if (!translationItems.length) return;

    const missing = translationItems.filter((item) => !translations[item.key]);
    if (!missing.length) return;

    for (const item of missing) {
      if (!translatePendingKeysRef.current.has(item.key)) {
        translatePendingKeysRef.current.add(item.key);
        translateQueueRef.current.push(item);
      }
    }

    if (translateInFlightRef.current) return;
    translateInFlightRef.current = true;
    let cancelled = false;

    const runQueue = async () => {
      while (translateQueueRef.current.length && !cancelled) {
        const batch = translateQueueRef.current.splice(0, 40);
        if (!batch.length) continue;
        const ctrl = new AbortController();
        translateAbortRef.current = ctrl;

        const res = await fetch("/api/i18n/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            srcLang: baseLang,
            tgtLang: contentLang,
            items: batch,
          }),
          signal: ctrl.signal,
        }).catch(() => null);

        if (cancelled) return;

        if (!res || !res.ok) {
          batch.forEach((item) => translatePendingKeysRef.current.delete(item.key));
          continue;
        }
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        const mapped = data?.translations ?? null;
        if (!mapped || typeof mapped !== "object") {
          batch.forEach((item) => translatePendingKeysRef.current.delete(item.key));
          continue;
        }
        setTranslations((prev) => ({ ...prev, ...mapped }));
        batch.forEach((item) => translatePendingKeysRef.current.delete(item.key));
      }
    };

    runQueue()
      .catch(() => {
        // ignore
      })
      .finally(() => {
        translateInFlightRef.current = false;
      });

    return () => {
      cancelled = true;
      translateAbortRef.current?.abort();
    };
  }, [contentLang, baseLang, translationItems, translations]);

  const translateText = React.useCallback(
    (key: string, fallback: string | null | undefined) => {
      if (typeof fallback !== "string") return fallback ?? "";
      if (contentLang === baseLang) return fallback;
      const translated = translations[key];
      return translated && translated.trim() ? translated : fallback;
    },
    [contentLang, baseLang, translations],
  );

  const displayImpacts = React.useMemo(() => {
    const impacts = impactAndResponsibility.impacts ?? [];
    if (contentLang === baseLang) return impacts;
    return impacts.map((impact, idx) => ({
      ...impact,
      type: translateText(`impact:${idx}:type`, impact.type),
      description: translateText(`impact:${idx}:desc`, impact.description),
    }));
  }, [contentLang, baseLang, impactAndResponsibility.impacts, translateText]);

  const displayResponsibleActors = React.useMemo(() => {
    const actors = impactAndResponsibility.responsibleActors ?? [];
    if (contentLang === baseLang) return actors;
    return actors.map((actor, idx) => ({
      ...actor,
      level: translateText(`actor:${idx}:level`, actor.level),
      hint: translateText(`actor:${idx}:hint`, actor.hint),
    }));
  }, [contentLang, baseLang, impactAndResponsibility.responsibleActors, translateText]);

  // --- Patch C: single-flight + abort + dedupe + debounce ---
  const mountedRef = React.useRef(true);

  const analyzeCtrlRef = React.useRef<AbortController | null>(null);
  const analyzeKeyRef = React.useRef<string | null>(null);
  const analyzeRunRef = React.useRef(0);

  const traceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const traceCtrlRef = React.useRef<AbortController | null>(null);
  const traceKeyRef = React.useRef<string | null>(null);
  const traceRunRef = React.useRef(0);
  const researchCtrlRef = React.useRef<AbortController | null>(null);
  const researchKeyRef = React.useRef<string | null>(null);
  const researchRunRef = React.useRef(0);
  const ctaRef = React.useRef<HTMLDivElement | null>(null);
  const workspaceRef = React.useRef<HTMLDivElement | null>(null);
  function makeKey(
    preparedTextValue: string,
    statementList: Array<{ id?: string; text?: string }>,
    extra?: Record<string, unknown>,
  ) {
    const ids = (statementList ?? []).map((s) => s.id ?? "").join(",");
    return JSON.stringify({
      t: (preparedTextValue ?? "").trim(),
      ids,
      n: statementList?.length ?? 0,
      ...extra,
    });
  }

  const levelStatements = viewLevel === 1 ? statements.slice(0, MAX_LEVEL1_STATEMENTS) : statements;
  const totalStatements = statements.length;
  const prepared = React.useMemo(() => prepareText(text), [text]);
  const preparedText = prepared.prepared;
  const preparedRatio = prepared.ratio;
  const autoFlow = React.useMemo(() => inferFlowFromText(preparedText), [preparedText]);

  const progressPlacement = <AnalyzeProgress steps={steps} providerMatrix={providerMatrix} compact />;

  React.useEffect(() => {
    if (analysisStatus === "running") return;
    if (flow === autoFlow) return;
    const config = FLOW_OPTIONS.find((opt) => opt.id === autoFlow) ?? FLOW_OPTIONS[0];
    setFlow(config.id);
    setViewLevel(config.defaultLevel);
    setMaxClaims(config.maxClaims);
    setOpenPanels(config.openPanels);
    if (!config.allowTrace && !config.allowResearch) {
      setInsightTab("input");
      setTraceResult(null);
      setTraceError(null);
      setResearchGuidance(null);
      setResearchError(null);
      setEvidenceInput("");
    }
  }, [analysisStatus, autoFlow, flow]);

  React.useEffect(() => {
    if (!allowedUseCases.includes(useCase)) {
      setUseCase(allowedUseCases[0] ?? useCase);
    }
  }, [allowedUseCases, useCase]);

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        if (initialText) setText(initialText);
        return;
      }
      const parsed = JSON.parse(raw) as DraftStorage;
      if (parsed.text) {
        setText(parsed.text);
      } else if (initialText) {
        setText(initialText);
      }
      if (parsed.evidenceInput) setEvidenceInput(parsed.evidenceInput);
      if (parsed.draftId) setDraftId(parsed.draftId);
      if (parsed.localDraftId) setLocalDraftId(parsed.localDraftId);
      if (parsed.savedAt) setSavedAt(parsed.savedAt);
      if (parsed.authorName) setAuthorName(parsed.authorName);
      if (parsed.useCase && allowedUseCases.includes(parsed.useCase)) {
        setUseCase(parsed.useCase);
      }
    } catch {
      // ignore
    }
  }, [storageKey, initialText, allowedUseCases]);

  React.useEffect(() => {
    try {
      const view = window.localStorage.getItem("researchView");
      if (view === "serp" || view === "cards") setResearchView(view);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      analyzeCtrlRef.current?.abort();
      traceCtrlRef.current?.abort();
      researchCtrlRef.current?.abort();
      if (traceTimerRef.current) clearTimeout(traceTimerRef.current);
    };
  }, []);

  // RunReceipt persistence happens server-side in the analyze route.

  React.useEffect(() => {
    if (!storageKey) return;
    const payload: DraftStorage = {
      text,
      draftId,
      localDraftId,
      savedAt,
      evidenceInput,
      authorName: authorName?.trim() || null,
      useCase,
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [storageKey, text, draftId, localDraftId, savedAt, evidenceInput, authorName, useCase]);

  // Persist UI prefs for research view
  React.useEffect(() => {
    try {
      window.localStorage.setItem("researchView", researchView);
    } catch {
      // ignore
    }
  }, [researchView]);

  React.useEffect(() => {
    if (!flowInfo) return;
    const timer = window.setTimeout(() => setFlowInfo(null), 4000);
    return () => window.clearTimeout(timer);
  }, [flowInfo]);

  React.useEffect(() => {
    if (articleDraftEdited) return;
    const next = buildArticleDraft({
      preparedText,
      report,
      statements,
      questions,
      knots,
    });
    setArticleDraft(next);
  }, [articleDraftEdited, preparedText, report, statements, questions, knots]);

  React.useEffect(() => {
    const ids = statements.map((s) => s.id);
    setSelectedClaimIds((prev) => {
      if (!hasManualSelection) return ids;
      const prevSet = new Set(prev);
      return ids.filter((id) => prevSet.has(id));
    });
  }, [hasManualSelection, statements]);

  React.useEffect(() => {
    setConfirmUnderstanding(false);
  }, [preparedText, statements.length, useCase]);

  const analyzeButtonLabel =
    analysisStatus === "running"
      ? analyzeButtonTexts.running
      : analysisStatus === "error" || analysisStatus === "empty"
      ? analyzeButtonTexts.retry
      : analyzeButtonTexts.start;

  const outputClassification = React.useMemo(() => {
    if (analysisStatus !== "success") {
      return {
        label: "Noch keine Einstufung",
        hint: "Starte die Analyse, um eine Einordnung zu erhalten.",
        variant: "neutral" as const,
      };
    }
    const hasContext = notes.length > 0 || knots.length > 0 || Boolean(report?.summary);
    const hasQuestions = questions.length > 0;
    const hasImpact =
      consequences.length > 0 || (impactAndResponsibility.impacts?.length ?? 0) > 0;
    const isDossier = totalStatements >= 4 && (hasContext || hasQuestions || hasImpact);
    return {
      label: isDossier ? "Dossier-Kandidat" : "Statement-Kandidat",
      hint: isDossier
        ? "Geeignet fuer Dossier/Redaktion – vertiefte Aufbereitung empfohlen."
        : "Geeignet fuer Statements/Abstimmung – schnelle Einreichung moeglich.",
      variant: isDossier ? ("dossier" as const) : ("statement" as const),
    };
  }, [
    analysisStatus,
    consequences.length,
    impactAndResponsibility.impacts,
    knots.length,
    notes.length,
    questions.length,
    report?.summary,
    totalStatements,
  ]);

  const authorFeedback = React.useMemo(() => {
    if (analysisStatus !== "success") {
      return "Starte die Analyse, um Feedback zur Verarbeitbarkeit zu erhalten.";
    }
    const tips: string[] = [];
    if (totalStatements < 2) tips.push("Mehr klare Einzel-Statements wuerden helfen.");
    if (questions.length === 0) tips.push("Offene Fragen fehlen noch.");
    if (!notes.length && !knots.length && !report?.summary) tips.push("Kontext fehlt noch.");
    if (!tips.length) {
      return "Gute Basis. Du kannst die Statements auswaehlen und einreichen oder in die Redaktion ueberfuehren.";
    }
    return tips.join(" ");
  }, [analysisStatus, knots.length, notes.length, questions.length, report?.summary, totalStatements]);

  const requiredLevel =
    verificationLevel && mode === "contribution"
      ? viewLevel >= 2
        ? VERIFICATION_REQUIREMENTS.contribution_level2
        : VERIFICATION_REQUIREMENTS.contribution_level1
      : null;

  const meetsLevel =
    verificationLevel && requiredLevel
      ? meetsVerificationLevel(verificationLevel, requiredLevel)
      : true;

  const analyzeDisabled =
    analysisStatus === "running" || !preparedText.trim() || verificationStatus === "loading" || !meetsLevel;
  const traceDisabled =
    insightTab === "input"
      ? !allowTrace || isTracing || isResearching || !preparedText.trim() || statements.length === 0
      : !allowResearch || isResearching || isTracing || !preparedText.trim();
  const traceButtonLabel =
    insightTab === "input"
      ? isTracing
        ? "Herkunft läuft …"
        : traceResult
        ? "Herkunft aktualisieren"
        : "Herkunft anzeigen"
      : isResearching
      ? "Prüfplan läuft …"
      : researchGuidance
      ? "Prüfplan aktualisieren"
      : "Prüfplan anzeigen";
  const guidance = traceResult?.guidance ?? null;
  const guidanceError = insightTab === "input" ? traceError : researchError;
  const hasGuidance = insightTab === "input" ? Boolean(guidance) : Boolean(researchGuidance);
  const hasResearchSources = Boolean(researchGuidance?.sources && researchGuidance.sources.length > 0);
  const hasStatements = totalStatements > 0;
  const hasNotes = notes.length > 0;
  const hasQuestions = questions.length > 0;
  const hasKnots = knots.length > 0;
  const hasEventualities = eventualities.length > 0 || decisionTrees.length > 0;
  const hasConsequencesBlock =
    consequences.length > 0 ||
    responsibilities.length > 0 ||
    responsibilityPaths.length > 0 ||
    (impactAndResponsibility.impacts?.length ?? 0) > 0 ||
    (impactAndResponsibility.responsibleActors?.length ?? 0) > 0;
  const hasReport =
    Boolean(report?.summary) ||
    Boolean(report?.keyConflicts?.length) ||
    Boolean(report?.facts?.local?.length) ||
    Boolean(report?.facts?.international?.length) ||
    Boolean(report?.takeaways?.length);
  const hasAnyResults =
    hasStatements ||
    hasNotes ||
    hasQuestions ||
    hasKnots ||
    hasEventualities ||
    hasConsequencesBlock ||
    hasReport ||
    Boolean(editorialAudit) ||
    Boolean(evidenceGraph) ||
    Boolean(runReceipt);
  const showProgress = !flowIsLite && (analysisStatus !== "idle" || hasAnyResults);
  const showOutputSection = analysisStatus === "success" || hasAnyResults;
  const showInsights = analysisStatus === "success" && (allowTrace || allowResearch) && hasStatements;
  const createAnalyzePhases = createAnalyze
    ? [
        { key: "intake", value: createAnalyze.phases.intake },
        { key: "quality", value: createAnalyze.phases.quality },
        { key: "graph_matching", value: createAnalyze.phases.graph_matching },
        { key: "cta_suggestions", value: createAnalyze.phases.cta_suggestions },
      ]
    : [];
  const createAnalyzeRoutingHint = createAnalyze ? deriveCreateAnalyzeRoutingHint(createAnalyze) : null;
  const createAnalyzeReasons = createAnalyze ? collectCreateAnalyzeReasons(createAnalyze) : [];
  const pendingCtaHandoff = ctaHandoffState.pending;
  const confirmedCtaHandoff = ctaHandoffState.confirmed;

  const deepResearchHints = React.useMemo(() => {
    if (!researchGuidance) return [] as string[];
    const hints: string[] = [];
    if (researchGuidance.queries?.length) {
      hints.push(`Gezielte Suchanfragen pruefen (${researchGuidance.queries.length})`);
    }
    if (researchGuidance.sources?.length) {
      hints.push(`Quellentypen vertiefen (${researchGuidance.sources.length})`);
    }
    if (researchGuidance.risks?.length) {
      hints.push(`Risiken/Fehlinformationen klaeren (${researchGuidance.risks.length})`);
    }
    if (researchGuidance.stakeholders?.length) {
      hints.push(`Stakeholder-Positionen ergaenzen (${researchGuidance.stakeholders.length})`);
    }
    if (researchGuidance.focus?.length) {
      hints.push(`Fokusfelder absichern (${researchGuidance.focus.length})`);
    }
    return hints;
  }, [researchGuidance]);
  const hasResearchRun =
    Boolean(report?.facts?.local?.length) ||
    Boolean(report?.facts?.international?.length) ||
    Boolean(
      Array.isArray((runReceipt as any)?.steps) &&
        (runReceipt as any).steps.some((step: any) =>
          String(step?.kind || step?.phase || step?.tag || "")
            .toLowerCase()
            .includes("research"),
        ),
    ) ||
    Boolean(
      Array.isArray((runReceipt as any)?.phases) &&
        (runReceipt as any).phases.some((phase: any) =>
          String(phase?.kind || phase?.name || "")
            .toLowerCase()
            .includes("research"),
        ),
    );
  const showDeepResearch =
    insightTab === "recherche" && hasResearchRun && Boolean(researchGuidance) && deepResearchHints.length > 0;

  const gatingMessage =
    verificationStatus === "login_required"
      ? "Bitte melde dich an, um Beiträge zu analysieren."
      : verificationStatus === "error"
      ? "Level konnte nicht geladen werden – bitte später erneut versuchen."
      : !meetsLevel && requiredLevel
      ? `Für diese Ansicht benötigst du mindestens Verifizierungs-Level "${requiredLevel}".`
      : null;

  const togglePanel = (key: PanelKey, isOpen?: boolean) => {
    setOpenPanels((prev) => ({
      ...prev,
      [key]: typeof isOpen === "boolean" ? isOpen : !prev[key],
    }));
  };

  const saveDraftSnapshot = React.useCallback(async () => {
    if (!preparedText.trim()) {
      setSaveInfo("Bitte zuerst einen Text eingeben.");
      return;
    }

    setIsSaving(true);
    setSaveInfo(null);
    try {
      const saveUrl = saveEndpoint || "/api/drafts/save";
      const payload = {
        draftId,
        text: preparedText || text,
        textOriginal: text,
        textPrepared: preparedText,
        locale,
        source: mode === "statement" ? "statement_new" : "contribution_new",
        createMode: resolvedCreateMode,
        anlassraumId: selectedAnlassraumId ?? undefined,
        authorName: authorName?.trim() || undefined,
        useCase,
        analysis: {
          claims: statements,
          notes,
          questions,
          knots,
          consequences,
          responsibilities,
          responsibilityPaths,
          impactAndResponsibility,
          report,
          eventualities,
          decisionTrees,
        },
      };

      const res = await fetch(saveUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "Speichern fehlgeschlagen");
      }
      setDraftId(body.draftId ?? draftId);
      setSavedAt(body.updatedAt ?? new Date().toISOString());
      setSaveInfo("Entwurf gespeichert.");
      return;
    } catch (err: any) {
      const msg = err?.message ?? "";
      const isNetwork =
        msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("timeout");

      if (isNetwork) {
        const fallbackId = localDraftId ?? hashLocalDraft(text);
        setLocalDraftId(fallbackId);
        setSavedAt(new Date().toISOString());
        setSaveInfo("Server nicht erreichbar – Entwurf lokal gesichert.");
      } else {
        setSaveInfo(msg || "Speichern fehlgeschlagen.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    decisionTrees,
    draftId,
    eventualities,
    impactAndResponsibility,
    knots,
    locale,
    mode,
    resolvedCreateMode,
    selectedAnlassraumId,
    notes,
    preparedText,
    questions,
    report,
    responsibilities,
    responsibilityPaths,
    saveEndpoint,
    statements,
    text,
    consequences,
    localDraftId,
    authorName,
    useCase,
  ]);

  const handleFinalize = React.useCallback(async () => {
    if (!draftId) {
      setFinalizeInfo("Bitte zuerst einen serverseitigen Entwurf speichern.");
      return;
    }
    if (selectedClaimIds.length === 0) {
      setFinalizeInfo("Bitte wähle mindestens ein Statement aus.");
      return;
    }
    if (!confirmUnderstanding) {
      setFinalizeInfo("Bitte bestaetige, dass die Kernaussagen korrekt verstanden wurden.");
      return;
    }

    setIsFinalizing(true);
    setFinalizeInfo(null);
    try {
      const res = await fetch(finalizeEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draftId,
          selectedClaimIds,
          dossierId: dossierId ?? undefined,
          source: mode === "statement" ? "statement_new" : "contribution_new",
          createMode: resolvedCreateMode,
          anlassraumId: selectedAnlassraumId ?? undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "Einreichen fehlgeschlagen");
      }
      setFinalizeInfo("Erfolgreich eingereicht. Deine Vorschlaege erscheinen jetzt im Swipe-Pool.");
      setFinalizeRedirectTo(body.redirectTo ?? afterFinalizeNavigateTo ?? null);
    } catch (err: any) {
      setFinalizeInfo(err?.message ?? "Einreichen fehlgeschlagen.");
    } finally {
      setIsFinalizing(false);
    }
  }, [afterFinalizeNavigateTo, confirmUnderstanding, dossierId, draftId, finalizeEndpoint, mode, resolvedCreateMode, selectedAnlassraumId, selectedClaimIds]);

  const handleDeepResearch = React.useCallback(async () => {
    if (!preparedText.trim()) {
      setDeepResearchInfo("Bitte zuerst einen Text erfassen.");
      return;
    }
    setDeepResearchBusy(true);
    setDeepResearchInfo(null);
    try {
      const claims = statements.map((s) => ({
        id: s.id,
        text: s.text,
        domain: s.domain ?? null,
        domains: Array.isArray((s as any)?.domains) ? (s as any).domains : null,
      }));
      const res = await fetch("/api/factcheck/enqueue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: preparedText,
          language: locale,
          claims,
          withSerp: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          setDeepResearchInfo("Tiefenrecherche ist fuer ProPilot/Redaktion freigeschaltet.");
          return;
        }
        throw new Error(body?.message || body?.error || "Tiefenrecherche fehlgeschlagen");
      }
      setDeepResearchInfo("Tiefenrecherche gestartet. Ergebnis folgt im Dossier.");
    } catch (err: any) {
      setDeepResearchInfo(err?.message ?? "Tiefenrecherche fehlgeschlagen");
    } finally {
      setDeepResearchBusy(false);
    }
  }, [locale, preparedText, statements]);

  const fetchResearchGuidance = React.useCallback(
    async (claimsOverride?: Array<{ id?: string; text?: string; domain?: string | null; domains?: string[] | null }>) => {
      if (!allowResearch) {
        setResearchGuidance(null);
        setResearchError(null);
        return;
      }
      const claimsSource = claimsOverride ?? statements;
      const key = makeKey(preparedText, claimsSource, { mode: "research", locale });

      if (researchCtrlRef.current && researchKeyRef.current === key) return;

      researchCtrlRef.current?.abort();
      const ctrl = new AbortController();
      researchCtrlRef.current = ctrl;
      researchKeyRef.current = key;
      const myRun = ++researchRunRef.current;

      try {
        if (!preparedText.trim()) {
          setResearchGuidance(null);
          setResearchError(null);
          return;
        }

        setIsResearching(true);
        setResearchError(null);
        // Research-Fallback ist eigenständig: wir wollen hier keine Trace-Reste anzeigen.
        setTraceResult(null);
        setTraceError(null);

        const claims = (claimsSource ?? []).map((s) => ({
          id: s.id,
          text: s.text,
          domain: (s as any)?.domain ?? null,
          domains: Array.isArray((s as any)?.domains) ? (s as any).domains : null,
        }));

        const res = await fetch("/api/contributions/research", {
          method: "POST",
          signal: ctrl.signal,
          cache: "no-store",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ locale, claims }),
        });
        const body = await res.json().catch(() => ({}));

        if (!mountedRef.current || myRun !== researchRunRef.current) return;

        if (!res.ok || !body?.ok) {
          setResearchError(body?.message || body?.error || "Prüfplan konnte nicht erzeugt werden.");
          setResearchGuidance(null);
          return;
        }

        setResearchGuidance((body?.guidance ?? null) as ResearchGuidance | null);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        if (!mountedRef.current || myRun !== researchRunRef.current) return;
        setResearchError(err?.message ?? "Prüfplan konnte nicht erzeugt werden.");
        setResearchGuidance(null);
      } finally {
        if (mountedRef.current && myRun === researchRunRef.current) {
          researchCtrlRef.current = null;
          setIsResearching(false);
        }
      }
    },
    [allowResearch, locale, preparedText, statements],
  );

  const handleAnalyze = React.useCallback(async () => {
    if (analyzeDisabled) return;
    const effectiveEvidenceInput = allowResearch ? evidenceInput.trim() : "";
    const key = makeKey(preparedText, statements, {
      maxClaims,
      detailLevel: viewLevel,
      locale,
      evidence: effectiveEvidenceInput,
      anlassraumId: selectedAnlassraumId ?? null,
    });
    if (analyzeCtrlRef.current && analyzeKeyRef.current === key) return;
    analyzeCtrlRef.current?.abort();
    const ctrl = new AbortController();
    analyzeCtrlRef.current = ctrl;
    analyzeKeyRef.current = key;
    const myRun = ++analyzeRunRef.current;
    setError(null);
    setInfo(null);
    setTraceResult(null);
    setTraceError(null);
    setResearchGuidance(null);
    setResearchError(null);
    setEditorialAudit(null);
    setEvidenceGraph(null);
    setRunReceipt(null);
    setCreateAnalyze(null);
    setCtaHandoffState(createInitialCreateCtaHandoffState());
    setAnalysisStatus("running");
    setSteps(BASE_STEPS.map((s) => ({ ...s, state: "running" })));

    try {
      const evidenceItems = effectiveEvidenceInput
        ? effectiveEvidenceInput
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        : [];

      const res = await fetch(analyzeEndpoint, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          textOriginal: text,
          preparedText,
          text: preparedText,
          createMode: resolvedCreateMode,
          anlassraumId: selectedAnlassraumId ?? undefined,
          dossierId: dossierId ?? undefined,
          locale,
          maxClaims,
          detailPreset: viewLevel,
          evidenceItems,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!mountedRef.current || myRun !== analyzeRunRef.current) return;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || `Analyse fehlgeschlagen (HTTP ${res.status}).`);
      }
      const orchestrationSnapshot = parseCreateAnalyzeResponse(data?.createAnalyze);
      setCreateAnalyze(orchestrationSnapshot);
      setCtaHandoffState(createInitialCreateCtaHandoffState());

      const resultPayload = data.result ?? data;
      if (!resultPayload) throw new Error("Analyse lieferte keine Ergebnisse.");
      const result: AnalyzeResult = resultPayload as AnalyzeResult;

      const rawNotes = Array.isArray((result as any).notes) ? (result as any).notes : [];
      const rawQuestions = Array.isArray((result as any).questions) ? (result as any).questions : [];
      const rawKnots = Array.isArray((result as any).knots) ? (result as any).knots : [];
      const rawClaims = Array.isArray((result as any).claims) ? (result as any).claims : [];

      const mappedNotes = rawNotes.map(mapAiNoteToSection).filter((x): x is NoteSection => x !== null);
      const mappedQuestions = rawQuestions.map(mapAiQuestionToCard).filter((x): x is QuestionCard => x !== null);
      const mappedKnots = rawKnots.map(mapAiKnotToCard).filter((x): x is KnotCard => x !== null);
      const mappedStatements = dedupeStatements(
        rawClaims.map(mapAiClaimToStatement).filter((x): x is StatementEntry => x !== null),
      );

      const impactBlock = (result as any)?.impactAndResponsibility;
      const impactAndResponsibilityLocal: ImpactAndResponsibility = {
        impacts: Array.isArray(impactBlock?.impacts) ? impactBlock.impacts : [],
        responsibleActors: Array.isArray(impactBlock?.responsibleActors) ? impactBlock.responsibleActors : [],
      };

      const consequenceBundle = (result as any)?.consequences;
      const mappedConsequences: ConsequenceRecord[] = Array.isArray(consequenceBundle?.consequences)
        ? consequenceBundle.consequences
        : [];
      const mappedResponsibilities: ResponsibilityRecord[] = Array.isArray(consequenceBundle?.responsibilities)
        ? consequenceBundle.responsibilities
        : [];
      const mappedPaths: ResponsibilityPath[] = Array.isArray((result as any)?.responsibilityPaths)
        ? (result as any).responsibilityPaths
        : [];

      const inferredTags = deriveTagsFromAnalysis(mappedStatements, mappedKnots);
      const level = viewLevel >= 2 ? "vertieft" : "basis";
      const catalogQuestions = selectE150Questions(inferredTags, level).map((q) => ({
        id: q.id,
        label: q.tags[0]?.toUpperCase() ?? "FRAGE",
        category: q.tags[0] ?? "",
        body: q.text,
      }));

      const mergedQuestions = dedupeQuestions([...catalogQuestions, ...mappedQuestions]);

      setHasManualSelection(false);
      setNotes(mappedNotes);
      setQuestions(mergedQuestions);
      setKnots(mappedKnots);
      setStatements(mappedStatements);
      setImpactAndResponsibility(impactAndResponsibilityLocal);
      setConsequences(mappedConsequences);
      setResponsibilities(mappedResponsibilities);
      setResponsibilityPaths(mappedPaths);
      setEventualities(Array.isArray(result.eventualities) ? result.eventualities : []);
      setDecisionTrees(Array.isArray(result.decisionTrees) ? result.decisionTrees : []);
      setReport((result as any)?.report ?? null);
      setEditorialAudit((result as any)?.editorialAudit ?? null);
      setEvidenceGraph((result as any)?.evidenceGraph ?? null);
      setRunReceipt((result as any)?.runReceipt ?? null);

      const matrixFromResponse: ProviderMatrixEntry[] = Array.isArray(data?.meta?.providerMatrix)
        ? data.meta.providerMatrix
        : [];
      setProviderMatrix(matrixFromResponse);

      const degraded = Boolean(data?.degraded);
      const degradedReason = degraded ? "KI temporär nicht erreichbar" : null;

      setSteps(
        computeStepStatesFromData({
          notes: mappedNotes,
          statements: mappedStatements,
          questions: mergedQuestions,
          consequences: mappedConsequences,
          responsibilities: mappedResponsibilities,
          impactAndResponsibility: impactAndResponsibilityLocal,
          degradedReason,
        }),
      );

      if (degraded) {
        setInsightTab(allowResearch ? "recherche" : "input");
        setAnalysisStatus("error");
        setError("KI temporär nicht erreichbar.");
        setInfo("Dein Entwurf bleibt erhalten. Bitte später erneut versuchen oder Provider/Keys prüfen.");
        if (allowResearch) {
          void fetchResearchGuidance(mappedStatements);
        }
      } else if (mappedStatements.length === 0) {
        setInsightTab(allowResearch ? "recherche" : "input");
        setAnalysisStatus("empty");
        setInfo(
          "Die Analyse konnte aus deinem Beitrag im Moment keine klaren Einzel-Statements ableiten. Du kannst deinen Text leicht anpassen (z.B. kuerzere Saetze) und die Analyse erneut starten.",
        );
        if (allowResearch) {
          void fetchResearchGuidance(mappedStatements);
        }
      } else {
        setInsightTab("input");
        setAnalysisStatus("success");
        setInfo(null);
        setError(null);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (!mountedRef.current || myRun !== analyzeRunRef.current) return;
      const msg = String(err?.message ?? "");
      setError(msg || "Analyse fehlgeschlagen. Vermutlich gab es ein Problem mit dem KI-Dienst.");
      setInfo("Dein Entwurf bleibt erhalten. Du kannst es nach einem kurzen Moment erneut versuchen.");
      setAnalysisStatus("error");
      setHasManualSelection(false);
      setNotes([]);
      setQuestions([]);
      setKnots([]);
      setStatements([]);
      setConsequences([]);
      setResponsibilities([]);
      setResponsibilityPaths([]);
      setEventualities([]);
      setDecisionTrees([]);
      setImpactAndResponsibility({ impacts: [], responsibleActors: [] });
      setReport(null);
      setEditorialAudit(null);
      setEvidenceGraph(null);
      setRunReceipt(null);
      setCreateAnalyze(null);
      setCtaHandoffState(createInitialCreateCtaHandoffState());
      setSteps(
        computeStepStatesFromData({
          notes: [],
          statements: [],
          questions: [],
          consequences: [],
          responsibilities: [],
          impactAndResponsibility: { impacts: [], responsibleActors: [] },
          failedReason: msg || "Analyse fehlgeschlagen",
        }),
      );
      if (allowResearch) {
        void fetchResearchGuidance([]);
      }
    } finally {
      if (mountedRef.current && myRun === analyzeRunRef.current) {
        analyzeCtrlRef.current = null;
        analyzeKeyRef.current = null;
      }
    }
  }, [
    analyzeDisabled,
    analyzeEndpoint,
    allowResearch,
    evidenceInput,
    fetchResearchGuidance,
    dossierId,
    locale,
    maxClaims,
    preparedText,
    resolvedCreateMode,
    selectedAnlassraumId,
    statements,
    text,
    viewLevel,
  ]);

  const handleCreateCtaSelect = React.useCallback(
    (ctaId: CreateCtaHandoff["ctaId"]) => {
      if (!createAnalyze) return;
      const handoff = buildCreateCtaHandoff({
        ctaId,
        createAnalyze,
      });
      setCtaHandoffState((prev) => selectCreateCtaHandoff(prev, handoff));
    },
    [createAnalyze],
  );

  const handleCreateCtaCancel = React.useCallback(() => {
    setCtaHandoffState((prev) => cancelCreateCtaHandoff(prev));
  }, []);

  const handleCreateCtaConfirm = React.useCallback(() => {
    const nextState = confirmCreateCtaHandoff(ctaHandoffState);
    setCtaHandoffState(nextState);

    const confirmed = nextState.confirmed;
    if (!confirmed) return;

    if (nextState.confirmAction.type === "navigate") {
      setInfo(`CTA-Handoff bestaetigt: ${confirmed.ctaId}. Ziel wird geoeffnet (${nextState.confirmAction.targetRef}).`);
      router.push(nextState.confirmAction.targetRef as Parameters<typeof router.push>[0]);
      return;
    }

    setInfo(
      `CTA-Handoff bestaetigt: ${confirmed.ctaId}. Prepare-only, keine Mutation, kein Auto-Publish, kein Silent-Merge.`,
    );
  }, [ctaHandoffState, router]);

  const scheduleTrace = React.useCallback(() => {
    const key = makeKey(preparedText, statements, { mode: "trace", locale });

    if (traceTimerRef.current) clearTimeout(traceTimerRef.current);

    traceTimerRef.current = setTimeout(async () => {
      if (traceCtrlRef.current && traceKeyRef.current === key) return;

      traceCtrlRef.current?.abort();
      researchCtrlRef.current?.abort();
      const ctrl = new AbortController();
      traceCtrlRef.current = ctrl;
      traceKeyRef.current = key;
      const myRun = ++traceRunRef.current;

      try {
        if (!preparedText.trim() || statements.length === 0) {
          setTraceResult(null);
          setTraceError(null);
          return;
        }
        setIsTracing(true);
        setTraceError(null);
        setResearchGuidance(null);
        setResearchError(null);
        const res = await fetch("/api/contributions/trace", {
          method: "POST",
          signal: ctrl.signal,
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            textOriginal: text,
            preparedText: preparedText || undefined,
            locale,
            statements: statements.map((s) => ({ id: s.id, text: s.text })),
          }),
        });
        const body = await res.json().catch(() => ({}));

        if (!mountedRef.current || myRun !== traceRunRef.current) return;

        if (!res.ok || !body?.ok) {
          setTraceError(body?.error || "Herkunft konnte nicht ermittelt werden.");
          setTraceResult(null);
          return;
        }
        setTraceResult({
          attribution: body.attribution ?? {},
          guidance: body.guidance ?? null,
        });
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        if (!mountedRef.current || myRun !== traceRunRef.current) return;
        setTraceError(err?.message ?? "Herkunft konnte nicht ermittelt werden.");
        setTraceResult(null);
      } finally {
        if (mountedRef.current && myRun === traceRunRef.current) {
          traceCtrlRef.current = null;
          setIsTracing(false);
        }
      }
    }, 250);
  }, [locale, preparedText, statements, text]);

  React.useEffect(() => {
    if (!allowTrace) {
      setTraceResult(null);
      setTraceError(null);
      return;
    }
    if (!preparedText?.trim() || statements.length === 0) {
      setTraceResult(null);
      setTraceError(null);
      setResearchGuidance(null);
      setResearchError(null);
      return;
    }
    if (insightTab !== "input") return;
    scheduleTrace();
  }, [allowTrace, insightTab, preparedText, scheduleTrace, statements]);

  const handleTrace = React.useCallback(() => {
    if (insightTab === "recherche") {
      if (!allowResearch) {
        setFlowInfo("Pruefplan ist im Express-Modus deaktiviert.");
        return;
      }
      fetchResearchGuidance();
      return;
    }
    if (!allowTrace) {
      setFlowInfo("Herkunft ist im Express-Modus deaktiviert.");
      return;
    }
    if (statements.length > 0) {
      scheduleTrace();
      return;
    }
    setInsightTab("recherche");
    fetchResearchGuidance();
  }, [allowResearch, allowTrace, fetchResearchGuidance, insightTab, scheduleTrace, statements.length]);

  const handleCopy = React.useCallback(async (value: string, label: string) => {
    if (!value.trim()) {
      setFlowInfo("Nichts zum Kopieren.");
      return;
    }
    try {
      if (!navigator?.clipboard?.writeText) throw new Error("Clipboard not available");
      await navigator.clipboard.writeText(value);
      setFlowInfo(`${label} kopiert.`);
    } catch {
      setFlowInfo("Kopieren nicht moeglich.");
    }
  }, []);

  const handleRegenerateArticle = React.useCallback(() => {
    const next = buildArticleDraft({
      preparedText,
      report,
      statements,
      questions,
      knots,
    });
    setArticleDraft(next);
    setArticleDraftEdited(false);
    setFlowInfo("Entwurf aktualisiert.");
  }, [knots, preparedText, questions, report, statements]);

  const toggleSelected = (id: string) => {
    setHasManualSelection(true);
    setSelectedClaimIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleRedirect = React.useCallback(() => {
    if (!finalizeRedirectTo) return;
    router.push(finalizeRedirectTo as any);
  }, [finalizeRedirectTo, router]);

  return (
    <div ref={workspaceRef} className="min-h-[calc(100vh-64px)] bg-[rgb(var(--bg))]">
      <div className={["container-vog max-w-none px-4 space-y-4 pt-6", totalStatements > 0 ? "pb-40" : "pb-24"].join(" ")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="vog-head text-3xl sm:text-4xl">
              {mode === "statement" ? (
                <>
                  <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                    Statement
                  </span>{" "}
                  analysieren
                </>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                    Beitrag
                  </span>{" "}
                  analysieren
                </>
              )}
            </h1>
            <p className="text-xs text-[rgb(var(--muted))]">
              Auto-Flow: <span className="font-semibold text-[rgb(var(--muted))]">{flowConfig.label}</span> ·{" "}
              {flowConfig.description}
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] text-[rgb(var(--muted))]">
              <span className="inline-flex rounded-full bg-[rgb(var(--card))] px-2 py-1 ring-1 ring-inset ring-[rgb(var(--border))]">
                {allowResearch ? "Pruefplan an" : "Pruefplan aus"}
              </span>
              <span className="inline-flex rounded-full bg-[rgb(var(--card))] px-2 py-1 ring-1 ring-inset ring-[rgb(var(--border))]">
                {flowIsLite ? "Schnellstart" : "Vertieft"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 text-[11px] text-[rgb(var(--muted))] sm:items-end">
            <span>
              UI: <span className="font-medium uppercase">{locale || "-"}</span>
            </span>
            <ContentLanguageSelect value={contentLang} onChange={setContentLang} />
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-5">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Dein Text</h2>
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  {flowIsLite
                    ? "Kurz und klar. Wir nutzen nur deinen Text."
                    : "Dieser Text bildet die Basis fuer Kernaussagen, Fragen und Wirkung."}
                </p>
              </div>
            </div>

            <HighlightedTextarea
              value={text}
              onChange={setText}
              analyzing={analysisStatus === "running"}
              rows={14}
              readOnly={textLocked}
            />
            <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
              Echtzeit-Feedback erscheint hier, sobald die Live-Analyse stabil verfuegbar ist.
            </div>

            {allowResearch && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Recherche-Input (optional)</h3>
                  <span className="text-[11px] text-[rgb(var(--muted))]">Links oder Stichpunkte</span>
                </div>
                <textarea
                  className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm leading-relaxed text-[rgb(var(--fg))] shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  rows={4}
                  value={evidenceInput}
                  onChange={(event) => setEvidenceInput(event.target.value)}
                  placeholder="Quellen oder Hinweise, die der KI als Kontext dienen (z. B. Links, Stichpunkte)."
                />
              </div>
            )}

            <div className="rounded-xl bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))] ring-1 ring-inset ring-[rgb(var(--border))]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Entwurf: <span className="font-semibold text-[rgb(var(--fg))]">{buildDraftLabel(draftId, localDraftId)}</span>
                </span>
                <span>
                  zuletzt gespeichert: <span className="font-semibold text-[rgb(var(--fg))]">{formatDateLabel(savedAt)}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <span>{text.length} Zeichen</span>
                <span>Aufbereitet: ~{preparedRatio}% kürzer (spart Zeit & Coins)</span>
              </div>

              <div className="flex w-full justify-center">
                <button
                  type="button"
                  onClick={saveDraftSnapshot}
                  disabled={isSaving || !preparedText.trim()}
                  className="w-full rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-2.5 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] disabled:opacity-60 sm:w-auto"
                >
                  {isSaving ? "Speichere …" : "Speichern"}
                </button>
              </div>

              {error ? (
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30">
                  Fehler
                </span>
              ) : info ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30">
                  Hinweis
                </span>
              ) : null}

              {gatingMessage && <p className="text-xs font-semibold text-rose-600">{gatingMessage}</p>}
            </div>

            {error && (
              <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-700 space-y-1 dark:bg-rose-500/15 dark:text-rose-200">
                <p>{error}</p>
              </div>
            )}
            {saveInfo && (
              <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">{saveInfo}</p>
            )}
            {info && (
              <p className="mt-2 rounded-lg bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">{info}</p>
            )}
            {flowInfo && (
              <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">{flowInfo}</p>
            )}
          </div>

          {showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Fortschritt</span>
                <span className="text-[10px] text-[rgb(var(--muted))]">
                  Kontext · Kernaussagen · Fragen · Wirkung · Zustaendigkeit
                </span>
              </div>
              <div className="w-full">{progressPlacement}</div>
            </div>
          )}

          <div className="space-y-4">
            {viewLevel <= 2 && (
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
                {viewLevel === 1 && (
                  <div className="mb-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Schnellblick</p>
                    {report?.summary ? (
                      <p className="mt-1 text-sm text-[rgb(var(--fg))]">{translateText("report:summary", report.summary)}</p>
                    ) : (
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">Noch keine Zusammenfassung vorhanden.</p>
                    )}
                  </div>
                )}

                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold leading-tight text-[rgb(var(--fg))]">
                    {viewLevel === 1 ? "Top-Kernaussagen" : "Alle Kernaussagen"}
                  </h2>

                  <div className="text-[11px] text-[rgb(var(--muted))]">
                    {totalStatements > 0
                      ? viewLevel === 1
                        ? `${totalStatements} gesamt (Top ${Math.min(MAX_LEVEL1_STATEMENTS, totalStatements)})`
                        : `${totalStatements} Statements`
                      : "Noch keine Statements – Analyse zuerst starten."}
                  </div>
                </div>

                <div className="space-y-3">
                  {levelStatements.map((s, idx) => {
                    const stanceLabel =
                      s.stance === "pro"
                        ? "pro"
                        : s.stance === "contra"
                        ? "contra"
                        : s.stance === "neutral"
                        ? "neutral"
                        : null;
                  const tags: string[] = [];
                  if (stanceLabel) tags.push(`Haltung: ${stanceLabel}`);
                  if (typeof s.importance === "number") tags.push(`Wichtigkeit: ${s.importance}/5`);
                    const tagsAll = Array.from(new Set([...(s.tags ?? []), ...tags.filter(Boolean)]));
                    const primaryTags = tagsAll.slice(0, 2);
                    const extraTags = tagsAll.slice(2);
                    const attribution = traceResult?.attribution?.[s.id] ?? null;
                    const modeMeta = attribution ? TRACE_MODE_STYLE[attribution.mode] : null;
                    const titleBase = s.title && s.title.trim().length > 0 ? s.title : `Statement #${s.index + 1}`;
                    const translationKey = s.id ?? String(s.index ?? idx);
                    const statementTitle = s.title
                      ? translateText(`statement:${translationKey}:title`, s.title)
                      : titleBase;
                    const statementText = translateText(`statement:${translationKey}:text`, s.text);
                    const showOriginal = contentLang !== baseLang && statementText !== s.text;

                    return (
                      <StatementCard
                        key={s.id}
                        variant="analyze"
                        statementId={s.id}
                        text={statementText}
                        title={statementTitle}
                        mainCategory={statementTitle}
                        jurisdiction={s.responsibility || undefined}
                        topic={s.topic || undefined}
                        tags={tags}
                        source="ai"
                        badgeRight={authorBadge}
                        showVoteButtons={false}
                      >
                        <div className="space-y-3">
                          {showOriginal && (
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                              Original ({baseLang.toUpperCase()})
                            </div>
                          )}
                          {isJournalism ? (
                            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2 text-[11px] text-[rgb(var(--muted))]">
                              Text bleibt fixiert fuer journalistische Beitraege.
                            </div>
                          ) : (
                            <InlineEditableText
                              value={s.text}
                              onChange={(val) =>
                                setStatements((prev) =>
                                  prev.map((entry) => (entry.id === s.id ? { ...entry, text: val } : entry)),
                                )
                              }
                            />
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            {modeMeta && <TinyPill className={modeMeta.chipClass}>{modeMeta.label}</TinyPill>}
                            {primaryTags.map((t) => (
                              <TinyPill key={t}>{t}</TinyPill>
                            ))}
                            {extraTags.length > 0 && (
                              <details className="group">
                                <summary className="cursor-pointer select-none text-[10px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
                                  Details
                                </summary>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {extraTags.map((t) => (
                                    <TinyPill key={t}>{t}</TinyPill>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                          {attribution && (
                            <details className="mt-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-2">
                              <summary className="cursor-pointer select-none text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
                                Herkunft & Begründung
                              </summary>

                              <div className="mt-2 space-y-2 text-xs">
                                {attribution.why && <div className="text-[rgb(var(--muted))]">{attribution.why}</div>}

                                {Array.isArray(attribution.quotes) && attribution.quotes.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-semibold text-[rgb(var(--muted))]">Zitate</div>
                                    <ul className="list-disc pl-5 text-[rgb(var(--muted))]">
                                      {attribution.quotes.map((quote, idx) => (
                                        <li key={`${s.id}-quote-${idx}`}>
                                          <span className="text-[rgb(var(--fg))]">{quote}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                          <div
                            className={`flex flex-wrap items-center ${flowIsLite ? "justify-end" : "justify-between"} gap-3`}
                          >
                            {!flowIsLite && (
                              <VogVoteButtons
                                value={s.vote ?? null}
                                size="sm"
                                onChange={(next) =>
                                  setStatements((prev) =>
                                    prev.map((entry) => (entry.id === s.id ? { ...entry, vote: next } : entry)),
                                  )
                                }
                              />
                            )}
                            <label className="inline-flex items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                              <input
                                type="checkbox"
                                checked={selectedClaimIds.includes(s.id)}
                                onChange={() => toggleSelected(s.id)}
                                className="h-4 w-4 rounded border-[rgb(var(--border))] text-sky-600"
                              />
                              In Vorschlag uebernehmen
                            </label>
                          </div>
                        </div>
                      </StatementCard>
                    );
                  })}

                  {!totalStatements && !info && (
                    <p className="text-sm text-[rgb(var(--muted))]">
                      Noch keine Statements vorhanden. Sie erscheinen nur, wenn die Analyse erfolgreich war.
                    </p>
                  )}
                </div>
              </div>
            )}

            {viewLevel === 3 && (
              <div className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Moegliche Folgen</h3>
                      {impactAndResponsibility.impacts?.length ? (
                        <span className="text-[11px] text-[rgb(var(--muted))]">{impactAndResponsibility.impacts.length} Vorschlaege</span>
                      ) : null}
                    </div>
                    <ImpactSection
                      impacts={displayImpacts}
                      onChange={(next) => setImpactAndResponsibility((prev) => ({ ...prev, impacts: next }))}
                    />
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Wer waere zustaendig?</h3>
                      {impactAndResponsibility.responsibleActors?.length ? (
                        <span className="text-[11px] text-[rgb(var(--muted))]">
                          {impactAndResponsibility.responsibleActors.length} Vorschlaege
                        </span>
                      ) : null}
                    </div>
                    <ResponsibilitySection
                      actors={displayResponsibleActors}
                      onChange={(next) =>
                        setImpactAndResponsibility((prev) => ({ ...prev, responsibleActors: next }))
                      }
                    />
                  </div>
                </div>

                <ResponsibilityPreviewCard
                  responsibilities={responsibilities}
                  paths={responsibilityPaths}
                  showPathOverlay
                />
              </div>
            )}

            {viewLevel === 4 && (
              <div className="space-y-3">
                {hasNotes && (
                  <details
                    open={openPanels.notes}
                    onToggle={(event) => togglePanel("notes", (event.target as HTMLDetailsElement).open)}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">Kontext (Notizen)</summary>
                    <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
                      {notes.map((note, idx) => {
                        const key = note.id ?? `note-${idx}`;
                        const title = note.title
                          ? translateText(`note:${key}:title`, note.title)
                          : `Notiz ${idx + 1}`;
                        const body = translateText(`note:${key}:body`, note.body);
                        return (
                          <li key={key} className="rounded-xl bg-[rgb(var(--bg))] px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{title}</p>
                            <p className="text-sm text-[rgb(var(--fg))]">{body}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}

                {hasQuestions && (
                  <details
                    open={openPanels.questions}
                    onToggle={(event) => togglePanel("questions", (event.target as HTMLDetailsElement).open)}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">Fragen zum Weiterdenken</summary>
                    <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
                      {questions.map((q, idx) => {
                        const key = q.id ?? `q-${idx}`;
                        const label = q.label
                          ? translateText(`question:${key}:label`, q.label)
                          : `Frage ${idx + 1}`;
                        const body = translateText(`question:${key}:body`, q.body);
                        return (
                          <li key={key} className="rounded-xl bg-[rgb(var(--bg))] px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
                            <p className="text-sm text-[rgb(var(--fg))]">{body}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}

                {hasKnots && (
                  <details
                    open={openPanels.knots}
                    onToggle={(event) => togglePanel("knots", (event.target as HTMLDetailsElement).open)}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">Knoten (Themenschwerpunkte)</summary>
                    <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
                      {knots.map((k, idx) => {
                        const key = k.id ?? `k-${idx}`;
                        const title = k.title
                          ? translateText(`knot:${key}:title`, k.title)
                          : `Knoten ${idx + 1}`;
                        const body = translateText(`knot:${key}:body`, k.body);
                        return (
                          <li key={key} className="rounded-xl bg-[rgb(var(--bg))] px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{title}</p>
                            <p className="text-sm text-[rgb(var(--fg))]">{body}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}

                {hasEventualities && (
                  <details
                    open={openPanels.eventualities}
                    onToggle={(event) => togglePanel("eventualities", (event.target as HTMLDetailsElement).open)}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                      Eventualitaeten &amp; Entscheidungsbaeume
                    </summary>
                    <div className="mt-2 space-y-3 text-sm text-[rgb(var(--muted))]">
                      {eventualities.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Eventualitaeten</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {eventualities.map((e, idx) => {
                              const key = e.id ?? `ev-${idx}`;
                              const text = translateText(`eventuality:${key}:text`, e.narrative || e.label || "");
                              return <li key={key}>{text}</li>;
                            })}
                          </ul>
                        </div>
                      )}
                      {decisionTrees.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Decision Trees</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {decisionTrees.map((d, idx) => (
                              <li key={d.id ?? `dt-${idx}`}>Decision Tree fuer Statement {d.rootStatementId}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {hasConsequencesBlock && (
                  <details
                    open={openPanels.consequences}
                    onToggle={(event) => togglePanel("consequences", (event.target as HTMLDetailsElement).open)}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                      Folgen &amp; Zustaendigkeiten
                    </summary>
                    <div className="mt-3 space-y-3">
                      <ConsequencesPreviewCard consequences={consequences} responsibilities={responsibilities} />
                      <ResponsibilityPreviewCard
                        responsibilities={responsibilities}
                        paths={responsibilityPaths}
                        showPathOverlay
                      />
                    </div>
                  </details>
                )}

                {hasReport && (
                  <details
                    open={openPanels.report}
                    onToggle={(event) => togglePanel("report", (event.target as HTMLDetailsElement).open)}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">Bericht</summary>
                    <div className="mt-3 space-y-3 text-sm text-[rgb(var(--fg))]">
                      {report?.summary && <p>{translateText("report:summary", report.summary)}</p>}
                      {Array.isArray(report?.keyConflicts) && report.keyConflicts.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Konfliktlinien</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {report.keyConflicts.map((c: string, idx: number) => (
                              <li key={`${c}-${idx}`}>{translateText(`report:key:${idx}`, c)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {report?.facts && (
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Fakten (lokal)</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">
                              {(report.facts.local ?? []).map((f: string, idx: number) => (
                                <li key={`f-l-${idx}`}>{translateText(`report:fact:local:${idx}`, f)}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Fakten (international)</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">
                              {(report.facts.international ?? []).map((f: string, idx: number) => (
                                <li key={`f-i-${idx}`}>{translateText(`report:fact:intl:${idx}`, f)}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      {Array.isArray(report?.takeaways) && report.takeaways.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">Takeaways</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {report.takeaways.map((c: string, idx: number) => (
                              <li key={`t-${idx}`}>{translateText(`report:takeaway:${idx}`, c)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {editorialAudit && <EditorialAuditPanel audit={editorialAudit} />}
                {evidenceGraph && <EvidenceGraphPanel graph={evidenceGraph} />}
                {runReceipt && <RunReceiptPanel receipt={runReceipt} />}
              </div>
            )}
          </div>

          {createAnalyze && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    Create-Orchestrierung
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                    Intake, Qualitaet, Match und CTA-Routing
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-[rgb(var(--bg))] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    input: {createAnalyze.inputType}
                  </span>
                  <span className="rounded-full bg-[rgb(var(--bg))] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    match: {createAnalyze.matchStrength}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[rgb(var(--muted))]">{createAnalyze.normalizedInputSummary || "Keine Zusammenfassung verfuegbar."}</p>

              {createAnalyzeRoutingHint ? (
                <div
                  className={`rounded-xl border px-3 py-2 text-[11px] ${
                    createAnalyzeRoutingHint.tone === "warning"
                      ? "border-amber-300/60 bg-amber-50/80 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Routing-Hinweis</p>
                  <p className="mt-1">{createAnalyzeRoutingHint.message}</p>
                  {createAnalyzeRoutingHint.primaryCtaLabel ? (
                    <p className="mt-1">
                      Primaere Richtung:{" "}
                      <span className="font-semibold text-[rgb(var(--fg))]">
                        {createAnalyzeRoutingHint.primaryCtaLabel}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Qualitaet</p>
                  <p className="mt-1">Claims: {createAnalyze.claims.length}</p>
                  <p>Quellenbedarf: {createAnalyze.evidenceNeeds.length}</p>
                  <p>Unsicherheiten: {createAnalyze.uncertainties.length}</p>
                  <p>Languages: {createAnalyze.languages.join(", ") || "-"}</p>
                </div>
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Governance</p>
                  <p>requiresHumanReview: {createAnalyze.requiresHumanReview ? "true" : "false"}</p>
                  <p>noAutoPublish: {createAnalyze.noAutoPublish ? "true" : "false"}</p>
                  <p>noSilentMerge: {createAnalyze.noSilentMerge ? "true" : "false"}</p>
                  <p>confidence: {createAnalyze.confidence.toFixed(2)}</p>
                </div>
              </div>

              {createAnalyzeReasons.length > 0 && (
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Match-Gruende</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {createAnalyzeReasons.slice(0, 6).map((reason, idx) => (
                      <li key={`${reason}-${idx}`}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {createAnalyze.matches.length > 0 && (
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Graph-Matches</p>
                  <ul className="mt-1 space-y-1">
                    {createAnalyze.matches.map((match) => (
                      <li key={match.id} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1.5">
                        <p>
                          <span className="font-semibold text-[rgb(var(--fg))]">{match.label}</span>
                          <span> · {match.matchType} · {match.matchEntityType} · {match.strength}</span>
                        </p>
                        {match.reasons.length > 0 ? (
                          <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">{match.reasons[0]}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {createAnalyze.suggestedCtas.length > 0 && (
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">CTA-Routing</p>
                  <ul className="mt-1 space-y-1">
                    {createAnalyze.suggestedCtas.map((cta, idx) => (
                      <li key={cta.id} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1.5">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[rgb(var(--fg))]">{cta.label}</span>
                          <span className="text-[10px]">{cta.id}</span>
                          {idx === 0 ? (
                            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-1.5 py-0.5 text-[10px]">
                              priorisiert
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-[10px]">{cta.reason}</p>
                        <div className="mt-2">
                          <button
                            type="button"
                            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                            onClick={() => handleCreateCtaSelect(cta.id)}
                          >
                            Handoff vorbereiten
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingCtaHandoff && (
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">CTA Confirm-Step (manuell)</p>
                  <p className="mt-1">
                    CTA: <span className="font-semibold text-[rgb(var(--fg))]">{pendingCtaHandoff.ctaId}</span> · actionType:{" "}
                    <span className="font-semibold text-[rgb(var(--fg))]">{pendingCtaHandoff.actionType}</span>
                  </p>
                  {pendingCtaHandoff.entityType ? (
                    <p>
                      Zieltyp: <span className="font-semibold text-[rgb(var(--fg))]">{pendingCtaHandoff.entityType}</span>
                    </p>
                  ) : null}
                  {pendingCtaHandoff.entityId ? (
                    <p>
                      entityId: <span className="font-semibold text-[rgb(var(--fg))]">{pendingCtaHandoff.entityId}</span>
                    </p>
                  ) : null}
                  {pendingCtaHandoff.targetRef ? (
                    <p>
                      targetRef: <span className="font-semibold text-[rgb(var(--fg))]">{pendingCtaHandoff.targetRef}</span>
                    </p>
                  ) : null}
                  <p className="mt-1">{pendingCtaHandoff.summary}</p>

                  {pendingCtaHandoff.warning ? (
                    <p className="mt-1 rounded-md border border-amber-300/60 bg-amber-50/80 px-2 py-1 text-[10px] text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
                      {pendingCtaHandoff.warning}
                    </p>
                  ) : null}

                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {pendingCtaHandoff.guardrails.map((guardrail) => (
                      <li key={guardrail}>{guardrail}</li>
                    ))}
                  </ul>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1 text-[10px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                      onClick={handleCreateCtaConfirm}
                    >
                      Bestaetigen
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1 text-[10px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                      onClick={handleCreateCtaCancel}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {confirmedCtaHandoff && (
                <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/80 px-3 py-2 text-[11px] text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Bestaetigter CTA-Handoff</p>
                  <p className="mt-1">
                    {confirmedCtaHandoff.ctaId} bestaetigt. Vorbereitung abgeschlossen; keine implizite Mutation wurde ausgefuehrt.
                  </p>
                </div>
              )}

              {createAnalyze.matchSourceState === "degraded" && (
                <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Match-Quelle degradiert</p>
                  <p className="mt-1">
                    Produktive Match-Quellen waren nur eingeschraenkt verfuegbar. Kein Fake-Match; bitte manuell pruefen.
                  </p>
                  {createAnalyze.matchSourceErrors.length > 0 ? (
                    <p className="mt-1 text-[10px]">errors: {createAnalyze.matchSourceErrors.join(", ")}</p>
                  ) : null}
                </div>
              )}

              {createAnalyzePhases.length > 0 && (
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide">Phasen</p>
                  <ul className="mt-1 space-y-1">
                    {createAnalyzePhases.map((phase) => (
                      <li key={phase.key}>
                        <span className="font-semibold text-[rgb(var(--fg))]">{phase.key}</span>
                        <span> · {phase.value.status}</span>
                        <span> · {phase.value.summary}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {showOutputSection && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Weiterverarbeitung</p>
                  <h3 className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Orchestrierung &amp; Uebergang</h3>
                  <p className="text-[11px] text-[rgb(var(--muted))]">
                    Einordnung, Feedback und ein bearbeitbarer Entwurf fuer die Redaktion.
                  </p>
                </div>
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                    outputClassification.variant === "dossier"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30"
                      : outputClassification.variant === "statement"
                      ? "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/30"
                      : "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] ring-[rgb(var(--border))]",
                  ].join(" ")}
                >
                  {outputClassification.label}
                </span>
              </div>

              <p className="text-[11px] text-[rgb(var(--muted))]">{outputClassification.hint}</p>

              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Feedback an Verfasser</p>
                <p className="mt-1">{authorFeedback}</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    KI-Entwurf (bearbeitbar)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(articleDraft, "Entwurf")}
                      disabled={!articleDraft.trim()}
                      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] disabled:opacity-60"
                    >
                      Kopieren
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerateArticle}
                      disabled={!preparedText.trim()}
                      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] disabled:opacity-60"
                    >
                      Entwurf aktualisieren
                    </button>
                  </div>
                </div>

                {articleDraft.trim() ? (
                  <textarea
                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm leading-relaxed text-[rgb(var(--fg))] shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                    rows={10}
                    value={articleDraft}
                    onChange={(event) => {
                      setArticleDraft(event.target.value);
                      setArticleDraftEdited(true);
                    }}
                  />
                ) : (
                  <p className="text-[11px] text-[rgb(var(--muted))]">Starte die Analyse, um einen Entwurf zu erzeugen.</p>
                )}

                <p className="text-[11px] text-[rgb(var(--muted))]">
                  Der Entwurf ist der Ausgangspunkt fuer eine saubere redaktionelle Bearbeitung.
                </p>
              </div>
            </div>
          )}

          {showInsights && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Einordnung & naechste Schritte</p>
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Vorschlaege und Pruefplan basieren nur auf deinem Input.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTrace}
                    disabled={traceDisabled}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {traceButtonLabel}
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-full bg-[rgb(var(--bg))] p-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInsightTab("input")}
                      disabled={!allowTrace}
                      className={[
                        "rounded-full px-3 py-1 transition",
                        insightTab === "input" ? "bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
                        !allowTrace ? "cursor-not-allowed opacity-60" : "",
                      ].join(" ")}
                      aria-pressed={insightTab === "input"}
                    >
                      Aus Input
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsightTab("recherche")}
                      disabled={!allowResearch}
                      className={[
                        "rounded-full px-3 py-1 transition",
                        insightTab === "recherche" ? "bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
                        !allowResearch ? "cursor-not-allowed opacity-60" : "",
                      ].join(" ")}
                      aria-pressed={insightTab === "recherche"}
                    >
                      Recherche
                    </button>
                  </div>

                  {insightTab === "input" && statements.length === 0 ? (
                    <span className="text-[11px] text-[rgb(var(--muted))]">Fuer "Aus Input" erst Analyse starten.</span>
                  ) : null}
                </div>

                {guidanceError && <p className="mt-2 text-[11px] font-semibold text-rose-600">{guidanceError}</p>}

                {!hasGuidance && !guidanceError ? (
                  <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                    {insightTab === "input"
                      ? "Erzeuge Herkunftshinweise und einen Pruefplan auf Basis deiner Kernaussagen (Statements)."
                      : "Erzeuge einen Pruefplan / Recherche-Hinweise - ohne externe Fakten zu uebernehmen."}
                  </p>
                ) : null}

                {insightTab === "recherche" && !hasResearchRun ? (
                  <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                    Recherche zuerst ausfuehren – danach zeigen wir, ob Tiefenrecherche noch Mehrwert bringt.
                  </p>
                ) : null}

                {insightTab === "input" && guidance ? (
                  <div className="mt-3 space-y-3 text-[11px] text-[rgb(var(--muted))]">
                    {guidance.concern ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Anliegen</p>
                        <p className="mt-1 text-sm text-[rgb(var(--fg))]">{guidance.concern}</p>
                      </div>
                    ) : null}

                    {guidance.scopeHints?.levels?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Ebenen</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {guidance.scopeHints.levels.map((lvl) => (
                            <span key={lvl} className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] text-[rgb(var(--muted))]">
                              {lvl}
                            </span>
                          ))}
                        </div>
                        {guidance.scopeHints.why ? (
                          <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{guidance.scopeHints.why}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {guidance.istStandChecklist &&
                    (guidance.istStandChecklist.society?.length ||
                      guidance.istStandChecklist.media?.length ||
                      guidance.istStandChecklist.politics?.length) ? (
                      <div className="grid gap-3 md:grid-cols-3">
                        {([
                          { key: "society", label: "Gesellschaft" },
                          { key: "media", label: "Medien" },
                          { key: "politics", label: "Politik" },
                        ] as const).map(({ key, label }) => {
                          const items = guidance.istStandChecklist[key] ?? [];
                          if (!items.length) return null;
                          return (
                            <div key={key} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
                              <ul className="mt-1 space-y-1">
                                {items.map((item) => (
                                  <li key={item} className="text-[11px] text-[rgb(var(--muted))]">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {(guidance.proFrames?.length || guidance.contraFrames?.length) ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {guidance.proFrames?.length ? (
                          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Pro-Frames</p>
                            <ul className="mt-1 space-y-1">
                              {guidance.proFrames.map((frame, idx) => (
                                <li key={`${frame.frame}-${idx}`}>
                                  <span className="font-semibold text-[rgb(var(--muted))]">{frame.frame}</span>
                                  {frame.stakeholders?.length ? (
                                    <span className="text-[rgb(var(--muted))]"> · {frame.stakeholders.join(", ")}</span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {guidance.contraFrames?.length ? (
                          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Contra-Frames</p>
                            <ul className="mt-1 space-y-1">
                              {guidance.contraFrames.map((frame, idx) => (
                                <li key={`${frame.frame}-${idx}`}>
                                  <span className="font-semibold text-[rgb(var(--muted))]">{frame.frame}</span>
                                  {frame.stakeholders?.length ? (
                                    <span className="text-[rgb(var(--muted))]"> · {frame.stakeholders.join(", ")}</span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {guidance.alternatives?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Alternativen</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[rgb(var(--muted))]">
                          {guidance.alternatives.map((alt) => (
                            <li key={alt}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {guidance.searchQueries?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Suchbegriffe</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[rgb(var(--muted))]">
                          {guidance.searchQueries.map((query) => (
                            <li key={query}>{query}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {guidance.sourceTypes?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellentypen</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {guidance.sourceTypes.map((source) => (
                            <span key={source} className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] text-[rgb(var(--muted))]">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {insightTab === "recherche" && researchGuidance ? (
                  <div className="mt-3 space-y-3 text-[11px] text-[rgb(var(--muted))]">
                    {hasResearchSources ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-semibold text-[rgb(var(--muted))]">Darstellung:</span>
                          {(["serp", "cards"] as const).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setResearchView(v)}
                              className={`rounded-full px-2.5 py-1 text-[11px] ${
                                researchView === v
                                  ? "bg-slate-800 text-white"
                                  : "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                              }`}
                            >
                              {v === "serp" ? "SERP" : "Cards"}
                            </button>
                          ))}
                        </div>
                        <SerpResultsList
                          results={(researchGuidance.sources ?? []).map((label) => ({
                            url: "",
                            title: label,
                            siteName: "Pruefplan",
                            breadcrumb: "Quellenbereich",
                            snippet:
                              SOURCE_HINTS[label] ||
                              "Vorschlag fuer den Pruefplan: Pruefe Informationen in diesem Quellentyp.",
                          }))}
                          view={researchView}
                        />
                      </div>
                    ) : null}

                    {researchGuidance.focus?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Fokus</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {researchGuidance.focus.map((item) => (
                            <span key={item} className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] text-[rgb(var(--muted))]">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {researchGuidance.stakeholders?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Stakeholder</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[rgb(var(--muted))]">
                          {researchGuidance.stakeholders.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {researchGuidance.sources?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen-Typen</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[rgb(var(--muted))]">
                          {researchGuidance.sources.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {researchGuidance.queries?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Suchanfragen</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[rgb(var(--muted))]">
                          {researchGuidance.queries.map((q) => (
                            <li key={q}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {researchGuidance.feeds?.length || researchGuidance.risks?.length ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {researchGuidance.feeds?.length ? (
                          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Feeds</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[rgb(var(--muted))]">
                              {researchGuidance.feeds.map((f) => (
                                <li key={f}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {researchGuidance.risks?.length ? (
                          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Risiken</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[rgb(var(--muted))]">
                              {(researchGuidance.risks ?? []).map((r) => (
                                <li key={r}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {showDeepResearch ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-3 text-[11px] text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                      Tiefenrecherche (20 EUR)
                    </p>
                    <p className="mt-1">
                      Optional: startet ARI-Search + Faktencheck-Queue und unterstuetzt die Redaktion.
                    </p>
                    {deepResearchHints.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4">
                        {deepResearchHints.map((hint) => (
                          <li key={hint}>{hint}</li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleDeepResearch}
                      disabled={deepResearchBusy}
                      className="mt-3 rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
                    >
                      {deepResearchBusy ? "Startet..." : "Tiefenrecherche starten"}
                    </button>
                    {deepResearchInfo && (
                      <p className="mt-2 text-[11px] text-amber-900 dark:text-amber-100">{deepResearchInfo}</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Analyse starten</p>
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  Waehle deinen Bereich – die Analyse startet sofort mit dem passenden Ablauf.
                </p>
                {useCaseNote ? (
                  <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{useCaseNote}</p>
                ) : null}
              </div>
              <span className="rounded-full bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {useCaseLabel}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {useCaseOptions.map((item) => {
                const active = useCase === item.id;
                const allowed = isUseCaseAllowed(item.id);
                const lockLabel = lockLabelFor(item.id);
                const isDisabled = analyzeDisabled;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active && allowed}
                    aria-disabled={!allowed || isDisabled}
                    onClick={() => {
                      if (!allowed) {
                        setFlowInfo(lockLabel);
                        return;
                      }
                      if (isDisabled) return;
                      setUseCase(item.id);
                      void handleAnalyze();
                    }}
                    className={[
                      "group rounded-2xl border px-3 py-3 text-left transition shadow-sm",
                      active && allowed
                        ? "border-sky-200 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-emerald-500/10"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--card))]",
                      allowed ? "hover:border-sky-200 hover:shadow-md" : "cursor-not-allowed opacity-60",
                      isDisabled ? "opacity-70" : "",
                    ].join(" ")}
                    disabled={isDisabled}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                      <span className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                        {analyzeButtonLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{item.text}</p>
                    {!allowed ? (
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[rgb(var(--muted))]">
                        <span className="font-semibold uppercase tracking-wide">{lockLabel}</span>
                        <a href={useCaseCtaHref} className="font-semibold underline underline-offset-4">
                          {useCaseCtaLabel}
                        </a>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-[11px] font-semibold text-[rgb(var(--muted))]">
                Verfasser (optional)
                <input
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="z.B. Redaktion XY, Fachbereich, Name"
                />
                <span className="text-[11px] text-[rgb(var(--muted))]">
                  Wir zeigen den Verfasser bei der Abstimmung und im Dossier, wenn angegeben.
                </span>
              </label>

              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-[11px] text-[rgb(var(--muted))]">
                <p className="font-semibold text-[rgb(var(--fg))]">Abstimmung mit Verfasser</p>
                <label className="mt-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-[2px] h-4 w-4 rounded border-[rgb(var(--border))] text-sky-600 focus:ring-sky-500"
                    checked={confirmUnderstanding}
                    onChange={(event) => setConfirmUnderstanding(event.target.checked)}
                    disabled={statements.length === 0}
                  />
                  <span>
                    Ich bestaetige, dass die Kernaussagen korrekt verstanden wurden.
                    {statements.length === 0 ? " (Analyse zuerst starten)" : ""}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3 text-[11px] text-[rgb(var(--muted))]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Extraktion</p>
                <div className="mt-2 grid gap-1 text-[11px]">
                  <span>Kernaussagen: {statements.length}</span>
                  <span>Kontext: {contextCount}</span>
                  <span>Fragen: {questions.length}</span>
                  <span>Wirkung: {consequenceCount}</span>
                  <span>Zustaendigkeit: {responsibilityCount}</span>
                </div>
              </div>
            </div>

            {isJournalism && (
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                Text bleibt unveraendert. Claims werden abgeleitet, aber nicht umgeschrieben. Optionaler Faktencheck und
                QR/Dossier-Export nach Freigabe (kostenpflichtig).
              </div>
            )}
            {isAgenda && (
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
                Agenda-Upload ist im Pilot-Setup vorgesehen. Wir schlagen Umfragen vor und spielen wechselnde Fragen fuer
                Streams/Veranstaltungen aus.
              </div>
            )}
          </div>
        </div>
      </div>

      {totalStatements > 0 ? (
        <div ref={ctaRef} className="fixed bottom-3 left-0 right-0 z-30 px-3">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--card))] px-3 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)] ring-1 ring-[rgb(var(--border))]">
            <div className="min-w-[180px]">
              <p className="text-xs font-semibold text-[rgb(var(--fg))]">
                {selectedClaimIds.length} von {totalStatements} ausgewählt
              </p>
              <p className="text-[11px] text-[rgb(var(--muted))]">Wähle, welche Statements eingereicht werden.</p>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={saveDraftSnapshot}
                disabled={isSaving || !preparedText.trim()}
                className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] disabled:opacity-60"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={!draftId || isFinalizing}
                className="rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-md hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Einreichen
              </button>
            </div>
          </div>
          {finalizeInfo && (
            <div className="mx-auto mt-2 max-w-3xl rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30">
              {finalizeInfo}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
