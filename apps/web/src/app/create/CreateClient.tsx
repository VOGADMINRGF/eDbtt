"use client";

import * as React from "react";
import AnalyzeWorkspace, { type UseCaseAccess, type UseCaseId } from "@/components/analyze/AnalyzeWorkspace";
import type { AccountOverview } from "@features/account/types";
import { getAccessTierConfigForUser, getUserAccessTier } from "@core/access/accessTiers";
import type { CreateEntitlements } from "@/lib/server/entitlements/createEntitlements";

export type CreateClientProps = {
  initialEntitlements: CreateEntitlements;
  overview?: AccountOverview | null;
  dossierId?: string | null;
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

export default function CreateClient({
  initialEntitlements,
  overview,
  dossierId,
  initialText,
}: CreateClientProps) {
  const [entitlements, setEntitlements] = React.useState<CreateEntitlements>(initialEntitlements);
  const [gate, setGate] = React.useState<GateState>(() => deriveGate(initialEntitlements));

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

  if (gate.status === "loading") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        Lade deinen Zugang …
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

  const canContribution = entitlements.canSubmitContribution;
  const canStatement = entitlements.canSubmitStatement;
  const maxClaimsCap = entitlements.maxVisibleAiProposals;
  const maxFinalizeClaims = entitlements.maxFinalizeClaimsPerInput;
  const maxFinalizeClaimsStatement = 1;
  const afterFinalizeNavigateTo = dossierId ? `/dossier/${dossierId}` : "/swipes";
  const useCaseAccess = deriveUseCaseAccess(overview);

  const tierCfg = getAccessTierConfigForUser(overview ?? { accessTier: entitlements.tier as any });
  const tierLabel = getUserAccessTier(overview ?? { accessTier: entitlements.tier as any });
  const monthlyLimit = tierCfg.monthlyContributionLimit;
  const credits = entitlements.contributionCredits;
  const swipesPerCredit = entitlements.swipesPerCredit ?? 100;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Erstellen</p>
            <p className="text-sm text-[rgb(var(--fg))]">
              Buerger &amp; Projekte sind der Standard. Du entscheidest nach der Analyse, ob du als Statement
              veroeffentlichen oder als Beitrag einreichen willst.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[rgb(var(--muted))]">
          <span className="vog-chip">Tier: {tierLabel}</span>
          <span className="vog-chip">Credits: {credits}</span>
          {monthlyLimit === null ? (
            <span className="vog-chip">Monatslimit: unbegrenzt</span>
          ) : (
            <span className="vog-chip">Monatslimit: {monthlyLimit}</span>
          )}
          <span className="vog-chip">Statement max: {maxFinalizeClaimsStatement}</span>
          <span className="vog-chip">Beitrag max: {maxFinalizeClaims}</span>
        </div>

        <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Freemium-Hinweis</p>
          <p className="mt-1">
            Anmeldung erforderlich. Freikontingent: {monthlyLimit === null ? "unbegrenzt" : monthlyLimit} Eintrag(e) pro
            Monat. z. B. {swipesPerCredit} Swipes = 1 weiterer Credit.
          </p>
        </div>

        {!canContribution ? (
          <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
            Beitragseinreichung ist aktuell gesperrt.{" "}
            {entitlements.reasons.credits ?? entitlements.reasons.monthly_limit ?? ""}
          </p>
        ) : null}
        {!canStatement ? (
          <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
            Statements sind fuer dein Paket nicht freigeschaltet.
          </p>
        ) : null}

        {dossierId ? (
          <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
            Dieser Beitrag wird dem Dossier zugeordnet: <span className="font-semibold">{dossierId}</span>.
          </div>
        ) : null}
      </section>

      <AnalyzeWorkspace
        key={`create-${dossierId ?? "no-dossier"}`}
        mode="contribution"
        defaultLevel={1}
        storageKey="vog_contribution_draft_v2"
        analyzeEndpoint="/api/create/analyze"
        saveEndpoint="/api/create/save"
        finalizeEndpoint="/api/create/finalize"
        afterFinalizeNavigateTo={afterFinalizeNavigateTo}
        dossierId={dossierId ?? undefined}
        verificationLevel={overview?.verificationLevel ?? "none"}
        verificationStatus="ok"
        authorName={overview?.displayName ?? overview?.profile?.headline ?? ""}
        useCaseAccess={useCaseAccess}
        initialText={initialText ?? undefined}
        maxClaimsCap={maxClaimsCap}
        maxFinalizeClaims={maxFinalizeClaims}
        maxFinalizeClaimsStatement={maxFinalizeClaimsStatement}
        allowFinalizeAsStatement={canStatement}
        allowFinalizeAsContribution={canContribution}
      />
    </div>
  );
}
