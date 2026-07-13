import type { ReactNode } from "react";
import Link from "next/link";
import type {
  PublicParticipationSpaceRuntimeItem,
  PublicParticipationSpaceRuntimeStatus,
} from "@/features/participation/publicParticipationSpaceRuntime";
import { getPublicParticipationSourceLabel } from "@/features/participation/publicParticipationSpaceRuntime";

type Props = {
  items: PublicParticipationSpaceRuntimeItem[];
  status: PublicParticipationSpaceRuntimeStatus;
};

function formatPublicTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function resolveHeroCopy(status: PublicParticipationSpaceRuntimeStatus) {
  if (status.source === "runtime") {
    return "Read-only Übersicht über ausdrücklich öffentlich freigegebene Beteiligungsräume. Interne Review-, Audit- und Moderationsdaten bleiben verborgen.";
  }
  if (status.source === "fixture_fallback") {
    return "Noch liegt keine veröffentlichte Fassung vor. Deshalb bleibt eine klar gekennzeichnete Vorschau sichtbar, ohne sie als Produktivstand auszugeben.";
  }
  return "Weitere Räume erscheinen erst nach Prüfung und Freigabe. Die öffentliche Route bleibt read-only und erzeugt keine Veröffentlichung als Seiteneffekt.";
}

export function PublicParticipationSpaceIndex({ items, status }: Props) {
  const feedbackVisible = items.filter((item) => item.feedbackAvailable).length;
  const feedbackPrepared = items.filter(
    (item) => !item.feedbackAvailable,
  ).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-500/20 bg-[linear-gradient(140deg,rgba(2,6,23,0.96),rgba(15,23,42,0.92),rgba(8,47,73,0.92))] p-6 text-white shadow-[0_28px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_32%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.95fr)] lg:gap-8">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">
                Öffentlicher Beteiligungsbereich
              </p>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.85rem]">
                Öffentlich freigegebene Beteiligungsräume
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                {resolveHeroCopy(status)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <HeroBadge>Öffentlich lesbar</HeroBadge>
              <HeroBadge>Read-only Übersicht</HeroBadge>
              <HeroBadge>{getPublicParticipationSourceLabel(status.source)}</HeroBadge>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-200/90">
              Quellen- und Kontextangaben dienen der Einordnung, nicht als automatische Wahrheitsbestätigung.
            </p>
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroStatusCard
              label="Sichtbare Räume"
              value={String(items.length)}
              detail="Nur öffentliche und read-only sichtbare Einträge"
            />
            <HeroStatusCard
              label="Veröffentlicht"
              value={String(status.totalRuntimePublished)}
              detail="Explizit freigegebene öffentliche Räume"
            />
            <HeroStatusCard
              label="Detailroute"
              value="/beteiligung/[slug]"
              detail="Weitere Räume erscheinen erst nach Prüfung und Freigabe"
            />
          </aside>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
        <article className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Überblick
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
            Öffentliche Beteiligungsstände auf einen Blick
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            Jede Karte zeigt nur den sichtbaren Beteiligungsstand, die öffentliche Kurzbeschreibung,
            den Veröffentlichungsrahmen und den Weg zur Detailseite.
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <SummaryMetricCard label="Räume gesamt" value={items.length} />
            <SummaryMetricCard label="Mit öffentlicher Rückmeldung" value={feedbackVisible} />
            <SummaryMetricCard label="Ohne Detailrückmeldung" value={feedbackPrepared} />
            <SummaryMetricCard
              label="Datenquelle"
              value={getPublicParticipationSourceLabel(status.source)}
            />
          </dl>
        </article>

        <aside className="rounded-[1.75rem] border border-sky-500/15 bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Read-only Guardrails
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <GuardrailCard
              title="Nur veröffentlichte Räume"
              detail="Erstellung, interne Aktivierung und Veröffentlichungsfreigabe allein machen einen Raum noch nicht öffentlich."
            />
            <GuardrailCard
              title="Keine internen Prüfdetails"
              detail="Review-, Audit-, Abuse- und Trust-Interna erscheinen hier bewusst nicht."
            />
            <GuardrailCard
              title="Keine versteckte Mutation"
              detail="Die öffentliche Route liest nur und führt keine Aktivierung, Veröffentlichung oder Graph-Aktion aus."
            />
          </div>
        </aside>
      </section>

      {items.length === 0 ? (
        <section className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Noch keine veröffentlichten Räume
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {status.message}
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex h-full flex-col rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                  <IndexBadge>{item.publicStatusLabel}</IndexBadge>
                  <IndexBadge>{item.visibilityLabel}</IndexBadge>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600">
                    Öffentliche Übersicht
                  </p>
                  <p className="mt-2 text-base font-semibold text-[rgb(var(--fg))]">
                    {item.publicHeadline}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                    {item.publicSummary}
                  </p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <SummaryRow label="Veröffentlichung" value={item.statusLabel} />
                  <SummaryRow label="Sichtbarkeit" value={item.visibilityLabel} />
                  <SummaryRow label="Kurzstatus" value={item.publicStatusLabel} />
                  <SummaryRow
                    label="Letzte Aktualisierung"
                    value={formatPublicTimestamp(item.updatedAt)}
                  />
                </dl>
              </div>

              <div className="mt-5">
                <Link
                  href={`/beteiligung/${item.slug}`}
                  className="inline-flex items-center rounded-full border border-sky-500/25 bg-[color-mix(in_oklab,rgb(var(--card))_82%,rgb(var(--bg))_18%)] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-sky-400 hover:text-sky-700"
                >
                  Beteiligungsraum ansehen
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function HeroBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-slate-100 backdrop-blur">
      {children}
    </span>
  );
}

function HeroStatusCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100/80">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-200/80">{detail}</p>
    </article>
  );
}

function SummaryMetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <dt className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{String(value)}</dd>
    </div>
  );
}

function GuardrailCard({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-sky-500/15 bg-[color-mix(in_oklab,rgb(var(--card))_84%,rgb(var(--bg))_16%)] p-4">
      <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{detail}</p>
    </article>
  );
}

function IndexBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[rgb(var(--fg))]">
      {children}
    </span>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[rgb(var(--fg))]">{value}</dd>
    </div>
  );
}
