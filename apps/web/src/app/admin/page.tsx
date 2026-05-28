import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import {
  buildOperatorConsoleReadModel,
  type OperatorConsoleArea,
  type OperatorConsoleMetric,
} from "@/features/admin/operatorConsoleReadModel";

export const metadata = {
  title: "Admin Dashboard · eDebatte",
};

const FOOTER_LINKS = [
  { label: "Pricing Orders", href: "/admin/pricing/orders" },
  { label: "Freischaltungen", href: "/admin/entitlements" },
  { label: "Organisationssicht", href: "/account/organization/dashboard" },
  { label: "Graph Repairs (aktiv)", href: "/admin/graph/repairs" },
] as const;

function areaTone(area: OperatorConsoleArea["state"]) {
  switch (area) {
    case "attention":
      return "border-rose-200 bg-rose-50";
    case "review":
      return "border-amber-200 bg-amber-50";
    case "ok":
      return "border-emerald-200 bg-emerald-50";
    case "inactive":
    default:
      return "border-[rgb(var(--border))] bg-[rgb(var(--card))]";
  }
}

function stateBadgeTone(area: OperatorConsoleArea["state"]) {
  switch (area) {
    case "attention":
      return "border-rose-300 bg-white text-rose-800";
    case "review":
      return "border-amber-300 bg-white text-amber-800";
    case "ok":
      return "border-emerald-300 bg-white text-emerald-800";
    case "inactive":
    default:
      return "border-[rgb(var(--border))] bg-white text-[rgb(var(--muted))]";
  }
}

function MetricList({ metrics }: { metrics: OperatorConsoleMetric[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={`${metric.label}:${metric.value}`}
          className="rounded-2xl border border-[rgb(var(--border))] bg-white/80 px-3 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {metric.label}
          </p>
          <p className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">{String(metric.value)}</p>
        </div>
      ))}
    </div>
  );
}

function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">{String(value)}</p>
    </article>
  );
}

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  const userId = user?._id?.toHexString?.() ?? null;

  if (!user || !user.sessionValid || !userId) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }
  if (!userIsAdminDashboard(user)) {
    redirect("/account/organization/dashboard");
  }

  const readModel = await buildOperatorConsoleReadModel({ userId });

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Admin Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">Steuerzentrale</h1>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Ruhige Operator-Konsole über bestehenden Admin-Flächen für Themenradar, Feed Health, Review Queue,
          Material Jobs, Dossier Updates, Social Queue und Freischaltungen.
        </p>
        <p className="mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Betreiber-Modus aktiv: globale Sicht mit ehrlichen Betriebszuständen statt Demo-KPIs.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <HeroMetric label="Offene Operator-Aufgaben" value={readModel.hero.openOperatorTasks} />
        <HeroMetric label="Fehlerhafte Quellen" value={readModel.hero.sourceFailures} />
        <HeroMetric label="Wartende Material-Jobs" value={readModel.hero.waitingMaterialJobs} />
        <HeroMetric label="Dossier-Hinweise in Prüfung" value={readModel.hero.pendingDossierUpdates} />
        <HeroMetric label="Social-Review offen" value={readModel.hero.socialQueueReviewOpen} />
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Nächste sichere Schritte
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">Keine neue Admin-Welt, nur echte Wege</h2>
          </div>
          <p className="max-w-2xl text-sm text-[rgb(var(--muted))]">
            Alle Aktionen verlinken auf vorhandene Arbeitsrouten. Keine Fake-Buttons, keine Rohdatenwand und keine
            neuen Backend-Pfade.
          </p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {readModel.nextActions.map((action) => (
            <Link
              key={`${action.sourceArea}:${action.href}`}
              href={action.href}
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:border-sky-200"
            >
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{action.label}</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {readModel.areas.map((area) => (
          <article
            key={area.key}
            className={`rounded-3xl border p-5 ${areaTone(area.state)}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                  {area.title}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">{area.stateLabel}</h2>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stateBadgeTone(area.state)}`}
              >
                {area.title}
              </span>
            </div>
            <p className="mt-3 text-sm text-[rgb(var(--muted))]">{area.summary}</p>
            <div className="mt-4">
              <MetricList metrics={area.metrics} />
            </div>
            <p className="mt-4 text-sm text-[rgb(var(--muted))]">{area.guardrail}</p>
            <div className="mt-4">
              <Link
                href={area.href}
                className="inline-flex rounded-full border border-sky-500/40 bg-white px-4 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-400 hover:text-sky-900"
              >
                {area.actionLabel}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Weitere Betreiberbereiche
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FOOTER_LINKS.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--muted))] transition hover:border-sky-200 hover:text-[rgb(var(--fg))]"
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
