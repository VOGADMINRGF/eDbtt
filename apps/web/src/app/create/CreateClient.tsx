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
import type { CreateIntent } from "@/features/create/intents";
import {
  buildFinalizeFallbackPath,
  normalizeInternalRedirectPath,
} from "@/features/create/finalizeRedirect";
import {
  getCreateComposerTexts,
  getCreateContextAnchorDefinitions,
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

export type CreateClientProps = {
  initialEntitlements: CreateEntitlements;
  overview: AccountOverview;
  dossierId?: string | null;
  initialAnlassraumId?: string | null;
  initialMode?: CreateMode;
  initialEntryIntent?: CreateEntryIntent;
  initialEntryMode?: CreateEntryMode;
  initialText?: string | null;
  initialIntakeContext?: CreateIntakeContext | null;
  initialReturnTo?: string | null;
};

export const CREATE_PRODUCT_MODES = CREATE_PRODUCT_MODE_VALUES;

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
  hasStarted: boolean;
  intakeText: string;
  productMode: CreateProductMode;
  guidedBridgeConfirmed: boolean;
}): boolean {
  const postInputReady = shouldShowCreatePostInputModules({
    hasStarted: params.hasStarted,
    intakeText: params.intakeText,
  });
  if (!postInputReady) return false;
  if (params.productMode !== "guided") return true;
  return params.guidedBridgeConfirmed;
}

export function resolveInitialCreateProductMode(params: {
  initialEntryIntent?: CreateEntryIntent;
  initialEntryMode?: CreateEntryMode;
}): CreateProductMode {
  if (params.initialEntryIntent === "content_companion") return "media";
  if (params.initialEntryIntent === "round_setup" || params.initialEntryIntent === "org_context_setup") return "guided";
  if (params.initialEntryMode === "guided") return "guided";
  return "analyze";
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
      initialEntryIntent,
      initialEntryMode,
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
  const contextLoadedRef = React.useRef(false);
  const [intakeText, setIntakeText] = React.useState(initialText ?? "");
  const [activeContextAnchorId, setActiveContextAnchorId] = React.useState<CreateIntent | null>(null);
  const [hasStarted, setHasStarted] = React.useState<boolean>(false);
  const [intakeError, setIntakeError] = React.useState<string | null>(null);
  const [guidedBridgeAnswer, setGuidedBridgeAnswer] = React.useState("");
  const [guidedBridgeConfirmed, setGuidedBridgeConfirmed] = React.useState(false);
  const [guidedBridgeError, setGuidedBridgeError] = React.useState<string | null>(null);

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

  const handleStart = React.useCallback(() => {
    if (!hasPrimaryIntakeText(intakeText)) {
      setIntakeError(surfaceTexts.intakeMissingError);
      return;
    }
    setIntakeError(null);
    setHasStarted(true);
    setGuidedBridgeConfirmed(productMode !== "guided");
    setGuidedBridgeError(null);
  }, [intakeText, productMode, surfaceTexts.intakeMissingError]);

  const handleGuidedBridgeConfirm = React.useCallback(() => {
    if (!hasPrimaryIntakeText(guidedBridgeAnswer)) {
      setGuidedBridgeError(surfaceTexts.guidedMissingError);
      return;
    }
    setGuidedBridgeError(null);
    setGuidedBridgeConfirmed(true);
  }, [guidedBridgeAnswer, surfaceTexts.guidedMissingError]);

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
  const showAnalyzeWorkspace = shouldRenderCreateAnalyzeWorkspace({
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

  return (
    <div className="space-y-6 md:space-y-8">
      <SharedCreateComposer
        badge={surfaceTexts.badgeCanonical}
        subline={surfaceTexts.sublineCanonical}
        texts={surfaceComposerTexts}
        modeOrder={CREATE_PRODUCT_MODES}
        modeDefinitions={surfaceModeDefinitions}
        activeMode={productMode}
        onModeChange={(modeOption) => {
          setProductMode(modeOption);
          setActiveContextAnchorId(null);
          if (!hasStarted) return;
          setGuidedBridgeConfirmed(modeOption !== "guided");
          setGuidedBridgeError(null);
        }}
        helperText={intakeHelperText}
        inputId="create-primary-intake"
        inputValue={intakeText}
        inputPlaceholder={intakePlaceholder}
        onInputChange={(value) => {
          setIntakeText(value);
          if (intakeError) setIntakeError(null);
        }}
        onStart={handleStart}
        startLabel={productModeConfig.ctaLabel}
        secondaryAction={{
          href: contextualReturnHref ?? "/runden",
          label: contextualReturnHref ? surfaceTexts.returnToContextLabel : surfaceTexts.goToRoundsLabel,
        }}
        contextAnchors={surfaceContextAnchors}
        activeContextAnchorId={activeContextAnchorId}
        onContextAnchorSelect={(anchorId) => {
          const anchor = resolveCreateContextAnchorById(anchorId, surfaceLocale);
          setActiveContextAnchorId(anchorId);
          if (!anchor) return;
          setProductMode(anchor.mode);
          if (!hasStarted) return;
          setGuidedBridgeConfirmed(anchor.mode !== "guided");
          setGuidedBridgeError(null);
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
        minRows={11}
      />

      {showPostInputModules ? (
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

      {showPostInputModules && productMode === "guided" && !guidedBridgeConfirmed ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{surfaceTexts.guidedTitle}</p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{surfaceTexts.guidedLead}</p>
          <label className="sr-only" htmlFor="create-guided-bridge-answer">
            {surfaceTexts.guidedInputLabel}
          </label>
          <textarea
            id="create-guided-bridge-answer"
            rows={5}
            value={guidedBridgeAnswer}
            onChange={(event) => {
              setGuidedBridgeAnswer(event.target.value);
              if (guidedBridgeError) setGuidedBridgeError(null);
            }}
            className="mt-3 w-full resize-y rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder={surfaceTexts.guidedPlaceholder}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={handleGuidedBridgeConfirm}>
              {surfaceTexts.guidedCta}
            </button>
            <span className="text-xs text-[rgb(var(--muted))]">
              {surfaceTexts.guidedHint}
            </span>
          </div>
          {guidedBridgeError ? (
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{guidedBridgeError}</p>
          ) : null}
        </section>
      ) : null}

      {showPostInputModules && pickerEnabled ? (
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
              <p>{text.contextUnavailable} ({contextLoadError ?? "create_context_source_unavailable"}).</p>
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

      {showPostInputModules ? (
        <details className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{text.quotasTitle}</summary>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
            <span className="vog-chip">{text.tierLabel}: {tierLabel}</span>
            <span className="vog-chip">{text.creditsLabel}: {formatOperatorNumber(credits, operatorLocale)}</span>
            {monthlyLimit === null ? (
              <span className="vog-chip">{text.monthlyLimitLabel}: {text.monthlyLimitUnlimited}</span>
            ) : (
              <span className="vog-chip">{text.monthlyLimitLabel}: {formatOperatorNumber(monthlyLimit, operatorLocale)}</span>
            )}
            <span className="vog-chip">{text.maxClaimsLabel}: {formatOperatorNumber(maxFinalizeClaims, operatorLocale)}</span>
            <Link href={contextualReturnHref ?? "/runden"} className="vog-chip">
              {contextualReturnHref ? surfaceTexts.returnToContextLabel : surfaceTexts.goToRoundsLabel}
            </Link>
          </div>
        </details>
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
          maxClaimsCap={maxClaimsCap}
          maxFinalizeClaims={maxFinalizeClaims}
          analysisEntryVariant="single_button"
          analysisModeHint={productMode}
        />
      ) : null}
    </div>
  );
}
