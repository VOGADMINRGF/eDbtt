"use client";

import * as React from "react";
import AnalyzeWorkspace, { type UseCaseAccess, type UseCaseId } from "@/components/analyze/AnalyzeWorkspace";
import type { AccountOverview } from "@features/account/types";
import { getAccessTierConfigForUser, getUserAccessTier, hasUnlimitedContributions } from "@core/access/accessTiers";
import type { VerificationLevel } from "@core/auth/verificationTypes";

export type ContributionNewClientProps = {
  initialOverview: AccountOverview;
  dossierId?: string | null;
};

type GateState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "allowed"; overview: AccountOverview }
  | { status: "blocked"; overview: AccountOverview };

function deriveGateFromOverview(overview?: AccountOverview | null): GateState {
  if (!overview) return { status: "anon" };
  const cfg = getAccessTierConfigForUser(overview);
  const tier = getUserAccessTier(overview);
  const tierLimit = cfg.monthlyContributionLimit ?? 0;
  const hasCredits = (overview.stats?.contributionCredits ?? 0) > 0;
  const allowed = hasUnlimitedContributions(tier) || (tierLimit > 0 && hasCredits);
  return { status: allowed ? "allowed" : "blocked", overview };
}

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

export function ContributionNewClient({ initialOverview, dossierId }: ContributionNewClientProps) {
  const [verificationLevel, setVerificationLevel] = React.useState<VerificationLevel>(
    initialOverview?.verificationLevel ?? "none",
  );
  const [levelStatus, setLevelStatus] = React.useState<"loading" | "ok" | "login_required" | "error">(
    initialOverview ? "ok" : "login_required",
  );
  const [gate, setGate] = React.useState<GateState>(() =>
    initialOverview ? deriveGateFromOverview(initialOverview) : { status: "loading" },
  );

  React.useEffect(() => {
    let ignore = false;
    async function loadLevel() {
      try {
        const res = await fetch("/api/account/overview", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.overview) {
          if (ignore) return;
          const unauthorized = res.status === 401 || body?.error === "UNAUTHORIZED";
          setLevelStatus(unauthorized ? "login_required" : "error");
          if (unauthorized) setGate({ status: "anon" });
          return;
        }
        if (ignore) return;
        const overview = body.overview as AccountOverview;
        setVerificationLevel(overview.verificationLevel ?? "none");
        setLevelStatus("ok");
        setGate(deriveGateFromOverview(overview));
      } catch {
        if (ignore) return;
        setLevelStatus("error");
        if (!initialOverview) setGate({ status: "anon" });
      }
    }
    loadLevel();
    return () => {
      ignore = true;
    };
  }, []);

  if (gate.status === "loading") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-[rgb(var(--muted))]">
        Lade dein Profil …
      </main>
    );
  }
  if (gate.status === "anon") {
    return <ContributionGate variant="anon" overview={undefined} />;
  }
  if (gate.status === "blocked") {
    return <ContributionGate variant="blocked" overview={gate.overview} />;
  }

  const overview = gate.overview;
  const useCaseAccess = deriveUseCaseAccess(overview);
  const afterFinalizeNavigateTo = dossierId ? `/dossier/${dossierId}` : "/swipes";

  return (
    <>
      {dossierId ? (
        <div className="mb-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--fg))]">
          Dieser Beitrag wird dem Dossier zugeordnet:{" "}
          <span className="font-semibold">{dossierId}</span>.
        </div>
      ) : null}
      <AnalyzeWorkspace
        mode="contribution"
        defaultLevel={1}
        storageKey="vog_contribution_draft_v2"
        analyzeEndpoint="/api/contributions/analyze"
        saveEndpoint="/api/contributions/save"
        finalizeEndpoint="/api/contributions/finalize"
        afterFinalizeNavigateTo={afterFinalizeNavigateTo}
        verificationLevel={verificationLevel}
        verificationStatus={levelStatus}
        authorName={overview?.displayName ?? overview?.profile?.headline ?? ""}
        useCaseAccess={useCaseAccess}
      />
    </>
  );
}

type ContributionGateProps = {
  variant: "anon" | "blocked";
  overview?: AccountOverview;
};

function ContributionGate({ variant, overview }: ContributionGateProps) {
  const stats = overview?.stats;
  const tier = overview ? getUserAccessTier(overview) : "citizenBasic";
  const tierCfg = overview ? getAccessTierConfigForUser(overview) : null;
  const swipes = stats?.swipeCountTotal ?? 0;
  const credits = stats?.contributionCredits ?? 0;
  const xp = stats?.xp ?? 0;
  const levelLabel = (stats?.engagementLevel ?? "interessiert").toString();
  const nextCreditIn = stats?.nextCreditIn ?? 100;
  const tierLimit = tierCfg?.monthlyContributionLimit ?? 0;
  const tierLimitLabel = tierCfg?.monthlyContributionLimit === null ? "unbegrenzt" : tierLimit;

  const title =
    variant === "anon"
      ? "Registriere dich fuer deinen ersten Beitrag"
      : "Du brauchst einen Contribution-Credit oder citizenPremium+";
  const description =
    variant === "anon"
      ? "Mit einem kostenlosen citizenBasic-Konto sammelst du XP, Swipes und erhaelst nach 100 Swipes einen Contribution-Credit (1 Beitrag mit bis zu 3 Statements)."
      : `Freie Plaene erlauben ${tierLimit || 0} Beitraege/Monat. Du hast ${swipes} Swipes gesammelt – dir fehlen noch ${nextCreditIn} bis zum naechsten Credit oder du wechselst auf citizenPremium, citizenPro oder citizenUltra.`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="space-y-6 rounded-4xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Citizen Core Journey</p>
          <h1 className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">{title}</h1>
          <p className="mt-3 text-base text-[rgb(var(--muted))]">{description}</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Beim Abschicken eines Beitrags im Free-Plan wird genau 1 Contribution-Credit verbraucht.
          </p>
        </div>

        {stats && (
          <div className="grid gap-4 sm:grid-cols-2">
            <StatBox label="Plan" value={tier} hint="citizenPremium+ erlaubt unbegrenzt Contributions" />
            <StatBox label="Contribution-Credits" value={credits} hint="1 Credit = 1 Beitrag mit bis zu 3 Statements" />
            <StatBox label="XP & Level" value={`${xp} XP · ${levelLabel}`} hint="Swipes geben XP & steigern dein Level" />
            <StatBox label="Swipes" value={`${swipes} total`} hint={`Noch ${nextCreditIn} bis zum naechsten Credit`} />
            <StatBox label="Monatslimit" value={tierLimitLabel ?? tierLimit} hint="Beitraege pro Monat laut aktuellem Tier" />
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row">
          <a
            href="/swipes"
            className="flex-1 rounded-full bg-brand-grad px-5 py-3 text-center text-white font-semibold shadow-lg"
          >
            Weiter swipen
          </a>
          <a
            href="/pricing"
            className="flex-1 rounded-full border border-[rgb(var(--border))] px-5 py-3 text-center font-semibold text-[rgb(var(--muted))]"
          >
            Pakete & Preise
          </a>
        </div>
      </div>
    </main>
  );
}

function StatBox({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="text-xl font-semibold text-[rgb(var(--fg))]">{value}</p>
      {hint && <p className="text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </div>
  );
}
