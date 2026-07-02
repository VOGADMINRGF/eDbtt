import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import {
  buildOperatorConsoleReadModel,
  type OperatorConsoleArea,
  type OperatorConsoleMetric,
} from "@/features/admin/operatorConsoleReadModel";
import {
  buildV3ControlCenterReadModel,
  type V3CapabilityEntry,
  type V3CapabilityStatus,
  type V3ControlCenterReadModel,
} from "@/features/admin/v3ControlCenterReadModel";
import {
  buildV3HandoffLinkageMap,
  type V3HandoffLink,
  type V3HandoffLinkStatus,
  type V3HandoffLinkageMap,
} from "@/features/admin/v3HandoffLinkageMap";

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

function v3StatusBadgeTone(status: V3CapabilityStatus) {
  switch (status) {
    case "live":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "production_ready":
      return "border-sky-300 bg-sky-50 text-sky-900";
    case "endstate_ready":
      return "border-cyan-300 bg-cyan-50 text-cyan-900";
    case "operational_basic":
      return "border-violet-300 bg-violet-50 text-violet-900";
    case "partially_built":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "docs_only":
      return "border-slate-300 bg-slate-100 text-slate-800";
    case "missing":
    default:
      return "border-rose-300 bg-rose-50 text-rose-900";
  }
}

function v3StatusLabel(status: V3CapabilityStatus) {
  switch (status) {
    case "missing":
      return "missing";
    case "docs_only":
      return "docs_only";
    case "partially_built":
      return "partially_built";
    case "operational_basic":
      return "operational_basic";
    case "endstate_ready":
      return "endstate_ready";
    case "production_ready":
      return "production_ready";
    case "live":
      return "live";
    default:
      return status;
  }
}

function V3SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-white/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{String(value)}</p>
    </article>
  );
}

function CapabilityLink({
  href,
  label,
  fallbackLabel = "Noch nicht als Admin-Fläche vorhanden",
}: {
  href?: string;
  label?: string;
  fallbackLabel?: string;
}) {
  if (!href || !label) {
    return (
      <span className="rounded-full border border-dashed border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--muted))]">
        {fallbackLabel}
      </span>
    );
  }

  if (href === "/admin") {
    return (
      <span className="rounded-full border border-[rgb(var(--border))] bg-white px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))]">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 transition hover:border-sky-400"
    >
      {label}
    </Link>
  );
}

function v3HandoffStatusBadgeTone(status: V3HandoffLinkStatus) {
  switch (status) {
    case "wired":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "partially_wired":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "planned":
      return "border-sky-300 bg-sky-50 text-sky-900";
    case "docs_only":
      return "border-slate-300 bg-slate-100 text-slate-800";
    case "blocked":
    default:
      return "border-rose-300 bg-rose-50 text-rose-900";
  }
}

function v3HandoffStatusLabel(status: V3HandoffLinkStatus) {
  switch (status) {
    case "wired":
      return "wired";
    case "partially_wired":
      return "partially_wired";
    case "planned":
      return "planned";
    case "docs_only":
      return "docs_only";
    case "blocked":
      return "blocked";
    default:
      return status;
  }
}

function V3CapabilityCard({
  capability,
}: {
  capability: V3CapabilityEntry;
}) {
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-white/80 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {capability.label}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{capability.currentReality}</p>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${v3StatusBadgeTone(capability.status)}`}
        >
          {v3StatusLabel(capability.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Ziel</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{capability.maturityTarget}</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{capability.openGap}</p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Nächster Slice
          </p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{capability.nextSliceId}</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            {capability.isEndstateReady
              ? "Diese Capability gilt fachlich bereits als zielreif."
              : "Folgepfad offen, bis mindestens endstate_ready erreicht ist."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <CapabilityLink href={capability.primaryAdminHref} label={capability.primaryAdminLabel} />
        {capability.secondaryHref && capability.secondaryLabel ? (
          <CapabilityLink href={capability.secondaryHref} label={capability.secondaryLabel} />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {capability.guardrailNotes.map((note) => (
          <span
            key={`${capability.id}:${note}`}
            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
          >
            {note}
          </span>
        ))}
      </div>
    </article>
  );
}

function V3ControlCenterSection({
  readModel,
}: {
  readModel: V3ControlCenterReadModel;
}) {
  const visibleStatuses = (Object.entries(readModel.summary.byStatus) as Array<[V3CapabilityStatus, number]>).filter(
    ([, count]) => count > 0,
  );

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            V3 Control Center
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">V3-Reife sichtbar machen</h2>
          <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Dieses Control Center bündelt bestehende Admin-, Review-, Ops-, Pricing-, Entitlement-, Telemetry-,
            Asset- und Validierungsflächen. Es zeigt reale V3-Basen, aber simuliert keine fehlende Runtime.
          </p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          partially_built ist kein Endstand
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <V3SummaryCard label="Capabilities gesamt" value={readModel.summary.total} />
        {visibleStatuses.map(([status, count]) => (
          <V3SummaryCard key={status} label={v3StatusLabel(status)} value={count} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {readModel.guardrails.map((note) => (
          <span
            key={note}
            className="rounded-full border border-[rgb(var(--border))] bg-white px-3 py-1.5 text-xs font-semibold text-[rgb(var(--muted))]"
          >
            {note}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {readModel.capabilities.map((capability) => (
          <V3CapabilityCard key={capability.id} capability={capability} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Nächste empfohlene Schritte
          </p>
          <div className="mt-3 grid gap-3">
            {readModel.nextRecommendedSteps.map((step, index) => (
              <article
                key={step.sliceId}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3"
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {index + 1}. {step.label}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                  {step.sliceId}
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{step.reason}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[rgb(var(--border))] bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {readModel.liveClaimsReminder.title}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{readModel.liveClaimsReminder.body}</p>
          <ul className="mt-3 grid gap-2 text-sm text-[rgb(var(--fg))]">
            {readModel.liveClaimsReminder.bullets.map((entry) => (
              <li key={entry} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                {entry}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function V3HandoffLinkCard({
  link,
}: {
  link: V3HandoffLink;
}) {
  const fallbackLabel =
    link.status === "planned" || link.status === "docs_only"
      ? "Folgepfad offen"
      : "Kein sicherer Direktlink";

  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-white/80 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {link.label}
          </p>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
            {link.from} -&gt; {link.to}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${v3HandoffStatusBadgeTone(link.status)}`}
        >
          {v3HandoffStatusLabel(link.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Repo-Beleg
          </p>
          <ul className="mt-2 grid gap-2 text-xs text-[rgb(var(--muted))]">
            {link.currentEvidence.map((entry) => (
              <li
                key={`${link.id}:evidence:${entry}`}
                className="rounded-2xl border border-[rgb(var(--border))] bg-white px-3 py-2 break-all"
              >
                {entry}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Tests</p>
          <ul className="mt-2 grid gap-2 text-xs text-[rgb(var(--muted))]">
            {link.tests.map((entry) => (
              <li
                key={`${link.id}:test:${entry}`}
                className="rounded-2xl border border-[rgb(var(--border))] bg-white px-3 py-2 break-all"
              >
                {entry}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Gap</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{link.gap}</p>
        </section>

        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Nächster Slice
          </p>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{link.nextSliceId}</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            wired heißt sichtbar verdrahtet, nicht automatisch endstate_ready.
          </p>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {link.adminHref ? <CapabilityLink href={link.adminHref} label="Admin-Fläche" /> : null}
        {link.publicHref ? <CapabilityLink href={link.publicHref} label="Public-Fläche" /> : null}
        {!link.adminHref && !link.publicHref ? (
          <CapabilityLink fallbackLabel={fallbackLabel} />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {link.guardrails.map((note) => (
          <span
            key={`${link.id}:guardrail:${note}`}
            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
          >
            {note}
          </span>
        ))}
      </div>
    </article>
  );
}

function V3HandoffLinkageSection({
  readModel,
}: {
  readModel: V3HandoffLinkageMap;
}) {
  const summaryCards = [
    { label: "Links gesamt", value: readModel.summary.total },
    { label: "wired", value: readModel.summary.wired },
    { label: "partially_wired", value: readModel.summary.partiallyWired },
    { label: "planned", value: readModel.summary.planned },
    { label: "docs_only", value: readModel.summary.docsOnly },
    { label: "blocked", value: readModel.summary.blocked },
    { label: "endstate_ready", value: readModel.summary.endstateReadyCount },
    { label: "kritische Lücken", value: readModel.summary.needsAttentionCount },
  ];

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Handoff Integrity &amp; Linkage Map
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">Verknüpfungen sichtbar und prüfbar halten</h2>
          <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Die Map zeigt reale oder geplante Verbindungen zwischen Create, Review, Runtime, Publish, Public, QR,
            Social, Programm, Live und optionalem Meeting-Link-Kontext. Sie behauptet keine automatische Wahrheit.
          </p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {readModel.guardrailNote}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <V3SummaryCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {readModel.links.map((link) => (
          <V3HandoffLinkCard key={link.id} link={link} />
        ))}
      </div>

      <section className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Kritische nächste Lücken
        </p>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {readModel.criticalNextGaps.map((gap) => (
            <article
              key={gap.nextSliceId}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3"
            >
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{gap.label}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                {gap.nextSliceId}
              </p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">{gap.reason}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
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

  const [readModel, v3ControlCenter, v3HandoffLinkageMap] = await Promise.all([
    buildOperatorConsoleReadModel({ userId }),
    Promise.resolve(buildV3ControlCenterReadModel()),
    Promise.resolve(buildV3HandoffLinkageMap()),
  ]);

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

      <V3ControlCenterSection readModel={v3ControlCenter} />

      <V3HandoffLinkageSection readModel={v3HandoffLinkageMap} />

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
