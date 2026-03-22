"use client";

import * as React from "react";
import Link from "next/link";
import AnalyzeWorkspace, { type UseCaseAccess, type UseCaseId } from "@/components/analyze/AnalyzeWorkspace";
import type { AccountOverview } from "@features/account/types";
import { getAccessTierConfigForUser, getUserAccessTier } from "@core/access/accessTiers";
import type { CreateEntitlements } from "@/lib/server/entitlements/createEntitlements";
import type { CreateMode } from "@/features/create/intents";
import { formatRelevanceScopeLabel } from "@/features/relevanceFraming";

export type CreateClientProps = {
  initialEntitlements: CreateEntitlements;
  overview: AccountOverview;
  dossierId?: string | null;
  initialAnlassraumId?: string | null;
  initialIntent?: "statement" | "contribution";
  initialMode?: CreateMode;
  initialText?: string | null;
  initialIntakeContext?: CreateIntakeContext | null;
};

export type CreateIntakeContext = {
  source: string | null;
  signalTitle: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  region: string | null;
  scope: string | null;
  clusterHint: string | null;
  reviewState: string | null;
  candidateId: string | null;
  draftId: string | null;
  reason: string | null;
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

function deriveUseCaseAccess(overview?: AccountOverview | null): UseCaseAccess {
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
  let note = "Dein Bereich ist festgelegt. Fuer andere Use Cases brauchst du das passende Paket.";

  if (isStaff) {
    allowed = ["civic", "journalism", "agenda"];
    note = "Staff-Zugang: alle Use Cases sind freigeschaltet.";
  } else if (isMedia) {
    allowed = ["journalism"];
    note = "Journalismus/Medien: Zugriff nur fuer journalistische Formate.";
  } else if (isAgenda) {
    allowed = ["agenda"];
    note = "Verwaltung/Organisation: Zugriff nur fuer Agenda- und Verwaltungsformate.";
  } else {
    allowed = ["civic"];
    note = "Buergerbereich: Zugriff fuer Beitraege und Projekte.";
  }

  return {
    allowed,
    note,
    lockLabels: {
      civic: "Buerger-Bereich",
      journalism: "Nur Journalismus/Medien",
      agenda: "Nur Verwaltung/Organisationen",
    },
    ctaHref: "/pricing",
    ctaLabel: "Upgrade",
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

function hasIntakeContext(context?: CreateIntakeContext | null): boolean {
  if (!context) return false;
  return (
    !!context.source ||
    !!context.signalTitle ||
    !!context.sourceUrl ||
    !!context.sourceLabel ||
    !!context.region ||
    !!context.scope ||
    !!context.clusterHint ||
    !!context.reviewState ||
    !!context.candidateId ||
    !!context.draftId ||
    !!context.reason
  );
}

export default function CreateClient({
  initialEntitlements,
  overview,
  dossierId,
  initialAnlassraumId,
  initialIntent,
  initialMode,
  initialText,
  initialIntakeContext,
}: CreateClientProps) {
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
    return "Uebergebener Kontext ist ungueltig und wurde nicht uebernommen.";
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

  const canonicalIntent: "statement" | "contribution" = entitlements.canSubmitContribution
    ? "contribution"
    : "statement";
  const canonicalCreateMode: CreateMode = canonicalIntent === "statement" ? "manual" : "source";
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
          setSelectionInfo("Ausgewaehlter Kontext ist veraltet oder nicht mehr verfuegbar.");
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "create_context_source_unavailable";
      setContextLoadState("error");
      setContextLoadError(message);
    }
  }, [selectedAnlassraumId]);

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
        Lade deinen Zugang ...
      </main>
    );
  }
  if (gate.status === "anon") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        Bitte melde dich an, um eine Analyse zu starten.
      </main>
    );
  }
  if (gate.status === "blocked") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        Dein aktuelles Paket erlaubt keine Einreichung.
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

  const afterFinalizeNavigateTo = dossierId ? `/dossier/${dossierId}` : "/runden";
  const useCaseAccess = deriveUseCaseAccess(overview);
  const selectedContext = selectedAnlassraumId
    ? contextItems.find((item) => item.anlassraumId === selectedAnlassraumId) ?? null
    : null;
  const effectiveSelectedAnlassraumId = canonicalIntent === "statement" ? null : selectedAnlassraumId;

  const tierCfg = getAccessTierConfigForUser(overview);
  const tierLabel = getUserAccessTier(overview);
  const monthlyLimit = tierCfg.monthlyContributionLimit;
  const credits = entitlements.contributionCredits;

  const hasLegacyModeParam = Boolean(initialMode);
  const showIntakeContext = hasIntakeContext(initialIntakeContext);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Create Freistart</p>
          <h2
            className="text-2xl font-semibold leading-tight md:text-3xl"
            style={{
              backgroundImage: "linear-gradient(120deg,var(--brand-cyan),var(--brand-blue))",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Freistart fuer Anlassraum- und Dossier-Flows
          </h2>
          <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
            Ein gemeinsamer Einstieg: Text, Zitat, Quelle/URL oder Material. Die Plattform fuehrt danach immer durch
            Intake, Pruef-/Qualitaet, Graph-Matching und CTA-Routing.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
            <span className="vog-chip">Freistart</span>
            <span className="vog-chip">Intake</span>
            <span className="vog-chip">Pruef/Qualitaet</span>
            <span className="vog-chip">Graph-Matching</span>
            <span className="vog-chip">CTA/Routing</span>
            <span className="vog-chip">no auto publish</span>
            <span className="vog-chip">no silent merge</span>
          </div>
        </div>
      </section>

      {hasLegacyModeParam ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Legacy-Mode-Parameter erkannt (<code>{legacyMode}</code>) und aus Kompatibilitaetsgruenden gelesen.
          Der kanonische Einstieg bleibt Freistart; ein sichtbarer Primarsplit ist nicht mehr Ziel-UX.
        </section>
      ) : null}

      {showIntakeContext ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              Intake-Kontext
            </p>
            <p className="text-sm text-[rgb(var(--muted))]">
              Kontext wurde aus dem vorgelagerten Signal-/Review-Flow uebernommen und dient als manueller Startpunkt.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
            {initialIntakeContext?.source ? <span className="vog-chip">source: {initialIntakeContext.source}</span> : null}
            {initialIntakeContext?.signalTitle ? (
              <span className="vog-chip">signal: {initialIntakeContext.signalTitle}</span>
            ) : null}
            {initialIntakeContext?.sourceLabel ? (
              <span className="vog-chip">quelle: {initialIntakeContext.sourceLabel}</span>
            ) : null}
            {initialIntakeContext?.region ? <span className="vog-chip">region: {initialIntakeContext.region}</span> : null}
            {initialIntakeContext?.scope ? (
              <span className="vog-chip">
                relevanzraum: {formatRelevanceScopeLabel(initialIntakeContext.scope, initialIntakeContext.scope)}
              </span>
            ) : null}
            {initialIntakeContext?.clusterHint ? (
              <span className="vog-chip">cluster: {initialIntakeContext.clusterHint}</span>
            ) : null}
            {initialIntakeContext?.reviewState ? (
              <span className="vog-chip">review: {initialIntakeContext.reviewState}</span>
            ) : null}
            {initialIntakeContext?.candidateId ? (
              <span className="vog-chip">candidateId: {initialIntakeContext.candidateId}</span>
            ) : null}
            {initialIntakeContext?.draftId ? <span className="vog-chip">draftId: {initialIntakeContext.draftId}</span> : null}
            {initialIntakeContext?.reason ? <span className="vog-chip">handoff: {initialIntakeContext.reason}</span> : null}
            {initialIntakeContext?.sourceUrl ? (
              <a
                href={initialIntakeContext.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="vog-chip border border-[rgb(var(--border))] bg-transparent"
              >
                Quelle oeffnen
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {pickerEnabled ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Kontext-Picker</p>
            <p className="text-sm text-[rgb(var(--muted))]">
              Optional: Waehle einen bestehenden Anlassraum als Kontext. Kontext kann spaeter auch als Match-/Routing-Ergebnis
              sichtbar werden. Keine automatische Verlinkung, kein Auto-Publish, kein Auto-Merge.
            </p>
          </div>

          {contextLoadState === "loading" ? (
            <p className="mt-3 text-sm text-[rgb(var(--muted))]">Lade produktive Kontextliste ...</p>
          ) : null}

          {contextLoadState === "error" ? (
            <div className="mt-3 rounded-xl border border-rose-300/50 bg-rose-50/80 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              <p>Kontextquelle derzeit nicht verfuegbar ({contextLoadError ?? "create_context_source_unavailable"}).</p>
              <button type="button" onClick={() => void loadContextItems()} className="btn-secondary mt-2 text-xs">
                Erneut laden
              </button>
            </div>
          ) : null}

          {contextLoadState === "ready" && contextItems.length === 0 ? (
            <p className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
              Keine produktiven Kontext-Eintraege verfuegbar. Es wird kein Demo-/Static-Fallback genutzt.
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
                        {item.topicKey ? `Topic: ${item.topicKey} · ` : ""}
                        {item.anlassraumStatus ? `Status: ${item.anlassraumStatus}` : "Status: offen"}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {selectedContext ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
              <span className="vog-chip">Ausgewaehlt: {selectedContext.title}</span>
              <span className="vog-chip">anlassraumId: {selectedContext.anlassraumId}</span>
              <button
                type="button"
                className="vog-chip border border-[rgb(var(--border))] bg-transparent"
                onClick={() => setSelectedAnlassraumId(null)}
              >
                Auswahl entfernen
              </button>
            </div>
          ) : null}

          {selectionInfo ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{selectionInfo}</p>
          ) : null}
        </section>
      ) : null}

      <details className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">Kontingente und Zugriff</summary>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
          <span className="vog-chip">Tier: {tierLabel}</span>
          <span className="vog-chip">Credits: {credits}</span>
          {monthlyLimit === null ? (
            <span className="vog-chip">Monatslimit: unbegrenzt</span>
          ) : (
            <span className="vog-chip">Monatslimit: {monthlyLimit}</span>
          )}
          <span className="vog-chip">Max. Claims: {maxFinalizeClaims}</span>
          <Link href="/runden" className="vog-chip">
            Zu /runden
          </Link>
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
