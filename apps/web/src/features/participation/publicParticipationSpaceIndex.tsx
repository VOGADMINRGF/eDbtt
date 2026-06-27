import type { ReactNode } from "react";
import Link from "next/link";
import type { PublicParticipationSpaceFixture } from "@/features/participation/fixtures/publicParticipationSpace";
import { summarizeParticipationSpaceReadiness } from "@/features/participation/spaceContainer";

type Props = {
  fixtures: PublicParticipationSpaceFixture[];
};

function formatPublicTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function resolvePublicTeaserStatus(fixture: PublicParticipationSpaceFixture) {
  const { space } = fixture;
  if (space.status === "public_feedback_live" && space.publicSummary.feedbackAvailable) {
    return "Öffentliche Rückmeldung sichtbar";
  }
  if (space.status === "feedback_prepared") {
    return "Rückmeldung in Vorbereitung";
  }
  return "Öffentlicher Zwischenstand";
}

export function PublicParticipationSpaceIndex({ fixtures }: Props) {
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
                Öffentliche Beteiligungsräume
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                Read-only Übersicht über sichtbar vorbereitete Beteiligungsstände. Die Seite zeigt nur
                lokale Fixture-Räume, öffentliche Zusammenfassungen und sichere Statushinweise.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <HeroBadge>Öffentlich lesbar</HeroBadge>
              <HeroBadge>Read-only Übersicht</HeroBadge>
              <HeroBadge>Fixture-basiert</HeroBadge>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-200/90">
              Transparente Zwischenstände, keine amtlichen Entscheidungen und keine automatische Veröffentlichung.
            </p>
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroStatusCard
              label="Beteiligungsräume"
              value={String(fixtures.length)}
              detail="Lokal vorbereitete öffentliche Räume"
            />
            <HeroStatusCard
              label="Transparenzrahmen"
              value="Öffentlich lesbar"
              detail="Nur sichere Summary-Felder, keine internen Review-Inhalte"
            />
            <HeroStatusCard
              label="Detailroute"
              value="/beteiligung/[slug]"
              detail="Öffentliche Rückmeldungen bleiben auf den Detailseiten"
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
            Status- und Sichtbarkeitsrahmen sowie den Weg zur Detailseite.
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <SummaryMetricCard label="Räume gesamt" value={fixtures.length} />
            <SummaryMetricCard
              label="Mit öffentlicher Rückmeldung"
              value={fixtures.filter((fixture) => fixture.space.publicSummary.feedbackAvailable).length}
            />
            <SummaryMetricCard
              label="Rückmeldung vorbereitet"
              value={fixtures.filter((fixture) => fixture.space.status === "feedback_prepared").length}
            />
            <SummaryMetricCard
              label="Ohne öffentliche Rückmeldung"
              value={fixtures.filter((fixture) => !fixture.space.publicSummary.feedbackAvailable).length}
            />
          </dl>
        </article>

        <aside className="rounded-[1.75rem] border border-sky-500/15 bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Read-only Guardrails
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <GuardrailCard
              title="Nur sichere Summary-Felder"
              detail="Keine nicht öffentlichen Rückmeldedetails, offenen Fragen oder nächsten Schritte auf der Übersicht."
            />
            <GuardrailCard
              title="Keine versteckten Review-Inhalte"
              detail="Interne Workflow-, Queue- oder Operator-Begriffe erscheinen hier bewusst nicht."
            />
            <GuardrailCard
              title="Keine Karten- oder Geodaten"
              detail="Die Übersicht zeigt keine Marker, keine Ortskoordinaten und keine Kartenintegration."
            />
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fixtures.map((fixture) => {
          const { space } = fixture;
          const readiness = summarizeParticipationSpaceReadiness(space);
          return (
            <article
              key={space.id}
              className="flex h-full flex-col rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                  <IndexBadge>{resolvePublicTeaserStatus(fixture)}</IndexBadge>
                  <IndexBadge>{readiness.visibilityLabel}</IndexBadge>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">{space.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                    {space.summary}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600">
                    Öffentliche Übersicht
                  </p>
                  <p className="mt-2 text-base font-semibold text-[rgb(var(--fg))]">
                    {space.publicSummary.headline}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                    {space.publicSummary.shortSummary}
                  </p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <SummaryRow label="Status" value={readiness.statusLabel} />
                  <SummaryRow label="Sichtbarkeit" value={readiness.visibilityLabel} />
                  <SummaryRow label="Kurzstatus" value={space.publicSummary.statusLabel} />
                  <SummaryRow
                    label="Letzte Aktualisierung"
                    value={formatPublicTimestamp(space.publicSummary.lastUpdatedAt)}
                  />
                </dl>
              </div>

              <div className="mt-5">
                <Link
                  href={`/beteiligung/${space.slug}`}
                  className="inline-flex items-center rounded-full border border-sky-500/25 bg-[color-mix(in_oklab,rgb(var(--card))_82%,rgb(var(--bg))_18%)] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-sky-400 hover:text-sky-700"
                >
                  Beteiligungsraum ansehen
                </Link>
              </div>
            </article>
          );
        })}
      </section>
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
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[rgb(var(--fg))]">{value}</dd>
    </div>
  );
}
