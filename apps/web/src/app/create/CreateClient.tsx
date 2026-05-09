"use client";

import * as React from "react";
import Link from "next/link";
import AnalyzeWorkspace, { type UseCaseAccess, type UseCaseId } from "@/components/analyze/AnalyzeWorkspace";
import type { AccountOverview } from "@features/account/types";
import { getAccessTierConfigForUser, getUserAccessTier } from "@core/access/accessTiers";
import type { CreateEntitlements } from "@/lib/server/entitlements/createEntitlements";
import type { CreateMode } from "@/features/create/intents";
import { formatRelevanceScopeLabel } from "@/features/relevanceFraming";
import { useLocale } from "@/context/LocaleContext";
import {
  hasCreateIntakeContext,
  type CreateIntakeContext,
} from "@/features/create/intakeContext";
import {
  resolveCreateOrchestratorIntentContract,
  type CreateEntryIntent,
  type CreateEntryMode,
} from "@/features/create/orchestratorIntentContract";
import {
  CREATE_PRODUCT_MODE_VALUES,
  type CreateProductMode,
} from "@/features/create/createProductModes";
import type { CreateIntent as CreateContextIntent } from "@/features/create/intents";
import {
  mapCreateIntentToProductMode,
  mapProductModeToCreateIntent,
  resolveInitialCreateIntent,
  type CreateIntent,
} from "@/features/create/intentFlows";
import {
  buildFinalizeFallbackPath,
  normalizeInternalRedirectPath,
} from "@/features/create/finalizeRedirect";
import {
  getCreateComposerTexts,
  getCreateContextAnchorDefinitions,
  type CreateSurfaceTexts,
  type CreateContextAnchorDefinition,
  getCreateHelperLinks,
  getCreateSurfaceModeDefinitions,
  getCreateSurfaceTexts,
  resolveCreateSurfaceLocale,
  resolveCreateContextAnchorById,
  resolveCreateModeDefinition,
} from "@/features/create/createSurfaceConfig";
import {
  formatOperatorNumber,
  getOperatorCreateTexts,
  resolveOperatorLocale,
  type OperatorCreateTexts,
} from "@/features/i18n/operatorSystemTexts";
import SharedCreateComposer from "@/features/create/SharedCreateComposer";
import {
  type CreateIntelligentFollowupResult,
} from "@/features/create/intelligentFollowupContract";
import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";
import CreateLinkIntakeClarification from "@/features/create/CreateLinkIntakeClarification";
import {
  buildCreateLinkIntakeMeta,
  buildCreateLinkSourceNotice,
  detectCreateLinkIntake,
  type CreateLinkIntentOptionId,
  type CreateLinkIntakeDetection,
} from "@/features/create/linkIntake";

export type CreateClientProps = {
  initialEntitlements: CreateEntitlements;
  overview: AccountOverview;
  dossierId?: string | null;
  initialAnlassraumId?: string | null;
  initialMode?: CreateMode;
  initialIntentParam?: string | null;
  initialModeParam?: string | null;
  initialEntryIntent?: CreateEntryIntent;
  initialEntryMode?: CreateEntryMode;
  initialText?: string | null;
  initialIntakeContext?: CreateIntakeContext | null;
  initialReturnTo?: string | null;
};

export const CREATE_PRODUCT_MODES = CREATE_PRODUCT_MODE_VALUES;

const MIN_INTENT_INPUT_LENGTH = 24;

type CreateWorkingState = {
  summary: string;
  recognizedType: string;
  suggestedAssignment: string;
};

export const CREATE_INTELLIGENT_FOLLOWUP_SECTION_LABELS = {
  understanding: "eDebatte hat deinen Beitrag strukturiert",
  extracted: "So hängt dein Beitrag zusammen",
  connections: "Passende nächste Schritte",
  voteNotice: "Deine Stimme wird nicht automatisch abgegeben.",
} as const;

export function shouldRenderCreateIntelligentFollowup(params: {
  hasStarted: boolean;
  productMode: CreateProductMode;
  followup: CreateIntelligentFollowupResult | null;
}): boolean {
  if (!params.hasStarted) return false;
  if (params.productMode !== "analyze") return false;
  return Boolean(params.followup);
}

export function shouldShowCreateFollowupQuestionCard(params: {
  showPostInputModules: boolean;
  productMode: CreateProductMode;
}): boolean {
  if (!params.showPostInputModules) return false;
  return params.productMode !== "analyze";
}

export function resolveCreatePostStartSectionOrder(params: {
  showIntelligentFollowup: boolean;
  showPostInputModules: boolean;
  showFollowupQuestionCard: boolean;
  pickerEnabled: boolean;
}): string[] {
  const sections: string[] = [];
  if (params.showIntelligentFollowup) sections.push("intelligent-followup");
  if (params.showPostInputModules && !params.showIntelligentFollowup) sections.push("post-start-meta");
  if (params.showFollowupQuestionCard) sections.push("followup-question");
  if (params.showPostInputModules && params.pickerEnabled) sections.push("context-picker");
  if (params.showPostInputModules) sections.push("quotas");
  return sections;
}

type CreateProductModeConfig = ReturnType<typeof resolveCreateModeDefinition> & {
  preferredUseCase: UseCaseId;
  preferredCreateMode?: CreateMode;
};

const CREATE_PRODUCT_MODE_INTERNAL_CONFIG: Record<
  CreateProductMode,
  Pick<CreateProductModeConfig, "preferredUseCase" | "preferredCreateMode">
> = {
  analyze: {
    preferredUseCase: "civic",
    preferredCreateMode: "source",
  },
  media: {
    preferredUseCase: "journalism",
    preferredCreateMode: "source",
  },
  guided: {
    preferredUseCase: "agenda",
    preferredCreateMode: "ai",
  },
};

type CreateContextPickerItem = {
  anlassraumId: string;
  title: string;
  summary: string;
  topicKey: string | null;
  anlassraumType: string | null;
  anlassraumStatus: string | null;
  sourceMode: string | null;
  outputStatus: string;
  updatedAt: string | null;
};

type ContextLoadState = "idle" | "loading" | "ready" | "error";

type GateState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "allowed"; entitlements: CreateEntitlements }
  | { status: "blocked"; entitlements: CreateEntitlements };

type CreatePrimaryIntakeSnapshot = {
  intakeText: string;
  hasStarted: boolean;
  updatedAt: string;
};

type CreateFollowupSurface = "none" | "lightweight" | "analysis";
export type { CreateFollowupSurface };

type CreateSaveState = "idle" | "saving" | "saved" | "error" | "unavailable";

type CreateLinkClarificationState = {
  detection: CreateLinkIntakeDetection;
  selectedIntentId: CreateLinkIntentOptionId | null;
  additionalContext: string;
};

export type CreateLightweightFollowupSnapshot = {
  originalText: string;
  understandingLine: string;
};

export function buildCreateLightweightFollowupSnapshot(params: {
  intakeText: string;
  modeLabel: string;
  contextAnchorLabel?: string | null;
  surfaceTexts: Pick<CreateSurfaceTexts, "followupUnderstandingLine">;
}): CreateLightweightFollowupSnapshot {
  const originalText = params.intakeText.trim();
  const understandingLabel = String(params.contextAnchorLabel ?? "").trim() || params.modeLabel;
  return {
    originalText,
    understandingLine: params.surfaceTexts.followupUnderstandingLine(understandingLabel),
  };
}

function CreateSubmittedContributionBubble(props: { text: string }) {
  return (
    <div className="create-chat-message flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400 ring-4 ring-white dark:bg-slate-500 dark:ring-[rgb(var(--bg))]" />
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-[rgb(var(--muted))]">Du</p>
        <div className="mt-2 rounded-2xl rounded-tl-sm border border-slate-200/90 bg-[color-mix(in_oklab,white_76%,rgb(var(--card))_24%)] px-4 py-3 shadow-sm shadow-slate-950/5 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="whitespace-pre-wrap text-sm text-slate-900 md:text-base dark:text-[rgb(var(--fg))]">
            {props.text}
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateAssistantStatusBubble(props: {
  eyebrow: string;
  title: string;
  body: string;
  notice?: string | null;
}) {
  return (
    <div className="create-chat-message flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-600 ring-4 ring-white dark:bg-cyan-300 dark:ring-[rgb(var(--bg))]" />
      <div className="max-w-5xl flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-[rgb(var(--muted))]">eDebatte</p>
        <div className="mt-2 rounded-2xl rounded-tl-sm border border-cyan-500/25 bg-[linear-gradient(180deg,rgba(241,247,251,0.98),rgba(230,240,247,0.95))] px-4 py-4 shadow-[0_18px_42px_rgba(2,6,23,0.06)] md:px-5 md:py-5 dark:border-cyan-300/30 dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 dark:text-cyan-200">{props.eyebrow}</p>
          <p className="mt-1 text-base font-semibold text-cyan-950 md:text-lg dark:text-cyan-50">{props.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-cyan-900 dark:text-cyan-100 md:text-base">{props.body}</p>
          {props.notice ? (
            <p className="mt-3 rounded-xl border border-cyan-300/35 bg-[color-mix(in_oklab,rgba(207,242,255,0.72)_78%,rgb(var(--card))_22%)] px-3 py-2 text-sm text-cyan-950 dark:text-cyan-50">
              {props.notice}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const CREATE_PRIMARY_INTAKE_STORAGE_KEY_PREFIX = "vog_create_primary_intake_v1";

export function buildCreatePrimaryIntakeStorageKey(userId?: string | null): string {
  const normalizedUserId = String(userId ?? "").trim() || "anon";
  return `${CREATE_PRIMARY_INTAKE_STORAGE_KEY_PREFIX}:${normalizedUserId}`;
}

export function parseCreatePrimaryIntakeSnapshot(raw: string | null): CreatePrimaryIntakeSnapshot | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CreatePrimaryIntakeSnapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    const intakeText = typeof parsed.intakeText === "string" ? parsed.intakeText : "";
    const hasStarted = parsed.hasStarted === true;
    if (!hasPrimaryIntakeText(intakeText) && !hasStarted) return null;
    return {
      intakeText,
      hasStarted,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function deriveUseCaseAccessForProductMode(
  productMode: CreateProductMode,
  text: OperatorCreateTexts,
  modeConfig: { description: string },
): UseCaseAccess {
  const preferredUseCase = resolveCreateProductModeConfig(productMode).preferredUseCase;
  const modeNote = modeConfig.description;

  return {
    allowed: [preferredUseCase],
    note: modeNote,
    lockLabels: {
      civic: text.lockLabelCivic,
      journalism: text.lockLabelJournalism,
      agenda: text.lockLabelAgenda,
    },
    ctaHref: "/pricing",
    ctaLabel: text.upgradeLabel,
  };
}

function deriveGate(entitlements: CreateEntitlements): GateState {
  if (!entitlements.isAuthenticated) return { status: "anon" };
  if (!entitlements.canSubmitStatement && !entitlements.canSubmitContribution) {
    return { status: "blocked", entitlements };
  }
  return { status: "allowed", entitlements };
}

function normalizeAnlassraumId(value?: string | null): string | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (!/^[a-f0-9]{24}$/.test(normalized)) return null;
  return normalized;
}

export function hasPrimaryIntakeText(value?: string | null): boolean {
  return Boolean(String(value ?? "").trim());
}

export function shouldShowCreatePostInputModules(params: {
  hasStarted: boolean;
  intakeText: string;
}): boolean {
  if (!params.hasStarted) return false;
  return hasPrimaryIntakeText(params.intakeText);
}

export function getCreateContextAnchorsForMode(params: {
  anchors: readonly CreateContextAnchorDefinition[];
  mode: CreateProductMode;
  maxItems?: number;
}): readonly CreateContextAnchorDefinition[] {
  const maxItems = Math.max(1, params.maxItems ?? 3);
  const modeAnchors = params.anchors.filter((anchor) => anchor.mode === params.mode);
  if (modeAnchors.length > 0) {
    return modeAnchors.slice(0, maxItems);
  }
  return params.anchors.slice(0, maxItems);
}

export function buildGuidedWorkspaceText(params: {
  intakeText: string;
  guidedBridgeAnswer: string;
  guidedWorkspacePrefix?: string;
}): string {
  const intake = params.intakeText.trim();
  const guidedAnswer = params.guidedBridgeAnswer.trim();
  const prefix = params.guidedWorkspacePrefix?.trim() || "Geführter Fokus";
  if (!guidedAnswer) return intake;
  if (!intake) return guidedAnswer;
  return `${intake}\n\n${prefix}:\n${guidedAnswer}`;
}

export function shouldRenderCreateAnalyzeWorkspace(params: {
  followupActivated: boolean;
  hasStarted: boolean;
  intakeText: string;
  productMode: CreateProductMode;
  guidedBridgeConfirmed: boolean;
}): boolean {
  if (!params.followupActivated) return false;
  const postInputReady = shouldShowCreatePostInputModules({
    hasStarted: params.hasStarted,
    intakeText: params.intakeText,
  });
  if (!postInputReady) return false;
  if (params.productMode !== "guided") return true;
  return params.guidedBridgeConfirmed;
}

export function resolveFollowupSurfaceOnStart(productMode: CreateProductMode): CreateFollowupSurface {
  if (productMode === "media") return "analysis";
  if (productMode === "analyze") return "lightweight";
  return "none";
}

export function resolveInitialCreateProductMode(params: {
  initialIntentParam?: string | null;
  initialModeParam?: string | null;
  initialEntryIntent?: CreateEntryIntent;
  initialEntryMode?: CreateEntryMode;
  initialMode?: CreateMode;
}): CreateProductMode {
  return mapCreateIntentToProductMode(
    resolveInitialCreateIntent({
      rawIntentParam: params.initialIntentParam,
      rawModeParam: params.initialModeParam,
      initialEntryIntent: params.initialEntryIntent,
      initialEntryMode: params.initialEntryMode,
      initialMode: params.initialMode,
    }),
  );
}

function summarizeWorkingText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= 220) return normalized;
  return `${normalized.slice(0, 217).trim()}...`;
}

function detectRecognizedType(intent: CreateIntent, value: string): string {
  const text = value.toLowerCase();
  if (intent === "contribute") {
    if (/https?:\/\/|www\./i.test(text) || /quelle|link|dokument|bericht/i.test(text)) return "Quelle";
    if (/frage|warum|wie|wo|wer|wann|\?/i.test(text)) return "Frage";
    if (/vorschlag|option|lösung|loesung/i.test(text)) return "Vorschlag";
    if (/erfahrung|erlebt|beobachtung|wahrnehmung/i.test(text)) return "Erfahrung";
    return "Hinweis";
  }
  if (intent === "check") {
    if (/https?:\/\/|www\./i.test(text)) return "Quelle";
    if (/entscheidung|beschluss|abstimmung/i.test(text)) return "Entscheidung";
    if (/forderung|these|behauptung|aussage/i.test(text)) return "Behauptung";
    return "Aussage";
  }
  if (/fragenkatalog|fragebogen|leitfrage/i.test(text)) return "Fragenkatalog";
  if (/beteiligungsrunde|workshop|beteiligung/i.test(text)) return "Beteiligungsansatz";
  if (/antrag|vorschlag|vorlage/i.test(text)) return "Vorschlag";
  return "Dossier-Entwurf";
}

export function resolveCreateProductModeConfig(
  mode: CreateProductMode,
  locale: string = "de",
): CreateProductModeConfig {
  const surfaceConfig = resolveCreateModeDefinition(mode, resolveCreateSurfaceLocale(locale));
  const internalConfig = CREATE_PRODUCT_MODE_INTERNAL_CONFIG[mode];
  return {
    ...surfaceConfig,
    ...internalConfig,
  };
}

function renderRundenContextLabel(context?: CreateIntakeContext | null): string | null {
  if (!context) return null;
  const primaryLabel =
    String(context.signalTitle ?? "").trim() ||
    String(context.sourceLabel ?? "").trim() ||
    String(context.clusterHint ?? "").trim();
  if (!primaryLabel) return null;
  return primaryLabel;
}

function isRundenSourceContext(context?: CreateIntakeContext | null): boolean {
  const source = String(context?.source ?? "").trim().toLowerCase();
  const reason = String(context?.reason ?? "").trim().toLowerCase();
  return source === "runden" || reason.startsWith("round_");
}

function buildRundenReturnHref(anlassraumId?: string | null): string {
  const params = new URLSearchParams();
  params.set("view", "active");
  const normalizedAnlassraumId = normalizeAnlassraumId(anlassraumId);
  if (normalizedAnlassraumId) {
    params.set("anlassraumId", normalizedAnlassraumId);
  }
  return `/runden?${params.toString()}`;
}

export default function CreateClient({
  initialEntitlements,
  overview,
  dossierId,
  initialAnlassraumId,
  initialMode,
  initialIntentParam,
  initialModeParam,
  initialEntryIntent,
  initialEntryMode,
  initialText,
  initialIntakeContext,
  initialReturnTo,
}: CreateClientProps) {
  const { locale } = useLocale();
  const surfaceLocale = resolveCreateSurfaceLocale(locale);
  const surfaceTexts = React.useMemo(() => getCreateSurfaceTexts(surfaceLocale), [surfaceLocale]);
  const surfaceComposerTexts = React.useMemo(
    () => getCreateComposerTexts(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceModeDefinitions = React.useMemo(
    () => getCreateSurfaceModeDefinitions(surfaceLocale),
    [surfaceLocale],
  );
  const allSurfaceContextAnchors = React.useMemo(
    () => getCreateContextAnchorDefinitions(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceHelperLinks = React.useMemo(() => getCreateHelperLinks(surfaceLocale), [surfaceLocale]);
  const operatorLocale = resolveOperatorLocale(locale);
  const text = getOperatorCreateTexts(operatorLocale);

  const [entitlements, setEntitlements] = React.useState<CreateEntitlements>(initialEntitlements);
  const [gate, setGate] = React.useState<GateState>(() => deriveGate(initialEntitlements));
  const [productMode, setProductMode] = React.useState<CreateProductMode>(() =>
    resolveInitialCreateProductMode({
      initialIntentParam,
      initialModeParam,
      initialEntryIntent,
      initialEntryMode,
      initialMode,
    }),
  );

  const [contextItems, setContextItems] = React.useState<CreateContextPickerItem[]>([]);
  const [contextLoadState, setContextLoadState] = React.useState<ContextLoadState>("idle");
  const [contextLoadError, setContextLoadError] = React.useState<string | null>(null);
  const [selectedAnlassraumId, setSelectedAnlassraumId] = React.useState<string | null>(() =>
    normalizeAnlassraumId(initialAnlassraumId),
  );
  const [selectionInfo, setSelectionInfo] = React.useState<string | null>(() => {
    if (!initialAnlassraumId) return null;
    if (normalizeAnlassraumId(initialAnlassraumId)) return null;
    return text.selectionInfoInvalidContext;
  });
  const intakeStorageKey = React.useMemo(
    () => buildCreatePrimaryIntakeStorageKey(overview.userId),
    [overview.userId],
  );
  const intakeRestoreInfoText =
    surfaceLocale === "en"
      ? "Your draft was restored from local browser storage."
      : "Dein Entwurf wurde aus der lokalen Browser-Sicherung wiederhergestellt.";
  const contextLoadedRef = React.useRef(false);
  const intakeHydratedRef = React.useRef(false);
  const [intakeText, setIntakeText] = React.useState(initialText ?? "");
  const [activeContextAnchorId, setActiveContextAnchorId] = React.useState<CreateContextIntent | null>(null);
  const [hasStarted, setHasStarted] = React.useState<boolean>(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [linkClarificationState, setLinkClarificationState] =
    React.useState<CreateLinkClarificationState | null>(null);
  const [followupSurface, setFollowupSurface] = React.useState<CreateFollowupSurface>("none");
  const [followupSnapshot, setFollowupSnapshot] =
    React.useState<CreateLightweightFollowupSnapshot | null>(null);
  const [intelligentFollowup, setIntelligentFollowup] =
    React.useState<CreateIntelligentFollowupResult | null>(null);
  const [analysisAutoRunToken, setAnalysisAutoRunToken] = React.useState<number>(0);
  const [intakeError, setIntakeError] = React.useState<string | null>(null);
  const [intakeRestoreInfo, setIntakeRestoreInfo] = React.useState<string | null>(null);
  const [guidedBridgeAnswer] = React.useState("");
  const [guidedBridgeConfirmed, setGuidedBridgeConfirmed] = React.useState(false);
  const [workingState, setWorkingState] = React.useState<CreateWorkingState | null>(null);
  const [followupAnswers, setFollowupAnswers] = React.useState<Record<CreateIntent, string>>({
    contribute: "",
    check: "",
    draft: "",
  });
  const [followupAnswerSaved, setFollowupAnswerSaved] = React.useState<Record<CreateIntent, boolean>>({
    contribute: false,
    check: false,
    draft: false,
  });
  const [understandingConfirmed, setUnderstandingConfirmed] = React.useState<boolean>(false);
  const [savedDraftId, setSavedDraftId] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<CreateSaveState>("idle");
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [factcheckMessage, setFactcheckMessage] = React.useState<string | null>(null);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [chatContinuationText, setChatContinuationText] = React.useState("");
  const intelligentFollowupResultRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (intakeHydratedRef.current) return;
    intakeHydratedRef.current = true;
    try {
      const snapshot = parseCreatePrimaryIntakeSnapshot(window.localStorage.getItem(intakeStorageKey));
      if (!snapshot) return;

      const hasServerPrefill = hasPrimaryIntakeText(initialText);
      if (hasServerPrefill) return;

      if (hasPrimaryIntakeText(snapshot.intakeText)) {
        setIntakeText(snapshot.intakeText);
        setIntakeRestoreInfo(intakeRestoreInfoText);
      }
      // Do not auto-open follow-up surfaces from local restore.
      // We restore text only; activation stays explicit via CTA.
    } catch {
      // ignore local restore issues
    }
  }, [initialText, intakeRestoreInfoText, intakeStorageKey]);

  React.useEffect(() => {
    try {
      if (!hasPrimaryIntakeText(intakeText) && !hasStarted) {
        window.localStorage.removeItem(intakeStorageKey);
        return;
      }

      const snapshot: CreatePrimaryIntakeSnapshot = {
        intakeText,
        hasStarted,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(intakeStorageKey, JSON.stringify(snapshot));
    } catch {
      // ignore local draft persistence errors
    }
  }, [hasStarted, intakeStorageKey, intakeText]);

  React.useEffect(() => {
    let ignore = false;
    async function refresh() {
      try {
        const res = await fetch("/api/create/entitlements", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.entitlements) return;
        if (ignore) return;
        const next = body.entitlements as CreateEntitlements;
        setEntitlements(next);
        setGate(deriveGate(next));
      } catch {
        // ignore
      }
    }
    refresh();
    return () => {
      ignore = true;
    };
  }, []);

  const productModeConfig = React.useMemo(
    () => resolveCreateProductModeConfig(productMode, surfaceLocale),
    [productMode, surfaceLocale],
  );
  const activeIntent = React.useMemo(() => mapProductModeToCreateIntent(productMode), [productMode]);
  const surfaceContextAnchors = React.useMemo(
    () =>
      getCreateContextAnchorsForMode({
        anchors: allSurfaceContextAnchors,
        mode: productMode,
        maxItems: 3,
      }),
    [allSurfaceContextAnchors, productMode],
  );
  const activeContextAnchor = React.useMemo(
    () => resolveCreateContextAnchorById(activeContextAnchorId, surfaceLocale),
    [activeContextAnchorId, surfaceLocale],
  );
  const intakeHelperText = activeContextAnchor?.helperText ?? productModeConfig.helperText;
  const intakePlaceholder = activeContextAnchor?.placeholder ?? productModeConfig.placeholder;
  const activeFollowupAnswer = followupAnswers[activeIntent];
  const activeFollowupSaved = followupAnswerSaved[activeIntent];
  const currentLinkDetection = React.useMemo(() => detectCreateLinkIntake(intakeText), [intakeText]);

  const createOrchestration = React.useMemo(
    () =>
      resolveCreateOrchestratorIntentContract({
        rawEntryIntent: productModeConfig.entryIntent,
        rawEntryMode: productModeConfig.entryMode,
        canSubmitContribution: entitlements.canSubmitContribution,
        canSubmitStatement: entitlements.canSubmitStatement,
        dossierId,
        selectedAnlassraumId,
      }),
    [
      dossierId,
      entitlements.canSubmitContribution,
      entitlements.canSubmitStatement,
      productModeConfig.entryIntent,
      productModeConfig.entryMode,
      selectedAnlassraumId,
    ],
  );

  const canonicalIntent: "statement" | "contribution" = createOrchestration.workspaceMode;
  const canonicalCreateMode: CreateMode =
    productModeConfig.preferredCreateMode ??
    (productMode === "guided" && createOrchestration.workspaceMode === "contribution"
      ? "ai"
      : createOrchestration.createMode);
  const pickerEnabled = canonicalIntent === "contribution";

  const loadContextItems = React.useCallback(async () => {
    setContextLoadState("loading");
    setContextLoadError(null);
    try {
      const selected = selectedAnlassraumId ? `&selectedAnlassraumId=${encodeURIComponent(selectedAnlassraumId)}` : "";
      const res = await fetch(`/api/create/context?limit=40${selected}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "create_context_source_unavailable");
      }
      const nextItems = Array.isArray(body.items) ? (body.items as CreateContextPickerItem[]) : [];
      setContextItems(nextItems);
      setContextLoadState("ready");
      contextLoadedRef.current = true;

      if (selectedAnlassraumId) {
        const found = nextItems.some((item) => item.anlassraumId === selectedAnlassraumId);
        if (!found) {
          setSelectedAnlassraumId(null);
          setSelectionInfo(text.selectionInfoUnavailableContext);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "create_context_source_unavailable";
      setContextLoadState("error");
      setContextLoadError(message);
    }
  }, [selectedAnlassraumId, text.selectionInfoUnavailableContext]);

  React.useEffect(() => {
    if (!hasStarted) return;
    if (!pickerEnabled) return;
    if (contextLoadedRef.current) return;
    void loadContextItems();
  }, [hasStarted, pickerEnabled, loadContextItems]);

  React.useEffect(() => {
    if (!pickerEnabled && selectedAnlassraumId) {
      setSelectedAnlassraumId(null);
    }
  }, [pickerEnabled, selectedAnlassraumId]);

  React.useEffect(() => {
    if (!hasStarted) return;
    if (!intelligentFollowup) return;
    intelligentFollowupResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasStarted, intelligentFollowup]);

  const startCreateFlow = React.useCallback(async (rawText: string) => {
    if (isStarting) return;
    const normalizedText = rawText.trim();
    const linkDetection = detectCreateLinkIntake(normalizedText);
    if (!normalizedText) {
      setIntakeError(surfaceTexts.intakeMissingError);
      return;
    }
    if (normalizedText.length < MIN_INTENT_INPUT_LENGTH && !linkDetection.hasLink) {
      setIntakeError(productModeConfig.minimumInputHint);
      return;
    }
    try {
      const activeSelectedContext = selectedAnlassraumId
        ? contextItems.find((item) => item.anlassraumId === selectedAnlassraumId) ?? null
        : null;
      setIntakeRestoreInfo(null);
      setIntakeError(null);
      setSaveState("idle");
      setSaveMessage(null);
      setFactcheckMessage(null);

      if (linkDetection.hasLink && linkDetection.mostlyLinkOnly) {
        setLinkClarificationState((current) => ({
          detection: linkDetection,
          selectedIntentId: current?.selectedIntentId ?? null,
          additionalContext: current?.additionalContext ?? "",
        }));
        setFollowupSnapshot(null);
        setWorkingState(null);
        setIntelligentFollowup(null);
        setUnderstandingConfirmed(false);
        setActionNotice(null);
        setHasStarted(true);
        setFollowupSurface("none");
        setGuidedBridgeConfirmed(productMode !== "guided");
        return;
      }

      const snapshot = buildCreateLightweightFollowupSnapshot({
        intakeText: rawText,
        modeLabel: productModeConfig.label,
        contextAnchorLabel: activeContextAnchor?.label,
        surfaceTexts,
      });
      setIsStarting(true);
      setLinkClarificationState((current) =>
        current && linkDetection.hasLink
          ? {
              ...current,
              detection: linkDetection,
            }
          : linkDetection.hasLink
            ? null
            : null,
      );

      let nextIntelligentFollowup: CreateIntelligentFollowupResult | null = null;
      if (productMode === "analyze") {
        const response = await fetch("/api/create/intelligent-followup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: normalizedText,
            locale: surfaceLocale,
            anlassraumId: selectedAnlassraumId,
            dossierId: dossierId ?? null,
            intent: activeIntent,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.ok || !body?.result) {
          throw new Error("create_intelligent_followup_failed");
        }
        nextIntelligentFollowup = body.result as CreateIntelligentFollowupResult;
      }

      const recognizedType = detectRecognizedType(activeIntent, normalizedText);
      const suggestedAssignment = activeSelectedContext
        ? activeSelectedContext.title
        : initialIntakeContext?.sourceLabel
          ? initialIntakeContext.sourceLabel
          : productMode === "guided"
            ? "Neuer gemeinsamer Arbeitsstand"
            : productMode === "media"
              ? "Prüfweg noch offen"
              : "Thema oder nächster Schritt noch offen";

      setFollowupSnapshot(snapshot);
      setWorkingState(
        productMode === "analyze"
          ? null
          : {
              summary: summarizeWorkingText(normalizedText),
              recognizedType,
              suggestedAssignment,
            },
      );
      setIntelligentFollowup(nextIntelligentFollowup);
      setUnderstandingConfirmed(false);
      setActionNotice(
        linkDetection.hasLink
          ? buildCreateLinkSourceNotice({
              locale: surfaceLocale,
              selectedIntentId: linkClarificationState?.selectedIntentId,
            })
          : null,
      );
      setHasStarted(true);
      setGuidedBridgeConfirmed(productMode !== "guided");

      const nextFollowupSurface =
        productMode === "analyze" ? "none" : resolveFollowupSurfaceOnStart(productMode);
      setFollowupSurface(nextFollowupSurface);
      if (nextFollowupSurface === "analysis") {
        setAnalysisAutoRunToken((current) => current + 1);
      }
      setIsStarting(false);
    } catch {
      setIsStarting(false);
      if (productMode === "analyze") {
        setIntakeError("Die Systemprüfung ist gerade nicht verfügbar. Dein Text bleibt erhalten.");
      } else {
        setIntakeError(surfaceTexts.startFailedError);
      }
    }
  }, [
    activeContextAnchor?.label,
    activeIntent,
    dossierId,
    initialIntakeContext?.sourceLabel,
    isStarting,
    productMode,
    productModeConfig.label,
    productModeConfig.minimumInputHint,
    contextItems,
    selectedAnlassraumId,
    surfaceLocale,
    surfaceTexts,
    linkClarificationState?.selectedIntentId,
  ]);

  const handleStart = React.useCallback(async () => {
    await startCreateFlow(intakeText);
  }, [intakeText, startCreateFlow]);

  const handleSaveFollowupAnswer = React.useCallback(() => {
    const normalized = activeFollowupAnswer.trim();
    if (!normalized) {
      setActionNotice(productModeConfig.firstQuestionPlaceholder);
      return;
    }
    setFollowupAnswerSaved((current) => ({
      ...current,
      [activeIntent]: true,
    }));
    setActionNotice(surfaceTexts.followupQuestionSavedLabel);
  }, [activeFollowupAnswer, activeIntent, productModeConfig.firstQuestionPlaceholder, surfaceTexts.followupQuestionSavedLabel]);

  const triggerActionNotice = React.useCallback(
    (message?: string) => {
      setActionNotice(message ?? surfaceTexts.actionNotAvailableLabel);
    },
    [surfaceTexts.actionNotAvailableLabel],
  );

  const handleStartFactcheckService = React.useCallback(() => {
    setFollowupSurface("analysis");
    setAnalysisAutoRunToken((current) => current + 1);
    setFactcheckMessage("Prüfmodus geöffnet. Faktencheck / Deep Search startet erst nach deiner weiteren Bestätigung. Keine automatische Kostenbuchung.");
    setActionNotice("Prüfmodus geöffnet. Faktencheck / Deep Search startet erst nach deiner weiteren Bestätigung.");
  }, []);

  const handleContinueConversation = React.useCallback(async () => {
    const normalizedContinuation = chatContinuationText.trim();
    if (!normalizedContinuation) {
      setActionNotice("Schreib kurz, was ich anpassen oder ergänzen soll.");
      return;
    }

    const baseText = intakeText.trim();
    const combinedText = baseText ? `${baseText}\n\n${normalizedContinuation}` : normalizedContinuation;
    setChatContinuationText("");
    setIntakeText(combinedText);
    setUnderstandingConfirmed(false);
    await startCreateFlow(combinedText);
  }, [chatContinuationText, intakeText, startCreateFlow]);

  const handleIntentAction = React.useCallback(
    (actionIndex: number) => {
      if (activeIntent === "contribute") {
        if (actionIndex === 0) {
          triggerActionNotice("Hinweis vorgemerkt. Du kannst jetzt den nächsten Schritt wählen oder einfach weiterschreiben.");
          return;
        }
        if (actionIndex === 1) {
          setProductMode("media");
          setFollowupSurface("analysis");
          setAnalysisAutoRunToken((current) => current + 1);
          triggerActionNotice("Prüfweg wird geöffnet.");
          return;
        }
        if (actionIndex === 2) {
          setProductMode("media");
          setActiveContextAnchorId("source");
          triggerActionNotice("Quellenhinweis ergänzen aktiviert. Ergänze jetzt die Referenz im Textfeld.");
          return;
        }
        triggerActionNotice("Beteiligung vorbereiten: als nächstes in Swipes weiterführen.");
        return;
      }

      if (activeIntent === "check") {
        if (actionIndex === 0) {
          setFollowupSurface("analysis");
          setAnalysisAutoRunToken((current) => current + 1);
          triggerActionNotice("Dossier-Weiterführung wird als Prüfstand vorbereitet.");
          return;
        }
        if (actionIndex === 1) {
          setActiveContextAnchorId("source");
          triggerActionNotice("Quellenhinweis ergänzen aktiviert. Ergänze jetzt die Referenzen im Textfeld.");
          return;
        }
        if (actionIndex === 2) {
          setProductMode("analyze");
          setActiveContextAnchorId("objection");
          triggerActionNotice("Gegenposition ergänzen aktiviert.");
          return;
        }
        setFollowupSurface("analysis");
        setAnalysisAutoRunToken((current) => current + 1);
        triggerActionNotice("Prüfbericht wird vorbereitet.");
        return;
      }

      if (actionIndex === 0) {
        triggerActionNotice("Beitrag oder Themenstruktur kann im nächsten Schritt übernommen werden.");
        return;
      }
      if (actionIndex === 1) {
        setActiveContextAnchorId("question");
        triggerActionNotice("Fragenkatalog vorbereitet.");
        return;
      }
      if (actionIndex === 2) {
        triggerActionNotice("Beteiligungsrunde vorbereiten: als nächstes in /runden weiterführen.");
        return;
      }
      triggerActionNotice("Der nächste Arbeitsschritt ist markiert.");
    },
    [activeIntent, triggerActionNotice],
  );

  const maxClaimsCap =
    canonicalIntent === "statement"
      ? Math.min(entitlements.maxVisibleAiProposals, 3)
      : Math.min(entitlements.maxVisibleAiProposals, 8);

  const maxFinalizeClaims =
    canonicalIntent === "statement"
      ? 1
      : Math.min(entitlements.maxFinalizeClaimsPerInput, 4);

  const selectedContext = selectedAnlassraumId
    ? contextItems.find((item) => item.anlassraumId === selectedAnlassraumId) ?? null
    : null;
  const effectiveSelectedAnlassraumId = canonicalIntent === "statement" ? null : selectedAnlassraumId;
  const normalizedReturnTo = normalizeInternalRedirectPath(initialReturnTo);
  const fromRundenFlow =
    isRundenSourceContext(initialIntakeContext) || Boolean(normalizedReturnTo?.startsWith("/runden"));
  const contextualReturnHref =
    normalizedReturnTo ??
    (fromRundenFlow
      ? buildRundenReturnHref(effectiveSelectedAnlassraumId ?? initialAnlassraumId)
      : null);
  const afterFinalizeNavigateTo = buildFinalizeFallbackPath({
    dossierId,
    preferredSurface: fromRundenFlow ? "runden" : "swipes",
    anlassraumId: effectiveSelectedAnlassraumId ?? initialAnlassraumId ?? null,
    fallbackReturnTo: contextualReturnHref,
  });
  const useCaseAccess = deriveUseCaseAccessForProductMode(productMode, text, productModeConfig);
  const workspaceVerificationLevel =
    overview.verificationLevel && overview.verificationLevel !== "none"
      ? overview.verificationLevel
      : undefined;

  const tierCfg = getAccessTierConfigForUser(overview);
  const tierLabel = getUserAccessTier(overview);
  const monthlyLimit = tierCfg.monthlyContributionLimit;
  const credits = entitlements.contributionCredits;

  const hasLegacyModeParam = Boolean(initialMode);
  const showIntakeContext = hasCreateIntakeContext(initialIntakeContext);
  const readableRundenContextLabel = renderRundenContextLabel(initialIntakeContext);
  const showPostInputModules = shouldShowCreatePostInputModules({
    hasStarted,
    intakeText,
  });
  const showLinkClarification =
    Boolean(linkClarificationState?.detection.hasLink) &&
    Boolean(linkClarificationState?.detection.mostlyLinkOnly);
  const showIntelligentFollowup = shouldRenderCreateIntelligentFollowup({
    hasStarted,
    productMode,
    followup: intelligentFollowup,
  });
  const showFollowupQuestionCard = shouldShowCreateFollowupQuestionCard({
    showPostInputModules,
    productMode,
  });
  const analyzeFollowupActivated = followupSurface === "analysis";
  const showAnalyzeWorkspace = shouldRenderCreateAnalyzeWorkspace({
    followupActivated: analyzeFollowupActivated,
    hasStarted,
    intakeText,
    productMode,
    guidedBridgeConfirmed,
  });
  const workspaceInitialText =
    productMode === "guided"
      ? buildGuidedWorkspaceText({
          intakeText,
          guidedBridgeAnswer: guidedBridgeConfirmed ? guidedBridgeAnswer : "",
          guidedWorkspacePrefix: surfaceTexts.guidedWorkspacePrefix,
        })
      : intakeText;
  const normalizedIntakeText = intakeText.trim();
  const startDisabled =
    !normalizedIntakeText ||
    ((!currentLinkDetection.hasLink && normalizedIntakeText.length < MIN_INTENT_INPUT_LENGTH) || isStarting);
  const showTooShortHint =
    normalizedIntakeText.length > 0 &&
    normalizedIntakeText.length < MIN_INTENT_INPUT_LENGTH &&
    !currentLinkDetection.hasLink;
  const startBusyStatusLabel =
    productMode === "analyze" ? "Wir ordnen deinen Beitrag ein …" : surfaceTexts.startBusyStatus;
  const showStartChatPreview =
    Boolean(followupSnapshot) && hasStarted && !showIntelligentFollowup && !showLinkClarification;
  const startChatAssistantTitle = isStarting
    ? "Ich ordne das kurz ein"
    : productMode === "guided"
      ? surfaceTexts.followupGuidedTitle
      : productMode === "media"
        ? productModeConfig.postStartTitle
        : surfaceTexts.followupContributeTitle;
  const startChatAssistantBody = isStarting
    ? surfaceTexts.startBusyLead
    : productMode === "guided"
      ? surfaceTexts.followupGuidedLead
      : productMode === "media"
        ? productModeConfig.postStartLead
        : followupSnapshot?.understandingLine ?? surfaceTexts.followupContributeLead;
  const actionSuggestionHref =
    intelligentFollowup?.suggestions.find(
      (suggestion) =>
        suggestion.kind === "dossier" ||
        suggestion.kind === "vote" ||
        suggestion.kind === "anlassraum" ||
        suggestion.kind === "topic",
    )?.href ?? "/dossier/demo";

  const handleSaveWorkstate = React.useCallback(async () => {
    if (!showIntelligentFollowup) {
      setSaveState("unavailable");
      setSaveMessage("Speichern ist in diesem Demo-/Entwurfsstand noch nicht verfügbar.");
      setActionNotice("Speichern ist in diesem Demo-/Entwurfsstand noch nicht verfügbar.");
      return;
    }

    const normalizedText = intakeText.trim();
    if (!normalizedText) {
      setSaveState("unavailable");
      setSaveMessage("Speichern ist in diesem Demo-/Entwurfsstand noch nicht verfügbar.");
      setActionNotice("Speichern ist in diesem Demo-/Entwurfsstand noch nicht verfügbar.");
      return;
    }

    const linkIntakeMeta = buildCreateLinkIntakeMeta({
      detection: linkClarificationState?.detection ?? currentLinkDetection,
      selectedIntentId: linkClarificationState?.selectedIntentId,
      additionalContext: linkClarificationState?.additionalContext,
    });

    setSaveState("saving");
    setSaveMessage("Arbeitsstand wird gespeichert …");
    try {
      const response = await fetch("/api/create/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draftId: savedDraftId ?? undefined,
          text: normalizedText,
          locale: surfaceLocale,
          source: "create_followup",
          createMode: canonicalCreateMode,
          anlassraumId: effectiveSelectedAnlassraumId ?? undefined,
          useCase: productModeConfig.preferredUseCase,
          analysis: intelligentFollowup
            ? {
                intelligentFollowup,
                understandingConfirmed,
                linkIntake: linkIntakeMeta ?? undefined,
              }
            : undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.ok || typeof body?.draftId !== "string") {
        throw new Error(body?.error || "save_failed");
      }
      setSavedDraftId(body.draftId);
      setSaveState("saved");
      setSaveMessage("Arbeitsstand gespeichert. Du kannst ihn später weiterbearbeiten.");
      setActionNotice("Arbeitsstand gespeichert. Du kannst ihn später weiterbearbeiten.");
    } catch {
      setSaveState("error");
      setSaveMessage("Speichern fehlgeschlagen. Bitte versuche es erneut.");
      setActionNotice("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    }
  }, [
    canonicalCreateMode,
    effectiveSelectedAnlassraumId,
    intakeText,
    intelligentFollowup,
    productModeConfig.preferredUseCase,
    savedDraftId,
    showIntelligentFollowup,
    surfaceLocale,
    understandingConfirmed,
    currentLinkDetection,
    linkClarificationState,
  ]);

  if (gate.status === "loading") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        {text.loadingAccess}
      </main>
    );
  }
  if (gate.status === "anon") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        {text.loginRequired}
      </main>
    );
  }
  if (gate.status === "blocked") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        {text.submissionBlocked}
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 md:space-y-8">
      <section className="create-dialog-workspace rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 shadow-[0_24px_64px_rgba(2,6,23,0.14)] sm:p-4 md:p-6 lg:p-8">
      <SharedCreateComposer
        badge={surfaceTexts.badgeCanonical}
        subline={surfaceTexts.sublineCanonical}
        texts={surfaceComposerTexts}
        topMeta={
          intakeRestoreInfo ? (
            <p className="max-w-2xl text-xs text-[rgb(var(--muted))]">{intakeRestoreInfo}</p>
          ) : undefined
        }
        modeOrder={CREATE_PRODUCT_MODES}
        modeDefinitions={surfaceModeDefinitions}
        activeMode={productMode}
        onModeChange={(modeOption) => {
          setProductMode(modeOption);
          setActiveContextAnchorId(null);
          setIntelligentFollowup(null);
          setUnderstandingConfirmed(false);
          setLinkClarificationState(null);
          setChatContinuationText("");
          if (!hasStarted) return;
          setFollowupSurface("none");
          setGuidedBridgeConfirmed(modeOption !== "guided");
        }}
        helperText={intakeHelperText}
        inputId="create-primary-intake"
        inputLabel={productModeConfig.inputLabel}
        inputValue={intakeText}
        inputPlaceholder={intakePlaceholder}
        onInputChange={(value) => {
          setIntakeText(value);
          if (intakeRestoreInfo) setIntakeRestoreInfo(null);
          if (intakeError) setIntakeError(null);
          if (actionNotice) setActionNotice(null);
          setLinkClarificationState((current) => {
            if (!current) return null;
            const nextDetection = detectCreateLinkIntake(value);
            if (!nextDetection.hasLink) return null;
            return {
              ...current,
              detection: nextDetection,
            };
          });
        }}
        onStart={handleStart}
        startLabel={productModeConfig.ctaLabel}
        startDisabled={startDisabled}
        startBusy={isStarting}
        startBusyLabel={startBusyStatusLabel}
        secondaryAction={{
          href: contextualReturnHref ?? "/runden",
          label: contextualReturnHref ? surfaceTexts.returnToContextLabel : surfaceTexts.goToRoundsLabel,
        }}
        contextAnchors={surfaceContextAnchors}
        activeContextAnchorId={activeContextAnchorId}
        onContextAnchorSelect={(anchorId) => {
          const anchor = resolveCreateContextAnchorById(anchorId, surfaceLocale);
          setActiveContextAnchorId(anchorId);
          setIntelligentFollowup(null);
          setUnderstandingConfirmed(false);
          setLinkClarificationState(null);
          setChatContinuationText("");
          if (!anchor) return;
          setProductMode(anchor.mode);
          if (!hasStarted) return;
          setFollowupSurface("none");
          setGuidedBridgeConfirmed(anchor.mode !== "guided");
        }}
        activeContextAnchorLead={activeContextAnchor?.lead}
        helperLinks={surfaceHelperLinks}
        error={intakeError}
        contextBanner={
          fromRundenFlow ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-100">
              <p className="font-semibold">{surfaceTexts.rundenContextTitle}</p>
              <p className="mt-1">
                {readableRundenContextLabel
                  ? surfaceTexts.rundenContextWithLabel(readableRundenContextLabel)
                  : surfaceTexts.rundenContextFallback}{" "}
                {surfaceTexts.rundenContextReturnHint}
              </p>
            </div>
          ) : null
        }
        minRows={8}
        collapseModeSelector
        embeddedWorkspace
      />

      {showTooShortHint ? (
        <p className="rounded-xl border border-amber-300/45 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {productModeConfig.minimumInputHint}
        </p>
      ) : null}

      {showPostInputModules && !showLinkClarification ? (
        <div className="hidden md:flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
          <span className="vog-chip">{text.tierLabel}: {tierLabel}</span>
          <span className="vog-chip">{text.creditsLabel}: {formatOperatorNumber(credits, operatorLocale)}</span>
          <Link href="/account" className="vog-chip">
            {text.quotasTitle}
          </Link>
          <Link href={contextualReturnHref ?? "/runden"} className="vog-chip">
            {contextualReturnHref ? surfaceTexts.returnToContextLabel : surfaceTexts.goToRoundsLabel}
          </Link>
          <span className="sr-only">
            {monthlyLimit === null
              ? `${text.monthlyLimitLabel}: ${text.monthlyLimitUnlimited}`
              : `${text.monthlyLimitLabel}: ${formatOperatorNumber(monthlyLimit, operatorLocale)}`}
          </span>
          <span className="sr-only">{text.maxClaimsLabel}: {formatOperatorNumber(maxFinalizeClaims, operatorLocale)}</span>
        </div>
      ) : null}

      {showStartChatPreview && followupSnapshot ? (
        <div className="create-start-chat-preview create-chat-workspace rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 md:px-5">
          <div className="create-chat-spine space-y-5">
            <CreateSubmittedContributionBubble text={followupSnapshot.originalText} />
            <CreateAssistantStatusBubble
              eyebrow={isStarting ? startBusyStatusLabel : surfaceTexts.followupUnderstandingLabel}
              title={startChatAssistantTitle}
              body={startChatAssistantBody}
              notice={isStarting ? null : actionNotice}
            />
          </div>
        </div>
      ) : null}

      {showLinkClarification && linkClarificationState ? (
        <div className="create-chat-workspace rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 md:px-5">
          <div className="create-chat-spine space-y-5">
            <CreateSubmittedContributionBubble
              text={followupSnapshot?.originalText ?? normalizedIntakeText}
            />
            <CreateLinkIntakeClarification
              locale={surfaceLocale}
              detection={linkClarificationState.detection}
              selectedIntentId={linkClarificationState.selectedIntentId}
              additionalContext={linkClarificationState.additionalContext}
              onSelectIntent={(intentId) => {
                setLinkClarificationState((current) =>
                  current
                    ? {
                        ...current,
                        selectedIntentId: intentId,
                      }
                    : current,
                );
              }}
              onAdditionalContextChange={(value) => {
                setLinkClarificationState((current) =>
                  current
                    ? {
                        ...current,
                        additionalContext: value,
                      }
                    : current,
                );
              }}
            />
          </div>
        </div>
      ) : null}

      {showIntelligentFollowup && intelligentFollowup ? (
        <div
          ref={intelligentFollowupResultRef}
          className="scroll-mt-24 pt-4 md:pt-5"
        >
          <CreateVisualFollowup
            result={intelligentFollowup}
            ctaHref={actionSuggestionHref}
            actionNotice={actionNotice}
            isConfirmed={understandingConfirmed}
            saveState={saveState}
            saveMessage={saveMessage}
            factcheckMessage={factcheckMessage}
            onConfirm={() => {
              setUnderstandingConfirmed(true);
              setActionNotice("Einordnung bestätigt. Keine automatische Veröffentlichung.");
            }}
            onEdit={() => {
              setUnderstandingConfirmed(false);
              setActionNotice("Einordnung zur Korrektur geöffnet. Passe den Text an und starte erneut.");
            }}
            onOpenNewAnlassraum={() => {
              setActionNotice("Neuer Anlassraum als nächster Schritt markiert. Keine automatische Veröffentlichung.");
            }}
            onSaveForLater={handleSaveWorkstate}
            onStartOptionalService={handleStartFactcheckService}
            continuationValue={chatContinuationText}
            onContinuationChange={setChatContinuationText}
            onContinueConversation={handleContinueConversation}
            continueConversationDisabled={isStarting || !chatContinuationText.trim()}
          />
        </div>
      ) : null}
      </section>

      {showPostInputModules && !showIntelligentFollowup && !showLinkClarification ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{productModeConfig.postStartTitle}</p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{productModeConfig.postStartLead}</p>
          {showIntakeContext && initialIntakeContext?.sourceLabel ? (
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              {surfaceTexts.followupContextPrefix}: {initialIntakeContext.sourceLabel}
              {initialIntakeContext.scope
                ? ` · ${formatRelevanceScopeLabel(initialIntakeContext.scope, initialIntakeContext.scope)}`
                : ""}
            </p>
          ) : null}
          {hasLegacyModeParam ? (
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              {text.legacyModePrefix} {text.legacyModeSuffix}
            </p>
          ) : null}
        </section>
      ) : null}

      {showFollowupQuestionCard && !showLinkClarification ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">eDebatte</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{surfaceTexts.followupQuestionLabel}</p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{productModeConfig.firstQuestion}</p>
          <label className="sr-only" htmlFor="create-followup-answer">
            {surfaceTexts.followupQuestionLabel}
          </label>
          <textarea
            id="create-followup-answer"
            rows={5}
            value={activeFollowupAnswer}
            onChange={(event) => {
              const value = event.target.value;
              setFollowupAnswers((current) => ({
                ...current,
                [activeIntent]: value,
              }));
              setFollowupAnswerSaved((current) => ({
                ...current,
                [activeIntent]: false,
              }));
              if (actionNotice) setActionNotice(null);
            }}
            className="mt-3 w-full resize-y rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder={productModeConfig.firstQuestionPlaceholder}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={handleSaveFollowupAnswer}>
              {surfaceTexts.followupQuestionSaveLabel}
            </button>
            <span className="text-xs text-[rgb(var(--muted))]">
              {productModeConfig.inputLabel}
            </span>
          </div>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">Schreib einfach weiter, wenn du die Antwort lieber frei im Chat ergänzen möchtest.</p>
          {activeFollowupSaved ? (
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{surfaceTexts.followupQuestionSavedLabel}</p>
          ) : null}
        </section>
      ) : null}

      {showPostInputModules && pickerEnabled && !showLinkClarification ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{text.contextPickerTitle}</p>
            <p className="text-sm text-[rgb(var(--muted))]">
              {text.contextPickerLead}
            </p>
          </div>

          {contextLoadState === "loading" ? (
            <p className="mt-3 text-sm text-[rgb(var(--muted))]">{text.loadingContextList}</p>
          ) : null}

          {contextLoadState === "error" ? (
            <div className="mt-3 rounded-xl border border-rose-300/50 bg-rose-50/80 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              <p>{text.contextUnavailable}.</p>
              {contextLoadError ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold">Developer-Hinweis</summary>
                  <p className="mt-1 text-xs">{contextLoadError}</p>
                </details>
              ) : null}
              <button type="button" onClick={() => void loadContextItems()} className="btn-secondary mt-2 text-xs">
                {text.reload}
              </button>
            </div>
          ) : null}

          {contextLoadState === "ready" && contextItems.length === 0 ? (
            <p className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
              {text.contextEmpty}
            </p>
          ) : null}

          {contextLoadState === "ready" && contextItems.length > 0 ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {contextItems.map((item) => {
                const isSelected = selectedAnlassraumId === item.anlassraumId;
                return (
                  <li key={item.anlassraumId}>
                    <button
                      type="button"
                      className={`w-full rounded-xl border px-3 py-2 text-left ${
                        isSelected
                          ? "border-[rgb(var(--grad-from))] bg-[rgb(var(--bg))]"
                          : "border-[rgb(var(--border))] bg-transparent hover:border-[rgb(var(--grad-from))]/40"
                      }`}
                      onClick={() => {
                        setSelectionInfo(null);
                        setSelectedAnlassraumId(item.anlassraumId);
                      }}
                    >
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[rgb(var(--muted))]">{item.summary}</p>
                      <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                        {item.topicKey ? `${text.topicLabel}: ${item.topicKey} · ` : ""}
                        {item.anlassraumStatus ? `${text.statusLabel}: ${item.anlassraumStatus}` : `${text.statusLabel}: ${text.statusOpen}`}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {selectedContext ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
              <span className="vog-chip">{text.selectedLabel}: {selectedContext.title}</span>
              <span className="vog-chip">{text.anlassraumIdLabel}: {selectedContext.anlassraumId}</span>
              <button
                type="button"
                className="vog-chip border border-[rgb(var(--border))] bg-transparent"
                onClick={() => setSelectedAnlassraumId(null)}
              >
                {text.clearSelection}
              </button>
            </div>
          ) : null}

          {selectionInfo ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{selectionInfo}</p>
          ) : null}
        </section>
      ) : null}

      {showPostInputModules && workingState && !showIntelligentFollowup && !showLinkClarification ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">eDebatte</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
            {productMode === "guided" ? surfaceTexts.followupGuidedTitle : productModeConfig.postStartTitle}
          </p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            {productMode === "guided" ? surfaceTexts.followupGuidedLead : productModeConfig.postStartLead}
          </p>

          <div className="mt-3 grid gap-3">
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Kurzfassung</p>
              <p className="mt-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
                {workingState.summary}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                <p className="text-xs font-semibold text-[rgb(var(--muted))]">{productModeConfig.recognizedTypeLabel}</p>
                <p className="mt-1 text-sm text-[rgb(var(--fg))]">{workingState.recognizedType}</p>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                <p className="text-xs font-semibold text-[rgb(var(--muted))]">Passendes Thema oder nächster Schritt</p>
                <p className="mt-1 text-sm text-[rgb(var(--fg))]">{workingState.suggestedAssignment}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Offene Klärungsfragen</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
                {productModeConfig.openPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{surfaceTexts.followupNextStepLabel}</p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{surfaceTexts.followupNextStepLead}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {productModeConfig.nextActions.map((actionLabel, actionIndex) => (
                <button
                  key={actionLabel}
                  type="button"
                  className="btn-secondary justify-start text-left text-xs"
                  onClick={() => handleIntentAction(actionIndex)}
                >
                  {actionLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dossier/demo" className="btn-secondary text-xs">
              Thema öffnen
            </Link>
            <Link href="/swipes" className="btn-secondary text-xs">
              Beteiligung öffnen
            </Link>
            <Link href={contextualReturnHref ?? "/runden"} className="btn-secondary text-xs">
              {contextualReturnHref ? surfaceTexts.returnToContextLabel : surfaceTexts.goToRoundsLabel}
            </Link>
          </div>

          {followupSnapshot ? (
            <p className="mt-3 text-xs text-[rgb(var(--muted))]">
              {surfaceTexts.followupUnderstandingLabel}: {followupSnapshot.understandingLine}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">{surfaceTexts.followupNotPublishedLabel}</p>
          {actionNotice ? (
            <p className="mt-2 rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              {actionNotice}
            </p>
          ) : null}
        </section>
      ) : null}


      {showAnalyzeWorkspace ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100">
          <p className="font-semibold">{surfaceTexts.followupReviewFrameTitle}</p>
          <p className="mt-1">{surfaceTexts.followupReviewFrameLead}</p>
        </section>
      ) : null}

      {showAnalyzeWorkspace ? (
        <AnalyzeWorkspace
          key={`${productMode}-${canonicalCreateMode}-${canonicalIntent}-${dossierId ?? "no-dossier"}`}
          mode={canonicalIntent}
          createMode={canonicalCreateMode}
          defaultLevel={2}
          storageKey={
            canonicalIntent === "statement"
              ? `vog_create_freistart_statement_${productMode}_v1`
              : `vog_create_freistart_contribution_${productMode}_v1`
          }
          analyzeEndpoint="/api/create/analyze"
          saveEndpoint="/api/create/save"
          finalizeEndpoint="/api/create/finalize"
          afterFinalizeNavigateTo={afterFinalizeNavigateTo}
          dossierId={dossierId ?? undefined}
          selectedAnlassraumId={effectiveSelectedAnlassraumId ?? undefined}
          verificationLevel={workspaceVerificationLevel}
          verificationStatus="ok"
          authorName={overview.displayName ?? overview.profile?.headline ?? ""}
          useCaseAccess={useCaseAccess}
          initialText={workspaceInitialText}
          embeddedSingleIntake
          syncTextFromParent
          autoRunToken={analysisAutoRunToken}
          maxClaimsCap={maxClaimsCap}
          maxFinalizeClaims={maxFinalizeClaims}
          analysisEntryVariant="single_button"
          analysisModeHint={productMode}
          analysisIntentHint={activeIntent}
        />
      ) : null}
    </div>
  );
}
