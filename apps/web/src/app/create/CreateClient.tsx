"use client";

import * as React from "react";
import Link from "next/link";
import AnalyzeWorkspace, { type UseCaseAccess, type UseCaseId } from "@/components/analyze/AnalyzeWorkspace";
import type { AccountOverview } from "@features/account/types";
import { getAccessTierConfigForUser, getUserAccessTier } from "@core/access/accessTiers";
import type { CreateEntitlements } from "@/lib/server/entitlements/createEntitlements";
import type { CreateMode } from "@/features/create/intents";

export type CreateClientProps = {
  initialEntitlements: CreateEntitlements;
  overview: AccountOverview;
  dossierId?: string | null;
  initialIntent?: "statement" | "contribution";
  initialMode?: CreateMode;
  initialText?: string | null;
};

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

function modeToIntent(mode: CreateMode, canContribution: boolean): "statement" | "contribution" {
  if (mode === "manual") return "statement";
  return canContribution ? "contribution" : "statement";
}

function inferInitialMode(
  initialMode: CreateMode | undefined,
  initialIntent: "statement" | "contribution" | undefined,
): CreateMode {
  if (initialMode) return initialMode;
  if (initialIntent === "statement") return "manual";
  return "source";
}

export default function CreateClient({
  initialEntitlements,
  overview,
  dossierId,
  initialIntent,
  initialMode,
  initialText,
}: CreateClientProps) {
  const [entitlements, setEntitlements] = React.useState<CreateEntitlements>(initialEntitlements);
  const [gate, setGate] = React.useState<GateState>(() => deriveGate(initialEntitlements));
  const [mode, setMode] = React.useState<CreateMode>(() => inferInitialMode(initialMode, initialIntent));
  const [intent, setIntent] = React.useState<"statement" | "contribution">(() => {
    if (initialIntent) return initialIntent;
    return modeToIntent(inferInitialMode(initialMode, initialIntent), initialEntitlements.canSubmitContribution);
  });

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

  React.useEffect(() => {
    const nextIntent = modeToIntent(mode, entitlements.canSubmitContribution);
    if (intent !== nextIntent) {
      setIntent(nextIntent);
    }
  }, [mode, entitlements.canSubmitContribution, intent]);

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

  const modeRequiresContribution = mode !== "manual";
  const canContribution = entitlements.canSubmitContribution;
  const contributionBlocked = modeRequiresContribution && !canContribution;

  const maxClaimsCap =
    intent === "statement"
      ? Math.min(entitlements.maxVisibleAiProposals, 3)
      : mode === "source"
        ? Math.min(entitlements.maxVisibleAiProposals, 8)
        : entitlements.maxVisibleAiProposals;

  const maxFinalizeClaims =
    intent === "statement"
      ? 1
      : mode === "source"
        ? Math.min(entitlements.maxFinalizeClaimsPerInput, 4)
        : entitlements.maxFinalizeClaimsPerInput;

  const afterFinalizeNavigateTo = dossierId ? `/dossier/${dossierId}` : "/runden";
  const useCaseAccess = deriveUseCaseAccess(overview);

  const tierCfg = getAccessTierConfigForUser(overview);
  const tierLabel = getUserAccessTier(overview);
  const monthlyLimit = tierCfg.monthlyContributionLimit;
  const credits = entitlements.contributionCredits;

  const modeCards: Array<{ id: CreateMode; title: string; body: string }> = [
    {
      id: "manual",
      title: "Manuell",
      body: "Direkt selbst formulieren. KI bleibt optional ueber Analyse.",
    },
    {
      id: "source",
      title: "Aus Quelle",
      body: "Aus Artikel, Stream oder Notiz strukturiert in eine Runde ueberfuehren.",
    },
    {
      id: "feed",
      title: "Feed-Treffer",
      body: "Aus Ingest-Items einen Anlassraum und danach Outputs erzeugen.",
    },
    {
      id: "cluster",
      title: "Themencluster",
      body: "Mehrere Quellen nach Region/Zeitraum/Thema gemeinsam strukturieren.",
    },
    {
      id: "ai_assist",
      title: "KI-Assist",
      body: "Vorschlaege fuer Claims, Fragen, Segmente und Gegenpositionen.",
    },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 md:p-5">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Runden-Setup</p>
          <h2
            className="text-2xl font-semibold leading-tight md:text-3xl"
            style={{
              backgroundImage: "linear-gradient(120deg,var(--brand-cyan),var(--brand-blue))",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Neue Runde starten
          </h2>
          <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
            Ein Einstieg, fuenf Modi: manuell, Quelle, Feed, Cluster und KI-Assist. Die Erstellung bleibt im selben Flow.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
            <span className="vog-chip">1 Modus waehlen</span>
            <span className="vog-chip">2 Inhalt strukturieren</span>
            <span className="vog-chip">3 Runde finalisieren</span>
          </div>
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-3">
        {modeCards.map((entry) => {
          const active = mode === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setMode(entry.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] ${
                active
                  ? "border-[rgb(var(--grad-from))] bg-[rgb(var(--bg))]"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--grad-from))]/50"
              }`}
              aria-pressed={active}
            >
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{entry.title}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{entry.body}</p>
            </button>
          );
        })}
      </section>

      {mode === "manual" ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Du schreibst selbst vor. Die Analyse bleibt optional und dient nur zur Strukturhilfe.
        </section>
      ) : null}

      {mode === "source" ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Quelle zuerst: gib Link, Auszug oder Notiz ein. Der Flow uebernimmt Struktur und erzeugt daraus Vorschlaege fuer die Runde.
        </section>
      ) : null}

      {mode === "feed" ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Feed-Treffer zuerst: ueberfuehre ingestierte Quellen in einen Anlassraum und waehle danach den passenden Output (Runde, Dossier, Embed, Social).
        </section>
      ) : null}

      {mode === "cluster" ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Cluster-Modus: gruppiere mehrere Quellen in einem Zeitfenster zu einem gemeinsamen Anlassraum mit Konfliktlinien.
        </section>
      ) : null}

      {mode === "ai_assist" ? (
        <section className="rounded-2xl border border-[rgb(var(--grad-from))]/35 bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          KI-Modus nutzt die bestehende Analyse-Route <code>/api/contributions/analyze</code>. Ergebnis bleibt editierbar, bevor du finalisierst.
        </section>
      ) : null}

      {contributionBlocked ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))]">
          <p>
            Beitragseinreichung ist in deinem Paket aktuell gesperrt. Du kannst weiterhin im manuellen Modus arbeiten.
          </p>
          <button type="button" onClick={() => setMode("manual")} className="btn-secondary mt-3 text-xs">
            Auf Manuell wechseln
          </button>
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
        key={`${mode}-${intent}-${dossierId ?? "no-dossier"}`}
        mode={intent}
        defaultLevel={
          mode === "manual"
            ? 1
            : mode === "source" || mode === "feed"
              ? 2
              : 3
        }
        storageKey={
          mode === "manual"
            ? "vog_create_manual_statement_v1"
            : mode === "source"
              ? "vog_create_source_contribution_v1"
              : mode === "feed"
                ? "vog_create_feed_contribution_v1"
                : mode === "cluster"
                  ? "vog_create_cluster_contribution_v1"
                  : "vog_create_ai_assist_contribution_v1"
        }
        analyzeEndpoint="/api/create/analyze"
        saveEndpoint="/api/create/save"
        finalizeEndpoint="/api/create/finalize"
        afterFinalizeNavigateTo={afterFinalizeNavigateTo}
        dossierId={dossierId ?? undefined}
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
