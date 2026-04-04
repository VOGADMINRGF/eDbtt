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
  buildCreateIntentFallbackPath,
  resolveCreateOrchestratorIntentContract,
  type CreateEntryIntent,
  type CreateEntryMode,
} from "@/features/create/orchestratorIntentContract";
import {
  formatOperatorNumber,
  getOperatorCreateTexts,
  resolveOperatorLocale,
  type OperatorCreateTexts,
} from "@/features/i18n/operatorSystemTexts";

export type CreateClientProps = {
  initialEntitlements: CreateEntitlements;
  overview: AccountOverview;
  dossierId?: string | null;
  initialAnlassraumId?: string | null;
  initialIntent?: "statement" | "contribution";
  initialMode?: CreateMode;
  initialEntryIntent?: CreateEntryIntent;
  initialEntryMode?: CreateEntryMode;
  initialText?: string | null;
  initialIntakeContext?: CreateIntakeContext | null;
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

function deriveUseCaseAccess(overview: AccountOverview | null | undefined, text: OperatorCreateTexts): UseCaseAccess {
  const roles = (overview?.roles ?? []).map((r) => String(r).toLowerCase());
  const tier = overview ? getUserAccessTier(overview) : "citizenBasic";
  const isStaff = roles.some((r) => ["admin", "superadmin", "staff", "moderator"].includes(r));
  const isMedia = roles.some((r) =>
    ["redaktion", "editor", "journalist", "journalism", "media", "presse", "tv"].includes(r),
  );
  const isAgenda =
    roles.some((r) =>
      ["verwaltung", "agenda", "org", "org_admin", "org_manager", "ngo", "politics", "party", "b2b", "b2g"].includes(r),
    ) || tier.startsWith("institution");

  let allowed: UseCaseId[] = ["civic"];
  let note = text.accessNoteDefault;

  if (isStaff) {
    allowed = ["civic", "journalism", "agenda"];
    note = text.accessNoteStaff;
  } else if (isMedia) {
    allowed = ["journalism"];
    note = text.accessNoteMedia;
  } else if (isAgenda) {
    allowed = ["agenda"];
    note = text.accessNoteAgenda;
  } else {
    allowed = ["civic"];
    note = text.accessNoteCivic;
  }

  return {
    allowed,
    note,
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

function inferLegacyMode(
  initialMode: CreateMode | undefined,
  initialIntent: "statement" | "contribution" | undefined,
): CreateMode {
  if (initialMode) return initialMode;
  if (initialIntent === "statement") return "manual";
  return "source";
}

function normalizeAnlassraumId(value?: string | null): string | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (!/^[a-f0-9]{24}$/.test(normalized)) return null;
  return normalized;
}

export default function CreateClient({
  initialEntitlements,
  overview,
  dossierId,
  initialAnlassraumId,
  initialIntent,
  initialMode,
  initialEntryIntent,
  initialEntryMode,
  initialText,
  initialIntakeContext,
}: CreateClientProps) {
  const { locale } = useLocale();
  const operatorLocale = resolveOperatorLocale(locale);
  const text = getOperatorCreateTexts(operatorLocale);

  const [entitlements, setEntitlements] = React.useState<CreateEntitlements>(initialEntitlements);
  const [gate, setGate] = React.useState<GateState>(() => deriveGate(initialEntitlements));
  const legacyMode = React.useMemo(
    () => inferLegacyMode(initialMode, initialIntent),
    [initialMode, initialIntent],
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

  const createOrchestration = React.useMemo(
    () =>
      resolveCreateOrchestratorIntentContract({
        rawEntryIntent: initialEntryIntent,
        rawEntryMode: initialEntryMode,
        canSubmitContribution: entitlements.canSubmitContribution,
        canSubmitStatement: entitlements.canSubmitStatement,
        dossierId,
        selectedAnlassraumId,
      }),
    [
      dossierId,
      entitlements.canSubmitContribution,
      entitlements.canSubmitStatement,
      initialEntryIntent,
      initialEntryMode,
      selectedAnlassraumId,
    ],
  );

  const canonicalIntent: "statement" | "contribution" = createOrchestration.workspaceMode;
  const canonicalCreateMode: CreateMode = createOrchestration.createMode;
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
    if (!pickerEnabled) return;
    if (contextLoadedRef.current) return;
    void loadContextItems();
  }, [pickerEnabled, loadContextItems]);

  React.useEffect(() => {
    if (!pickerEnabled && selectedAnlassraumId) {
      setSelectedAnlassraumId(null);
    }
  }, [pickerEnabled, selectedAnlassraumId]);

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

  const afterFinalizeNavigateTo = buildCreateIntentFallbackPath({
    contract: createOrchestration,
    dossierId,
  });
  const useCaseAccess = deriveUseCaseAccess(overview, text);
  const selectedContext = selectedAnlassraumId
    ? contextItems.find((item) => item.anlassraumId === selectedAnlassraumId) ?? null
    : null;
  const effectiveSelectedAnlassraumId = canonicalIntent === "statement" ? null : selectedAnlassraumId;

  const tierCfg = getAccessTierConfigForUser(overview);
  const tierLabel = getUserAccessTier(overview);
  const monthlyLimit = tierCfg.monthlyContributionLimit;
  const credits = entitlements.contributionCredits;

  const hasLegacyModeParam = Boolean(initialMode);
  const showIntakeContext = hasCreateIntakeContext(initialIntakeContext);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{text.freeStartKicker}</p>
          <h2
            className="text-2xl font-semibold leading-tight md:text-3xl"
            style={{
              backgroundImage: "linear-gradient(120deg,var(--brand-cyan),var(--brand-blue))",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {text.freeStartHeadline}
          </h2>
          <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
            {text.freeStartLead}
          </p>
          <p className="max-w-3xl text-xs text-[rgb(var(--muted))]">
            Themenkontext in den <Link href="/runden" className="underline underline-offset-2">Anlässen</Link>, Beteiligung in{" "}
            <Link href="/swipes" className="underline underline-offset-2">Swipes</Link>, Verdichtung im Dossier.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
            <span className="vog-chip">{text.chipFreeStart}</span>
            <span className="vog-chip">{text.chipIntake}</span>
            <span className="vog-chip">{text.chipQuality}</span>
            <span className="vog-chip">{text.chipGraphMatching}</span>
            <span className="vog-chip">{text.chipCtaRouting}</span>
            <span className="vog-chip">{text.chipNoAutoPublish}</span>
            <span className="vog-chip">{text.chipNoSilentMerge}</span>
          </div>
        </div>
      </section>

      {hasLegacyModeParam ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          {text.legacyModePrefix} (<code>{legacyMode}</code>) {text.legacyModeSuffix}
        </section>
      ) : null}

      {showIntakeContext ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              {text.intakeContextTitle}
            </p>
            <p className="text-sm text-[rgb(var(--muted))]">
              {text.intakeContextLead}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
            {initialIntakeContext?.sourceLabel ? (
              <span className="vog-chip">{text.openPrimarySource}: {initialIntakeContext.sourceLabel}</span>
            ) : null}
            {initialIntakeContext?.sourceUrl ? (
              <a
                href={initialIntakeContext.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="vog-chip border border-[rgb(var(--border))] bg-transparent"
              >
                {text.openPrimarySource}
              </a>
            ) : null}
            {initialIntakeContext?.region ? <span className="vog-chip">{text.regionLabel}: {initialIntakeContext.region}</span> : null}
            {initialIntakeContext?.scope ? (
              <span className="vog-chip">
                {text.scopeLabel}: {formatRelevanceScopeLabel(initialIntakeContext.scope, initialIntakeContext.scope)}
              </span>
            ) : null}
            {initialIntakeContext?.source ? <span className="vog-chip">{text.signalTrailLabel}: {initialIntakeContext.source}</span> : null}
            {initialIntakeContext?.signalTitle ? (
              <span className="vog-chip">{text.signalLabel}: {initialIntakeContext.signalTitle}</span>
            ) : null}
            {initialIntakeContext?.clusterHint ? (
              <span className="vog-chip">{text.clusterLabel}: {initialIntakeContext.clusterHint}</span>
            ) : null}
            {initialIntakeContext?.reviewState ? (
              <span className="vog-chip">{text.reviewLabel}: {initialIntakeContext.reviewState}</span>
            ) : null}
            {initialIntakeContext?.reason ? <span className="vog-chip">{text.handoffLabel}: {initialIntakeContext.reason}</span> : null}
            {initialIntakeContext?.candidateId ? (
              <span className="vog-chip">{text.candidateIdLabel}: {initialIntakeContext.candidateId}</span>
            ) : null}
            {initialIntakeContext?.draftId ? <span className="vog-chip">{text.draftIdLabel}: {initialIntakeContext.draftId}</span> : null}
          </div>
        </section>
      ) : null}

      {pickerEnabled ? (
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
          <Link href="/runden" className="vog-chip">Anlässe öffnen</Link>
        </div>
      </details>

      <AnalyzeWorkspace
        key={`${canonicalCreateMode}-${canonicalIntent}-${dossierId ?? "no-dossier"}`}
        mode={canonicalIntent}
        createMode={canonicalCreateMode}
        defaultLevel={2}
        storageKey={
          canonicalIntent === "statement"
            ? "vog_create_freistart_statement_v1"
            : "vog_create_freistart_contribution_v1"
        }
        analyzeEndpoint="/api/create/analyze"
        saveEndpoint="/api/create/save"
        finalizeEndpoint="/api/create/finalize"
        afterFinalizeNavigateTo={afterFinalizeNavigateTo}
        dossierId={dossierId ?? undefined}
        selectedAnlassraumId={effectiveSelectedAnlassraumId ?? undefined}
        verificationLevel={overview.verificationLevel ?? "none"}
        verificationStatus="ok"
        authorName={overview.displayName ?? overview.profile?.headline ?? ""}
        useCaseAccess={useCaseAccess}
        initialText={initialText ?? undefined}
        maxClaimsCap={maxClaimsCap}
        maxFinalizeClaims={maxFinalizeClaims}
      />
    </div>
  );
}
