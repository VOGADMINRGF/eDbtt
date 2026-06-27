import type { ReactNode } from "react";
import {
  canShowParticipationPlacePublicly,
  getParticipationPlaceDisplayModeLabel,
} from "@/features/participation/placeFuture";
import type { PublicParticipationSpaceFixture } from "@/features/participation/fixtures/publicParticipationSpace";
import {
  isParticipationSpaceFeedbackPublic,
  summarizeParticipationSpaceReadiness,
} from "@/features/participation/spaceContainer";

type PublicParticipationSpaceShellViewModel = {
  readiness: ReturnType<typeof summarizeParticipationSpaceReadiness>;
  publicPlace: PublicParticipationSpaceFixture["place"];
  canShowFeedbackDetails: boolean;
  canShowPlace: boolean;
  canShowOpenQuestions: boolean;
  canShowMinorityPositions: boolean;
  canShowNextSteps: boolean;
  feedbackPreparationNotice: string | null;
  feedbackUnavailableNotice: string | null;
  heroTrustLine: string;
  safetyBadges: Array<{
    title: string;
    detail: string;
  }>;
  noPublicPlaceNotice: string;
  noPublicOpenQuestionsNotice: string;
  noPublicMinorityPositionsNotice: string;
  noPublicNextStepsNotice: string;
};

function formatPublicTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getPublicParticipationSpaceShellViewModel(
  fixture: PublicParticipationSpaceFixture,
): PublicParticipationSpaceShellViewModel {
  const { place, space } = fixture;
  const readiness = summarizeParticipationSpaceReadiness(space);
  const canShowFeedbackDetails = isParticipationSpaceFeedbackPublic(space);
  const publicPlace = place && canShowParticipationPlacePublicly(place) ? place : null;

  return {
    readiness,
    publicPlace,
    canShowFeedbackDetails,
    canShowPlace: publicPlace !== null,
    canShowOpenQuestions: canShowFeedbackDetails,
    canShowMinorityPositions: canShowFeedbackDetails,
    canShowNextSteps: canShowFeedbackDetails,
    feedbackPreparationNotice:
      !canShowFeedbackDetails && space.status === "feedback_prepared"
        ? "Eine öffentliche Rückmeldung ist vorbereitet, aber noch nicht als öffentliche Einordnung sichtbar."
        : null,
    feedbackUnavailableNotice:
      !canShowFeedbackDetails && space.status !== "feedback_prepared"
        ? "Für diesen Beteiligungsraum ist aktuell noch keine öffentliche Rückmeldung sichtbar."
        : null,
    heroTrustLine:
      "Transparenter Beteiligungsstand, keine amtliche Entscheidung und keine automatische Veröffentlichung.",
    safetyBadges: [
      {
        title: "Einordnung, keine amtliche Entscheidung",
        detail: "Sichtbare Rückmeldungen bleiben nachvollziehbare Einordnungen und ersetzen keine amtliche Bewertung.",
      },
      {
        title: "Review-Inhalte bleiben verborgen",
        detail: "Nicht öffentliche Prüfnotizen und interne Arbeitsschritte erscheinen hier bewusst nicht.",
      },
      {
        title: "Ortsangaben sicherheitsbewusst",
        detail: "Öffentliche Ortsbezüge werden nur angezeigt, wenn sie geprüft und für die Anzeige geeignet sind.",
      },
      {
        title: "Keine automatische Veröffentlichung",
        detail: "Sichtbarkeit zeigt einen öffentlichen Stand, nicht einen automatischen Veröffentlichungs- oder Freigabepfad.",
      },
    ],
    noPublicPlaceNotice:
      "Öffentliche Ortsangaben werden nur angezeigt, wenn sie geprüft und sicherheitsbewusst freigegeben sind.",
    noPublicOpenQuestionsNotice:
      "Aktuell sind keine öffentlichen offenen Fragen markiert.",
    noPublicMinorityPositionsNotice:
      "Aktuell sind keine öffentlichen Minderheitenpositionen hervorgehoben.",
    noPublicNextStepsNotice:
      "Aktuell sind keine öffentlichen nächsten Schritte veröffentlicht.",
  };
}

export function PublicParticipationSpaceShell(props: {
  fixture: PublicParticipationSpaceFixture;
}) {
  const { feedback, space } = props.fixture;
  const viewModel = getPublicParticipationSpaceShellViewModel(props.fixture);

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
                {space.title}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                {space.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <HeroBadge>{viewModel.readiness.statusLabel}</HeroBadge>
              <HeroBadge>{viewModel.readiness.visibilityLabel}</HeroBadge>
              <HeroBadge>Read-only Beteiligungsstand</HeroBadge>
              <HeroBadge>Fixture-basiert</HeroBadge>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-200/90">
              {viewModel.heroTrustLine}
            </p>
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroStatusCard
              label="Beteiligungsstand"
              value={space.publicSummary.headline}
              detail="Öffentlich sichtbarer Zwischenstand"
            />
            <HeroStatusCard
              label="Letzte Aktualisierung"
              value={formatPublicTimestamp(space.publicSummary.lastUpdatedAt)}
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
            {space.publicSummary.headline}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {space.publicSummary.shortSummary}
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <SummaryMetricCard label="Offene Fragen" value={space.publicSummary.openQuestionCount} />
            <SummaryMetricCard label="Nächste Schritte" value={space.publicSummary.nextStepCount} />
            <SummaryMetricCard
              label="Minderheitenpositionen"
              value={space.publicSummary.minorityPositionCount}
            />
            <SummaryMetricCard
              label="Letzte Aktualisierung"
              value={formatPublicTimestamp(space.publicSummary.lastUpdatedAt)}
              valueClassName="text-base sm:text-lg"
            />
          </dl>
        </article>

        <aside className="rounded-[1.75rem] border border-sky-500/15 bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Trust & Guardrails
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {viewModel.safetyBadges.map((badge) => (
              <article
                key={badge.title}
                className="rounded-2xl border border-sky-500/15 bg-[color-mix(in_oklab,rgb(var(--card))_84%,rgb(var(--bg))_16%)] p-4"
              >
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{badge.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  {badge.detail}
                </p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      {viewModel.canShowFeedbackDetails ? (
        <section className="rounded-[1.75rem] border border-sky-500/15 bg-[linear-gradient(180deg,rgba(14,165,233,0.08),rgba(15,23,42,0.01)),rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Öffentliche Rückmeldung
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
            {feedback.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {feedback.summary}
          </p>
          {feedback.topicSummaries.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {feedback.topicSummaries.map((item) => (
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
              Aktuell sind keine thematischen Zusammenfassungen veröffentlicht.
            </p>
          )}
        </section>
      ) : viewModel.feedbackPreparationNotice ? (
        <section className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Rückmeldung in Vorbereitung
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {viewModel.feedbackPreparationNotice}
          </p>
        </section>
      ) : viewModel.feedbackUnavailableNotice ? (
        <section className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Noch keine öffentliche Rückmeldung
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {viewModel.feedbackUnavailableNotice}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        {viewModel.canShowOpenQuestions ? (
          <article className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
              Offene Fragen
            </p>
            {feedback.openQuestions.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {feedback.openQuestions.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm leading-6 text-[rgb(var(--fg))]"
                  >
                    {item.question}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
                {viewModel.noPublicOpenQuestionsNotice}
              </p>
            )}
          </article>
        ) : null}
        <article className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Ortsbezug
          </p>
          {viewModel.canShowPlace && viewModel.publicPlace ? (
            <div className="mt-3 space-y-3">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
                {viewModel.publicPlace.label}
              </h2>
              <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                {viewModel.publicPlace.description}
              </p>
              <p className="inline-flex w-fit rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                Anzeigeform: {getParticipationPlaceDisplayModeLabel(viewModel.publicPlace.displayMode)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              {viewModel.noPublicPlaceNotice}
            </p>
          )}
        </article>
      </section>

      {viewModel.canShowMinorityPositions ? (
        <section className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Minderheitenpositionen bleiben sichtbar
          </p>
          {feedback.minorityPositions.length > 0 ? (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {feedback.minorityPositions.map((item) => (
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
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              {viewModel.noPublicMinorityPositionsNotice}
            </p>
          )}
        </section>
      ) : null}

      {viewModel.canShowNextSteps ? (
        <section className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Nächste Schritte
          </p>
          {feedback.nextSteps.length > 0 ? (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {feedback.nextSteps.map((item) => (
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
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              {viewModel.noPublicNextStepsNotice}
            </p>
          )}
          <p className="mt-4 text-xs text-[rgb(var(--muted))]">
            Rückmeldungen bleiben Einordnungen und nächste Arbeitsschritte, keine Zustimmung oder
            politische Lösung.
          </p>
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
