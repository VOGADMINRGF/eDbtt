import type { ReactNode } from "react";
import { PublicCommunitySourceSubmissionForm } from "@/features/participation/PublicCommunitySourceSubmissionForm";
import type { PublicParticipationSpaceRuntimeDetail } from "@/features/participation/publicParticipationSpaceRuntime";

function formatPublicTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function PublicParticipationSpaceShell(props: {
  detail: PublicParticipationSpaceRuntimeDetail;
}) {
  const { detail } = props;
  const canAcceptPublicSubmission = detail.source === "runtime";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-500/20 bg-[linear-gradient(140deg,rgba(2,6,23,0.96),rgba(15,23,42,0.92),rgba(8,47,73,0.92))] p-6 text-white shadow-[0_28px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_32%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.95fr)] lg:gap-8">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">
                Öffentlicher Beteiligungsraum
              </p>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.85rem]">
                {detail.title}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                {detail.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <HeroBadge>{detail.statusLabel}</HeroBadge>
              <HeroBadge>{detail.visibilityLabel}</HeroBadge>
              <HeroBadge>Read-only Beteiligungsstand</HeroBadge>
              <HeroBadge>{detail.sourceBadgeLabel}</HeroBadge>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-200/90">
              {detail.publicLabel} {detail.contextNotice}
            </p>
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroStatusCard
              label="Beteiligungsstand"
              value={detail.publicHeadline}
              detail={detail.publicStatusLabel}
            />
            <HeroStatusCard
              label="Letzte Aktualisierung"
              value={formatPublicTimestamp(detail.updatedAt)}
              detail="Zuletzt für die öffentliche Anzeige vorbereitet"
            />
            <HeroStatusCard
              label="Transparenzrahmen"
              value="Öffentlich lesbar"
              detail="Keine versteckten Review-Inhalte, keine automatische Veröffentlichung"
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
            {detail.publicHeadline}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {detail.publicSummary}
          </p>
          {detail.participationQuestion ? (
            <p className="mt-4 text-sm leading-6 text-[rgb(var(--fg))]">
              <span className="font-semibold">Leitfrage:</span> {detail.participationQuestion}
            </p>
          ) : null}
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <SummaryMetricCard label="Offene Fragen" value={detail.openQuestionCount} />
            <SummaryMetricCard label="Nächste Schritte" value={detail.nextStepCount} />
            <SummaryMetricCard
              label="Minderheitenpositionen"
              value={detail.minorityPositionCount}
            />
            <SummaryMetricCard
              label="Letzte Aktualisierung"
              value={formatPublicTimestamp(detail.updatedAt)}
              valueClassName="text-base sm:text-lg"
            />
          </dl>
        </article>

        <aside className="rounded-[1.75rem] border border-sky-500/15 bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Trust & Guardrails
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <GuardrailCard
              title="Einordnung, keine amtliche Entscheidung"
              detail={detail.contextNotice}
            />
            <GuardrailCard
              title="Review-Inhalte bleiben verborgen"
              detail={detail.sourceNotice}
            />
            <GuardrailCard
              title="Ortsangaben sicherheitsbewusst"
              detail="Öffentliche Ortsbezüge werden nur angezeigt, wenn sie geprüft und für die Anzeige geeignet sind."
            />
            <GuardrailCard
              title="Keine automatische Veröffentlichung"
              detail={detail.releaseNotice}
            />
          </div>
        </aside>
      </section>

      {detail.feedbackTitle && detail.feedbackSummary ? (
        <section className="rounded-[1.75rem] border border-sky-500/15 bg-[linear-gradient(180deg,rgba(14,165,233,0.08),rgba(15,23,42,0.01)),rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Öffentliche Rückmeldung
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
            {detail.feedbackTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {detail.feedbackSummary}
          </p>
          {detail.topicSummaries.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {detail.topicSummaries.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600">
                    Öffentliche Einordnung
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                    {item.summary}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[rgb(var(--muted))]">
              Weitere öffentliche Detailbausteine erscheinen erst nach Prüfung und Freigabe.
            </p>
          )}
        </section>
      ) : detail.feedbackNotice ? (
        <section className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Noch keine öffentliche Rückmeldung
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {detail.feedbackNotice}
          </p>
        </section>
      ) : null}

      {canAcceptPublicSubmission ? (
        <PublicCommunitySourceSubmissionForm
          participationSpaceId={detail.id}
          participationSpaceSlug={detail.slug}
          participationSpaceTitle={detail.title}
        />
      ) : (
        <section
          className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm"
          data-testid="public-community-source-submission-fallback"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Öffentliche Hinweise noch nicht aktiv
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
            Hinweise zu diesem Raum
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            Hinweise können erst eingereicht werden, wenn dieser Beteiligungsraum
            als veröffentlichte Runtime vorliegt. Die klar gekennzeichnete
            Preview-Lesart bleibt deshalb ohne aktiven öffentlichen Submit.
          </p>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <article className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Offene Fragen
          </p>
          {detail.openQuestions.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {detail.openQuestions.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm leading-6 text-[rgb(var(--fg))]"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              Weitere Räume erscheinen erst nach Prüfung und Freigabe. Öffentliche offene Fragen werden nur sichtbar, wenn sie explizit öffentlich aufbereitet wurden.
            </p>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Ortsbezug
          </p>
          {detail.place ? (
            <div className="mt-3 space-y-3">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
                {detail.place.label}
              </h2>
              <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                {detail.place.description}
              </p>
              <p className="inline-flex w-fit rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                Anzeigeform: {detail.place.displayModeLabel}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              Öffentliche Ortsangaben werden nur angezeigt, wenn sie geprüft und sicherheitsbewusst freigegeben sind.
            </p>
          )}
        </article>
      </section>

      {detail.minorityPositions.length > 0 || detail.nextSteps.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {detail.minorityPositions.length > 0 ? (
            <article className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
                Minderheitenpositionen bleiben sichtbar
              </p>
              <ul className="mt-4 grid gap-3">
                {detail.minorityPositions.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                  >
                    <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                      {item.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {detail.nextSteps.length > 0 ? (
            <article className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
                Nächste Schritte
              </p>
              <ul className="mt-4 grid gap-3">
                {detail.nextSteps.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                  >
                    <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{item.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[rgb(var(--muted))]">
                Rückmeldungen bleiben Einordnungen und nächste Arbeitsschritte, keine Zustimmung oder politische Lösung.
              </p>
            </article>
          ) : null}
        </section>
      ) : null}
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
  valueClassName = "text-2xl",
}: {
  label: string;
  value: number | string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <dt className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
        {label}
      </dt>
      <dd className={`mt-2 font-semibold text-[rgb(var(--fg))] ${valueClassName}`}>
        {String(value)}
      </dd>
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
